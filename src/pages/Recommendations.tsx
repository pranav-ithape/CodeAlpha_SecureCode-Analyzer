import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

interface PopulatedAIAnalysis {
  _id: string;
  findingId: {
    _id: string;
    title: string;
    severity: string;
    cwe: string;
    status: string;
    project_name?: string;
    file?: string;
    line?: number;
  };
  summary: string;
  recommendation: string;
}

const Recommendations: React.FC = () => {
  const [analyses, setAnalyses] = useState<PopulatedAIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAIAnalyses = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await apiFetch('/api/ai/analysis');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Filter out any where findingId is null (e.g. if a finding was deleted)
            setAnalyses(data.data.filter((a: any) => a.findingId != null && a.findingId.status !== 'Resolved' && a.findingId.status !== 'False Positive'));
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAIAnalyses();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Unable to load recommendations.</h2>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors mt-4">Retry</button>
      </div>
    );
  }


  const filteredAnalyses = analyses.filter(a => {
    const f = a.findingId;
    const project = f.project_name || '';
    return (
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.recommendation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.cwe && f.cwe.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">AI Security Recommendations</h1>
          <p className="text-on-surface-variant">Review AI-generated remediation guidance for detected vulnerabilities.</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            className="w-full h-10 pl-10 pr-4 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors shadow-sm"
            placeholder="Search by title, project, CWE, or recommendation..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-surface-container-high animate-pulse"></div>)}
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-4">smart_toy</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No AI recommendations yet</h3>
          <p className="text-on-surface-variant max-w-sm mt-2 mb-6">Open a finding and click "Generate AI Recommendation" to get AI-powered remediation guidance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnalyses.map((analysis) => {
            const finding = analysis.findingId;
            return (
              <div key={analysis._id} className="p-5 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/findings/${finding._id}`)}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      finding.severity.toUpperCase() === 'CRITICAL' ? 'bg-error text-white' : 
                      finding.severity.toUpperCase() === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                      finding.severity.toUpperCase() === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {finding.severity}
                    </span>
                    <h3 className="font-bold text-on-surface text-lg">{finding.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded text-secondary">{finding.cwe || 'N/A'}</span>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded uppercase ${
                      finding.status === 'Open' ? 'bg-surface-container-high text-on-surface' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {finding.status}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm flex gap-4 text-outline mb-2">
                  {finding.project_name && (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">folder</span> {finding.project_name}</span>
                  )}
                  {finding.file && (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">description</span> {finding.file}:{finding.line}</span>
                  )}
                </div>
                
                <div className="bg-surface-container p-4 rounded-lg border border-primary/30">
                  <h4 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">psychology</span> AI Remediation
                  </h4>
                  <p className="text-sm text-on-surface-variant mb-3">{analysis.recommendation}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (finding.cwe) navigate(`/secure-coding-guide?search=${finding.cwe}`);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-[14px]">menu_book</span>
                    Learn Secure Coding Practice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
