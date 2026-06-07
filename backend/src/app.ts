import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import userRoutes from "./routes/userRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import placeRoutes from "./routes/placeRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import accessibilityRoutes from "./routes/accessibilityRoutes";
import eventRoutes from "./routes/eventRoutes";
import checkInRoutes from "./routes/checkinRoutes";
import translationRoutes from "./routes/translationRoutes";
import itineraryRoutes from "./routes/itineraryRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

let mongoConnectionPromise: Promise<typeof mongoose> | null = null;

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2 && mongoConnectionPromise) {
    await mongoConnectionPromise;
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI não configurada");
  }

  mongoConnectionPromise = mongoose.connect(mongoUri);

  await mongoConnectionPromise;

  console.log("MongoDB conectado");
}

app.use(async (_req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error: any) {
    console.log("Erro ao conectar MongoDB:", error?.message || error);

    return res.status(500).json({
      message: "Erro ao conectar ao banco de dados.",
      detail: error?.message || "Erro desconhecido",
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    message: "API Turistando online",
    status: "ok",
  });
});

app.get("/health", async (_req, res) => {
  try {
    await connectMongo();

    return res.json({
      status: "ok",
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error?.message || "Erro ao conectar ao banco.",
    });
  }
});

app.use("/users", userRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/places", placeRoutes);
app.use("/reviews", reviewRoutes);
app.use("/weather", weatherRoutes);
app.use("/accessibility", accessibilityRoutes);
app.use("/events", eventRoutes);
app.use("/checkins", checkInRoutes);
app.use("/translation", translationRoutes);
app.use("/itineraries", itineraryRoutes);

export default app;