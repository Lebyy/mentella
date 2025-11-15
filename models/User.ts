import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  persona?: string; // AI-generated user persona
  assessmentCompleted: boolean;
  therapySessionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    persona: {
      type: String,
      default: null,
    },
    assessmentCompleted: {
      type: Boolean,
      default: false,
    },
    therapySessionsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User;
