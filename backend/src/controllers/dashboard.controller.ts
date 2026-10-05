import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { ManualReview } from '../models/ManualReview';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role || 'DEVELOPER';

    let projectFilter: any = {};
    if (userRole !== 'ADMIN') {
      projectFilter = { $or: [{ userId }, { userId: { $exists: false } }] };
    }

    const projects = await Project.find(projectFilter).select('_id');
    const projectIds = projects.map(p => p._id);

    const totalProjects = projectIds.length;
    
    const scanFilter = userRole !== 'ADMIN' ? {
      $or: [
        { projectId: { $in: projectIds } },
        { userId },
        { userId: { $exists: false } }
      ]
    } : {};
    
    const scans = await Scan.find(scanFilter).select('_id');
    const scanIds = scans.map(s => s._id);
    const totalScans = scanIds.length;
    
    const findingFilter = { scanId: { $in: scanIds } };

    // Aggregate findings with manual reviews
    const findingAggregation = await Finding.aggregate([
      { $match: findingFilter },
      {
        $lookup: {
          from: 'manualreviews', // MongoDB collection name for ManualReview
          localField: '_id',
          foreignField: 'findingId',
          as: 'review'
        }
      },
      {
        $unwind: {
          path: '$review',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            severity: { $toUpper: "$severity" },
            status: "$status",
            decision: "$review.decision"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    let critical = 0, high = 0, medium = 0, low = 0, info = 0;
    let riskPenalty = 0;
    
    let reviewed = 0;
    let notReviewed = 0;
    let truePositive = 0;
    let falsePositive = 0;
    let needsInvestigation = 0;

    findingAggregation.forEach(item => {
      const severity = item._id.severity || '';
      const status = item._id.status || 'OPEN';
      const decision = item._id.decision;
      const count = item.count;

      if (severity.includes('CRITICAL')) critical += count;
      else if (severity.includes('HIGH')) high += count;
      else if (severity.includes('MEDIUM')) medium += count;
      else if (severity.includes('LOW')) low += count;
      else if (severity.includes('INFO')) info += count;

      if (decision) {
        reviewed += count;
        if (decision === 'TRUE_POSITIVE') truePositive += count;
        if (decision === 'FALSE_POSITIVE') falsePositive += count;
        if (decision === 'NEEDS_INVESTIGATION') needsInvestigation += count;
      } else {
        notReviewed += count;
      }

      // Calculate risk penalty
      // Weights: Critical=10, High=6, Medium=3, Low=1
      let weight = 0;
      if (severity.includes('CRITICAL')) weight = 10;
      else if (severity.includes('HIGH')) weight = 6;
      else if (severity.includes('MEDIUM')) weight = 3;
      else if (severity.includes('LOW')) weight = 1;

      // Status modifiers
      let modifier = 1.0;
      if (decision === 'FALSE_POSITIVE' || status === 'FALSE_POSITIVE') modifier = 0.0;
      else if (status === 'RESOLVED') modifier = 0.0; // Assume resolved implies no current risk
      else if (decision === 'NEEDS_INVESTIGATION' || status === 'UNDER_REVIEW') modifier = 0.5;
      
      riskPenalty += (weight * count * modifier);
    });

    const totalFindings = critical + high + medium + low + info;

    let securityScore = 100;
    if (totalScans > 0 || totalFindings > 0) {
      // Normalized score: 100 - (100 * risk) / (risk + 50)
      securityScore = Math.round(100 - (100 * riskPenalty) / (riskPenalty + 50));
    }

    const recentScansData = await Scan.find(scanFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('projectId', 'name')
      .lean();

    const recentScans = recentScansData.map((scan: any) => {
      // We don't have manual reviews populated here, so we just use the raw summary counts
      // for a rough estimate of the individual scan score.
      const criticalCount = scan.summary?.critical || 0;
      const highCount = scan.summary?.high || 0;
      const mediumCount = scan.summary?.medium || 0;
      const lowCount = scan.summary?.low || 0;
      
      const scanRisk = (criticalCount * 10) + (highCount * 6) + (mediumCount * 3) + (lowCount * 1);
      const scanScore = Math.round(100 - (100 * scanRisk) / (scanRisk + 50));
      
      return {
        _id: scan._id,
        project: scan.projectId?.name || scan.applicationName || 'Unknown Project',
        language: scan.language || 'N/A',
        score: scanScore,
        critical: criticalCount,
        high: highCount,
        status: scan.status === 'completed' ? 'Completed' : (scan.status === 'failed' ? 'Failed' : 'Analyzing'),
        date: scan.createdAt
      };
    });

    const recentFindingsData = await Finding.find(findingFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'scanId', populate: { path: 'projectId', select: 'name' } })
      .lean();

    const recentFindings = recentFindingsData.map((finding: any) => {
      const scan = finding.scanId;
      let projectName = 'Unknown';
      if (scan) {
        projectName = scan.projectId?.name || scan.applicationName;
      }
      return {
        _id: finding._id,
        severity: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1).toLowerCase(),
        finding: finding.title,
        cwe: finding.category,
        project: projectName,
        location: `${finding.file}:${finding.line}`,
        status: finding.status === 'OPEN' ? 'Open' : (finding.status === 'RESOLVED' ? 'Resolved' : 'In Review'),
        date: finding.createdAt
      };
    });

    const maxCount = Math.max(critical, high, medium, low, 0);
    const getBarWidth = (count: number) => {
      if (maxCount === 0 || count === 0) return 0;
      return Math.max((count / maxCount) * 100, 2);
    };

    const severityDistribution = [
      { label: 'Critical', count: critical, color: 'bg-error', width: `${getBarWidth(critical)}%` },
      { label: 'High', count: high, color: 'bg-orange-500', width: `${getBarWidth(high)}%` },
      { label: 'Medium', count: medium, color: 'bg-yellow-500', width: `${getBarWidth(medium)}%` },
      { label: 'Low', count: low, color: 'bg-blue-500', width: `${getBarWidth(low)}%` }
    ];

    const activity: any[] = [];
    recentScansData.forEach((scan: any) => {
      activity.push({
        id: `scan-${scan._id}`,
        type: 'scan_complete',
        text: `Scan ${scan.status} for ${scan.projectId?.name || scan.applicationName}`,
        time: scan.createdAt,
        icon: scan.status === 'completed' ? 'check_circle' : 'info'
      });
    });
    
    recentFindingsData.forEach((finding: any) => {
      const severity = finding.severity.toUpperCase();
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        const scan = finding.scanId;
        const projectName = scan ? (scan.projectId?.name || scan.applicationName) : 'Unknown';
        activity.push({
          id: `finding-${finding._id}`,
          type: 'vulnerability_found',
          text: `${finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1).toLowerCase()} vulnerability found in ${projectName}`,
          time: finding.createdAt,
          icon: 'bug_report'
        });
      }
    });

    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivity = activity.slice(0, 5);

    res.status(200).json({
      total_projects: totalProjects,
      total_scans: totalScans,
      total_findings: totalFindings,
      critical,
      high,
      medium,
      low,
      security_score: securityScore,
      recent_scans: recentScans,
      recent_findings: recentFindings,
      severity_distribution: severityDistribution,
      activity: recentActivity,
      review: {
        reviewed,
        notReviewed,
        truePositive,
        falsePositive,
        needsInvestigation
      }
    });
  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
