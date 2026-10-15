import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {
  AdsConsent,
  AdsConsentStatus,
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import {BANNER_AD_UNIT_ID} from '../lib/adUnits';
import {useTheme} from '../lib/ThemeContext';

export default function AdBanner() {
  const {theme} = useTheme();
  const [failed, setFailed] = useState(false);
  const [personalised, setPersonalised] = useState(false);
  const [ready, setReady] = useState(false);

  // No fill is common (new ad units, low inventory) - try again later
  // instead of leaving the slot empty until the next launch.
  useEffect(() => {
    if (!failed) return;
    const t = setTimeout(() => setFailed(false), 45000);
    return () => clearTimeout(t);
  }, [failed]);

  useEffect(() => {
    let alive = true;

    (async () => {
      let status = AdsConsentStatus.UNKNOWN;

      try {
        // App startup (ensureAdsConsentAndInit) owns presenting the consent
        // form. Here we only refresh and read the status, so the form can
        // never be shown twice.
        status = (await AdsConsent.requestInfoUpdate()).status;
      } catch {
        // Consent failures must not remove the ad slot.
      }

      // Only regions that actually run the form store an IABTCF string.
      // Elsewhere it is null and getUserChoices() throws parsing it, so ask
      // only once consent has genuinely been obtained.
      if (status === AdsConsentStatus.OBTAINED) {
        try {
          const choices = await AdsConsent.getUserChoices();
          if (alive) setPersonalised(Boolean(choices.selectPersonalisedAds));
        } catch {
          if (alive) setPersonalised(false);
        }
      } else if (alive) {
        setPersonalised(status === AdsConsentStatus.NOT_REQUIRED);
      }

      if (alive) setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={[styles.wrap, {backgroundColor: theme.colors.bg}]}>
      {ready && !failed && (
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{requestNonPersonalizedAdsOnly: !personalised}}
          onAdFailedToLoad={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
