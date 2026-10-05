import { Request, Response } from 'express';
import { validateScanRequest } from '../utils/validation';
import { analyzeSource, calculateSummary } from '../services/scan.service';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { Project } from '../models/Project';
import { logAudit } from '../services/audit.service';
import mongoose from 'mongoose';

export const submitScan = async (req: Request, res: Response): Promise<void> => {
  const { projectId, project_name, applicationName, language, sourceCode, fileName } = req.body;
  const finalAppName = applicationName || project_name || 'Unnamed Project';

  // 1. Validate request
  const validationError = validateScanRequest(finalAppName, language, sourceCode);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const userId = (req as any).user?.id;
  
  if (projectId) {
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    if (!project) {
      await logAudit({ userId, action: 'SCAN_FAILED', resourceType: 'Project', resourceId: projectId, status: 'FAILURE', metadata: { error: 'Unauthorized project access' } });
      res.status(403).json({ error: 'Forbidden: Access to this project is denied' });
      return;
    }
  }

  // 2. Create Scan Record (status: analyzing)
  const scan = new Scan({
    projectId: projectId || undefined,
    userId,
    applicationName: finalAppName,
    uploadedFileName: fileName,
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
    const rawFindings = await analyzeSource(language, sourceCode, fileName);
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
      status: 'OPEN',
      ruleId: f.ruleId,
      cwe: f.cwe,
      owasp: f.owasp,
      snippet: f.snippet
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
    const userId = (req as any).user.id;
    const scans = await Scan.find({
      $or: [{ userId }, { userId: { $exists: false } }]
    }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json(scans);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch scans', details: error.message });
  }
};

export const getScanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const scan = await Scan.findOne({
      _id: req.params.scanId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found or unauthorized' });
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
    const userId = (req as any).user.id;
    const scanId = req.params.scanId;

    // Verify scan ownership or legacy status before returning findings
    const scan = await Scan.findOne({
      _id: scanId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found or unauthorized' });
      return;
    }

    const { severity, status } = req.query;
    
    const query: any = { scanId };
    if (severity) query.severity = severity;
    if (status) query.status = status;

    let findings = await Finding.find(query);
    if (scan.scanType === "RETEST" && scan.stillOpenFindings && scan.stillOpenFindings.length > 0) {
      const stillOpenQuery: any = { _id: { $in: scan.stillOpenFindings } };
      if (severity) stillOpenQuery.severity = severity;
      if (status) stillOpenQuery.status = status;
      const stillOpen = await Finding.find(stillOpenQuery);
      findings = [...findings, ...stillOpen];
    }
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
    const userId = (req as any).user.id;
    const scan = await Scan.findOne({
      _id: scanId,
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    
    if (!scan) {
      res.status(404).json({ error: 'Scan not found or unauthorized' });
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
export const retestScan = async (req: Request, res: Response): Promise<void> => {
  const { sourceCode, fileName } = req.body;
  const previousScanId = req.params.scanId;

  const previousScan = await Scan.findById(previousScanId);
  if (!previousScan) {
    res.status(404).json({ error: 'Previous scan not found' });
    return;
  }

  const userId = (req as any).user?.id;
  const scan = new Scan({
    projectId: previousScan.projectId,
    userId,
    applicationName: previousScan.applicationName,
    uploadedFileName: fileName || previousScan.uploadedFileName,
    language: previousScan.language,
    status: 'analyzing',
    scanType: 'RETEST',
    previousScanId: previousScan._id
  });

  try {
    await scan.save();
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initialize retest scan', details: error.message });
    return;
  }

  try {
    const startTime = Date.now();
    const rawFindings = await analyzeSource(scan.language, sourceCode, fileName);
    const duration = Date.now() - startTime;
    
    // Compare findings
    const oldFindings = await Finding.find({ scanId: previousScan._id });
    
    const resolvedFindings: mongoose.Types.ObjectId[] = [];
    const stillOpenFindings: mongoose.Types.ObjectId[] = [];
    const newFindings: any[] = []; // documents to insert

    // Clone rawFindings to keep track of what's unmatched
    const unmatchedRawFindings = [...rawFindings];

    for (const old of oldFindings) {
      // Find a match in rawFindings
      const matchIndex = unmatchedRawFindings.findIndex(r => 
        (r.category === old.category || r.ruleId === old.ruleId) && 
        r.file === old.file
      );

      if (matchIndex !== -1) {
        // Still open
        stillOpenFindings.push(old._id as mongoose.Types.ObjectId);
        unmatchedRawFindings.splice(matchIndex, 1);
      } else {
        // Resolved
        resolvedFindings.push(old._id as mongoose.Types.ObjectId);
        old.status = 'RESOLVED';
        await old.save();
      }
    }

    // Unmatched remaining are new
    const findingsDocs = unmatchedRawFindings.map(f => ({
      scanId: scan._id,
      title: f.title,
      severity: f.severity,
      category: f.category,
      language: scan.language,
      file: f.file,
      line: f.line,
      description: f.description,
      impact: f.impact,
      recommendation: f.recommendation,
      status: 'OPEN',
      ruleId: f.ruleId,
      cwe: f.cwe,
      owasp: f.owasp,
      snippet: f.snippet
    }));

    let insertedIds: mongoose.Types.ObjectId[] = [];
    if (findingsDocs.length > 0) {
      const inserted = await Finding.insertMany(findingsDocs);
      insertedIds = inserted.map(i => i._id as mongoose.Types.ObjectId);
    }

    scan.status = 'completed';
    // Calculate new summary (stillOpen + new)
    const combinedSummary = calculateSummary([
      ...rawFindings // the new raw findings representing all current issues
    ]);
    scan.summary = combinedSummary;
    scan.completedAt = new Date();
    scan.duration = duration;
    scan.resolvedFindings = resolvedFindings;
    scan.stillOpenFindings = stillOpenFindings;
    scan.newFindings = insertedIds;
    
    await scan.save();

    res.status(200).json({
      scanId: scan._id,
      status: scan.status,
      summary: scan.summary,
      comparison: {
        resolved: resolvedFindings.length,
        stillOpen: stillOpenFindings.length,
        new: insertedIds.length
      }
    });
  } catch (error: any) {
    scan.status = 'failed';
    await scan.save();
    res.status(500).json({ error: 'Retest failed', details: error.message });
  }
};

export const getScanComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const scanId = req.params.scanId;
    const scan = await Scan.findById(scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.scanType !== 'RETEST') {
      res.status(400).json({ error: 'Scan is not a retest' });
      return;
    }

    const previousScan = await Scan.findById(scan.previousScanId);

    const resolved = scan.resolvedFindings || [];
    const stillOpen = scan.stillOpenFindings || [];
    const newF = scan.newFindings || [];

    res.status(200).json({
      previousScanId: scan.previousScanId,
      currentScanId: scan._id,
      previousFindingsCount: previousScan?.summary?.total || (resolved.length + stillOpen.length),
      currentFindingsCount: scan.summary?.total || (stillOpen.length + newF.length),
      resolved: resolved.length,
      stillOpen: stillOpen.length,
      new: newF.length
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch comparison', details: error.message });
  }
};
