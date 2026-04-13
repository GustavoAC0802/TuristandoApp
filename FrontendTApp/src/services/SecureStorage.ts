import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token: 'turistando_token',
  refreshToken: 'turistando_refresh_token',
  biometricEnabled: 'turistando_biometric_enabled',
};

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

export async function saveSession(params: {
  token: string;
  refreshToken?: string;
}) {
  await SecureStore.setItemAsync(KEYS.token, params.token, OPTIONS);

  if (params.refreshToken) {
    await SecureStore.setItemAsync(
      KEYS.refreshToken,
      params.refreshToken,
      OPTIONS
    );
  }
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(KEYS.token, token, OPTIONS);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(KEYS.token);
  await SecureStore.deleteItemAsync(KEYS.refreshToken);
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.token),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.biometricEnabled),
  ]);
}

export async function setBiometricEnabled(enabled: boolean) {
  await SecureStore.setItemAsync(
    KEYS.biometricEnabled,
    String(enabled),
    OPTIONS
  );
}

export async function getBiometricEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEYS.biometricEnabled);
  return value === 'true';
}

export async function clearBiometricEnabled() {
  await SecureStore.deleteItemAsync(KEYS.biometricEnabled);
}