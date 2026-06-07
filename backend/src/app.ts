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

let isMongoConnected = false;

async function connectMongo() {
  if (isMongoConnected || mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI não configurada");
  }

  await mongoose.connect(process.env.MONGO_URI);

  isMongoConnected = true;
  console.log("MongoDB conectado");
}

app.use(async (_req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (error) {
    console.log("Erro ao conectar MongoDB:", error);

    return res.status(500).json({
      message: "Erro ao conectar ao banco de dados.",
    });
  }
});

app.get("/", (_req, res) => {
  res.json({
    message: "API Turistando online",
    status: "ok",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
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