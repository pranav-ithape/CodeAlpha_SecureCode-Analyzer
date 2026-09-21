import React from 'react';

const Vulnerabilities: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Vulnerabilities</h1>
          <p className="text-on-surface-variant">Triage and review identified security flaws.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
        <span className="material-symbols-outlined text-4xl text-[#10b981] mb-4">gpp_good</span>
        <h3 className="text-headline-sm font-bold text-on-surface">Clean Baseline</h3>
        <p className="text-on-surface-variant mt-2">No open vulnerabilities detected across your projects.</p>
      </div>
    </div>
  );
};

export default Vulnerabilities;
