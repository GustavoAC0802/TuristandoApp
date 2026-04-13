import { Router } from "express";
import { addFavorite, getFavorites, removeFavorite } from "../controllers/favoriteController";
import { auth } from "../middlewares/Auth";

const router = Router();

router.post("/", auth, addFavorite);
router.get("/", auth, getFavorites);
router.delete("/:placeId", auth, removeFavorite);

export default router;