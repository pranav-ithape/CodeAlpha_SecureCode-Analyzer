import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="border-b border-outline-variant pb-4">
        <h1 className="text-headline-lg font-bold text-on-surface">Settings</h1>
        <p className="text-on-surface-variant">Manage your account profile and workspace preferences.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-outline-variant pr-6">
          <ul className="space-y-1">
            <li className="px-3 py-2 rounded bg-surface-container-high text-primary font-medium border-l-2 border-primary">Account Details</li>
            <li className="px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">Security Policies</li>
            <li className="px-3 py-2 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer">Integrations</li>
          </ul>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-surface-container-low border border-outline-variant rounded-xl">
            <h3 className="text-headline-sm font-bold mb-4">Account Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-label-code-sm font-medium mb-1">Full Name</label>
                <input 
                  className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-on-surface focus:border-primary outline-none" 
                  type="text" 
                  defaultValue={user?.name || ''} 
                  disabled 
                />
              </div>
              <div>
                <label className="block text-label-code-sm font-medium mb-1">Email Address</label>
                <input 
                  className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded text-outline cursor-not-allowed" 
                  type="email" 
                  defaultValue={user?.email || ''} 
                  disabled 
                />
              </div>
              <div className="pt-4 border-t border-outline-variant mt-6">
                <button 
                  onClick={handleLogout}
                  className="h-10 px-4 rounded bg-error bg-opacity-10 text-error hover:bg-opacity-20 font-semibold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
