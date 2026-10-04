import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ManualReview } from '../models/ManualReview';
import { Finding } from '../models/Finding';
import { logAudit } from '../services/audit.service';

export const getManualReviews = async (req: Request, res: Response) => {
  try {
    const { projectId, findingId } = req.query;
    
    const userRole = (req as any).user?.role || 'DEVELOPER';
    let filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (findingId) filter.findingId = findingId;

    if (userRole !== 'ADMIN') {
      const userId = (req as any).user?.id;
      const userProjects = await mongoose.model('Project').find({
        $or: [{ userId }, { userId: { $exists: false } }]
      });
      const projectIds = userProjects.map(p => p._id);
      
      const userScans = await mongoose.model('Scan').find({
        $or: [
          { projectId: { $in: projectIds } },
          { userId },
          { userId: { $exists: false } }
        ]
      });
      const scanIds = userScans.map(s => s._id);
      
      // ManualReview model has scanId
      filter.scanId = { $in: scanIds };
    }

    const reviews = await ManualReview.find(filter)
      .populate('reviewerId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch manual reviews' });
  }
};

export const getManualReviewByFindingId = async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const review = await ManualReview.findOne({ findingId }).populate('reviewerId', 'name email');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch manual review' });
  }
};

export const saveManualReview = async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { decision, reviewerRisk, comments } = req.body;
    
    if (!decision || !reviewerRisk || !comments) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify finding exists
    const finding = await Finding.findById(findingId).populate('scanId');
    if (!finding) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    
    // The finding's scan has projectId
    // Wait, let's get projectId from the finding's scan
    // But scanId is populated? No, Finding model just has scanId.
    // Let's assume finding has scanId, and we can look up the Scan.
    // Or we can just use any user available.
    let scan: any = null;
    if (finding.scanId) {
      scan = await mongoose.model('Scan').findById(finding.scanId);
    }
    const projectId = scan ? scan.projectId : null;

    const userId = (req as any).user?.id || null;

    // Upsert review
    const review = await ManualReview.findOneAndUpdate(
      { findingId },
      {
        findingId,
        projectId: projectId,
        scanId: finding.scanId,
        reviewerId: userId,
        decision,
        reviewerRisk,
        comments
      },
      { new: true, upsert: true }
    );
    
    await logAudit({
      userId: userId,
      action: 'FINDING_REVIEWED',
      resourceType: 'ManualReview',
      resourceId: review._id.toString(),
      projectId: projectId?.toString(),
      status: 'SUCCESS'
    });

    res.json({ message: 'Review saved successfully', review });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save manual review' });
  }
};
