import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field on save
appConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const AppConfig = mongoose.models.AppConfig || mongoose.model('AppConfig', appConfigSchema);
