import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IMessage {
  speaker: 'user' | 'avatar';
  message: string;
  timestamp: Date;
}

export interface ITherapySession extends Document {
  userId: Types.ObjectId;
  sessionType: 'initial' | 'followup' | 'crisis' | 'general';
  transcript: IMessage[];
  duration: number; // in seconds
  mood?: string;
  insights?: string; // AI-generated insights
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  speaker: {
    type: String,
    enum: ['user', 'avatar'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const TherapySessionSchema = new Schema<ITherapySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['initial', 'followup', 'crisis', 'general'],
      default: 'general',
    },
    transcript: [MessageSchema],
    duration: {
      type: Number,
      default: 0,
    },
    mood: {
      type: String,
    },
    insights: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const TherapySession = models.TherapySession || model<ITherapySession>('TherapySession', TherapySessionSchema);

export default TherapySession;
