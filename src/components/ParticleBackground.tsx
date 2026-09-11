import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Dimensions, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import {colors} from '../theme';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const PARTICLE_COUNT = 18;

interface Spec {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  rise: number;
  duration: number;
  delay: number;
}

function Particle({spec}: {spec: Spec}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, spec.delay, spec.duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -spec.rise],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, spec.maxOpacity, spec.maxOpacity, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: spec.x,
        top: spec.y,
        width: spec.size,
        height: spec.size,
        borderRadius: spec.size / 2,
        backgroundColor: colors.amber,
        opacity,
        transform: [{translateY}],
      }}
    />
  );
}

export default function ParticleBackground() {
  const particles = useMemo<Spec[]>(
    () =>
      Array.from({length: PARTICLE_COUNT}, () => ({
        x: Math.random() * SCREEN_W,
        y: Math.random() * SCREEN_H,
        size: Math.random() * 3 + 2,
        maxOpacity: Math.random() * 0.3 + 0.2,
        rise: Math.random() * 120 + 90,
        duration: Math.random() * 6000 + 7000,
        delay: Math.random() * 4000,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow1" cx="20%" cy="15%" r="60%">
            <Stop offset="0" stopColor={colors.amber} stopOpacity={0.08} />
            <Stop offset="1" stopColor={colors.amber} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow2" cx="85%" cy="85%" r="60%">
            <Stop offset="0" stopColor={colors.amberDeep} stopOpacity={0.08} />
            <Stop offset="1" stopColor={colors.amberDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="20%" cy="15%" r="45%" fill="url(#glow1)" />
        <Circle cx="85%" cy="85%" r="45%" fill="url(#glow2)" />
      </Svg>
      {particles.map((spec, i) => (
        <Particle key={i} spec={spec} />
      ))}
    </View>
  );
}
