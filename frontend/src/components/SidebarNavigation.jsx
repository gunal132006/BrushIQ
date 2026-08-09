import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Home, Users, Camera, BookOpen, User, LogOut, Bell } from 'lucide-react';

const SidebarNavigation = () => {
  const { darkMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Family', path: '/family', icon: Users },
    { name: 'AI Scan', path: '/scan', icon: Camera },
    { name: 'Reminders', path: '/reminders', icon: Bell },
    { name: 'Tips', path: '/tips', icon: BookOpen },
    { name: 'Profile', path: '/settings', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r transition-colors duration-200 ${
      darkMode
        ? 'bg-[#0b0f19] border-slate-800 text-slate-100'
        : 'bg-white border-slate-100 text-slate-900'
    }`}>
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-inherit">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary/20 shrink-0">
          B
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-none m-0">
            BrushIQ
          </h1>
          <p className={`text-[10px] font-semibold mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            AI Oral Healthcare
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className={`text-[9px] font-black uppercase tracking-widest px-3 mb-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] cursor-pointer text-left ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : darkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
              aria-label={`Navigate to ${item.name}`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={`px-3 pb-5 pt-3 border-t border-inherit`}>
        {user && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 ${
            darkMode ? 'bg-slate-800/60' : 'bg-slate-50'
          }`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/25 shrink-0">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user.fullName}</p>
              <p className={`text-[10px] truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user.email || user.phone}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            darkMode
              ? 'text-slate-500 hover:bg-rose-900/20 hover:text-rose-400'
              : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SidebarNavigation;
