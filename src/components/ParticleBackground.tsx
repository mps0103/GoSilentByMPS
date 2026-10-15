import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Dimensions, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import {useTheme} from '../lib/ThemeContext';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const PARTICLE_COUNT = 24;

interface Spec {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  rise: number;
  sway: number;
  duration: number;
  delay: number;
  deep: boolean;
}

function Particle({spec, color}: {spec: Spec; color: string}) {
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

  // Drifts side to side like an ember on warm air.
  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, spec.sway, 0, -spec.sway, 0],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, spec.maxOpacity, spec.maxOpacity, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.2, 0.6],
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
        backgroundColor: color,
        opacity,
        transform: [{translateX}, {translateY}, {scale}],
      }}
    />
  );
}

/** A big soft blob of color that slowly wanders, for depth behind everything. */
function Glow({
  id,
  color,
  x,
  y,
  duration,
}: {
  id: string;
  color: string;
  x: number;
  y: number;
  duration: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const size = SCREEN_W * 1.1;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: t.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]}),
        transform: [
          {translateX: t.interpolate({inputRange: [0, 1], outputRange: [-30, 30]})},
          {translateY: t.interpolate({inputRange: [0, 1], outputRange: [20, -20]})},
          {scale: t.interpolate({inputRange: [0, 1], outputRange: [0.9, 1.1]})},
        ],
      }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.13} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export default function ParticleBackground() {
  const {theme} = useTheme();
  const c = theme.colors;
  const particles = useMemo<Spec[]>(
    () =>
      Array.from({length: PARTICLE_COUNT}, (_, i) => ({
        x: Math.random() * SCREEN_W,
        y: Math.random() * SCREEN_H,
        size: Math.random() * 3 + 2,
        maxOpacity: Math.random() * 0.3 + 0.2,
        rise: Math.random() * 140 + 90,
        sway: Math.random() * 18 + 6,
        duration: Math.random() * 6000 + 7000,
        delay: Math.random() * 4000,
        deep: i % 3 === 0,
      })),
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Glow id="g1" color={c.accent} x={SCREEN_W * 0.2} y={SCREEN_H * 0.15} duration={7000} />
      <Glow id="g2" color={c.accentDeep} x={SCREEN_W * 0.85} y={SCREEN_H * 0.85} duration={9000} />
      {particles.map((spec, i) => (
        <Particle key={i} spec={spec} color={spec.deep ? c.accentDeep : c.accent} />
      ))}
    </View>
  );
}
