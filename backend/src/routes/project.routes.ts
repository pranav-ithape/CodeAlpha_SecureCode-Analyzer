import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { requireRole, requireProjectAccess } from '../middlewares/rbac.middleware';

const router = Router();

router.post('/', requireRole(['ADMIN', 'SECURITY_ANALYST', 'DEVELOPER']), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', requireProjectAccess, projectController.getProjectById);
router.delete('/:projectId', requireProjectAccess, requireRole(['ADMIN']), projectController.deleteProject);
router.get('/:projectId/scans', requireProjectAccess, projectController.getProjectScans);

export default router;
