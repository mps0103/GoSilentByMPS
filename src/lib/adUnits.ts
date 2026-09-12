import {Platform} from 'react-native';
import {TestIds} from 'react-native-google-mobile-ads';

export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      android: 'ca-app-pub-2904788540387890/5304328339',
      default: '',
    })!;
