import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/apiFetch';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
      });
      if (res.ok) {
        setNewProjectName('');
        setNewProjectDesc('');
        setIsModalOpen(false);
        fetchProjects();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create project');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 ">
      <div className="flex justify-between items-center border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Projects</h1>
          <p className="text-on-surface-variant">Manage connected repositories and workspaces.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="h-9 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Add Project
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
          <input
            className="w-full h-10 pl-10 pr-4 text-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors shadow-sm"
            placeholder="Search projects..."
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
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div 
              key={project._id} 
              className="p-4 rounded-xl bg-surface-container border border-outline-variant hover:border-outline hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">folder</span>
                    <h3 className="font-bold text-on-surface truncate">{project.name}</h3>
                  </div>
                  <button 
                    className="p-1 rounded hover:bg-surface-container-highest text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); navigate('/new-scan'); }}
                    title="Start New Scan"
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
                  View Dashboard <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">folder_off</span>
          <h3 className="text-headline-sm font-bold text-on-surface">No Projects Found</h3>
          <p className="text-on-surface-variant max-w-sm mt-2 mb-4">Create your first project workspace to start auditing applications.</p>
          <button onClick={() => setIsModalOpen(true)} className="h-9 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Create Project
          </button>
        </div>
      )}

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-xl w-full max-w-md p-6 shadow-2xl ">
            <h2 className="text-xl font-bold text-on-surface mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Project Name *</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary outline-none"
                  placeholder="e.g. E-Commerce Platform"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Description (Optional)</label>
                <textarea 
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full h-24 p-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary outline-none resize-none"
                  placeholder="Brief description of the application..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newProjectName.trim() || isCreating}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-on-primary rounded-lg disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Projects;
