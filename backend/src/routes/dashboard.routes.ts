import express from 'express';
import { getDashboardData } from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/', getDashboardData);

export default router;
