import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import placeRoutes from "./routes/placeRoutes";
import reviewRoutes from './routes/reviewRoutes';
import weatherRoutes from './routes/weatherRoutes';
import accessibilityRoutes from './routes/accessibilityRoutes';
import eventRoutes from "./routes/eventRoutes";
import checkInRoutes from './routes/checkinRoutes';
import translationRoutes from './routes/translationRoutes';
import itineraryRoutes from './routes/itineraryRoutes';

dotenv.config();

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

app.use("/users", userRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/places", placeRoutes);
app.use('/reviews', reviewRoutes);
app.use('/weather', weatherRoutes);
app.use('/accessibility', accessibilityRoutes);
app.use("/events", eventRoutes);
app.use('/checkins', checkInRoutes);
app.use('/translation', translationRoutes);
app.use("/itineraries", itineraryRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando');
});