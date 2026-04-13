import { Router } from "express";
import { searchPlaces } from "../controllers/placeController";

const router = Router();

router.get("/search", searchPlaces);

export default router;