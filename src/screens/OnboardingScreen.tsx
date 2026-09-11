import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {colors, gradients} from '../theme';
import {
  getPermissionState,
  openDndSettings,
  requestNotificationPermission,
  PermissionState,
} from '../native/SilenceTimer';

function BellOffIcon() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24">
      <Path
        fill={colors.bg}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M5 12l5 5 9-12"
        stroke={colors.amber}
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
          colors={gradients.amber as unknown as string[]}
          style={styles.iconGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <BellOffIcon />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.title}>WELCOME</Text>
      <Text style={styles.subtitle}>BEFORE WE BEGIN</Text>
      <View style={styles.divider} />

      <View style={styles.rows}>
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
      </View>

      <View style={{flex: 1}} />

      <Pressable
        style={[styles.continueBtn, !allGranted && styles.continueBtnDisabled]}
        disabled={!allGranted}
        onPress={onContinue}>
        {allGranted ? (
          <LinearGradient
            colors={gradients.amber as unknown as string[]}
            style={StyleSheet.absoluteFillObject}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={colors.textLo} />
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

const styles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingVertical: 60},
  icon: {width: 80, height: 80, borderRadius: 40, overflow: 'hidden'},
  iconGradient: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {
    marginTop: 28,
    color: colors.textHi,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 8,
  },
  subtitle: {marginTop: 10, color: colors.textLo, fontSize: 10, letterSpacing: 3},
  divider: {marginTop: 8, height: 1, width: 100, backgroundColor: colors.amber, opacity: 0.5},
  rows: {width: '100%', marginTop: 28, gap: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface2,
    padding: 14,
  },
  rowGranted: {borderColor: 'rgba(251,191,36,0.5)'},
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconGranted: {backgroundColor: 'rgba(251,191,36,0.18)', borderColor: 'rgba(251,191,36,0.7)'},
  rowIconQuestion: {color: colors.textLo, fontSize: 16, fontWeight: '500'},
  rowText: {flex: 1},
  rowTitle: {color: colors.textHi, fontSize: 13, fontWeight: '500', letterSpacing: 1},
  rowDesc: {color: colors.textLo, fontSize: 10, marginTop: 2},
  rowTap: {color: colors.amber, fontSize: 9, letterSpacing: 2, fontWeight: '500'},
  continueBtn: {
    width: '85%',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  continueBtnDisabled: {},
  continueLabel: {color: colors.textLo, fontSize: 11, letterSpacing: 3, fontWeight: '500'},
  continueLabelActive: {color: colors.bg},
  footnote: {marginTop: 14, color: colors.textDim, fontSize: 9, letterSpacing: 2},
});
