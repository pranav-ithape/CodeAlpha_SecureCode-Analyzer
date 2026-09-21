export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  file: string;
  line: number;
  description: string;
  impact: string;
  recommendation: string;
  status: 'OPEN';
}

export interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanResponse {
  scanId: string;
  status: 'completed' | 'failed';
  applicationName: string;
  language: string;
  summary: ScanSummary;
  findings: Finding[];
  error?: string;
}
