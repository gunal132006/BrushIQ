import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';

const Layout = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getHeaderTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/family') return 'Family Profiles';
    if (pathname === '/toothbrushes') return 'My Toothbrushes';
    if (pathname === '/scan') return 'AI Scanner';
    if (pathname === '/result') return 'AI Diagnosis';
    if (pathname.startsWith('/scans/')) return 'Scan Report';
    if (pathname === '/history') return 'Timeline History';
    if (pathname === '/reminders') return 'Hygiene Alerts';
    if (pathname === '/tips') return 'Hygiene Tips';
    if (pathname === '/settings') return 'Settings & Profile';
    return 'BrushIQ';
  };

  const showBackButton = [
    '/toothbrushes',
    '/result',
  ].includes(location.pathname) || location.pathname.startsWith('/scans/');

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-200 ${
      darkMode ? 'bg-[#090d17] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>

      {/* Left Sidebar */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <header className={`shrink-0 flex items-center justify-between px-8 py-4 border-b ${
          darkMode
            ? 'bg-[#0b0f19] border-slate-800'
            : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer mr-1 ${
                  darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold m-0 leading-none tracking-tight">
                {getHeaderTitle(location.pathname)}
              </h2>
              <p className={`text-[11px] mt-0.5 font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                BrushIQ — AI Oral Healthcare Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer border ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Toggle Theme"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ${
                darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/25 shrink-0">
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold">{user.fullName}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>

      </div>
    </div>
  );
};

export default Layout;

