import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckIn extends Document {
  userId: mongoose.Types.ObjectId;
  placeId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CheckInSchema = new Schema<ICheckIn>(
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
  },
  {
    timestamps: true,
  }
);

CheckInSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export default mongoose.model<ICheckIn>('CheckIn', CheckInSchema);