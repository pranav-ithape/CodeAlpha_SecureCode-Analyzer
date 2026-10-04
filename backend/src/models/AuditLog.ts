import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  projectId?: mongoose.Types.ObjectId;
  status: 'SUCCESS' | 'FAILURE';
  metadata?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: String },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  status: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
