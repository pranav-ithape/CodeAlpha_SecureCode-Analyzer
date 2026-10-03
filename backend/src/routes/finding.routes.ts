import express from 'express';
import { getFindings, getFindingById, updateFindingStatus } from '../controllers/finding.controller';

const router = express.Router();

router.get('/', getFindings);
router.get('/:findingId', getFindingById);
router.put('/:findingId', updateFindingStatus);

export default router;
