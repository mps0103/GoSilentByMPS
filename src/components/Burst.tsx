import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useTheme} from '../lib/ThemeContext';

const SPARKS = 16;

/**
 * Celebration behind the "Sound restored" icon: a ring of sparks flies out
 * once, then soft ripples keep pulsing outward.
 */
export default function Burst({size = 96}: {size?: number}) {
  const {theme} = useTheme();
  const c = theme.colors;
  const fly = useRef(new Animated.Value(0)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  const sparks = useMemo(
    () =>
      Array.from({length: SPARKS}, (_, i) => ({
        angle: (i / SPARKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
        dist: size * (0.9 + Math.random() * 0.7),
        dot: 4 + Math.random() * 5,
        deep: i % 2 === 1,
      })),
    [size],
  );

  useEffect(() => {
    Animated.timing(fly, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const rippleLoop = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {toValue: 0, duration: 0, useNativeDriver: true}),
        ]),
      );
    const r1 = rippleLoop(ripple1, 300);
    const r2 = rippleLoop(ripple2, 1500);
    r1.start();
    r2.start();
    return () => {
      r1.stop();
      r2.stop();
    };
  }, [fly, ripple1, ripple2]);

  const box = size * 4;

  const ripple = (v: Animated.Value) => (
    <Animated.View
      style={[
        styles.ripple,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: c.accent,
          opacity: v.interpolate({inputRange: [0, 1], outputRange: [0.6, 0]}),
          transform: [{scale: v.interpolate({inputRange: [0, 1], outputRange: [1, 2.6]})}],
        },
      ]}
    />
  );

  return (
    <View pointerEvents="none" style={[styles.wrap, {width: box, height: box}]}>
      {ripple(ripple1)}
      {ripple(ripple2)}
      {sparks.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: s.dot,
            height: s.dot,
            borderRadius: s.dot / 2,
            backgroundColor: s.deep ? c.accentDeep : c.accent,
            opacity: fly.interpolate({inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0]}),
            transform: [
              {
                translateX: fly.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos(s.angle) * s.dist],
                }),
              },
              {
                translateY: fly.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.sin(s.angle) * s.dist],
                }),
              },
              {scale: fly.interpolate({inputRange: [0, 0.3, 1], outputRange: [0.4, 1.3, 0.5]})},
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
  ripple: {position: 'absolute', borderWidth: 2},
});
