import {
  AdEventType,
  AdsConsent,
  AdsConsentStatus,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import {INTERSTITIAL_AD_UNIT_ID} from './adUnits';

/**
 * One interstitial, shown once when a silence session completes.
 *
 * It is preloaded near the end of a session so it is ready the moment the
 * "Sound restored" screen appears. Loaded ads go stale after an hour, so an
 * old one is thrown away and fetched again.
 */

const MAX_AGE_MS = 50 * 60 * 1000;

let ad: InterstitialAd | null = null;
let loadedAt = 0;
let loading = false;
let unsubscribe: (() => void) | null = null;

async function personalisedAllowed(): Promise<{canRequest: boolean; personalised: boolean}> {
  try {
    const info = await AdsConsent.getConsentInfo();
    if (!info.canRequestAds) return {canRequest: false, personalised: false};
    if (info.status === AdsConsentStatus.OBTAINED) {
      try {
        const choices = await AdsConsent.getUserChoices();
        return {canRequest: true, personalised: Boolean(choices.selectPersonalisedAds)};
      } catch {
        return {canRequest: true, personalised: false};
      }
    }
    return {canRequest: true, personalised: info.status === AdsConsentStatus.NOT_REQUIRED};
  } catch {
    // Consent lookup failing should not block a non-personalised ad.
    return {canRequest: true, personalised: false};
  }
}

function isFresh(): boolean {
  return !!ad?.loaded && Date.now() - loadedAt < MAX_AGE_MS;
}

export async function preloadInterstitial(): Promise<void> {
  if (loading || isFresh()) return;
  loading = true;
  try {
    const {canRequest, personalised} = await personalisedAllowed();
    if (!canRequest) {
      loading = false;
      return;
    }

    unsubscribe?.();
    const next = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: !personalised,
    });
    unsubscribe = next.addAdEventsListener(({type}) => {
      if (type === AdEventType.LOADED) {
        loadedAt = Date.now();
        loading = false;
      } else if (type === AdEventType.ERROR) {
        loading = false;
      } else if (type === AdEventType.CLOSED) {
        ad = null;
      }
    });
    ad = next;
    next.load();
  } catch {
    loading = false;
  }
}

/** Shows the ad if one is ready. Returns whether it was shown. */
export function showInterstitialIfReady(): boolean {
  if (!isFresh() || !ad) return false;
  ad.show().catch(() => {});
  return true;
}
