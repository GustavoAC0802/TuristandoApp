import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightSensor } from 'expo-sensors';

import './src/i18n';
import i18n from './src/i18n';
import { store } from './src/store';
import Routes from './src/navigation/routes';
import type { RootState } from './src/store';
import { useRestoreSession } from './src/hooks/useRestoreSession';
import {
  setAutoThemeMode,
  setTheme,
  type ThemeMode,
} from './src/slices/themeSlice';

import OnboardingScreen from './src/screens/Onboard';
import { shouldShowOnboarding } from './src/storage/OnboardStorage';

const STORAGE_KEYS = {
  language: 'turistando_app_language',
  theme: 'turistando_app_theme',
};

type LightSensorData = {
  illuminance: number;
};

type SensorSubscription = {
  remove: () => void;
};

function AutoThemeController() {
  const dispatch = useDispatch();

  const preference = useSelector((state: RootState) => state.theme.preference);
  const currentTheme = useSelector((state: RootState) => state.theme.mode);

  const lastThemeRef = useRef<ThemeMode>(currentTheme);

  useEffect(() => {
    lastThemeRef.current = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    if (preference !== 'auto') {
      console.log('Tema automático desligado. Preferência atual:', preference);
      return;
    }

    console.log('Tema automático ligado. Iniciando LightSensor...');

    let subscription: SensorSubscription | null = null;

    async function startLightSensor() {
      try {
        const available = await LightSensor.isAvailableAsync();

        console.log('LightSensor disponível:', available);

        if (!available) {
          console.log('Sensor de luz não disponível neste dispositivo.');
          return;
        }

        LightSensor.setUpdateInterval(1000);

        subscription = LightSensor.addListener((data: LightSensorData) => {
          const { illuminance } = data;

          console.log('Luminosidade:', illuminance);

          let nextTheme: ThemeMode | null = null;

          if (illuminance <= 25) {
            nextTheme = 'dark';
          }

          if (illuminance >= 60) {
            nextTheme = 'light';
          }

          if (nextTheme && nextTheme !== lastThemeRef.current) {
            console.log('Alterando tema automático para:', nextTheme);

            lastThemeRef.current = nextTheme;
            dispatch(setAutoThemeMode(nextTheme));
          }
        });
      } catch (error) {
        console.log('Erro ao iniciar sensor de luz:', error);
      }
    }

    startLightSensor();

    return () => {
      console.log('Parando LightSensor...');

      if (subscription) {
        subscription.remove();
      }
    };
  }, [dispatch, preference]);

  return null;
}

function AppContent() {
  const dispatch = useDispatch();

  const theme = useSelector((state: RootState) => state.theme.mode);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useRestoreSession();

  useEffect(() => {
    console.log('USER DO REDUX:', user);
  }, [user]);

  useEffect(() => {
    loadSavedLanguage();
    loadSavedTheme();
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [user]);

  async function checkOnboarding() {
    try {
      console.log('checkOnboarding user:', user);

      if (!user?._id) {
        setShowOnboarding(false);
        setCheckingOnboarding(false);
        return;
      }

      const shouldShow = await shouldShowOnboarding(user._id);

      console.log('shouldShowOnboarding:', shouldShow);
      setShowOnboarding(shouldShow);
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      setShowOnboarding(false);
    } finally {
      setCheckingOnboarding(false);
    }
  }

  async function loadSavedLanguage() {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.language);

      if (savedLanguage === 'pt' || savedLanguage === 'en' || savedLanguage === 'es') {
        await i18n.changeLanguage(savedLanguage);
      } else {
        await i18n.changeLanguage('pt');
      }
    } catch (error) {
      console.error('Erro ao carregar idioma salvo:', error);
      await i18n.changeLanguage('pt');
    } finally {
      setLanguageLoaded(true);
    }
  }

  async function loadSavedTheme() {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.theme);

      console.log('Tema salvo no AsyncStorage:', savedTheme);

      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
        dispatch(setTheme(savedTheme));
      } else {
        dispatch(setTheme('light'));
      }
    } catch (error) {
      console.error('Erro ao carregar tema salvo:', error);
      dispatch(setTheme('light'));
    } finally {
      setThemeLoaded(true);
    }
  }

  if (isLoading || !languageLoaded || !themeLoaded || checkingOnboarding) {
    return (
      <SafeAreaProvider>
        <AutoThemeController />

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
          }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (user?._id && showOnboarding) {
    return (
      <SafeAreaProvider>
        <AutoThemeController />

        <OnboardingScreen
          userId={user._id}
          onFinish={() => setShowOnboarding(false)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AutoThemeController />

      <View
        style={{
          flex: 1,
          backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
        }}
      >
        <Routes />
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}