import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  lastEmail: 'turistando_last_email',
  theme: 'turistando_app_theme',
  language: 'turistando_app_language',
};

export async function saveLastEmail(email: string) {
  await AsyncStorage.setItem(KEYS.lastEmail, email);
}

export async function getLastEmail() {
  return await AsyncStorage.getItem(KEYS.lastEmail);
}

export async function clearLastEmail() {
  await AsyncStorage.removeItem(KEYS.lastEmail);
}

export async function saveTheme(theme: 'light' | 'dark') {
  await AsyncStorage.setItem(KEYS.theme, theme);
}

export async function getTheme() {
  return await AsyncStorage.getItem(KEYS.theme);
}

export async function saveLanguage(language: 'pt' | 'en' | 'es') {
  await AsyncStorage.setItem(KEYS.language, language);
}

export async function getLanguage() {
  return await AsyncStorage.getItem(KEYS.language);
}