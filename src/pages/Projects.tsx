import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiFetch('/api/projects');
        if (res.ok) {
          setProjects(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Projects</h1>
          <p className="text-on-surface-variant">Manage connected repositories and workspaces.</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Add Project
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary"></span>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="p-4 rounded-xl bg-surface-container border border-outline-variant hover:border-outline hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
              onClick={() => navigate('/history')}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">folder</span>
                    <h3 className="font-bold text-on-surface truncate">{project.name}</h3>
                  </div>
                  <button 
                    className="p-1 rounded hover:bg-surface-container-highest text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); navigate('/new-review', { state: { projectName: project.name } }); }}
                    title="Start New Review"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                  </button>
                </div>
                {project.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-2">{project.description}</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant text-xs text-outline flex items-center justify-between">
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View History <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">folder_off</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Projects Found</h3>
          <p className="text-on-surface-variant max-w-sm mt-2">Connect your first Git repository or manually upload code to create a project workspace.</p>
        </div>
      )}
    </div>
  );
};

export default Projects;
