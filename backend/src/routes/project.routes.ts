import { Router } from 'express';
import * as projectController from '../controllers/project.controller';

const router = Router();

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProjectById);
router.delete('/:projectId', projectController.deleteProject);
router.get('/:projectId/scans', projectController.getProjectScans);

export default router;
