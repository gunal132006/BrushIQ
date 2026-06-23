import React from 'react';
import { useTheme } from '../context/ThemeContext';

const HealthScoreCard = ({ healthScore, condition, confidenceScore }) => {
  const { darkMode } = useTheme();

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'Good':
        return {
          ring: 'stroke-emerald-500',
          text: 'text-emerald-500',
          bg: 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
        };
      case 'Moderate Wear':
        return {
          ring: 'stroke-amber-500',
          text: 'text-amber-500',
          bg: 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
        };
      case 'Replace Soon':
        return {
          ring: 'stroke-orange-500',
          text: 'text-orange-500',
          bg: 'bg-orange-50 text-orange-500 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30'
        };
      case 'Replace Immediately':
        return {
          ring: 'stroke-rose-500',
          text: 'text-rose-500',
          bg: 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30'
        };
      default:
        return {
          ring: 'stroke-slate-400',
          text: 'text-slate-500',
          bg: 'bg-slate-50 border-slate-100 text-slate-500'
        };
    }
  };

  const style = getConditionColor(condition);
  const radius = 40;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray * (1 - healthScore / 100);

  return (
    <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
    }`}>
      <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4">Overall Score</p>
      
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="7"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={`${style.ring} transition-all duration-500`}
            strokeWidth="7"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-black ${style.text}`}>{Math.round(healthScore)}</span>
          <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-widest">Health</span>
        </div>
      </div>

      <span className={`px-3 py-1 border rounded-full text-xs font-extrabold mt-4 uppercase ${style.bg}`}>
        {condition}
      </span>

      {confidenceScore && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-semibold">
          AI Confidence: <span className="text-slate-500 dark:text-slate-400 font-bold">{confidenceScore}%</span>
        </p>
      )}
    </div>
  );
};

export default HealthScoreCard;
