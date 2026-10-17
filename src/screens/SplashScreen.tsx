import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  RadialGradient,
  Stop,
  LinearGradient as SvgGradient,
} from 'react-native-svg';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha} from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const BELL_PATH =
  'M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z';

const STAGE = 220;
const RING_R = 96;
const RING_C = 2 * Math.PI * RING_R;
const BUBBLE = 96;
const SLASH_LEN = Math.hypot(44, 44);

const TITLE = 'GO SILENT';

/**
 * The app's story in ~1.7s: a bell rings with sound waves, a slash cuts the
 * sound, the waves die away, a countdown ring draws itself around the bell,
 * and the name types in letter by letter.
 */
export default function SplashScreen() {
  const {theme} = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(makeStyles);

  const bubble = useRef(new Animated.Value(0)).current; // pop in
  const ring = useRef(new Animated.Value(0)).current; // bell shake (0..1 loop)
  const waves = useRef(new Animated.Value(0)).current; // waves travelling out
  const wavesAlpha = useRef(new Animated.Value(1)).current; // waves dying away
  const slash = useRef(new Animated.Value(0)).current; // slash drawing
  const countdown = useRef(new Animated.Value(0)).current; // ring drawing
  const ticks = useRef(new Animated.Value(0)).current; // tick ring spin
  const glow = useRef(new Animated.Value(0)).current;
  const letters = useRef(TITLE.split('').map(() => new Animated.Value(0))).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const by = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(ticks, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const waveLoop = Animated.loop(
      Animated.timing(waves, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {toValue: 1, duration: 60, useNativeDriver: true}),
        Animated.timing(ring, {toValue: -1, duration: 90, useNativeDriver: true}),
        Animated.timing(ring, {toValue: 0, duration: 60, useNativeDriver: true}),
      ]),
    );
    spin.start();
    waveLoop.start();
    shake.start();

    // 1. bell pops in, ringing
    Animated.spring(bubble, {toValue: 1, friction: 5, tension: 70, useNativeDriver: true}).start();
    Animated.timing(glow, {toValue: 1, duration: 900, useNativeDriver: true}).start();

    // 2. the slash cuts the sound; ringing stops and the waves fade
    const t1 = setTimeout(() => {
      shake.stop();
      Animated.spring(ring, {toValue: 0, friction: 4, useNativeDriver: true}).start();
      Animated.timing(slash, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(wavesAlpha, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }).start(() => waveLoop.stop());
    }, 520);

    // 3. the countdown ring draws round, the name types in
    const t2 = setTimeout(() => {
      Animated.timing(countdown, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.stagger(
        45,
        letters.map(v =>
          Animated.spring(v, {toValue: 1, friction: 6, tension: 90, useNativeDriver: true}),
        ),
      ).start();
    }, 760);

    const t3 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(tagline, {toValue: 1, duration: 260, useNativeDriver: true}),
        Animated.timing(by, {toValue: 1, duration: 260, useNativeDriver: true}),
      ]).start();
    }, 1150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      spin.stop();
      waveLoop.stop();
      shake.stop();
    };
  }, [bubble, ring, waves, wavesAlpha, slash, countdown, ticks, glow, letters, tagline, by]);

  const tickSpin = ticks.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  // Three arcs each side, staggered along one clock so they ripple outward.
  const wave = (i: number, side: 1 | -1) => {
    const phase = Animated.modulo(Animated.add(waves, i / 3), 1);
    return (
      <Animated.View
        key={`${side}${i}`}
        style={[
          styles.wave,
          {
            opacity: Animated.multiply(
              wavesAlpha,
              phase.interpolate({inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0]}),
            ),
            transform: [
              {translateX: phase.interpolate({inputRange: [0, 1], outputRange: [0, side * 46]})},
              {scale: phase.interpolate({inputRange: [0, 1], outputRange: [0.7, 1.25]})},
            ],
          },
        ]}>
        <Svg width={30} height={60} viewBox="0 0 30 60">
          <Path
            d={side === 1 ? 'M8,8 Q26,30 8,52' : 'M22,8 Q4,30 22,52'}
            stroke={c.accent}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {/* soft glow */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glow,
              transform: [{scale: glow.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]})}],
            },
          ]}>
          <Svg width={STAGE * 1.6} height={STAGE * 1.6}>
            <Defs>
              <RadialGradient id="splashGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={c.accent} stopOpacity={0.35} />
                <Stop offset="0.55" stopColor={c.accent} stopOpacity={0.08} />
                <Stop offset="1" stopColor={c.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={STAGE * 0.8} cy={STAGE * 0.8} r={STAGE * 0.8} fill="url(#splashGlow)" />
          </Svg>
        </Animated.View>

        {/* slowly spinning minute ticks */}
        <Animated.View style={[styles.abs, {transform: [{rotate: tickSpin}]}]}>
          <Svg width={STAGE} height={STAGE}>
            {Array.from({length: 60}).map((_, i) => {
              const a = (i / 60) * 2 * Math.PI;
              const r1 = STAGE / 2 - 2;
              const r2 = STAGE / 2 - (i % 5 === 0 ? 9 : 5);
              return (
                <Line
                  key={i}
                  x1={STAGE / 2 + Math.cos(a) * r1}
                  y1={STAGE / 2 + Math.sin(a) * r1}
                  x2={STAGE / 2 + Math.cos(a) * r2}
                  y2={STAGE / 2 + Math.sin(a) * r2}
                  stroke={i % 5 === 0 ? c.accent : c.textDim}
                  strokeWidth={i % 5 === 0 ? 2 : 1}
                  strokeLinecap="round"
                  opacity={i % 5 === 0 ? 0.7 : 0.5}
                />
              );
            })}
          </Svg>
        </Animated.View>

        {/* countdown ring drawing itself */}
        <Svg width={STAGE} height={STAGE} style={[styles.abs, {transform: [{rotate: '-90deg'}]}]}>
          <Defs>
            <SvgGradient id="splashRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={c.accent} />
              <Stop offset="1" stopColor={c.accentDeep} />
            </SvgGradient>
          </Defs>
          <Circle
            cx={STAGE / 2}
            cy={STAGE / 2}
            r={RING_R}
            stroke={c.surface2}
            strokeWidth={3}
            fill="none"
          />
          <AnimatedCircle
            cx={STAGE / 2}
            cy={STAGE / 2}
            r={RING_R}
            stroke="url(#splashRing)"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={RING_C}
            strokeDashoffset={countdown.interpolate({
              inputRange: [0, 1],
              outputRange: [RING_C, RING_C * 0.25],
            })}
          />
        </Svg>

        {/* sound waves */}
        {[0, 1, 2].map(i => wave(i, 1))}
        {[0, 1, 2].map(i => wave(i, -1))}

        {/* bell bubble */}
        <Animated.View
          style={[
            styles.bubble,
            {
              transform: [
                {scale: bubble},
                {rotate: ring.interpolate({inputRange: [-1, 1], outputRange: ['-14deg', '14deg']})},
              ],
            },
          ]}>
          <LinearGradient
            colors={theme.gradient}
            style={StyleSheet.absoluteFill}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
          <Svg width={46} height={46} viewBox="0 0 24 24">
            <Path fill={c.onAccent} d={BELL_PATH} />
          </Svg>
          {/* the slash: a cut-out line in the gradient, then the stroke */}
          <Svg width={BUBBLE} height={BUBBLE} style={styles.abs}>
            <AnimatedLine
              x1={26}
              y1={26}
              x2={70}
              y2={70}
              stroke={theme.colors.accent}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={SLASH_LEN}
              strokeDashoffset={slash.interpolate({inputRange: [0, 1], outputRange: [SLASH_LEN, 0]})}
            />
            <AnimatedLine
              x1={26}
              y1={26}
              x2={70}
              y2={70}
              stroke={c.onAccent}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={SLASH_LEN}
              strokeDashoffset={slash.interpolate({inputRange: [0, 1], outputRange: [SLASH_LEN, 0]})}
            />
          </Svg>
        </Animated.View>
      </View>

      {/* title, letter by letter */}
      <View style={styles.titleRow}>
        {TITLE.split('').map((ch, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.title,
              {
                opacity: letters[i],
                transform: [
                  {translateY: letters[i].interpolate({inputRange: [0, 1], outputRange: [18, 0]})},
                  {scale: letters[i].interpolate({inputRange: [0, 1], outputRange: [0.6, 1]})},
                ],
              },
            ]}>
            {ch === ' ' ? ' ' : ch}
          </Animated.Text>
        ))}
      </View>

      <Animated.View
        style={[
          styles.divider,
          {opacity: tagline, transform: [{scaleX: tagline}]},
        ]}
      />
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: tagline,
            transform: [{translateY: tagline.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}],
          },
        ]}>
        QUIET, ON A TIMER
      </Animated.Text>

      <Animated.View style={[styles.byRow, {opacity: by}]}>
        <Text style={styles.byLabel}>BY</Text>
        <Text style={styles.byValue}>MPS</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
    wrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    stage: {width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center'},
    abs: {position: 'absolute', left: 0, top: 0},
    glow: {
      position: 'absolute',
      width: STAGE * 1.6,
      height: STAGE * 1.6,
      left: -STAGE * 0.3,
      top: -STAGE * 0.3,
    },
    wave: {position: 'absolute', width: 30, height: 60},
    bubble: {
      width: BUBBLE,
      height: BUBBLE,
      borderRadius: BUBBLE / 2,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: alpha(c.textHi, 0.08),
    },
    titleRow: {flexDirection: 'row', marginTop: 40},
    title: {
      color: c.textHi,
      fontSize: 32,
      fontWeight: '300',
      marginHorizontal: 5,
    },
    divider: {
      marginTop: 14,
      height: 1,
      width: 110,
      backgroundColor: c.accent,
    },
    subtitle: {
      marginTop: 14,
      color: c.textLo,
      fontSize: 10,
      letterSpacing: 4,
    },
    byRow: {marginTop: 52, flexDirection: 'row', alignItems: 'center', gap: 8},
    byLabel: {color: c.textDim, fontSize: 10, letterSpacing: 3},
    byValue: {color: c.accent, fontSize: 14, fontWeight: '500', letterSpacing: 6},
  });
};
