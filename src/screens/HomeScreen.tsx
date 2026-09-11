import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {colors, gradients} from '../theme';
import DialPicker from '../components/DialPicker';
import ModeToggle from '../components/ModeToggle';
import CountdownRing from '../components/CountdownRing';
import PulseDot from '../components/PulseDot';
import AdBanner from '../components/AdBanner';
import {formatTime} from '../lib/time';
import {
  Mode,
  SilenceEvent,
  cancelTimer,
  startTimer,
  subscribe,
} from '../native/SilenceTimer';

function StopIcon({color}: {color: string}) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path fill={color} d="M6 6h12v12H6z" />
    </Svg>
  );
}
function BellOffIcon({color, size = 11}: {color: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}
function VolumeIcon({color}: {color: string}) {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
      />
    </Svg>
  );
}

type Screen = 'picker' | 'timer' | 'completed';

export default function HomeScreen({onAbout}: {onAbout: () => void}) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [mode, setMode] = useState<Mode>('silent');
  const [screen, setScreen] = useState<Screen>('picker');
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeMode, setActiveMode] = useState<Mode>('silent');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribe((event: SilenceEvent) => {
      if (event.type === 'tick') {
        setRemaining(event.remaining);
        setTotal(event.total);
        setActiveMode(event.mode);
        setScreen('timer');
      } else if (event.type === 'finished') {
        setScreen('completed');
      } else if (event.type === 'cancelled') {
        setScreen('picker');
      }
    });
    return unsub;
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      await startTimer(hours, minutes, mode);
    } catch (e: any) {
      if (e?.code === 'DND_PERMISSION_REQUIRED') {
        setError('Grant Do Not Disturb access first (see onboarding).');
      } else {
        setError('Could not start the timer. Please try again.');
      }
    }
  }, [hours, minutes, mode]);

  const handleCancel = useCallback(async () => {
    await cancelTimer();
  }, []);

  return (
    <View style={styles.wrap}>
      <Header active={screen === 'timer'} onAbout={onAbout} />
      <View style={styles.content}>
        {screen === 'picker' && (
          <PickerView
            hours={hours}
            minutes={minutes}
            mode={mode}
            onHours={setHours}
            onMinutes={setMinutes}
            onMode={setMode}
            onStart={handleStart}
            error={error}
          />
        )}
        {screen === 'timer' && (
          <TimerView
            remaining={remaining}
            total={total}
            mode={activeMode}
            onCancel={handleCancel}
          />
        )}
        {screen === 'completed' && <CompletedView onReset={() => setScreen('picker')} />}
      </View>
      <AdBanner />
    </View>
  );
}

function Header({active, onAbout}: {active: boolean; onAbout: () => void}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <LinearGradient
          colors={gradients.amber as unknown as string[]}
          style={StyleSheet.absoluteFillObject}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
        <BellOffIcon color={colors.bg} size={16} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>GO SILENT</Text>
        <Text style={styles.headerSubtitle}>BY MPS - QUIET ON A TIMER</Text>
      </View>
      <View style={{flex: 1}} />
      {active && (
        <View style={styles.activeBadge}>
          <PulseDot />
          <Text style={styles.activeLabel}>ACTIVE</Text>
        </View>
      )}
      {!active && (
        <Pressable style={styles.infoBtn} onPress={onAbout} hitSlop={10}>
          <Text style={styles.infoGlyph}>i</Text>
        </Pressable>
      )}
    </View>
  );
}

function PickerView({
  hours,
  minutes,
  mode,
  onHours,
  onMinutes,
  onMode,
  onStart,
  error,
}: {
  hours: number;
  minutes: number;
  mode: Mode;
  onHours: (v: number) => void;
  onMinutes: (v: number) => void;
  onMode: (m: Mode) => void;
  onStart: () => void;
  error: string | null;
}) {
  const canStart = hours > 0 || minutes > 0;
  const colon = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(colon, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(colon, {
          toValue: 0.3,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [colon]);

  return (
    <View style={styles.centerCol}>
      <Text style={styles.sectionLabel}>SET DURATION</Text>

      <View style={styles.dialRow}>
        <DialPicker value={hours} onChange={onHours} max={23} label="HOURS" />
        <View style={styles.colonWrap}>
          <Text style={styles.colonSpacer}> </Text>
          <View style={styles.colonBox}>
            <Animated.Text style={[styles.colon, {opacity: colon}]}>:</Animated.Text>
          </View>
        </View>
        <DialPicker value={minutes} onChange={onMinutes} max={59} label="MINUTES" />
      </View>

      <Text style={[styles.sectionLabel, {marginTop: 32}]}>MODE</Text>
      <View style={{marginTop: 12}}>
        <ModeToggle mode={mode} onChange={onMode} />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Pressable
        style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
        disabled={!canStart}
        onPress={onStart}>
        {canStart && (
          <LinearGradient
            colors={gradients.amber as unknown as string[]}
            style={StyleSheet.absoluteFillObject}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
        )}
        <Text style={[styles.startLabel, {color: canStart ? colors.bg : colors.textDim}]}>
          BEGIN SILENCE
        </Text>
      </Pressable>
    </View>
  );
}

function TimerView({
  remaining,
  total,
  mode,
  onCancel,
}: {
  remaining: number;
  total: number;
  mode: Mode;
  onCancel: () => void;
}) {
  const progress = total > 0 ? remaining / total : 0;
  return (
    <View style={styles.centerCol}>
      <CountdownRing progress={progress}>
        <View style={styles.ringLabelRow}>
          <BellOffIcon color={colors.textLo} />
          <Text style={styles.ringLabel}>
            {mode === 'silent' ? 'SILENT' : 'DO NOT DISTURB'}
          </Text>
        </View>
        <Text style={styles.ringTime}>{formatTime(remaining)}</Text>
        <Text style={styles.ringRemaining}>REMAINING</Text>
      </CountdownRing>

      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <StopIcon color={colors.textHi} />
        <Text style={styles.cancelLabel}>CANCEL</Text>
      </Pressable>
    </View>
  );
}

function CompletedView({onReset}: {onReset: () => void}) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {toValue: 1, friction: 4.5, useNativeDriver: true}).start();
  }, [scale]);

  return (
    <View style={styles.centerCol}>
      <Animated.View style={[styles.completedIcon, {transform: [{scale}]}]}>
        <LinearGradient
          colors={gradients.amber as unknown as string[]}
          style={StyleSheet.absoluteFillObject}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
        <VolumeIcon color={colors.bg} />
      </Animated.View>
      <Text style={styles.completedTitle}>Sound restored</Text>
      <Text style={styles.completedSubtitle}>Your phone is now ringing again</Text>
      <Pressable style={styles.resetBtn} onPress={onReset}>
        <LinearGradient
          colors={gradients.amber as unknown as string[]}
          style={StyleSheet.absoluteFillObject}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
        <Text style={styles.resetLabel}>START AGAIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1},
  content: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {marginLeft: 10},
  headerTitle: {color: colors.textHi, fontSize: 16, fontWeight: '300', letterSpacing: 6},
  headerSubtitle: {color: colors.textLo, fontSize: 7, letterSpacing: 2, marginTop: 2},
  activeBadge: {flexDirection: 'row', alignItems: 'center', gap: 6},
  activeLabel: {color: colors.amber, fontSize: 9, letterSpacing: 3},
  infoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyph: {color: colors.textLo, fontSize: 13, fontStyle: 'italic', fontWeight: '600'},
  centerCol: {alignItems: 'center'},
  sectionLabel: {color: colors.textLo, fontSize: 9, letterSpacing: 4},
  dialRow: {flexDirection: 'row', alignItems: 'center', marginTop: 20},
  colonWrap: {alignItems: 'center', marginHorizontal: 16},
  colonSpacer: {fontSize: 9, letterSpacing: 3, marginBottom: 8, opacity: 0},
  colonBox: {height: 168, width: 24, alignItems: 'center', justifyContent: 'center'},
  colon: {color: colors.amber, fontSize: 38, fontWeight: '200'},
  errorText: {color: colors.amberDeep, fontSize: 11, marginTop: 16, textAlign: 'center'},
  startBtn: {
    marginTop: 36,
    width: '92%',
    height: 66,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  startBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnIconSlot: {
    width: 26,
    alignItems: 'center',
  },
  startBtnDisabled: {},
  startLabel: {fontSize: 13, letterSpacing: 4, fontWeight: '500'},
  ringLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  ringLabel: {color: colors.textLo, fontSize: 10, letterSpacing: 4},
  ringTime: {color: colors.amber, fontSize: 52, fontWeight: '200', marginTop: 14, fontVariant: ['tabular-nums']},
  ringRemaining: {color: colors.textDim, fontSize: 10, letterSpacing: 3, marginTop: 14},
  cancelBtn: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.surface2,
    backgroundColor: 'rgba(28,25,23,0.5)',
  },
  cancelLabel: {color: colors.textHi, fontSize: 11, letterSpacing: 4},
  completedIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  completedTitle: {marginTop: 32, color: colors.textHi, fontSize: 30, fontWeight: '300'},
  completedSubtitle: {marginTop: 10, color: colors.textLo, fontSize: 13},
  resetBtn: {
    marginTop: 40,
    paddingHorizontal: 36,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resetLabel: {color: colors.bg, fontSize: 12, letterSpacing: 4, fontWeight: '500'},
});
