import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';
import type { Finding } from './Vulnerabilities';

const Recommendations: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await apiFetch('/api/findings');
        if (res.ok) {
          const data = await res.json();
          // Filter to findings that have a recommendation and are not resolved
          const recommended = data.filter((f: Finding) => f.recommendation && f.status !== 'Resolved' && f.status !== 'False Positive');
          setFindings(recommended);
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
    fetchFindings();
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

  const [searchQuery, setSearchQuery] = useState('');

  const filteredFindings = findings.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.recommendation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.cwe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Security Recommendations</h1>
          <p className="text-on-surface-variant">Review remediation guidance for vulnerabilities detected during security scans.</p>
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
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-green-500 mb-4">task_alt</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No recommendations yet</h3>
          <p className="text-on-surface-variant max-w-sm mt-2 mb-6">Run a security scan to generate remediation recommendations.</p>

        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFindings.map((finding) => (
            <div key={finding.id} className="p-5 rounded-xl border border-outline-variant bg-surface-container-low flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/findings/${finding.id}`)}>
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
                  <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded text-secondary">{finding.cwe}</span>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded uppercase ${
                    finding.status === 'Open' ? 'bg-surface-container-high text-on-surface' : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {finding.status}
                  </span>
                </div>
              </div>
              
              <div className="text-sm flex gap-4 text-outline mb-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">folder</span> {finding.project_name}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">description</span> {finding.file_name}:{finding.line_number}</span>
              </div>
              
              <div className="bg-surface-container p-4 rounded-lg border border-outline-variant/50">
                <h4 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-green-500">lightbulb</span> Remediation
                </h4>
                <p className="text-sm text-on-surface-variant mb-3">{finding.recommendation}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/secure-coding-guide?search=${finding.cwe}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">menu_book</span>
                  Learn Secure Coding Practice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
