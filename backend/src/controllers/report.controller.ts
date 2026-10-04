import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { generateReport } from '../services/report.service';
import { Report } from '../models/Report';
import { logAudit } from '../services/audit.service';

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scanId } = req.params;
    const { format } = req.body;

    if (!['pdf', 'json', 'html'].includes(format)) {
      res.status(400).json({ error: 'Unsupported format. Must be pdf, json, or html' });
      return;
    }

    const report = await generateReport(scanId as string, format as 'pdf' | 'json' | 'html');
    
    await logAudit({
      userId: (req as any).user?.id,
      action: 'REPORT_GENERATED',
      resourceType: 'Report',
      resourceId: report._id.toString(),
      projectId: report.projectId?.toString(),
      status: 'SUCCESS'
    });

    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'DEVELOPER';
    
    let reports;
    if (userRole === 'ADMIN') {
      reports = await Report.find().sort({ createdAt: -1 }).populate('projectId', 'name').populate('scanId', 'scanType summary applicationName');
    } else {
      const userProjects = await mongoose.model('Project').find({
        $or: [{ userId }, { userId: { $exists: false } }]
      });
      const projectIds = userProjects.map(p => p._id);
      
      reports = await Report.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .populate('projectId', 'name')
        .populate('scanId', 'scanType summary applicationName');
    }
    res.status(200).json(reports);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    
    if (report.status !== 'ready') {
      res.status(400).json({ error: 'Report is not ready yet' });
      return;
    }

    if (!fs.existsSync(report.filePath)) {
      res.status(404).json({ error: 'Report file missing from server storage' });
      return;
    }

    const contentType = 
      report.reportType === 'pdf' ? 'application/pdf' :
      report.reportType === 'json' ? 'application/json' : 'text/html';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    
    const fileStream = fs.createReadStream(report.filePath);
    
    await logAudit({
      userId: (req as any).user?.id,
      action: 'REPORT_DOWNLOADED',
      resourceType: 'Report',
      resourceId: report._id.toString(),
      projectId: report.projectId?.toString(),
      status: 'SUCCESS'
    });

    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to download report' });
  }
};
