import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Stop} from 'react-native-svg';
import {useTheme} from '../lib/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  strokeWidth?: number;
  /** 0..1, fraction of time remaining */
  progress: number;
  children?: React.ReactNode;
}

export default function CountdownRing({
  size = 280,
  strokeWidth = 3,
  progress,
  children,
}: Props) {
  const {theme} = useTheme();
  const c = theme.colors;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0.5)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false, // strokeDashoffset can't use native driver
    }).start();
  }, [progress, animatedProgress]);

  useEffect(() => {
    const rot = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0.5,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const waves = Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: 3600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    rot.start();
    pulse.start();
    waves.start();
    return () => {
      rot.stop();
      pulse.stop();
      waves.stop();
    };
  }, [rotation, halo, wave]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveRing = (offset: number) => {
    // Two rings sharing one clock, half a cycle apart.
    const v =
      offset === 0
        ? wave
        : wave.interpolate({
            inputRange: [0, 1 - offset, 1 - offset + 0.0001, 1],
            outputRange: [offset, 1, 0, offset],
          });
    return (
      <Animated.View
        style={[
          styles.wave,
          {
            width: size * 0.92,
            height: size * 0.92,
            borderRadius: (size * 0.92) / 2,
            borderColor: c.accent,
            opacity: v.interpolate({inputRange: [0, 1], outputRange: [0.35, 0]}),
            transform: [{scale: v.interpolate({inputRange: [0, 1], outputRange: [1, 1.18]})}],
          },
        ]}
      />
    );
  };

  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      {waveRing(0)}
      {waveRing(0.5)}
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 0.9,
            height: size * 0.9,
            borderRadius: (size * 0.9) / 2,
            backgroundColor: c.accent,
            opacity: halo.interpolate({inputRange: [0.5, 1], outputRange: [0.06, 0.14]}),
            transform: [{scale: halo.interpolate({inputRange: [0.5, 1], outputRange: [0.97, 1.03]})}],
          },
        ]}
      />
      <Svg
        width={size}
        height={size}
        style={{position: 'absolute', transform: [{rotate: '-90deg'}]}}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.accent} />
            <Stop offset="1" stopColor={c.accentDeep} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={c.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
        />
      </Svg>
      {/* A spark orbiting the track */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {transform: [{rotate: spin}]}]}>
        <View
          style={[
            styles.spark,
            {left: size / 2 - 5, top: strokeWidth / 2 - 5, backgroundColor: c.accent, shadowColor: c.accent},
          ]}
        />
        <View
          style={[
            styles.sparkGlow,
            {left: size / 2 - 11, top: strokeWidth / 2 - 11, backgroundColor: c.accent},
          ]}
        />
      </Animated.View>
      <View style={styles.centerContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {position: 'absolute'},
  wave: {position: 'absolute', borderWidth: 1.5},
  spark: {position: 'absolute', width: 10, height: 10, borderRadius: 5},
  sparkGlow: {position: 'absolute', width: 22, height: 22, borderRadius: 11, opacity: 0.25},
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
