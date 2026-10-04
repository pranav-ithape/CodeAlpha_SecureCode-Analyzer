import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

const Reports: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const fetchScans = async () => {
        try {
          const res = await apiFetch(`/api/projects/${selectedProjectId}/scans`);
          if (res.ok) {
            const data = await res.json();
            setScans(data);
            if (data.length > 0) {
              setSelectedScanId(data[0]._id);
            } else {
              setSelectedScanId('');
            }
          }
        } catch (e) {
          console.error('Failed to load scans', e);
        }
      };
      fetchScans();
    } else {
      setScans([]);
      setSelectedScanId('');
    }
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, repRes] = await Promise.all([
        apiFetch('/api/projects'),
        apiFetch('/api/reports')
      ]);

      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
        if (projData.length > 0) setSelectedProjectId(projData[0]._id);
      }

      if (repRes.ok) {
        setReports(await repRes.json());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedScanId) {
      setError('Please select a scan.');
      return;
    }
    
    setGenerating(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/reports/${selectedScanId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format: selectedFormat })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate report');
      }

      // Refresh reports list
      const repRes = await apiFetch('/api/reports');
      if (repRes.ok) {
        setReports(await repRes.json());
      }
    } catch (err: any) {
      setError(err.message || 'Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      // For downloading a file directly, we can't use apiFetch if we want the browser to prompt a download easily
      // However, since we need to send the Auth token, we must fetch the blob
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to download');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Error downloading report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Security Reports</h1>
          <p className="text-on-surface-variant mt-1">Generate and download security assessment reports.</p>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-error/10 border border-error/30 text-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Generate Report Form */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-on-surface mb-6">Generate Security Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Project:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-surface text-on-surface p-2.5 rounded-lg border border-outline focus:border-primary focus:outline-none transition-colors"
            >
              <option value="" disabled>Select Project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Scan:</label>
            <select
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="w-full bg-surface text-on-surface p-2.5 rounded-lg border border-outline focus:border-primary focus:outline-none transition-colors"
              disabled={scans.length === 0}
            >
              {scans.length === 0 ? (
                <option value="">No scans available</option>
              ) : (
                scans.map(s => (
                  <option key={s._id} value={s._id}>
                    {s._id.substring(0, 8)}... - {s.applicationName} ({new Date(s.createdAt).toLocaleDateString()}) - {s.scanType === 'RETEST' ? 'Retest' : 'Initial'}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Format:</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-surface text-on-surface p-2.5 rounded-lg border border-outline focus:border-primary focus:outline-none transition-colors"
            >
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
            </select>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedScanId}
            className="w-full md:w-1/3 h-[46px] flex items-center justify-center gap-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add</span> Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">description</span>
            <h3 className="text-headline-sm font-bold text-on-surface">No Reports Generated</h3>
            <p className="text-on-surface-variant mt-2">Generate your first report above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container border-b border-outline-variant font-semibold">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Scan ID</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-highest transition-colors">
                    <td className="px-4 py-3 font-medium">{report.projectId?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-outline">
                      {report.scanId?._id ? (
                         <>
                           {report.scanId._id.substring(0, 8)}... 
                           <span className="ml-2 font-sans font-medium text-on-surface">{report.scanId.applicationName}</span>
                         </>
                      ) : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 uppercase font-bold text-xs">{report.reportType}</td>
                    <td className="px-4 py-3 text-sm text-outline">{new Date(report.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        report.status === 'ready' ? 'bg-green-500/20 text-green-500' :
                        report.status === 'failed' ? 'bg-error/20 text-error' :
                        'bg-surface-container-high text-outline'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {report.status === 'ready' && (
                        <button
                          onClick={() => handleDownload(report._id, report.fileName)}
                          className="px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold rounded hover:bg-primary hover:text-on-primary hover:border-primary transition-colors flex items-center gap-1 inline-flex"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          Download {report.reportType.toUpperCase()}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
