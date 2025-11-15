import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IPersonaHistory {
  persona: string;
  timestamp: Date;
}

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  currentPersona?: string;
  personaHistory: IPersonaHistory[];
  assessments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PersonaHistorySchema = new Schema<IPersonaHistory>({
  persona: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
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
    currentPersona: {
      type: String,
      default: null,
    },
    personaHistory: [PersonaHistorySchema],
    assessments: [{
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
    }],
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User;
