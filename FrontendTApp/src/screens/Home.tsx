import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import api from '../services/api';
import { searchPlaces } from '../slices/placesSlice';
import type { RootState } from '../store';
import { setSearchText } from '../slices/searchSlice';
import FilterIcon from '../assets/images/Filter.png';

import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from '../services/historyStorage';
import i18n from '../i18n';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

type SelectedPlace = {
  _id: string;
  name: string;
  city?: string;
  address?: string;
  images?: string[];
  averageRating?: number;
  reviewsCount?: number;
  location?: {
    type: string;
    coordinates: number[];
  };
};

type CurrentWeather = {
  temperature: number;
  description: string;
  iconUrl: string;
};

export default function HomeScreen() {
  const [region, setRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [cardImageError, setCardImageError] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(
    null
  );

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const searchText = useSelector((state: RootState) => state.search.searchText);
  const theme = useSelector((state: RootState) => state.theme.mode);

  const selectedPlace: SelectedPlace | undefined = route.params?.selectedPlace;
  const isDark = theme === 'dark';

  useEffect(() => {
    loadLocation();
    loadSearchHistory();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setShowSearchHistory(false);
      return () => { };
    }, [])
  );

  useEffect(() => {
    if (!selectedPlace?.location?.coordinates) return;

    setCardImageError(false);
    setCurrentWeather(null);

    const [longitude, latitude] = selectedPlace.location.coordinates;

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    if (selectedPlace.city) {
      fetchCurrentWeather(selectedPlace.city);
    }
  }, [selectedPlace]);

  async function loadSearchHistory() {
    const history = await getSearchHistory();
    setSearchHistory(history);
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
      console.log('Erro ao buscar clima atual na Home:', error?.message);
    }
  }

  async function loadLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('home.alerts.permissionDeniedTitle'),
          t('home.alerts.permissionDeniedMessage')
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      const currentCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setUserLocation(currentCoords);

      if (!selectedPlace) {
        setRegion({
          ...currentCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch {
      Alert.alert(t('common.error'), t('home.alerts.locationError'));
    }
  }

  function getRatingText(place?: SelectedPlace) {
    const reviewsCount = Number(place?.reviewsCount || 0);
    const averageRating = Math.min(Number(place?.averageRating || 0), 5);

    if (reviewsCount <= 0) {
      return t('results.noReviews');
    }

    return `⭐ ${averageRating.toFixed(1)} • ${reviewsCount} ${t(
      'details.reviews'
    )}`;
  }

  function handleOpenFilters() {
    navigation.navigate('Filters');
  }

  function handleOpenRecommendations() {
    navigation.navigate('Recommendations');
  }

  async function handleSearch() {
    Keyboard.dismiss();

    const trimmedSearch = searchText.trim();

    if (!trimmedSearch) {
      Alert.alert(
        t('home.alerts.emptySearchTitle'),
        t('home.alerts.emptySearchMessage')
      );
      return;
    }

    if (!region) return;

    try {
      await addSearchHistory(trimmedSearch);
      await loadSearchHistory();
      setShowSearchHistory(false);

      await dispatch(
        searchPlaces({
          search: trimmedSearch,
          userLat: userLocation?.latitude ?? region.latitude,
          userLng: userLocation?.longitude ?? region.longitude,
        }) as any
      );

      navigation.navigate('Results');
    } catch {
      Alert.alert(t('common.error'), t('results.searchError'));
    }
  }

  async function handleNearMe() {
    Keyboard.dismiss();
    setShowSearchHistory(false);

    try {
      setNearMeLoading(true);

      let coords = userLocation;

      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          Alert.alert(
            t('home.alerts.permissionDeniedTitle'),
            t('home.alerts.permissionDeniedMessage')
          );
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});

        coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };

        setUserLocation(coords);
      }

      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await dispatch(
        searchPlaces({
          search: '',
          sortBy: 'distance',
          userLat: coords.latitude,
          userLng: coords.longitude,
        }) as any
      );

      navigation.navigate('Results', {
        mode: 'nearMe',
        title: t('results.nearMeTitle'),
      });
    } catch {
      Alert.alert(t('common.error'), t('results.searchError'));
    } finally {
      setNearMeLoading(false);
    }
  }

  async function handleSelectHistoryItem(item: string) {
    dispatch(setSearchText(item));
    setShowSearchHistory(false);
    Keyboard.dismiss();

    if (!region) return;

    try {
      await addSearchHistory(item);
      await loadSearchHistory();

      await dispatch(
        searchPlaces({
          search: item,
          userLat: userLocation?.latitude ?? region.latitude,
          userLng: userLocation?.longitude ?? region.longitude,
        }) as any
      );

      navigation.navigate('Results');
    } catch {
      Alert.alert(t('common.error'), 'Erro ao buscar locais');
    }
  }

  async function handleClearHistory() {
    await clearSearchHistory();
    setSearchHistory([]);
    setShowSearchHistory(false);
  }

  function openRouteToCoords(latitude: number, longitude: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  function handleMapPress(event: any) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    openRouteToCoords(latitude, longitude);
  }

  function handleSelectedPlaceRoute() {
    if (!selectedPlace?.location?.coordinates) return;

    const [longitude, latitude] = selectedPlace.location.coordinates;

    openRouteToCoords(latitude, longitude);
  }

  function handleClosePlaceCard() {
    setCurrentWeather(null);

    navigation.setParams({
      selectedPlace: undefined,
    });
  }

  function handleOpenDetails() {
    if (!selectedPlace?._id) return;

    navigation.navigate('Details', {
      placeId: selectedPlace._id,
      from: 'home',
    });
  }

  const selectedPlaceCoordinates = selectedPlace?.location?.coordinates
    ? {
      latitude: selectedPlace.location.coordinates[1],
      longitude: selectedPlace.location.coordinates[0],
    }
    : null;

  const selectedPlaceImage =
    !cardImageError &&
      selectedPlace?.images?.[0] &&
      selectedPlace.images[0].startsWith('https://')
      ? selectedPlace.images[0]
      : FALLBACK_IMAGE;

  if (!region) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
      ]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>
        <View style={styles.searchArea}>
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handleSearch}
              activeOpacity={0.8}
            >
              <Ionicons
                name="search"
                size={18}
                color={isDark ? '#CBD5E1' : '#64748B'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: '#2563EB',
                  borderColor: '#2563EB',
                },
              ]}
              onPress={handleOpenRecommendations}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              <TextInput
                value={searchText}
                onChangeText={(text) => {
                  dispatch(setSearchText(text));

                  if (text.trim().length > 0) {
                    setShowSearchHistory(true);
                  } else {
                    setShowSearchHistory(false);
                  }
                }}
                onSubmitEditing={handleSearch}
                onFocus={() => {
                  if (searchText.trim().length > 0) {
                    setShowSearchHistory(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSearchHistory(false);
                  }, 150);
                }}
                returnKeyType="search"
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor={isDark ? '#CBD5E1' : '#64748B'}
                style={[
                  styles.input,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handleOpenFilters}
              activeOpacity={0.8}
            >
              <Image
                source={FilterIcon}
                style={[
                  styles.filterIcon,
                  { tintColor: isDark ? '#CBD5E1' : '#64748B' },
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                },
              ]}
              onPress={handleNearMe}
              activeOpacity={0.8}
              disabled={nearMeLoading}
            >
              {nearMeLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <Ionicons
                  name="location"
                  size={19}
                  color={isDark ? '#CBD5E1' : '#64748B'}
                />
              )}
            </TouchableOpacity>
          </View>

          {showSearchHistory && searchHistory.length > 0 ? (
            <View
              style={[
                styles.historyBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <View style={styles.historyHeader}>
                <Text
                  style={[
                    styles.historyTitle,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  {t('results.viewedRecently')}
                </Text>

                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearHistoryText}>{t('filters.clear')}</Text>
                </TouchableOpacity>
              </View>

              {searchHistory.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.historyItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectHistoryItem(item)}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={isDark ? '#CBD5E1' : '#64748B'}
                  />

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.historyItemText,
                      { color: isDark ? '#CBD5E1' : '#475569' },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation
          >
            {selectedPlaceCoordinates ? (
              <Marker
                coordinate={selectedPlaceCoordinates}
                title={selectedPlace?.name}
                description={selectedPlace?.address}
              />
            ) : null}
          </MapView>

          {selectedPlace ? (
            <View
              style={[
                styles.placeCard,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                activeOpacity={0.8}
                onPress={handleClosePlaceCard}
              >
                <Ionicons
                  name="close"
                  size={17}
                  color={isDark ? '#FFFFFF' : '#0F172A'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsButton}
                activeOpacity={0.8}
                onPress={handleOpenDetails}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.cardImageWrapper}>
                <Image
                  source={{ uri: selectedPlaceImage }}
                  style={styles.placeImage}
                  resizeMode="cover"
                  onError={() => setCardImageError(true)}
                />

                {currentWeather ? (
                  <View
                    style={[
                      styles.weatherBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(15, 23, 42, 0.9)'
                          : 'rgba(255, 255, 255, 0.92)',
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(226,232,240,0.95)',
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: currentWeather.iconUrl }}
                      style={styles.weatherIcon}
                    />

                    <View>
                      <Text
                        style={[
                          styles.weatherTemp,
                          { color: isDark ? '#FFFFFF' : '#0F172A' },
                        ]}
                      >
                        {currentWeather.temperature}°
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.weatherDesc,
                          { color: isDark ? '#CBD5E1' : '#475569' },
                        ]}
                      >
                        {currentWeather.description}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.placeName,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  {selectedPlace.name}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.placeAddress,
                    { color: isDark ? '#CBD5E1' : '#64748B' },
                  ]}
                >
                  {selectedPlace.city ||
                    selectedPlace.address ||
                    t('details.addressUnavailable', 'Endereço não informado')}
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.placeRating,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {getRatingText(selectedPlace)}
                </Text>

                <TouchableOpacity
                  style={styles.smallRouteButton}
                  activeOpacity={0.8}
                  onPress={handleSelectedPlaceRoute}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={15}
                    color="#FFFFFF"
                  />

                  <Text style={styles.smallRouteButtonText}>
                    {t('details.routes')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  searchArea: {
    marginTop: 8,
    marginBottom: 12,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  searchBox: {
    flex: 1,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  input: {
    fontSize: 14,
    fontWeight: '600',
  },

  historyBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  historyTitle: {
    fontSize: 13,
    fontWeight: '900',
  },

  clearHistoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },

  historyItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },

  mapWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },

  map: {
    flex: 1,
  },

  placeCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  detailsButton: {
    position: 'absolute',
    top: 52,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  cardImageWrapper: {
    height: 105,
    position: 'relative',
    backgroundColor: '#CBD5E1',
  },

  placeImage: {
    width: '100%',
    height: '100%',
  },

  weatherBadge: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 145,
  },

  weatherIcon: {
    width: 30,
    height: 30,
    marginRight: 4,
  },

  weatherTemp: {
    fontSize: 15,
    fontWeight: '900',
  },

  weatherDesc: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
    maxWidth: 88,
  },

  cardContent: {
    padding: 14,
    paddingRight: 96,
    minHeight: 104,
  },

  placeName: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },

  placeAddress: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  placeRating: {
    fontSize: 13,
    fontWeight: '700',
  },

  smallRouteButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  smallRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});