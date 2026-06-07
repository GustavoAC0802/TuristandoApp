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
  const theme = useSelector((state: RootState) => state.theme.mode);

  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#CBD5E1',
    title: isDark ? '#F8FAFC' : '#0F172A',
    text: isDark ? '#E2E8F0' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    chipBackground: isDark ? '#1E293B' : '#FFFFFF',
    chipSelected: '#3B82F6',
    primary: '#3B82F6',
  };

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
          style={[
            styles.backButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.title} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              color: colors.title,
            },
          ]}
        >
          {t('filters.title')}
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.title,
            },
          ]}
        >
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
                  {
                    backgroundColor: selected
                      ? colors.chipSelected
                      : colors.chipBackground,
                    borderColor: selected ? colors.chipSelected : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => toggleCategory(item.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.title,
            },
          ]}
        >
          {t('filters.distance')}
        </Text>

        <View style={styles.chipsContainer}>
          {[1, 5, 10, 20].map((d) => {
            const selected = distance === d;

            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.chipSelected
                      : colors.chipBackground,
                    borderColor: selected ? colors.chipSelected : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setDistance(selected ? null : d)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {d} {t('filters.km')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.title,
            },
          ]}
        >
          {t('filters.rating')}
        </Text>

        <View style={styles.chipsContainer}>
          {[3, 4, 5].map((r) => {
            const selected = rating === r;

            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? colors.chipSelected
                      : colors.chipBackground,
                    borderColor: selected ? colors.chipSelected : colors.border,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => setRating(selected ? null : r)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  ⭐ {r}+
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.clearButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleClear}
          >
            <Text
              style={[
                styles.clearText,
                {
                  color: colors.muted,
                },
              ]}
            >
              {t('filters.clear')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor: colors.primary,
              },
            ]}
            activeOpacity={0.85}
            onPress={handleApply}
          >
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
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
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
  },

  chipText: {
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 34,
    marginBottom: 20,
  },

  clearButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    fontSize: 16,
    fontWeight: '700',
  },

  applyButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});