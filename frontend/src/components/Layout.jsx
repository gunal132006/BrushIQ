import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';

const Layout = ({ children }) => {
  const { darkMode } = useTheme();
  const location = useLocation();

  // Route to screen title mapping
  const getHeaderTitle = (pathname) => {
    if (pathname === '/') return 'BrushIQ';
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
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-250 ${
      darkMode ? 'bg-slate-950' : 'bg-slate-100'
    }`}>
      {/* Centered Mobile Container Mockup */}
      <div className={`relative max-w-[480px] w-full min-h-screen md:min-h-[850px] md:h-[850px] flex flex-col overflow-hidden md:rounded-[36px] md:shadow-2xl border-x ${
        darkMode 
          ? 'bg-[#0b0f19] border-slate-800 text-slate-100 shadow-[#000000_0px_25px_50px_-12px]' 
          : 'bg-slate-50 border-slate-200 text-slate-900 shadow-slate-300'
      }`}>
        
        {/* App Top Bar */}
        <AppHeader 
          title={getHeaderTitle(location.pathname)} 
          showBackButton={showBackButton} 
        />

        {/* Scrollable Screen Content */}
        <main className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {children}
        </main>

        {/* App Bottom Tab Navigation */}
        <BottomNavigation />
        
      </div>
    </div>
  );
};

export default Layout;
