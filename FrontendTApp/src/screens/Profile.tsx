import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import type { RootState } from '../store';
import { logout } from '../slices/authSlice';
import { setTheme, type ThemePreference } from '../slices/themeSlice';
import {
  clearSession,
  getBiometricEnabled,
  setBiometricEnabled,
} from '../services/SecureStorage';

type Language = 'pt' | 'en' | 'es';

const STORAGE_KEYS = {
  language: 'turistando_app_language',
  theme: 'turistando_app_theme',
};

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();

  const user = useSelector((state: RootState) => state.auth.user);
  const currentTheme = useSelector((state: RootState) => state.theme.mode);
  const themePreference = useSelector((state: RootState) => state.theme.preference);

  const email = user?.email || 'email@exemplo.com';
  const name = user?.name || t('profile.defaultUserName');

  const [biometricEnabledState, setBiometricEnabledState] = useState(false);
  const [language, setLanguageState] = useState<Language>('pt');

  const isDark = currentTheme === 'dark';
  const initials = useMemo(() => getInitials(name), [name]);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const biometricValue = await getBiometricEnabled();
      const languageValue = await AsyncStorage.getItem(STORAGE_KEYS.language);
      const themeValue = await AsyncStorage.getItem(STORAGE_KEYS.theme);

      setBiometricEnabledState(biometricValue);

      if (languageValue === 'pt' || languageValue === 'en' || languageValue === 'es') {
        setLanguageState(languageValue);
        await i18n.changeLanguage(languageValue);
      }

      if (themeValue === 'light' || themeValue === 'dark' || themeValue === 'auto') {
        dispatch(setTheme(themeValue));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('profile.alerts.loadPreferencesError'));
    }
  }

  async function handleBiometricChange(value: boolean) {
    try {
      if (value) {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (!compatible) {
          Alert.alert(t('profile.biometrics.title'), t('profile.alerts.noBiometricSupport'));
          return;
        }

        if (!enrolled) {
          Alert.alert(t('profile.biometrics.title'), t('profile.alerts.noBiometricRegistered'));
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: t('profile.biometrics.confirmActivation'),
          cancelLabel: t('common.cancel'),
          fallbackLabel: t('profile.biometrics.usePassword'),
        });

        if (!result.success) {
          Alert.alert(t('profile.biometrics.title'), t('profile.alerts.biometricEnableError'));
          return;
        }
      }

      await setBiometricEnabled(value);
      setBiometricEnabledState(value);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('profile.alerts.saveBiometricError'));
    }
  }

  async function handleLanguageChange(value: Language) {
    try {
      setLanguageState(value);
      await AsyncStorage.setItem(STORAGE_KEYS.language, value);
      await i18n.changeLanguage(value);

      Alert.alert(
        t('profile.language.title'),
        t('profile.alerts.languageChanged', {
          language: getLanguageLabel(value, t),
        })
      );
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
      Alert.alert(t('common.error'), t('profile.alerts.saveLanguageError'));
    }
  }

  async function handleThemeChange(value: ThemePreference) {
    try {
      dispatch(setTheme(value));
      await AsyncStorage.setItem(STORAGE_KEYS.theme, value);

      Alert.alert(
        t('profile.theme.title'),
        t('profile.alerts.themeChanged', {
          theme: getThemeLabel(value, t),
        })
      );
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
      Alert.alert(t('common.error'), t('profile.alerts.saveThemeError'));
    }
  }

  async function handleLogout() {
    try {
      await clearSession();
      dispatch(logout());
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
      Alert.alert(t('common.error'), t('profile.alerts.logoutError'));
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
          {t('profile.title')}
        </Text>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {name}
          </Text>

          <Text style={[styles.email, { color: isDark ? '#CBD5E1' : '#64748B' }]}>
            {email}
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {t('profile.preferences.title')}
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextBox}>
              <Text style={[styles.preferenceTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {t('profile.biometrics.loginWithBiometrics')}
              </Text>

              <Text
                style={[
                  styles.preferenceSubtitle,
                  { color: isDark ? '#CBD5E1' : '#64748B' },
                ]}
              >
                {t('profile.biometrics.description')}
              </Text>
            </View>

            <Switch
              value={biometricEnabledState}
              onValueChange={handleBiometricChange}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={biometricEnabledState ? '#1D4ED8' : '#F8FAFC'}
            />
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={[styles.preferenceTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {t('profile.language.title')}
            </Text>

            <View style={styles.optionRow}>
              <OptionButton
                label={t('profile.language.portuguese')}
                active={language === 'pt'}
                isDark={isDark}
                onPress={() => handleLanguageChange('pt')}
              />

              <OptionButton
                label={t('profile.language.english')}
                active={language === 'en'}
                isDark={isDark}
                onPress={() => handleLanguageChange('en')}
              />

              <OptionButton
                label={t('profile.language.spanish')}
                active={language === 'es'}
                isDark={isDark}
                onPress={() => handleLanguageChange('es')}
              />
            </View>
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={[styles.preferenceTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {t('profile.theme.title')}
            </Text>

            <Text
              style={[
                styles.preferenceSubtitle,
                { color: isDark ? '#CBD5E1' : '#64748B' },
              ]}
            >
              {themePreference === 'auto'
                ? 'O app alterna o tema automaticamente conforme a luminosidade.'
                : 'Escolha o tema visual do aplicativo.'}
            </Text>

            <View style={styles.optionRow}>
              <OptionButton
                label={t('profile.theme.light')}
                active={themePreference === 'light'}
                isDark={isDark}
                onPress={() => handleThemeChange('light')}
              />

              <OptionButton
                label={t('profile.theme.dark')}
                active={themePreference === 'dark'}
                isDark={isDark}
                onPress={() => handleThemeChange('dark')}
              />

              <OptionButton
                label={getThemeLabel('auto', t)}
                active={themePreference === 'auto'}
                isDark={isDark}
                onPress={() => handleThemeChange('auto')}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionButton({
  label,
  active,
  isDark,
  onPress,
}: {
  label: string;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: active
            ? '#AFC3F8'
            : isDark
              ? '#334155'
              : '#E2E8F0',
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          { color: active ? '#1E3A8A' : isDark ? '#E2E8F0' : '#334155' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getLanguageLabel(language: Language, t: (key: string) => string) {
  if (language === 'pt') return t('profile.language.portuguese');
  if (language === 'en') return t('profile.language.english');
  return t('profile.language.spanish');
}

function getThemeLabel(theme: ThemePreference, t: (key: string) => string) {
  if (theme === 'light') return t('profile.theme.light');
  if (theme === 'dark') return t('profile.theme.dark');

  return 'Automático';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  profileCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#7C8FB3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },

  email: {
    fontSize: 14,
  },

  section: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  preferenceTextBox: {
    flex: 1,
    paddingRight: 14,
  },

  preferenceTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  preferenceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  preferenceBlock: {
    marginBottom: 18,
  },

  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },

  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  optionButtonText: {
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});