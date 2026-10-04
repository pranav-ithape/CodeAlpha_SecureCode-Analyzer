import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';
import { requireRole, requireScanAccess } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/', requireRole(['ADMIN', 'SECURITY_ANALYST']), scanController.submitScan);
router.get('/', scanController.getScans);
router.get('/:scanId', requireScanAccess, scanController.getScanById);
router.get('/:scanId/findings', requireScanAccess, scanController.getScanFindings);
router.delete('/:scanId', requireScanAccess, requireRole(['ADMIN']), scanController.deleteScan);
router.post('/:scanId/retest', requireScanAccess, requireRole(['ADMIN', 'SECURITY_ANALYST']), scanController.retestScan);
router.get('/:scanId/comparison', requireScanAccess, scanController.getScanComparison);

export default router;
