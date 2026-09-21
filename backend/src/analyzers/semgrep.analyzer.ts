import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { Finding, Severity } from '../types/finding.types';

const mapSeverity = (semgrepSeverity: string): Severity => {
  switch (semgrepSeverity.toUpperCase()) {
    case 'ERROR':
    case 'CRITICAL':
    case 'HIGH':
      return 'HIGH';
    case 'WARNING':
    case 'MEDIUM':
      return 'MEDIUM';
    case 'INFO':
    case 'LOW':
      return 'LOW';
    default:
      return 'INFO';
  }
};

const getSemgrepPath = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile('python', ['-c', "import sys, os; print(os.path.join(os.path.dirname(sys.executable), 'Scripts', 'semgrep.exe'))"], (err, stdout) => {
      if (err) return reject(new Error('Failed to locate semgrep path.'));
      resolve(stdout.trim());
    });
  });
};

type SemgrepSupportedLanguage = 'javascript' | 'typescript' | 'java' | 'c' | 'cpp' | 'php';

const getLanguageConfig = (language: SemgrepSupportedLanguage): { extension: string, ruleFile: string } => {
  switch (language) {
    case 'javascript': return { extension: '.js', ruleFile: 'javascript-security.yml' };
    case 'typescript': return { extension: '.ts', ruleFile: 'typescript-security.yml' };
    case 'java': return { extension: '.java', ruleFile: 'java-security.yml' };
    case 'c': return { extension: '.c', ruleFile: 'c-security.yml' };
    case 'cpp': return { extension: '.cpp', ruleFile: 'cpp-security.yml' };
    case 'php': return { extension: '.php', ruleFile: 'php-security.yml' };
    default: return { extension: '.js', ruleFile: 'javascript-security.yml' };
  }
};

export const analyzeSemgrepCode = async (sourceCode: string, language: SemgrepSupportedLanguage): Promise<Finding[]> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'secops-semgrep-'));
  const { extension, ruleFile } = getLanguageConfig(language);
  const tempFilePath = path.join(tempDir, `source${extension}`);
  
  try {
    await fs.writeFile(tempFilePath, sourceCode, 'utf8');
    const semgrepPath = await getSemgrepPath();

    return await new Promise<Finding[]>((resolve, reject) => {
      const rulesPath = path.resolve(__dirname, '../../rules/semgrep', ruleFile);

      // Execute python -m semgrep
      // --json: Output as JSON
      // -q: Quiet
      // --config: specify rules
      execFile(semgrepPath, ['--json', '-q', '--config', rulesPath, tempFilePath], { timeout: 30000 }, (error, stdout, stderr) => {
        // Semgrep returns exit code 1 if issues are found, which causes execFile to return an error.
        if (error && error.killed) {
           return reject(new Error('Static analysis timed out.'));
        }

        let jsonOutput = stdout;
        if (jsonOutput.includes('{')) {
           jsonOutput = jsonOutput.substring(jsonOutput.indexOf('{'));
        }

        try {
          if (jsonOutput.trim() === '') { return resolve([]); }
          const semgrepOutput = JSON.parse(jsonOutput);
          const findings: Finding[] = (semgrepOutput.results || []).map((res: any): Finding => ({
            id: uuidv4(),
            title: res.check_id.split('.').pop() || 'Vulnerability',
            severity: mapSeverity(res.extra?.severity || 'INFO'),
            category: res.extra?.metadata?.category || 'Security',
            file: `source${extension}`,
            line: res.start?.line || 1,
            description: res.extra?.message || 'A security vulnerability was found.',
            impact: res.extra?.metadata?.impact ? `Impact: ${res.extra.metadata.impact}` : 'Confidence: HIGH',
            recommendation: res.extra?.metadata?.recommendation || 'Review the code based on Semgrep findings.',
            status: 'OPEN'
          }));
          resolve(findings);
        } catch (parseError) {
          console.error('Raw stdout was:', stdout);
          reject(new Error('Failed to parse analyzer output.'));
        }
      });
    });

  } finally {
    // Cleanup
    try {
      await fs.unlink(tempFilePath);
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
  }
};
