import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

export const SELECTED_PLACE_EVENT_GEOFENCING_TASK =
  'SELECTED_PLACE_EVENT_GEOFENCING_TASK';

const SELECTED_PLACE_EVENT_ALERT_STORAGE_KEY =
  '@turistando:selected_place_event_alert';

export type SelectedPlaceEventAlert = {
  placeId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  radius?: number;
  eventsCount?: number;
};

type StoredSelectedPlaceEventAlert = SelectedPlaceEventAlert & {
  active: boolean;
  createdAt: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(
  SELECTED_PLACE_EVENT_GEOFENCING_TASK,
  async ({ data, error }: any) => {
    if (error) {
      console.log('Erro na task de geofencing do local selecionado:', error);
      return;
    }

    const eventType = data?.eventType;

    if (eventType !== Location.GeofencingEventType.Enter) {
      return;
    }

    let storedAlert: StoredSelectedPlaceEventAlert | null = null;

    try {
      const stored = await AsyncStorage.getItem(
        SELECTED_PLACE_EVENT_ALERT_STORAGE_KEY
      );

      if (stored) {
        storedAlert = JSON.parse(stored);
      }
    } catch (storageError) {
      console.log('Erro ao ler alerta salvo:', storageError);
    }

    const placeName = storedAlert?.placeName || 'este local';
    const eventsCount = storedAlert?.eventsCount || 0;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evento perto de você 🎉',
        body:
          eventsCount > 0
            ? `Você está próximo de ${placeName}. Existem ${eventsCount} evento(s) próximos desse local.`
            : `Você está próximo de ${placeName}. Confira os eventos disponíveis no Turistando.`,
        sound: true,
        data: {
          placeId: storedAlert?.placeId,
          placeName,
        },
      },
      trigger: null,
    });
  }
);

export async function requestSelectedPlaceEventAlertPermissions() {
  const notificationPermission = await Notifications.requestPermissionsAsync();

  if (!notificationPermission.granted) {
    return {
      granted: false,
      message: 'Permissão de notificações negada.',
    };
  }

  const foregroundPermission =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundPermission.status !== 'granted') {
    return {
      granted: false,
      message: 'Permissão de localização negada.',
    };
  }

  const backgroundPermission =
    await Location.requestBackgroundPermissionsAsync();

  if (backgroundPermission.status !== 'granted') {
    return {
      granted: false,
      message:
        'Permissão de localização em segundo plano negada. Ative para receber alertas mesmo com o app fechado.',
    };
  }

  return {
    granted: true,
    message: 'Permissões concedidas.',
  };
}

export async function startSelectedPlaceEventGeofencing(
  place: SelectedPlaceEventAlert
) {
  if (
    !place.placeId ||
    !place.placeName ||
    typeof place.latitude !== 'number' ||
    typeof place.longitude !== 'number'
  ) {
    return {
      success: false,
      message: 'Local sem coordenadas válidas para ativar notificações.',
    };
  }

  await stopSelectedPlaceEventGeofencing();

  const radius = place.radius || 500;

  const alertToSave: StoredSelectedPlaceEventAlert = {
    ...place,
    radius,
    eventsCount: place.eventsCount || 0,
    active: true,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    SELECTED_PLACE_EVENT_ALERT_STORAGE_KEY,
    JSON.stringify(alertToSave)
  );

  await Location.startGeofencingAsync(SELECTED_PLACE_EVENT_GEOFENCING_TASK, [
    {
      identifier: `selected-place-event-alert-${place.placeId}`,
      latitude: place.latitude,
      longitude: place.longitude,
      radius,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
  ]);

  return {
    success: true,
    message: `Notificações ativadas para ${place.placeName}.`,
  };
}

export async function stopSelectedPlaceEventGeofencing() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    SELECTED_PLACE_EVENT_GEOFENCING_TASK
  );

  if (isRegistered) {
    await Location.stopGeofencingAsync(SELECTED_PLACE_EVENT_GEOFENCING_TASK);
  }

  await AsyncStorage.removeItem(SELECTED_PLACE_EVENT_ALERT_STORAGE_KEY);

  return {
    success: true,
    message: 'Notificações do local desativadas.',
  };
}

export async function getSelectedPlaceEventAlert() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    SELECTED_PLACE_EVENT_GEOFENCING_TASK
  );

  const stored = await AsyncStorage.getItem(
    SELECTED_PLACE_EVENT_ALERT_STORAGE_KEY
  );

  if (!stored) {
    return {
      active: isRegistered,
      placeId: null,
      placeName: null,
      latitude: null,
      longitude: null,
      eventsCount: 0,
    };
  }

  const parsed: StoredSelectedPlaceEventAlert = JSON.parse(stored);

  return {
    ...parsed,
    active: isRegistered && parsed.active,
  };
}