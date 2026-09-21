import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.py', '.js', '.ts', '.java', '.c', '.cpp', '.php'];

const NewReview: React.FC = () => {
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState<'paste' | 'upload'>('paste');
  const [code, setCode] = useState('');

  // App Details
  const [appName, setAppName] = useState('');
  const [language, setLanguage] = useState(''); // Default to empty to enforce selection

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleReset = () => {
    setStep(1);
    setCode('');
    setAppName('');
    setLanguage('python');
    setSelectedFile(null);
    setFileError(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startAnalysis = async () => {
    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationName: appName || 'Unnamed Application',
          language,
          sourceCode: code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze code');
      }

      // Navigate to vulnerabilities with data
      navigate('/vulnerabilities', { state: { scanResult: data } });

    } catch (err: any) {
      setAnalysisError(err.message || 'An unexpected error occurred during analysis.');
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File exceeds the maximum size of 10 MB.');
      return;
    }

    // Validate extension
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setFileError(`Invalid file type. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    setSelectedFile(file);

    // Read file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content);
    };
    reader.onerror = () => {
      setFileError('Failed to read file contents.');
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setCode('');
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            className="h-8 px-3 rounded text-label-code-sm font-label-code-sm text-outline hover:text-on-surface hover:bg-surface-container flex items-center gap-1 self-start transition-colors"
            onClick={handleReset}
            disabled={isAnalyzing}
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset Form</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6">
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
            <span className="text-xs font-semibold truncate">Analysis</span>
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
            <input
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm placeholder:text-outline focus:border-primary focus:ring-1 outline-none transition-colors"
              placeholder="e.g. auth-service-api"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-label-code-sm font-label-code-sm text-on-surface">Application Type</label>
              <select className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm focus:border-primary outline-none transition-colors">
                <option value="microservice">Microservice</option>
                <option value="web">Web App</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-label-code-sm font-label-code-sm text-on-surface">Target Language</label>
              <select
                className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm focus:border-primary outline-none transition-colors"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="" disabled>Select Language</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="php">PHP</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              className={`h-10 px-6 rounded-lg font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all ${(appName.trim().length > 0 && language !== '') ? 'bg-primary hover:bg-primary-fixed-dim text-on-primary' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
              onClick={handleNext}
              disabled={appName.trim().length === 0 || language === ''}
            >
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
            <button className="text-label-code-sm text-outline hover:text-on-surface flex items-center gap-1 transition-colors" onClick={handleBack}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back</span>
            </button>
          </div>

          <div className="flex border-b border-outline-variant gap-2">
            <button
              className={`px-4 py-2 border-b-2 font-label-code-sm text-label-code-sm font-semibold flex items-center gap-2 transition-colors ${inputType === 'paste' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
              onClick={() => {
                setInputType('paste');
                clearFile();
              }}
            >
              <span className="material-symbols-outlined text-sm">code</span>
              <span>Paste Code</span>
            </button>
            <button
              className={`px-4 py-2 border-b-2 font-label-code-sm text-label-code-sm font-semibold flex items-center gap-2 transition-colors ${inputType === 'upload' ? 'border-primary text-primary' : 'border-transparent text-outline hover:text-on-surface'}`}
              onClick={() => {
                setInputType('upload');
                setCode('');
              }}
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              <span>Upload File</span>
            </button>
          </div>

          {inputType === 'paste' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-outline-variant bg-[#080C13] flex flex-col overflow-hidden">
                <div className="flex flex-1 min-h-[280px] overflow-hidden">
                  <div className="w-12 bg-[#0B0F17] border-r border-outline-variant text-outline font-label-code-sm py-2 flex flex-col items-center leading-[22px] font-mono text-right pr-2 select-none">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i}>{i + 1}</span>)}
                  </div>
                  <textarea
                    className="flex-1 bg-transparent p-2 text-on-surface font-label-code-sm leading-[22px] font-mono outline-none resize-none border-none focus:ring-0 whitespace-pre overflow-y-auto custom-scrollbar"
                    placeholder="// Paste your production code snippet here..."
                    spellCheck="false"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  className={`h-10 px-6 rounded-lg font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all ${code.trim().length > 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
                  disabled={code.trim().length === 0}
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept={ALLOWED_EXTENSIONS.join(',')}
              />

              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center ${fileError ? 'border-error bg-error-container/10' : 'border-outline-variant hover:border-primary bg-surface-container/50'}`}
                  onClick={triggerFileInput}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${fileError ? 'bg-error-container text-error' : 'bg-surface-container-high text-primary'}`}>
                    <span className="material-symbols-outlined text-2xl">{fileError ? 'error' : 'cloud_upload'}</span>
                  </div>
                  <p className="font-headline-sm text-label-code-sm font-semibold text-on-surface mb-1">
                    Click to select source code file
                  </p>
                  <p className="text-xs text-outline font-label-code-sm">
                    Supported: {ALLOWED_EXTENSIONS.join(', ')} (Max 10MB)
                  </p>
                  {fileError && (
                    <p className="mt-4 text-xs font-semibold text-error bg-error-container/30 px-3 py-1 rounded">
                      {fileError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center bg-surface-container-low text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">description</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-body-md font-semibold text-on-surface truncate max-w-xs md:max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-outline font-label-code-sm mt-1">
                      {formatFileSize(selectedFile.size)} • Ready for analysis
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="h-8 px-3 rounded border border-outline-variant text-label-code-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      onClick={triggerFileInput}
                    >
                      Replace File
                    </button>
                    <button
                      className="h-8 px-3 rounded border border-error text-error hover:bg-error-container/20 text-label-code-sm font-semibold transition-colors"
                      onClick={clearFile}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  className={`h-10 px-6 rounded-lg font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all ${selectedFile && code.length > 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
                  disabled={!selectedFile || code.length === 0}
                  onClick={startAnalysis}
                >
                  <span className="material-symbols-outlined text-sm">search_check</span>
                  <span>Analyze Uploaded File</span>
                </button>
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
                {isAnalyzing ? (
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                ) : analysisError ? (
                  <div className="absolute inset-0 rounded-full border-2 border-error"></div>
                ) : (
                  <div className="absolute inset-0 rounded-full border-2 border-primary"></div>
                )}
                <span className={`material-symbols-outlined text-base ${analysisError ? 'text-error' : 'text-primary'}`}>
                  {analysisError ? 'error' : 'radar'}
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isAnalyzing ? 'Executing SAST Engine' : analysisError ? 'Analysis Failed' : 'Analysis Complete'}
                </h3>
                <p className={`text-xs font-label-code-sm ${analysisError ? 'text-error' : 'text-outline'}`}>
                  {isAnalyzing ? 'Analyzing source code against Bandit rules...' : analysisError ? 'Error encountered during execution' : 'Processing finished'}
                </p>
              </div>
            </div>
            {!isAnalyzing && (
              <button className="px-3 py-1.5 rounded border border-outline-variant text-label-code-sm text-outline hover:text-error transition-colors" onClick={handleReset}>Start Over</button>
            )}
          </div>

          {analysisError && (
            <div className="p-4 bg-error-container/20 rounded-lg border border-error text-left space-y-2">
              <p className="font-body-md text-error font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">warning</span>
                Failed to Analyze
              </p>
              <p className="text-sm text-on-surface-variant font-mono text-xs whitespace-pre-wrap">
                {analysisError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewReview;
