import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { AIAnalysis } from '../models/AIAnalysis';
import { ManualReview } from '../models/ManualReview';
import { Report } from '../models/Report';
import mongoose from 'mongoose';

const REPORTS_DIR = path.join(__dirname, '../../reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export const generateReport = async (scanId: string, format: 'pdf' | 'json' | 'html'): Promise<any> => {
  const scan = await Scan.findById(scanId);
  if (!scan) throw new Error('Scan not found');

  const project = await Project.findById(scan.projectId);
  if (!project) throw new Error('Project not found');

  // Fetch Findings
  let findings = await Finding.find({ scanId: scan._id }).lean();
  
  // If retest, also include stillOpenFindings
  if (scan.scanType === 'RETEST' && scan.stillOpenFindings && scan.stillOpenFindings.length > 0) {
    const stillOpen = await Finding.find({ _id: { $in: scan.stillOpenFindings } }).lean();
    findings = [...findings, ...stillOpen];
  }

  // Fetch AI Analysis and Manual Reviews
  const findingIds = findings.map(f => f._id);
  const aiAnalyses = await AIAnalysis.find({ findingId: { $in: findingIds } }).lean();
  const manualReviews = await ManualReview.find({ findingId: { $in: findingIds } }).lean();

  // Combine Data
  const combinedFindings = findings.map(f => ({
    ...f,
    aiAnalysis: aiAnalyses.find(ai => ai.findingId.toString() === f._id.toString()),
    manualReview: manualReviews.find(mr => mr.findingId.toString() === f._id.toString())
  }));

  const reportData = {
    project: {
      name: project.name,
      description: project.description,
      language: scan.language
    },
    scan: {
      id: scan._id,
      type: scan.scanType,
      date: scan.createdAt,
      previousScanId: scan.previousScanId,
      summary: scan.summary
    },
    retest: scan.scanType === 'RETEST' ? {
      resolved: scan.resolvedFindings?.length || 0,
      stillOpen: scan.stillOpenFindings?.length || 0,
      new: scan.newFindings?.length || 0
    } : null,
    findings: combinedFindings,
    generatedAt: new Date()
  };

  const safeProjectName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `securecode-report-${safeProjectName}-${scanId}.${format}`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const report = new Report({
    projectId: project._id,
    scanId: scan._id,
    reportType: format,
    fileName,
    filePath,
    status: 'generating'
  });

  await report.save();

  try {
    if (format === 'json') {
      fs.writeFileSync(filePath, JSON.stringify({ report: reportData }, null, 2));
    } else if (format === 'html') {
      const htmlContent = generateHTML(reportData);
      fs.writeFileSync(filePath, htmlContent);
    } else if (format === 'pdf') {
      await generatePDF(reportData, filePath);
    }
    
    report.status = 'ready';
    report.generatedAt = new Date();
    await report.save();

    return report;
  } catch (error) {
    report.status = 'failed';
    await report.save();
    throw error;
  }
};

const generateHTML = (data: any): string => {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Report - ${data.project.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; padding: 2rem; background: #f9f9f9; }
        .card { background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        h1, h2, h3 { color: #111; }
        .finding { border-left: 4px solid #ddd; padding-left: 1rem; margin-bottom: 2rem; background: #fafafa; padding: 1rem; border-radius: 4px; }
        .finding.critical { border-left-color: #dc2626; }
        .finding.high { border-left-color: #f97316; }
        .finding.medium { border-left-color: #eab308; }
        .finding.low { border-left-color: #3b82f6; }
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .badge.critical { background: #dc2626; }
        .badge.high { background: #f97316; }
        .badge.medium { background: #eab308; }
        .badge.low { background: #3b82f6; }
        pre { background: #2d2d2d; color: #ccc; padding: 1rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
        .section { margin-top: 1.5rem; }
        
        @keyframes premiumEnter {
          0% { opacity: 0; transform: translateY(12px) scale(0.99); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        
        body {
          animation: premiumEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @media print {
          @page { margin: 0; size: A4; }
          body { background: white; max-width: 100%; padding: 0; animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
          .card { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; page-break-inside: avoid; margin-bottom: 2rem; }
          .finding { break-inside: avoid; page-break-inside: avoid; border: 1px solid #eee; border-left: 4px solid #ddd; }
          .finding.critical { border-left-color: #dc2626; }
          .finding.high { border-left-color: #f97316; }
          .finding.medium { border-left-color: #eab308; }
          .finding.low { border-left-color: #3b82f6; }
          .section { break-inside: avoid; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>SecureCode Auditor - Security Assessment</h1>
        <p><strong>Project:</strong> ${data.project.name}</p>
        <p><strong>Language:</strong> ${data.project.language}</p>
        <p><strong>Scan ID:</strong> ${data.scan.id}</p>
        <p><strong>Date:</strong> ${new Date(data.scan.date).toLocaleString()}</p>
        <p><strong>Type:</strong> ${data.scan.type}</p>
      </div>

      <div class="card">
        <h2>Security Summary</h2>
        <p>Total Findings: ${data.scan.summary.total}</p>
        <p>Critical: ${data.scan.summary.critical} | High: ${data.scan.summary.high} | Medium: ${data.scan.summary.medium} | Low: ${data.scan.summary.low}</p>
      </div>
  `;

  if (data.retest) {
    html += `
      <div class="card">
        <h2>Retest Summary</h2>
        <p><strong>Previous Scan:</strong> ${data.scan.previousScanId}</p>
        <p><strong>Resolved:</strong> ${data.retest.resolved}</p>
        <p><strong>Still Open:</strong> ${data.retest.stillOpen}</p>
        <p><strong>New Findings:</strong> ${data.retest.new}</p>
      </div>
    `;
  }

  html += `<div class="card"><h2>Detailed Findings</h2>`;
  
  if (data.findings.length === 0) {
    html += `<p>No vulnerabilities found.</p>`;
  }

  for (const f of data.findings) {
    html += `
      <div class="finding ${f.severity.toLowerCase()}">
        <h3>${f.title} <span class="badge ${f.severity.toLowerCase()}">${f.severity.toUpperCase()}</span></h3>
        <p><strong>Status:</strong> ${f.status || 'OPEN'}</p>
        <p><strong>File:</strong> ${f.file}:${f.line}</p>
        <p><strong>Rule:</strong> ${f.ruleId} | <strong>CWE:</strong> ${f.cwe || 'N/A'} | <strong>OWASP:</strong> ${f.owasp || 'N/A'}</p>
        <div class="section">
          <h4>Description</h4>
          <p>${f.description}</p>
        </div>
    `;

    if (f.snippet) {
      html += `
        <div class="section">
          <h4>Vulnerable Code</h4>
          <pre><code>${f.snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
      `;
    }

    if (f.aiAnalysis) {
      const ai = f.aiAnalysis;
      html += `
        <div class="section" style="background: #eef2ff; padding: 1rem; border-radius: 4px; border: 1px solid #c7d2fe;">
          <h4 style="color: #4338ca; margin-top: 0;">AI Security Analysis</h4>
          <p><strong>Summary:</strong> ${ai.summary}</p>
          <p><strong>Why it's vulnerable:</strong> ${ai.whyVulnerable}</p>
          <p><strong>Impact:</strong> ${ai.securityImpact}</p>
          ${ai.rootCause ? `<p><strong>Root Cause:</strong> ${ai.rootCause}</p>` : ''}
          <p><strong>Recommendation:</strong> ${ai.recommendation}</p>
          ${ai.secureCodeExample ? `<h5>Secure Code Example:</h5><pre><code>${ai.secureCodeExample.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>` : ''}
          ${ai.references && ai.references.length > 0 ? `<h5>References:</h5><ul>${ai.references.map((r: string) => `<li><a href="${r}" target="_blank">${r}</a></li>`).join('')}</ul>` : ''}
          <div style="margin-top: 10px; font-size: 0.85rem; color: #6b7280; text-align: right;">
            <em>Generated by ${ai.aiModel || 'Gemini'}</em>
          </div>
        </div>
      `;
    } else {
      html += `<p class="section"><em>AI analysis not generated for this finding.</em></p>`;
    }

    if (f.manualReview) {
      const mr = f.manualReview;
      html += `
        <div class="section" style="background: #fdf4ff; padding: 1rem; border-radius: 4px; border: 1px solid #f9ceee;">
          <h4 style="color: #a21caf; margin-top: 0;">Manual Security Review</h4>
          <p><strong>Decision:</strong> ${mr.decision}</p>
          <p><strong>Reviewer Risk:</strong> ${mr.reviewerRisk}</p>
          <p><strong>Comments:</strong> ${mr.comments || 'None'}</p>
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `
      </div>
      <div style="text-align: center; margin-top: 2rem; color: #888; font-size: 0.875rem;">
        Generated by SecureCode Auditor on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  return html;
};

const generatePDF = async (data: any, filePath: string): Promise<void> => {
  const htmlContent = generateHTML(data);
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666; font-family: sans-serif; padding-top: 10px;">
          SecureCode Auditor - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          <br/>
          Generated on ${new Date().toLocaleString()}
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '25mm',
        left: '20mm',
        right: '20mm'
      }
    });
  } finally {
    await browser.close();
  }
};
