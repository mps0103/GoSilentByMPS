import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useTheme} from '../lib/ThemeContext';

export default function PulseDot() {
  const {theme} = useTheme();
  const dotAlpha = useRef(new Animated.Value(0.3)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringAlpha = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAlpha, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotAlpha, {
          toValue: 0.3,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 2.4,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringAlpha, {
          toValue: 0,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    dotLoop.start();
    ringLoop.start();
    return () => {
      dotLoop.stop();
      ringLoop.stop();
      ringScale.setValue(0.8);
      ringAlpha.setValue(0.7);
    };
  }, [dotAlpha, ringScale, ringAlpha]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          {backgroundColor: theme.colors.accent},
          {opacity: ringAlpha, transform: [{scale: ringScale}]},
        ]}
      />
      <Animated.View
        style={[styles.dot, {opacity: dotAlpha, backgroundColor: theme.colors.accent}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {width: 8, height: 8, alignItems: 'center', justifyContent: 'center'},
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    position: 'absolute',
  },
  ring: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
});
