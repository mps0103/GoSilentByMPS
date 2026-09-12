import React from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import {colors, gradients} from '../theme';
import {
  APP_BUILD,
  APP_FULL_NAME,
  APP_VERSION,
  DEVELOPER_NAME,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
} from '../lib/appInfo';

function BellOffIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      <Path
        fill={colors.bg}
        d="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"
      />
    </Svg>
  );
}

function BackIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        fill="none"
        stroke={colors.textHi}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 18l-6-6 6-6"
      />
    </Svg>
  );
}

interface Props {
  onBack: () => void;
}

export default function AboutScreen({onBack}: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backBtn} onPress={onBack}>
        <BackIcon />
        <Text style={styles.backLabel}>BACK</Text>
      </Pressable>

      <View style={styles.center}>
        <View style={styles.icon}>
          <LinearGradient
            colors={gradients.amber as unknown as string[]}
            style={StyleSheet.absoluteFillObject}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          />
          <BellOffIcon />
        </View>

        <Text style={styles.appName}>{APP_FULL_NAME}</Text>
        <Text style={styles.version}>
          VERSION {APP_VERSION} (BUILD {APP_BUILD})
        </Text>

        <View style={styles.divider} />

        <Text style={styles.tagline}>
          Puts your phone on Silent or Do Not Disturb for a duration you choose,
          then switches ringing back on automatically.
        </Text>

        <Pressable
          style={styles.linkRow}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>

        <Pressable
          style={styles.linkRow}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.linkText}>Contact Support</Text>
        </Pressable>

        <Text style={styles.madeBy}>MADE WITH CARE BY {DEVELOPER_NAME.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, paddingHorizontal: 28, paddingTop: 36},
  backBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start'},
  backLabel: {color: colors.textHi, fontSize: 11, letterSpacing: 3},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60},
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    marginTop: 24,
    color: colors.textHi,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 4,
    textAlign: 'center',
  },
  version: {marginTop: 8, color: colors.textLo, fontSize: 10, letterSpacing: 3},
  divider: {marginTop: 20, height: 1, width: 100, backgroundColor: colors.amber, opacity: 0.4},
  tagline: {
    marginTop: 20,
    color: colors.textLo,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  linkRow: {marginTop: 24},
  linkText: {color: colors.amber, fontSize: 13, letterSpacing: 1, textDecorationLine: 'underline'},
  madeBy: {marginTop: 40, color: colors.textDim, fontSize: 9, letterSpacing: 2},
});
