import React from 'react';

const Recommendations: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">AI Recommendations</h1>
          <p className="text-on-surface-variant">Automated remediation patches for detected vulnerabilities.</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-4">auto_awesome</span>
        <h3 className="text-headline-sm font-bold text-on-surface">No Recommendations Available</h3>
        <p className="text-on-surface-variant mt-2">Run a scan that detects vulnerabilities to receive automated fix suggestions.</p>
      </div>
    </div>
  );
};

export default Recommendations;
