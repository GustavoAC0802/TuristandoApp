import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ONBOARDING_KEY = '@turistando:onboarding_seen';

type IconName = keyof typeof Ionicons.glyphMap;

type SlideIconProps = {
  icon: IconName;
  title: string;
  description: string;
  dark: boolean;
};

function SlideIcon({ icon, title, description, dark }: SlideIconProps) {
  return (
    <View style={styles.slideIconContainer}>
      <View style={[styles.iconCircle, dark && styles.iconCircleDark]}>
        <Ionicons name={icon} size={58} color="#2563EB" />
      </View>

      <Text style={[styles.slideTitle, dark && styles.textDark]}>
        {title}
      </Text>

      <Text style={[styles.slideDescription, dark && styles.descriptionDark]}>
        {description}
      </Text>
    </View>
  );
}

function Dots({ selected }: { selected: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        selected ? styles.dotSelected : styles.dotDefault,
      ]}
    />
  );
}

function ButtonText({ children }: { children: string }) {
  return <Text style={styles.buttonText}>{children}</Text>;
}

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';

  async function finishOnboarding() {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.log('Erro ao salvar onboarding:', error);
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  }

  const backgroundColor = dark ? '#020617' : '#F8FAFC';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Onboarding
        onDone={finishOnboarding}
        onSkip={finishOnboarding}
        bottomBarHighlight={false}
        bottomBarColor={backgroundColor}
        DotComponent={Dots}
        NextButtonComponent={() => <ButtonText>Próximo</ButtonText>}
        SkipButtonComponent={() => <ButtonText>Pular</ButtonText>}
        DoneButtonComponent={() => <ButtonText>Começar</ButtonText>}
        pages={[
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="person-add-outline"
                title="Personalize sua experiência"
                description="Cadastre seus interesses turísticos para receber sugestões de locais que combinam com você."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="finger-print-outline"
                title="Login rápido e seguro"
                description="Entre no Turistando com biometria, usando impressão digital ou reconhecimento facial no seu dispositivo."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="map-outline"
                title="Explore pelo mapa"
                description="Veja pontos turísticos próximos, abra detalhes dos locais e use o mapa para descobrir novos destinos."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="search-outline"
                title="Busque, filtre e descubra"
                description="Encontre locais por categoria, avaliação, distância e use o modo perto de mim para ver opções próximas."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="information-circle-outline"
                title="Detalhes completos do local"
                description="Consulte fotos, horários, contato, site oficial, avaliações, acessibilidade, segurança e clima do destino."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="star-outline"
                title="Avalie e favorite locais"
                description="Comente, dê notas, salve seus favoritos e ajude outros turistas com suas experiências."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="navigate-outline"
                title="Rotas e compartilhamento"
                description="Abra rotas no mapa, compartilhe locais por link e envie seus destinos favoritos para amigos."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="calendar-outline"
                title="Eventos próximos"
                description="Veja eventos por data e localização, com notificações para não perder atrações perto de você."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="volume-high-outline"
                title="Guia de voz no passeio"
                description="Durante a visita, o app pode narrar informações sobre pontos próximos usando localização e voz."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="heart-circle-outline"
                title="Recomendações inteligentes"
                description="Receba sugestões baseadas nos seus check-ins, avaliações, histórico de buscas e categorias mais visitadas."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="checkmark-done-circle-outline"
                title="Check-in e conquistas"
                description="Marque locais visitados, acompanhe seu progresso e desbloqueie conquistas dentro do app."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="map-sharp"
                title="Crie seus roteiros"
                description="Monte itinerários personalizados por dias, reorganize locais e compartilhe seu roteiro em PDF."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="cloud-outline"
                title="Clima local"
                description="Veja a temperatura atual e a previsão dos próximos dias para planejar melhor seus passeios."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="language-outline"
                title="Idiomas e tradutor"
                description="Use o app em português, inglês ou espanhol e traduza frases úteis para viagens."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="moon-outline"
                title="Tema claro, escuro e automático"
                description="O app acompanha sua preferência de tema e melhora a visualização durante o uso noturno."
              />
            ),
            title: '',
            subtitle: '',
          },
          {
            backgroundColor,
            image: (
              <SlideIcon
                dark={dark}
                icon="download-outline"
                title="Acesso offline"
                description="Consulte informações salvas e roteiros mesmo sem internet, facilitando o uso durante a viagem."
              />
            ),
            title: '',
            subtitle: '',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  slideIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: 30,
  },

  iconCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  iconCircleDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },

  slideTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },

  textDark: {
    color: '#F8FAFC',
  },

  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 330,
  },

  descriptionDark: {
    color: '#CBD5E1',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  dotSelected: {
    width: 22,
    backgroundColor: '#2563EB',
  },

  dotDefault: {
    backgroundColor: '#CBD5E1',
  },

  buttonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
});