import { Request, Response } from "express";
import axios from "axios";
import ngeohash from "ngeohash";

type NearbyEvent = {
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
  source: "ticketmaster";
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
    name: event.name || "Evento sem nome",
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
    source: "ticketmaster",
  };
}

async function fetchNearbyEvents(params: {
  lat: number;
  lng: number;
  radius: number;
  keyword?: string;
}) {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    throw new Error("TICKETMASTER_API_KEY não configurada no .env");
  }

  const geoPoint = ngeohash.encode(params.lat, params.lng, 7);

  const response = await axios.get(
    "https://app.ticketmaster.com/discovery/v2/events.json",
    {
      params: {
        apikey: apiKey,
        geoPoint,
        radius: params.radius,
        unit: "km",
        countryCode: "BR",
        size: 30,
        sort: "date,asc",
        keyword: params.keyword || undefined,
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
    .filter((event: NearbyEvent) => event.latitude && event.longitude);
}

export const getEvents = async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = req.query.radius ? Number(req.query.radius) : 100;
    const keyword = req.query.keyword ? String(req.query.keyword) : undefined;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        message: "Latitude e longitude são obrigatórias.",
        example: "/events?lat=-23.55052&lng=-46.633308&radius=100",
      });
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 200) {
      return res.status(400).json({
        message: "O raio precisa ser um número entre 1 e 200 km.",
      });
    }

    const events = await fetchNearbyEvents({
      lat,
      lng,
      radius,
      keyword,
    });

    return res.json({
      total: events.length,
      events,
    });
  } catch (error: any) {
    console.error("Erro ao buscar eventos:", {
      message: error?.message,
      response: error?.response?.data,
    });

    return res.status(500).json({
      message: "Erro ao buscar eventos próximos.",
      detail: error?.response?.data || error?.message,
    });
  }
};

export const getNearbyEvents = getEvents;

export const getEventById = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    const { id } = req.params;

    if (!apiKey) {
      return res.status(500).json({
        message: "TICKETMASTER_API_KEY não configurada no .env",
      });
    }

    const response = await axios.get(
      `https://app.ticketmaster.com/discovery/v2/events/${id}.json`,
      {
        params: {
          apikey: apiKey,
        },
        timeout: 10000,
      }
    );

    const event = normalizeTicketmasterEvent(response.data);

    return res.json(event);
  } catch (error: any) {
    console.error("Erro ao buscar evento por ID:", {
      message: error?.message,
      response: error?.response?.data,
    });

    return res.status(500).json({
      message: "Erro ao buscar evento.",
      detail: error?.response?.data || error?.message,
    });
  }
};

export const createEvent = async (_req: Request, res: Response) => {
  return res.status(501).json({
    message:
      "Criação manual de eventos desativada. Os eventos agora vêm da Ticketmaster API.",
  });
};

export const deleteEvent = async (_req: Request, res: Response) => {
  return res.status(501).json({
    message:
      "Remoção manual de eventos desativada. Os eventos agora vêm da Ticketmaster API.",
  });
};