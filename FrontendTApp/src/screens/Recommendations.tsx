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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

import api from '../services/api';
import { toggleFavorite } from '../slices/favoriteSlice';
import type { RootState } from '../store';
import {
  getRecentPlaces,
  addRecentPlace,
  type RecentPlace,
} from '../services/historyStorage';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

type Place = {
  _id: string;
  name: string;
  description: string;
  categories: string[];
  address: string;
  openingHours?: string;
  contact?: string;
  website?: string;
  images?: string[];
  distance?: number;
  averageRating?: number;
  reviewsCount?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
};

export default function RecommendationsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const { t } = useTranslation();

  const favoriteItems = useSelector((state: RootState) => state.favorites.items);

  const [places, setPlaces] = useState<Place[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [mainCategory, setMainCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRecommendations();
    }, [])
  );

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

  async function loadRecommendations() {
    try {
      setLoading(true);

      const recent = await getRecentPlaces();
      setRecentPlaces(recent);

      const category = getMainCategory(recent);
      setMainCategory(category);

      if (!category) {
        setPlaces([]);
        return;
      }

      const coords = await getCurrentUserLocation();

      const response = await api.get('/places/search', {
        params: {
          categories: [category],
          sortBy: 'distance',
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

      const orderedItems = [...items].sort((a, b) => {
        const distanceA =
          typeof a.distance === 'number' ? a.distance : Number.MAX_VALUE;
        const distanceB =
          typeof b.distance === 'number' ? b.distance : Number.MAX_VALUE;

        return distanceA - distanceB;
      });

      setPlaces(orderedItems);
    } catch (error: any) {
      console.log('Erro ao buscar recomendações:', error?.message);
      console.log('URL:', error?.config?.url);
      console.log('Response:', error?.response?.data);

      setPlaces([]);
      Alert.alert(
        t('common.error'),
        t('recommendations.loadError', {
          defaultValue: 'Não foi possível carregar recomendações.',
        })
      );
    } finally {
      setLoading(false);
    }
  }

  function getMainCategory(recent: RecentPlace[]) {
    const count: Record<string, number> = {};

    recent.forEach((place) => {
      place.categories?.forEach((category) => {
        count[category] = (count[category] || 0) + 1;
      });
    });

    const main = Object.entries(count).sort((a, b) => b[1] - a[1])[0];

    return main?.[0] ?? null;
  }

  function getCategoryLabel(category: string) {
    const key = category.toLowerCase();

    return t(`categories.${key}`, {
      defaultValue: category,
    });
  }

  function getRecommendationsSubtitle() {
    if (mainCategory) {
      const categoryLabel = getCategoryLabel(mainCategory);

      return t('recommendations.basedOnCategory', {
        category: categoryLabel,
        defaultValue: `Baseado no seu interesse por: ${categoryLabel}`,
      });
    }

    return t('recommendations.basedOnRecent', {
      defaultValue: 'Baseado nos locais que você visualizou recentemente',
    });
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

  async function saveRecentPlace(item: Place) {
    await addRecentPlace({
      _id: item._id,
      name: item.name,
      address: item.address,
      image: item.images?.[0],
      categories: item.categories ?? [],
    });

    const recent = await getRecentPlaces();
    setRecentPlaces(recent);
  }

  function getRatingText(item: Place) {
    const reviewsCount = Number(item.reviewsCount || 0);
    const averageRating = Math.min(Number(item.averageRating || 0), 5);

    if (reviewsCount <= 0) {
      return t('results.noReviews');
    }

    return `⭐ ${averageRating.toFixed(1)} • ${reviewsCount} ${t(
      'details.reviews'
    )}`;
  }

  function getImageUri(item: Place) {
    if (imageErrors[item._id]) return FALLBACK_IMAGE;

    const imageUrl = item.images?.[0];

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
    });
  }

  function handleToggleFavorite(item: Place) {
    dispatch(toggleFavorite(item));
  }

  async function handleOpenRoutes(item: Place) {
    try {
      if (!item?.location?.coordinates?.length) {
        Alert.alert(t('common.error'), t('details.locationUnavailable'));
        return;
      }

      const [lng, lat] = item.location.coordinates;

      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('details.openRoutesError'));
      }
    } catch {
      Alert.alert(t('common.error'), t('details.openRoutesError'));
    }
  }

  function renderItem({ item }: { item: Place }) {
    const favorite = isFavorite(item._id);
    const recent = isRecentlyViewed(item._id);
    const distanceText = getDistanceText(item.distance);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleSelectPlace(item)}
      >
        <TouchableOpacity
          style={styles.favoriteButton}
          activeOpacity={0.8}
          onPress={() => handleToggleFavorite(item)}
        >
          <Ionicons
            name={favorite ? 'star' : 'star-outline'}
            size={22}
            color={favorite ? '#FACC15' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailsButton}
          activeOpacity={0.8}
          onPress={() => handleOpenDetails(item)}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>

        <Image
          source={{ uri: getImageUri(item) }}
          style={styles.cardImage}
          resizeMode="cover"
          onError={() => {
            setImageErrors((prev) => ({
              ...prev,
              [item._id]: true,
            }));
          }}
        />

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.cardMeta}>{getRatingText(item)}</Text>

          {distanceText ? (
            <Text style={styles.cardDistance}>📍 {distanceText}</Text>
          ) : null}

          {recent ? (
            <Text style={styles.recentBadge}>
              {t('results.viewedRecently')}
            </Text>
          ) : null}

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <Text style={styles.cardAddress} numberOfLines={1}>
            📍 {item.address}
          </Text>

          {item.openingHours ? (
            <Text style={styles.cardAddress} numberOfLines={1}>
              🕒 {item.openingHours}
            </Text>
          ) : null}

          {item.contact ? (
            <Text style={styles.cardAddress} numberOfLines={1}>
              📞 {item.contact}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.routeButton}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('recommendations.title')}</Text>

        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>{getRecommendationsSubtitle()}</Text>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t('recommendations.emptyHint', {
                defaultValue:
                  'Visualize alguns locais primeiro para receber recomendações.',
              })}
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    marginTop: 20,
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsButton: {
    position: 'absolute',
    top: 52,
    right: 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#CBD5E1',
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
    color: '#0F172A',
  },
  cardMeta: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  recentBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 6,
  },
  cardDistance: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: '#94A3B8',
  },
  routeButton: {
    height: 38,
    borderRadius: 12,
    backgroundColor: '#2563EB',
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
    color: '#64748B',
    lineHeight: 20,
  },
});