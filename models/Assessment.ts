import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IMessage {
  speaker: 'user' | 'avatar';
  message: string;
  timestamp: Date;
}

export interface IAssessment extends Document {
  userId: Types.ObjectId;
  type: 'cardiovascular' | 'neurological' | 'full-health' | 'respiratory' | 'psychometric' | 'therapy';
  transcript: IMessage[];
  duration: number; // in seconds
  score?: number;
  insights?: string;
  recommendations?: string[];
  startedAt: Date;
  completedAt?: Date;
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

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['cardiovascular', 'neurological', 'full-health', 'respiratory', 'psychometric', 'therapy'],
      required: true,
    },
    transcript: [MessageSchema],
    duration: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
    },
    insights: {
      type: String,
    },
    recommendations: [String],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Assessment = models.Assessment || model<IAssessment>('Assessment', AssessmentSchema);

export default Assessment;
