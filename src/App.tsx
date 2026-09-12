import React, {useEffect, useState} from 'react';
import {BackHandler, StatusBar, StyleSheet, View} from 'react-native';
import ParticleBackground from './components/ParticleBackground';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import {getPermissionState} from './native/SilenceTimer';
import {ensureAdsConsentAndInit} from './lib/consent';
import {colors} from './theme';

type Stage = 'splash' | 'onboarding' | 'home' | 'about';

const SPLASH_DELAY_MS = 900;
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
  const [stage, setStage] = useState<Stage>('splash');
  // Remembers whether we came from onboarding or home, so "back" from
  // About returns to wherever the user actually was.
  const [previousStage, setPreviousStage] = useState<Stage>('home');

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

  const openAbout = (from: Stage) => {
    setPreviousStage(from);
    setStage('about');
  };

  useEffect(() => {
    const onHardwareBack = () => {
      if (stage === 'about') {
        setStage(previousStage);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [stage, previousStage]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ParticleBackground />
      {stage === 'splash' && <SplashScreen />}
      {stage === 'onboarding' && (
        <OnboardingScreen onContinue={() => setStage('home')} />
      )}
      {stage === 'home' && <HomeScreen onAbout={() => openAbout('home')} />}
      {stage === 'about' && (
        <AboutScreen onBack={() => setStage(previousStage)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
});
