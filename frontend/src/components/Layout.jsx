import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Layout = ({ children }) => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [isDemo, setIsDemo] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/system/database-status`);
        if (res.data && res.data.mode === 'demo-json') {
          setIsDemo(true);
        }
      } catch (err) {
        console.warn('Failed to check database status:', err.message);
      }
    };
    checkDbStatus();
  }, []);

  const handleResetDemo = async () => {
    if (resetting) return;
    if (!window.confirm('Reset the demo environment? All current changes will be overwritten with realistic default seeding.')) {
      return;
    }
    setResetting(true);
    try {
      await axios.post(`${API_URL}/system/reset-demo`);
      alert('Demo database reset and seeded successfully.');
      window.location.reload();
    } catch (err) {
      alert('Failed to reset demo database: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

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
        
        {/* Demo Mode Banner */}
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-650 text-white text-[10px] font-black py-1.5 px-4 shrink-0 uppercase tracking-widest flex items-center justify-between shadow-sm z-30 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>Running in Demo Mode</span>
            </div>
            <button 
              onClick={handleResetDemo}
              disabled={resetting}
              className="bg-white/20 hover:bg-white/30 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded transition-all cursor-pointer disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Demo'}
            </button>
          </div>
        )}

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
