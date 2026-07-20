import React from 'react';
import { Menu, Moon, Sun, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { logout, user } = useAuth();
  const [dark, setDark] = React.useState(localStorage.theme === 'dark');

  const toggleTheme = () => {
    const isDark = !dark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
    setDark(isDark);
  };

  return (
    <header className="h-16 border-b border-[var(--border-color)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between lg:justify-end">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--warning-amber)] border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button 
            className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => logout()}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--primary-teal)] text-white flex items-center justify-center font-bold text-sm">
              {user ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-[var(--text-main)] leading-tight">{user ? user.name : 'Loading...'}</p>
              <p className="text-xs text-[var(--text-secondary)]">Sign out</p>
            </div>
            <LogOut size={16} className="ml-1 text-slate-400 md:hidden" />
          </button>
        </div>
      </div>
    </header>
  );
}
