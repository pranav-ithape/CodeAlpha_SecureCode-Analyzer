import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { User } from '../models/User';
import { Report } from '../models/Report';

// Ensures user has one of the allowed roles
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const user = await User.findById(userId);
      const userRole = user?.role || 'DEVELOPER';
      if (!user || !roles.includes(userRole)) {
        res.status(403).json({ error: 'Forbidden: Insufficient role' });
        return;
      }
      
      (req as any).user.role = userRole;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
};

// Validates that the user has access to the project specified by req.params.projectId
export const requireProjectAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const projectId = req.params.projectId;
    
    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = user.role || 'DEVELOPER';
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });

    if (!project) {
      res.status(403).json({ error: 'Forbidden: Access to this project is denied' });
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID format' });
      return;
    }
    res.status(500).json({ error: 'Internal server error during project access check' });
  }
};

// Validates that the user has access to the scan specified by req.params.scanId
export const requireScanAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const scanId = req.params.scanId;
    
    if (!scanId) {
      res.status(400).json({ error: 'Scan ID is required' });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = user.role || 'DEVELOPER';
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    const scan = await Scan.findById(scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.userId && scan.userId.toString() !== userId) {
      res.status(403).json({ error: 'Forbidden: Access to this scan is denied' });
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid scan ID format' });
      return;
    }
    res.status(500).json({ error: 'Internal server error during scan access check' });
  }
};

// Validates that the user has access to the finding specified by req.params.findingId
export const requireFindingAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const findingId = req.params.findingId;
    
    if (!findingId) {
      res.status(400).json({ error: 'Finding ID is required' });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = user.role || 'DEVELOPER';
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    const finding = await Finding.findById(findingId);
    if (!finding) {
      res.status(404).json({ error: 'Finding not found' });
      return;
    }

    const scan = await Scan.findById(finding.scanId);
    if (!scan || (scan.userId && scan.userId.toString() !== userId)) {
      res.status(403).json({ error: 'Forbidden: Access to this finding is denied' });
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid finding ID format' });
      return;
    }
    res.status(500).json({ error: 'Internal server error during finding access check' });
  }
};

// Validates that the user has access to the report specified by req.params.reportId
export const requireReportAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const reportId = req.params.reportId;
    
    if (!reportId) {
      res.status(400).json({ error: 'Report ID is required' });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = user.role || 'DEVELOPER';
    if (userRole === 'ADMIN') {
      next();
      return;
    }

    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const scan = await Scan.findById(report.scanId);
    if (!scan || (scan.userId && scan.userId.toString() !== userId)) {
      res.status(403).json({ error: 'Forbidden: Access to this report is denied' });
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'CastError') {
      res.status(400).json({ error: 'Invalid report ID format' });
      return;
    }
    res.status(500).json({ error: 'Internal server error during report access check' });
  }
};
