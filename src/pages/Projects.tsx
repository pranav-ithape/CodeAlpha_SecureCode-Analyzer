import React from 'react';

const Projects: React.FC = () => {
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
      
      <div className="flex flex-col items-center justify-center p-12 border border-outline-variant border-dashed rounded-xl bg-surface-container-low text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-4">folder_off</span>
        <h3 className="text-headline-sm font-bold text-on-surface">No Projects Found</h3>
        <p className="text-on-surface-variant max-w-sm mt-2">Connect your first Git repository or manually upload code to create a project workspace.</p>
      </div>
    </div>
  );
};

export default Projects;
