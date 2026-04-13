import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import logo from '../assets/images/turistando.png';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B4079', '#3e8976', '#00814b']}
        start={{ x: 0.15, y: 0.05 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay} />

      <SafeAreaView style={styles.content}>
        <View style={styles.topSpacer} />

        <View style={styles.centerContent}>
          <Image source={logo} style={styles.logo} />

          <Text style={styles.title}>
            {t('welcome.titleLine1')}
            {'\n'}
            <Text style={styles.highlight}>{t('welcome.titleLine2')}</Text>
          </Text>

          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>{t('welcome.createAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>{t('welcome.hasAccount')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(62, 137, 118, 0.17)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  topSpacer: {
    height: 40,
  },

  centerContent: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 28,
    alignSelf: 'center',
  },

  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#13294B',
    textAlign: 'justify',
    marginBottom: 16,
  },

  highlight: {
    color: '#F0F3C8',
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 18,
    color: '#F5F7FA',
    textAlign: 'justify',
    lineHeight: 24,
  },

  buttonContainer: {
    width: '100%',
    marginTop: 20,
  },

  button: {
    backgroundColor: '#EEF1D6',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 18,
  },

  buttonText: {
    color: '#1F4788',
    fontWeight: '700',
    fontSize: 18,
  },

  link: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 15,
  },
});