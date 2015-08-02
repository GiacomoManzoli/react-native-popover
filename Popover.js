'use strict';

var React = require('react-native');
var {
  PropTypes,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  StyleSheetRegistry,
  Dimensions
} = React;

var noop = () => {};

var SCREEN_HEIGHT = Dimensions.get('window').height;
var SCREEN_WIDTH = Dimensions.get('window').width;

function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

var Popover = React.createClass({
  propTypes: {
    isVisible: PropTypes.bool,
    onClose: PropTypes.func,
  },
  getInitialState() {
    return {
      contentSize: {},
      popoverOrigin: {},
      arrowOrigin: {},
      placement: 'auto',
    };
  },
  getDefaultProps() {
    return {
      isVisible: false,
      displayArea: new Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT),
      placement: 'auto',
      onClose: noop,
    };
  },
  measureContent(x) {
    var {width, height} = x.nativeEvent.layout;
    var contentSize = {width: width, height: height};
    console.log(contentSize);
    var geom = this.computeGeometry({contentSize: contentSize});

    this.setState(Object.assign(geom, {contentSize: contentSize}));
    console.log(this.state);
    /*var {width, height} = x.nativeEvent.layout;
    var contentSize = {width: width, height: height};
    var geom = this.computeGeometry({contentSize: contentSize});

    var awaitingShowHandler = this.state.awaitingShowHandler;
    this.setState(Object.assign(geom,
      {contentSize: contentSize, awaitingShowHandler: undefined}), () => {
      // Once state is set, call the showHandler so it can access all the geometry
      // from the state
      awaitingShowHandler && awaitingShowHandler(this.transition);
    });*/
  },
  computeGeometry({contentSize, placement}) {
    placement = placement || this.props.placement;

    var options = {
      displayArea: this.props.displayArea,
      fromRect: this.props.fromRect,
      contentSize: contentSize,
    };

    switch (placement) {
      case 'top':
        return this.computeTopGeometry(options);
      case 'bottom':
        return this.computeBottomGeometry(options);
      case 'left':
        return this.computeLeftGeometry(options);
      case 'right':
        return this.computeRightGeometry(options);
      case 'vertical':
        return this.computeVerticalGeometry(options);
      default:
        return this.computeAutoGeometry(options);
    }
  },
  computeVerticalGeometry(options){
    var {displayArea, fromRect, contentSize} = options;


    //Do la priorità al disegnare il PopOver in basso.
    //Il PopOver sta sempre in basso a meno che non ci stia
    //--> contentSize.height+fromRect.y >= displayArea.height
    if (contentSize.height + fromRect.y < displayArea.height){
      return this.computeBottomGeometry(options);
    } else {
      return this.computeTopGeometry(options);
    }
  },

  computeTopGeometry({displayArea, fromRect, contentSize}) {
    //console.log(displayArea, fromRect,contentSize);
    var x0 = displayArea.x; //inizio dell'area in cui può comparire il popover
    var x1 = displayArea.x + displayArea.width - contentSize.width-5; //massima x che contiene il popover (considerando 5px di margine)
    var x2 = fromRect.x + (fromRect.width - contentSize.width) / 2; //x in modo che il popover sia centrato rispetto l'origine
    //console.log(x0,x1,x2);
    var popoverOrigin = new Point(
      Math.min(x1,Math.max(x0, x2)),
      fromRect.y - contentSize.height - 5);
    var arrowOrigin = new Point(fromRect.x - popoverOrigin.x + (fromRect.width - 10) / 2.0, contentSize.height);

    return {
      popoverOrigin: popoverOrigin,
      arrowOrigin: arrowOrigin,
      placement: 'top',
    };
  },
  computeBottomGeometry({displayArea, fromRect, contentSize}) {
    var popoverOrigin = new Point(
      Math.min(displayArea.x + displayArea.width - contentSize.width -5,
        Math.max(displayArea.x, fromRect.x + (fromRect.width - contentSize.width) / 2)),
      fromRect.y + fromRect.height + 5);
    var arrowOrigin = new Point(fromRect.x - popoverOrigin.x + (fromRect.width - 10) / 2.0, -10);

    return {
      popoverOrigin: popoverOrigin,
      arrowOrigin: arrowOrigin,
      placement: 'bottom',
    };
  },
  computeLeftGeometry({displayArea, fromRect, contentSize}) {
    var popoverOrigin = new Point(fromRect.x - contentSize.width - 5,
      Math.min(displayArea.y + displayArea.height - contentSize.height,
        Math.max(displayArea.y, fromRect.y + (fromRect.height - contentSize.height) / 2)));
    var arrowOrigin = new Point(contentSize.width, fromRect.y - popoverOrigin.y + (fromRect.height - 10) / 2.0);

    return {
      popoverOrigin: popoverOrigin,
      arrowOrigin: arrowOrigin,
      placement: 'left',
    };
  },
  computeRightGeometry({displayArea, fromRect, contentSize}) {
    var popoverOrigin = new Point(fromRect.x + fromRect.width + 5,
      Math.min(displayArea.y + displayArea.height - contentSize.height,
        Math.max(displayArea.y, fromRect.y + (fromRect.height - contentSize.height) / 2)));
    var arrowOrigin = new Point(-10, fromRect.y - popoverOrigin.y + (fromRect.height - 10) / 2.0);

    return {
      popoverOrigin: popoverOrigin,
      arrowOrigin: arrowOrigin,
      placement: 'right',
    };
  },
  computeAutoGeometry({displayArea, fromRect, contentSize}) {
    var placementsToTry = ['left', 'right', 'bottom', 'top'];

    var geom;
    for (var i = 0; i < placementsToTry.length; i++) {
      var placement = placementsToTry[i];
      geom = this.computeGeometry({contentSize: contentSize, placement: placement});
      var {popoverOrigin} = geom;

      if (popoverOrigin.x >= displayArea.x &&
        popoverOrigin.x <= displayArea.x + displayArea.width - contentSize.width &&
         popoverOrigin.y >= displayArea.y &&
         popoverOrigin.y <= displayArea.y + displayArea.height - contentSize.height) {
        break;
      }
    }

    return geom;
  },
  getArrowColorStyle(placement, color) {
    switch (placement) {
      case 'top':
        return { borderTopColor: color };
      case 'bottom':
        return { borderBottomColor: color };
      case 'left':
        return { borderLeftColor: color };
      case 'right':
        return { borderRightColor: color };
    }
  },
  componentWillReceiveProps(nextProps:any) {
    var willBeVisible = nextProps.isVisible;
    var {
      isVisible,
      customShowHandler,
      customHideHandler,
    } = this.props;
    //Se deve diventare visibile e non è visibile
    if (willBeVisible !== isVisible) {
      if (willBeVisible) {
        console.log('Will be visibile');

        // We want to call the showHandler only when contentSize is known
        // so that it can have logic depending on the geometry
        this.setState({contentSize: {}});
      }
    }
  },
  render() {
    var styles = this.props.style || DefaultStyles;

    if (!this.props.isVisible) {
        return <View />;
    }

    var {popoverOrigin, arrowOrigin, placement} = this.state;
    var arrowColor = StyleSheetRegistry.getStyleByID(styles.content).backgroundColor;
    var arrowColorStyle = this.getArrowColorStyle(placement, arrowColor);
    var contentSizeAvailable = this.state.contentSize.width > 0;

    return (
        <View style={[styles.container, contentSizeAvailable && styles.containerVisible ]}
          onPress={this.props.onClose}>
          <View style={[styles.background]}/>

          <TouchableWithoutFeedback onPress={this.props.onClose}>
            <View style={{flex:1}}/>
          </TouchableWithoutFeedback>

          <View style={[styles.popover, {
            top: popoverOrigin.y,
            left: popoverOrigin.x,
            }]}>
            <View style={[styles.arrow, arrowColorStyle, {
              top: arrowOrigin.y,
              left: arrowOrigin.x,
              }]}/>
            <View ref='content' onLayout={this.measureContent} style={styles.content}>
              {React.Children.map(this.props.children, React.addons.cloneWithProps)}
            </View>
          </View>
        </View>
    );
  }
});


var DefaultStyles = StyleSheet.create({
  container: {
    opacity: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  containerVisible: {
    opacity: 1,
  },
  background: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  popover: {
    backgroundColor: 'transparent',
    position: 'absolute',
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
    shadowOpacity: 0.8,
  },
  content: {
    //margin: 10,
    borderRadius: 3,
    padding: 6,
    backgroundColor: '#fff',
  },
  arrow: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderTopWidth: 5,
    borderTopColor: 'rgba(0,0,0,0)',
    borderRightWidth: 5,
    borderRightColor: 'rgba(0,0,0,0)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0)',
    borderLeftWidth: 5,
    borderLeftColor: 'rgba(0,0,0,0)',
  },
});

module.exports = Popover;
