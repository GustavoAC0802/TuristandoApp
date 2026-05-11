import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { RootState } from '../store';
import { setFilters } from '../slices/searchSlice';

export default function FiltersScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const currentFilters = useSelector((state: RootState) => state.search.filters);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters?.categories || []
  );

  const [distance, setDistance] = useState<number | null>(
    currentFilters?.distance || null
  );

  const [rating, setRating] = useState<number | null>(
    currentFilters?.rating || null
  );

  const categoryOptions = [
    { label: t('filters.categoryOptions.museums'), value: 'museu' },
    { label: t('filters.categoryOptions.restaurants'), value: 'gastronomia' },
    { label: t('filters.categoryOptions.touristAttractions'), value: 'história' },
    { label: t('register.interestOptions.adventure'), value: 'aventura' },
    { label: t('filters.categoryOptions.parks'), value: 'parque' },
    { label: t('filters.categoryOptions.cafes'), value: 'café' },
    { label: t('filters.categoryOptions.fun'), value: 'diversão' },
    { label: t('filters.categoryOptions.nature'), value: 'natureza' },
    { label: t('filters.categoryOptions.games'), value: 'jogos' },
    { label: t('filters.categoryOptions.sports'), value: 'esportes' },
    { label: t('filters.categoryOptions.art'), value: 'arte' },
    { label: t('filters.categoryOptions.technology'), value: 'tecnologia' },
  ];

  function toggleCategory(value: string) {
    if (selectedCategories.includes(value)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== value));
    } else {
      setSelectedCategories([...selectedCategories, value]);
    }
  }

  function handleApply() {
    dispatch(
      setFilters({
        categories: selectedCategories,
        distance,
        rating,
      })
    );

    navigation.navigate('Results');
  }

  function handleClear() {
    setSelectedCategories([]);
    setDistance(null);
    setRating(null);

    dispatch(
      setFilters({
        categories: [],
        distance: null,
        rating: null,
      })
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('filters.title')}</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CATEGORIAS */}
        <Text style={styles.sectionTitle}>
          {t('filters.categories')}
        </Text>

        <View style={styles.chipsContainer}>
          {categoryOptions.map((item) => {
            const selected = selectedCategories.includes(item.value);

            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                ]}
                onPress={() => toggleCategory(item.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DISTÂNCIA */}
        <Text style={styles.sectionTitle}>
          {t('filters.distance')}
        </Text>

        <View style={styles.chipsContainer}>
          {[1, 5, 10, 20].map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                distance === d && styles.chipSelected,
              ]}
              onPress={() => setDistance(distance === d ? null : d)}
            >
              <Text
                style={[
                  styles.chipText,
                  distance === d && styles.chipTextSelected,
                ]}
              >
                {d} {t('filters.km')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AVALIAÇÃO */}
        <Text style={styles.sectionTitle}>
          {t('filters.rating')}
        </Text>

        <View style={styles.chipsContainer}>
          {[3, 4, 5].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.chip,
                rating === r && styles.chipSelected,
              ]}
              onPress={() => setRating(rating === r ? null : r)}
            >
              <Text
                style={[
                  styles.chipText,
                  rating === r && styles.chipTextSelected,
                ]}
              >
                ⭐ {r}+
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOTÕES */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>{t('filters.clear')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>{t('filters.search')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  chipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  chipText: {
    color: '#0F172A',
  },

  chipTextSelected: {
    color: '#FFFFFF',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },

  clearText: {
    color: '#64748B',
    fontSize: 16,
  },

  applyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  applyText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});