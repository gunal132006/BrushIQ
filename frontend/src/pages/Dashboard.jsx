import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, reminderService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ReminderCard from '../components/ReminderCard';
import { DashboardSkeleton } from '../components/SkeletonLoader';

import { 
  Users, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  Camera, 
  Plus, 
  ChevronRight,
  TrendingUp,
  History,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, remRes] = await Promise.all([
        dashboardService.getStats(),
        reminderService.getReminders(),
      ]);
      setStats(statsRes.data);
      const remData = Array.isArray(remRes.data) ? remRes.data : [];
      setReminders(remData.slice(0, 3));
    } catch (err) {
      console.error('[Dashboard fetch error]', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Database / API service unavailable';
      setError(msg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'Good':
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
      case 'Moderate Wear':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
      default:
        return 'text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30';
    }
  };

  const handleReminderComplete = async (id) => {
    try {
      await reminderService.completeReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      
      {/* Explicit Infrastructure Error Banner */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-sm m-0">Database / API Unavailable</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 m-0">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      )}

      {/* Hero Welcome Banner - Landscape Optimized */}
      <div className="rounded-3xl bg-gradient-to-r from-primary via-indigo-600 to-secondary p-6 sm:p-8 text-white shadow-xl shadow-primary/10 relative overflow-hidden shrink-0">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
              Welcome back, {user?.fullName ? user.fullName.split(' ')[0] : 'User'}! 👋
            </h2>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed m-0">
              Monitor your family's oral health metrics, track bristle wear, and keep automated scan reminders up to date.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/scan')}
              className="px-5 py-3 bg-white text-primary hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-black/10 transition-all duration-200 active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Start AI Scan
            </button>
            <button
              onClick={() => navigate('/family')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Responsive 4 Columns on Landscape Desktop */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Profiles" 
            value={stats.totalMembers} 
            icon={Users} 
            iconColorClass="text-blue-500 bg-blue-50 dark:bg-blue-950/20"
          />
          <StatCard 
            title="Brushes" 
            value={stats.totalToothbrushes} 
            icon={Sparkles} 
            iconColorClass="text-teal-500 bg-teal-50 dark:bg-teal-950/20"
          />
          <StatCard 
            title="Avg Health" 
            value={`${stats.avgHealthScore.toFixed(0)}%`} 
            icon={Activity} 
            iconColorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
          />
          <StatCard 
            title="Alerts" 
            value={stats.pendingReplacements} 
            icon={AlertTriangle} 
            iconColorClass={stats.pendingReplacements > 0 ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 animate-pulse' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'}
          />
        </div>
      )}

      {/* Main Multi-Column Section for Landscape Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Recent Activity & Detailed Health Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border transition-all ${
            darkMode ? 'bg-[#0b0f19] border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-extrabold text-base m-0">Recent Activity</h3>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Latest bristle scans and diagnostic health records</p>
              </div>
              <button 
                onClick={() => navigate('/history')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                View History <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!stats || stats.recentScans.length === 0 ? (
              <div className={`text-center py-12 border border-dashed rounded-2xl ${
                darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-200'
              }`}>
                <History className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-400 m-0">No scans recorded yet.</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Scan your toothbrush to initialize AI wear tracking.</p>
                <button
                  onClick={() => navigate('/scan')}
                  className="px-4 py-2 bg-primary text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer hover:bg-primary-dark transition-all"
                >
                  Perform First Scan
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:border-primary/40 cursor-pointer ${
                      darkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-slate-50/70 border-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {scan.memberName ? scan.memberName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate">{scan.memberName}</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{scan.brand} {scan.model}</span>
                        </div>
                        <p className="text-xs font-bold text-primary mt-0.5 m-0">
                          Wear: {Math.round(scan.wearPercentage)}% | Health Score: {Math.round(scan.healthScore)}%
                        </p>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border shrink-0 uppercase tracking-wider ${getConditionColor(scan.condition)}`}>
                      {scan.condition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Reminders & Quick Tips */}
        <div className="space-y-6">
          {/* Hygiene Reminders */}
          <div className={`p-6 rounded-3xl border transition-all ${
            darkMode ? 'bg-[#0b0f19] border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base m-0">Hygiene Reminders</h3>
              <button 
                onClick={() => navigate('/reminders')}
                className="text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                See all
              </button>
            </div>
            
            {reminders.length === 0 ? (
              <p className={`text-xs text-center py-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                No active hygiene alerts at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <ReminderCard 
                    key={reminder.id} 
                    reminder={reminder} 
                    onComplete={handleReminderComplete} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-800/50 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" /> AI Dental Hygiene Tip
            </div>
            <p className="text-xs leading-relaxed text-indigo-100 m-0">
              Replace your toothbrush head every 90 days or immediately following a contagious illness to prevent bacterial accumulation.
            </p>
            <button
              onClick={() => navigate('/tips')}
              className="text-xs font-bold text-indigo-300 hover:text-white underline cursor-pointer"
            >
              Explore Clinical Guidelines &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
