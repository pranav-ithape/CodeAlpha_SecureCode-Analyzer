import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      try {
        const [projRes, scansRes] = await Promise.all([
          apiFetch(`/api/projects/${projectId}`),
          apiFetch(`/api/projects/${projectId}/scans`)
        ]);

        if (!projRes.ok) throw new Error('Failed to load project details');
        const projData = await projRes.json();
        setProject(projData);

        if (scansRes.ok) {
          const scansData = await scansRes.json();
          setScans(scansData);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading project');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This will permanently delete all associated scans and findings.')) {
      try {
        const res = await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (res.ok) {
          navigate('/projects');
        } else {
          alert('Failed to delete project');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-error mb-4">error_outline</span>
        <h2 className="text-xl font-bold text-on-surface mb-2">Error</h2>
        <p className="text-on-surface-variant mb-6">{error || 'Project not found'}</p>
        <button onClick={() => navigate('/projects')} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-fixed-dim transition-colors">
          Return to Projects
        </button>
      </div>
    );
  }

  // Calculate stats based on scans
  const totalScans = scans.length;
  let totalFindings = 0;
  let criticalFindings = 0;
  let highFindings = 0;

  scans.forEach(scan => {
    totalFindings += (scan.summary?.total || 0);
    criticalFindings += (scan.summary?.critical || 0);
    highFindings += (scan.summary?.high || 0);
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-start border-b border-outline-variant pb-4">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-outline hover:text-primary flex items-center gap-1 mb-2 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">folder</span>
            <h1 className="text-headline-lg font-bold text-on-surface">{project.name}</h1>
          </div>
          <p className="text-on-surface-variant mt-2 max-w-3xl">{project.description || 'No description provided.'}</p>
          <p className="text-xs text-outline mt-2 font-mono">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="h-9 px-4 rounded border border-error text-error font-semibold flex items-center gap-2 hover:bg-error/10 transition-colors"
            onClick={handleDelete}
          >
            <span className="material-symbols-outlined text-sm">delete</span> Delete Project
          </button>
          {scans.length > 0 && (
            <button 
              className="h-9 px-4 rounded bg-surface-container text-on-surface font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
              onClick={() => navigate('/new-scan', { state: { projectId: project._id, retestScanId: scans[0]._id, applicationName: project.name } })}
            >
              <span className="material-symbols-outlined text-sm">replay</span> Retest
            </button>
          )}
          <button 
            className="h-9 px-4 rounded bg-primary text-on-primary font-semibold flex items-center gap-2 hover:bg-primary-fixed-dim transition-colors"
            onClick={() => navigate('/new-scan', { state: { projectId: project._id } })}
          >
            <span className="material-symbols-outlined text-sm">add</span> New Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-center">
          <span className="text-sm text-outline font-semibold mb-1">Total Scans</span>
          <span className="text-3xl font-bold text-on-surface">{totalScans}</span>
        </div>
        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant flex flex-col justify-center">
          <span className="text-sm text-outline font-semibold mb-1">Total Findings</span>
          <span className="text-3xl font-bold text-on-surface">{totalFindings}</span>
        </div>
        <div className="p-5 rounded-xl bg-surface-container-low border border-error/30 flex flex-col justify-center">
          <span className="text-sm text-error font-semibold mb-1">Critical Severity</span>
          <span className="text-3xl font-bold text-error">{criticalFindings}</span>
        </div>
        <div className="p-5 rounded-xl bg-surface-container-low border border-orange-500/30 flex flex-col justify-center">
          <span className="text-sm text-orange-500 font-semibold mb-1">High Severity</span>
          <span className="text-3xl font-bold text-orange-500">{highFindings}</span>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-on-surface">Recent Scans</h2>
          <Link to="/scan-history" className="text-sm text-primary font-semibold hover:underline">View All Scans</Link>
        </div>
        
        {scans.length === 0 ? (
          <div className="p-8 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
            <span className="material-symbols-outlined text-3xl text-outline mb-2">radar</span>
            <p className="text-on-surface font-semibold mb-1">No scans performed yet.</p>
            <p className="text-on-surface-variant text-sm mb-4">Run a security scan to start analyzing this project.</p>
            <button 
              onClick={() => navigate('/new-scan')}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded text-sm font-semibold transition-colors"
            >
              Start Scan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {scans.slice(0, 5).map(scan => (
              <div key={scan._id} className="p-4 rounded-xl border border-outline-variant bg-surface-container-low flex justify-between items-center hover:border-outline cursor-pointer" onClick={() => navigate(`/scans/${scan._id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Scan for {scan.applicationName}</h3>
                    <p className="text-xs text-outline">{scan.language} • {new Date(scan.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  {scan.status === 'completed' ? (
                    <>
                      <span className="text-error">{scan.summary?.critical || 0} Critical</span>
                      <span className="text-orange-500">{scan.summary?.high || 0} High</span>
                    </>
                  ) : (
                    <span className="text-outline uppercase text-xs px-2 py-1 bg-surface-container rounded">{scan.status}</span>
                  )}
                  <span className="material-symbols-outlined text-outline">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {totalFindings > 0 && (
        <div className="pt-4 flex justify-center">
           <Link to={`/findings?project=${encodeURIComponent(project.name)}`} className="px-6 py-2 bg-surface-container border border-outline-variant rounded-lg font-semibold text-on-surface hover:bg-surface-container-highest transition-colors">
              View All Vulnerabilities for this Project
           </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
