import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["história", "gastronomia", "aventura", "parque", "museu"], 
    required: true 
  },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true } 
  },
  address: { type: String, required: true },
  rating: { type: Number, default: 0 },
  openingHours: { type: String },
  contact: { type: String },
  images: [{ type: String }],
  website: { type: String }
}, { timestamps: true });

PlaceSchema.index({ location: "2dsphere" });

export default mongoose.model("Place", PlaceSchema);