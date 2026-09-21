import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { Finding, Severity } from '../types/finding.types';

const mapSeverity = (banditSeverity: string): Severity => {
  switch (banditSeverity.toUpperCase()) {
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'LOW':
      return 'LOW';
    default:
      return 'INFO';
  }
};

export const analyzePythonCode = async (sourceCode: string): Promise<Finding[]> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'secops-bandit-'));
  const tempFilePath = path.join(tempDir, 'source.py');
  
  try {
    await fs.writeFile(tempFilePath, sourceCode, 'utf8');

    return await new Promise<Finding[]>((resolve, reject) => {
      // Execute bandit. Using python -m bandit ensures it runs correctly if bandit is in the python path.
      // -f json: Output as JSON
      // -q: Quiet (don't output standard bandit text)
      // We pass the tempFilePath as the target.
      execFile('python', ['-m', 'bandit', '-f', 'json', '-q', tempFilePath], { timeout: 30000 }, (error, stdout, stderr) => {
        // Bandit returns exit code 1 if issues are found, which causes execFile to return an error.
        // If error exists but it's just exit code 1, it's a successful scan with findings.
        if (error && error.code !== 1) {
           return reject(new Error(`Analyzer failed: ${error.message} - ${stderr}`));
        }

        try {
          const banditOutput = JSON.parse(stdout);
          const findings: Finding[] = banditOutput.results.map((res: any): Finding => ({
            id: uuidv4(),
            title: res.test_name || 'Vulnerability',
            severity: mapSeverity(res.issue_severity),
            category: res.test_id || 'Security',
            file: 'source.py',
            line: res.line_number,
            description: res.issue_text,
            impact: `Confidence: ${res.issue_confidence}`,
            recommendation: `Review the code and consult Bandit documentation for ${res.test_id}`,
            status: 'OPEN'
          }));
          resolve(findings);
        } catch (parseError) {
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
