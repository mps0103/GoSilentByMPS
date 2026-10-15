import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleProp, ViewStyle} from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  /** Starting vertical offset in px; negative slides down from above. */
  from?: number;
  /** Starting scale, for a subtle "pop" in. */
  scaleFrom?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Fades, slides and scales its children in once on mount. */
export default function FadeIn({
  children,
  delay = 0,
  from = 18,
  scaleFrom = 0.96,
  duration = 420,
  style,
}: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            {translateY: t.interpolate({inputRange: [0, 1], outputRange: [from, 0]})},
            {scale: t.interpolate({inputRange: [0, 1], outputRange: [scaleFrom, 1]})},
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
