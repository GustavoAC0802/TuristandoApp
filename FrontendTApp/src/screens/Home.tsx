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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import type { RootState } from '../store';
import { setSearchText } from '../slices/searchSlice';
import FilterIcon from '../assets/images/Filter.png'; // ✅ OK

export default function HomeScreen() {
  const [region, setRegion] = useState<Region | null>(null);

  const dispatch = useDispatch();
  const searchText = useSelector((state: RootState) => state.search.searchText);
  const theme = useSelector((state: RootState) => state.theme.mode);

  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  useEffect(() => {
    loadLocation();
  }, []);

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

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      Alert.alert(
        t('common.error'),
        t('home.alerts.locationError')
      );
    }
  }

  function handleOpenFilters() {
    navigation.navigate('Filters');
  }

  function handleSearch() {
    Keyboard.dismiss();

    const trimmedSearch = searchText.trim();

    if (!trimmedSearch) {
      Alert.alert(
        t('home.alerts.emptySearchTitle'),
        t('home.alerts.emptySearchMessage')
      );
      return;
    }

    dispatch(setSearchText(trimmedSearch));
    navigation.navigate('Results');
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
        <View style={styles.searchRow}>
          {/* BOTÃO BUSCA */}
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

          {/* INPUT */}
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
              onChangeText={(text) => dispatch(setSearchText(text))}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={isDark ? '#CBD5E1' : '#64748B'}
              style={[
                styles.input,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            />
          </View>

          {/* BOTÃO FILTRO */}
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
              source={FilterIcon} // ✅ CORRETO
              style={{
                width: 18,
                height: 18,
                tintColor: isDark ? '#CBD5E1' : '#64748B',
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* MAPA */}
        <View
          style={[
            styles.mapContainer,
            { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
          ]}
        >
          {!region ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? '#E2E8F0' : '#334155'}
              />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? '#CBD5E1' : '#475569' },
                ]}
              >
                {t('home.loadingMap')}
              </Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              region={region}
              showsUserLocation
              showsMyLocationButton
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                title={t('home.currentLocationTitle')}
                description={t('home.currentLocationDescription')}
              />
            </MapView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  searchBox: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    fontSize: 15,
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
  },
});