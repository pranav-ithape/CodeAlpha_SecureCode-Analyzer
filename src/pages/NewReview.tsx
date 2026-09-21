import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewReview: React.FC = () => {
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState<'paste' | 'upload'>('paste');
  const [progress, setProgress] = useState(0);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  const handleReset = () => {
    setStep(1);
    setCode('');
  };

  const startAnalysis = () => {
    setStep(3);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep(4), 500); // Move to findings mock
      }
    }, 1000);
  };

  return (
    <div className="space-y-space-lg animate-in fade-in duration-300">
      {/* Header & Stepper */}
      <div className="border-b border-outline-variant pb-space-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">New Security Review</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Configure target application parameters and submit source code to the SAST engine.</p>
          </div>
          <button 
            className="h-8 px-3 rounded text-label-code-sm font-label-code-sm text-outline hover:text-on-surface hover:bg-surface-container flex items-center gap-1 self-start" 
            onClick={handleReset}
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset Form</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-6">
          <div className={`pt-2 flex flex-col border-t-2 ${step >= 1 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
            <span className="text-[11px] font-label-code-sm font-bold">STEP 01</span>
            <span className="text-xs font-semibold truncate text-on-surface">Application Details</span>
          </div>
          <div className={`pt-2 flex flex-col border-t-2 ${step >= 2 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
            <span className="text-[11px] font-label-code-sm font-bold">STEP 02</span>
            <span className="text-xs font-semibold truncate">Code Input</span>
          </div>
          <div className={`pt-2 flex flex-col border-t-2 ${step >= 3 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
            <span className="text-[11px] font-label-code-sm font-bold">STEP 03</span>
            <span className="text-xs font-semibold truncate">Analysis Pipeline</span>
          </div>
          <div className={`pt-2 flex flex-col border-t-2 ${step >= 4 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
            <span className="text-[11px] font-label-code-sm font-bold">STEP 04</span>
            <span className="text-xs font-semibold truncate">Scan Findings</span>
          </div>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="max-w-2xl bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-5">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">1</span>
            <span>Application Metadata & Environment</span>
          </h2>
          
          <div className="space-y-1.5">
            <label className="block text-label-code-sm font-label-code-sm text-on-surface">
              Application Name <span className="text-error">*</span>
            </label>
            <input className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm placeholder:text-outline focus:border-primary focus:ring-1 outline-none transition-colors" placeholder="e.g. auth-service-api" defaultValue="auth-service-api" type="text" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-label-code-sm font-label-code-sm text-on-surface">Application Type</label>
              <select className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm focus:border-primary outline-none">
                <option value="microservice">Microservice</option>
                <option value="web">Web App</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-label-code-sm font-label-code-sm text-on-surface">Target Language</label>
              <select className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm focus:border-primary outline-none">
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="go">Go</option>
                <option value="python">Python</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all" onClick={handleNext}>
              <span>Continue to Code Input</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="max-w-4xl bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">2</span>
              <span>Provide Code Source</span>
            </h2>
            <button className="text-label-code-sm text-outline hover:text-on-surface flex items-center gap-1" onClick={handleBack}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back</span>
            </button>
          </div>

          <div className="flex border-b border-outline-variant gap-2">
            <button 
              className={`px-4 py-2 border-b-2 font-label-code-sm text-label-code-sm font-semibold flex items-center gap-2 ${inputType === 'paste' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
              onClick={() => setInputType('paste')}
            >
              <span className="material-symbols-outlined text-sm">code</span>
              <span>Paste Code</span>
            </button>
            <button 
              className={`px-4 py-2 border-b-2 font-label-code-sm text-label-code-sm font-semibold flex items-center gap-2 ${inputType === 'upload' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
              onClick={() => setInputType('upload')}
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              <span>Upload File</span>
            </button>
          </div>

          {inputType === 'paste' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-outline-variant bg-[#080C13] flex flex-col overflow-hidden">
                <div className="flex flex-1 min-h-[280px] overflow-hidden">
                  <div className="w-12 bg-[#0B0F17] border-r border-outline-variant text-outline font-label-code-sm py-2 flex flex-col items-center leading-[22px] font-mono text-right pr-2">
                    {Array.from({length: 10}).map((_, i) => <span key={i}>{i+1}</span>)}
                  </div>
                  <textarea 
                    className="flex-1 bg-transparent p-2 text-on-surface font-label-code-sm leading-[22px] font-mono outline-none resize-none border-none focus:ring-0 whitespace-pre overflow-y-auto"
                    placeholder="// Paste your production code snippet here..."
                    spellCheck="false"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button 
                  className={`h-10 px-6 rounded-lg font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all ${code.length > 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
                  disabled={code.length === 0}
                  onClick={startAnalysis}
                >
                  <span className="material-symbols-outlined text-sm">search_check</span>
                  <span>Analyze Code</span>
                </button>
              </div>
            </div>
          )}

          {inputType === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-surface-container/50 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-3">
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <p className="font-headline-sm text-label-code-sm font-semibold text-on-surface">Drag & drop source code file</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Analysis Pipeline */}
      {step === 3 && (
        <div className="max-w-3xl bg-surface-container-low border border-outline-variant rounded-xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <span className="material-symbols-outlined text-primary text-base">radar</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">SAST Rule Engine Executing</h3>
                <p className="text-xs text-outline font-label-code-sm">Pipeline Job #SC-8921</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded border border-outline-variant text-label-code-sm text-outline hover:text-error" onClick={handleReset}>Cancel</button>
          </div>
          <div className="w-full h-2 rounded bg-surface-container-highest overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Step 4: Findings */}
      {step === 4 && (
        <div className="text-center p-8 border border-outline-variant rounded-xl bg-surface-container-low">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Scan Complete</h2>
          <p className="text-on-surface-variant mb-4">No critical vulnerabilities found in the provided snippet.</p>
          <button className="h-10 px-5 rounded-lg bg-primary text-on-primary font-semibold" onClick={() => navigate('/vulnerabilities')}>View Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default NewReview;
