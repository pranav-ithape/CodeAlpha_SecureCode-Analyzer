import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

const Vulnerabilities: React.FC = () => {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const resScans = await apiFetch('/api/scans');
        if (resScans.ok) {
          const scans = await resScans.json();
          let allFindings: any[] = [];
          
          for (const scan of scans.slice(0, 5)) { // fetch findings for recent scans
            const resFind = await apiFetch(`/api/scans/${scan._id}/findings`);
            if (resFind.ok) {
              const f = await resFind.json();
              allFindings = [...allFindings, ...f];
            }
          }
          setFindings(allFindings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Vulnerabilities</h1>
          <p className="text-on-surface-variant">Detailed view of all detected security issues.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
        </div>
      ) : findings.length > 0 ? (
        <div className="space-y-4">
          {findings.map((finding) => (
            <div key={finding._id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    finding.severity === 'CRITICAL' ? 'bg-error text-white' :
                    finding.severity === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                    finding.severity === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                    'bg-outline-variant text-on-surface'
                  }`}>
                    {finding.severity}
                  </span>
                  <h3 className="font-bold text-on-surface">{finding.title}</h3>
                </div>
                <span className="text-xs text-outline">{finding.category}</span>
              </div>
              <p className="text-sm text-on-surface-variant">{finding.description}</p>
              <div className="text-xs font-mono text-outline-variant p-2 bg-surface-container-highest rounded border border-outline-variant mt-2">
                {finding.file}:{finding.line}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">verified</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Vulnerabilities Found</h3>
          <p className="text-on-surface-variant max-w-sm mt-2">Your codebase is clean according to the recent scans.</p>
        </div>
      )}
    </div>
  );
};

export default Vulnerabilities;
