import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const ScanHistory: React.FC = () => {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await apiFetch('/api/scans');
        if (res.ok) {
          setScans(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredScans = scans.filter(s => 
    s.applicationName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.language?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 ">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Scan History</h1>
          <p className="text-on-surface-variant">Log of all static code analysis runs.</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            className="w-full h-10 pl-10 pr-4 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors shadow-sm"
            placeholder="Search scans by application, language, or ID..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
        </div>
      ) : filteredScans.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-container border-b border-outline-variant font-semibold">
              <tr>
                <th className="px-4 py-3">Scan ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Critical</th>
                <th className="px-4 py-3">Total Findings</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.map((scan) => (
                <tr key={scan._id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-highest transition-colors cursor-pointer" onClick={() => navigate(`/scans/${scan._id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-outline">{scan._id.substring(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${scan.scanType === 'RETEST' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface'}`}>
                      {scan.scanType === 'RETEST' ? 'Retest' : 'Initial'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {scan.applicationName}
                    {scan.scanType === 'RETEST' && scan.previousScanId && (
                      <div className="text-xs text-outline font-normal mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">turn_right</span>
                        Prev: {scan.previousScanId.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{scan.language}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scan.status === 'completed' ? 'bg-secondary bg-opacity-20 text-secondary' :
                      scan.status === 'analyzing' ? 'bg-tertiary bg-opacity-20 text-tertiary' :
                      scan.status === 'failed' ? 'bg-error bg-opacity-20 text-error' :
                      'bg-outline-variant text-on-surface'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${scan.summary?.critical > 0 ? 'text-error' : ''}`}>
                    {scan.summary?.critical || 0}
                  </td>
                  <td className="px-4 py-3">{scan.summary?.total || 0}</td>
                  <td className="px-4 py-3 text-xs text-outline text-nowrap">{new Date(scan.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">history</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Scans Performed</h3>
          <p className="text-on-surface-variant max-w-sm mt-2">Start a new security review to populate your scan history logs.</p>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
