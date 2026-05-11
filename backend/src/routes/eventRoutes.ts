import { Router } from "express";

import {
  getEvents,
  getEventById,
  createEvent,
  deleteEvent,
} from "../controllers/eventController";

import { auth } from "../middlewares/Auth";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post("/", auth, createEvent);
router.delete("/:id", auth, deleteEvent);

export default router;