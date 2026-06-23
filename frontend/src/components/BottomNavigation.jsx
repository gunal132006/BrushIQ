import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Home, Users, Camera, BookOpen, User } from 'lucide-react';

const BottomNavigation = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Family', path: '/family', icon: Users },
    { name: 'Scan', path: '/scan', icon: Camera },
    { name: 'Tips', path: '/tips', icon: BookOpen },
    { name: 'Profile', path: '/settings', icon: User }
  ];

  return (
    <nav className={`sticky bottom-0 z-30 flex items-center justify-around w-full border-t py-2 shrink-0 pb-safe ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]'
    }`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-label={`Navigate to ${item.name}`}
          >
            <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'}`} />
            <span className={`text-[10px] font-bold mt-1 tracking-tight ${
              isActive ? 'text-primary font-extrabold' : 'text-slate-400 dark:text-slate-500'
            }`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
