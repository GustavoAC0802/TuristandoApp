import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../services/api';
import {
  getBiometricEnabled,
  getToken,
  saveToken,
} from '../services/SecureStorage';
import { getLastEmail, saveLastEmail } from '../services/AppStorage';
import { loginSuccess } from '../slices/authSlice';

const TOKEN_STORAGE_KEYS = [
  'token',
  '@turistando:token',
  'authToken',
  '@auth:token',
];

async function saveAuthTokenEverywhere(token: string) {
  await saveToken(token);

  await Promise.all(
    TOKEN_STORAGE_KEYS.map((key) => AsyncStorage.setItem(key, token))
  );
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);

  useEffect(() => {
    checkBiometryAvailability();
    loadLastEmail();
  }, []);

  async function loadLastEmail() {
    const savedEmail = await getLastEmail();
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }

  async function checkBiometryAvailability() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometryAvailable(hasHardware && isEnrolled);
    } catch {
      setBiometryAvailable(false);
    }
  }

  async function getUserProfile(token?: string) {
    const response = await api.get('/users/me', {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    });

    return response.data;
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('login.alerts.fillEmailPassword'));
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/users/login', {
        email: email.trim(),
        password: password.trim(),
      });

      const token =
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.jwt;

      if (!token) {
        console.log('LOGIN RESPONSE SEM TOKEN:', response?.data);
        throw new Error(t('login.alerts.tokenNotReceived'));
      }

      await saveAuthTokenEverywhere(token);
      await saveLastEmail(email.trim());

      const userData = await getUserProfile(token);

      dispatch(
        loginSuccess({
          token,
          user: userData,
        })
      );

      setPassword('');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('login.alerts.loginError');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    try {
      setLoading(true);

      const biometricEnabled = await getBiometricEnabled();
      const savedToken = await getToken();

      if (!biometricEnabled) {
        Alert.alert(
          t('login.biometrics.disabledTitle'),
          t('login.biometrics.disabledMessage')
        );
        return;
      }

      if (!savedToken) {
        Alert.alert(
          t('login.biometrics.sessionNotFoundTitle'),
          t('login.biometrics.sessionNotFoundMessage')
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('login.biometrics.promptMessage'),
        cancelLabel: t('common.cancel'),
        fallbackLabel: t('login.biometrics.usePassword'),
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return;
      }

      await saveAuthTokenEverywhere(savedToken);

      const userData = await getUserProfile(savedToken);

      dispatch(
        loginSuccess({
          token: savedToken,
          user: userData,
        })
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('login.alerts.biometricLoginError');
      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('login.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{t('login.passwordLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.passwordPlaceholder')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t('login.loading') : t('login.enter')}
              </Text>
            </TouchableOpacity>

            {biometryAvailable && (
              <TouchableOpacity
                style={[styles.biometryButton, loading && styles.buttonDisabled]}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Text style={styles.biometryButtonText}>
                  {loading
                    ? t('login.biometricLoading')
                    : t('login.biometricButton')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{t('login.createAccountLink')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#AFC3F8',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  biometryButton: {
    backgroundColor: '#E5ECFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#AFC3F8',
  },
  biometryButtonText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    marginTop: 16,
    color: '#1E3A8A',
    textAlign: 'center',
    fontSize: 14,
  },
});