import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-space-lg animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Security Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Real-time static vulnerability posture and automated policy enforcement.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg bg-surface-container border border-outline-variant hover:border-outline text-label-code-sm font-label-code-sm text-on-surface flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh Data</span>
          </button>
          <Link to="/new-review" className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary text-label-code-sm font-headline-sm font-semibold flex items-center gap-1.5 transition-all">
            <span className="material-symbols-outlined text-sm">add_shield</span>
            <span>Start Review</span>
          </Link>
        </div>
      </div>



      {/* Enterprise Clean Empty State Card */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 md:p-12 text-center flex flex-col items-center justify-center max-w-4xl mx-auto shadow-sm mt-8">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4 text-primary">
          <span className="material-symbols-outlined text-3xl">security_update_good</span>
        </div>
        <h2 className="font-headline-lg text-headline-md md:text-headline-lg font-bold text-on-surface">No Security Reviews Performed Yet</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mt-2 mb-6">
          Run your first static code analysis to detect vulnerabilities, tainted data-flows, hardcoded secrets, and compliance flaws across your codebase.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/new-review" className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-body-md font-semibold flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-base">play_arrow</span>
            <span>Start Security Review</span>
          </Link>
          <Link to="/projects" className="h-10 px-5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-label-code-sm text-label-code-sm flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-base">hub</span>
            <span>Connect Git Repository</span>
          </Link>
        </div>
        
        {/* Features supported pills */}
        <div className="mt-8 pt-6 border-t border-outline-variant w-full flex flex-wrap items-center justify-center gap-6 text-label-code-sm font-label-code-sm text-outline">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">code_blocks</span>
            <span>AST & Data-Flow Taint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">policy</span>
            <span>OWASP Top 10 (2021)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">key</span>
            <span>Zero Hardcoded Secrets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">verified</span>
            <span>PCI-DSS & SOC 2 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
