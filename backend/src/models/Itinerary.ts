import mongoose, { Schema, Document, Types } from 'mongoose';

export type ItineraryPlace = {
  place: Types.ObjectId;
  order: number;
  time?: string;
  notes?: string;
};

export type ItineraryDay = {
  day: number;
  places: ItineraryPlace[];
};

export interface IItinerary extends Document {
  user: Types.ObjectId;
  title: string;
  days: ItineraryDay[];
  createdAt: Date;
  updatedAt: Date;
}

const ItineraryPlaceSchema = new Schema<ItineraryPlace>(
  {
    place: {
      type: Schema.Types.ObjectId,
      ref: 'Place',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    time: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const ItineraryDaySchema = new Schema<ItineraryDay>(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    places: {
      type: [ItineraryPlaceSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const ItinerarySchema = new Schema<IItinerary>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Meu roteiro',
    },
    days: {
      type: [ItineraryDaySchema],
      default: [{ day: 1, places: [] }],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IItinerary>('Itinerary', ItinerarySchema);