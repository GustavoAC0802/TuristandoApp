import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Erro ao verificar biometria:', error);
    return false;
  }
}

export async function authenticateWithBiometrics() {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entrar no Turistando',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Erro ao autenticar com biometria:', error);
    return false;
  }
}