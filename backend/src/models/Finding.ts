import mongoose, { Document, Schema } from 'mongoose';

export interface IFinding extends Document {
  scanId: mongoose.Types.ObjectId;
  title: string;
  severity: string;
  category: string;
  language: string;
  file: string;
  line: number;
  description: string;
  impact: string;
  recommendation: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema<IFinding>({
  scanId: {
    type: Schema.Types.ObjectId,
    ref: 'Scan',
    required: true,
    index: true
  },
  title: { type: String, required: true },
  severity: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  language: { type: String, required: true, index: true },
  file: { type: String, required: true },
  line: { type: Number, required: true },
  description: { type: String, required: true },
  impact: { type: String, required: true },
  recommendation: { type: String, required: true },
  status: { type: String, required: true, default: 'OPEN', index: true }
}, { timestamps: true });

export const Finding = mongoose.model<IFinding>('Finding', FindingSchema);
