import 'dotenv/config';

export default {
  expo: {
    name: 'FrontendTApp',
    slug: 'FrontendTApp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    scheme: 'frontendtapp',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    plugins: [
      'expo-font',
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'Permita que o Turistando use sua biometria para entrar no app.',
        },
      ],
      [
        'expo-secure-store',
        {
          configureAndroidBackup: true,
          faceIDPermission:
            'Permita que o Turistando proteja sua sessão com biometria.',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            newArchEnabled: false,
          },
          ios: {
            newArchEnabled: false,
          },
        },
      ],
      [
        '@morrowdigital/watermelondb-expo-plugin',
        {
          disableJsi: true,
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'automatic',
    },
    android: {
      package: 'com.gustavo.turistandoapp',
      softwareKeyboardLayoutMode: 'resize',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      userInterfaceStyle: 'automatic',
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      apiUrl: process.env.API_URL,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
};