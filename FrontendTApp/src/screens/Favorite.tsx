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
    imageBackground: isDark ? '#334155' : '#CBD5E1',
    removeButton: isDark ? '#0F172A' : '#FFFFFF',
    removeButtonBorder: isDark ? '#475569' : '#E2E8F0',
  };

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

  const getPlaceRating = (item: FavoritePlace) => {
    const place = item as FavoritePlace & {
      rating?: number;
      averageRating?: number;
      reviewsCount?: number;
    };

    if (typeof place.averageRating === 'number') {
      return place.averageRating.toFixed(1);
    }

    if (typeof place.rating === 'number') {
      return place.rating.toFixed(1);
    }

    return '0.0';
  };

  const renderItem = ({ item }: { item: FavoritePlace }) => {
    const imageUrl =
      item.images?.[0] && item.images[0].startsWith('https://')
        ? item.images[0]
        : FALLBACK_IMAGE;

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
        onPress={() => handleOpenDetails(item)}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.cardImage,
            {
              backgroundColor: colors.imageBackground,
            },
          ]}
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
            ⭐ {getPlaceRating(item)}
          </Text>

          <Text
            style={[
              styles.cardDescription,
              {
                color: colors.description,
              },
            ]}
            numberOfLines={2}
          >
            {item.description || 'Sem descrição disponível.'}
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
            📍 {item.address || 'Endereço não informado'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.removeButton,
            {
              backgroundColor: colors.removeButton,
              borderColor: colors.removeButtonBorder,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => handleRemoveFavorite(item._id)}
        >
          <Ionicons name="star" size={22} color="#FACC15" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: colors.title,
          },
        ]}
      >
        {t('favorites.title')}
      </Text>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyText,
              {
                color: colors.text,
              },
            ]}
          >
            {t('favorites.empty')}
          </Text>

          <Text
            style={[
              styles.helperText,
              {
                color: colors.description,
              },
            ]}
          >
            {t('favorites.helper')}
          </Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  title: {
    marginTop: 30,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
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
    textAlign: 'center',
    marginBottom: 8,
  },

  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  listContent: {
    paddingBottom: 20,
  },

  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
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

  removeButton: {
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
});