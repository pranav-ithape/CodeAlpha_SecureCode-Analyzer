import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

const Recommendations: React.FC = () => {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const resScans = await apiFetch('/api/scans');
        if (resScans.ok) {
          const scans = await resScans.json();
          let allFindings: any[] = [];
          
          for (const scan of scans.slice(0, 5)) {
            const resFind = await apiFetch(`/api/scans/${scan._id}/findings`);
            if (resFind.ok) {
              const f = await resFind.json();
              allFindings = [...allFindings, ...f];
            }
          }
          // Filter to only findings that have recommendations
          setFindings(allFindings.filter(f => f.recommendation));
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
          <h1 className="text-headline-lg font-bold text-on-surface">AI Recommendations</h1>
          <p className="text-on-surface-variant">Automated remediation patches for detected vulnerabilities.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
        </div>
      ) : findings.length > 0 ? (
        <div className="space-y-6">
          {findings.map((finding) => (
            <div key={finding._id} className="p-6 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-on-surface text-lg">{finding.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{finding.description}</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              </div>
              
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant">
                <h4 className="text-sm font-bold text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">build</span> Remediation Action
                </h4>
                <p className="text-sm text-on-surface">{finding.recommendation}</p>
                
                <div className="mt-4 p-3 bg-[#1e1e1e] rounded-md text-xs font-mono text-[#d4d4d4] overflow-x-auto">
                  <div className="text-[#858585] mb-2">// Target file: {finding.file}:{finding.line}</div>
                  <div>// Apply the recommended patch to resolve {finding.category}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">auto_awesome</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Recommendations Available</h3>
          <p className="text-on-surface-variant mt-2">Run a scan that detects vulnerabilities to receive automated fix suggestions.</p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
