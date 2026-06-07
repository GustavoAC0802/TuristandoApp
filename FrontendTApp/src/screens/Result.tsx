import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';

import api from '../services/api';
import { toggleFavorite } from '../slices/favoriteSlice';
import type { RootState } from '../store';
import {
  addRecentPlace,
  getRecentPlaces,
  type RecentPlace,
} from '../services/historyStorage';
import {
  getOfflinePlaces,
  savePlacesOffline,
  type OfflinePlace,
} from '../database/offlinePlaces';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

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
  image?: string;
  images?: string[];
  distance?: number;
  averageRating?: number;
  reviewsCount?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
};

type RouteParams = {
  mode?: 'nearMe';
  title?: string;
};

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();

  const routeParams = (route.params ?? {}) as RouteParams;
  const isNearMeMode = routeParams.mode === 'nearMe';

  const favoriteItems = useSelector((state: RootState) => state.favorites.items);
  const searchState = useSelector((state: any) => state.search);
  const theme = useSelector((state: RootState) => state.theme.mode);

  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    title: isDark ? '#F8FAFC' : '#0F172A',
    text: isDark ? '#E2E8F0' : '#0F172A',
    meta: isDark ? '#CBD5E1' : '#475569',
    description: isDark ? '#CBD5E1' : '#64748B',
    muted: isDark ? '#94A3B8' : '#94A3B8',
    iconMuted: isDark ? '#94A3B8' : '#94A3B8',
    imageBackground: isDark ? '#334155' : '#CBD5E1',
    buttonBackground: isDark ? '#0F172A' : '#FFFFFF',
    buttonBorder: isDark ? '#475569' : '#E2E8F0',
    primary: isDark ? '#60A5FA' : '#2563EB',
    primaryStrong: isDark ? '#93C5FD' : '#1E3A8A',
    offlineBackground: isDark ? '#422006' : '#FEF3C7',
    offlineBorder: isDark ? '#92400E' : '#F59E0B',
    offlineText: isDark ? '#FDE68A' : '#92400E',
  };

  const searchText = searchState?.searchText ?? '';
  const filters = searchState?.filters ?? {
    categories: [],
    distance: null,
    rating: null,
  };

  const [places, setPlaces] = useState<Place[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const selectedCategories: string[] = filters.categories ?? [];
  const minRating: number | null = filters.rating ?? null;
  const maxDistance: number | null = filters.distance ?? null;

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
      loadRecentPlaces();
    }, [searchText, JSON.stringify(filters), isNearMeMode])
  );

  async function loadRecentPlaces() {
    const recent = await getRecentPlaces();
    setRecentPlaces(recent);
  }

  async function getCurrentUserLocation() {
    if (userCoords) return userCoords;

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});

    const coords = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    setUserCoords(coords);

    return coords;
  }

  function calculateDistanceKm(
    userLat: number,
    userLng: number,
    placeLat: number,
    placeLng: number
  ) {
    const earthRadiusKm = 6371;

    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(placeLat - userLat);
    const dLng = toRad(placeLng - userLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLat)) *
        Math.cos(toRad(placeLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  function normalizeOfflinePlace(place: OfflinePlace): Place {
    return {
      _id: place._id,
      name: place.name,
      city: place.city,
      description: place.description || '',
      categories: place.categories || [],
      address: place.address || '',
      openingHours: place.openingHours,
      contact: place.contact,
      website: place.website,
      image: place.image,
      images: place.images?.length ? place.images : place.image ? [place.image] : [],
      averageRating: place.averageRating,
      reviewsCount: place.reviewsCount,
      location: {
        type: place.location?.type || 'Point',
        coordinates: place.location?.coordinates || [0, 0],
      },
    };
  }

  function applyOfflineFilters(
    items: Place[],
    coords?: { latitude: number; longitude: number } | null
  ) {
    let filtered = [...items];

    const normalizedSearch = searchText.trim().toLowerCase();

    if (normalizedSearch) {
      filtered = filtered.filter((item) => {
        const name = item.name?.toLowerCase() || '';
        const city = item.city?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        const address = item.address?.toLowerCase() || '';

        return (
          name.includes(normalizedSearch) ||
          city.includes(normalizedSearch) ||
          description.includes(normalizedSearch) ||
          address.includes(normalizedSearch)
        );
      });
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) =>
        selectedCategories.some((category) =>
          item.categories?.includes(category)
        )
      );
    }

    if (minRating !== null) {
      filtered = filtered.filter((item) => Number(item.averageRating || 0) >= minRating);
    }

    if (coords) {
      filtered = filtered.map((item) => {
        const [lng, lat] = item.location?.coordinates || [];

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return item;
        }

        return {
          ...item,
          distance: calculateDistanceKm(coords.latitude, coords.longitude, lat, lng),
        };
      });
    }

    if (isNearMeMode) {
      filtered = filtered.filter((item) => {
        if (typeof item.distance !== 'number') return false;
        return item.distance <= 100;
      });
    }

    if (maxDistance !== null) {
      filtered = filtered.filter((item) => {
        if (typeof item.distance !== 'number') return false;
        return item.distance <= maxDistance;
      });
    }

    if (isNearMeMode || maxDistance !== null) {
      filtered.sort((a, b) => {
        const distanceA =
          typeof a.distance === 'number' ? a.distance : Number.MAX_VALUE;
        const distanceB =
          typeof b.distance === 'number' ? b.distance : Number.MAX_VALUE;

        return distanceA - distanceB;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }

  async function saveRecentPlace(item: Place) {
    await addRecentPlace({
      _id: item._id,
      name: item.name,
      address: item.address,
      image: item.images?.[0] || item.image,
      categories: item.categories ?? [],
    });

    await loadRecentPlaces();
  }

  async function fetchPlaces() {
    try {
      setLoading(true);
      setIsOfflineMode(false);

      const coords = await getCurrentUserLocation();

      if (!coords) {
        Alert.alert(
          'Permissão necessária',
          'Permita o acesso à localização para calcular a distância dos locais.'
        );
      }

      const response = await api.get('/places/search', {
        params: {
          search: searchText.trim() || undefined,
          categories:
            selectedCategories.length > 0 ? selectedCategories : undefined,
          minRating: minRating !== null ? minRating : undefined,

          maxDistance:
            isNearMeMode
              ? 100
              : maxDistance !== null
                ? maxDistance
                : undefined,

          sortBy: isNearMeMode || maxDistance !== null ? 'distance' : 'name',
          page: 1,
          limit: 20,
          userLat: coords?.latitude,
          userLng: coords?.longitude,
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();

          Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;

            if (Array.isArray(value)) {
              value.forEach((item) => searchParams.append(key, String(item)));
            } else {
              searchParams.append(key, String(value));
            }
          });

          return searchParams.toString();
        },
        timeout: 10000,
      });

      const items: Place[] = response.data.items ?? [];

      const orderedItems =
        isNearMeMode || maxDistance !== null
          ? [...items].sort((a, b) => {
              const distanceA =
                typeof a.distance === 'number' ? a.distance : Number.MAX_VALUE;
              const distanceB =
                typeof b.distance === 'number' ? b.distance : Number.MAX_VALUE;

              return distanceA - distanceB;
            })
          : items;

      setPlaces(orderedItems);

      try {
        await savePlacesOffline(orderedItems);
        console.log('Locais salvos offline:', orderedItems.length);
      } catch (offlineSaveError) {
        console.log('Erro ao salvar locais offline:', offlineSaveError);
      }
    } catch (error: any) {
      console.log('Erro ao buscar lugares:', error?.message);
      console.log('URL:', error?.config?.url);
      console.log('Response:', error?.response?.data);

      try {
        const coords = userCoords ?? await getCurrentUserLocation();
        const offlineRecords = await getOfflinePlaces();
        const offlineItems = offlineRecords.map(normalizeOfflinePlace);
        const filteredOfflineItems = applyOfflineFilters(offlineItems, coords);

        setPlaces(filteredOfflineItems);
        setIsOfflineMode(true);

        if (filteredOfflineItems.length === 0) {
          Alert.alert(
            'Modo offline',
            'Não foi possível conectar à internet e não existem locais salvos para esta busca.'
          );
        } else {
          Alert.alert(
            'Modo offline',
            'Sem conexão com a API. Exibindo locais salvos no dispositivo.'
          );
        }
      } catch (offlineError) {
        console.log('Erro ao carregar locais offline:', offlineError);
        setPlaces([]);
        Alert.alert(t('common.error'), t('results.searchError'));
      }
    } finally {
      setLoading(false);
    }
  }

  function getRatingText(item: Place) {
    const reviewsCount = Number(item.reviewsCount || 0);
    const averageRating = Math.min(Number(item.averageRating || 0), 5);

    if (reviewsCount <= 0) {
      return t('results.noReviews');
    }

    return `⭐ ${averageRating.toFixed(1)} • ${reviewsCount} avaliações`;
  }

  function getDistanceText(distance?: number) {
    if (typeof distance !== 'number' || Number.isNaN(distance)) {
      return null;
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m ${t('results.fromYou')}`;
    }

    return `${distance.toFixed(1)} km ${t('results.fromYou')}`;
  }

  function getImageUri(item: Place) {
    if (imageErrors[item._id]) return FALLBACK_IMAGE;

    const imageUrl = item.images?.[0] || item.image;

    if (!imageUrl || !imageUrl.startsWith('https://')) {
      return FALLBACK_IMAGE;
    }

    return imageUrl;
  }

  function isFavorite(placeId: string) {
    return favoriteItems.some((item) => item._id === placeId);
  }

  function isRecentlyViewed(placeId: string) {
    return recentPlaces.some((item) => item._id === placeId);
  }

  async function handleSelectPlace(item: Place) {
    await saveRecentPlace(item);

    navigation.navigate('MainTabs', {
      screen: 'HomeTab',
      params: {
        selectedPlace: item,
      },
    });
  }

  async function handleOpenDetails(item: Place) {
    await saveRecentPlace(item);

    navigation.navigate('Details', {
      placeId: item._id,
      offlinePlace: isOfflineMode ? item : undefined,
    });
  }

  function handleToggleFavorite(item: Place) {
    dispatch(toggleFavorite(item));
  }

  async function handleOpenRoutes(item: Place) {
    try {
      if (!item?.location?.coordinates?.length) {
        Alert.alert('Erro', 'Localização não disponível.');
        return;
      }

      const [lng, lat] = item.location.coordinates;

      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir as rotas.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir as rotas.');
    }
  }

  function renderItem({ item }: { item: Place }) {
    const favorite = isFavorite(item._id);
    const recent = isRecentlyViewed(item._id);
    const distanceText = getDistanceText(item.distance);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => handleSelectPlace(item)}
      >
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            {
              backgroundColor: colors.buttonBackground,
              borderColor: colors.buttonBorder,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => handleToggleFavorite(item)}
        >
          <Ionicons
            name={favorite ? 'star' : 'star-outline'}
            size={22}
            color={favorite ? '#FACC15' : colors.iconMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.detailsButton,
            {
              backgroundColor: colors.buttonBackground,
              borderColor: colors.buttonBorder,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => handleOpenDetails(item)}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Image
          source={{ uri: getImageUri(item) }}
          style={[
            styles.cardImage,
            {
              backgroundColor: colors.imageBackground,
            },
          ]}
          resizeMode="cover"
          onError={() => {
            setImageErrors((prev) => ({
              ...prev,
              [item._id]: true,
            }));
          }}
        />

        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={[
              styles.cardMeta,
              {
                color: colors.meta,
              },
            ]}
          >
            {getRatingText(item)}
          </Text>

          {distanceText ? (
            <Text
              style={[
                styles.cardDistance,
                {
                  color: colors.primary,
                },
              ]}
            >
              📍 {distanceText}
            </Text>
          ) : null}

          {recent ? (
            <Text
              style={[
                styles.recentBadge,
                {
                  color: colors.primary,
                },
              ]}
            >
              {t('results.viewedRecently')}
            </Text>
          ) : null}

          <Text
            style={[
              styles.cardDescription,
              {
                color: colors.description,
              },
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          <Text
            style={[
              styles.cardAddress,
              {
                color: colors.muted,
              },
            ]}
            numberOfLines={1}
          >
            📍 {item.address}
          </Text>

          {item.openingHours ? (
            <Text
              style={[
                styles.cardAddress,
                {
                  color: colors.muted,
                },
              ]}
              numberOfLines={1}
            >
              🕒 {item.openingHours}
            </Text>
          ) : null}

          {item.contact ? (
            <Text
              style={[
                styles.cardAddress,
                {
                  color: colors.muted,
                },
              ]}
              numberOfLines={1}
            >
              📞 {item.contact}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.routeButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => handleOpenRoutes(item)}
          >
            <Ionicons name="navigate-outline" size={17} color="#FFFFFF" />
            <Text style={styles.routeButtonText}>{t('results.routes')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const subtitleText = isNearMeMode
    ? t('results.nearMeSubtitle')
    : searchText
      ? t('results.resultsFor', { query: searchText })
      : null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.buttonBackground,
              borderColor: colors.buttonBorder,
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: colors.title,
            },
          ]}
        >
          {isNearMeMode ? t('results.nearMeTitle') : t('results.title')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {subtitleText ? (
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.description,
            },
          ]}
        >
          {subtitleText}
        </Text>
      ) : null}

      {isOfflineMode ? (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: colors.offlineBackground,
              borderColor: colors.offlineBorder,
            },
          ]}
        >
          <Ionicons name="cloud-offline-outline" size={18} color={colors.offlineText} />
          <Text
            style={[
              styles.offlineBannerText,
              {
                color: colors.offlineText,
              },
            ]}
          >
            Modo offline: exibindo locais salvos no dispositivo.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.description,
                },
              ]}
            >
              {isOfflineMode
                ? 'Nenhum local salvo offline para esta busca.'
                : isNearMeMode
                  ? 'Nenhum local próximo encontrado.'
                  : t('results.noResults')}
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },

  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  title: {
    marginTop: 20,
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 40,
  },

  subtitle: {
    fontSize: 14,
    marginBottom: 14,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  offlineBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 20,
  },

  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
  },

  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  detailsButton: {
    position: 'absolute',
    top: 52,
    right: 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 34,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardMeta: {
    fontSize: 14,
    marginBottom: 4,
  },

  recentBadge: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },

  cardDistance: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },

  cardAddress: {
    fontSize: 12,
  },

  routeButton: {
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
  },

  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
});
