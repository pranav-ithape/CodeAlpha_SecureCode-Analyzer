import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Security Reports</h1>
          <p className="text-on-surface-variant">Compliance and executive summaries (SARIF, PDF, CSV).</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center p-12 border border-outline-variant rounded-xl bg-surface-container-low text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-4">description</span>
        <h3 className="text-headline-sm font-bold text-on-surface">No Reports Generated</h3>
        <p className="text-on-surface-variant mt-2">Export your first report from the Dashboard or Scan History.</p>
      </div>
    </div>
  );
};

export default Reports;
