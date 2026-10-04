import { Router } from 'express';
import { createReport, getReports, getReportById, downloadReport } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole, requireScanAccess, requireReportAccess } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/:scanId', requireScanAccess, createReport);
router.get('/', getReports);
router.get('/:reportId', requireReportAccess, getReportById);
router.get('/:reportId/download', requireReportAccess, downloadReport);

export default router;
