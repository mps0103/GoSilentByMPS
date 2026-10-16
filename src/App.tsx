import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Animated, BackHandler, Easing, StatusBar, StyleSheet, View} from 'react-native';
import ParticleBackground from './components/ParticleBackground';
import FadeIn from './components/FadeIn';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import ThemeScreen from './screens/ThemeScreen';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {getPermissionState, setSystemBarsLight} from './native/SilenceTimer';
import {ensureAdsConsentAndInit} from './lib/consent';
import {ThemeProvider, useTheme} from './lib/ThemeContext';

type Stage = 'splash' | 'onboarding' | 'home' | 'about' | 'themes';

// Long enough for the splash story (ring, slash, countdown, title) to play out.
const SPLASH_DELAY_MS = 1700;
const STARTUP_TIMEOUT_MS = 1400;

function withStartupTimeout<T>(
  task: Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  return Promise.race([
    task,
    new Promise<T>(resolve => {
      const timeoutId = setTimeout(() => {
        console.warn(`${label} timed out during startup; continuing with fallback.`);
        resolve(fallback);
      }, STARTUP_TIMEOUT_MS);

      // .finally() returns a new promise - without a catch, a rejecting task
      // surfaces as an unhandled rejection even though the race handles it.
      task.finally(() => clearTimeout(timeoutId)).catch(() => {});
    }),
  ]);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  // Status and navigation bar icons follow the theme (dark icons on Daylight).
  useEffect(() => {
    setSystemBarsLight(!theme.dark);
  }, [theme.dark]);
  const [stage, setStage] = useState<Stage>('splash');
  // Remembers whether we came from onboarding or home, so "back" from
  // About returns to wherever the user actually was.
  const [previousStage, setPreviousStage] = useState<Stage>('home');

  // ---- theme crossfade: the old background fades away over the new one ----
  const [fadeFrom, setFadeFrom] = useState({color: theme.colors.bg, n: 0});
  const fade = useRef(new Animated.Value(0)).current;
  const lastBg = useRef(theme.colors.bg);
  useLayoutEffect(() => {
    if (lastBg.current === theme.colors.bg) return;
    setFadeFrom(f => ({color: lastBg.current, n: f.n + 1}));
    lastBg.current = theme.colors.bg;
  }, [theme.colors.bg]);
  // Runs after the overlay has been rendered in the old color.
  useLayoutEffect(() => {
    if (fadeFrom.n === 0) return;
    fade.setValue(1);
    Animated.timing(fade, {
      toValue: 0,
      duration: 520,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeFrom, fade]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const finishSplash = async () => {
        try {
          const [permsResult, consentResult] = await Promise.allSettled([
            withStartupTimeout(
              getPermissionState(),
              {notificationGranted: false, dndGranted: false},
              'Permission check',
            ),
            withStartupTimeout(ensureAdsConsentAndInit(), undefined, 'Ads init'),
          ]);

          const perms =
            permsResult.status === 'fulfilled'
              ? permsResult.value
              : {notificationGranted: false, dndGranted: false};

          if (consentResult.status === 'rejected') {
            console.warn('Ads consent/init failed during startup:', consentResult.reason);
          }

          const needsOnboarding = !perms.notificationGranted || !perms.dndGranted;
          setStage(needsOnboarding ? 'onboarding' : 'home');
        } catch (error) {
          console.warn('Splash startup flow failed, falling back to home:', error);
          setStage('home');
        }
      };

      void finishSplash();
    }, SPLASH_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const openFrom = (from: Stage, to: Stage) => {
    setPreviousStage(from);
    setStage(to);
  };

  useEffect(() => {
    const onHardwareBack = () => {
      if (stage === 'about' || stage === 'themes') {
        setStage(previousStage);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [stage, previousStage]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.bg}]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      {/* Background art runs edge to edge, behind the system bars... */}
      <ParticleBackground />
      {/* ...while the content stays clear of them. */}
      <View
        style={[styles.fill, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
        {stage === 'splash' && <SplashScreen />}
        {stage === 'onboarding' && (
          <FadeIn key="onboarding" style={styles.fill}>
            <OnboardingScreen onContinue={() => setStage('home')} />
          </FadeIn>
        )}
        {stage === 'home' && (
          <FadeIn key="home" style={styles.fill} from={24}>
            <HomeScreen
              onAbout={() => openFrom('home', 'about')}
              onThemes={() => openFrom('home', 'themes')}
            />
          </FadeIn>
        )}
        {stage === 'about' && (
          <FadeIn key="about" style={styles.fill} from={40} scaleFrom={1}>
            <AboutScreen onBack={() => setStage(previousStage)} />
          </FadeIn>
        )}
        {stage === 'themes' && (
          <FadeIn key="themes" style={styles.fill} from={40} scaleFrom={1}>
            <ThemeScreen onBack={() => setStage(previousStage)} />
          </FadeIn>
        )}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {backgroundColor: fadeFrom.color, opacity: fade}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  fill: {flex: 1},
});
