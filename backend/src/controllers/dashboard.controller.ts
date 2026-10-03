import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalScans = await Scan.countDocuments();
    
    const findingAggregation = await Finding.aggregate([
      {
        $group: {
          _id: { $toUpper: "$severity" },
          count: { $sum: 1 }
        }
      }
    ]);

    let critical = 0, high = 0, medium = 0, low = 0, info = 0;
    
    findingAggregation.forEach(item => {
      const severity = item._id || '';
      if (severity.includes('CRITICAL')) critical = item.count;
      else if (severity.includes('HIGH')) high = item.count;
      else if (severity.includes('MEDIUM')) medium = item.count;
      else if (severity.includes('LOW')) low = item.count;
      else if (severity.includes('INFO')) info = item.count;
    });

    const totalFindings = critical + high + medium + low + info;

    let securityScore = 0;
    if (totalScans > 0) {
      const deduction = (critical * 10) + (high * 5) + (medium * 2) + (low * 1);
      securityScore = Math.max(0, 100 - deduction);
    }

    const recentScansData = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('projectId', 'name')
      .lean();

    const recentScans = recentScansData.map((scan: any) => {
      const scanDeduction = (scan.summary.critical * 10) + (scan.summary.high * 5) + (scan.summary.medium * 2) + (scan.summary.low * 1);
      const scanScore = Math.max(0, 100 - scanDeduction);
      return {
        _id: scan._id,
        project: scan.projectId?.name || scan.applicationName,
        language: scan.language,
        score: scanScore,
        critical: scan.summary.critical || 0,
        high: scan.summary.high || 0,
        status: scan.status === 'completed' ? 'Completed' : (scan.status === 'failed' ? 'Failed' : 'Analyzing'),
        date: scan.createdAt
      };
    });

    const recentFindingsData = await Finding.find()
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

    const severityDistribution = [
      { label: 'Critical', count: critical, color: 'bg-error', width: totalFindings ? `${(critical/totalFindings)*100}%` : '0%' },
      { label: 'High', count: high, color: 'bg-orange-500', width: totalFindings ? `${(high/totalFindings)*100}%` : '0%' },
      { label: 'Medium', count: medium, color: 'bg-yellow-500', width: totalFindings ? `${(medium/totalFindings)*100}%` : '0%' },
      { label: 'Low', count: low, color: 'bg-blue-500', width: totalFindings ? `${(low/totalFindings)*100}%` : '0%' }
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
      activity: recentActivity
    });
  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
