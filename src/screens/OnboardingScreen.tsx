import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {useTheme, useThemedStyles} from '../lib/ThemeContext';
import {Theme, alpha} from '../theme';
import {
  getPermissionState,
  openDndSettings,
  openBatterySettings,
  openExactAlarmSettings,
  requestNotificationPermission,
  PermissionState,
} from '../native/SilenceTimer';

function BellOffIcon() {
  const c = useTheme().theme.colors;
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24">
      <Path
        fill={c.onAccent}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}

function CheckIcon() {
  const c = useTheme().theme.colors;
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M5 12l5 5 9-12"
        stroke={c.accent}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PermissionRow({
  title,
  description,
  granted,
  onPress,
}: {
  title: string;
  description: string;
  granted: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[styles.row, granted && styles.rowGranted]}
      onPress={granted ? undefined : onPress}
      disabled={granted}>
      <View style={[styles.rowIcon, granted && styles.rowIconGranted]}>
        {granted ? <CheckIcon /> : <Text style={styles.rowIconQuestion}>?</Text>}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      {!granted && <Text style={styles.rowTap}>TAP</Text>}
    </Pressable>
  );
}

interface Props {
  onContinue: () => void;
}

export default function OnboardingScreen({onContinue}: Props) {
  const {theme} = useTheme();
  const c = theme.colors;
  const styles = useThemedStyles(makeStyles);
  const [state, setState] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);
  const iconScale = useRef(new Animated.Value(0)).current;

  const refresh = useCallback(async () => {
    const s = await getPermissionState();
    setState(s);
  }, []);

  useEffect(() => {
    refresh();
    Animated.spring(iconScale, {toValue: 1, friction: 5, useNativeDriver: true}).start();

    // Re-check whenever the user comes back from system Settings.
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh, iconScale]);

  const handleNotifPress = async () => {
    setLoading(true);
    await requestNotificationPermission();
    setLoading(false);
    // Result arrives async via the system dialog; refresh shortly after.
    setTimeout(refresh, 500);
  };

  const handleDndPress = () => {
    openDndSettings();
  };

  const allGranted = !!state?.notificationGranted && !!state?.dndGranted;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.icon, {transform: [{scale: iconScale}]}]}>
        <LinearGradient
          colors={theme.gradient}
          style={styles.iconGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <BellOffIcon />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.title}>WELCOME</Text>
      <Text style={styles.subtitle}>BEFORE WE BEGIN</Text>
      <View style={styles.divider} />

      <ScrollView style={styles.rowsScroll} contentContainerStyle={styles.rows}>
        <PermissionRow
          title="Notifications"
          description="Show the active timer in your status bar"
          granted={!!state?.notificationGranted}
          onPress={handleNotifPress}
        />
        <PermissionRow
          title="Do Not Disturb access"
          description="Switch DND on and off automatically"
          granted={!!state?.dndGranted}
          onPress={handleDndPress}
        />
        <PermissionRow
          title="Alarms & reminders (recommended)"
          description="Bring sound back exactly on time"
          granted={state?.exactAlarmGranted !== false}
          onPress={openExactAlarmSettings}
        />
        <PermissionRow
          title="Battery: allow background use (recommended)"
          description={'"Unrestricted" or "Allow background" keeps the timer alive'}
          granted={state?.batteryUnrestricted !== false}
          onPress={openBatterySettings}
        />
      </ScrollView>



      <Pressable
        style={[styles.continueBtn, !allGranted && styles.continueBtnDisabled]}
        disabled={!allGranted}
        onPress={onContinue}>
        {allGranted ? (
          <LinearGradient
            colors={theme.gradient}
            style={StyleSheet.absoluteFillObject}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={c.textLo} />
        ) : (
          <Text style={[styles.continueLabel, allGranted && styles.continueLabelActive]}>
            {allGranted ? 'CONTINUE' : 'GRANT ACCESS TO CONTINUE'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.footnote}>REQUIRED ONCE · NEVER LEAVES YOUR DEVICE</Text>
    </View>
  );
}

const makeStyles = (t: Theme) => {
  const c = t.colors;
  return StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 48, paddingBottom: 28},
  icon: {width: 80, height: 80, borderRadius: 40, overflow: 'hidden'},
  iconGradient: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {
    marginTop: 28,
    color: c.textHi,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 8,
  },
  subtitle: {marginTop: 10, color: c.textLo, fontSize: 10, letterSpacing: 3},
  divider: {marginTop: 8, height: 1, width: 100, backgroundColor: c.accent, opacity: 0.5},
  rowsScroll: {width: '100%', flex: 1, marginTop: 24, marginBottom: 16},
  rows: {gap: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.surface2,
    padding: 14,
  },
  rowGranted: {borderColor: alpha(c.accent, 0.5)},
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.surface2,
    borderWidth: 1,
    borderColor: c.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconGranted: {backgroundColor: alpha(c.accent, 0.18), borderColor: alpha(c.accent, 0.7)},
  rowIconQuestion: {color: c.textLo, fontSize: 16, fontWeight: '500'},
  rowText: {flex: 1},
  rowTitle: {color: c.textHi, fontSize: 13, fontWeight: '500', letterSpacing: 1},
  rowDesc: {color: c.textLo, fontSize: 10, marginTop: 2},
  rowTap: {color: c.accent, fontSize: 9, letterSpacing: 2, fontWeight: '500'},
  continueBtn: {
    width: '85%',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  continueBtnDisabled: {},
  continueLabel: {color: c.textLo, fontSize: 11, letterSpacing: 3, fontWeight: '500'},
  continueLabelActive: {color: c.onAccent},
  footnote: {marginTop: 14, color: c.textDim, fontSize: 9, letterSpacing: 2},
});
};
