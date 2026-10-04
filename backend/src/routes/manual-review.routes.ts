import express from 'express';
import { getManualReviews, getManualReviewByFindingId, saveManualReview } from '../controllers/manual-review.controller';

import { requireFindingAccess, requireRole } from '../middlewares/rbac.middleware';

const router = express.Router();

router.get('/', getManualReviews);
router.get('/:findingId', requireFindingAccess, getManualReviewByFindingId);
router.put('/:findingId', requireFindingAccess, requireRole(['ADMIN', 'SECURITY_ANALYST']), saveManualReview);

export default router;
