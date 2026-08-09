import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import SidebarNavigation from './SidebarNavigation';
import BottomNavigation from './BottomNavigation';

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
    <div className={`flex flex-col lg:flex-row h-screen w-screen overflow-hidden transition-colors duration-200 ${
      darkMode ? 'bg-[#090d17] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>

      {/* Desktop Sidebar (visible on desktop >= 1024px, hidden on mobile/tablet) */}
      <div className="hidden lg:flex shrink-0">
        <SidebarNavigation />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">

        {/* Top Header Bar */}
        <header className={`shrink-0 flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b ${
          darkMode
            ? 'bg-[#0b0f19] border-slate-800'
            : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Brand Logo Header Badge (visible on mobile < 1024px) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-primary/20">
                B
              </div>
            </div>

            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              <h2 className="text-base sm:text-lg font-bold m-0 leading-none tracking-tight flex items-center gap-2">
                {getHeaderTitle(location.pathname)}
                <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  BUILD: 2026-08-09-DESKTOP-FIX-01
                </span>
              </h2>
              <p className={`text-[10px] sm:text-[11px] mt-0.5 font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
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
                <span className="text-xs font-bold hidden sm:inline">{user.fullName}</span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Content Container - Responsive Landscape Width */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation (visible ONLY on mobile < 1024px) */}
        <div className="block lg:hidden shrink-0">
          <BottomNavigation />
        </div>

      </div>
    </div>
  );
};

export default Layout;
