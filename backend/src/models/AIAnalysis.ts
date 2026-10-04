import mongoose, { Document, Schema } from 'mongoose';

export interface IAIAnalysis extends Document {
  findingId: mongoose.Types.ObjectId;
  summary: string;
  whyVulnerable: string;
  securityImpact: string;
  recommendation: string;
  secureCodingPractices: string[];
  secureCodeExample: string;
  verificationSteps?: string[];
  rootCause?: string;
  references?: string[];
  confidence?: number;
  aiModel: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>({
  findingId: {
    type: Schema.Types.ObjectId,
    ref: 'Finding',
    required: true,
    unique: true, // One finding may have one current AI analysis
    index: true
  },
  summary: { type: String, required: true },
  whyVulnerable: { type: String, required: true },
  securityImpact: { type: String, required: true },
  recommendation: { type: String, required: true },
  secureCodingPractices: [{ type: String }],
  secureCodeExample: { type: String, required: true },
  verificationSteps: [{ type: String }],
  rootCause: { type: String },
  references: [{ type: String }],
  confidence: { type: Number, min: 0, max: 1 },
  aiModel: { type: String, required: true }
}, { timestamps: true });

export const AIAnalysis = mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
