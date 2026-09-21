import { Request, Response } from 'express';
import { validateScanRequest } from '../utils/validation';
import { analyzeSource, calculateSummary } from '../services/scan.service';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import mongoose from 'mongoose';

export const submitScan = async (req: Request, res: Response): Promise<void> => {
  const { projectId, applicationName, language, sourceCode } = req.body;

  // 1. Validate request
  const validationError = validateScanRequest(applicationName, language, sourceCode);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  // 2. Create Scan Record (status: analyzing)
  const scan = new Scan({
    projectId: projectId || undefined,
    applicationName,
    language,
    status: 'analyzing',
  });
  
  try {
    await scan.save();
  } catch (error: any) {
    console.error('Failed to create scan record:', error);
    res.status(500).json({ error: 'Failed to initialize scan in database', details: error.message });
    return;
  }

  // 3. Perform Analysis
  try {
    const startTime = Date.now();
    const rawFindings = await analyzeSource(language, sourceCode);
    const duration = Date.now() - startTime;
    
    const summary = calculateSummary(rawFindings);

    // Prepare findings for MongoDB
    const findingsDocs = rawFindings.map(f => ({
      scanId: scan._id,
      title: f.title,
      severity: f.severity,
      category: f.category,
      language: language,
      file: f.file,
      line: f.line,
      description: f.description,
      impact: f.impact,
      recommendation: f.recommendation,
      status: 'OPEN'
    }));

    // 4. Save findings and update scan using session (Transaction if Replica Set is active, otherwise standard save)
    // For local dev without replica sets, transactions might throw. So we'll use a standard approach with a try-catch cleanup for safety.
    
    await Finding.insertMany(findingsDocs);

    scan.status = 'completed';
    scan.summary = summary;
    scan.completedAt = new Date();
    scan.duration = duration;
    
    await scan.save();

    // 5. Build Response
    const response = {
      scanId: scan._id,
      status: scan.status,
      applicationName: scan.applicationName,
      language: scan.language,
      summary: scan.summary,
      duration: scan.duration,
      createdAt: scan.createdAt,
      findings: rawFindings // Returns normalized format to frontend
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Scan failed:', error);
    
    // Update scan status to failed
    scan.status = 'failed';
    try {
      await scan.save();
    } catch (saveError) {
      console.error('Failed to update scan status to failed', saveError);
    }

    res.status(500).json({ 
      error: 'Analysis failed due to an internal error or timeout.', 
      details: error.message 
    });
  }
};

export const getScans = async (req: Request, res: Response): Promise<void> => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json(scans);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch scans', details: error.message });
  }
};

export const getScanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const scan = await Scan.findById(req.params.scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }
    res.status(200).json(scan);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid scan ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch scan', details: error.message });
  }
};

export const getScanFindings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { severity, status } = req.query;
    
    const query: any = { scanId: req.params.scanId };
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const findings = await Finding.find(query);
    res.status(200).json(findings);
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid scan ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch findings', details: error.message });
  }
};

export const deleteScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const scanId = req.params.scanId;
    const scan = await Scan.findById(scanId);
    
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    await Finding.deleteMany({ scanId });
    await Scan.deleteOne({ _id: scanId });

    res.status(200).json({ message: 'Scan and associated findings deleted successfully' });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid scan ID format' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete scan', details: error.message });
  }
};
