import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../lib/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

/**
 * Accent-gradient call-to-action: breathes gently while idle, a light band
 * sweeps across it every few seconds, and it squashes on press.
 */
export default function GlowButton({label, onPress, disabled, style, height = 62}: Props) {
  const {theme} = useTheme();
  const c = theme.colors;
  const breathe = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (disabled) return;
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const s = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sweep, {toValue: 0, duration: 0, useNativeDriver: true}),
      ]),
    );
    b.start();
    s.start();
    return () => {
      b.stop();
      s.stop();
    };
  }, [disabled, breathe, sweep]);

  const pressTo = (v: number) =>
    Animated.spring(press, {toValue: v, friction: 4, tension: 160, useNativeDriver: true}).start();

  const scale = Animated.multiply(
    press,
    breathe.interpolate({inputRange: [0, 1], outputRange: [1, 1.025]}),
  );

  return (
    <Animated.View
      style={[styles.outer, style, {transform: [{scale}]}]}
      onLayout={e => setW(e.nativeEvent.layout.width)}>
      <Pressable
        style={[styles.btn, {height, borderRadius: height / 3, backgroundColor: c.surface}]}
        disabled={disabled}
        onPressIn={() => pressTo(0.94)}
        onPressOut={() => pressTo(1)}
        onPress={onPress}>
        {!disabled && (
          <LinearGradient
            colors={theme.gradient}
            style={StyleSheet.absoluteFill}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
        )}
        {!disabled && w > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sweep,
              {
                transform: [
                  {
                    translateX: sweep.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-80, w + 80],
                    }),
                  },
                  {rotate: '20deg'},
                ],
              },
            ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              start={{x: 0, y: 0.5}}
              end={{x: 1, y: 0.5}}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View style={styles.labelWrap}>
          <Text style={[styles.label, {color: disabled ? c.textDim : c.onAccent}]}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {width: '92%', borderRadius: 22},
  btn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sweep: {position: 'absolute', top: -30, bottom: -30, left: 0, width: 60},
  labelWrap: {alignItems: 'center', justifyContent: 'center'},
  label: {fontSize: 13, letterSpacing: 4, fontWeight: '600'},
});
