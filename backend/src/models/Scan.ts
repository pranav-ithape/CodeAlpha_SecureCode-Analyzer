import mongoose, { Document, Schema } from 'mongoose';

export interface IScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface IScan extends Document {
  projectId?: mongoose.Types.ObjectId;
  applicationName: string;
  language: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  summary: IScanSummary;
  duration?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScanSchema = new Schema<IScan>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  applicationName: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending',
    required: true
  },
  summary: {
    total: { type: Number, default: 0 },
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    info: { type: Number, default: 0 }
  },
  duration: { type: Number },
  completedAt: { type: Date }
}, { timestamps: true });

// Indexes for common queries
ScanSchema.index({ projectId: 1, createdAt: -1 });
ScanSchema.index({ createdAt: -1 });
ScanSchema.index({ language: 1 });
ScanSchema.index({ status: 1 });

export const Scan = mongoose.model<IScan>('Scan', ScanSchema);
