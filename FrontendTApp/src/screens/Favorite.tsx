import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '../store';
import {
  fetchFavorites,
  removeFavorite,
  FavoritePlace,
} from '../slices/favoriteSlice';

const FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();

  const { items, loading } = useSelector((state: RootState) => state.favorites);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchFavorites());
    }, [dispatch])
  );

  const handleOpenDetails = (item: FavoritePlace) => {
    navigation.navigate('Details', {
      placeId: item._id,
    });
  };

  const handleRemoveFavorite = (placeId: string) => {
    dispatch(removeFavorite(placeId));
  };

  const renderItem = ({ item }: { item: FavoritePlace }) => {
    const imageUrl =
      item.images?.[0] && item.images[0].startsWith('https://')
        ? item.images[0]
        : FALLBACK_IMAGE;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleOpenDetails(item)}
      >
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.cardMeta}>
            ⭐ {typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <Text style={styles.cardAddress} numberOfLines={1}>
            📍 {item.address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          activeOpacity={0.8}
          onPress={() => handleRemoveFavorite(item._id)}
        >
          <Ionicons name="star" size={22} color="#FACC15" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('favorites.title')}</Text>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
          <Text style={styles.helperText}>{t('favorites.helper')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
  title: {
    marginTop: 30,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 20,
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
  removeButton: {
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
});