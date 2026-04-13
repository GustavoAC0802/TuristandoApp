import AsyncStorage from '@react-native-async-storage/async-storage';

const getOnboardingKey = (userId: string) =>
  `@turistando_onboarding_hidden:${userId}`;

export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;

    const value = await AsyncStorage.getItem(getOnboardingKey(userId));

    if (value === null) return true;

    return value !== 'true';
  } catch (error) {
    console.error('Erro ao ler onboarding:', error);
    return true;
  }
}

export async function hideOnboardingForever(userId: string): Promise<void> {
  try {
    if (!userId) return;

    await AsyncStorage.setItem(getOnboardingKey(userId), 'true');
  } catch (error) {
    console.error('Erro ao salvar onboarding:', error);
  }
}

export async function resetOnboarding(userId: string): Promise<void> {
  try {
    if (!userId) return;

    await AsyncStorage.removeItem(getOnboardingKey(userId));
  } catch (error) {
    console.error('Erro ao resetar onboarding:', error);
  }
}