import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { Project } from '../models/Project';
import { Scan } from '../models/Scan';
import { Finding } from '../models/Finding';
import { AIAnalysis } from '../models/AIAnalysis';
import { ManualReview } from '../models/ManualReview';
import { Report } from '../models/Report';

const REPORTS_DIR = path.join(__dirname, '../../reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export const generateReport = async (scanId: string, format: 'pdf' | 'json' | 'html'): Promise<any> => {
  const scan = await Scan.findById(scanId);
  if (!scan) throw new Error('Scan not found');

  const project = await Project.findById(scan.projectId);
  if (!project) throw new Error('Project not found');

  let findings = await Finding.find({ scanId: scan._id }).lean();
  
  if (scan.scanType === 'RETEST' && scan.stillOpenFindings && scan.stillOpenFindings.length > 0) {
    const stillOpen = await Finding.find({ _id: { $in: scan.stillOpenFindings } }).lean();
    findings = [...findings, ...stillOpen];
  }

  const findingIds = findings.map(f => f._id);
  const aiAnalyses = await AIAnalysis.find({ findingId: { $in: findingIds } }).lean();
  const manualReviews = await ManualReview.find({ findingId: { $in: findingIds } }).lean();

  const combinedFindings = findings.map(f => ({
    ...f,
    cwe: f.cwe || f.category,
    owasp: f.owasp || f.category,
    ruleId: f.ruleId || f.category,
    scanner: f.scanner || (f.language && f.language.toLowerCase() === 'python' ? 'Bandit' : (f.language ? 'Semgrep' : undefined)),
    aiAnalysis: aiAnalyses.find(ai => ai.findingId.toString() === f._id.toString()),
    manualReview: manualReviews.find(mr => mr.findingId.toString() === f._id.toString())
  }));

  const severityOrder: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFORMATIONAL': 0 };
  combinedFindings.sort((a, b) => (severityOrder[(b.severity || '').toUpperCase()] || 0) - (severityOrder[(a.severity || '').toUpperCase()] || 0));

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
      summary: scan.summary,
      scanner: 'SecureCode Auditor Platform',
      applicationName: scan.applicationName,
      uploadedFileName: scan.uploadedFileName || (combinedFindings.length > 0 ? combinedFindings[0].file : 'N/A')
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
    } else if (format === 'html' || format === 'pdf') {
      let logoBase64 = '';
      try {
        const logoPath = path.resolve(__dirname, '../../../public/logo-wide.png');
        if (fs.existsSync(logoPath)) {
          const logoData = fs.readFileSync(logoPath);
          logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        }
      } catch (e) {
        console.warn('Logo not found or could not be loaded for report generation.');
      }
      
      const htmlContent = generateHTML(reportData, logoBase64);
      
      if (format === 'html') {
        fs.writeFileSync(filePath, htmlContent);
      } else {
        await generatePDF(htmlContent, filePath);
      }
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

const generateHTML = (data: any, logoBase64: string): string => {
  const totalFindings = data.scan.summary.total || 0;
  const c = data.scan.summary.critical || 0;
  const h = data.scan.summary.high || 0;
  const m = data.scan.summary.medium || 0;
  const l = data.scan.summary.low || 0;

  const maxRisk = Math.max(c, h, m, l, 1);
  const cPct = (c / maxRisk) * 100;
  const hPct = (h / maxRisk) * 100;
  const mPct = (m / maxRisk) * 100;
  const lPct = (l / maxRisk) * 100;

  let overallRisk = 'LOW';
  if (c > 0) overallRisk = 'CRITICAL';
  else if (h > 0) overallRisk = 'HIGH';
  else if (m > 0) overallRisk = 'MEDIUM';
  else if (totalFindings === 0) overallRisk = 'NONE';

  let riskExpl = 'No vulnerabilities were identified in the assessed codebase.';
  if (overallRisk === 'CRITICAL') riskExpl = 'The assessed codebase contains critical severity findings that pose an immediate and severe threat to application security. Immediate prioritized remediation is mandatory to prevent potential compromise.';
  else if (overallRisk === 'HIGH') riskExpl = 'The assessed codebase contains high severity findings that may expose sensitive application functionality or data. Prioritized remediation is strongly recommended.';
  else if (overallRisk === 'MEDIUM') riskExpl = 'The assessed codebase contains medium severity findings that pose a moderate security risk. Remediation should be planned in upcoming development cycles.';
  else if (overallRisk === 'LOW') riskExpl = 'The assessed codebase contains only low severity or informational findings. Security posture is relatively strong, but defense-in-depth improvements can be made.';

  interface RefEntry {
    id: string;
    title: string;
    source: string;
    url: string;
    usedBy: string[];
  }
  const refRegistry = new Map<string, RefEntry>();
  let refCounter = 1;
  let aiModels = new Set<string>();

  data.findings.forEach((f: any, i: number) => {
    f.reportId = `F-${(i+1).toString().padStart(3, '0')}`;
    f.assignedRefs = [] as RefEntry[];
    const rawRefs = new Set<string>();

    if (f.aiAnalysis && f.aiAnalysis.references) {
      f.aiAnalysis.references.forEach((r: string) => rawRefs.add(r));
    }
    if (f.cwe && f.cwe.match(/CWE-(\d+)/i)) {
      const match = f.cwe.match(/CWE-(\d+)/i);
      rawRefs.add(`[CWE-${match[1]} — ${f.cwe}](https://cwe.mitre.org/data/definitions/${match[1]}.html)`);
    }
    if (f.owasp && f.owasp !== 'N/A') {
      rawRefs.add(`[OWASP Category — ${f.owasp}](https://owasp.org/)`);
    }

    if (f.aiAnalysis && f.aiAnalysis.aiModel) {
      aiModels.add(f.aiAnalysis.aiModel);
    }

    rawRefs.forEach((rawUrl: string) => {
      let title = rawUrl;
      let url = rawUrl.trim();
      let source = 'External Reference';
      
      const mdMatch = url.match(/^\[(.*?)\]\((.*?)\)$/);
      if (mdMatch) {
        title = mdMatch[1];
        url = mdMatch[2];
      } else {
        if (url.includes('cwe.mitre.org')) source = 'MITRE CWE';
        else if (url.includes('owasp.org')) source = 'OWASP';
        else if (url.includes('docs.oracle.com')) source = 'Oracle Documentation';
        else if (url.includes('nist.gov')) source = 'NIST';
        
        if (title === url) {
          try {
            const parsed = new URL(url);
            title = parsed.hostname + parsed.pathname;
          } catch(e) {}
        }
      }

      let matchUrl = url.replace(/^https?:\/\//, '').toLowerCase();
      if (matchUrl.endsWith('/')) matchUrl = matchUrl.slice(0, -1);

      if (!refRegistry.has(matchUrl)) {
        refRegistry.set(matchUrl, {
          id: `R${refCounter++}`,
          title,
          source,
          url,
          usedBy: [f.reportId]
        });
      } else {
        const existing = refRegistry.get(matchUrl)!;
        if (!existing.usedBy.includes(f.reportId)) {
          existing.usedBy.push(f.reportId);
        }
      }
      
      const existing = refRegistry.get(matchUrl)!;
      if (!f.assignedRefs.some((r: any) => r.id === existing.id)) {
        f.assignedRefs.push(existing);
      }
    });
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${data.project.name}</title>
  <style>
    :root {
      --primary: #1d4ed8;
      --primary-dark: #1e40af;
      --surface: #ffffff;
      --on-surface: #111827;
      --on-surface-variant: #4b5563;
      --outline: #e5e7eb;
      --critical: #dc2626;
      --high: #f97316;
      --medium: #eab308;
      --low: #3b82f6;
    }
    @page {
      size: A4;
      margin: 25mm 20mm;
    }
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--on-surface);
      line-height: 1.5;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .page-break { page-break-before: always; break-before: page; margin-top: 2rem; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 230mm;
      padding: 10mm;
    }
    .cover-logo { max-width: 400px; margin-bottom: 3rem; }
    .cover-brand { font-size: 14pt; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem; }
    .cover-title { font-size: 34pt; font-weight: 800; color: #111; margin-bottom: 0.5rem; line-height: 1.1; letter-spacing: -0.5px; }
    .cover-subtitle { font-size: 16pt; color: var(--primary); margin-bottom: 5rem; font-weight: 500; }
    
    .cover-meta-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 4rem; border-left: 4px solid var(--primary); padding-left: 1.5rem; }
    .cover-meta-item { display: flex; flex-direction: column; }
    .cover-meta-label { font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; color: var(--on-surface-variant); font-weight: 700; margin-bottom: 0.25rem; }
    .cover-meta-val { font-size: 12pt; font-weight: 500; color: #111; }
    
    .cover-classification {
      align-self: flex-start; font-weight: 800; color: var(--critical); border: 3px solid var(--critical); padding: 0.75rem 1.5rem; font-size: 14pt; letter-spacing: 3px; text-transform: uppercase;
    }

    /* Typography */
    h1 { font-size: 24pt; font-weight: 800; color: #111; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; margin-top: 0; margin-bottom: 1.5rem; break-after: avoid; }
    h2 { font-size: 16pt; font-weight: 700; color: #111; margin-top: 2rem; margin-bottom: 1rem; break-after: avoid; }
    h3 { font-size: 13pt; font-weight: 700; color: #222; margin-top: 1.5rem; margin-bottom: 0.75rem; break-after: avoid; }
    h4 { font-size: 11pt; font-weight: 700; color: #333; margin-top: 1.25rem; margin-bottom: 0.5rem; break-after: avoid; }
    p { margin-top: 0; margin-bottom: 1rem; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 9.5pt; }
    th, td { border: 1px solid var(--outline); padding: 0.75rem; text-align: left; vertical-align: top; }
    th { background-color: #f8fafc; font-weight: 700; color: #111; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }

    /* Badges */
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 8pt; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge.critical { background: var(--critical); }
    .badge.high { background: var(--high); }
    .badge.medium { background: var(--medium); }
    .badge.low { background: var(--low); }
    .badge.informational { background: #6b7280; }
    
    /* Risk Chart */
    .risk-chart { margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border: 1px solid var(--outline); border-radius: 6px; }
    .risk-row { display: flex; align-items: center; margin-bottom: 0.75rem; }
    .risk-label { width: 100px; font-weight: 700; font-size: 9.5pt; }
    .risk-bar-container { flex-grow: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin-right: 1rem; }
    .risk-bar { height: 100%; }
    .risk-count { width: 40px; text-align: right; font-weight: 700; font-size: 10pt; }

    /* Summary Cards */
    .summary-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #f8fafc; border: 1px solid var(--outline); padding: 1.25rem; border-radius: 6px; text-align: center; }
    .card-title { font-size: 8pt; text-transform: uppercase; font-weight: 700; color: var(--on-surface-variant); margin-bottom: 0.5rem; letter-spacing: 0.5px; }
    .card-value { font-size: 24pt; font-weight: 800; color: #111; line-height: 1; }
    .card.critical { border-bottom: 4px solid var(--critical); }
    .card.high { border-bottom: 4px solid var(--high); }
    .card.medium { border-bottom: 4px solid var(--medium); }
    .card.low { border-bottom: 4px solid var(--low); }
    .card.total { border-bottom: 4px solid var(--primary); }

    /* Detailed Findings */
    .finding-container { margin-bottom: 3.5rem; }
    .finding-header { background: #f8fafc; border: 1px solid var(--outline); border-left: 6px solid var(--primary); padding: 1.5rem; margin-bottom: 1.5rem; break-inside: avoid; }
    .finding-header.critical { border-left-color: var(--critical); }
    .finding-header.high { border-left-color: var(--high); }
    .finding-header.medium { border-left-color: var(--medium); }
    .finding-header.low { border-left-color: var(--low); }
    .finding-header.informational { border-left-color: #6b7280; }
    
    .finding-id { font-size: 10pt; font-weight: 800; color: var(--on-surface-variant); margin-bottom: 0.5rem; letter-spacing: 1px; }
    .finding-title { font-size: 16pt; font-weight: 800; color: #111; margin-bottom: 1.5rem; line-height: 1.3; }
    
    .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 9.5pt; }
    .meta-item { display: flex; }
    .meta-key { font-weight: 700; width: 120px; color: var(--on-surface-variant); }
    .meta-val { font-family: "JetBrains Mono", Consolas, monospace; color: #111; word-break: break-all; }

    .finding-section { margin-bottom: 1.5rem; }
    
    /* Code Blocks */
    .code-block { background: #0f172a; color: #e2e8f0; padding: 1.25rem; border-radius: 6px; font-family: "JetBrains Mono", Consolas, monospace; font-size: 8.5pt; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; break-inside: avoid; margin-top: 0.5rem; border: 1px solid #1e293b; line-height: 1.5; }

    /* AI Analysis */
    .ai-analysis { margin-top: 2rem; border-top: 2px solid var(--outline); padding-top: 1.5rem; }
    .ai-heading { color: var(--primary-dark); font-size: 13pt; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 0.5rem; break-after: avoid; }
    .ai-section { margin-bottom: 1.25rem; break-inside: auto; }
    .ai-section-title { font-weight: 700; font-size: 10.5pt; color: #111; margin-bottom: 0.4rem; break-after: avoid; }
    .ai-section-content { font-size: 10.5pt; color: #333; margin-top: 0; line-height: 1.6; }

    /* Manual Review */
    .manual-review { margin-top: 2rem; background: #faf5ff; border: 1px solid #f3e8ff; border-left: 4px solid #a855f7; padding: 1.5rem; break-inside: avoid; }
    .manual-review-title { color: #7e22ce; font-size: 11pt; font-weight: 800; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px; }

    /* References */
    .references-block { margin-top: 1.5rem; background: #f8fafc; border: 1px solid var(--outline); padding: 1.25rem; border-radius: 4px; break-inside: avoid; }
    .references-heading { color: #334155; font-size: 10pt; font-weight: 800; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px; }
    .ref-item { margin-bottom: 1rem; font-size: 9.5pt; display: flex; gap: 0.5rem; }
    .ref-id { font-weight: 800; color: var(--primary); width: 35px; flex-shrink: 0; }
    .ref-content { flex-grow: 1; }
    .ref-title { font-weight: 700; color: #111; margin-bottom: 0.2rem; }
    .ref-source { color: var(--on-surface-variant); font-size: 8.5pt; margin-bottom: 0.2rem; }
    .ref-url { color: var(--primary); font-size: 8.5pt; word-break: break-all; }
    .ref-trace-table { width: 100%; max-width: 500px; margin-bottom: 2rem; border-collapse: collapse; }
    .ref-trace-table th, .ref-trace-table td { padding: 0.5rem; border: 1px solid var(--outline); font-size: 9.5pt; }

    /* TOC */
    .toc-list { list-style: none; padding: 0; }
    .toc-item { font-size: 12pt; margin-bottom: 0.75rem; font-weight: 700; }
    .toc-subitem { font-size: 10.5pt; margin-bottom: 0.5rem; margin-left: 2rem; font-weight: 500; color: #444; }
    
    a { color: var(--primary); text-decoration: none; }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo" alt="SecureCode Auditor Logo" />` : `<div class="cover-brand">SECURECODE AUDITOR</div>`}
    <div class="cover-title">Security Assessment Report</div>
    <div class="cover-subtitle">Static Application Security Testing & Code Assessment</div>
    
    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Project</span>
        <span class="cover-meta-val">${data.project.name}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Scan Name</span>
        <span class="cover-meta-val">${data.scan.applicationName || 'N/A'}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Uploaded File</span>
        <span class="cover-meta-val">${data.scan.uploadedFileName || 'N/A'}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Assessment Type</span>
        <span class="cover-meta-val">${data.scan.type === 'RETEST' ? 'Retest Scan' : 'Initial Assessment'}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Language</span>
        <span class="cover-meta-val">${data.project.language || 'N/A'}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Assessment Date</span>
        <span class="cover-meta-val">${new Date(data.scan.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Prepared By</span>
        <span class="cover-meta-val">SecureCode Auditor Platform</span>
      </div>
    </div>

    <div class="cover-classification">CONFIDENTIAL</div>
  </div>

  <div class="page-break"></div>

  <!-- Document Control -->
  <h1>Document Control</h1>
  <table>
    <tr><th width="30%">Document Title</th><td>Security Assessment Report</td></tr>
    <tr><th>Application</th><td>SecureCode Auditor</td></tr>
    <tr><th>Project</th><td>${data.project.name}</td></tr>
    <tr><th>Scan Name</th><td>${data.scan.applicationName || 'N/A'}</td></tr>
    <tr><th>Uploaded File</th><td>${data.scan.uploadedFileName || 'N/A'}</td></tr>
    <tr><th>Assessment Type</th><td>${data.scan.type}</td></tr>
    <tr><th>Scan ID</th><td style="font-family: monospace;">${data.scan.id}</td></tr>
    <tr><th>Programming Language</th><td>${data.project.language || 'N/A'}</td></tr>
    <tr><th>Scanner</th><td>${data.scan.scanner}</td></tr>
    <tr><th>Assessment Date</th><td>${new Date(data.scan.date).toLocaleString()}</td></tr>
    <tr><th>Report Generated</th><td>${new Date(data.generatedAt).toLocaleString()}</td></tr>
    <tr><th>Report Version</th><td>1.0</td></tr>
    <tr><th>Classification</th><td style="color: var(--critical); font-weight: bold;">CONFIDENTIAL</td></tr>
  </table>

  <div class="page-break"></div>

  <!-- TOC -->
  <h1>Table of Contents</h1>
  <ul class="toc-list">
    <li class="toc-item">1. Executive Summary</li>
    <li class="toc-item">2. Assessment Overview</li>
    <li class="toc-item">3. Assessment Methodology</li>
    <li class="toc-item">4. Scope</li>
    <li class="toc-item">5. Risk Summary</li>
    <li class="toc-item">6. Findings Summary</li>
    <li class="toc-item">7. Detailed Findings
      ${c > 0 ? '<div class="toc-subitem">7.1 Critical Findings</div>' : ''}
      ${h > 0 ? '<div class="toc-subitem">7.2 High Findings</div>' : ''}
      ${m > 0 ? '<div class="toc-subitem">7.3 Medium Findings</div>' : ''}
      ${l > 0 ? '<div class="toc-subitem">7.4 Low Findings</div>' : ''}
    </li>
    <li class="toc-item">8. Remediation & Recommendations</li>
    ${data.retest ? '<li class="toc-item">9. Retest Results</li>' : ''}
    <li class="toc-item">${data.retest ? '10' : '9'}. Conclusion</li>
    <li class="toc-item">${data.retest ? '11' : '10'}. References</li>
    <li class="toc-item">${data.retest ? '12' : '11'}. Appendix</li>
  </ul>

  <div class="page-break"></div>

  <!-- 1. Executive Summary -->
  <h1>1. Executive Summary</h1>
  <p>This security assessment was automatically performed using the SecureCode Auditor platform to identify, classify, and provide remediation guidance for security weaknesses within the assessed source code.</p>
  
  <div class="summary-cards">
    <div class="card total">
      <div class="card-title">Total Findings</div>
      <div class="card-value">${totalFindings}</div>
    </div>
    <div class="card critical">
      <div class="card-title">Critical</div>
      <div class="card-value" style="color: var(--critical)">${c}</div>
    </div>
    <div class="card high">
      <div class="card-title">High</div>
      <div class="card-value" style="color: var(--high)">${h}</div>
    </div>
    <div class="card medium">
      <div class="card-title">Medium</div>
      <div class="card-value" style="color: var(--medium)">${m}</div>
    </div>
    <div class="card low">
      <div class="card-title">Low</div>
      <div class="card-value" style="color: var(--low)">${l}</div>
    </div>
  </div>

  <h2>Overall Security Risk: <span style="color: var(--${overallRisk.toLowerCase() === 'none' ? 'outline' : overallRisk.toLowerCase()})">${overallRisk}</span></h2>
  <p>${riskExpl}</p>

  <!-- 2. Assessment Overview -->
  <h2>2. Assessment Overview</h2>
  <table>
    <tr><th width="30%">Project</th><td>${data.project.name}</td></tr>
    <tr><th>Scan Name</th><td>${data.scan.applicationName || 'N/A'}</td></tr>
    <tr><th>Uploaded File</th><td>${data.scan.uploadedFileName || 'N/A'}</td></tr>
    <tr><th>Language</th><td>${data.project.language || 'N/A'}</td></tr>
    <tr><th>Scanner</th><td>${data.scan.scanner}</td></tr>
    <tr><th>Scan Type</th><td>${data.scan.type}</td></tr>
    <tr><th>Assessment Date</th><td>${new Date(data.scan.date).toLocaleString()}</td></tr>
  </table>

  <!-- 3. Assessment Methodology -->
  <h2>3. Assessment Methodology</h2>
  <p>The security assessment follows a rigorous lifecycle leveraging both static analysis and AI-assisted contextual validation:</p>
  <ol style="line-height: 1.8;">
    <li><strong>Static Analysis:</strong> The source code is scanned using industry-standard static application security testing (SAST) engines to identify vulnerable patterns.</li>
    <li><strong>Vulnerability Identification:</strong> Findings are mapped to standard frameworks (CWE, OWASP).</li>
    <li><strong>AI-Assisted Analysis:</strong> Validated findings are analyzed by an advanced AI model to determine context, root cause, and precise secure code remediation.</li>
    <li><strong>Manual Security Review:</strong> Human security analysts review critical findings to validate True/False positives and assess business risk.</li>
    <li><strong>Reporting:</strong> A comprehensive assessment report is compiled detailing all evidence and actionable remediation steps.</li>
  </ol>

  <!-- 4. Scope -->
  <h2>4. Scope</h2>
  <p>The scope of this assessment includes the source code provided to the SecureCode Auditor platform during the initiation of the scan.</p>
  <table>
    <tr><th width="30%">Project Scope</th><td>${data.project.name}</td></tr>
    <tr><th>Target Language</th><td>${data.project.language || 'N/A'}</td></tr>
    <tr><th>Environment</th><td>Static Source Code</td></tr>
  </table>

  <!-- 5. Risk Summary -->
  <div class="page-break avoid-break">
    <h1>5. Risk Summary</h1>
    <div class="risk-chart">
      <div class="risk-row">
        <div class="risk-label" style="color: var(--critical)">CRITICAL</div>
        <div class="risk-bar-container"><div class="risk-bar" style="width: ${cPct}%; background: var(--critical)"></div></div>
        <div class="risk-count">${c}</div>
      </div>
      <div class="risk-row">
        <div class="risk-label" style="color: var(--high)">HIGH</div>
        <div class="risk-bar-container"><div class="risk-bar" style="width: ${hPct}%; background: var(--high)"></div></div>
        <div class="risk-count">${h}</div>
      </div>
      <div class="risk-row">
        <div class="risk-label" style="color: var(--medium)">MEDIUM</div>
        <div class="risk-bar-container"><div class="risk-bar" style="width: ${mPct}%; background: var(--medium)"></div></div>
        <div class="risk-count">${m}</div>
      </div>
      <div class="risk-row">
        <div class="risk-label" style="color: var(--low)">LOW</div>
        <div class="risk-bar-container"><div class="risk-bar" style="width: ${lPct}%; background: var(--low)"></div></div>
        <div class="risk-count">${l}</div>
      </div>
    </div>
  </div>

  <!-- 6. Findings Summary -->
  <h1>6. Findings Summary</h1>
  ${data.findings.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th width="10%">ID</th>
          <th width="35%">Finding</th>
          <th width="15%">Severity</th>
          <th width="10%">Status</th>
          <th width="20%">CWE</th>
          <th width="10%">Review</th>
        </tr>
      </thead>
      <tbody>
        ${data.findings.map((f: any) => `
          <tr>
            <td style="font-family: monospace;">${f.reportId}</td>
            <td>${f.title}</td>
            <td><span class="badge ${f.severity.toLowerCase()}">${f.severity}</span></td>
            <td>${f.status || 'OPEN'}</td>
            <td style="font-size: 8.5pt;">${f.cwe || 'N/A'}</td>
            <td>${f.manualReview ? f.manualReview.decision.substring(0,2) : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p>No vulnerabilities were found during this assessment.</p>'}

  <!-- 7. Detailed Findings -->
  ${data.findings.length > 0 ? '<div class="page-break"><h1>7. Detailed Findings</h1></div>' : ''}
  
  ${data.findings.map((f: any) => {
    const sev = (f.severity || 'LOW').toLowerCase();
    
    let html = `
    <div class="finding-container">
      <div class="finding-header ${sev}">
        <div class="finding-id">${f.reportId}</div>
        <div class="finding-title">
          ${f.title}
          <span class="badge ${sev}">${f.severity}</span>
        </div>
        
        <div class="metadata-grid">
          <div class="meta-item"><div class="meta-key">Status</div><div class="meta-val" style="font-family: inherit; font-weight: bold;">${f.status || 'OPEN'}</div></div>
          <div class="meta-item"><div class="meta-key">Scanner</div><div class="meta-val">${f.scanner || 'N/A'}</div></div>
          <div class="meta-item"><div class="meta-key">Rule ID</div><div class="meta-val">${f.ruleId || 'N/A'}</div></div>
          <div class="meta-item"><div class="meta-key">File</div><div class="meta-val">${f.file || 'N/A'}</div></div>
          <div class="meta-item"><div class="meta-key">CWE</div><div class="meta-val">${f.cwe || 'N/A'}</div></div>
          <div class="meta-item"><div class="meta-key">Line</div><div class="meta-val">${f.line || 'N/A'}</div></div>
          <div class="meta-item"><div class="meta-key">OWASP</div><div class="meta-val">${f.owasp || 'N/A'}</div></div>
        </div>
      </div>

      <div class="finding-section">
        <h3>Description</h3>
        <p>${f.description || 'No description provided.'}</p>
      </div>
    `;

    if (f.snippet) {
      html += `
      <div class="finding-section">
        <h3>Vulnerable Code</h3>
        <div class="code-block">${f.snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
      `;
    }

    html += `
      <div class="finding-section">
        <h3>Security Impact</h3>
        <p>${f.impact || 'Impact not specified.'}</p>
      </div>
    `;

    if (f.aiAnalysis) {
      const ai = f.aiAnalysis;
      html += `
      <div class="ai-analysis">
        <div class="ai-heading">
          AI-Assisted Security Analysis
        </div>
        
        <div class="ai-section">
          <div class="ai-section-title">Summary</div>
          <p class="ai-section-content">${ai.summary}</p>
        </div>
        
        <div class="ai-section">
          <div class="ai-section-title">Why It Is Vulnerable</div>
          <p class="ai-section-content">${ai.whyVulnerable}</p>
        </div>
        
        ${ai.rootCause ? `
        <div class="ai-section">
          <div class="ai-section-title">Root Cause</div>
          <p class="ai-section-content">${ai.rootCause}</p>
        </div>` : ''}
        
        <div class="ai-section">
          <div class="ai-section-title">Recommendation</div>
          <p class="ai-section-content">${ai.recommendation}</p>
        </div>
        
        ${ai.secureCodeExample ? `
        <div class="ai-section">
          <div class="ai-section-title">Secure Code Example</div>
          <div class="code-block">${ai.secureCodeExample.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>` : ''}
      </div>
      `;
    } else {
      html += `
      <div class="ai-analysis">
        <div class="ai-heading">AI-Assisted Security Analysis</div>
        <p style="font-style: italic; color: var(--on-surface-variant)">AI analysis was not generated for this finding.</p>
      </div>
      `;
    }

    if (f.assignedRefs && f.assignedRefs.length > 0) {
      html += `
      <div class="references-block">
        <div class="references-heading">References</div>
        ${f.assignedRefs.map((r: any) => `
          <div class="ref-item">
            <div class="ref-id">[${r.id}]</div>
            <div class="ref-content">
              <div class="ref-title">${r.title}</div>
              <div class="ref-source">${r.source}</div>
              <a href="${r.url}" class="ref-url" target="_blank">${r.url}</a>
            </div>
          </div>
        `).join('')}
      </div>
      `;
    }

    if (f.manualReview) {
      const mr = f.manualReview;
      html += `
      <div class="manual-review">
        <div class="manual-review-title">Manual Security Review</div>
        <div class="metadata-grid" style="margin-bottom: 0.75rem;">
          <div class="meta-item"><div class="meta-key">Decision</div><div class="meta-val" style="font-family: inherit; font-weight: bold;">${mr.decision}</div></div>
          <div class="meta-item"><div class="meta-key">Reviewer Risk</div><div class="meta-val" style="font-family: inherit; font-weight: bold;">${mr.reviewerRisk}</div></div>
        </div>
        <div style="font-size: 9.5pt; font-weight: 700; color: var(--on-surface-variant); margin-bottom: 0.25rem;">Comments</div>
        <p style="font-size: 10pt; margin: 0;">${mr.comments || 'No comments provided.'}</p>
      </div>
      `;
    }

    html += `</div>`; // Close finding-container
    return html;
  }).join('')}

  <!-- 8. Remediation -->
  <div class="page-break">
    <h1>8. Remediation & Recommendations</h1>
    ${data.findings.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th width="15%">ID</th>
            <th width="15%">Severity</th>
            <th width="70%">Recommended Action</th>
          </tr>
        </thead>
        <tbody>
          ${data.findings.map((f: any) => `
            <tr>
              <td style="font-family: monospace;">${f.reportId}</td>
              <td><span class="badge ${f.severity.toLowerCase()}">${f.severity}</span></td>
              <td>${f.aiAnalysis ? f.aiAnalysis.recommendation : f.recommendation || 'Remediate based on best practices.'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p>No active findings require remediation.</p>'}
  </div>

  <!-- Retest section if applicable -->
  ${data.retest ? `
  <div class="page-break">
    <h1>9. Retest Results</h1>
    <div class="summary-cards" style="grid-template-columns: repeat(3, 1fr);">
      <div class="card" style="border-bottom: 4px solid #10b981;">
        <div class="card-title">Resolved Findings</div>
        <div class="card-value" style="color: #10b981;">${data.retest.resolved}</div>
      </div>
      <div class="card" style="border-bottom: 4px solid var(--high);">
        <div class="card-title">Still Open</div>
        <div class="card-value" style="color: var(--high);">${data.retest.stillOpen}</div>
      </div>
      <div class="card" style="border-bottom: 4px solid var(--primary);">
        <div class="card-title">New Findings</div>
        <div class="card-value" style="color: var(--primary);">${data.retest.new}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Conclusion -->
  <div class="page-break avoid-break">
    <h1>${data.retest ? '10' : '9'}. Conclusion</h1>
    <p>The assessment of <strong>${data.project.name}</strong> resulted in the identification of <strong>${totalFindings}</strong> vulnerabilities, resulting in an overall risk rating of <strong>${overallRisk}</strong>.</p>
    <p>${riskExpl}</p>
    <p>It is strongly recommended that the development team reviews the detailed findings in Section 7 and applies the remediation steps outlined in Section 8. Critical and High severity findings should be prioritized in the immediate sprint to minimize organizational risk. Upon completion of remediation efforts, a retest scan should be performed to validate the integrity of the implemented fixes.</p>
  </div>

  <!-- References -->
  <div class="page-break">
    <h1>${data.retest ? '11' : '10'}. References</h1>
    ${refRegistry.size > 0 ? `
      <h3>Reference Traceability</h3>
      <table class="ref-trace-table">
        <thead>
          <tr><th width="30%">Finding</th><th>References</th></tr>
        </thead>
        <tbody>
          ${data.findings.map((f: any) => `
            <tr>
              <td style="font-weight: 700;">${f.reportId}</td>
              <td>${f.assignedRefs.length > 0 ? f.assignedRefs.map((r: any) => `[${r.id}]`).join(', ') : '<span style="color: #9ca3af; font-style: italic;">No external references available.</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Master Reference Registry</h3>
      ${Array.from(refRegistry.values()).map(r => `
        <div class="ref-item" style="margin-bottom: 1.5rem;">
          <div class="ref-id" style="font-size: 11pt;">[${r.id}]</div>
          <div class="ref-content">
            <div class="ref-title" style="font-size: 11pt; color: var(--primary-dark);">${r.title}</div>
            <div class="ref-source" style="font-weight: 700; color: #111; margin-bottom: 0.25rem;">Source: <span style="font-weight: normal; color: var(--on-surface-variant);">${r.source}</span></div>
            <div style="margin-bottom: 0.4rem;"><a href="${r.url}" class="ref-url" target="_blank">${r.url}</a></div>
            <div style="font-size: 8.5pt; color: var(--on-surface-variant); padding: 0.4rem; background: #f8fafc; display: inline-block; border-radius: 4px; border: 1px solid var(--outline);">Used by: <span style="font-weight: 700; color: #111;">${r.usedBy.join(', ')}</span></div>
          </div>
        </div>
      `).join('')}
    ` : '<p>No specific external references were aggregated for this assessment.</p>'}
  </div>

  <!-- Appendix -->
  <div class="page-break">
    <h1>${data.retest ? '12' : '11'}. Appendix</h1>
    <h3>A. Scan Metadata</h3>
    <table>
      <tr><th width="30%">Scan ID</th><td style="font-family: monospace;">${data.scan.id}</td></tr>
      <tr><th>Generated On</th><td>${new Date(data.generatedAt).toLocaleString()}</td></tr>
      <tr><th>Platform Engine</th><td>SecureCode Auditor Core</td></tr>
    </table>

    <h3>B. AI Model Information</h3>
    ${aiModels.size > 0 ? `
      <p>The following AI models were utilized during the analysis of findings in this report:</p>
      <ul>
        ${Array.from(aiModels).map(model => `<li style="font-family: monospace; font-weight: bold;">${model}</li>`).join('')}
      </ul>
      <p style="font-size: 9pt; color: var(--on-surface-variant); margin-top: 1rem;">Note: AI analysis is strictly limited to static technical context and never introduces fabricated telemetry or false references.</p>
    ` : '<p>No AI models were utilized in this assessment.</p>'}
  </div>

</body>
</html>
  `;
};

const generatePDF = async (htmlContent: string, filePath: string): Promise<void> => {
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
      headerTemplate: `
        <div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; padding: 0 20mm; font-family: Helvetica, Arial, sans-serif; color: #6b7280; font-weight: bold; text-transform: uppercase;">
          <span>SecureCode Auditor</span>
          <span>Security Assessment Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 20mm; font-family: Helvetica, Arial, sans-serif; color: #6b7280;">
          <span style="font-weight: bold; color: #dc2626; letter-spacing: 1px;">CONFIDENTIAL</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '20mm',
        bottom: '25mm',
        left: '0',
        right: '0'
      }
    });
  } finally {
    await browser.close();
  }
};
