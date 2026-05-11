import mongoose, { Schema, Document } from 'mongoose';

export type AccessibilityAvailability = 'yes' | 'no' | 'unknown';
export type AccessibilityQuality = 'good' | 'partial' | 'bad' | 'unknown';

export interface IAcessibilityReview extends Document {
  userId: mongoose.Types.ObjectId;
  placeId: mongoose.Types.ObjectId;

  adaptedBathroom: AccessibilityAvailability;
  adaptedBathroomQuality: AccessibilityQuality;

  rampAccess: AccessibilityAvailability;
  rampAccessQuality: AccessibilityQuality;

  elevatorAccess: AccessibilityAvailability;
  elevatorAccessQuality: AccessibilityQuality;

  tactilePaving: AccessibilityAvailability;
  tactilePavingQuality: AccessibilityQuality;

  accessibleParking: AccessibilityAvailability;
  accessibleParkingQuality: AccessibilityQuality;

  comment?: string;
}

const AcessibilityReviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    placeId: {
      type: Schema.Types.ObjectId,
      ref: 'Place',
      required: true,
    },

    adaptedBathroom: {
      type: String,
      enum: ['yes', 'no', 'unknown'],
      default: 'unknown',
    },
    adaptedBathroomQuality: {
      type: String,
      enum: ['good', 'partial', 'bad', 'unknown'],
      default: 'unknown',
    },

    rampAccess: {
      type: String,
      enum: ['yes', 'no', 'unknown'],
      default: 'unknown',
    },
    rampAccessQuality: {
      type: String,
      enum: ['good', 'partial', 'bad', 'unknown'],
      default: 'unknown',
    },

    elevatorAccess: {
      type: String,
      enum: ['yes', 'no', 'unknown'],
      default: 'unknown',
    },
    elevatorAccessQuality: {
      type: String,
      enum: ['good', 'partial', 'bad', 'unknown'],
      default: 'unknown',
    },

    tactilePaving: {
      type: String,
      enum: ['yes', 'no', 'unknown'],
      default: 'unknown',
    },
    tactilePavingQuality: {
      type: String,
      enum: ['good', 'partial', 'bad', 'unknown'],
      default: 'unknown',
    },

    accessibleParking: {
      type: String,
      enum: ['yes', 'no', 'unknown'],
      default: 'unknown',
    },
    accessibleParkingQuality: {
      type: String,
      enum: ['good', 'partial', 'bad', 'unknown'],
      default: 'unknown',
    },

    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

AcessibilityReviewSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export default mongoose.model<IAcessibilityReview>(
  'AcessibilityReview',
  AcessibilityReviewSchema
);