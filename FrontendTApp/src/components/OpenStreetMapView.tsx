import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

type Place = {
  _id: string;
  name: string;
  city?: string;
  address?: string;
  categories?: string[];
  location?: {
    type?: string;
    coordinates?: number[];
  };
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

type Props = {
  places: Place[];
  selectedPlace?: Place | null;
  userLocation?: UserLocation | null;
  onSelectPlace?: (place: Place) => void;
};

function safeText(value?: string) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function OpenStreetMapView({
  places,
  selectedPlace = null,
  userLocation = null,
  onSelectPlace,
}: Props) {
  const html = useMemo(() => {
    const validPlaces = places
      .filter((place) => {
        const coords = place.location?.coordinates;

        return (
          Array.isArray(coords) &&
          typeof coords[0] === 'number' &&
          typeof coords[1] === 'number'
        );
      })
      .map((place) => ({
        id: place._id,
        name: safeText(place.name),
        address: safeText(place.address || place.city || ''),
        longitude: place.location?.coordinates?.[0] || 0,
        latitude: place.location?.coordinates?.[1] || 0,
      }));

    const firstPlace = validPlaces[0];

    const initialLat =
      selectedPlace?.location?.coordinates?.[1] ??
      userLocation?.latitude ??
      firstPlace?.latitude ??
      -23.55052;

    const initialLng =
      selectedPlace?.location?.coordinates?.[0] ??
      userLocation?.longitude ??
      firstPlace?.longitude ??
      -46.633308;

    const placesJson = JSON.stringify(validPlaces);
    const selectedPlaceId = selectedPlace?._id || '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />

          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          />

          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body,
            #map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #e5e7eb !important;
              color-scheme: light;
            }

            body {
              min-height: 100%;
            }

            #fallback {
              position: absolute;
              inset: 0;
              z-index: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: #e5e7eb;
              color: #334155;
              font-family: Arial, sans-serif;
              text-align: center;
              font-size: 14px;
              line-height: 20px;
            }

            .leaflet-container {
              z-index: 2;
              font-family: Arial, sans-serif;
              background: #e5e7eb !important;
            }

            .popup-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
            }

            .popup-address {
              font-size: 12px;
              color: #475569;
              margin-bottom: 8px;
            }

            .popup-button {
              border: 0;
              background: #2563eb;
              color: white;
              border-radius: 8px;
              padding: 7px 10px;
              font-size: 12px;
              font-weight: 700;
            }

            .user-marker {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #2563eb;
              border: 3px solid white;
              box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
            }
          </style>
        </head>

        <body>
          <div id="fallback">Carregando mapa...</div>
          <div id="map"></div>

          <script>
            const places = ${placesJson};
            const selectedPlaceId = ${JSON.stringify(selectedPlaceId)};

            function sendPlaceToApp(placeId) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'select-place',
                  placeId
                }));
              }
            }

            function showFallback(message) {
              const fallback = document.getElementById('fallback');
              if (fallback) {
                fallback.innerText = message;
                fallback.style.display = 'flex';
              }
            }

            function hideFallback() {
              const fallback = document.getElementById('fallback');
              if (fallback) {
                fallback.style.display = 'none';
              }
            }

            try {
              if (typeof L === 'undefined') {
                showFallback('Não foi possível carregar o mapa. Verifique a conexão com a internet.');
              } else {
                const map = L.map('map', {
                  zoomControl: true,
                  attributionControl: true,
                  preferCanvas: true
                }).setView([${initialLat}, ${initialLng}], 13);

                const tileLayer = L.tileLayer(
                  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                  }
                );

                tileLayer.on('load', hideFallback);
                tileLayer.on('tileerror', function () {
                  showFallback('Mapa indisponível no momento. Verifique sua conexão.');
                });

                tileLayer.addTo(map);

                setTimeout(function () {
                  map.invalidateSize();
                }, 300);

                const markers = [];

                places.forEach((place) => {
                  const marker = L.marker([place.latitude, place.longitude]).addTo(map);

                  const popupHtml =
                    '<div>' +
                      '<div class="popup-title">' + place.name + '</div>' +
                      '<div class="popup-address">' + place.address + '</div>' +
                      '<button class="popup-button" onclick="sendPlaceToApp(\\'' + place.id + '\\')">Selecionar</button>' +
                    '</div>';

                  marker.bindPopup(popupHtml);

                  marker.on('click', function () {
                    sendPlaceToApp(place.id);
                  });

                  markers.push({ id: place.id, marker });

                  if (place.id === selectedPlaceId) {
                    marker.openPopup();
                    map.setView([place.latitude, place.longitude], 15);
                  }
                });

                ${
                  userLocation
                    ? `
                      const userIcon = L.divIcon({
                        html: '<div class="user-marker"></div>',
                        className: '',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      });

                      L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
                        icon: userIcon
                      })
                        .addTo(map)
                        .bindPopup('Sua localização');
                    `
                    : ''
                }

                if (places.length > 1 && !selectedPlaceId) {
                  const group = L.featureGroup(markers.map((item) => item.marker));
                  map.fitBounds(group.getBounds().pad(0.2));
                }

                if (places.length === 0) {
                  hideFallback();
                }
              }
            } catch (error) {
              showFallback('Erro ao carregar o mapa.');
            }
          </script>
        </body>
      </html>
    `;
  }, [places, selectedPlace, userLocation]);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://localhost' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        forceDarkOn={false}
        androidLayerType="hardware"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        )}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'select-place') {
              const place = places.find((item) => item._id === data.placeId);

              if (place && onSelectPlace) {
                onSelectPlace(place);
              }
            }
          } catch {
            // ignora mensagens inválidas
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  webview: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});