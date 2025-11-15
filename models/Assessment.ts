import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IAssessmentAnswer {
  question: string;
  answer: string;
  category: 'medical' | 'mental' | 'lifestyle' | 'general';
}

export interface IAssessment extends Document {
  userId: Types.ObjectId;
  answers: IAssessmentAnswer[];
  score?: number;
  recommendations?: string[];
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentAnswerSchema = new Schema<IAssessmentAnswer>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['medical', 'mental', 'lifestyle', 'general'],
    required: true,
  },
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [AssessmentAnswerSchema],
    score: {
      type: Number,
    },
    recommendations: [String],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Assessment = models.Assessment || model<IAssessment>('Assessment', AssessmentSchema);

export default Assessment;
