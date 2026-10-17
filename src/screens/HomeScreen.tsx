import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  AppState,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import DialPicker from '../components/DialPicker';
import ClockPicker from '../components/ClockPicker';
import ModeToggle from '../components/ModeToggle';
import CountdownRing from '../components/CountdownRing';
import PulseDot from '../components/PulseDot';
import AdBanner from '../components/AdBanner';
import FadeIn from '../components/FadeIn';
import GlowButton from '../components/GlowButton';
import Burst from '../components/Burst';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha} from '../theme';
import {formatClock, formatSpan, formatTime, msUntil} from '../lib/time';
import {preloadInterstitial, showInterstitialIfReady} from '../lib/interstitial';
import {
  Mode,
  PermissionState,
  SilenceEvent,
  cancelTimer,
  dismissBatteryHint,
  getPermissionState,
  openBatterySettings,
  openExactAlarmSettings,
  startTimer,
  startTimerMs,
  subscribe,
} from '../native/SilenceTimer';

const BELL_PATH =
  'M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z';

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
      <Path fill={color} d={BELL_PATH} />
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
function PaletteIcon({color}: {color: string}) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
      />
    </Svg>
  );
}

type Screen = 'picker' | 'timer' | 'completed';

/** Default "until" target: an hour from now, rounded up to the next 5 minutes. */
function defaultUntil(): {h: number; m: number} {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const m = Math.ceil(d.getMinutes() / 5) * 5;
  d.setMinutes(m, 0, 0);
  return {h: d.getHours(), m: d.getMinutes()};
}

export default function HomeScreen({
  onAbout,
  onThemes,
}: {
  onAbout: () => void;
  onThemes: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);
  const [until, setUntil] = useState(defaultUntil);
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<Mode>('silent');
  const [screen, setScreen] = useState<Screen>('picker');
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeMode, setActiveMode] = useState<Mode>('silent');
  const [error, setError] = useState<string | null>(null);

  // Interstitial owed for a completion the user has not seen yet.
  const adOwed = useRef(false);

  useEffect(() => {
    const unsub = subscribe((event: SilenceEvent) => {
      if (event.type === 'tick') {
        setRemaining(event.remaining);
        setTotal(event.total);
        setActiveMode(event.mode);
        setScreen('timer');
        if (event.remaining <= 120) void preloadInterstitial();
      } else if (event.type === 'finished') {
        setScreen('completed');
        adOwed.current = true;
        if (AppState.currentState === 'active') {
          // Let the celebration play first, then the ad as the natural break.
          setTimeout(() => {
            if (adOwed.current && AppState.currentState === 'active' && showInterstitialIfReady()) {
              adOwed.current = false;
            }
          }, 1800);
        }
      } else if (event.type === 'cancelled') {
        setScreen('picker');
      }
    });
    return unsub;
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      if (page === 0) {
        await startTimer(hours, minutes, mode);
      } else {
        await startTimerMs(msUntil(until.h, until.m), mode);
      }
    } catch (e: any) {
      if (e?.code === 'DND_PERMISSION_REQUIRED') {
        setError('Grant Do Not Disturb access first (see onboarding).');
      } else {
        setError('Could not start the timer. Please try again.');
      }
    }
  }, [page, hours, minutes, until, mode]);

  // Stable so the memoised ClockPicker isn't re-rendered by unrelated state.
  const handleUntil = useCallback((h: number, m: number) => setUntil({h, m}), []);

  const handleCancel = useCallback(async () => {
    await cancelTimer();
  }, []);

  const handleReset = useCallback(() => {
    // If the session ended while the app was in the background, this tap is
    // the first natural break the user sees - show the owed ad here.
    if (adOwed.current) {
      adOwed.current = false;
      showInterstitialIfReady();
    }
    setScreen('picker');
  }, []);

  return (
    <View style={styles.wrap}>
      <Header active={screen === 'timer'} onAbout={onAbout} onThemes={onThemes} />
      <View style={styles.content}>
        {screen === 'picker' && (
          <FadeIn key="picker" style={styles.fill}>
            <PickerView
              page={page}
              onPage={setPage}
              hours={hours}
              minutes={minutes}
              onHours={setHours}
              onMinutes={setMinutes}
              until={until}
              onUntil={handleUntil}
              mode={mode}
              onMode={setMode}
              onStart={handleStart}
              error={error}
            />
          </FadeIn>
        )}
        {screen === 'timer' && (
          <FadeIn key="timer" scaleFrom={0.8} from={0} duration={600} style={styles.centerFill}>
            <TimerView
              remaining={remaining}
              total={total}
              mode={activeMode}
              onCancel={handleCancel}
            />
          </FadeIn>
        )}
        {screen === 'completed' && (
          <FadeIn key="done" from={0} style={styles.centerFill}>
            <CompletedView onReset={handleReset} />
          </FadeIn>
        )}
      </View>
      <AdBanner />
    </View>
  );
}

function Header({
  active,
  onAbout,
  onThemes,
}: {
  active: boolean;
  onAbout: () => void;
  onThemes: () => void;
}) {
  const {theme} = useTheme();
  const styles = useThemedStyles(makeStyles);
  const wiggle = useRef(new Animated.Value(0)).current;

  // The bell gives a little shake every few seconds.
  useEffect(() => {
    const shake = (to: number) =>
      Animated.timing(wiggle, {toValue: to, duration: 70, useNativeDriver: true});
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        shake(1),
        shake(-1),
        shake(0.7),
        shake(-0.7),
        shake(0.3),
        shake(0),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wiggle]);

  return (
    <FadeIn from={-14} style={styles.header}>
      <Animated.View
        style={[
          styles.headerIcon,
          {
            transform: [
              {rotate: wiggle.interpolate({inputRange: [-1, 1], outputRange: ['-18deg', '18deg']})},
            ],
          },
        ]}>
        <LinearGradient
          colors={theme.gradient}
          style={StyleSheet.absoluteFill}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
        <BellOffIcon color={theme.colors.onAccent} size={16} />
      </Animated.View>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>GO SILENT</Text>
        <Text style={styles.headerSubtitle}>BY MPS - QUIET ON A TIMER</Text>
      </View>
      <View style={{flex: 1}} />
      {active ? (
        <View style={styles.activeBadge}>
          <PulseDot />
          <Text style={styles.activeLabel}>ACTIVE</Text>
        </View>
      ) : (
        <View style={styles.headerBtns}>
          <Pressable style={styles.infoBtn} onPress={onThemes} hitSlop={8}>
            <PaletteIcon color={theme.colors.accent} />
          </Pressable>
          <Pressable style={styles.infoBtn} onPress={onAbout} hitSlop={8}>
            <Text style={styles.infoGlyph}>i</Text>
          </Pressable>
        </View>
      )}
    </FadeIn>
  );
}

const PAGE_TITLES = ['FOR HOW LONG', 'UNTIL A TIME'];

function PickerView({
  page,
  onPage,
  hours,
  minutes,
  onHours,
  onMinutes,
  until,
  onUntil,
  mode,
  onMode,
  onStart,
  error,
}: {
  page: number;
  onPage: (p: number) => void;
  hours: number;
  minutes: number;
  onHours: (v: number) => void;
  onMinutes: (v: number) => void;
  until: {h: number; m: number};
  onUntil: (h: number, m: number) => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  onStart: () => void;
  error: string | null;
}) {
  const {theme} = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(makeStyles);
  const canStart = page === 1 || hours > 0 || minutes > 0;
  const colon = useRef(new Animated.Value(0.3)).current;

  // ---- pager geometry ----
  const [box, setBox] = useState({w: 0, h: 0});
  const [tabsW, setTabsW] = useState(0);
  const pos = useRef(new Animated.Value(0)).current; // 0 .. -box.w
  // Gesture-side copy of the page. goTo() updates it at once; the `page`
  // state follows when the slide finishes, so the re-render it causes never
  // lands on top of the animation.
  const live = useRef({page, w: 0});
  live.current.w = box.w;

  const goTo = useCallback(
    (p: number) => {
      live.current.page = p;
      Animated.spring(pos, {
        toValue: -p * live.current.w,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }).start(() => onPage(live.current.page));
    },
    [onPage, pos],
  );

  // Keep the pager aligned if the width changes (first layout, rotation).
  useEffect(() => {
    pos.setValue(-live.current.page * box.w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w]);

  // Finger travel already used up by the "is this horizontal?" check, so the
  // page follows the finger from where it is instead of jumping.
  const grabDx = useRef(0);

  const pan = useMemo(() => {
    // Only clear horizontal swipes; taps and vertical drags go to the dials.
    const horizontal = (g: {dx: number; dy: number}) =>
      Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
    return PanResponder.create({
      // Capture phase: claim the swipe before the dial lists can start a
      // scroll. The clock face keeps its own drags - it refuses termination.
      onMoveShouldSetPanResponderCapture: (_, g) => horizontal(g),
      onMoveShouldSetPanResponder: (_, g) => horizontal(g),
      onPanResponderGrant: (_, g) => {
        grabDx.current = g.dx;
      },
      onPanResponderMove: (_, g) => {
        const {page: p, w} = live.current;
        let x = -p * w + (g.dx - grabDx.current);
        // Rubber-band past either edge.
        if (x > 0) x = x * 0.3;
        if (x < -w) x = -w + (x + w) * 0.3;
        pos.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        const {page: p, w} = live.current;
        const dx = g.dx - grabDx.current;
        let next = p;
        if (dx < -w * 0.22 || g.vx < -0.45) next = 1;
        else if (dx > w * 0.22 || g.vx > 0.45) next = 0;
        goTo(next);
      },
      onPanResponderTerminate: () => goTo(live.current.page),
    });
  }, [pos, goTo]);

  // ---- "until" summary refreshes as the clock ticks ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  const untilMs = msUntil(until.h, until.m, new Date(now));
  const untilTomorrow =
    new Date(now + untilMs).getDate() !== new Date(now).getDate();

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

  const clockSize = Math.max(170, Math.min(box.w - 72, box.h - 125, 290));
  const indicatorX =
    box.w > 0
      ? pos.interpolate({
          inputRange: [-box.w, 0],
          outputRange: [tabsW / 2, 0],
          extrapolate: 'clamp',
        })
      : 0;

  return (
    <View style={styles.pickerWrap}>
      {/* Tabs with a sliding indicator that follows your finger */}
      <View style={styles.tabs} onLayout={e => setTabsW(e.nativeEvent.layout.width)}>
        {tabsW > 0 && (
          <Animated.View
            style={[styles.tabIndicator, {width: tabsW / 2, transform: [{translateX: indicatorX}]}]}>
            <LinearGradient
              colors={[alpha(c.accent, 0.22), alpha(c.accentDeep, 0.22)]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        {PAGE_TITLES.map((t, i) => (
          <Pressable key={t} style={styles.tab} onPress={() => goTo(i)}>
            <Text style={[styles.tabLabel, page === i && styles.tabLabelActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View
        style={styles.pager}
        onLayout={e => setBox({w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height})}
        {...pan.panHandlers}>
        {box.w > 0 && (
          <Animated.View
            style={[styles.pagerRow, {width: box.w * 2, transform: [{translateX: pos}]}]}>
            {/* Page 1 - duration */}
            <Animated.View
              style={[
                styles.page,
                {
                  width: box.w,
                  opacity: pos.interpolate({
                    inputRange: [-box.w, 0],
                    outputRange: [0.2, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      scale: pos.interpolate({
                        inputRange: [-box.w, 0],
                        outputRange: [0.85, 1],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}>
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
              <Text style={styles.summary}>
                {hours > 0 || minutes > 0
                  ? `Sound back at ${formatClock(
                      new Date(now + (hours * 60 + minutes) * 60000).getHours(),
                      new Date(now + (hours * 60 + minutes) * 60000).getMinutes(),
                    )}`
                  : 'Pick a duration'}
              </Text>
            </Animated.View>

            {/* Page 2 - until a time */}
            <Animated.View
              style={[
                styles.page,
                {
                  width: box.w,
                  opacity: pos.interpolate({
                    inputRange: [-box.w, 0],
                    outputRange: [1, 0.2],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    {
                      scale: pos.interpolate({
                        inputRange: [-box.w, 0],
                        outputRange: [1, 0.85],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}>
              <ClockPicker hour={until.h} minute={until.m} onChange={onUntil} size={clockSize} />
              <Text style={styles.summary}>
                {`Silent until ${formatClock(until.h, until.m)}${untilTomorrow ? ' tomorrow' : ''} · ${formatSpan(untilMs)}`}
              </Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* Page dots */}
      <View style={styles.dots}>
        {[0, 1].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              box.w > 0 && {
                opacity: pos.interpolate({
                  inputRange: [-box.w, 0],
                  outputRange: i === 0 ? [0.3, 1] : [1, 0.3],
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    scaleX: pos.interpolate({
                      inputRange: [-box.w, 0],
                      outputRange: i === 0 ? [1, 2.6] : [2.6, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>

      <ReliabilityHint />

      <View style={styles.modeRow}>
        <ModeToggle mode={mode} onChange={onMode} />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <GlowButton
        label="BEGIN SILENCE"
        onPress={onStart}
        disabled={!canStart}
        style={styles.startBtn}
      />
    </View>
  );
}

/**
 * Nudges users who skipped (or never saw) the optional settings that keep the
 * timer exact and alive through "Clear all". Hidden once both are on.
 */
function ReliabilityHint() {
  const styles = useThemedStyles(makeStyles);
  const [perms, setPerms] = useState<PermissionState | null>(null);

  useEffect(() => {
    const refresh = () => getPermissionState().then(setPerms).catch(() => {});
    refresh();
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  if (!perms) return null;
  let text: string | null = null;
  let onPress: (() => void) | null = null;
  let onDismiss: (() => void) | null = null;
  if (perms.exactAlarmGranted === false) {
    text = 'Allow "Alarms & reminders" so sound returns exactly on time';
    onPress = openExactAlarmSettings;
  } else if (perms.batteryUnrestricted === false) {
    // Brands word this differently: "Unrestricted" on Samsung/Pixel,
    // "Allow background power usage/activity" on vivo, OPPO, Xiaomi.
    text = 'Battery: allow background use ("Unrestricted") so clearing apps can\'t stop the timer';
    onPress = () => {
      setPerms({...perms, batteryUnrestricted: true});
      openBatterySettings();
    };
    onDismiss = () => {
      setPerms({...perms, batteryUnrestricted: true});
      dismissBatteryHint();
    };
  }
  if (!text || !onPress) return null;

  return (
    <FadeIn style={styles.hintWrap}>
      <Pressable style={styles.hint} onPress={onPress}>
        <Text style={styles.hintBolt}>!</Text>
        <Text style={styles.hintText}>{text}</Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={12} style={styles.hintClose}>
            <Text style={styles.hintCloseText}>×</Text>
          </Pressable>
        )}
      </Pressable>
    </FadeIn>
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
  const {theme} = useTheme();
  const styles = useThemedStyles(makeStyles);
  const progress = total > 0 ? remaining / total : 0;
  const end = new Date(Date.now() + remaining * 1000);
  return (
    <View style={styles.centerCol}>
      <CountdownRing progress={progress}>
        <View style={styles.ringLabelRow}>
          <BellOffIcon color={theme.colors.textLo} />
          <Text style={styles.ringLabel}>
            {mode === 'silent' ? 'SILENT' : 'DO NOT DISTURB'}
          </Text>
        </View>
        <Text style={styles.ringTime}>{formatTime(remaining)}</Text>
        <Text style={styles.ringRemaining}>
          {`RINGS AGAIN AT ${formatClock(end.getHours(), end.getMinutes())}${
            end.getDate() !== new Date().getDate() ? ' TOMORROW' : ''
          }`}
        </Text>
      </CountdownRing>

      <FadeIn delay={300}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <StopIcon color={theme.colors.textHi} />
          <Text style={styles.cancelLabel}>CANCEL</Text>
        </Pressable>
      </FadeIn>
    </View>
  );
}

function CompletedView({onReset}: {onReset: () => void}) {
  const {theme} = useTheme();
  const styles = useThemedStyles(makeStyles);
  const scale = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, friction: 4, tension: 50, useNativeDriver: true}),
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, spin]);

  return (
    <View style={styles.centerCol}>
      <View style={styles.completedStage}>
        <Burst size={96} />
        <Animated.View
          style={[
            styles.completedIcon,
            {
              transform: [
                {scale},
                {rotate: spin.interpolate({inputRange: [0, 1], outputRange: ['-180deg', '0deg']})},
              ],
            },
          ]}>
          <LinearGradient
            colors={theme.gradient}
            style={StyleSheet.absoluteFill}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
          <VolumeIcon color={theme.colors.onAccent} />
        </Animated.View>
      </View>
      <FadeIn delay={350}>
        <Text style={styles.completedTitle}>Sound restored</Text>
      </FadeIn>
      <FadeIn delay={500}>
        <Text style={styles.completedSubtitle}>Your phone is now ringing again</Text>
      </FadeIn>
      <FadeIn delay={700} style={styles.resetWrap}>
        <GlowButton label="START AGAIN" onPress={onReset} height={52} style={styles.resetBtn} />
      </FadeIn>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
    wrap: {flex: 1},
    content: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
    fill: {flex: 1, width: '100%'},
    centerFill: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingTop: 30,
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
    headerTitle: {color: c.textHi, fontSize: 16, fontWeight: '300', letterSpacing: 6},
    headerSubtitle: {color: c.textLo, fontSize: 7, letterSpacing: 2, marginTop: 2},
    headerBtns: {flexDirection: 'row', gap: 10},
    activeBadge: {flexDirection: 'row', alignItems: 'center', gap: 6},
    activeLabel: {color: c.accent, fontSize: 9, letterSpacing: 3},
    infoBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoGlyph: {color: c.textLo, fontSize: 13, fontStyle: 'italic', fontWeight: '600'},
    centerCol: {alignItems: 'center'},

    pickerWrap: {flex: 1, alignItems: 'center', paddingTop: 18, paddingBottom: 14},
    tabs: {
      flexDirection: 'row',
      width: '100%',
      height: 40,
      borderRadius: 20,
      backgroundColor: alpha(c.surface, 0.8),
      borderWidth: 1,
      borderColor: c.surface2,
      overflow: 'hidden',
    },
    tabIndicator: {position: 'absolute', top: 0, bottom: 0, borderRadius: 20, overflow: 'hidden'},
    tab: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    tabLabel: {color: c.textLo, fontSize: 10, letterSpacing: 2.5, fontWeight: '500'},
    tabLabelActive: {color: c.accent},
    pager: {flex: 1, width: '100%', overflow: 'hidden'},
    pagerRow: {flexDirection: 'row', flex: 1},
    page: {alignItems: 'center', justifyContent: 'center'},
    dialRow: {flexDirection: 'row', alignItems: 'center'},
    colonWrap: {alignItems: 'center', marginHorizontal: 16},
    colonSpacer: {fontSize: 9, letterSpacing: 3, marginBottom: 8, opacity: 0},
    colonBox: {height: 168, width: 24, alignItems: 'center', justifyContent: 'center'},
    colon: {color: c.accent, fontSize: 38, fontWeight: '200'},
    summary: {marginTop: 14, color: c.textLo, fontSize: 12, letterSpacing: 0.5},
    dots: {flexDirection: 'row', gap: 14, marginBottom: 14},
    dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent},
    modeRow: {width: '100%', alignItems: 'center'},
    hintWrap: {width: '100%', marginBottom: 10},
    hint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: alpha(c.accent, 0.4),
      backgroundColor: alpha(c.accent, 0.08),
    },
    hintBolt: {
      width: 16,
      height: 16,
      borderRadius: 8,
      textAlign: 'center',
      lineHeight: 16,
      fontSize: 11,
      fontWeight: '700',
      color: c.onAccent,
      backgroundColor: c.accent,
      overflow: 'hidden',
    },
    hintText: {flex: 1, color: c.textHi, fontSize: 10.5, lineHeight: 14},
    hintClose: {paddingHorizontal: 4},
    hintCloseText: {color: c.textLo, fontSize: 18, lineHeight: 18},
    errorText: {color: c.accentDeep, fontSize: 11, marginTop: 12, textAlign: 'center'},
    startBtn: {marginTop: 18},

    ringLabelRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
    ringLabel: {color: c.textLo, fontSize: 10, letterSpacing: 4},
    ringTime: {
      color: c.accent,
      fontSize: 52,
      fontWeight: '200',
      marginTop: 14,
      fontVariant: ['tabular-nums'],
    },
    ringRemaining: {color: c.textLo, fontSize: 9, letterSpacing: 2.5, marginTop: 14},
    cancelBtn: {
      marginTop: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: c.surface2,
      backgroundColor: alpha(c.surface, 0.5),
    },
    cancelLabel: {color: c.textHi, fontSize: 11, letterSpacing: 4},

    completedStage: {width: 96, height: 96, alignItems: 'center', justifyContent: 'center'},
    completedIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    completedTitle: {
      marginTop: 32,
      color: c.textHi,
      fontSize: 30,
      fontWeight: '300',
      textAlign: 'center',
    },
    completedSubtitle: {marginTop: 10, color: c.textLo, fontSize: 13, textAlign: 'center'},
    resetWrap: {marginTop: 40, width: 220, alignItems: 'center'},
    resetBtn: {width: '100%'},
  });
};
