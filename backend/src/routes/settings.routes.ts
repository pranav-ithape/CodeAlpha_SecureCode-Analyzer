import { Router } from 'express';
import { getSettings, updateProfile, updateSecurity, updatePolicies, getIntegrations, deleteAccount } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

router.get('/', getSettings);
router.patch('/profile', updateProfile);
router.patch('/security', updateSecurity);
router.patch('/policies', requireRole(['ADMIN']), updatePolicies);
router.get('/integrations', getIntegrations);
router.delete('/account', deleteAccount);

export default router;
