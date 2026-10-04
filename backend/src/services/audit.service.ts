import { AuditLog } from '../models/AuditLog';

export const logAudit = async (params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  projectId?: string;
  status: 'SUCCESS' | 'FAILURE';
  metadata?: any;
}) => {
  try {
    await AuditLog.create(params);
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};
