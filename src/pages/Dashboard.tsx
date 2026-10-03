import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

interface DashboardData {
  total_projects: number;
  total_scans: number;
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  security_score: number;
  recent_scans: any[];
  recent_findings: any[];
  severity_distribution: any[];
  activity: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
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
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-container-high rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-surface-container-high rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-surface-container-high rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-32 rounded-xl bg-surface-container-high animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 rounded-xl bg-surface-container-high animate-pulse"></div>
          <div className="lg:col-span-2 h-64 rounded-xl bg-surface-container-high animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Unable to load dashboard data.</h2>
        <p className="text-on-surface-variant mb-6">There was a problem communicating with the server.</p>
        <button 
          onClick={fetchDashboardData}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const summaryCards = [
    { title: 'Total Projects', count: data.total_projects, icon: 'folder_special', color: 'text-primary' },
    { title: 'Total Scans', count: data.total_scans, icon: 'radar', color: 'text-primary' },
    { title: 'Total Findings', count: data.total_findings, icon: 'bug_report', color: 'text-primary' },
    { title: 'Critical', count: data.critical, icon: 'dangerous', color: 'text-error' },
    { title: 'High', count: data.high, icon: 'warning', color: 'text-orange-500' },
    { title: 'Medium', count: data.medium, icon: 'error', color: 'text-yellow-500' },
    { title: 'Low', count: data.low, icon: 'info', color: 'text-blue-500' },
  ];

  const isEmpty = data.total_scans === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Security Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Monitor your code security posture and recent analysis activity.
          </p>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-label-code-sm font-label-code-sm text-outline font-semibold">{card.title}</span>
              <span className={`material-symbols-outlined text-xl ${card.color || 'text-primary'}`}>{card.icon}</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-bold font-headline-lg text-on-surface">{card.count}</span>
            </div>
          </div>
        ))}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center flex flex-col items-center justify-center max-w-3xl mx-auto shadow-sm mt-8">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-4 text-primary">
            <span className="material-symbols-outlined text-3xl">security_update_good</span>
          </div>
          <h2 className="font-headline-lg text-headline-md md:text-headline-lg font-bold text-on-surface">No scans yet</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mt-2 mb-6">
            Start your first security scan to see results here.
          </p>

        </div>
      ) : (
        <>
          {/* Middle Section: Score & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Security Score Card */}
            <div className="lg:col-span-1 p-6 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <h2 className="text-lg font-bold text-on-surface mb-6 w-full text-left">Overall Security Score</h2>
              
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Circular Progress (SVG) */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                    strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * data.security_score) / 100}
                    className="text-primary transition-all duration-1000 ease-out" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-on-surface">{data.security_score}</span>
                  <span className="text-sm text-outline font-medium">/ 100</span>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col gap-1 items-center">
                <span className="text-sm text-on-surface-variant">Based on recent scan findings</span>
                <span className="text-xs text-outline flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md mt-2">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Application-generated security score
                </span>
              </div>
            </div>

            {/* Vulnerability Distribution */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-on-surface mb-6">Vulnerability Distribution</h2>
              {data.total_findings === 0 ? (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                  No vulnerabilities found.
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center gap-6">
                  {data.severity_distribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="w-16 text-sm font-medium text-on-surface-variant">{item.label}</span>
                      <div className="flex-1 h-3 bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }}></div>
                      </div>
                      <span className="w-8 text-right text-sm font-bold text-on-surface">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Recent Scans</h2>
              <Link to="/history" className="text-sm text-primary hover:underline font-medium">View All Scans</Link>
            </div>
            {data.recent_scans.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No security scans yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-xs text-outline uppercase tracking-wider">
                      <th className="px-5 py-3 font-medium">Project</th>
                      <th className="px-5 py-3 font-medium">Language</th>
                      <th className="px-5 py-3 font-medium">Security Score</th>
                      <th className="px-5 py-3 font-medium text-center">Critical</th>
                      <th className="px-5 py-3 font-medium text-center">High</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-sm">
                    {data.recent_scans.map((scan) => (
                      <tr key={scan._id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-5 py-4 font-medium text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-lg">folder</span>
                          {scan.project}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">{scan.language}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-surface-container-high h-2 rounded-full max-w-[60px]">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${scan.score}%` }}></div>
                            </div>
                            <span className="font-semibold text-on-surface">{scan.score}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${scan.critical > 0 ? 'bg-error/10 text-error' : 'text-outline'}`}>
                            {scan.critical}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${scan.high > 0 ? 'bg-orange-500/10 text-orange-500' : 'text-outline'}`}>
                            {scan.high}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                            scan.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-error/10 text-error'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {scan.status === 'Completed' ? 'check_circle' : 'error'}
                            </span>
                            {scan.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-outline">{new Date(scan.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-right">
                          <button className="text-primary hover:bg-primary-container p-2 rounded transition-colors" title="View Report">
                            <span className="material-symbols-outlined text-lg">description</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Findings */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Recent Findings</h2>
              <Link to="/findings" className="text-sm text-primary hover:underline font-medium">View All Findings</Link>
            </div>
            {data.recent_findings.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No security findings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-xs text-outline uppercase tracking-wider">
                      <th className="px-5 py-3 font-medium">Severity</th>
                      <th className="px-5 py-3 font-medium">Finding</th>
                      <th className="px-5 py-3 font-medium">CWE</th>
                      <th className="px-5 py-3 font-medium">Project</th>
                      <th className="px-5 py-3 font-medium">Location</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant text-sm">
                    {data.recent_findings.map((finding) => (
                      <tr key={finding._id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            finding.severity === 'Critical' ? 'bg-error/10 text-error border border-error/20' : 
                            finding.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            finding.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {finding.severity === 'Critical' ? 'dangerous' : finding.severity === 'High' ? 'warning' : 'error'}
                            </span>
                            {finding.severity}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-on-surface">{finding.finding}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-surface-container-high px-2 py-1 rounded text-secondary">{finding.cwe}</span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">{finding.project}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-outline">{finding.location}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            finding.status === 'Open' ? 'bg-surface-container-high text-on-surface' :
                            finding.status === 'In Review' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-green-500/10 text-green-500'
                          }`}>
                            {finding.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Activity Timeline */}
          {data.activity.length > 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm p-6">
              <h2 className="text-lg font-bold text-on-surface mb-6">Security Activity</h2>
              <div className="relative border-l border-outline-variant ml-4 space-y-6">
                {data.activity.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    <div className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center bg-surface-container-lowest border-2 border-outline-variant shadow-sm ${
                      act.type === 'vulnerability_found' ? 'text-error' : 
                      act.type === 'scan_complete' ? 'text-green-500' : 'text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-sm">{act.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{act.text}</p>
                      <p className="text-xs text-outline mt-1">{new Date(act.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
