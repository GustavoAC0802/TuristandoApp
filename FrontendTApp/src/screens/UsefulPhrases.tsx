import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import api from '../services/api';

type AppLanguage = 'pt' | 'en' | 'es';

type Language = {
  code: AppLanguage;
  label: string;
  flag: string;
};

type Phrase = {
  id: string;
  category: {
    pt: string;
    en: string;
    es: string;
  };
  text: {
    pt: string;
    en: string;
    es: string;
  };
};

const allLanguages: Language[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
];

const uiText = {
  pt: {
    title: 'Tradutor turístico',
    subtitle: 'Traduza frases úteis para se comunicar melhor durante sua viagem.',
    targetLanguage: 'Idioma de destino',
    category: 'Categoria',
    usefulPhrases: 'Frases úteis',
    all: 'Todas',
    originalLanguage: 'Português',
    translateTo: 'Traduzir para',
    translationIn: 'Tradução em',
    provider: 'Traduzido pelo backend',
    fallbackProvider: 'Tradução local de segurança',
    errorTitle: 'Erro na tradução',
    errorMessage:
      'Não foi possível consultar o backend. A tradução local foi utilizada.',
  },
  en: {
    title: 'Tourist translator',
    subtitle: 'Translate useful phrases to communicate better during your trip.',
    targetLanguage: 'Target language',
    category: 'Category',
    usefulPhrases: 'Useful phrases',
    all: 'All',
    originalLanguage: 'English',
    translateTo: 'Translate to',
    translationIn: 'Translation in',
    provider: 'Translated by backend',
    fallbackProvider: 'Local backup translation',
    errorTitle: 'Translation error',
    errorMessage:
      'Could not reach the backend. Local translation was used.',
  },
  es: {
    title: 'Traductor turístico',
    subtitle: 'Traduce frases útiles para comunicarte mejor durante tu viaje.',
    targetLanguage: 'Idioma de destino',
    category: 'Categoría',
    usefulPhrases: 'Frases útiles',
    all: 'Todas',
    originalLanguage: 'Español',
    translateTo: 'Traducir a',
    translationIn: 'Traducción en',
    provider: 'Traducido por el backend',
    fallbackProvider: 'Traducción local de respaldo',
    errorTitle: 'Error de traducción',
    errorMessage:
      'No fue posible consultar el backend. Se utilizó la traducción local.',
  },
};

const phrases: Phrase[] = [
  {
    id: 'bathroom',
    category: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
    text: {
      pt: 'Onde fica o banheiro?',
      en: 'Where is the bathroom?',
      es: '¿Dónde está el baño?',
    },
  },
  {
    id: 'help',
    category: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
    text: {
      pt: 'Você pode me ajudar?',
      en: 'Can you help me?',
      es: '¿Puedes ayudarme?',
    },
  },
  {
    id: 'hospital',
    category: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
    text: {
      pt: 'Onde fica o hospital mais próximo?',
      en: 'Where is the nearest hospital?',
      es: '¿Dónde está el hospital más cercano?',
    },
  },
  {
    id: 'police',
    category: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
    text: {
      pt: 'Preciso chamar a polícia.',
      en: 'I need to call the police.',
      es: 'Necesito llamar a la policía.',
    },
  },
  {
    id: 'lost',
    category: { pt: 'Emergência', en: 'Emergency', es: 'Emergencia' },
    text: {
      pt: 'Estou perdido. Pode me ajudar?',
      en: 'I am lost. Can you help me?',
      es: 'Estoy perdido. ¿Puedes ayudarme?',
    },
  },
  {
    id: 'menu',
    category: { pt: 'Restaurante', en: 'Restaurant', es: 'Restaurante' },
    text: {
      pt: 'Você tem o cardápio?',
      en: 'Do you have the menu?',
      es: '¿Tienes el menú?',
    },
  },
  {
    id: 'water',
    category: { pt: 'Restaurante', en: 'Restaurant', es: 'Restaurante' },
    text: {
      pt: 'Eu gostaria de uma água, por favor.',
      en: 'I would like some water, please.',
      es: 'Me gustaría un agua, por favor.',
    },
  },
  {
    id: 'bill',
    category: { pt: 'Restaurante', en: 'Restaurant', es: 'Restaurante' },
    text: {
      pt: 'A conta, por favor.',
      en: 'The bill, please.',
      es: 'La cuenta, por favor.',
    },
  },
  {
    id: 'noMeat',
    category: { pt: 'Restaurante', en: 'Restaurant', es: 'Restaurante' },
    text: {
      pt: 'Eu não como carne.',
      en: 'I do not eat meat.',
      es: 'No como carne.',
    },
  },
  {
    id: 'bus',
    category: { pt: 'Transporte', en: 'Transport', es: 'Transporte' },
    text: {
      pt: 'Onde pego o ônibus?',
      en: 'Where can I take the bus?',
      es: '¿Dónde puedo tomar el autobús?',
    },
  },
  {
    id: 'station',
    category: { pt: 'Transporte', en: 'Transport', es: 'Transporte' },
    text: {
      pt: 'Onde fica a estação mais próxima?',
      en: 'Where is the nearest station?',
      es: '¿Dónde está la estación más cercana?',
    },
  },
  {
    id: 'taxi',
    category: { pt: 'Transporte', en: 'Transport', es: 'Transporte' },
    text: {
      pt: 'Quanto custa uma corrida até o centro?',
      en: 'How much is a ride to downtown?',
      es: '¿Cuánto cuesta un viaje al centro?',
    },
  },
  {
    id: 'hotelReservation',
    category: { pt: 'Hotel', en: 'Hotel', es: 'Hotel' },
    text: {
      pt: 'Tenho uma reserva em meu nome.',
      en: 'I have a reservation under my name.',
      es: 'Tengo una reserva a mi nombre.',
    },
  },
  {
    id: 'checkin',
    category: { pt: 'Hotel', en: 'Hotel', es: 'Hotel' },
    text: {
      pt: 'Que horas posso fazer o check-in?',
      en: 'What time can I check in?',
      es: '¿A qué hora puedo hacer el check-in?',
    },
  },
  {
    id: 'wifi',
    category: { pt: 'Hotel', en: 'Hotel', es: 'Hotel' },
    text: {
      pt: 'Qual é a senha do Wi-Fi?',
      en: 'What is the Wi-Fi password?',
      es: '¿Cuál es la contraseña del Wi-Fi?',
    },
  },
  {
    id: 'price',
    category: { pt: 'Compras', en: 'Shopping', es: 'Compras' },
    text: {
      pt: 'Quanto custa isso?',
      en: 'How much does this cost?',
      es: '¿Cuánto cuesta esto?',
    },
  },
  {
    id: 'card',
    category: { pt: 'Compras', en: 'Shopping', es: 'Compras' },
    text: {
      pt: 'Vocês aceitam cartão?',
      en: 'Do you accept card?',
      es: '¿Aceptan tarjeta?',
    },
  },
  {
    id: 'discount',
    category: { pt: 'Compras', en: 'Shopping', es: 'Compras' },
    text: {
      pt: 'Você pode fazer um desconto?',
      en: 'Can you give me a discount?',
      es: '¿Puedes hacerme un descuento?',
    },
  },
];

function getAppLanguage(language: string): AppLanguage {
  const normalized = language.split('-')[0].toLowerCase();

  if (normalized === 'en') return 'en';
  if (normalized === 'es') return 'es';

  return 'pt';
}

function getLanguageLabel(code: AppLanguage) {
  return allLanguages.find((language) => language.code === code)?.label || code;
}

function getLocalTranslation(phrase: Phrase, target: AppLanguage) {
  return phrase.text[target];
}

async function requestTranslation(payload: {
  text: string;
  source: AppLanguage;
  target: AppLanguage;
}) {
  try {
    return await api.post('/translation', payload, {
      timeout: 8000,
    });
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 404) {
      return api.post('/translation/translate', payload, {
        timeout: 8000,
      });
    }

    throw error;
  }
}

export default function UsefulPhrases() {
  const { i18n } = useTranslation();

  const appLanguage = getAppLanguage(i18n.language);
  const texts = uiText[appLanguage];

  const availableTargetLanguages = useMemo(() => {
    return allLanguages.filter((language) => language.code !== appLanguage);
  }, [appLanguage]);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    availableTargetLanguages[0]
  );
  const [selectedCategory, setSelectedCategory] = useState(texts.all);
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [translationProvider, setTranslationProvider] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedLanguage(availableTargetLanguages[0]);
    setSelectedCategory(texts.all);
    setSelectedPhraseId(null);
    setTranslatedText('');
    setTranslationProvider('');
  }, [appLanguage, availableTargetLanguages, texts.all]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(phrases.map((phrase) => phrase.category[appLanguage]))
    );

    return [texts.all, ...uniqueCategories];
  }, [appLanguage, texts.all]);

  const filteredPhrases = useMemo(() => {
    if (selectedCategory === texts.all) {
      return phrases;
    }

    return phrases.filter(
      (phrase) => phrase.category[appLanguage] === selectedCategory
    );
  }, [appLanguage, selectedCategory, texts.all]);

  async function handleTranslate(phrase: Phrase) {
    try {
      setLoading(true);
      setSelectedPhraseId(phrase.id);
      setTranslatedText('');
      setTranslationProvider('');

      try {
        const response = await requestTranslation({
          text: phrase.text[appLanguage],
          source: appLanguage,
          target: selectedLanguage.code,
        });

        const translated = response.data?.translatedText;

        if (!translated) {
          throw new Error('Resposta de tradução inválida.');
        }

        setTranslatedText(translated);
        setTranslationProvider(response.data?.provider || 'backend');
      } catch (error: any) {
        console.error(
          'Erro ao traduzir pelo backend. Usando tradução local:',
          error?.response?.data || error?.message || error
        );

        const localTranslation = getLocalTranslation(
          phrase,
          selectedLanguage.code
        );

        setTranslatedText(localTranslation);
        setTranslationProvider('local');

        Alert.alert(texts.errorTitle, texts.errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleChangeLanguage(language: Language) {
    setSelectedLanguage(language);
    setSelectedPhraseId(null);
    setTranslatedText('');
    setTranslationProvider('');
  }

  function handleChangeCategory(category: string) {
    setSelectedCategory(category);
    setSelectedPhraseId(null);
    setTranslatedText('');
    setTranslationProvider('');
  }

  function getProviderText() {
    if (translationProvider === 'fallback' || translationProvider === 'local') {
      return texts.fallbackProvider;
    }

    return texts.provider;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="language-outline" size={28} color="#2563eb" />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{texts.title}</Text>
          <Text style={styles.subtitle}>{texts.subtitle}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{texts.targetLanguage}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
      >
        {availableTargetLanguages.map((language) => {
          const active = selectedLanguage.code === language.code;

          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.chip, active && styles.activeChip]}
              onPress={() => handleChangeLanguage(language)}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {language.flag} {language.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>{texts.category}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipList}
      >
        {categories.map((category) => {
          const active = selectedCategory === category;

          return (
            <TouchableOpacity
              key={category}
              style={[styles.chip, active && styles.activeChip]}
              onPress={() => handleChangeCategory(category)}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>{texts.usefulPhrases}</Text>

      {filteredPhrases.map((phrase) => {
        const isSelected = selectedPhraseId === phrase.id;
        const isLoadingThisPhrase = loading && isSelected;

        return (
          <View key={phrase.id} style={styles.phraseCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {phrase.category[appLanguage]}
              </Text>
            </View>

            <Text style={styles.originalLabel}>{texts.originalLanguage}</Text>
            <Text style={styles.phraseText}>{phrase.text[appLanguage]}</Text>

            <TouchableOpacity
              style={[
                styles.translateButton,
                loading && styles.disabledButton,
              ]}
              onPress={() => handleTranslate(phrase)}
              disabled={loading}
            >
              {isLoadingThisPhrase ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color="#ffffff" />
                  <Text style={styles.translateButtonText}>
                    {texts.translateTo} {getLanguageLabel(selectedLanguage.code)}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {isSelected && translatedText ? (
              <View style={styles.translationBox}>
                <Text style={styles.translationLabel}>
                  {texts.translationIn} {getLanguageLabel(selectedLanguage.code)}
                </Text>

                <Text style={styles.translationText}>{translatedText}</Text>

                <Text style={styles.providerText}>{getProviderText()}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10,
    marginTop: 6,
  },
  chipList: {
    gap: 8,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  activeChip: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    color: '#334155',
    fontWeight: '800',
  },
  activeChipText: {
    color: '#ffffff',
  },
  phraseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '900',
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    marginBottom: 4,
  },
  phraseText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  translateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  translateButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  translationBox: {
    marginTop: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    marginBottom: 6,
  },
  translationText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  providerText: {
    marginTop: 8,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
});