import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Path} from 'react-native-svg';
import FadeIn from '../components/FadeIn';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha, themes} from '../theme';

function BackIcon({color}: {color: string}) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 18l-6-6 6-6"
      />
    </Svg>
  );
}

function CheckIcon({color}: {color: string}) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path
        d="M5 12l5 5 9-12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** A miniature of the timer screen drawn in the card's own palette. */
function ThemeCard({item, selected, onPress}: {item: Theme; selected: boolean; onPress: () => void}) {
  const styles = useThemedStyles(makeStyles);
  const c = item.colors;
  const pop = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: selected ? 1 : 0,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [selected, pop]);

  const springPress = (v: number) =>
    Animated.spring(press, {toValue: v, friction: 5, tension: 200, useNativeDriver: true}).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => springPress(0.95)}
      onPressOut={() => springPress(1)}
      style={styles.cardPress}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: c.bg,
            borderColor: selected ? c.accent : c.surface2,
            transform: [
              {scale: Animated.multiply(press, pop.interpolate({inputRange: [0, 1], outputRange: [1, 1.03]}))},
            ],
          },
        ]}>
        <View style={[styles.cardGlow, {backgroundColor: alpha(c.accent, 0.12)}]} />
        <Svg width={84} height={84} style={styles.cardRing}>
          <Circle cx={42} cy={42} r={36} stroke={c.surface2} strokeWidth={4} fill="none" />
          <Circle
            cx={42}
            cy={42}
            r={36}
            stroke={c.accent}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 36 * 0.68} ${2 * Math.PI * 36}`}
            transform="rotate(-90 42 42)"
          />
        </Svg>
        <Text style={[styles.cardTime, {color: c.accent}]}>25:00</Text>
        <View style={styles.cardBar}>
          <LinearGradient
            colors={item.gradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <Text style={[styles.cardName, {color: c.textHi}]}>{item.name.toUpperCase()}</Text>
        <Text style={[styles.cardKind, {color: c.textLo}]}>{item.dark ? 'DARK' : 'LIGHT'}</Text>

        <Animated.View
          style={[
            styles.check,
            {
              backgroundColor: c.accent,
              opacity: pop,
              transform: [{scale: pop}],
            },
          ]}>
          <CheckIcon color={c.onAccent} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function ThemeScreen({onBack}: {onBack: () => void}) {
  const {theme, setThemeId} = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
        <BackIcon color={theme.colors.textHi} />
        <Text style={styles.backLabel}>BACK</Text>
      </Pressable>

      <FadeIn from={-12}>
        <Text style={styles.title}>THEMES</Text>
        <Text style={styles.subtitle}>PICK A MOOD FOR YOUR SILENCE</Text>
        <View style={styles.divider} />
      </FadeIn>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {themes.map((t, i) => (
          <FadeIn key={t.id} delay={80 + i * 70} from={30} scaleFrom={0.85} style={styles.cardSlot}>
            <ThemeCard item={t} selected={t.id === theme.id} onPress={() => setThemeId(t.id)} />
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
    wrap: {flex: 1, paddingHorizontal: 22, paddingTop: 36},
    backBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start'},
    backLabel: {color: c.textHi, fontSize: 11, letterSpacing: 3},
    title: {
      marginTop: 24,
      color: c.textHi,
      fontSize: 24,
      fontWeight: '300',
      letterSpacing: 8,
      textAlign: 'center',
    },
    subtitle: {marginTop: 8, color: c.textLo, fontSize: 9, letterSpacing: 3, textAlign: 'center'},
    divider: {
      marginTop: 12,
      height: 1,
      width: 90,
      alignSelf: 'center',
      backgroundColor: c.accent,
      opacity: 0.5,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingTop: 24,
      paddingBottom: 32,
    },
    cardSlot: {width: '48%', marginBottom: 14},
    cardPress: {width: '100%'},
    card: {
      width: '100%',
      borderRadius: 20,
      borderWidth: 1.5,
      alignItems: 'center',
      paddingVertical: 18,
      overflow: 'hidden',
    },
    cardGlow: {position: 'absolute', top: -40, width: 160, height: 160, borderRadius: 80},
    cardRing: {},
    cardTime: {
      position: 'absolute',
      top: 18 + 32,
      fontSize: 15,
      fontWeight: '300',
      fontVariant: ['tabular-nums'],
    },
    cardBar: {marginTop: 14, width: '70%', height: 14, borderRadius: 7, overflow: 'hidden'},
    cardName: {marginTop: 12, fontSize: 12, letterSpacing: 3, fontWeight: '500'},
    cardKind: {marginTop: 2, fontSize: 8, letterSpacing: 2},
    check: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
