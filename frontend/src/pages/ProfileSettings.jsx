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
  const { user, logout, changePassword } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalToothbrushes: 0,
    recentScansCount: 0,
  });
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);


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

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return setPasswordMsg({ type: 'error', text: 'Please fill in both fields.' });
    }
    setPasswordMsg({ type: '', text: '' });
    setPasswordLoading(true);
    try {
      const msg = await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: msg || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Profile info block */}
      <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-black shadow shadow-primary/20 mb-3">
          {user?.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <h3 className="text-base font-bold m-0 leading-tight">{user?.fullName || 'User Profile'}</h3>
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
          onClick={() => {
            setPasswordMsg({ type: '', text: '' });
            setActiveModal('password');
          }}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left cursor-pointer"
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
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-slate-450" />
              <span>About BrushIQ</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-450" />
          </button>

          <button
            onClick={() => setActiveModal('privacy')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-slate-450" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-450" />
          </button>

          <button
            onClick={() => setActiveModal('terms')}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-850 hover:border-primary text-xs font-bold transition-all text-left cursor-pointer"
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
        className="w-full py-3.5 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 font-extrabold text-xs rounded-2xl transition-all duration-200 active:scale-[0.98] border border-rose-100 dark:border-rose-900/40 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        <LogOut className="w-4 h-4 stroke-[2.5px]" />
        Log Out Account
      </button>

      {/* Slide-over Policy & Password Modals */}
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
              {activeModal === 'password' && 'Update Password'}
              {activeModal === 'about' && 'About BrushIQ'}
              {activeModal === 'privacy' && 'Privacy Policy'}
              {activeModal === 'terms' && 'Terms & Conditions'}
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-3.5 text-left leading-relaxed">
              {activeModal === 'password' && (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  {passwordMsg.text && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${
                      passwordMsg.type === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full p-2.5 rounded-xl border outline-none font-semibold text-xs ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                      disabled={passwordLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="•••••••• (Min 6 chars)"
                      className={`w-full p-2.5 rounded-xl border outline-none font-semibold text-xs ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                      disabled={passwordLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow cursor-pointer disabled:opacity-50"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              {activeModal === 'about' && (
                <>
                  <div className="flex flex-col items-center py-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-2xl shadow-md mb-2.5">
                      B
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">BrushIQ SaaS</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Version 1.0.0 Production</span>
                  </div>
                  <p>
                    BrushIQ is an AI-powered oral healthcare platform. It provides quantitative bristle degradation analytics from uploaded images to help users optimize brushing hygiene.
                  </p>
                  <p className="border-t border-slate-100 dark:border-slate-850 pt-3 font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    Engineered for Production SaaS environment.<br />
                    Platform Reference: #BIQ-2026-PROD
                  </p>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p className="font-bold text-slate-700 dark:text-slate-350">1. Privacy First Architecture</p>
                  <p>
                    BrushIQ ensures all personal data and uploaded scans are securely handled with encrypted JWT auth and database isolation.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p className="font-bold text-slate-700 dark:text-slate-350">1. Usage Policy</p>
                  <p>
                    BrushIQ recommendations supplement routine dental care and hygiene maintenance.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-extrabold text-xs uppercase tracking-wider shadow cursor-pointer transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSettings;
