import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSelector } from 'react-redux';

import api from '../services/api';
import type { RootState } from '../store';

type Place = {
  _id: string;
  name: string;
  address?: string;
  categories?: string[];
  image?: string;
  images?: string[];
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
};

type ItineraryPlace = {
  place: Place;
  order: number;
  time?: string;
  notes?: string;
};

type ItineraryDay = {
  day: number;
  places: ItineraryPlace[];
};

type Itinerary = {
  _id: string;
  title: string;
  days: ItineraryDay[];
};

const DEFAULT_TITLE = 'Meu roteiro';

function escapeHtml(value?: string | number | null) {
  if (value === undefined || value === null) return '';

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getMapsUrl(place?: Place) {
  if (!place) return null;

  const coordinates = place.location?.coordinates;

  if (coordinates && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const query = encodeURIComponent(place.address || place.name || '');

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function buildItineraryPdfHtml(itinerary: Itinerary) {
  const normalizedDays = normalizeDays(itinerary.days);
  const generatedAt = new Date().toLocaleDateString('pt-BR');

  const daysHtml = normalizedDays
    .map((day) => {
      const placesHtml = day.places
        .map((item, index) => {
          const place = item.place;
          const mapsUrl = getMapsUrl(place);

          return `
            <div class="place-card">
              <div class="place-header">
                <div class="place-number">${index + 1}</div>
                <div class="place-title-area">
                  <h3>${escapeHtml(place?.name || 'Local sem nome')}</h3>
                  ${
                    item.time
                      ? `<p class="time">Horário: ${escapeHtml(item.time)}</p>`
                      : '<p class="time muted">Horário não informado</p>'
                  }
                </div>
              </div>

              ${
                place?.address
                  ? `<p class="address"><strong>Endereço:</strong> ${escapeHtml(
                      place.address
                    )}</p>`
                  : ''
              }

              ${
                item.notes
                  ? `<p class="notes"><strong>Observações:</strong> ${escapeHtml(
                      item.notes
                    )}</p>`
                  : ''
              }

              ${
                mapsUrl
                  ? `<a class="map-button" href="${mapsUrl}">Abrir no Google Maps</a>`
                  : ''
              }
            </div>
          `;
        })
        .join('');

      return `
        <section class="day-section">
          <h2>Dia ${day.day}</h2>
          ${
            day.places.length > 0
              ? placesHtml
              : '<p class="empty">Nenhum local adicionado neste dia.</p>'
          }
        </section>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 28px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            background: #ffffff;
          }

          .header {
            padding: 22px;
            border-radius: 18px;
            background: #0f172a;
            color: #ffffff;
            margin-bottom: 24px;
          }

          .app-name {
            font-size: 13px;
            opacity: 0.8;
            margin-bottom: 8px;
          }

          h1 {
            font-size: 28px;
            margin: 0;
          }

          .subtitle {
            margin-top: 8px;
            font-size: 14px;
            opacity: 0.9;
          }

          .day-section {
            margin-bottom: 28px;
            page-break-inside: avoid;
          }

          h2 {
            font-size: 22px;
            margin: 0 0 10px;
            color: #0f172a;
          }

          .place-card {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            margin: 14px 0;
            background: #f8fafc;
            page-break-inside: avoid;
          }

          .place-header {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .place-number {
            width: 34px;
            height: 34px;
            border-radius: 17px;
            background: #2563eb;
            color: #ffffff;
            font-weight: bold;
            text-align: center;
            line-height: 34px;
            flex-shrink: 0;
          }

          .place-title-area {
            flex: 1;
          }

          h3 {
            margin: 0;
            font-size: 17px;
            color: #111827;
          }

          .time {
            margin: 4px 0 0;
            font-size: 13px;
            color: #2563eb;
            font-weight: bold;
          }

          .muted {
            color: #94a3b8;
            font-weight: normal;
          }

          .address,
          .notes {
            font-size: 13px;
            line-height: 1.45;
            margin: 12px 0 0;
            color: #374151;
          }

          .map-button {
            display: inline-block;
            margin-top: 14px;
            padding: 9px 12px;
            border-radius: 10px;
            background: #2563eb;
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: bold;
          }

          .empty {
            color: #64748b;
            font-size: 14px;
          }

          .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #64748b;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <header class="header">
          <div class="app-name">Turistando</div>
          <h1>${escapeHtml(itinerary.title || DEFAULT_TITLE)}</h1>
          <div class="subtitle">Gerado em ${escapeHtml(generatedAt)}</div>
        </header>

        ${
          normalizedDays.length > 0
            ? daysHtml
            : '<p class="empty">Este roteiro ainda não possui locais adicionados.</p>'
        }

        <footer class="footer">
          Roteiro gerado pelo aplicativo Turistando.
        </footer>
      </body>
    </html>
  `;
}

function normalizeDays(days?: ItineraryDay[]): ItineraryDay[] {
  if (!Array.isArray(days) || days.length === 0) {
    return [{ day: 1, places: [] }];
  }

  return [...days]
    .sort((a, b) => a.day - b.day)
    .map((day) => ({
      ...day,
      places: [...(day.places || [])].sort((a, b) => a.order - b.order),
    }));
}

function toBackendDays(days: ItineraryDay[]) {
  return days.map((day) => ({
    day: day.day,
    places: day.places.map((item, index) => ({
      place: item.place?._id,
      order: index + 1,
      time: item.time || '',
      notes: item.notes || '',
    })),
  }));
}

export default function ItineraryScreen() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const isDark = theme === 'dark';

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  const [selectedDay, setSelectedDay] = useState(1);
  const [title, setTitle] = useState(DEFAULT_TITLE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const colors = useMemo(
    () => ({
      background: isDark ? '#020617' : '#f5f7fb',
      card: isDark ? '#111827' : '#ffffff',
      cardSoft: isDark ? '#1f2937' : '#eef4ff',
      text: isDark ? '#f9fafb' : '#111827',
      muted: isDark ? '#9ca3af' : '#6b7280',
      border: isDark ? '#374151' : '#e5e7eb',
      input: isDark ? '#020617' : '#f9fafb',
      primary: '#2563eb',
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#f59e0b',
    }),
    [isDark]
  );

  const days = normalizeDays(itinerary?.days);

  const currentDay = useMemo(() => {
    const found = days.find((item) => item.day === selectedDay);

    if (found) {
      return {
        ...found,
        places: [...found.places].sort((a, b) => a.order - b.order),
      };
    }

    return {
      day: selectedDay,
      places: [],
    };
  }, [days, selectedDay]);

  const currentPlaces = currentDay.places;

  async function loadItineraries(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await api.get('/itineraries/my');
      let list: Itinerary[] = Array.isArray(response.data) ? response.data : [];

      if (list.length === 0) {
        const currentResponse = await api.get('/itineraries/current');
        list = currentResponse.data ? [currentResponse.data] : [];
      }

      const normalizedList = list.map((item) => ({
        ...item,
        days: normalizeDays(item.days),
      }));

      setItineraries(normalizedList);

      const currentStillExists = normalizedList.find(
        (item) => item._id === itinerary?._id
      );

      const selected = currentStillExists || normalizedList[0] || null;

      setItinerary(selected);

      if (selected) {
        const normalized = normalizeDays(selected.days);
        setTitle(selected.title || DEFAULT_TITLE);

        const hasSelectedDay = normalized.some(
          (day) => day.day === selectedDay
        );

        if (!hasSelectedDay) {
          setSelectedDay(normalized[0]?.day || 1);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar roteiros:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus roteiros.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadItineraries();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItineraries(false);
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadItineraries(false);
  }

  function updateSelectedItinerary(updated: Itinerary) {
    const normalizedUpdated = {
      ...updated,
      days: normalizeDays(updated.days),
    };

    setItinerary(normalizedUpdated);

    setItineraries((prev) => {
      const exists = prev.some((item) => item._id === normalizedUpdated._id);

      if (!exists) {
        return [normalizedUpdated, ...prev];
      }

      return prev.map((item) =>
        item._id === normalizedUpdated._id ? normalizedUpdated : item
      );
    });
  }

  async function saveItinerary(
    nextTitle: string,
    nextDays: ItineraryDay[],
    showSuccess = false
  ) {
    if (!itinerary) return null;

    const response = await api.put(`/itineraries/${itinerary._id}`, {
      title: nextTitle.trim() || DEFAULT_TITLE,
      days: toBackendDays(nextDays),
    });

    const updated: Itinerary = response.data;

    updateSelectedItinerary(updated);

    if (showSuccess) {
      Alert.alert('Pronto', 'Roteiro atualizado.');
    }

    return updated;
  }

  async function updateTitle() {
    if (!itinerary) return;

    try {
      setSaving(true);

      const updated = await saveItinerary(title, days, true);

      if (updated) {
        setTitle(updated.title || DEFAULT_TITLE);
      }
    } catch (error) {
      console.error('Erro ao atualizar nome do roteiro:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o nome do roteiro.');
    } finally {
      setSaving(false);
    }
  }

  async function createNewItinerary() {
    try {
      setCreating(true);

      const count = itineraries.length + 1;

      const response = await api.post('/itineraries', {
        title: `Roteiro ${count}`,
        days: [
          {
            day: 1,
            places: [],
          },
        ],
      });

      const created: Itinerary = response.data;
      const normalizedCreated = {
        ...created,
        days: normalizeDays(created.days),
      };

      setItineraries((prev) => [normalizedCreated, ...prev]);
      setItinerary(normalizedCreated);
      setTitle(normalizedCreated.title || DEFAULT_TITLE);
      setSelectedDay(1);
    } catch (error) {
      console.error('Erro ao criar roteiro:', error);
      Alert.alert('Erro', 'Não foi possível criar um novo roteiro.');
    } finally {
      setCreating(false);
    }
  }

  async function deleteCurrentItinerary() {
    if (!itinerary) return;

    if (itineraries.length <= 1) {
      Alert.alert(
        'Atenção',
        'Você precisa ter pelo menos um roteiro. Crie outro antes de apagar este.'
      );
      return;
    }

    Alert.alert(
      'Apagar roteiro',
      `Deseja apagar "${itinerary.title}"? Todos os dias e locais dele serão removidos.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              await api.delete(`/itineraries/${itinerary._id}`);

              const remaining = itineraries.filter(
                (item) => item._id !== itinerary._id
              );

              const next = remaining[0] || null;

              setItineraries(remaining);
              setItinerary(next);

              if (next) {
                setTitle(next.title || DEFAULT_TITLE);
                setSelectedDay(normalizeDays(next.days)[0]?.day || 1);
              }
            } catch (error) {
              console.error('Erro ao apagar roteiro:', error);
              Alert.alert('Erro', 'Não foi possível apagar este roteiro.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  function selectItinerary(item: Itinerary) {
    const normalized = {
      ...item,
      days: normalizeDays(item.days),
    };

    setItinerary(normalized);
    setTitle(normalized.title || DEFAULT_TITLE);
    setSelectedDay(normalized.days[0]?.day || 1);
  }

  async function addDay() {
    if (!itinerary) return;

    const maxDay =
      days.length > 0 ? Math.max(...days.map((item) => item.day)) : 0;

    const newDayNumber = maxDay + 1;

    const updatedDays: ItineraryDay[] = [
      ...days,
      {
        day: newDayNumber,
        places: [],
      },
    ];

    try {
      setSaving(true);

      const updated = await saveItinerary(title, updatedDays);

      if (updated) {
        setSelectedDay(newDayNumber);
      }
    } catch (error) {
      console.error('Erro ao adicionar dia:', error);
      Alert.alert('Erro', 'Não foi possível adicionar um novo dia.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteDay(dayNumber: number) {
    if (!itinerary) return;

    if (days.length <= 1) {
      Alert.alert('Atenção', 'O roteiro precisa ter pelo menos um dia.');
      return;
    }

    Alert.alert(
      'Remover dia',
      `Deseja remover o Dia ${dayNumber}? Os locais desse dia também serão removidos.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              const remainingDays = days
                .filter((item) => item.day !== dayNumber)
                .map((item, index) => ({
                  ...item,
                  day: index + 1,
                  places: item.places.map((placeItem, placeIndex) => ({
                    ...placeItem,
                    order: placeIndex + 1,
                  })),
                }));

              const updated = await saveItinerary(title, remainingDays);

              if (updated) {
                const normalized = normalizeDays(updated.days);
                setSelectedDay(normalized[0]?.day || 1);
              }
            } catch (error) {
              console.error('Erro ao remover dia:', error);
              Alert.alert('Erro', 'Não foi possível remover este dia.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  async function removePlace(placeId: string) {
    if (!itinerary) return;

    Alert.alert('Remover local', 'Deseja remover este local do roteiro?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);

            const response = await api.delete(
              `/itineraries/${itinerary._id}/places/${placeId}?day=${selectedDay}`
            );

            const updated: Itinerary = response.data;
            updateSelectedItinerary(updated);
          } catch (error) {
            console.error('Erro ao remover local:', error);
            Alert.alert('Erro', 'Não foi possível remover o local.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  async function saveCurrentDayPlaces(places: ItineraryPlace[]) {
    if (!itinerary) return;

    const reordered = places.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    const updatedDays = days.map((day) =>
      day.day === selectedDay
        ? {
            ...day,
            places: reordered,
          }
        : day
    );

    setItinerary((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        days: normalizeDays(updatedDays),
      };
    });

    try {
      setSaving(true);

      const response = await api.put(`/itineraries/${itinerary._id}/reorder`, {
        day: selectedDay,
        places: reordered.map((item) => ({
          placeId: item.place._id,
          time: item.time || '',
          notes: item.notes || '',
        })),
      });

      const updated: Itinerary = response.data;
      updateSelectedItinerary(updated);
    } catch (error) {
      console.error('Erro ao salvar roteiro:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
      loadItineraries(false);
    } finally {
      setSaving(false);
    }
  }

  async function movePlace(index: number, direction: 'up' | 'down') {
    if (!itinerary) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentPlaces.length) {
      return;
    }

    const updatedPlaces = [...currentPlaces];
    const selected = updatedPlaces[index];

    updatedPlaces[index] = updatedPlaces[newIndex];
    updatedPlaces[newIndex] = selected;

    await saveCurrentDayPlaces(updatedPlaces);
  }

  function updatePlaceLocal(
    placeId: string,
    field: 'time' | 'notes',
    value: string
  ) {
    if (!itinerary) return;

    const updatedDays = days.map((day) => {
      if (day.day !== selectedDay) return day;

      return {
        ...day,
        places: day.places.map((item) =>
          item.place._id === placeId
            ? {
                ...item,
                [field]: value,
              }
            : item
        ),
      };
    });

    setItinerary({
      ...itinerary,
      days: updatedDays,
    });
  }

  async function savePlaceExtras() {
    await saveCurrentDayPlaces(currentPlaces);
  }


  async function handleSharePdf() {
    if (!itinerary) {
      Alert.alert('Atenção', 'Nenhum roteiro selecionado para compartilhar.');
      return;
    }

    try {
      setSaving(true);

      const pdfItinerary: Itinerary = {
        ...itinerary,
        title: title.trim() || itinerary.title || DEFAULT_TITLE,
        days: normalizeDays(days),
      };

      const html = buildItineraryPdfHtml(pdfItinerary);

      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert(
          'Compartilhamento indisponível',
          'Não foi possível abrir o compartilhamento neste dispositivo.'
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar roteiro',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF do roteiro:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF do roteiro.');
    } finally {
      setSaving(false);
    }
  }

  function renderItinerarySelector() {
    return (
      <View style={styles.itinerarySelectorArea}>
        <Text style={[styles.label, { color: colors.muted }]}>
          Meus roteiros
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.itinerarySelectorRow}
        >
          {itineraries.map((item) => {
            const active = item._id === itinerary?._id;

            return (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.itineraryChip,
                  {
                    backgroundColor: active ? colors.primary : colors.cardSoft,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => selectItinerary(item)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="map-outline"
                  size={15}
                  color={active ? '#FFFFFF' : colors.text}
                />

                <Text
                  style={[
                    styles.itineraryChipText,
                    {
                      color: active ? '#FFFFFF' : colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.title || DEFAULT_TITLE}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.newItineraryButton,
              {
                borderColor: colors.primary,
              },
            ]}
            onPress={createNewItinerary}
            disabled={creating || saving}
            activeOpacity={0.85}
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="add" size={17} color={colors.primary} />
                <Text
                  style={[
                    styles.newItineraryButtonText,
                    { color: colors.primary },
                  ]}
                >
                  Novo
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  function renderDayButton(day: ItineraryDay) {
    const active = day.day === selectedDay;
    const canDelete = days.length > 1;

    return (
      <View key={day.day} style={styles.dayButtonWrapper}>
        <TouchableOpacity
          style={[
            styles.dayButton,
            {
              backgroundColor: active ? colors.primary : colors.cardSoft,
              borderColor: active ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelectedDay(day.day)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.dayButtonText,
              {
                color: active ? '#FFFFFF' : colors.text,
              },
            ]}
          >
            Dia {day.day}
          </Text>
        </TouchableOpacity>

        {active && canDelete ? (
          <TouchableOpacity
            style={styles.deleteDayButton}
            onPress={() => deleteDay(day.day)}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  function renderPlaceCard(item: ItineraryPlace, index: number) {
    return (
      <TouchableOpacity
        key={item.place._id}
        activeOpacity={0.95}
        style={[
          styles.placeCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.placeHeader}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{index + 1}</Text>
          </View>

          <View style={styles.placeInfo}>
            <Text style={[styles.placeName, { color: colors.text }]}>
              {item.place?.name || 'Local sem nome'}
            </Text>

            {!!item.place?.address && (
              <Text style={[styles.placeAddress, { color: colors.muted }]}>
                {item.place.address}
              </Text>
            )}
          </View>

          <View style={styles.orderActions}>
            <TouchableOpacity
              style={styles.orderActionButton}
              onPress={() => movePlace(index, 'up')}
              disabled={index === 0 || saving}
            >
              <Ionicons
                name="chevron-up"
                size={21}
                color={index === 0 ? colors.muted : colors.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderActionButton}
              onPress={() => movePlace(index, 'down')}
              disabled={index === currentPlaces.length - 1 || saving}
            >
              <Ionicons
                name="chevron-down"
                size={21}
                color={
                  index === currentPlaces.length - 1
                    ? colors.muted
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.timeArea}>
            <Text style={[styles.label, { color: colors.muted }]}>Horário</Text>

            <TextInput
              value={item.time || ''}
              placeholder="09:00"
              placeholderTextColor={colors.muted}
              onChangeText={(value) =>
                updatePlaceLocal(item.place._id, 'time', value)
              }
              onBlur={savePlaceExtras}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.danger }]}
            onPress={() => removePlace(item.place._id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Observações</Text>

        <TextInput
          value={item.notes || ''}
          placeholder="Ex: comprar ingresso antes, visitar pela manhã..."
          placeholderTextColor={colors.muted}
          multiline
          onChangeText={(value) =>
            updatePlaceLocal(item.place._id, 'notes', value)
          }
          onBlur={savePlaceExtras}
          style={[
            styles.notesInput,
            {
              color: colors.text,
              backgroundColor: colors.input,
              borderColor: colors.border,
            },
          ]}
        />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Carregando roteiro...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.card}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTextArea}>
              <Text style={[styles.title, { color: colors.text }]}>
                Meu roteiro
              </Text>

              <Text style={[styles.subtitle, { color: colors.muted }]}>
                Crie roteiros, organize dias e defina a ordem dos locais.
              </Text>
            </View>

            {saving && <ActivityIndicator color={colors.primary} />}
          </View>

          {renderItinerarySelector()}

          <View
            style={[
              styles.titleCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.muted }]}>
              Nome do roteiro
            </Text>

            <View style={styles.titleRow}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Viagem em São Paulo"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                style={[
                  styles.titleInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                  },
                ]}
              />

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={updateTitle}
                disabled={saving}
              >
                <Ionicons name="save-outline" size={21} color="#FFFFFF" />
              </TouchableOpacity>
            </View>



            <TouchableOpacity
              style={[
                styles.sharePdfButton,
                {
                  backgroundColor: colors.success,
                },
              ]}
              onPress={handleSharePdf}
              disabled={saving || !itinerary}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />

              <Text style={styles.sharePdfButtonText}>
                Compartilhar roteiro em PDF
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteItineraryButton,
                {
                  borderColor: colors.danger,
                },
              ]}
              onPress={deleteCurrentItinerary}
              disabled={saving || itineraries.length <= 1}
              activeOpacity={0.85}
            >
              <Ionicons
                name="trash-outline"
                size={17}
                color={itineraries.length <= 1 ? colors.muted : colors.danger}
              />

              <Text
                style={[
                  styles.deleteItineraryText,
                  {
                    color:
                      itineraries.length <= 1 ? colors.muted : colors.danger,
                  },
                ]}
              >
                Apagar roteiro atual
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysArea}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.daysScroll}
              contentContainerStyle={styles.daysRow}
            >
              {days.map(renderDayButton)}

              <TouchableOpacity
                style={[
                  styles.addDayButton,
                  {
                    borderColor: colors.primary,
                  },
                ]}
                onPress={addDay}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addDayText, { color: colors.primary }]}>
                  Dia
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Dia {selectedDay}
            </Text>

            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              {currentPlaces.length} local(is)
            </Text>
          </View>

          {currentPlaces.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="map-outline" size={44} color={colors.muted} />

              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nenhum local neste dia
              </Text>

              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Vá até a tela de detalhes de um local e toque em “Adicionar ao
                roteiro”.
              </Text>
            </View>
          ) : (
            currentPlaces.map((item, index) => renderPlaceCard(item, index))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextArea: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },

  itinerarySelectorArea: {
    marginBottom: 14,
  },
  itinerarySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  itineraryChip: {
    maxWidth: 180,
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itineraryChipText: {
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 130,
  },
  newItineraryButton: {
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  newItineraryButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },

  titleCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  titleInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sharePdfButton: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sharePdfButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteItineraryButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  deleteItineraryText: {
    fontSize: 13,
    fontWeight: '900',
  },

  daysArea: {
    marginBottom: 18,
    minHeight: 50,
  },
  daysScroll: {
    flexGrow: 0,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingBottom: 4,
  },
  dayButtonWrapper: {
    position: 'relative',
    marginRight: 10,
    paddingTop: 4,
  },
  dayButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 40,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteDayButton: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addDayButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 40,
    marginRight: 8,
    marginTop: 4,
  },
  addDayText: {
    fontSize: 14,
    fontWeight: '700',
  },

  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
  },

  placeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  placeAddress: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  orderActions: {
    flexDirection: 'column',
    gap: 6,
  },
  orderActionButton: {
    width: 32,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  timeArea: {
    flex: 1,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});