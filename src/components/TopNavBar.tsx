import React from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '../contexts/ThemeContext';

interface TopNavBarProps { 
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ sidebarOpen, toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();



  return (
    <header className="flex justify-between items-center w-full px-space-lg h-14 border-b border-outline-variant bg-surface-container-low z-20 flex-shrink-0">
      <div className="flex items-center gap-space-md flex-1 max-w-xl">
        {!sidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex-shrink-0 mr-2"
            title="Open Sidebar"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}

      </div>
      <div className="flex items-center gap-3">

        <a className="hidden sm:flex items-center gap-1 text-label-code-sm font-label-code-sm text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container-high transition-colors" href="#">
          <span className="material-symbols-outlined text-sm">help</span>
          <span>Docs</span>
        </a>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors relative" title="Notifications">
            <span className="material-symbols-outlined text-base">notifications</span>
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors" onClick={toggleTheme} title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}>
            <span className="material-symbols-outlined text-base">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
        <Link to="/new-scan" className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-label-code-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>New Scan</span>
        </Link>
        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center text-on-surface font-label-code-sm font-bold ml-1 cursor-pointer">
          <span className="material-symbols-outlined text-base text-primary">account_circle</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
