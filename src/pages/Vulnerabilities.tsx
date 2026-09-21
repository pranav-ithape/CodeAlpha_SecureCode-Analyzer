import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Vulnerabilities: React.FC = () => {
  const location = useLocation();
  const scanResult = location.state?.scanResult;

  if (!scanResult) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center border-b border-outline-variant pb-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">Vulnerabilities</h1>
            <p className="text-on-surface-variant">Triage and review identified security flaws.</p>
          </div>
          <Link to="/new-review" className="h-8 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            New Scan
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-[#10b981] mb-4">gpp_good</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Scans Found</h3>
          <p className="text-on-surface-variant mt-2">Run a security review to see vulnerabilities here.</p>
        </div>
      </div>
    );
  }

  const { applicationName, language, summary, findings, scanId } = scanResult;
  
  const hasFindings = findings && findings.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Scan Results</h1>
          <p className="text-on-surface-variant text-sm">
            Application: <strong className="text-on-surface">{applicationName}</strong> • Language: <strong className="text-on-surface capitalize">{language}</strong> • ID: <span className="font-mono text-xs text-outline">{scanId}</span>
          </p>
        </div>
        <Link to="/new-review" className="h-8 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-1.5 hover:bg-primary-fixed-dim transition-colors">
          <span className="material-symbols-outlined text-sm">add</span>
          New Scan
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
         <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-on-surface">{summary.total}</span>
           <span className="text-xs font-semibold text-outline uppercase tracking-wider mt-1">Total</span>
         </div>
         <div className="bg-error-container/10 border border-error/30 rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-error">{summary.critical}</span>
           <span className="text-xs font-semibold text-error uppercase tracking-wider mt-1">Critical</span>
         </div>
         <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-[#f97316]">{summary.high}</span>
           <span className="text-xs font-semibold text-[#f97316] uppercase tracking-wider mt-1">High</span>
         </div>
         <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-[#eab308]">{summary.medium}</span>
           <span className="text-xs font-semibold text-[#eab308] uppercase tracking-wider mt-1">Medium</span>
         </div>
         <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-[#3b82f6]">{summary.low}</span>
           <span className="text-xs font-semibold text-[#3b82f6] uppercase tracking-wider mt-1">Low</span>
         </div>
         <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center">
           <span className="text-3xl font-bold text-on-surface-variant">{summary.info}</span>
           <span className="text-xs font-semibold text-outline uppercase tracking-wider mt-1">Info</span>
         </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h2 className="text-headline-sm font-bold text-on-surface">Detailed Findings</h2>
        
        {!hasFindings ? (
          <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
            <span className="material-symbols-outlined text-4xl text-[#10b981] mb-4">verified_user</span>
            <h3 className="text-headline-sm font-bold text-on-surface">Zero Vulnerabilities Detected</h3>
            <p className="text-on-surface-variant mt-2">Bandit SAST engine did not find any matching rules in the provided source code.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {findings.map((finding: any) => (
              <div key={finding.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        {finding.severity === 'CRITICAL' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-on-error">CRITICAL</span>}
                        {finding.severity === 'HIGH' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f97316] text-white">HIGH</span>}
                        {finding.severity === 'MEDIUM' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eab308] text-black">MEDIUM</span>}
                        {finding.severity === 'LOW' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b82f6] text-white">LOW</span>}
                        {finding.severity === 'INFO' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface">INFO</span>}
                        <span className="text-xs font-mono text-outline">{finding.category}</span>
                     </div>
                     <h3 className="text-body-lg font-bold text-on-surface">{finding.title}</h3>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant">
                       {finding.file}:{finding.line}
                     </span>
                   </div>
                </div>
                
                <p className="text-sm text-on-surface-variant mt-2">{finding.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-outline-variant/50">
                   <div>
                     <span className="text-[10px] font-bold text-outline uppercase">Impact</span>
                     <p className="text-xs text-on-surface">{finding.impact}</p>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-outline uppercase">Recommendation</span>
                     <p className="text-xs text-on-surface">{finding.recommendation}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vulnerabilities;
