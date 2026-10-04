import express from 'express';
import { getFindings, getFindingById, updateFindingStatus } from '../controllers/finding.controller';

import { requireFindingAccess, requireRole } from '../middlewares/rbac.middleware';

const router = express.Router();

router.get('/', getFindings);
router.get('/:findingId', requireFindingAccess, getFindingById);
router.put('/:findingId', requireFindingAccess, requireRole(['ADMIN', 'SECURITY_ANALYST']), updateFindingStatus);

export default router;
