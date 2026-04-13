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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite } from '../slices/favoriteSlice';
import type { RootState } from '../store';

const API_URL =
  Constants.expoConfig?.extra?.API_URL || 'http://192.168.43.45:3000';

type Place = {
  _id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  address: string;
  openingHours?: string;
  contact?: string;
  images?: string[];
  distance?: number;
  latitude?: number;
  longitude?: number;
};

export default function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const favoriteItems = useSelector((state: RootState) => state.favorites.items);

  const searchState = useSelector((state: RootState) => state.search);
  const searchText = searchState?.searchText ?? '';
  const filters = searchState?.filters ?? {
    categories: [],
    distance: null,
    rating: null,
  };

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedCategories: string[] = filters.categories ?? [];
  const minRating: number | null = filters.rating ?? null;
  const maxDistance: number | null = filters.distance ?? null;

  async function fetchPlaces() {
    try {
      setLoading(true);

      console.log('searchText redux:', searchText);
      console.log('filters redux:', filters);

      const response = await axios.get(`${API_URL}/places/search`, {
        params: {
          search: searchText.trim() || undefined,
          categories:
            selectedCategories.length > 0 ? selectedCategories : undefined,
          minRating: minRating !== null ? minRating : undefined,
          maxDistance: maxDistance !== null ? maxDistance : undefined,
          sortBy: maxDistance !== null ? 'distance' : 'name',
          page: 1,
          limit: 20,
          userLat: -23.5505,
          userLng: -46.6333,
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();

          Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
              value.forEach((item) => {
                searchParams.append(key, String(item));
              });
            } else {
              searchParams.append(key, String(value));
            }
          });

          return searchParams.toString();
        },
        timeout: 10000,
      });

      setPlaces(response.data.items ?? []);
    } catch (error: any) {
      console.log('Erro ao buscar lugares:', error?.message);
      console.log('URL:', error?.config?.url);
      console.log('Response:', error?.response?.data);
      setPlaces([]);
      Alert.alert(t('common.error'), t('results.searchError'));
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
    }, [searchText, JSON.stringify(filters)])
  );

  const handleSelectPlace = (item: Place) => {
    navigation.navigate('MainTabs', {
      screen: 'HomeTab',
      params: {
        selectedPlace: item,
      },
    });
  };

  const isFavorite = (placeId: string) => {
    return favoriteItems.some((item) => item._id === placeId);
  };

  const handleToggleFavorite = (item: Place) => {
    dispatch(toggleFavorite(item));
  };

  const renderItem = ({ item }: { item: Place }) => {
    const favorite = isFavorite(item._id);

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

        <Image
          source={{
            uri: item.images?.[0] || 'https://via.placeholder.com/100',
          }}
          style={styles.cardImage}
        />

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.cardMeta}>
            ⭐ {typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'}
            {typeof item.distance === 'number'
              ? ` • 📍 ${item.distance.toFixed(1)} km`
              : ''}
          </Text>

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
        </View>
      </TouchableOpacity>
    );
  };

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

        <Text style={styles.title}>{t('results.title')}</Text>

        <View style={styles.headerSpacer} />
      </View>

      {searchText ? (
        <Text style={styles.subtitle}>
          {t('results.resultsFor', { query: searchText })}
        </Text>
      ) : null}

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
            <Text style={styles.emptyText}>{t('results.noResults')}</Text>
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
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#64748B',
  },
});