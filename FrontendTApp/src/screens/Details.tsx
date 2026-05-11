import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

type VisitHour = {
  day: string;
  time: string;
};

type SafetyLevel = 'very_safe' | 'little_safe' | 'not_safe';

type AccessibilityAvailability = 'yes' | 'no' | 'unknown';
type AccessibilityQuality = 'good' | 'partial' | 'bad' | 'unknown';
type AccessibilityLevel = 'good' | 'medium' | 'bad' | 'unknown';

type Review = {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type CurrentWeather = {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  iconUrl: string;
  windSpeed: number;
};

type WeatherDay = {
  date: string;
  min: number;
  max: number;
  description: string;
  icon: string;
  iconUrl: string;
};

type WeatherForecast = {
  city: string;
  country: string;
  forecast: WeatherDay[];
};

type Event = {
  _id: string;
  title: string;
  description: string;
  placeName: string;
  city: string;
  address: string;
  date: string;
  startTime: string;
  endTime?: string;
  image?: string;
  category: string;
  isFree: boolean;
};

type Place = {
  _id: string;
  name: string;
  city?: string;
  description: string;
  categories: string[];
  address: string;
  openingHours?: string;
  contact?: string;
  website?: string;
  images?: string[];
  location?: {
    type: string;
    coordinates: number[];
  };
  mostVisitedHours?: VisitHour[];
  safety?: {
    level: SafetyLevel;
    description: string;
  };
};

type AccordionKey =
  | 'info'
  | 'weather'
  | 'events'
  | 'visitedHours'
  | 'safety'
  | 'accessibility'
  | 'comments';

type AccessibilityField =
  | 'adaptedBathroom'
  | 'rampAccess'
  | 'elevatorAccess'
  | 'tactilePaving'
  | 'accessibleParking';

type AccessibilityForm = {
  adaptedBathroom: AccessibilityAvailability;
  adaptedBathroomQuality: AccessibilityQuality;

  rampAccess: AccessibilityAvailability;
  rampAccessQuality: AccessibilityQuality;

  elevatorAccess: AccessibilityAvailability;
  elevatorAccessQuality: AccessibilityQuality;

  tactilePaving: AccessibilityAvailability;
  tactilePavingQuality: AccessibilityQuality;

  accessibleParking: AccessibilityAvailability;
  accessibleParkingQuality: AccessibilityQuality;

  comment: string;
};

const DEFAULT_VISITED_HOURS: VisitHour[] = [
  { day: 'monday', time: '10:00 às 13:00' },
  { day: 'tuesday', time: '14:00 às 17:00' },
  { day: 'wednesday', time: '09:00 às 12:00' },
  { day: 'thursday', time: '13:00 às 16:00' },
  { day: 'friday', time: '15:00 às 18:00' },
  { day: 'saturday', time: '10:00 às 15:00' },
  { day: 'sunday', time: '09:00 às 13:00' },
];

const ACCESSIBILITY_FIELDS: AccessibilityField[] = [
  'adaptedBathroom',
  'rampAccess',
  'elevatorAccess',
  'tactilePaving',
  'accessibleParking',
];

const DEFAULT_ACCESSIBILITY_FORM: AccessibilityForm = {
  adaptedBathroom: 'unknown',
  adaptedBathroomQuality: 'unknown',

  rampAccess: 'unknown',
  rampAccessQuality: 'unknown',

  elevatorAccess: 'unknown',
  elevatorAccessQuality: 'unknown',

  tactilePaving: 'unknown',
  tactilePavingQuality: 'unknown',

  accessibleParking: 'unknown',
  accessibleParkingQuality: 'unknown',

  comment: '',
};

export default function DetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();

  function translate(key: string, fallback: string) {
    return String(t(key, { defaultValue: fallback }));
  }

  const { placeId } = route.params;

  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null
  );

  const [weatherForecast, setWeatherForecast] =
    useState<WeatherForecast | null>(null);

  const [weatherLoading, setWeatherLoading] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [accessibilitySummary, setAccessibilitySummary] = useState<any>(null);
  const [accessibilityComments, setAccessibilityComments] = useState<any[]>([]);
  const [accessibilityForm, setAccessibilityForm] =
    useState<AccessibilityForm>(DEFAULT_ACCESSIBILITY_FORM);
  const [accessibilityLoading, setAccessibilityLoading] = useState(false);

  const [openSections, setOpenSections] = useState<
    Record<AccordionKey, boolean>
  >({
    info: false,
    weather: false,
    events: false,
    visitedHours: false,
    safety: false,
    accessibility: false,
    comments: false,
  });

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaceDetails();
    fetchReviews();
    fetchAccessibilitySummary();
    fetchMyAccessibilityReview();
  }, [placeId]);

  async function fetchPlaceDetails() {
    try {
      setLoading(true);

      const response = await api.get(`/places/${placeId}`);
      const placeData: Place = response.data;

      setPlace(placeData);
      fetchEvents(placeData._id);

      const city = placeData.city;

      if (city) {
        fetchCurrentWeather(city);
        fetchWeatherForecast(city);
      } else {
        console.log('Cidade não encontrada no local:', placeData.name);
      }
    } catch (error: any) {
      console.log('Erro ao buscar detalhes:', error?.message);
      Alert.alert(translate('common.error', 'Erro'), translate('details.loadError', 'Não foi possível carregar os detalhes do local.'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const response = await api.get(`/reviews/${placeId}`);
      setReviews(response.data);
    } catch (error: any) {
      console.log('Erro ao buscar comentários:', error?.message);
    }
  }

  async function fetchAccessibilitySummary() {
    try {
      const response = await api.get(`/accessibility/${placeId}`);
      setAccessibilitySummary(response.data.summary);
      setAccessibilityComments(response.data.comments || []);
    } catch (error: any) {
      console.log('Erro ao buscar acessibilidade:', error?.message);
    }
  }

  function getWeekdayLabel(day: string) {
    const normalizedDay = day
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('-feira', '')
      .trim();

    const dayMap: Record<string, string> = {
      segunda: 'monday',
      monday: 'monday',

      terca: 'tuesday',
      terça: 'tuesday',
      tuesday: 'tuesday',

      quarta: 'wednesday',
      wednesday: 'wednesday',

      quinta: 'thursday',
      thursday: 'thursday',

      sexta: 'friday',
      friday: 'friday',

      sabado: 'saturday',
      sábado: 'saturday',
      saturday: 'saturday',

      domingo: 'sunday',
      sunday: 'sunday',
    };

    const key = dayMap[normalizedDay] || normalizedDay;

    return translate(`weekdays.${key}`, day);
  }

  async function fetchMyAccessibilityReview() {
    try {
      if (!user || !token) return;

      const response = await api.get(`/accessibility/${placeId}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setAccessibilityForm({
          adaptedBathroom: response.data.adaptedBathroom || 'unknown',
          adaptedBathroomQuality:
            response.data.adaptedBathroomQuality || 'unknown',

          rampAccess: response.data.rampAccess || 'unknown',
          rampAccessQuality: response.data.rampAccessQuality || 'unknown',

          elevatorAccess: response.data.elevatorAccess || 'unknown',
          elevatorAccessQuality:
            response.data.elevatorAccessQuality || 'unknown',

          tactilePaving: response.data.tactilePaving || 'unknown',
          tactilePavingQuality:
            response.data.tactilePavingQuality || 'unknown',

          accessibleParking: response.data.accessibleParking || 'unknown',
          accessibleParkingQuality:
            response.data.accessibleParkingQuality || 'unknown',

          comment: response.data.comment || '',
        });
      }
    } catch (error: any) {
      console.log(
        'Erro ao buscar minha avaliação de acessibilidade:',
        error?.message
      );
    }
  }

  async function fetchCurrentWeather(city: string) {
    try {
      const response = await api.get('/weather', {
        params: {
          city,
          lang: i18n.language,
        },
      });

      setCurrentWeather(response.data);
    } catch (error: any) {
      console.log('Erro ao buscar clima atual:', error?.message);
    }
  }

  async function fetchWeatherForecast(city: string) {
    try {
      setWeatherLoading(true);

      const response = await api.get('/weather/forecast', {
        params: {
          city,
          lang: i18n.language,
        },
      });

      setWeatherForecast(response.data);
    } catch (error: any) {
      console.log('Erro ao buscar previsão do clima:', error?.message);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function fetchEvents(placeId: string) {
    try {
      setEventsLoading(true);

      const response = await api.get('/events', {
        params: {
          placeId,
        },
      });

      setEvents(response.data || []);
    } catch (error: any) {
      console.log('Erro ao buscar eventos:', error?.message);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }

  function formatEventDate(date: string) {
    return new Date(date).toLocaleDateString(
      i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
  }

  function toggleSection(section: AccordionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function getLoggedUserId() {
    return String(user?._id || user?.id || '');
  }

  function isReviewOwner(review: Review) {
    const loggedUserId = getLoggedUserId();

    if (!loggedUserId || !review.userId) {
      return false;
    }

    return String(review.userId) === loggedUserId;
  }

  function getImageUri(place: Place) {
    if (imageError) return FALLBACK_IMAGE;

    const imageUrl = place.images?.[0]?.trim();

    if (!imageUrl || !imageUrl.startsWith('https://')) {
      return FALLBACK_IMAGE;
    }

    return encodeURI(imageUrl);
  }

  function getAverageRating() {
    if (!reviews.length) {
      return '0.0';
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return (total / reviews.length).toFixed(1);
  }

  function getSafetyLabel(level?: SafetyLevel) {
    switch (level) {
      case 'very_safe':
        return translate(
          'details.safetyLevels.verySafe',
          'Muito seguro'
        );

      case 'little_safe':
        return translate(
          'details.safetyLevels.littleSafe',
          'Pouco seguro'
        );

      case 'not_safe':
        return translate(
          'details.safetyLevels.notSafe',
          'Nada seguro'
        );

      default:
        return translate(
          'details.safetyLevels.verySafe',
          'Muito seguro'
        );
    }
  }

  function getSafetyIcon(level?: SafetyLevel): keyof typeof Ionicons.glyphMap {
    switch (level) {
      case 'very_safe':
        return 'shield-checkmark-outline';
      case 'little_safe':
        return 'warning-outline';
      case 'not_safe':
        return 'alert-circle-outline';
      default:
        return 'shield-checkmark-outline';
    }
  }

  function getSafetyColor(level?: SafetyLevel) {
    switch (level) {
      case 'very_safe':
        return '#16A34A';
      case 'little_safe':
        return '#F59E0B';
      case 'not_safe':
        return '#DC2626';
      default:
        return '#16A34A';
    }
  }

  function getAccessibilityLevel(summary: any): {
    label: string;
    color: string;
    level: AccessibilityLevel;
  } {
    if (!summary || summary.total === 0) {
      return {
        label: translate(
          'details.accessibilityLabels.noReviews',
          'Sem avaliações'
        ),
        color: '#64748B',
        level: 'unknown',
      };
    }

    let good = 0;
    let partial = 0;
    let bad = 0;
    let no = 0;

    ACCESSIBILITY_FIELDS.forEach((field) => {
      const qualityField = `${field}Quality`;

      good += summary[qualityField]?.good || 0;
      partial += summary[qualityField]?.partial || 0;
      bad += summary[qualityField]?.bad || 0;
      no += summary[field]?.no || 0;
    });

    const score = good * 2 + partial - bad - no;
    const maxScore = summary.total * ACCESSIBILITY_FIELDS.length * 2;
    const percentage = score / maxScore;

    if (percentage >= 0.65) {
      return {
        label: translate(
          'details.accessibilityLabels.goodAccessibility',
          'Boa acessibilidade'
        ),
        color: '#16A34A',
        level: 'good',
      };
    }

    if (percentage >= 0.3) {
      return {
        label: translate(
          'details.accessibilityLabels.mediumAccessibility',
          'Acessibilidade mediana'
        ),
        color: '#EAB308',
        level: 'medium',
      };
    }

    return {
      label: translate(
        'details.accessibilityLabels.lowAccessibility',
        'Baixa acessibilidade'
      ),
      color: '#DC2626',
      level: 'bad',
    };
  }

  function getAccessibilityFieldLabel(field: AccessibilityField) {
    switch (field) {
      case 'adaptedBathroom':
        return translate(
          'details.accessibilityFields.adaptedBathroom',
          'Banheiro adaptado'
        );

      case 'rampAccess':
        return translate(
          'details.accessibilityFields.rampAccess',
          'Rampas'
        );

      case 'elevatorAccess':
        return translate(
          'details.accessibilityFields.elevatorAccess',
          'Elevadores'
        );

      case 'tactilePaving':
        return translate(
          'details.accessibilityFields.tactilePaving',
          'Piso tátil'
        );

      case 'accessibleParking':
        return translate(
          'details.accessibilityFields.accessibleParking',
          'Estacionamento acessível'
        );

      default:
        return field;
    }
  }

  function getAccessibilityFieldIcon(
    field: AccessibilityField
  ): keyof typeof Ionicons.glyphMap {
    switch (field) {
      case 'adaptedBathroom':
        return 'accessibility-outline';
      case 'rampAccess':
        return 'trending-up-outline';
      case 'elevatorAccess':
        return 'swap-vertical-outline';
      case 'tactilePaving':
        return 'apps-outline';
      case 'accessibleParking':
        return 'car-outline';
      default:
        return 'accessibility-outline';
    }
  }

  function getFieldQualityResult(field: AccessibilityField) {
    if (!accessibilitySummary) {
      return {
        label: translate('details.accessibilityLabels.noData', 'Sem dados'),
        color: '#64748B',
      };
    }

    const availability = accessibilitySummary[field];
    const quality = accessibilitySummary[`${field}Quality`];

    const yes = availability?.yes || 0;
    const no = availability?.no || 0;
    const unknown = availability?.unknown || 0;

    if (yes === 0 && no === 0 && unknown > 0) {
      return {
        label: translate('details.accessibilityLabels.noData', 'Sem dados'),
        color: '#64748B',
      };
    }

    if (no > yes) {
      return {
        label: translate('details.accessibilityLabels.notAvailable', 'Não possui'),
        color: '#DC2626',
      };
    }

    const good = quality?.good || 0;
    const partial = quality?.partial || 0;
    const bad = quality?.bad || 0;

    if (good >= partial && good >= bad) {
      return {
        label: translate('details.good', 'Bom'),
        color: '#16A34A',
      };
    }

    if (partial >= good && partial >= bad) {
      return {
        label: translate('details.partial', 'Parcial'),
        color: '#EAB308',
      };
    }

    return {
      label: translate('details.bad', 'Ruim'),
      color: '#DC2626',
    };
  }

  function getAvailabilityLabel(value: AccessibilityAvailability) {
    switch (value) {
      case 'yes':
        return translate(
          'details.accessibilityLabels.yes',
          'Sim'
        );

      case 'no':
        return translate(
          'details.accessibilityLabels.no',
          'Não'
        );

      case 'unknown':
        return translate(
          'details.accessibilityLabels.unknown',
          'Não sei'
        );

      default:
        return translate(
          'details.accessibilityLabels.unknown',
          'Não sei'
        );
    }
  }

  function getQualityLabel(value: AccessibilityQuality) {
    switch (value) {
      case 'good':
        return translate(
          'details.accessibilityLabels.good',
          'Bom'
        );

      case 'partial':
        return translate(
          'details.accessibilityLabels.partial',
          'Parcial'
        );

      case 'bad':
        return translate(
          'details.accessibilityLabels.bad',
          'Ruim'
        );

      case 'unknown':
        return translate(
          'details.accessibilityLabels.unknown',
          'Não sei'
        );

      default:
        return translate(
          'details.accessibilityLabels.unknown',
          'Não sei'
        );
    }
  }

  function getQualityColor(value: AccessibilityQuality) {
    switch (value) {
      case 'good':
        return '#16A34A';
      case 'partial':
        return '#EAB308';
      case 'bad':
        return '#DC2626';
      default:
        return '#64748B';
    }
  }

  function setAvailability(
    field: AccessibilityField,
    value: AccessibilityAvailability
  ) {
    const qualityField = `${field}Quality` as keyof AccessibilityForm;

    setAccessibilityForm((prev) => ({
      ...prev,
      [field]: value,
      [qualityField]: value === 'yes' ? prev[qualityField] : 'unknown',
    }));
  }

  function setQuality(field: AccessibilityField, value: AccessibilityQuality) {
    const qualityField = `${field}Quality` as keyof AccessibilityForm;

    setAccessibilityForm((prev) => ({
      ...prev,
      [qualityField]: value,
    }));
  }

  async function handleSaveAccessibilityReview() {
    try {
      if (!user || !token) {
        Alert.alert(
          'Atenção',
          translate('details.mustLoginAccessibility', 'Você precisa estar logado para avaliar a acessibilidade.')
        );
        return;
      }

      setAccessibilityLoading(true);

      await api.post(`/accessibility/${placeId}`, accessibilityForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchAccessibilitySummary();
      await fetchMyAccessibilityReview();

      Alert.alert(translate('common.success', 'Sucesso'), translate('details.accessibilitySaved', 'Avaliação de acessibilidade salva.'));
    } catch (error: any) {
      console.log('Erro ao salvar acessibilidade:', error?.message);
      Alert.alert(
        'Erro',
        translate('details.accessibilitySaveError', 'Não foi possível salvar a avaliação de acessibilidade.')
      );
    } finally {
      setAccessibilityLoading(false);
    }
  }

  function formatForecastDate(date: string, index: number) {
    if (index === 0) return translate('details.today', 'Hoje');
    if (index === 1) return translate('details.tomorrow', 'Amanhã');

    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString(
      i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR',
      {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      });
  }

  async function openWebsite() {
    if (!place?.website) return;

    const canOpen = await Linking.canOpenURL(place.website);

    if (canOpen) {
      Linking.openURL(place.website);
    } else {
      Alert.alert(translate('common.error', 'Erro'), translate('details.openWebsiteError', 'Não foi possível abrir o site.'));
    }
  }

  async function callPlace() {
    if (!place?.contact) return;

    const phone = place.contact.replace(/\D/g, '');
    const phoneUrl = `tel:${phone}`;

    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert(translate('common.error', 'Erro'), translate('details.openPhoneError', 'Não foi possível abrir o telefone.'));
    }
  }

  function openMap() {
    if (!place) return;

    navigation.navigate('MainTabs', {
      screen: 'HomeTab',
      params: {
        selectedPlace: place,
      },
    });
  }

  async function openRoutes() {
    if (!place?.location?.coordinates?.length) {
      Alert.alert(translate('common.error', 'Erro'), translate('details.locationUnavailable', 'Localização do lugar não disponível.'));
      return;
    }

    const [lng, lat] = place.location.coordinates;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(translate('common.error', 'Erro'), translate('details.openRoutesError', 'Não foi possível abrir as rotas.'));
    }
  }

  async function handleSharePlace() {
    if (!place) return;

    const deepLink = `frontendtapp://place/${place._id}`;

    try {
      await Share.share({
        title: `Conheça ${place.name}`,
        message: `Confira ${place.name} no Turistando!

${place.address}

Abrir no app: ${deepLink}`,
        url: deepLink,
      });
    } catch (error: any) {
      console.log('Erro ao compartilhar local:', error?.message);
      Alert.alert(translate('common.error', 'Erro'), translate('details.shareError', 'Não foi possível compartilhar este local.'));
    }
  }

  async function handleSaveReview() {
    try {
      if (!user) {
        Alert.alert(translate('common.attention', 'Atenção'), translate('details.mustLoginComment', 'Você precisa estar logado para comentar.'));
        return;
      }

      if (userRating === 0) {
        Alert.alert(translate('common.attention', 'Atenção'), translate('details.selectRating', 'Selecione uma avaliação de 1 a 5 estrelas.'));
        return;
      }

      if (!userComment.trim()) {
        Alert.alert(translate('common.attention', 'Atenção'), translate('details.typeComment', 'Digite um comentário.'));
        return;
      }

      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, {
          rating: userRating,
          comment: userComment.trim(),
        });
      } else {
        await api.post(`/reviews/${placeId}`, {
          rating: userRating,
          comment: userComment.trim(),
        });
      }

      setUserRating(0);
      setUserComment('');
      setEditingReviewId(null);

      await fetchReviews();
    } catch (error: any) {
      console.log('Erro ao salvar comentário:', error?.message);
      Alert.alert(translate('common.error', 'Erro'), translate('details.commentSaveError', 'Não foi possível salvar o comentário.'));
    }
  }

  function handleEditReview(review: Review) {
    if (!isReviewOwner(review)) {
      Alert.alert(translate('common.attention', 'Atenção'), translate('details.onlyEditOwnComments', 'Você só pode editar seus próprios comentários.'));
      return;
    }

    setEditingReviewId(review._id);
    setUserRating(review.rating);
    setUserComment(review.comment);

    setOpenSections((prev) => ({
      ...prev,
      comments: true,
    }));
  }

  function handleCancelEdit() {
    setEditingReviewId(null);
    setUserRating(0);
    setUserComment('');
  }

  function handleDeleteReview(review: Review) {
    if (!isReviewOwner(review)) {
      Alert.alert(translate('common.attention', 'Atenção'), translate('details.onlyDeleteOwnComments', 'Você só pode excluir seus próprios comentários.'));
      return;
    }

    Alert.alert(
      translate('details.deleteComment', 'Excluir comentário'),
      translate('details.confirmDeleteComment', 'Tem certeza que deseja excluir este comentário?'),
      [
        {
          text: translate('common.cancel', 'Cancelar'),
          style: 'cancel',
        },
        {
          text: translate('details.delete', 'Excluir'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/reviews/${review._id}`);

              if (editingReviewId === review._id) {
                handleCancelEdit();
              }

              await fetchReviews();
            } catch (error: any) {
              console.log('Erro ao excluir comentário:', error?.message);
              Alert.alert(translate('common.error', 'Erro'), translate('details.commentDeleteError', 'Não foi possível excluir o comentário.'));
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.loadingWrapper}>
        <Text style={styles.emptyText}>Local não encontrado.</Text>
      </View>
    );
  }

  const visitedHours = place.mostVisitedHours?.length
    ? place.mostVisitedHours
    : DEFAULT_VISITED_HOURS;

  const safetyLevel = place.safety?.level || 'very_safe';

  const safetyDescription =
    place.safety?.description ||
    'Local considerado seguro pelos visitantes, principalmente em horários de maior movimento.';

  const accessibilityLevel = getAccessibilityLevel(accessibilitySummary);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: getImageUri(place) }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {currentWeather ? (
          <View style={styles.weatherBadge}>
            <Image
              source={{ uri: currentWeather.iconUrl }}
              style={styles.weatherBadgeIcon}
            />

            <View>
              <Text style={styles.weatherBadgeTemp}>
                {currentWeather.temperature}°
              </Text>

              <Text style={styles.weatherBadgeDesc}>
                {currentWeather.description}
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          activeOpacity={0.85}
          onPress={handleSharePlace}
        >
          <Ionicons name="share-social-outline" size={21} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>{translate('details.link', 'Link')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>
          {place.categories
            .map((cat) =>
              translate(`categories.${cat.toLowerCase()}`, cat).toUpperCase()
            )
            .join(' • ')}
        </Text>

        <Text style={styles.title}>{place.name}</Text>

        {reviews.length > 0 ? (
          <Text style={styles.rating}>
            ⭐ {getAverageRating()} • {reviews.length} {translate('details.reviews', 'avaliações')}
          </Text>
        ) : (
          <Text style={styles.rating}>{translate('results.noReviews', 'Ainda sem avaliações')}</Text>
        )}

        <Text style={styles.description}>{place.description}</Text>

        <View style={styles.addressCard}>
          <InfoRow
            icon="location-outline"
            label={translate('details.address', 'Endereço')}
            value={place.address}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.mapButton}
              activeOpacity={0.8}
              onPress={openMap}
            >
              <Ionicons name="map-outline" size={19} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>{translate('details.openOnMap', 'Abrir no mapa')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.routeButton}
              activeOpacity={0.8}
              onPress={openRoutes}
            >
              <Ionicons name="navigate-outline" size={19} color="#FFFFFF" />
              <Text style={styles.mapButtonText}>{translate('results.routes', 'Ver rotas')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AccordionSection
          title={translate('details.aboutPlace', 'Sobre o local')}
          icon="information-circle-outline"
          isOpen={openSections.info}
          onPress={() => toggleSection('info')}
        >
          {place.openingHours ? (
            <InfoRow
              icon="time-outline"
              label={translate('details.openingHours', 'Horário de funcionamento')}
              value={place.openingHours}
            />
          ) : null}

          {place.contact ? (
            <TouchableOpacity activeOpacity={0.8} onPress={callPlace}>
              <InfoRow
                icon="call-outline"
                label={translate('details.phone', 'Telefone')}
                value={place.contact}
              />
            </TouchableOpacity>
          ) : null}

          {place.website ? (
            <TouchableOpacity activeOpacity={0.8} onPress={openWebsite}>
              <InfoRow
                icon="globe-outline"
                label={translate('details.website', 'Website')}
                value={place.website}
              />
            </TouchableOpacity>
          ) : null}

          {!place.openingHours && !place.contact && !place.website ? (
            <Text style={styles.emptySectionText}>
              {translate('details.noAdditionalInfo', 'Nenhuma informação adicional disponível.')}
            </Text>
          ) : null}
        </AccordionSection>

        <AccordionSection
          title={translate('details.weatherForecast', 'Previsão do tempo')}
          icon="partly-sunny-outline"
          isOpen={openSections.weather}
          onPress={() => toggleSection('weather')}
        >
          {weatherLoading ? (
            <View style={styles.weatherLoading}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.weatherLoadingText}>
                {translate('details.loadingForecast', 'Carregando previsão...')}
              </Text>
            </View>
          ) : weatherForecast?.forecast?.length ? (
            <View style={styles.forecastWrapper}>
              <Text style={styles.forecastCity}>
                {weatherForecast.city}, {weatherForecast.country}
              </Text>

              {weatherForecast.forecast.map((item, index) => (
                <View key={item.date} style={styles.forecastRow}>
                  <View style={styles.forecastDateWrapper}>
                    <Image
                      source={{ uri: item.iconUrl }}
                      style={styles.weatherIcon}
                    />

                    <View style={styles.forecastTextWrapper}>
                      <Text style={styles.forecastDate}>
                        {formatForecastDate(item.date, index)}
                      </Text>
                      <Text style={styles.forecastDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.forecastTemp}>
                    {item.max}° / {item.min}°
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySectionText}>
              {translate('details.forecastLoadError', 'Não foi possível carregar a previsão do tempo.')}
            </Text>
          )}
        </AccordionSection>


        <AccordionSection
          title={translate('details.events', 'Eventos próximos')}
          icon="calendar-outline"
          iconColor="#9333EA"
          isOpen={openSections.events}
          onPress={() => toggleSection('events')}
        >
          {eventsLoading ? (
            <View style={styles.eventsLoading}>
              <ActivityIndicator size="small" color="#9333EA" />
              <Text style={styles.eventsLoadingText}>{translate('details.loadingEvents', 'Carregando eventos...')}</Text>
            </View>
          ) : events.length === 0 ? (
            <Text style={styles.emptySectionText}>
              {translate('details.noEvents', 'Nenhum evento próximo encontrado.')}
            </Text>
          ) : (
            <View style={styles.eventsWrapper}>
              {events.map((event) => (
                <View key={event._id} style={styles.eventCard}>
                  {event.image ? (
                    <Image
                      source={{ uri: event.image }}
                      style={styles.eventImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>

                      <View
                        style={[
                          styles.eventPriceBadge,
                          {
                            backgroundColor: event.isFree
                              ? '#DCFCE7'
                              : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.eventPriceText,
                            {
                              color: event.isFree ? '#16A34A' : '#D97706',
                            },
                          ]}
                        >
                          {event.isFree ? translate('details.free', 'Gratuito') : translate('details.paid', 'Pago')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.eventDate}>
                      📅 {formatEventDate(event.date)} • {event.startTime}
                      {event.endTime ? ` às ${event.endTime}` : ''}
                    </Text>

                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>

                    <View style={styles.eventFooter}>
                      <View style={styles.eventCategoryBadge}>
                        <Text style={styles.eventCategoryText}>
                          {event.category}
                        </Text>
                      </View>

                      <Text style={styles.eventPlace} numberOfLines={1}>
                        {event.placeName}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AccordionSection>

        <AccordionSection
          title={translate('details.visitedHours', 'Horários mais visitados')}
          icon="time-outline"
          isOpen={openSections.visitedHours}
          onPress={() => toggleSection('visitedHours')}
        >
          {visitedHours.map((item) => (
            <View key={item.day} style={styles.visitHourRow}>
              <Text style={styles.visitDay}>{getWeekdayLabel(item.day)}</Text>
              <Text style={styles.visitTime}>{item.time}</Text>
            </View>
          ))}
        </AccordionSection>

        <AccordionSection
          title={translate('details.safetyZone', 'Zona de segurança')}
          icon={getSafetyIcon(safetyLevel)}
          iconColor={getSafetyColor(safetyLevel)}
          isOpen={openSections.safety}
          onPress={() => toggleSection('safety')}
        >
          <View
            style={[
              styles.safetyBadge,
              { backgroundColor: `${getSafetyColor(safetyLevel)}20` },
            ]}
          >
            <Text
              style={[
                styles.safetyText,
                { color: getSafetyColor(safetyLevel) },
              ]}
            >
              {getSafetyLabel(safetyLevel)}
            </Text>
          </View>

          <Text style={styles.safetyDescription}>{safetyDescription}</Text>
        </AccordionSection>

        <AccordionSection
          title={translate('details.accessibility', 'Acessibilidade')}
          icon="accessibility-outline"
          iconColor={accessibilityLevel.color}
          isOpen={openSections.accessibility}
          onPress={() => toggleSection('accessibility')}
        >
          <View
            style={[
              styles.accessibilityBadge,
              { backgroundColor: `${accessibilityLevel.color}20` },
            ]}
          >
            <Text
              style={[
                styles.accessibilityBadgeText,
                { color: accessibilityLevel.color },
              ]}
            >
              {accessibilityLevel.label}
            </Text>
          </View>

          <Text style={styles.accessibilityDescription}>
            {translate('details.accessibilityDescription', 'Avaliações colaborativas sobre acessibilidade do local.')}
          </Text>

          {accessibilitySummary && accessibilitySummary.total > 0 ? (
            <View style={styles.accessibilityList}>
              {ACCESSIBILITY_FIELDS.map((field) => {
                const result = getFieldQualityResult(field);

                return (
                  <View key={field} style={styles.accessibilityItem}>
                    <View style={styles.accessibilityItemLeft}>
                      <Ionicons
                        name={getAccessibilityFieldIcon(field)}
                        size={20}
                        color="#64748B"
                      />

                      <Text style={styles.accessibilityItemLabel}>
                        {getAccessibilityFieldLabel(field)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.accessibilityStatus,
                        { backgroundColor: result.color },
                      ]}
                    >
                      <Text style={styles.accessibilityStatusText}>
                        {result.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptySectionText}>
              {translate('details.noAccessibilityYet', 'Nenhuma avaliação de acessibilidade ainda.')}
            </Text>
          )}

          <View style={styles.accessibilityFormBox}>
            <Text style={styles.accessibilityFormTitle}>
              {translate('details.evaluateAccessibility', 'Avaliar acessibilidade')}
            </Text>

            <Text style={styles.accessibilityFormDescription}>
              {translate('details.accessibilityHelp', 'Ajude outras pessoas avaliando a acessibilidade deste local.')}
            </Text>

            {ACCESSIBILITY_FIELDS.map((field) => {
              const qualityField = `${field}Quality` as keyof AccessibilityForm;
              const availability = accessibilityForm[field];
              const quality = accessibilityForm[
                qualityField
              ] as AccessibilityQuality;

              return (
                <View key={field} style={styles.accessibilityFormItem}>
                  <View style={styles.accessibilityFormHeader}>
                    <Ionicons
                      name={getAccessibilityFieldIcon(field)}
                      size={20}
                      color="#64748B"
                    />

                    <Text style={styles.accessibilityFormLabel}>
                      {getAccessibilityFieldLabel(field)}
                    </Text>
                  </View>

                  <View style={styles.accessibilityOptions}>
                    {(['yes', 'no', 'unknown'] as AccessibilityAvailability[]).map(
                      (option) => {
                        const selected = availability === option;

                        return (
                          <TouchableOpacity
                            key={option}
                            activeOpacity={0.8}
                            style={[
                              styles.accessibilityOption,
                              selected && styles.accessibilityOptionSelected,
                            ]}
                            onPress={() => setAvailability(field, option)}
                          >
                            <Text
                              style={[
                                styles.accessibilityOptionText,
                                selected &&
                                styles.accessibilityOptionTextSelected,
                              ]}
                            >
                              {getAvailabilityLabel(option)}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>

                  {availability === 'yes' ? (
                    <>
                      <Text style={styles.accessibilityQualityTitle}>
                        {translate('details.howDoYouRate', 'Como você avalia?')}
                      </Text>

                      <View style={styles.accessibilityOptions}>
                        {(['good', 'partial', 'bad'] as AccessibilityQuality[]).map(
                          (option) => {
                            const selected = quality === option;

                            return (
                              <TouchableOpacity
                                key={option}
                                activeOpacity={0.8}
                                style={[
                                  styles.accessibilityOption,
                                  {
                                    borderColor: getQualityColor(option),
                                  },
                                  selected && {
                                    backgroundColor: getQualityColor(option),
                                  },
                                ]}
                                onPress={() => setQuality(field, option)}
                              >
                                <Text
                                  style={[
                                    styles.accessibilityOptionText,
                                    { color: getQualityColor(option) },
                                    selected && { color: '#FFFFFF' },
                                  ]}
                                >
                                  {getQualityLabel(option)}
                                </Text>
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                    </>
                  ) : null}
                </View>
              );
            })}

            <TextInput
              style={styles.accessibilityInput}
              placeholder={translate('details.accessibilityPlaceholder', 'Observações sobre acessibilidade...')}
              placeholderTextColor="#94A3B8"
              value={accessibilityForm.comment}
              onChangeText={(text) =>
                setAccessibilityForm((prev) => ({
                  ...prev,
                  comment: text,
                }))
              }
              multiline
            />

            <TouchableOpacity
              style={styles.accessibilitySaveButton}
              activeOpacity={0.8}
              onPress={handleSaveAccessibilityReview}
              disabled={accessibilityLoading}
            >
              {accessibilityLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.accessibilitySaveButtonText}>
                  {translate('details.saveAccessibilityReview', 'Salvar avaliação de acessibilidade')}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.accessibilityPrivacyText}>
              {translate(
                'details.publicAccessibilityReview',
                'Sua avaliação é pública e ajuda outras pessoas.'
              )}
            </Text>
          </View>

          {accessibilityComments.length > 0 ? (
            <View style={styles.accessibilityCommentsBox}>
              <Text style={styles.accessibilityCommentsTitle}>
                {translate('details.userObservations', 'Observações dos usuários')}
              </Text>

              {accessibilityComments.map((item) => (
                <View key={item._id} style={styles.accessibilityCommentCard}>
                  <Text style={styles.accessibilityCommentUser}>
                    {item.user?.name || translate('profile.defaultUserName', 'Usuário')}
                  </Text>

                  <Text style={styles.accessibilityCommentText}>
                    {item.comment}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </AccordionSection>

        <AccordionSection
          title={translate('details.comments', 'Comentários')}
          icon="chatbubble-ellipses-outline"
          isOpen={openSections.comments}
          onPress={() => toggleSection('comments')}
        >
          <View style={styles.addCommentBox}>
            <Text style={styles.addCommentTitle}>
              {editingReviewId ? translate('details.editComment', 'Editar comentário') : translate('details.addComment', 'Adicionar comentário')}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  activeOpacity={0.7}
                  onPress={() => setUserRating(star)}
                >
                  <Ionicons
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={28}
                    color="#FACC15"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder={translate(
                'details.writeExperience',
                'Escreva sua experiência...'
              )}
              placeholderTextColor="#94A3B8"
              value={userComment}
              onChangeText={setUserComment}
              multiline
            />

            <TouchableOpacity
              style={styles.publishButton}
              activeOpacity={0.8}
              onPress={handleSaveReview}
            >
              <Text style={styles.publishButtonText}>
                {editingReviewId
                  ? 'Salvar alteração'
                  : translate('details.publishComment', 'Publicar comentário')}
              </Text>
            </TouchableOpacity>

            {editingReviewId ? (
              <TouchableOpacity
                style={styles.cancelEditButton}
                activeOpacity={0.8}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelEditText}>{translate('details.cancelEdit', 'Cancelar edição')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noCommentsText}>
              {translate(
                'details.noComments',
                'Nenhum comentário ainda. Seja o primeiro a comentar.'
              )}
            </Text>
          ) : (
            reviews.map((review) => {
              const owner = isReviewOwner(review);

              return (
                <View key={review._id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>
                      {owner ? translate('details.you', 'Você') : review.userName || translate('profile.defaultUserName', 'Usuário')}
                    </Text>

                    <Text style={styles.commentDate}>
                      {new Date(review.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-BR')}
                    </Text>
                  </View>

                  <Text style={styles.commentRating}>
                    {'⭐'.repeat(review.rating)}
                  </Text>

                  <Text style={styles.commentText}>{review.comment}</Text>

                  {owner ? (
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleEditReview(review)}
                      >
                        <Text style={styles.editText}>{translate('details.edit', 'Editar')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDeleteReview(review)}
                      >
                        <Text style={styles.deleteText}>{translate('details.delete', 'Excluir')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </AccordionSection>
      </View>
    </ScrollView>
  );
}

function AccordionSection({
  title,
  icon,
  iconColor = '#3B82F6',
  isOpen,
  onPress,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isOpen: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity
        style={styles.accordionHeader}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={styles.accordionTitleWrapper}>
          <Ionicons name={icon} size={22} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={22}
          color="#64748B"
        />
      </TouchableOpacity>

      {isOpen ? <View style={styles.accordionContent}>{children}</View> : null}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#3B82F6" />
      </View>

      <View style={styles.infoTextWrapper}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  imageWrapper: {
    width: '100%',
    height: 280,
    backgroundColor: '#CBD5E1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    minWidth: 82,
    height: 42,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  weatherBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 170,
  },
  weatherBadgeIcon: {
    width: 42,
    height: 42,
    marginRight: 6,
  },
  weatherBadgeTemp: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  weatherBadgeDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  category: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  mapButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  routeButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  accordionHeader: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    paddingTop: 12,
  },
  weatherLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  forecastWrapper: {
    paddingTop: 10,
  },
  forecastCity: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 8,
  },
  forecastRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  forecastDateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherIcon: {
    width: 42,
    height: 42,
    marginRight: 8,
  },
  forecastTextWrapper: {
    flex: 1,
  },
  forecastDate: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  forecastDescription: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  forecastTemp: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '900',
  },
  visitHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  visitDay: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  visitTime: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  safetyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 10,
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  safetyDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  accessibilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 10,
  },
  accessibilityBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  accessibilityDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 16,
  },
  accessibilityList: {
    marginBottom: 16,
  },
  accessibilityItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  accessibilityItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accessibilityItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '800',
  },
  accessibilityStatus: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    minWidth: 74,
    alignItems: 'center',
  },
  accessibilityStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  accessibilityFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
  },
  accessibilityFormTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  accessibilityFormDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  accessibilityFormItem: {
    marginBottom: 20,
  },
  accessibilityFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  accessibilityFormLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '900',
  },
  accessibilityQualityTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  accessibilityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  accessibilityOption: {
    minHeight: 42,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessibilityOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  accessibilityOptionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '900',
  },
  accessibilityOptionTextSelected: {
    color: '#FFFFFF',
  },
  accessibilityInput: {
    minHeight: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  accessibilitySaveButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  accessibilitySaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  accessibilityPrivacyText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  accessibilityCommentsBox: {
    marginTop: 14,
  },
  accessibilityCommentsTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 10,
  },
  accessibilityCommentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  accessibilityCommentUser: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 4,
  },
  accessibilityCommentText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  addCommentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    marginBottom: 14,
  },
  addCommentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  publishButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelEditButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelEditText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },

  eventsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
  },
  eventsLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  eventsWrapper: {
    paddingTop: 12,
  },
  eventCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  eventImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#CBD5E1',
  },
  eventContent: {
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  eventPriceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  eventPriceText: {
    fontSize: 11,
    fontWeight: '900',
  },
  eventDate: {
    fontSize: 13,
    color: '#9333EA',
    fontWeight: '800',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eventCategoryBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  eventCategoryText: {
    color: '#9333EA',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  eventPlace: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  commentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  commentUser: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  commentDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  commentRating: {
    fontSize: 13,
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  editText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 13,
  },
  deleteText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
});