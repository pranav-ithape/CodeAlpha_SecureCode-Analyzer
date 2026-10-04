import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { logAudit } from '../services/audit.service';

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const project = new Project({
      name: name.trim(),
      description: description?.trim(),
      userId: (req as any).user.id
    });

    await project.save();
    
    await logAudit({
      userId: (req as any).user.id,
      action: 'PROJECT_CREATED',
      resourceType: 'Project',
      resourceId: project._id.toString(),
      status: 'SUCCESS'
    });
    
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const projects = await Project.find({
      $or: [{ userId }, { userId: { $exists: false } }]
    }).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }
    res.status(200).json(project);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch project', details: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId;
    const userId = (req as any).user.id;
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }

    // Delete all associated scans and findings
    const scans = await Scan.find({ projectId });
    const scanIds = scans.map(s => s._id);

    await Finding.deleteMany({ scanId: { $in: scanIds } });
    await Scan.deleteMany({ projectId });
    await Project.deleteOne({ _id: projectId });

    await logAudit({
      userId,
      action: 'PROJECT_DELETED',
      resourceType: 'Project',
      resourceId: projectId as string,
      status: 'SUCCESS'
    });

    res.status(200).json({ message: 'Project and associated data deleted successfully' });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getProjectScans = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = req.params.projectId;
    const userId = (req as any).user.id;
    
    // Verify project access first
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }

    const scans = await Scan.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json(scans);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch project scans', details: error.message });
  }
};
