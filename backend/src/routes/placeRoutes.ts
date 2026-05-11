import { Router } from "express";
import {
  createPlace,
  getPlaces,
  getPlaceById,
  searchPlaces,
  seedPlaces,
} from "../controllers/placeController";

const router = Router();

router.post("/", createPlace);
router.get("/", getPlaces);
router.get("/search", searchPlaces);
router.get("/:id", getPlaceById);
router.post("/seed", seedPlaces);

export default router;