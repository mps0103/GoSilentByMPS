import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {colors, gradients} from '../theme';

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

function Tab({
  selected,
  label,
  icon,
  onPress,
}: {
  selected: boolean;
  label: string;
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selected, anim]);

  const textColor = selected ? colors.bg : colors.textLo;

  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Animated.View style={[StyleSheet.absoluteFill, {opacity: anim}]}>
        <LinearGradient
          colors={gradients.amber as unknown as string[]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.tabFill}
        />
      </Animated.View>
      <View style={styles.tabContent}>
        {icon(textColor)}
        <Text style={[styles.tabLabel, {color: textColor}]}>{label}</Text>
      </View>
    </Pressable>
  );
}

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export default function ModeToggle({mode, onChange}: Props) {
  return (
    <View style={styles.wrap}>
      <Tab
        selected={mode === 'silent'}
        label="SILENT"
        icon={c => <BellOffIcon color={c} />}
        onPress={() => onChange('silent')}
      />
      <Tab
        selected={mode === 'dnd'}
        label="DND"
        icon={c => <MoonIcon color={c} />}
        onPress={() => onChange('dnd')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    width: '85%',
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface2,
    padding: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabFill: {
    flex: 1,
    borderRadius: 23,
  },
  tabContent: {
    ...StyleSheet.absoluteFillObject,
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
