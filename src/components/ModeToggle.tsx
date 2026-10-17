import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme} from '../theme';

type Mode = 'silent' | 'dnd';

function BellOffIcon({color}: {color: string}) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}

function MoonIcon({color}: {color: string}) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"
      />
    </Svg>
  );
}

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/** Two-way switch; the gradient pill springs across to the chosen side. */
export default function ModeToggle({mode, onChange}: Props) {
  const {theme} = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(makeStyles);
  const [tabW, setTabW] = useState(0);
  const pos = useRef(new Animated.Value(mode === 'silent' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: mode === 'silent' ? 0 : 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [mode, pos]);

  const tabs: {key: Mode; label: string; icon: (color: string) => React.ReactNode}[] = [
    {key: 'silent', label: 'SILENT', icon: col => <BellOffIcon color={col} />},
    {key: 'dnd', label: 'DND', icon: col => <MoonIcon color={col} />},
  ];

  return (
    <View
      style={styles.wrap}
      onLayout={e => setTabW((e.nativeEvent.layout.width - 10) / 2)}>
      {tabW > 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              width: tabW,
              transform: [
                {translateX: pos.interpolate({inputRange: [0, 1], outputRange: [0, tabW]})},
                {
                  scaleX: pos.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.12, 1],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={theme.gradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
      {tabs.map(t => {
        const selected = mode === t.key;
        const color = selected ? c.onAccent : c.textLo;
        return (
          <Pressable key={t.key} style={styles.tab} onPress={() => onChange(t.key)}>
            {t.icon(color)}
            <Text style={[styles.tabLabel, {color}]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      width: '85%',
      height: 54,
      borderRadius: 27,
      backgroundColor: t.colors.surface,
      borderWidth: 1,
      borderColor: t.colors.surface2,
      padding: 4,
    },
    pill: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 23,
      overflow: 'hidden',
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    tabLabel: {
      fontSize: 12,
      letterSpacing: 3,
      fontWeight: '500',
    },
  });
