import React from 'react';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ title, value, icon: Icon, iconColorClass = 'text-primary bg-primary/10', footerText }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
    }`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black tracking-tight">{value}</h3>
        {footerText && (
          <p className="text-[10px] font-bold text-slate-400 mt-1">{footerText}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconColorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatCard;
