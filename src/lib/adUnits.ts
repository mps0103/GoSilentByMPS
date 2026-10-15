import {Platform} from 'react-native';
import {TestIds} from 'react-native-google-mobile-ads';

/**
 * true = every build serves Google's test ads, for sideloaded test APKs.
 * MUST be false for anything uploaded to Play.
 */
const FORCE_TEST_ADS = false;

const useTestAds = __DEV__ || FORCE_TEST_ADS;

export const BANNER_AD_UNIT_ID = useTestAds
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      android: 'ca-app-pub-2904788540387890/5304328339',
      default: '',
    })!;

/**
 * TODO: replace with the real Interstitial unit id from AdMob
 * (Apps -> Go Silent by MPS -> Ad units -> Add ad unit -> Interstitial).
 * Until then release builds also serve Google's test interstitial, which is
 * safe but earns nothing.
 */
const INTERSTITIAL_RELEASE_ID = '';

export const INTERSTITIAL_AD_UNIT_ID =
  useTestAds || !INTERSTITIAL_RELEASE_ID ? TestIds.INTERSTITIAL : INTERSTITIAL_RELEASE_ID;
