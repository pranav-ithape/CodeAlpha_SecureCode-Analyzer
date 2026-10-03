import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const ScanResults: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resScan = await apiFetch(`/api/scans/${scanId}`);
        if (!resScan.ok) {
          throw new Error('Failed to fetch scan details');
        }
        const scanData = await resScan.json();
        setScan(scanData);

        const resFindings = await apiFetch(`/api/scans/${scanId}/findings`);
        if (resFindings.ok) {
          const findingsData = await resFindings.json();
          setFindings(findingsData);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading scan results');
      } finally {
        setLoading(false);
      }
    };
    if (scanId) fetchScanData();
  }, [scanId]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Error</h2>
        <p className="text-on-surface-variant mb-6">{error || 'Scan not found'}</p>
        <Link to="/" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex justify-between items-end border-b border-outline-variant pb-4">
        <div>
          <Link to="/history" className="text-sm text-outline hover:text-primary flex items-center gap-1 mb-2 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to History
          </Link>
          <h1 className="text-headline-lg font-bold text-on-surface flex items-center gap-3">
            Scan Results
            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
              scan.status === 'completed' ? 'bg-green-500/20 text-green-500' :
              scan.status === 'failed' ? 'bg-error/20 text-error' :
              'bg-surface-container-high text-outline'
            }`}>
              {scan.status}
            </span>
          </h1>
          <p className="text-on-surface-variant mt-1">Project: {scan.applicationName || 'Unknown'} • Language: {scan.language}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-outline">Scan ID: {scan._id}</p>
          <p className="text-sm text-outline">Date: {new Date(scan.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-center">
          <p className="text-sm text-outline font-semibold mb-1">Total Issues</p>
          <p className="text-3xl font-bold text-on-surface">{scan.summary.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-error/30 text-center">
          <p className="text-sm text-error font-semibold mb-1">Critical</p>
          <p className="text-3xl font-bold text-error">{scan.summary.critical}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-orange-500/30 text-center">
          <p className="text-sm text-orange-500 font-semibold mb-1">High</p>
          <p className="text-3xl font-bold text-orange-500">{scan.summary.high}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-yellow-500/30 text-center">
          <p className="text-sm text-yellow-500 font-semibold mb-1">Medium</p>
          <p className="text-3xl font-bold text-yellow-500">{scan.summary.medium}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-blue-500/30 text-center">
          <p className="text-sm text-blue-500 font-semibold mb-1">Low</p>
          <p className="text-3xl font-bold text-blue-500">{scan.summary.low}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-on-surface mb-4">Detected Vulnerabilities</h2>
        
        {findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-4">verified_user</span>
            <h3 className="text-headline-sm font-bold text-on-surface">No security vulnerabilities were detected.</h3>
            <p className="text-on-surface-variant max-w-sm mt-2">The analyzed code passed all security checks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding._id} className="p-5 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      finding.severity === 'CRITICAL' ? 'bg-error text-white' :
                      finding.severity === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                      finding.severity === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                      'bg-outline-variant text-on-surface'
                    }`}>
                      {finding.severity}
                    </span>
                    <h3 className="font-bold text-lg text-on-surface">{finding.title}</h3>
                  </div>
                  <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded text-secondary">{finding.category}</span>
                </div>
                
                <p className="text-sm text-on-surface-variant">{finding.description}</p>
                
                {finding.recommendation && (
                  <div className="mt-2 text-sm">
                    <strong className="text-on-surface">Recommendation:</strong>
                    <p className="text-on-surface-variant">{finding.recommendation}</p>
                  </div>
                )}

                <div className="mt-2 text-xs font-mono text-outline-variant p-3 bg-surface-container-highest rounded border border-outline-variant flex items-center justify-between">
                  <span>File: {finding.file}</span>
                  <span>Line: {finding.line}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanResults;
