import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: false },
    description: { type: String, required: true },

    categories: {
      type: [String],
      enum: [
        "história",
        "gastronomia",
        "aventura",
        "parque",
        "museu",
        "café",
        "diversão",
        "natureza",
        "jogos",
        "esportes",
        "arte",
        "tecnologia",
      ],
      required: true,
    },

    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    address: { type: String, required: true },

    openingHours: { type: String },
    contact: { type: String },
    images: [{ type: String }],
    website: { type: String },
  },
  { timestamps: true }
);

PlaceSchema.index({ location: "2dsphere" });

export default mongoose.model("Place", PlaceSchema);