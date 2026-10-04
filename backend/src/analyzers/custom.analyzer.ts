import { Finding, Severity } from '../types/finding.types';
import Rule from '../models/Rule';
import { v4 as uuidv4 } from 'uuid';

export const analyzeCustomCode = async (sourceCode: string, language: string, fileName?: string): Promise<Finding[]> => {
  const activeRules = await Rule.find({ status: 'Active' });
  const findings: Finding[] = [];
  
  const lines = sourceCode.split('\n');

  for (const rule of activeRules) {
    if (!rule.regex) continue;
    
    // Check language match (case insensitive)
    const matchesLanguage = rule.supportedLanguages.some(l => l.toLowerCase() === language.toLowerCase()) || rule.supportedLanguages.includes('All');
    if (!matchesLanguage && rule.supportedLanguages.length > 0) continue;

    try {
      const regex = new RegExp(rule.regex, 'i');
      
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          findings.push({
            id: uuidv4(),
            ruleId: rule.ruleId,
            title: rule.name,
            severity: rule.severity.toUpperCase() as Severity,
            category: rule.category,
            file: fileName || `source.${language.toLowerCase()}`,
            line: index + 1,
            description: rule.description,
            impact: `Confidence: ${rule.confidence}`,
            recommendation: rule.remediation,
            status: 'OPEN',
            cwe: rule.cwe,
            owasp: rule.owasp,
            snippet: line.trim()
          });
        }
      });
    } catch (err) {
      console.error(`Invalid regex for rule ${rule.ruleId}:`, rule.regex);
    }
  }

  return findings;
};
