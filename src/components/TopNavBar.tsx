import React from 'react';
import { Link } from 'react-router-dom';

interface TopNavBarProps {}

const TopNavBar: React.FC<TopNavBarProps> = () => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="flex justify-between items-center w-full px-space-lg h-14 border-b border-outline-variant bg-surface-container-low z-20 flex-shrink-0">
      <div className="flex items-center gap-space-md flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-base">search</span>
          <input
            className="w-full h-8 pl-8 pr-12 text-label-code-sm font-label-code-sm bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            placeholder="Press / to search rules, files, projects, or findings..."
            type="text"
          />
          <div className="absolute right-2 top-2 px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-[10px] font-label-code-sm text-outline pointer-events-none">
            /
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-4 text-label-code-sm font-label-code-sm pr-2 border-r border-outline-variant">
          <span className="text-primary font-semibold border-b-2 border-primary pb-0.5">Workspace: Prod-SecOps</span>
          <span className="text-on-surface-variant hover:text-on-surface cursor-pointer">Rule Engine v4.2</span>
        </div>
        <a className="hidden sm:flex items-center gap-1 text-label-code-sm font-label-code-sm text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container-high transition-colors" href="#">
          <span className="material-symbols-outlined text-sm">help</span>
          <span>Docs</span>
        </a>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors relative" title="Notifications">
            <span className="material-symbols-outlined text-base">notifications</span>
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary"></span>
          </button>
          <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors" onClick={toggleTheme} title="Toggle Theme">
            <span className="material-symbols-outlined text-base">contrast</span>
          </button>
        </div>
        <Link to="/new-review" className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-label-code-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm">
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
