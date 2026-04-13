import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import './src/i18n';
import i18n from './src/i18n';
import { store } from './src/store';
import Routes from './src/navigation/routes';
import type { RootState } from './src/store';
import { useRestoreSession } from './src/hooks/useRestoreSession';

import OnboardingScreen from './src/screens/Onboard';
import { shouldShowOnboarding } from './src/storage/OnboardStorage';

const STORAGE_KEYS = {
  language: 'turistando_app_language',
};

function AppContent() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const user = useSelector((state: RootState) => state.auth.user);

  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useRestoreSession();

  useEffect(() => {
    console.log('USER DO REDUX:', user);
  }, [user]);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [user]);

  async function checkOnboarding() {
    try {
      console.log('checkOnboarding user:', user);

      if (!user?._id) {
        setShowOnboarding(false);
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

  if (isLoading || !languageLoaded || checkingOnboarding) {
    return (
      <SafeAreaProvider>
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
        <OnboardingScreen
          userId={user._id}
          onFinish={() => setShowOnboarding(false)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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