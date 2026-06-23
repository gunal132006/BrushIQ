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
  History
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalToothbrushes: 0,
    avgHealthScore: 100.0,
    pendingReplacements: 0,
    recentScans: [],
  });
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, remRes] = await Promise.all([
        dashboardService.getStats(),
        reminderService.getReminders(),
      ]);
      setStats(statsRes.data);
      setReminders(remRes.data.take ? remRes.data.take(2) : remRes.data.slice(0, 2));
    } catch (err) {
      console.error(err);
      setError('Could not retrieve dashboard metrics');
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
      // Reload stats to update averages/replacements
      const statsRes = await dashboardService.getStats();
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      
      {/* Mini Gradient Banner */}
      <div className="rounded-2xl bg-gradient-to-tr from-primary to-secondary p-5 text-white shadow-lg shadow-primary/10 relative overflow-hidden shrink-0">
        <div className="relative z-10">
          <h2 className="text-xl font-black m-0 text-white">Hello, {user?.fullName?.split(' ')[0]}! 👋</h2>
          <p className="text-white/80 text-xs mt-1.5 leading-relaxed">
            Ready to analyze your toothbrush health today? Capture a photo to check bristle bending and wear.
          </p>
          
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => navigate('/scan')}
              className="px-4 py-2 bg-white text-primary hover:bg-slate-50 font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" /> Start Scan
            </button>
            <button
              onClick={() => navigate('/family')}
              className="px-4 py-2 bg-primary-dark/30 hover:bg-primary-dark/50 border border-white/20 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Member
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* KPI Cards (2 columns on mobile screen) */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Reminders section */}
      {reminders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h4 className="font-extrabold text-sm m-0">Hygiene Reminders</h4>
            <span 
              onClick={() => navigate('/reminders')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              See all
            </span>
          </div>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <ReminderCard 
                key={reminder.id} 
                reminder={reminder} 
                onComplete={handleReminderComplete} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Scans module */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-extrabold text-sm m-0">Recent Activity</h4>
          <span 
            onClick={() => navigate('/history')}
            className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
          >
            History <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {stats.recentScans.length === 0 ? (
          <div className={`text-center py-8 border border-dashed rounded-2xl ${
            darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          }`}>
            <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-400">No scans recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentScans.slice(0, 3).map((scan) => (
              <div
                key={scan.id}
                onClick={() => navigate(`/scans/${scan.id}`)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{scan.memberName}</span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{scan.brand}</span>
                  </div>
                  <p className="text-[10px] font-bold text-primary mt-1">
                    Wear: {Math.round(scan.wearPercentage)}% | Health: {Math.round(scan.healthScore)}%
                  </p>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 uppercase tracking-wider ${getConditionColor(scan.condition)}`}>
                  {scan.condition.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
