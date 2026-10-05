import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.py', '.js', '.ts', '.java', '.c', '.cpp', '.php'];

const NewReview: React.FC = () => {
  const [step, setStep] = useState(1);
  const [inputType, setInputType] = useState<'paste' | 'upload'>('paste');
  const [code, setCode] = useState('');
  const location = useLocation();

  // App Details
  const [appName, setAppName] = useState('');
  const [projectId, setProjectId] = useState<string>(location.state?.projectId || '');
  const [retestScanId] = useState<string>(location.state?.retestScanId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [language, setLanguage] = useState(''); // Default to empty to enforce selection

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiFetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (location.state?.projectId && data.find((p: any) => p._id === location.state.projectId)) {
            setProjectId(location.state.projectId);
          }
        }
        if (location.state?.applicationName) {
          setAppName(location.state.applicationName);
        }
        if (location.state?.language) {
          setLanguage(location.state.language);
        }
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    };
    fetchProjects();
  }, [location.state]);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [completedScanId, setCompletedScanId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleReset = () => {
    setStep(1);
    setCode('');
    setAppName('');
    setProjectId('');
    setLanguage('python');
    setSelectedFile(null);
    setFileError(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setCompletedScanId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startAnalysis = async () => {
    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCompletedScanId(null);

    try {
      const endpoint = retestScanId ? `/api/scans/${retestScanId}/retest` : '/api/scans';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId || undefined,
          project_name: projects.find(p => p._id === projectId)?.name || 'Unnamed Project',
          applicationName: appName || 'Unnamed Scan',
          language,
          sourceCode: code,
          fileName: selectedFile ? selectedFile.name : `snippet.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'java' ? 'java' : language === 'php' ? 'php' : language === 'cpp' ? 'cpp' : 'c'}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to analyze code');
      }

      // Save scan ID instead of navigating directly
      setCompletedScanId(data.scanId);
      setIsAnalyzing(false);

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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8 ">
      <div className="w-full max-w-3xl bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl shadow-black/40 overflow-hidden relative">
        {/* Subtle top accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        {/* Header & Stepper */}
        <div className="p-8 border-b border-outline-variant/50 bg-surface-container-lowest/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                {retestScanId ? 'Retest Security Scan' : 'New Security Scan'}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                {retestScanId ? 'Submit updated code to verify vulnerabilities have been resolved.' : 'Configure target application parameters and submit source code for SAST.'}
              </p>
            </div>
            <button
              className="h-9 px-4 rounded-lg text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container flex items-center gap-1 transition-all"
              onClick={handleReset}
              disabled={isAnalyzing}
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>

          <div className="flex gap-2 mt-8">
            <div className={`flex-1 flex flex-col pt-3 border-t-2 transition-colors duration-500 ${step >= 1 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">STEP 01</span>
              <span className={`text-sm font-semibold truncate ${step >= 1 ? 'text-on-surface' : 'text-outline'}`}>Details</span>
            </div>
            <div className={`flex-1 flex flex-col pt-3 border-t-2 transition-colors duration-500 ${step >= 2 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">STEP 02</span>
              <span className={`text-sm font-semibold truncate ${step >= 2 ? 'text-on-surface' : 'text-outline'}`}>Code</span>
            </div>
            <div className={`flex-1 flex flex-col pt-3 border-t-2 transition-colors duration-500 ${step >= 3 ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1">STEP 03</span>
              <span className={`text-sm font-semibold truncate ${step >= 3 ? 'text-on-surface' : 'text-outline'}`}>Analysis</span>
            </div>
          </div>
        </div>

        <div className="p-8">

      {/* Step 1 */}
      {step === 1 && (
        <div className="max-w-2xl bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-5">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">1</span>
            <span>Application Metadata & Environment</span>
          </h2>

          <div className="space-y-1.5">
            <label className="block text-label-code-sm font-label-code-sm text-on-surface">
              Name of Scan <span className="text-error">*</span>
            </label>
            <input
              className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm placeholder:text-outline focus:border-primary focus:ring-1 outline-none transition-colors"
              placeholder="e.g. auth-service-api"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 mt-4">
            <label className="block text-label-code-sm font-label-code-sm text-on-surface">
              Project <span className="text-error">*</span>
            </label>
            {projects.length === 0 ? (
              <div className="p-3 bg-surface-container-high border border-outline-variant rounded text-sm text-on-surface-variant flex justify-between items-center">
                <span>No projects available. Create a project first.</span>
                <button 
                  onClick={() => navigate('/projects')}
                  className="text-primary hover:underline font-semibold"
                >
                  Go to Projects
                </button>
              </div>
            ) : (
              <select
                className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-label-code-sm font-label-code-sm focus:border-primary outline-none transition-colors"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="" disabled>Select Project ▼</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            )}
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
              className={`h-10 px-6 rounded-lg font-headline-sm text-label-code-sm font-semibold flex items-center gap-2 transition-all ${(appName.trim().length > 0 && projectId !== '' && language !== '') ? 'bg-primary hover:bg-primary-fixed-dim text-on-primary' : 'bg-surface-container-high text-outline cursor-not-allowed'}`}
              onClick={handleNext}
              disabled={appName.trim().length === 0 || projectId === '' || language === ''}
            >
              <span>Continue to Code Input</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
            </div>
          )}

          {/* Step 2: Code Input */}
          {step === 2 && (
            <div className="space-y-6 ">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-on-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shadow-inner shadow-primary/30">2</div>
                  Source Code Input
                </h2>
                <button className="text-sm font-semibold text-outline hover:text-on-surface flex items-center gap-1 transition-colors" onClick={handleBack}>
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
              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest flex flex-col overflow-hidden">
                <div className="flex flex-1 min-h-[280px] overflow-hidden">
                  <div className="w-12 bg-surface-container-low border-r border-outline-variant text-outline font-label-code-sm py-2 flex flex-col items-center leading-[22px] font-mono text-right pr-2 select-none">
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
                  className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 text-center group ${fileError ? 'border-error bg-error/5' : 'border-outline-variant hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 bg-surface-container/30'}`}
                  onClick={triggerFileInput}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${fileError ? 'bg-error/20 text-error' : 'bg-surface-container-high text-primary shadow-inner shadow-primary/20'}`}>
                    <span className="material-symbols-outlined text-3xl">{fileError ? 'error' : 'cloud_upload'}</span>
                  </div>
                  <p className="text-lg font-semibold text-on-surface mb-2">
                    Click to select source code file
                  </p>
                  <p className="text-sm text-outline">
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
            <div className="space-y-8 py-8">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {isAnalyzing ? (
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    ) : analysisError ? (
                      <div className="absolute inset-0 rounded-full border-4 border-error/20 border-t-error"></div>
                    ) : (
                      <div className="absolute inset-0 rounded-full border-4 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"></div>
                    )}
                    <span className={`material-symbols-outlined text-2xl ${analysisError ? 'text-error' : 'text-primary'}`}>
                      {analysisError ? 'error' : 'radar'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">
                      {isAnalyzing ? 'Running Security Analysis' : analysisError ? 'Security scan failed' : 'Analysis Completed'}
                    </h3>
                    <p className={`text-sm mt-1 ${analysisError ? 'text-error' : 'text-outline'}`}>
                      {isAnalyzing ? 'Processing codebase...' : analysisError ? 'Error encountered during execution' : 'Findings have been recorded'}
                    </p>
                  </div>
                </div>
                {!isAnalyzing && analysisError && (
                  <button className="px-4 py-2 rounded-lg font-semibold bg-error/10 text-error hover:bg-error/20 transition-colors" onClick={startAnalysis}>Retry</button>
                )}
                {!isAnalyzing && !analysisError && completedScanId && (
                  <button className="px-4 py-2 rounded-lg font-semibold border border-outline-variant text-outline hover:text-primary hover:border-primary/50 transition-colors" onClick={handleReset}>Start Over</button>
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

              {!isAnalyzing && !analysisError && completedScanId && (
                <div className="py-12 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-transparent rounded-2xl border border-primary/20 text-center space-y-5 ">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-4xl text-primary">task_alt</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-on-surface mb-2">Scan Completed Successfully</h4>
                    <p className="text-on-surface-variant">Your code has been analyzed and findings have been securely stored.</p>
                  </div>
                  <button 
                    className="h-12 px-8 bg-primary text-on-primary rounded-xl font-bold text-lg hover:scale-105 hover:bg-primary-fixed-dim transition-all flex items-center gap-2 mt-4 shadow-xl shadow-primary/30"
                    onClick={() => navigate(`/scans/${completedScanId}`)}
                  >
                    <span>View Scan Results</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewReview;
