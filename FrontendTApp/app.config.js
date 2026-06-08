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
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Permita que o Turistando use sua localização para mostrar locais próximos e enviar alertas de eventos.',
          locationAlwaysPermission:
            'Permita que o Turistando use sua localização em segundo plano para enviar alertas quando você estiver perto de eventos.',
          locationWhenInUsePermission:
            'Permita que o Turistando use sua localização para mostrar locais próximos.',
        },
      ],
      'expo-notifications',
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
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'POST_NOTIFICATIONS',
      ],
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
      API_URL: process.env.API_URL,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: '57347adb-f148-44df-aff1-60006189bd5b',
      },
    },
  },
};