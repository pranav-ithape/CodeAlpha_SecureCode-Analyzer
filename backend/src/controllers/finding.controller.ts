import { Request, Response } from 'express';
import { Finding } from '../models/Finding';
import { Scan } from '../models/Scan';
import { ManualReview } from '../models/ManualReview';

export const getFindings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // 1. Find all scans belonging to the user
    const userScans = await Scan.find({
      $or: [{ userId }, { userId: null }, { userId: { $exists: false } }]
    }).select('_id');
    const scanIds = userScans.map(scan => scan._id);

    // 2. Query findings that belong to these scans
    const { severity, status, search, project, language } = req.query;
    
    let query: any = { scanId: { $in: scanIds } };

    if (severity && severity !== 'All') query.severity = { $regex: new RegExp(`^${severity}$`, 'i') };
    if (status && status !== 'All') query.status = { $regex: new RegExp(`^${status.toString().replace(' ', '.*')}$`, 'i') };
    if (language && language !== 'All') query.language = { $regex: new RegExp(`^${language}$`, 'i') };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { file: { $regex: search, $options: 'i' } }
      ];
    }

    const findingsData = await Finding.find(query)
      .populate({ path: 'scanId', populate: { path: 'projectId' } })
      .sort({ createdAt: -1 })
      .lean();
      
    // Fetch manual reviews for these findings
    const findingIds = findingsData.map((f: any) => f._id);
    const manualReviews = await ManualReview.find({ findingId: { $in: findingIds } }).lean();
    const reviewsMap = new Map();
    manualReviews.forEach((mr: any) => {
      reviewsMap.set(mr.findingId.toString(), mr);
    });

    // Map to required format
    const results = findingsData.map((f: any) => {
      const scan = f.scanId;
      const projectName = scan ? (scan.projectId?.name || scan.applicationName) : 'Unknown';
      const review = reviewsMap.get(f._id.toString());
      
      // Additional project filter check if applied (since we populated project name)
      if (project && project !== 'All' && !projectName.toLowerCase().includes(project.toString().toLowerCase())) {
        return null;
      }

      const reviewStatus = review ? 'Reviewed' : 'Not Reviewed';
      const reviewDecision = review ? review.decision : 'Pending';

      if (req.query.reviewStatus && req.query.reviewStatus !== 'All' && reviewStatus !== req.query.reviewStatus) {
        return null;
      }

      if (req.query.decision && req.query.decision !== 'All') {
        const mapDec: any = {
          'Pending': 'Pending',
          'True Positive': 'TRUE_POSITIVE',
          'False Positive': 'FALSE_POSITIVE',
          'Needs Investigation': 'NEEDS_INVESTIGATION'
        };
        if (reviewDecision !== mapDec[req.query.decision.toString()]) return null;
      }

      return {
        id: f._id,
        scan_id: scan?._id || '',
        project_id: scan?.projectId?._id || '',
        project_name: projectName,
        title: f.title,
        description: f.description,
        severity: f.severity.charAt(0).toUpperCase() + f.severity.slice(1).toLowerCase(),
        cwe: f.cwe || f.category,
        owasp_category: f.owasp || f.category,
        scanner: f.scanner || (f.language && f.language.toLowerCase() === 'python' ? 'Bandit' : 'Semgrep'),
        rule_id: f.ruleId || f.category,
        file_name: f.file,
        line_number: f.line,
        code_snippet: f.snippet || '',
        impact: f.impact,
        recommendation: f.recommendation,
        status: f.status === 'OPEN' ? 'Open' : (
                f.status === 'RESOLVED' ? 'Resolved' : 
                f.status === 'FALSE_POSITIVE' ? 'False Positive' : 
                f.status === 'CONFIRMED' ? 'Confirmed' : 'Under Review'
        ),
        reviewStatus: reviewStatus,
        decision: reviewDecision,
        reviewerRisk: review ? review.reviewerRisk : null,
        created_at: f.createdAt,
        updated_at: f.updatedAt
      };
    }).filter(item => item !== null);

    res.status(200).json(results);
  } catch (error: any) {
    console.error('Error fetching findings:', error);
    res.status(500).json({ error: 'Failed to fetch findings', details: error.message });
  }
};

export const getFindingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const findingId = req.params.findingId;
    const userId = (req as any).user.id;

    const finding: any = await Finding.findById(findingId).populate({ path: 'scanId', populate: { path: 'projectId' } }).lean();
    if (!finding) {
      res.status(404).json({ error: 'Finding not found' });
      return;
    }

    // Verify ownership
    if (finding.scanId) {
      const scan = await Scan.findOne({
        _id: finding.scanId._id,
        $or: [{ userId }, { userId: null }, { userId: { $exists: false } }]
      });

      if (!scan) {
        res.status(403).json({ error: 'Unauthorized to view this finding' });
        return;
      }
    }

    const projectName = finding.scanId ? (finding.scanId.projectId?.name || finding.scanId.applicationName) : 'Unknown';
    const review = await ManualReview.findOne({ findingId: finding._id }).lean();

    res.status(200).json({
      id: finding._id,
      scan_id: finding.scanId?._id || '',
      project_id: finding.scanId?.projectId?._id || '',
      project_name: projectName,
      title: finding.title,
      description: finding.description,
      severity: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1).toLowerCase(),
      cwe: finding.cwe || finding.category,
      owasp_category: finding.owasp || finding.category,
      scanner: finding.scanner || (finding.language && finding.language.toLowerCase() === 'python' ? 'Bandit' : 'Semgrep'),
      rule_id: finding.ruleId || finding.category,
      file_name: finding.file,
      line_number: finding.line,
      code_snippet: finding.snippet || '',
      impact: finding.impact,
      recommendation: finding.recommendation,
      reviewerComment: finding.reviewerComment,
      reviewerName: finding.reviewerName,
      reviewTimestamp: finding.reviewTimestamp,
      status: finding.status === 'OPEN' ? 'Open' : (
              finding.status === 'RESOLVED' ? 'Resolved' : 
              finding.status === 'FALSE_POSITIVE' ? 'False Positive' : 
              finding.status === 'CONFIRMED' ? 'Confirmed' : 'Under Review'
      ),
      reviewStatus: review ? 'Reviewed' : 'Not Reviewed',
      decision: review ? review.decision : 'Pending',
      reviewerRisk: review ? review.reviewerRisk : null,
      manualReviewComments: review ? review.comments : null,
      created_at: finding.createdAt,
      updated_at: finding.updatedAt
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid finding ID' });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch finding', details: error.message });
  }
};

export const updateFindingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const findingId = req.params.findingId;
    const userId = (req as any).user.id;
    const userName = (req as any).user.name || 'Analyst';
    const { status, reviewerComment } = req.body;

    const finding = await Finding.findById(findingId);
    if (!finding) {
      res.status(404).json({ error: 'Finding not found' });
      return;
    }

    // Verify ownership
    if (finding.scanId) {
      const scan = await Scan.findOne({
        _id: finding.scanId,
        $or: [{ userId }, { userId: null }, { userId: { $exists: false } }]
      });

      if (!scan) {
        res.status(403).json({ error: 'Unauthorized to update this finding' });
        return;
      }
    }

    if (status) {
      const statusMap: Record<string, string> = {
        'Open': 'OPEN',
        'Under Review': 'UNDER_REVIEW',
        'Confirmed': 'CONFIRMED',
        'False Positive': 'FALSE_POSITIVE',
        'Resolved': 'RESOLVED'
      };

      const backendStatus = statusMap[status];
      if (backendStatus) {
        finding.status = backendStatus;
      }
    }

    if (reviewerComment !== undefined) {
      finding.reviewerComment = reviewerComment;
    }

    finding.reviewerName = userName;
    finding.reviewTimestamp = new Date();

    await finding.save();

    res.status(200).json({ message: 'Finding updated successfully', status: finding.status });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update finding', details: error.message });
  }
};
