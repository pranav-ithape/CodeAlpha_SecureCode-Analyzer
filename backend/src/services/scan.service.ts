import { analyzePythonCode } from '../analyzers/python.analyzer';
import { analyzeSemgrepCode } from '../analyzers/semgrep.analyzer';
import { Finding, ScanSummary } from '../types/finding.types';

export const analyzeSource = async (language: string, sourceCode: string): Promise<Finding[]> => {
  const lang = language.toLowerCase();
  if (lang === 'python') {
    return await analyzePythonCode(sourceCode);
  }
  
  const semgrepLanguages = ['javascript', 'typescript', 'java', 'c', 'cpp', 'php'];
  if (semgrepLanguages.includes(lang)) {
    return await analyzeSemgrepCode(sourceCode, lang as any);
  }
  
  throw new Error(`Analyzer for language '${language}' is not implemented.`);
};

export const calculateSummary = (findings: Finding[]): ScanSummary => {
  const summary: ScanSummary = {
    total: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  findings.forEach(f => {
    if (f.severity === 'CRITICAL') summary.critical++;
    else if (f.severity === 'HIGH') summary.high++;
    else if (f.severity === 'MEDIUM') summary.medium++;
    else if (f.severity === 'LOW') summary.low++;
    else if (f.severity === 'INFO') summary.info++;
  });

  return summary;
};
