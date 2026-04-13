import { Request, Response } from "express";
import Favorite from "../models/Favorites";

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.body;

    const exists = await Favorite.findOne({ userId, placeId });
    if (exists) {
      return res.status(400).json({ message: "Já favoritado" });
    }

    const favorite = await Favorite.create({ userId, placeId });

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.find({ userId }).populate("placeId");

    const formattedFavorites = favorites
      .filter((favorite: any) => favorite.placeId)
      .map((favorite: any) => favorite.placeId);

    res.json(formattedFavorites);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { placeId } = req.params;

    await Favorite.findOneAndDelete({ userId, placeId });

    res.json({ message: "Removido dos favoritos" });
  } catch (error) {
    res.status(500).json(error);
  }
};