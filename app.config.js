import 'dotenv/config';

export default {
  expo: {
    name: '구해요 요기서',
    slug: 'guhaeyo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon_generated.png',
    userInterfaceStyle: 'light',
    android: {
      adaptiveIcon: {
        backgroundColor: '#4CAF50',
      },
      package: 'com.guhaeyo.jobai',
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.RECORD_AUDIO',
      ],
      minSdkVersion: 26,
    },
    plugins: [
      'expo-router',
      'expo-asset',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            '현재 위치 기반 일자리 추천을 위해 위치 정보가 필요합니다.',
        },
      ],
    ],
    scheme: 'guhaeyo',
    assetBundlePatterns: ['assets/**'],
    extra: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      router: { origin: false },
    },
  },
};
