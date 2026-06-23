import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

const AppHeader = ({ title, showBackButton = false }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between px-5 py-4 border-b shrink-0 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
    }`}>
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-primary/20">
            B
          </div>
        )}
        <h1 className="text-lg font-bold m-0 tracking-tight leading-none">
          {title || 'BrushIQ'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer border ${
            darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-505 hover:bg-slate-100'
          }`}
          title="Toggle Theme"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user && (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/25">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
