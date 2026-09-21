import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="text-headline-lg font-bold text-on-surface">Workspace Settings</h1>
        <p className="text-on-surface-variant">Manage organization policies, integrations, and access.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-outline-variant pr-6">
          <ul className="space-y-1">
            <li className="px-3 py-2 rounded bg-surface-container-high text-primary font-medium border-l-2 border-primary">General</li>
            <li className="px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">Security Policies</li>
            <li className="px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">Integrations</li>
            <li className="px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">Members</li>
          </ul>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl">
            <h3 className="text-headline-sm font-bold mb-4">Workspace Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-label-code-sm font-medium mb-1">Workspace Name</label>
                <input className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface focus:border-primary outline-none" type="text" defaultValue="Prod-SecOps" />
              </div>
              <div>
                <label className="block text-label-code-sm font-medium mb-1">Organization ID</label>
                <input className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-outline cursor-not-allowed" type="text" defaultValue="org-9921-a4b1" disabled />
              </div>
              <button className="h-10 px-4 rounded bg-primary text-on-primary font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
