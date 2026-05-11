import { Request, Response } from "express";
import mongoose from "mongoose";
import Place from "../models/Place";
import Review from "../models/Review";
import { realPlaces } from "../data/realPlaces";

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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function normalizeRating(rating: number) {
  return Math.min(Math.max(Math.round(rating), 0), 5);
}

async function addReviewStatsToPlaces(
  places: any[]
): Promise<any[]> {
  const placeIds = places.map((place) => place._id);

  const reviewStats = await Review.aggregate([
    {
      $match: {
        placeId: {
          $in: placeIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      },
    },
    {
      $group: {
        _id: "$placeId",
        averageRating: { $avg: "$rating" },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  return places.map((place) => {
    const stats = reviewStats.find(
      (item) => String(item._id) === String(place._id)
    );

    const averageRating = stats?.averageRating
      ? Math.min(Number(stats.averageRating), 5)
      : 0;

    return {
      ...place,
      averageRating,
      reviewsCount: stats?.reviewsCount || 0,
    };
  });
}

export const seedPlaces = async (
  req: Request,
  res: Response
) => {
  try {
    await Place.deleteMany();

    const places = await Place.insertMany(realPlaces);

    return res.json({
      message: "Seed executada com sucesso",
      count: places.length,
    });
  } catch (error) {
    console.error("Erro ao fazer seed:", error);

    return res.status(500).json({
      message: "Erro ao fazer seed",
    });
  }
};

export const createPlace = async (
  req: Request,
  res: Response
) => {
  try {
    const place = await Place.create(req.body);

    return res.status(201).json(place);
  } catch (error) {
    console.error("Erro ao criar local:", error);

    return res.status(500).json({
      message: "Erro ao criar local",
    });
  }
};

export const getPlaces = async (
  req: Request,
  res: Response
) => {
  try {
    const places = await Place.find().sort({
      name: 1,
    });

    const placesWithStats = await addReviewStatsToPlaces(
      places.map((place) => place.toObject())
    );

    return res.json(placesWithStats);
  } catch (error) {
    console.error("Erro ao listar locais:", error);

    return res.status(500).json({
      message: "Erro ao listar locais",
    });
  }
};

export const getPlaceById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({
        message: "Local não encontrado",
      });
    }

    const [placeWithStats] =
      await addReviewStatsToPlaces([
        place.toObject(),
      ]);

    return res.json(placeWithStats);
  } catch (error) {
    console.error("Erro ao buscar local:", error);

    return res.status(500).json({
      message: "Erro ao buscar local",
    });
  }
};

export const searchPlaces = async (
  req: Request,
  res: Response
) => {
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

    const categories =
      req.query.categories ??
      req.query["categories[]"];

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip =
      (pageNumber - 1) * limitNumber;

    const places = await Place.find();

    let results: any[] = places.map((place) => {
      const placeObject = place.toObject();

      let distance: number | undefined;

      if (
        userLat &&
        userLng &&
        placeObject.location?.coordinates
      ) {
        const [lng, lat] =
          placeObject.location.coordinates;

        distance = calculateDistanceInKm(
          Number(userLat),
          Number(userLng),
          lat,
          lng
        );
      }

      return {
        ...placeObject,
        distance,
      };
    });

    results = await addReviewStatsToPlaces(
      results
    );

    if (
      search &&
      typeof search === "string"
    ) {
      const term = search.toLowerCase();

      results = results.filter(
        (place) =>
          place.name
            .toLowerCase()
            .includes(term) ||
          place.description
            .toLowerCase()
            .includes(term) ||
          place.categories?.some(
            (cat: string) =>
              cat
                .toLowerCase()
                .includes(term)
          )
      );
    }

    if (categories) {
      const categoriesArray =
        Array.isArray(categories)
          ? categories
          : [categories];

      const normalizedCategories =
        categoriesArray.map((item) =>
          String(item).toLowerCase()
        );

      results = results.filter(
        (place) => {
          const placeCategories =
            place.categories?.map(
              (cat: string) =>
                cat.toLowerCase()
            );

          if (!placeCategories)
            return false;

          return normalizedCategories.every(
            (selectedCategory) =>
              placeCategories.includes(
                selectedCategory
              )
          );
        }
      );
    }

    if (minRating) {
      results = results.filter(
        (place) =>
          normalizeRating(
            place.averageRating || 0
          ) === Number(minRating)
      );
    }

    if (
      maxDistance &&
      userLat &&
      userLng
    ) {
      results = results.filter(
        (place) =>
          typeof place.distance ===
            "number" &&
          place.distance <=
            Number(maxDistance)
      );
    }

    if (sortBy === "rating") {
      results.sort(
        (a, b) =>
          b.averageRating -
          a.averageRating
      );
    } else if (
      sortBy === "distance"
    ) {
      results.sort(
        (a, b) =>
          (a.distance ?? Infinity) -
          (b.distance ?? Infinity)
      );
    } else {
      results.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    const total = results.length;

    const paginatedResults =
      results.slice(
        skip,
        skip + limitNumber
      );

    return res.json({
      items: paginatedResults,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber
        ),
        hasMore:
          skip +
            paginatedResults.length <
          total,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar lugares:",
      error
    );

    return res.status(500).json({
      message:
        "Erro ao buscar lugares",
    });
  }
};