import React, {ComponentRef, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import Svg, {Circle, Line} from 'react-native-svg';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha} from '../theme';

type Stage = 'hour' | 'minute';

interface Props {
  /** 0..23 */
  hour: number;
  /** 0..59 */
  minute: number;
  onChange: (hour: number, minute: number) => void;
  size: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Touches starting inside this fraction of the number-ring radius may still
// become a page swipe; outside it (on the numbers) they pick immediately.
const INNER = 0.6;

/**
 * Analog time picker: tap or drag on the dial to pick the hour, it then flips
 * to minutes on its own. Tap the digits at the top to switch back.
 */
function ClockPicker({hour, minute, onChange, size}: Props) {
  const {theme} = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(makeStyles);
  const [stage, setStage] = useState<Stage>('hour');

  const isPM = hour >= 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  const radius = size / 2 - 30;
  const knob = 20;

  // Latest values for the PanResponder, which is created once.
  const live = useRef({hour, minute, stage, onChange});
  live.current = {hour, minute, stage, onChange};

  // ---- hand angle, kept continuous so it never spins the long way round ----
  const targetDeg = stage === 'hour' ? (hour % 12) * 30 : minute * 6;
  const handDeg = useRef(new Animated.Value(targetDeg)).current;
  const lastDeg = useRef(targetDeg);
  const dragging = useRef(false);

  const continuous = (raw: number) => {
    const last = lastDeg.current;
    const delta = ((((raw - last) % 360) + 540) % 360) - 180;
    return last + delta;
  };

  useEffect(() => {
    const next = continuous(targetDeg);
    lastDeg.current = next;
    if (dragging.current) {
      handDeg.setValue(next);
    } else {
      Animated.spring(handDeg, {
        toValue: next,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDeg, handDeg]);

  // ---- numbers pop in whenever the stage flips ----
  const stageAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    stageAnim.setValue(0);
    Animated.spring(stageAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [stage, stageAnim]);

  // ---- touch handling ----
  const faceRef = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef({x: 0, y: 0});
  const measured = useRef(false);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Where the touch went down (dial coordinates) and whether it has turned
  // into picking a time - see onPanResponderTerminationRequest.
  const start = useRef({x: 0, y: 0});
  const committed = useRef(false);

  const pan = useMemo(() => {
    const handle = (x: number, y: number) => {
      const dx = x - size / 2;
      const dy = y - size / 2;
      if (Math.hypot(dx, dy) < 12) return;
      const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      const {hour: h, minute: m, stage: s, onChange: cb} = live.current;
      if (s === 'hour') {
        const idx = Math.round(deg / 30) % 12;
        const next = idx + (h >= 12 ? 12 : 0);
        if (next !== h) {
          Vibration.vibrate(6);
          cb(next, m);
        }
      } else {
        const next = Math.round(deg / 6) % 60;
        if (next !== m) {
          if (next % 5 === 0) Vibration.vibrate(5);
          cb(h, next);
        }
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Until the touch commits to picking a time, the page swipe may take
      // it over (see the pager in HomeScreen); after that the dial keeps it.
      onPanResponderTerminationRequest: () => !committed.current,
      // locationX/Y can be reported relative to an inner (rotated) view on
      // Android, so work in screen coordinates against the dial's own origin.
      onPanResponderGrant: e => {
        if (flipTimer.current) clearTimeout(flipTimer.current);
        dragging.current = true;
        committed.current = false;
        const {pageX, pageY} = e.nativeEvent;
        measured.current = false;
        faceRef.current?.measure((_x, _y, _w, _h, px, py) => {
          origin.current = {x: px, y: py};
          measured.current = true;
          const x = pageX - px;
          const y = pageY - py;
          start.current = {x, y};
          // On the number ring: pick at once, so dragging the hand feels
          // immediate. In the middle: wait - it may be a page swipe.
          if (Math.hypot(x - size / 2, y - size / 2) >= INNER * radius) {
            committed.current = true;
            handle(x, y);
          }
        });
      },
      onPanResponderMove: e => {
        if (!measured.current) return;
        const x = e.nativeEvent.pageX - origin.current.x;
        const y = e.nativeEvent.pageY - origin.current.y;
        // Moved past the pager's swipe threshold without being claimed as a
        // horizontal swipe - so it's a drag on the dial.
        if (!committed.current && Math.hypot(x - start.current.x, y - start.current.y) > 14) {
          committed.current = true;
        }
        if (committed.current) handle(x, y);
      },
      onPanResponderRelease: () => {
        dragging.current = false;
        // A tap in the middle of the dial still picks that position.
        if (!committed.current && measured.current) {
          committed.current = true;
          handle(start.current.x, start.current.y);
        }
        if (live.current.stage === 'hour') {
          flipTimer.current = setTimeout(() => setStage('minute'), 280);
        }
      },
      onPanResponderTerminate: () => {
        // Handed to the page swipe: nothing was picked.
        dragging.current = false;
      },
    });
  }, [size, radius]);

  useEffect(() => () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
  }, []);

  const setPM = (pm: boolean) => {
    if (pm === isPM) return;
    onChange(pm ? hour + 12 : hour - 12, minute);
  };

  const labels = Array.from({length: 12}, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const selected = stage === 'hour' ? hour % 12 === i : minute === i * 5;
    return {
      text: stage === 'hour' ? String(i === 0 ? 12 : i) : pad(i * 5),
      x: size / 2 + radius * Math.sin(a),
      y: size / 2 - radius * Math.cos(a),
      selected,
    };
  });

  const offLabel = stage === 'minute' && minute % 5 !== 0;
  const spin = handDeg.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ['-3600deg', '3600deg'],
  });

  return (
    <View style={styles.wrap}>
      {/* Digital readout - tap a part to edit it */}
      <View style={styles.readout}>
        <Pressable onPress={() => setStage('hour')} hitSlop={8}>
          <Text style={[styles.digits, stage === 'hour' && styles.digitsActive]}>
            {pad(hour12)}
          </Text>
        </Pressable>
        <Text style={styles.colon}>:</Text>
        <Pressable onPress={() => setStage('minute')} hitSlop={8}>
          <Text style={[styles.digits, stage === 'minute' && styles.digitsActive]}>
            {pad(minute)}
          </Text>
        </Pressable>
        <View style={styles.ampm}>
          <Pressable onPress={() => setPM(false)} hitSlop={6}>
            <Text style={[styles.ampmText, !isPM && styles.ampmActive]}>AM</Text>
          </Pressable>
          <Pressable onPress={() => setPM(true)} hitSlop={6}>
            <Text style={[styles.ampmText, isPM && styles.ampmActive]}>PM</Text>
          </Pressable>
        </View>
      </View>

      {/* Dial */}
      <View
        ref={faceRef}
        collapsable={false}
        style={[styles.face, {width: size, height: size, borderRadius: size / 2}]}
        {...pan.panHandlers}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({length: 60}, (_, i) => {
            const a = (i * 6 * Math.PI) / 180;
            const r1 = size / 2 - 6;
            const r2 = size / 2 - (i % 5 === 0 ? 12 : 9);
            return (
              <Line
                key={i}
                x1={size / 2 + r1 * Math.sin(a)}
                y1={size / 2 - r1 * Math.cos(a)}
                x2={size / 2 + r2 * Math.sin(a)}
                y2={size / 2 - r2 * Math.cos(a)}
                stroke={i % 5 === 0 ? c.textLo : c.textDim}
                strokeWidth={i % 5 === 0 ? 1.6 : 1}
              />
            );
          })}
        </Svg>

        {/* Hand */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {transform: [{rotate: spin}]}]}>
          <Svg width={size} height={size}>
            <Line
              x1={size / 2}
              y1={size / 2}
              x2={size / 2}
              y2={size / 2 - radius + knob}
              stroke={c.accent}
              strokeWidth={2}
            />
            <Circle cx={size / 2} cy={size / 2 - radius} r={knob} fill={c.accent} />
            <Circle cx={size / 2} cy={size / 2 - radius} r={knob + 7} fill={alpha(c.accent, 0.18)} />
            {offLabel && (
              <Circle cx={size / 2} cy={size / 2 - radius} r={3} fill={c.onAccent} />
            )}
            <Circle cx={size / 2} cy={size / 2} r={5} fill={c.accent} />
          </Svg>
        </Animated.View>

        {/* Numbers */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: stageAnim,
              transform: [
                {scale: stageAnim.interpolate({inputRange: [0, 1], outputRange: [0.82, 1]})},
                {
                  rotate: stageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-25deg', '0deg'],
                  }),
                },
              ],
            },
          ]}>
          {labels.map(l => (
            <Text
              key={l.text}
              style={[
                styles.num,
                {left: l.x - 18, top: l.y - 18},
                l.selected && {color: c.onAccent, fontWeight: '600'},
              ]}>
              {l.text}
            </Text>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
    wrap: {alignItems: 'center'},
    readout: {flexDirection: 'row', alignItems: 'center', marginBottom: 14},
    digits: {
      color: c.textLo,
      fontSize: 38,
      fontWeight: '200',
      fontVariant: ['tabular-nums'],
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    digitsActive: {color: c.accent, backgroundColor: alpha(c.accent, 0.12)},
    colon: {color: c.textLo, fontSize: 34, fontWeight: '200', marginHorizontal: 2},
    ampm: {marginLeft: 12, gap: 4},
    ampmText: {
      color: c.textDim,
      fontSize: 11,
      letterSpacing: 2,
      fontWeight: '600',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      overflow: 'hidden',
    },
    ampmActive: {color: c.onAccent, backgroundColor: c.accent},
    face: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surface2,
    },
    num: {
      position: 'absolute',
      width: 36,
      height: 36,
      lineHeight: 36,
      textAlign: 'center',
      color: c.textHi,
      fontSize: 15,
      fontWeight: '300',
    },
  });
};

// Memoised: 60 tick marks + labels are not worth redrawing on page change.
export default React.memo(ClockPicker);
