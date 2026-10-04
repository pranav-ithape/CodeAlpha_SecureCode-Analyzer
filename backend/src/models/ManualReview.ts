import mongoose, { Document, Schema } from 'mongoose';

export interface IManualReview extends Document {
  findingId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  reviewerId?: mongoose.Types.ObjectId;
  decision: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'NEEDS_INVESTIGATION';
  reviewerRisk: 'Critical' | 'High' | 'Medium' | 'Low';
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

const ManualReviewSchema = new Schema<IManualReview>({
  findingId: {
    type: Schema.Types.ObjectId,
    ref: 'Finding',
    required: true,
    unique: true, // One review per finding
    index: true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  scanId: {
    type: Schema.Types.ObjectId,
    ref: 'Scan',
    required: true,
    index: true
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  decision: { 
    type: String, 
    enum: ['TRUE_POSITIVE', 'FALSE_POSITIVE', 'NEEDS_INVESTIGATION'],
    required: true 
  },
  reviewerRisk: { 
    type: String, 
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true 
  },
  comments: { type: String, required: true }
}, { timestamps: true });

export const ManualReview = mongoose.model<IManualReview>('ManualReview', ManualReviewSchema);
