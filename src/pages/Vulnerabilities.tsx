import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

export interface Finding {
  id: string;
  scan_id: string;
  project_id: string;
  project_name: string;
  title: string;
  description: string;
  severity: string;
  cwe: string;
  owasp_category: string;
  scanner: string;
  rule_id: string;
  file_name: string;
  line_number: number;
  code_snippet: string;
  impact: string;
  recommendation: string;
  status: string;
  reviewStatus?: string;
  decision?: string;
  created_at: string;
  updated_at: string;
}

const Vulnerabilities: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [findings, setFindings] = useState<Finding[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState(searchParams.get('project') || 'All');
  const [languageFilter] = useState('All');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiFetch('/api/projects');
        if (res.ok) setProjects(await res.json());
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    };
    fetchProjects();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    setError(false);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (severityFilter !== 'All') queryParams.append('severity', severityFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (projectFilter !== 'All') queryParams.append('project', projectFilter);
      if (languageFilter !== 'All') queryParams.append('language', languageFilter);
      if (reviewStatusFilter !== 'All') queryParams.append('reviewStatus', reviewStatusFilter);
      if (decisionFilter !== 'All') queryParams.append('decision', decisionFilter);

      const res = await apiFetch(`/api/findings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFindings(data);
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

  useEffect(() => {
    // Debounce search slightly
    const timeoutId = setTimeout(() => {
      fetchFindings();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, severityFilter, statusFilter, projectFilter, languageFilter, reviewStatusFilter, decisionFilter]);

  const summary = {
    total: findings.length,
    critical: findings.filter(f => f.severity.toUpperCase() === 'CRITICAL').length,
    high: findings.filter(f => f.severity.toUpperCase() === 'HIGH').length,
    medium: findings.filter(f => f.severity.toUpperCase() === 'MEDIUM').length,
    low: findings.filter(f => f.severity.toUpperCase() === 'LOW').length,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Unable to load security findings.</h2>
        <p className="text-on-surface-variant mb-6">There was a problem communicating with the server.</p>
        <button 
          onClick={fetchFindings}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Security Findings</h1>
          <p className="text-on-surface-variant">Detailed view of all detected security issues.</p>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-center">
          <p className="text-sm text-outline font-semibold mb-1">Total Findings</p>
          <p className="text-3xl font-bold text-on-surface">{loading ? '-' : summary.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-error/30 text-center">
          <p className="text-sm text-error font-semibold mb-1">Critical</p>
          <p className="text-3xl font-bold text-error">{loading ? '-' : summary.critical}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-orange-500/30 text-center">
          <p className="text-sm text-orange-500 font-semibold mb-1">High</p>
          <p className="text-3xl font-bold text-orange-500">{loading ? '-' : summary.high}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-yellow-500/30 text-center">
          <p className="text-sm text-yellow-500 font-semibold mb-1">Medium</p>
          <p className="text-3xl font-bold text-yellow-500">{loading ? '-' : summary.medium}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-blue-500/30 text-center">
          <p className="text-sm text-blue-500 font-semibold mb-1">Low</p>
          <p className="text-3xl font-bold text-blue-500">{loading ? '-' : summary.low}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-xl">search</span>
          <input
            type="text"
            placeholder="Search finding, CWE, project, file..."
            className="w-full h-10 pl-10 pr-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm placeholder:text-outline focus:border-primary outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none">
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none">
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Confirmed">Confirmed</option>
            <option value="False Positive">False Positive</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none">
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p.name}>{p.name}</option>
            ))}
            {/* If a project filter is set from URL but doesn't exist in projects list, ensure it's selectable to avoid UI desync */}
            {projectFilter !== 'All' && !projects.find(p => p.name === projectFilter) && (
              <option value={projectFilter}>{projectFilter}</option>
            )}
          </select>

          <select value={reviewStatusFilter} onChange={e => setReviewStatusFilter(e.target.value)} className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none">
            <option value="All">All Review Status</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Not Reviewed">Not Reviewed</option>
          </select>
          <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} className="h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface text-sm focus:border-primary outline-none">
            <option value="All">All Decisions</option>
            <option value="Pending">Pending</option>
            <option value="True Positive">True Positive</option>
            <option value="False Positive">False Positive</option>
            <option value="Needs Investigation">Needs Investigation</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse"></div>)}
        </div>
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-4">verified</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No security findings yet.</h3>
          <p className="text-on-surface-variant max-w-sm mt-2 mb-6">Run a security scan to detect vulnerabilities.</p>

        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-xs text-outline uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Finding</th>
                  <th className="px-4 py-3 font-medium">CWE</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Line</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm">
                {findings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/findings/${finding.id}`)}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        finding.severity.toUpperCase() === 'CRITICAL' ? 'bg-error text-white' : 
                        finding.severity.toUpperCase() === 'HIGH' ? 'bg-[rgb(249,115,22)] text-white' :
                        finding.severity.toUpperCase() === 'MEDIUM' ? 'bg-[rgb(234,179,8)] text-black' :
                        'bg-blue-500 text-white'
                      }`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface truncate max-w-[200px]" title={finding.title}>{finding.title}</td>
                    <td className="px-4 py-3 text-secondary font-mono text-xs">{finding.cwe}</td>
                    <td className="px-4 py-3 text-on-surface-variant truncate max-w-[150px]">{finding.project_name}</td>
                    <td className="px-4 py-3 text-outline font-mono text-xs truncate max-w-[150px]" title={finding.file_name}>{finding.file_name}</td>
                    <td className="px-4 py-3 text-outline font-mono text-xs">{finding.line_number}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                        finding.status === 'Open' ? 'bg-surface-container-high text-on-surface' :
                        finding.status === 'Resolved' ? 'bg-green-500/10 text-green-500' :
                        finding.status === 'False Positive' ? 'bg-outline-variant text-on-surface' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {finding.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${finding.reviewStatus === 'Reviewed' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'}`}>{finding.reviewStatus}</span>
                        {finding.decision && finding.decision !== 'Pending' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${
                            finding.decision === 'TRUE_POSITIVE' ? 'bg-error/20 text-error' :
                            finding.decision === 'FALSE_POSITIVE' ? 'bg-green-500/20 text-green-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {finding.decision === 'TRUE_POSITIVE' ? 'TRUE POSITIVE' : 
                             finding.decision === 'FALSE_POSITIVE' ? 'FALSE POSITIVE' : 
                             'NEEDS INVESTIGATION'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-outline text-xs whitespace-nowrap">{new Date(finding.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-primary hover:bg-primary-container p-1.5 rounded transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/findings/${finding.id}`); }}>
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vulnerabilities;
