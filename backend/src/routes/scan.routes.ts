import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';

const router = Router();

router.post('/', scanController.submitScan);
router.get('/', scanController.getScans);
router.get('/:scanId', scanController.getScanById);
router.get('/:scanId/findings', scanController.getScanFindings);
router.delete('/:scanId', scanController.deleteScan);

export default router;
