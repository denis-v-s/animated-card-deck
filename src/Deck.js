import React from 'react';
import {
  LayoutAnimation,
  UIManager,
  View,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPEOUT_DURATION = 250;

class Deck extends React.Component {
  state = {
    index: 0
  }

  static defaultProps = {
    onSwipeRight: () => { },
    onSwipeLeft: () => { }
  }

  constructor(props) {
    super(props);
    this.position = new Animated.ValueXY();
    this.panResponder = PanResponder.create({
      // fires any time the screen is touched
      onStartShouldSetPanResponder: () => true,
      // called when the user starts to drag the finger on the screen
      onPanResponderMove: (event, gesture) => {
        this.position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      // called when the user lifts the finger
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentWillUpdate() {
    // android fix
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true)

    LayoutAnimation.spring();
  }

  forceSwipe(direction) {
    const x = (direction === 'right') ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.position, {
      toValue: { x, y: 0 },
      duration: SWIPEOUT_DURATION
    }).start(() => this.onSwipeComplete(direction));
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight, data } = this.props;
    const item = data[this.state.index];

    (direction === 'right') ? onSwipeRight(item) : onSwipeLeft(item);
    this.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index + 1 });
  }

  resetPosition() {
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  renderCards() {
    return this.props.data.map((item, i) => {
      if (this.state.index >= this.props.data.length) {
        return this.props.renderNoMoreCards();
      }

      if (i < this.state.index) { return null; }

      if (i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            {...this.panResponder.panHandlers}
            style={[this.getCardStyle(), styles.cardStyle]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }

      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyle, { top: 5 * (i - this.state.index) }]}>
          {this.props.renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  getCardStyle() {
    // use interpolation to link x axis movement with rotation
    const rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 4, 0, SCREEN_WIDTH],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    }
  }

  render() {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    zIndex: 1
  }
}
export default Deck;

