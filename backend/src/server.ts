import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import placeRoutes from "./routes/placeRoutes";

dotenv.config();

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

app.use("/users", userRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/places", placeRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando');
});