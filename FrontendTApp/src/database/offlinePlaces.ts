import { Q } from '@nozbe/watermelondb';
import { database } from './database';
import PlaceModel from './Models/placeModel';

export type OfflinePlace = {
  _id: string;
  name: string;
  city?: string;
  description?: string;
  address?: string;
  categories?: string[];
  image?: string;
  images?: string[];
  website?: string;
  contact?: string;
  openingHours?: string;
  averageRating?: number;
  reviewsCount?: number;
  distance?: number;
  location?: {
    type?: string;
    coordinates?: number[];
  };
};

const placesCollection = database.collections.get<PlaceModel>('places');

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizePlace(place: any): OfflinePlace {
  const longitude =
    place?.location?.coordinates?.[0] ??
    place?.longitude ??
    0;

  const latitude =
    place?.location?.coordinates?.[1] ??
    place?.latitude ??
    0;

  const images = Array.isArray(place.images) ? place.images : [];
  const firstImage = place.image || images[0] || '';

  return {
    _id: place._id || place.id,
    name: place.name || '',
    city: place.city || '',
    description: place.description || '',
    address: place.address || '',
    categories: Array.isArray(place.categories) ? place.categories : [],
    image: firstImage,
    images,
    website: place.website || '',
    contact: place.contact || '',
    openingHours: place.openingHours || '',
    averageRating: Number(place.averageRating || 0),
    reviewsCount: Number(place.reviewsCount || 0),
    distance: place.distance,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  };
}

function modelToPlace(model: PlaceModel): OfflinePlace {
  const categories = safeJsonParse<string[]>(model.categoriesJson, []);
  const images = safeJsonParse<string[]>(model.imagesJson, []);

  return {
    _id: model.serverId,
    name: model.name,
    city: model.city,
    description: model.description,
    address: model.address,
    categories,
    image: model.image,
    images,
    website: model.website,
    contact: model.contact,
    openingHours: model.openingHours,
    averageRating: model.averageRating || 0,
    reviewsCount: model.reviewsCount || 0,
    location: {
      type: 'Point',
      coordinates: [model.longitude || 0, model.latitude || 0],
    },
  };
}

export async function savePlacesOffline(places: any[]) {
  const normalizedPlaces = places
    .map(normalizePlace)
    .filter(place => !!place._id && !!place.name);

  await database.write(async () => {
    for (const place of normalizedPlaces) {
      const existing = await placesCollection
        .query(Q.where('server_id', place._id))
        .fetch();

      const coordinates = place.location?.coordinates || [0, 0];
      const longitude = Number(coordinates[0] || 0);
      const latitude = Number(coordinates[1] || 0);

      if (existing.length > 0) {
        await existing[0].update((record: PlaceModel) => {
          record.name = place.name;
          record.city = place.city || '';
          record.description = place.description || '';
          record.address = place.address || '';
          record.categoriesJson = JSON.stringify(place.categories || []);
          record.image = place.image || '';
          record.imagesJson = JSON.stringify(place.images || []);
          record.website = place.website || '';
          record.contact = place.contact || '';
          record.openingHours = place.openingHours || '';
          record.longitude = longitude;
          record.latitude = latitude;
          record.averageRating = Number(place.averageRating || 0);
          record.reviewsCount = Number(place.reviewsCount || 0);
          record.cachedAt = Date.now();
        });
      } else {
        await placesCollection.create((record: PlaceModel) => {
          record.serverId = place._id;
          record.name = place.name;
          record.city = place.city || '';
          record.description = place.description || '';
          record.address = place.address || '';
          record.categoriesJson = JSON.stringify(place.categories || []);
          record.image = place.image || '';
          record.imagesJson = JSON.stringify(place.images || []);
          record.website = place.website || '';
          record.contact = place.contact || '';
          record.openingHours = place.openingHours || '';
          record.longitude = longitude;
          record.latitude = latitude;
          record.averageRating = Number(place.averageRating || 0);
          record.reviewsCount = Number(place.reviewsCount || 0);
          record.cachedAt = Date.now();
        });
      }
    }
  });
}

export async function getOfflinePlaces(): Promise<OfflinePlace[]> {
  const records = await placesCollection.query().fetch();
  return records.map(modelToPlace);
}

export async function getOfflinePlaceById(placeId: string): Promise<OfflinePlace | null> {
  const records = await placesCollection
    .query(Q.where('server_id', placeId))
    .fetch();

  if (records.length === 0) {
    return null;
  }

  return modelToPlace(records[0]);
}

export async function clearOfflinePlaces() {
  const records = await placesCollection.query().fetch();

  await database.write(async () => {
    await Promise.all(
      records.map((record: PlaceModel) => record.markAsDeleted())
    );
  });
}