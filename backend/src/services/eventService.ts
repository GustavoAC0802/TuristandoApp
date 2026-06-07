import axios from 'axios';
import ngeohash from 'ngeohash';

export type NearbyEvent = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  startDate?: string;
  startTime?: string;
  dateTime?: string;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
  source: 'ticketmaster';
};

type GetNearbyEventsParams = {
  lat: number;
  lng: number;
  radius?: number;
  keyword?: string;
};

function pickBestImage(images?: any[]) {
  if (!Array.isArray(images) || images.length === 0) {
    return undefined;
  }

  const sorted = [...images].sort((a, b) => {
    const areaA = Number(a.width || 0) * Number(a.height || 0);
    const areaB = Number(b.width || 0) * Number(b.height || 0);
    return areaB - areaA;
  });

  return sorted[0]?.url;
}

function normalizeTicketmasterEvent(event: any): NearbyEvent {
  const venue = event?._embedded?.venues?.[0];

  const latitude = venue?.location?.latitude
    ? Number(venue.location.latitude)
    : undefined;

  const longitude = venue?.location?.longitude
    ? Number(venue.location.longitude)
    : undefined;

  return {
    id: String(event.id),
    name: event.name || 'Evento sem nome',
    description: event.info || event.pleaseNote || undefined,
    image: pickBestImage(event.images),
    startDate: event.dates?.start?.localDate,
    startTime: event.dates?.start?.localTime,
    dateTime: event.dates?.start?.dateTime,
    venueName: venue?.name,
    address: venue?.address?.line1,
    city: venue?.city?.name,
    state: venue?.state?.name || venue?.state?.stateCode,
    country: venue?.country?.name || venue?.country?.countryCode,
    latitude,
    longitude,
    url: event.url,
    source: 'ticketmaster',
  };
}

export async function getNearbyEvents({
  lat,
  lng,
  radius = 30,
  keyword,
}: GetNearbyEventsParams): Promise<NearbyEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error('TICKETMASTER_API_KEY não configurada no .env');
  }

  const geoPoint = ngeohash.encode(lat, lng, 7);

  const response = await axios.get(
    'https://app.ticketmaster.com/discovery/v2/events.json',
    {
      params: {
        apikey: apiKey,
        geoPoint,
        radius,
        unit: 'km',
        countryCode: 'BR',
        size: 30,
        sort: 'date,asc',
        keyword: keyword || undefined,
      },
      timeout: 10000,
    }
  );

  const events = response.data?._embedded?.events;

  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map(normalizeTicketmasterEvent)
    .filter((event: NearbyEvent) => Boolean(event.latitude && event.longitude));
}