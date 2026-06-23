import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardService } from '../services/api';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Moon, 
  Bell, 
  Activity, 
  ChevronRight, 
  LogOut,
  Info,
  FileText,
  X
} from 'lucide-react';
import { BookMarked } from 'lucide-react';


const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalToothbrushes: 0,
    recentScansCount: 0,
  });
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);


  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setStats({
          totalMembers: res.data.totalMembers,
          totalToothbrushes: res.data.totalToothbrushes,
          recentScansCount: res.data.recentScans ? res.data.recentScans.length : 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Profile info block */}
      <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-black shadow shadow-primary/20 mb-3">
          {user?.fullName?.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-bold m-0 leading-tight">{user?.fullName}</h3>
        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1.5">Primary Account</p>

        <div className="w-full space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-left text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 shrink-0 text-slate-400" />
            <span className="truncate">{user?.email || 'No email registered'}</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <Phone className="w-4 h-4 shrink-0 text-slate-400" />
            <span>{user?.phone || 'No phone registered'}</span>
          </div>
        </div>
      </div>

      {/* Simple stats bar */}
      <div className={`p-4 rounded-2xl border grid grid-cols-2 gap-4 text-center ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div>
          <p className="text-[9px] uppercase font-bold text-slate-400">Members</p>
          <p className="text-sm font-extrabold mt-0.5">{stats.totalMembers}</p>
        </div>
        <div className="border-l dark:border-slate-800 border-slate-100">
          <p className="text-[9px] uppercase font-bold text-slate-400">Brushes</p>
          <p className="text-sm font-extrabold mt-0.5">{stats.totalToothbrushes}</p>
        </div>
      </div>

      {/* Preferences List */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <h4 className="font-bold text-xs uppercase text-slate-400 mb-4 tracking-wider">Preferences</h4>

        <div className="space-y-4">
          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-none">Dark Mode</p>
                <p className="text-[9px] text-slate-400 mt-1">Adjust color schemes</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${
                darkMode ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform duration-200 ${
                darkMode ? 'translate-x-4.5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Reminders Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-850">
            <div className="flex gap-2.5 items-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-none">Hygiene Alerts</p>
                <p className="text-[9px] text-slate-400 mt-1">Toothbrush wear alerts</p>
              </div>
            </div>
            <button
              onClick={() => setRemindersEnabled(!remindersEnabled)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${
                remindersEnabled ? 'bg-primary' : 'bg-slate-300'
              }`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow transform transition-transform duration-200 ${
                remindersEnabled ? 'translate-x-4.5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security settings */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 tracking-wider">Account actions</h4>
        
        <button
          onClick={() => alert('Mock password recovery action.')}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-slate-450" />
            <span>Update Security Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-450" />
        </button>
      </div>

      {/* Information & Policies */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 tracking-wider">Information & Policies</h4>
        
        <div className="space-y-2">
          <button
            onClick={() => setActiveModal('about')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-slate-450" />
              <span>About BrushIQ</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-450" />
          </button>

          <button
            onClick={() => setActiveModal('privacy')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-slate-450" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-450" />
          </button>

          <button
            onClick={() => setActiveModal('terms')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-450" />
              <span>Terms & Conditions</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-450" />
          </button>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-500 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-100/40 dark:border-rose-900/30"
      >
        <LogOut className="w-4 h-4 stroke-[2.5px]" />
        Log Out Account
      </button>

      {/* Slide-over Policy Modals (Centered inside mockup container) */}
      {activeModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-5">
          <div className={`w-full max-w-[390px] max-h-[680px] rounded-2xl border p-5 shadow-2xl relative flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-950'
          }`}>
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-black mb-4 pr-6 leading-none capitalize">
              {activeModal === 'about' && 'About BrushIQ'}
              {activeModal === 'privacy' && 'Privacy Policy'}
              {activeModal === 'terms' && 'Terms & Conditions'}
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-3.5 text-left leading-relaxed">
              {activeModal === 'about' && (
                <>
                  <div className="flex flex-col items-center py-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-2xl shadow-md mb-2.5">
                      B
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">BrushIQ App</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Version 1.0.0 (Demo Mode Active)</span>
                  </div>
                  <p>
                    BrushIQ is an AI-powered toothbrush splay wear diagnostic platform. It leverages advanced computer vision logic to calculate bristle spreading, bending, and density parameters from captured images.
                  </p>
                  <p>
                    By providing quantitative health scores and linear degradation projections, BrushIQ helps household families optimize their brushing efficiency and replace brush heads precisely when their plaque removal efficiency drops below acceptable margins.
                  </p>
                  <p className="border-t border-slate-100 dark:border-slate-850 pt-3 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    Developers: BrushIQ Capstone Dev Team<br />
                    Release Reference: #BIQ-2026-V1.0
                  </p>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p className="font-bold text-slate-700 dark:text-slate-350">1. Data Minimization & Privacy</p>
                  <p>
                    Your oral hygiene privacy is central to our design. BrushIQ does not transmit raw toothbrush images outside your browser/device context. All classification calculations occur locally.
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-350">2. Metric Storage</p>
                  <p>
                    Calculated diagnostic reports (wear percentages, health indices, and next checkup dates) are stored in your localized database fallback or secure PostgreSQL hosting environment. We never sell or share metrics with third-party tracking networks.
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-350">3. Compliance</p>
                  <p>
                    All storage guidelines align with personal hygiene data standards and conform to localized privacy laws.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p className="font-bold text-slate-700 dark:text-slate-350">1. Advisory Disclaimers</p>
                  <p>
                    BrushIQ diagnostics are provided via computer vision simulation parameters. Wear scores represent toothbrush structural hygiene and do not substitute for clinical checks, gum evaluations, or orthodontic consultations.
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-350">2. Replacement Intervals</p>
                  <p>
                    While BrushIQ charts splay indices, clinical guidelines suggest replacing toothbrush heads at least once every 90 days, or immediately following recovery from bacterial/viral infections.
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-350">3. Usage Terms</p>
                  <p>
                    Tapping scan signifies agreement to capture images top-down in dry, well-illuminated environments to maximize bristle segment accuracy.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
            >
              Close Document
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSettings;
