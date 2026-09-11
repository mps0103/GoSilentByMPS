import React from 'react';
import {StyleSheet, View} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {BANNER_AD_UNIT_ID} from '../lib/adUnits';
import {colors} from '../theme';

export default function AdBanner() {
  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{requestNonPersonalizedAdsOnly: false}}
        onAdLoaded={() => {
          console.log('[AdBanner] loaded OK unitId=', BANNER_AD_UNIT_ID);
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('[AdBanner] FAILED code=', error?.code, 'message=', error?.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    paddingVertical: 4,
    minHeight: 60,
  },
});
