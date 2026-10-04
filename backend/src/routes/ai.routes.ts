import express from 'express';
import { generateRecommendation } from '../services/ai.service';
import { Finding } from '../models/Finding';
import { AIAnalysis } from '../models/AIAnalysis';
import { requireFindingAccess, requireRole } from '../middlewares/rbac.middleware';
import { logAudit } from '../services/audit.service';
import mongoose from 'mongoose';

const router = express.Router();

// Fetch all AI analyses
router.get('/analysis', async (req, res) => {
  try {
    const userRole = (req as any).user?.role || 'DEVELOPER';
    let analyses;
    
    if (userRole === 'ADMIN') {
      analyses = await AIAnalysis.find().populate('findingId');
    } else {
      const userId = (req as any).user?.id;
      const userScans = await mongoose.model('Scan').find({
        $or: [{ userId }, { userId: { $exists: false } }]
      });
      const scanIds = userScans.map(s => s._id);
      
      const userFindings = await mongoose.model('Finding').find({
        scanId: { $in: scanIds }
      });
      const findingIds = userFindings.map(f => f._id);
      
      analyses = await AIAnalysis.find({ findingId: { $in: findingIds } }).populate('findingId');
    }
    
    return res.status(200).json({ success: true, data: analyses });
  } catch (error) {
    console.error('Error fetching all AI analyses:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Fetch existing AI analysis by findingId
router.get('/analysis/:findingId', requireFindingAccess, async (req, res) => {
  try {
    const analysis = await AIAnalysis.findOne({ findingId: req.params.findingId });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'AI analysis not found' });
    }
    return res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Generate or regenerate AI analysis
router.post('/analyze/:findingId', requireFindingAccess, requireRole(['ADMIN', 'SECURITY_ANALYST']), async (req, res) => {
  try {
    const finding = await Finding.findById(req.params.findingId);
    if (!finding) {
      return res.status(404).json({ success: false, message: 'Finding not found' });
    }

    const aiAnalysis = await generateRecommendation(finding);
    
    await logAudit({
      userId: (req as any).user?.id,
      action: 'AI_ANALYSIS_GENERATED',
      resourceType: 'AIAnalysis',
      resourceId: aiAnalysis._id.toString(),
      status: 'SUCCESS'
    });

    return res.status(200).json({ success: true, data: aiAnalysis });
  } catch (error: any) {
    console.error('AI generation error:', error);
    const msg = error.message?.toLowerCase() || '';
    
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      return res.status(429).json({ success: false, message: 'AI service rate limit reached' });
    }
    if (msg.includes('503') || msg.includes('unavailable') || msg.includes('overloaded')) {
      return res.status(503).json({ success: false, message: 'AI service temporarily unavailable' });
    }
    
    return res.status(500).json({ success: false, message: 'AI analysis failed' });
  }
});

export default router;
