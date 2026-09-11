import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {colors, gradients} from '../theme';

function BellOffIcon({size = 36, color = colors.bg}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}

export default function SplashScreen() {
  const ringRot = useRef(new Animated.Value(0)).current;
  const ring2Rot = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleOffset = useRef(new Animated.Value(20)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const byOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(ringRot, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const loop2 = Animated.loop(
      Animated.timing(ring2Rot, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop1.start();
    loop2.start();

    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(titleOffset, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(80),
      Animated.timing(subOpacity, {toValue: 1, duration: 180, useNativeDriver: true}),
      Animated.delay(90),
      Animated.timing(byOpacity, {toValue: 1, duration: 220, useNativeDriver: true}),
    ]).start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [ringRot, ring2Rot, logoScale, titleOpacity, titleOffset, subOpacity, byOpacity]);

  const spin1 = ringRot.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const spin2 = ring2Rot.interpolate({inputRange: [0, 1], outputRange: ['360deg', '0deg']});

  return (
    <View style={styles.wrap}>
      <View style={styles.ringArea}>
        <View style={styles.halo} />
        <Animated.View style={[styles.dashRing, {transform: [{rotate: spin1}]}]}>
          <Svg width={160} height={160} viewBox="0 0 160 160">
            {Array.from({length: 24}).map((_, i) => {
              const angle = (i / 24) * 2 * Math.PI;
              const r1 = 70;
              const r2 = 76;
              const x1 = 80 + Math.cos(angle) * r1;
              const y1 = 80 + Math.sin(angle) * r1;
              const x2 = 80 + Math.cos(angle) * r2;
              const y2 = 80 + Math.sin(angle) * r2;
              return (
                <Path
                  key={i}
                  d={`M${x1},${y1} L${x2},${y2}`}
                  stroke={colors.amber}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={i % 2 === 0 ? 0.9 : 0.25}
                />
              );
            })}
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.innerRing, {transform: [{rotate: spin2}]}]}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Path
              d="M60,5 A55,55 0 1,1 59.9,5"
              stroke={colors.amberDeep}
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
            />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.logoBubble, {transform: [{scale: logoScale}]}]}>
          <LinearGradient
            colors={gradients.amber as unknown as string[]}
            style={styles.logoGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <BellOffIcon />
          </LinearGradient>
        </Animated.View>
      </View>

      <Animated.Text
        style={[
          styles.title,
          {opacity: titleOpacity, transform: [{translateY: titleOffset}]},
        ]}>
        GO SILENT
      </Animated.Text>

      <Animated.View style={[styles.divider, {opacity: subOpacity}]} />

      <Animated.Text style={[styles.subtitle, {opacity: subOpacity}]}>
        QUIET, ON A TIMER
      </Animated.Text>

      <Animated.View style={[styles.byRow, {opacity: byOpacity}]}>
        <Text style={styles.byLabel}>BY</Text>
        <Text style={styles.byValue}>MPS</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  ringArea: {width: 180, height: 180, alignItems: 'center', justifyContent: 'center'},
  halo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.amber,
    opacity: 0.15,
  },
  dashRing: {position: 'absolute'},
  innerRing: {position: 'absolute'},
  logoBubble: {position: 'absolute', width: 82, height: 82, borderRadius: 41, overflow: 'hidden'},
  logoGradient: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {
    marginTop: 40,
    color: colors.textHi,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 10,
  },
  divider: {
    marginTop: 14,
    height: 1,
    width: 110,
    backgroundColor: colors.amber,
  },
  subtitle: {
    marginTop: 14,
    color: colors.textLo,
    fontSize: 10,
    letterSpacing: 4,
  },
  byRow: {marginTop: 52, flexDirection: 'row', alignItems: 'center', gap: 8},
  byLabel: {color: colors.textDim, fontSize: 10, letterSpacing: 3},
  byValue: {color: colors.amber, fontSize: 14, fontWeight: '500', letterSpacing: 6},
});
