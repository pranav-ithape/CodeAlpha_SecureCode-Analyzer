import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  projectId: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  reportType: 'pdf' | 'json' | 'html';
  fileName: string;
  filePath: string;
  status: 'generating' | 'ready' | 'failed';
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  scanId: {
    type: Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
  },
  reportType: {
    type: String,
    enum: ['pdf', 'json', 'html'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'failed'],
    default: 'generating',
    required: true
  },
  generatedAt: {
    type: Date
  }
}, { timestamps: true });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
