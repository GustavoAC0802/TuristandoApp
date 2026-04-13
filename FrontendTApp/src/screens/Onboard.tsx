import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { hideOnboardingForever } from '../storage/OnboardStorage';

type OnboardingScreenProps = {
  userId: string;
  onFinish: () => void;
};

export default function OnboardingScreen({
  userId,
  onFinish,
}: OnboardingScreenProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const onboardingRef = useRef<any>(null);

  const totalPages = 3;
  const isLastPage = currentPage === totalPages - 1;

  const handleFinish = async () => {
    try {
      await hideOnboardingForever(userId);
      onFinish();
    } catch (error) {
      console.error('Erro ao finalizar onboarding:', error);
      onFinish();
    }
  };

  const handleSkip = async () => {
    try {
      if (dontShowAgain) {
        await hideOnboardingForever(userId);
      }
      onFinish();
    } catch (error) {
      console.error('Erro ao pular onboarding:', error);
      onFinish();
    }
  };

  const handleNext = () => {
    if (isLastPage) {
      handleFinish();
      return;
    }

    onboardingRef.current?.goNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topArea}>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={handleSkip} style={styles.topButton}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.topButton}>
            <Text style={styles.nextText}>
              {isLastPage ? 'Finalizar' : 'Próximo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable
          style={styles.rememberCard}
          onPress={() => setDontShowAgain((prev) => !prev)}
        >
          <View
            style={[
              styles.checkbox,
              dontShowAgain && styles.checkboxChecked,
            ]}
          >
            {dontShowAgain && <Text style={styles.check}>✓</Text>}
          </View>

          <View style={styles.rememberTextArea}>
            <Text style={styles.rememberTitle}>Não mostrar novamente</Text>
            <Text style={styles.rememberSubtitle}>
              Ocultar este onboarding nas próximas vezes
            </Text>
          </View>
        </Pressable>
      </View>

      <Onboarding
        ref={onboardingRef}
        onSkip={handleSkip}
        onDone={handleFinish}
        pageIndexCallback={setCurrentPage}
        showSkip={false}
        showNext={false}
        showDone={false}
        bottomBarHeight={70}
        pages={[
          {
            backgroundColor: '#ffffff',
            title: 'Explore o mapa',
            subtitle:
              'Encontre pontos turísticos, restaurantes, museus e muito mais ao seu redor.',
            image: <Text style={styles.emoji}>🗺️</Text>,
          },
          {
            backgroundColor: '#f5f7ff',
            title: 'Favorite lugares',
            subtitle:
              'Salve seus locais preferidos para acessar depois com mais rapidez.',
            image: <Text style={styles.emoji}>⭐</Text>,
          },
          {
            backgroundColor: '#eefbf3',
            title: 'Crie roteiros',
            subtitle:
              'Monte seus próprios roteiros e organize melhor sua viagem.',
            image: <Text style={styles.emoji}>📍</Text>,
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topArea: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  topButton: {
    marginTop:20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  rememberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  check: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rememberTextArea: {
    flex: 1,
  },
  rememberTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rememberSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  emoji: {
    fontSize: 72,
  },
});