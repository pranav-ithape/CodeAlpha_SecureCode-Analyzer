import { analyzePythonCode } from '../analyzers/python.analyzer';
import { analyzeSemgrepCode } from '../analyzers/semgrep.analyzer';
import { analyzeCustomCode } from '../analyzers/custom.analyzer';
import { Finding, ScanSummary } from '../types/finding.types';

export const analyzeSource = async (language: string, sourceCode: string): Promise<Finding[]> => {
  const lang = language.toLowerCase();
  let baseFindings: Finding[] = [];
  
  if (lang === 'python') {
    baseFindings = await analyzePythonCode(sourceCode);
  } else if (semgrepLanguages.includes(lang)) {
    baseFindings = await analyzeSemgrepCode(sourceCode, lang as any);
  } else {
    throw new Error(`Analyzer for language '${language}' is not implemented.`);
  }

  // 2. Run Custom Regex Analyzer for our dynamic Security Rules
  const customFindings = await analyzeCustomCode(sourceCode, language);

  // Merge findings (in real life you'd deduplicate, but this works for demo)
  return [...baseFindings, ...customFindings];
  
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
