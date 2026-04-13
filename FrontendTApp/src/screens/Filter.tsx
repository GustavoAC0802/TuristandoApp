import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '../store';
import { setFilters } from '../slices/searchSlice';

type CategoryKey = 'parque' | 'museu' | 'história' | 'aventura';

const categoriesList: CategoryKey[] = [
  'parque',
  'museu',
  'história',
  'aventura',
];

export default function FiltersScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const savedFilters = useSelector((state: RootState) => state.search.filters);

  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(
    (savedFilters.categories as CategoryKey[]) ?? []
  );
  const [distance, setDistance] = useState<number | null>(
    savedFilters.distance ?? null
  );
  const [rating, setRating] = useState<number | null>(
    savedFilters.rating ?? null
  );

  const toggleCategory = (category: CategoryKey) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setDistance(null);
    setRating(null);
  };

  const saveFilters = () => {
    dispatch(
      setFilters({
        categories: selectedCategories,
        distance,
        rating,
      })
    );
  };

  const handleGoBack = () => {
    saveFilters();
    navigation.goBack();
  };

  const handleSearch = () => {
    saveFilters();
    navigation.navigate('Results');
  };

  const getCategoryLabel = (category: CategoryKey) => {
    switch (category) {
      case 'parque':
        return 'Parques';
      case 'museu':
        return 'Museus';
      case 'história':
        return 'História';
      case 'aventura':
        return 'Aventura';
      default:
        return category;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('filters.title')}</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.subtitleWrapper}>
        <Text style={styles.subtitle}>{t('filters.categories')}</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {categoriesList.map((category) => {
          const isSelected = selectedCategories.includes(category);

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => toggleCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
              >
                {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('filters.distance')}</Text>

        <View style={styles.sliderWrapper}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={distance ?? 1}
            onSlidingComplete={(value) => setDistance(value)}
            minimumTrackTintColor="#0F172A"
            maximumTrackTintColor="#D1D5DB"
            thumbTintColor="#0F172A"
          />
          <Text style={styles.distanceText}>
            {distance === null ? 'Não definido' : `${distance} km`}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('filters.rating')}</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = rating !== null && star <= rating;

            return (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.8}
                style={styles.starButton}
              >
                <Ionicons
                  name={filled ? 'star' : 'star-outline'}
                  size={40}
                  color="#000"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearFilters}
          activeOpacity={0.85}
        >
          <Text style={styles.clearButtonText}>{t('filters.clear')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.85}
        >
          <Text style={styles.searchButtonText}>{t('filters.search')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 18,
  },
  backButton: {
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
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  subtitleWrapper: {
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    marginBottom: 48,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  categoryChipSelected: {
    backgroundColor: '#D9D9D9',
    borderColor: '#D9D9D9',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  categoryTextSelected: {
    color: '#111827',
  },
  section: {
    marginBottom: 52,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 18,
  },
  sliderWrapper: {
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginLeft: -10,
  },
  distanceText: {
    marginTop: -2,
    marginLeft: 6,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  starButton: {
    paddingRight: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  searchButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 34,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
});