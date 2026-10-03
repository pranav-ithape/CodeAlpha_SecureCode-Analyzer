import { Router } from 'express';
import { getRules, updateRuleStatus } from '../controllers/rule.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRules);
router.patch('/:id/status', updateRuleStatus);

export default router;
