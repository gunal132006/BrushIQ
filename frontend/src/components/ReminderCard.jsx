import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Bell, Check, Calendar } from 'lucide-react';

const ReminderCard = ({ reminder, onComplete }) => {
  const { darkMode } = useTheme();

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Daily':
        return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30';
      case 'Every 3 Days':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
      case 'Weekly':
        return 'text-primary bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30';
      default:
        return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const options = { month: 'short', day: 'numeric' };
    
    // Check if date is today
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return d.toLocaleDateString('en-US', options);
  };

  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
    }`}>
      <div className="flex gap-3 items-start min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          reminder.type === 'Daily' 
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' 
            : reminder.type === 'Every 3 Days'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
            : 'bg-blue-50 dark:bg-blue-950/20 text-primary'
        }`}>
          <Bell className="w-4 h-4" />
        </div>
        
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 leading-none">
            <span className="text-xs font-extrabold">{reminder.memberName}</span>
            <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-[100px]">
              {reminder.toothbrushBrand}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${getBadgeClass(reminder.type)}`}>
              {reminder.type}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-350 mt-1.5 leading-normal">
            {reminder.message}
          </p>

          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-2">
            <Calendar className="w-3 h-3" />
            <span>Due: {formatDate(reminder.nextReminderDate)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete(reminder.id)}
        className="p-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-900/30 text-teal-500 hover:text-teal-600 rounded-xl transition-all cursor-pointer border border-teal-100 dark:border-teal-900/30 shrink-0"
        title="Check-off reminder"
      >
        <Check className="w-4 h-4 stroke-[3px]" />
      </button>
    </div>
  );
};

export default ReminderCard;
