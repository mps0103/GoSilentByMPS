import {
  AdsConsent,
  AdsConsentStatus,
  MobileAds,
} from 'react-native-google-mobile-ads';

/**
 * Shows Google's consent form when required (EEA/UK users, and CCPA-relevant
 * US users depending on your AdMob account settings), then initializes the
 * Mobile Ads SDK. Call this once, early in the app's life, before any
 * <BannerAd> mounts.
 *
 * Safe to call even where consent isn't required - requestInfoUpdate()
 * returns REQUIRED only for regions where the law applies; everywhere else
 * this just initializes ads normally.
 */
export async function ensureAdsConsentAndInit(): Promise<void> {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();

    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.showForm();
    }
  } catch (e) {
    // Non-fatal - if the consent check fails (e.g. no network on first
    // launch), fall through and initialize ads anyway rather than blocking
    // the app from starting.
    console.warn('Ads consent flow did not complete:', e);
  }

  await MobileAds().initialize();
}
