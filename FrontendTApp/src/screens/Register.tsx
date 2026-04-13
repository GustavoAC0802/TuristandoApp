import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import api from '../services/api';

const interestOptions = [
  'history',
  'gastronomy',
  'adventure',
  'nature',
  'museums',
  'parks',
  'beaches',
  'events',
] as const;

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('register.alerts.fillFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('register.alerts.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);

      await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        interests,
      });

      Alert.alert(t('register.successTitle'), t('register.successMessage'));
      navigation.navigate('Login');
    } catch (error: any) {
      const message =
        error?.response?.data?.message || t('register.alerts.registerError');

      Alert.alert(t('common.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle')}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t('register.name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('register.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>{t('register.email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('register.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t('register.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('register.passwordPlaceholder')}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>{t('register.confirmPassword')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('register.confirmPasswordPlaceholder')}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Text style={styles.label}>{t('register.interests')}</Text>
          <View style={styles.interestsContainer}>
            {interestOptions.map((interest) => {
              const selected = interests.includes(interest);

              return (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestButton,
                    selected && styles.interestButtonSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      selected && styles.interestTextSelected,
                    ]}
                  >
                    {t(`register.interestOptions.${interest}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('register.loading') : t('register.createAccount')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>{t('register.footer')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
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

  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },

  interestButton: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  interestButtonSelected: {
    backgroundColor: '#A5B4FC',
    borderColor: '#A5B4FC',
  },

  interestText: {
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '500',
  },

  interestTextSelected: {
    color: '#FFFFFF',
  },

  button: {
    backgroundColor: '#AFC3F8',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 16,
  },

  footer: {
    marginTop: 28,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 14,
  },
});