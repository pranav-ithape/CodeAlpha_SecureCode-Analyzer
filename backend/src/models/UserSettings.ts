import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  notifications: {
    scanCompleted: boolean;
    criticalFindings: boolean;
    reportGenerated: boolean;
  };
  policies: {
    requireComplexPassword: boolean;
    sessionTimeoutMinutes: number;
    allowReportGeneration: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  notifications: {
    scanCompleted: { type: Boolean, default: true },
    criticalFindings: { type: Boolean, default: true },
    reportGenerated: { type: Boolean, default: true }
  },
  policies: {
    requireComplexPassword: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    allowReportGeneration: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
