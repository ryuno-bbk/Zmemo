import { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

// Expo Go かどうかを判定
const isExpoGo = Constants.appOwnership === 'expo';

// 本番用バナーユニットID
const BANNER_AD_UNIT_ID = 'ca-app-pub-5685067595656519/2132331865';

// 動的インポート用の型
let BannerAd: any = null;
let BannerAdSize: any = null;

export function AdBanner() {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adModuleLoaded, setAdModuleLoaded] = useState(false);

  useEffect(() => {
    // Expo Go の場合はスキップ
    if (isExpoGo) {
      setAdError(true);
      return;
    }

    // 開発ビルドの場合のみ AdMob モジュールをロード
    try {
      const admob = require('react-native-google-mobile-ads');
      BannerAd = admob.BannerAd;
      BannerAdSize = admob.BannerAdSize;
      setAdModuleLoaded(true);
    } catch (error) {
      console.log('[AdBanner] AdMob module not available:', error);
      setAdError(true);
    }
  }, []);

  // Expo Go またはモジュールロード失敗時はプレースホルダー表示
  if (isExpoGo || adError || !adModuleLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.spacer} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>広告表示エリア</Text>
          <Text style={styles.errorSubLabel}>
            {isExpoGo ? '（Expo Go では表示されません）' : '（読み込み失敗）'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 隙間を作るためのスペーサー */}
      <View style={styles.spacer} />
      
      {!adLoaded && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingLabel}>広告読み込み中...</Text>
        </View>
      )}
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('[AdBanner] Ad loaded successfully');
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error: any) => {
          console.error('[AdBanner] Ad failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
  },
  spacer: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  errorContainer: {
    height: 50,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  errorLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorSubLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  loadingContainer: {
    height: 50,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  loadingLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

