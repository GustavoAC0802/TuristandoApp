import { Request, Response } from "express";
import { mockPlaces } from "../data/mockPlaces";

function calculateDistanceInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function normalizeRating(rating: number) {
  return Math.round(rating);
}

export const searchPlaces = async (req: Request, res: Response) => {
  try {
    console.log("bateu em /places/search");
    console.log("query params:", req.query);

    const {
      search,
      minRating,
      maxDistance,
      sortBy = "name",
      page = 1,
      limit = 10,
      userLat,
      userLng,
    } = req.query;

    const categories = req.query.categories ?? req.query["categories[]"];

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    let results = mockPlaces.map((place) => {
      let distance: number | undefined;

      if (userLat && userLng) {
        const [lng, lat] = place.location.coordinates;

        distance = calculateDistanceInKm(
          Number(userLat),
          Number(userLng),
          lat,
          lng
        );
      }

      return {
        ...place,
        distance,
      };
    });

    if (search && typeof search === "string") {
      const term = search.toLowerCase();

      results = results.filter(
        (place) =>
          place.name.toLowerCase().includes(term) ||
          place.description.toLowerCase().includes(term) ||
          place.category.toLowerCase().includes(term)
      );
    }

    if (categories) {
      const categoriesArray = Array.isArray(categories)
        ? categories
        : [categories];

      const normalizedCategories = categoriesArray.map((item) =>
        String(item).toLowerCase()
      );

      results = results.filter((place) =>
        normalizedCategories.includes(place.category.toLowerCase())
      );
    }

    if (minRating) {
      results = results.filter(
        (place) => normalizeRating(place.rating) === Number(minRating)
      );
    }

    if (maxDistance && userLat && userLng) {
      results = results.filter(
        (place) =>
          typeof place.distance === "number" &&
          place.distance <= Number(maxDistance)
      );
    }

    if (sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "distance") {
      results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = results.length;
    const paginatedResults = results.slice(skip, skip + limitNumber);

    return res.json({
      items: paginatedResults,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasMore: skip + paginatedResults.length < total,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar lugares:", error);
    return res.status(500).json({ message: "Erro ao buscar lugares" });
  }
};