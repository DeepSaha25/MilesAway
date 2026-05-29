import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  DimensionValue,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export interface ShimmerPlaceholderProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const ShimmerPlaceholder = ({
  width,
  height,
  borderRadius = 12,
  style,
}: ShimmerPlaceholderProps) => {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const shimmerProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerProgress, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerProgress]);

  const opacity = shimmerProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const translateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      -Math.max(measuredWidth, 1),
      Math.max(measuredWidth, 1) * 1.8,
    ],
  });

  const shimmerStyle = {
    opacity,
    transform: [
      {
        translateX,
      },
      {
        rotate: '14deg',
      },
    ],
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setMeasuredWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.sheen, shimmerStyle, {borderRadius}]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: '#E1E9EE',
  },
  sheen: {
    bottom: -16,
    left: 0,
    position: 'absolute',
    top: -16,
    width: '45%',
    backgroundColor: '#F2F8FB',
  },
});

export default ShimmerPlaceholder;
