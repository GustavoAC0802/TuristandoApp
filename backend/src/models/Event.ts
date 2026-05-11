import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
      required: true,
    },

    placeName: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: false,
    },

    image: {
      type: String,
      required: false,
    },

    category: {
      type: String,
      enum: [
        "cultura",
        "gastronomia",
        "esportes",
        "música",
        "arte",
        "tecnologia",
        "turismo",
        "família",
      ],
      required: true,
    },

    isFree: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

EventSchema.index({ place: 1 });
EventSchema.index({ city: 1 });
EventSchema.index({ date: 1 });

export default mongoose.model("Event", EventSchema);