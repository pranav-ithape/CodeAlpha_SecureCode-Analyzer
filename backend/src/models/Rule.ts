import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  name: string;
  category: string;
  severity: string;
  cwe: string;
  owasp: string;
  description: string;
  detectionPattern: string;
  vulnerableExample: string;
  secureExample: string;
  remediation: string;
  supportedLanguages: string[];
  confidence: string;
  tags: string[];
  status: 'Active' | 'Inactive';
  regex?: string;
}

const RuleSchema: Schema = new Schema({
  ruleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, required: true },
  cwe: { type: String, required: true },
  owasp: { type: String, required: true },
  description: { type: String, required: true },
  detectionPattern: { type: String, required: true },
  vulnerableExample: { type: String, required: true },
  secureExample: { type: String, required: true },
  remediation: { type: String, required: true },
  supportedLanguages: { type: [String], required: true },
  confidence: { type: String, required: true },
  tags: { type: [String], required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  regex: { type: String }
}, { timestamps: true });

export default mongoose.model<IRule>('Rule', RuleSchema);
