import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sliders, Clock, Gauge, Calendar, AlertCircle } from 'lucide-react';

const ScanResultCard = ({ analysis, daysUsed, replacementDateStr }) => {
  const { darkMode } = useTheme();

  return (
    <div className="space-y-4 w-full">
      {/* Metrics Sliders */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
      }`}>
        <h4 className="font-bold text-sm mb-3.5 m-0 flex items-center gap-1.5">
          <Sliders className="w-4.5 h-4.5 text-primary" /> Bristle Diagnostic Breakdown
        </h4>

        <div className="space-y-4">
          {/* Spreading */}
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
              <span>Bristle Spreading</span>
              <span className={analysis.bristleSpreading > 35 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                {analysis.bristleSpreading}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${analysis.bristleSpreading}%` }}
              />
            </div>
          </div>

          {/* Bending */}
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
              <span>Bristle Bending</span>
              <span className={analysis.bristleBending > 30 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                {analysis.bristleBending}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all"
                style={{ width: `${analysis.bristleBending}%` }}
              />
            </div>
          </div>

          {/* Damage */}
          <div>
            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
              <span>Micro-Damage</span>
              <span className={analysis.bristleDamage > 30 ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                {analysis.bristleDamage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{ width: `${analysis.bristleDamage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid stats */}
      <div className={`p-4 rounded-2xl border grid grid-cols-3 gap-2.5 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
      }`}>
        <div className="flex flex-col items-center text-center">
          <Clock className="w-4 h-4 text-slate-400 mb-1" />
          <span className="text-[9px] uppercase font-bold text-slate-400">Used</span>
          <span className="text-xs font-bold mt-0.5">{daysUsed} Days</span>
        </div>

        <div className="flex flex-col items-center text-center border-x dark:border-slate-800 border-slate-100">
          <Gauge className="w-4 h-4 text-slate-400 mb-1" />
          <span className="text-[9px] uppercase font-bold text-slate-400">Remaining</span>
          <span className="text-xs font-bold mt-0.5">{analysis.remainingLifeDays} Days</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <Calendar className="w-4 h-4 text-slate-400 mb-1" />
          <span className="text-[9px] uppercase font-bold text-slate-400">Replace Date</span>
          <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{replacementDateStr.split(',')[0]}</span>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
      }`}>
        <h4 className="font-bold text-sm mb-2 m-0 flex items-center gap-1.5 text-primary">
          <AlertCircle className="w-4.5 h-4.5" /> AI Recommendation
        </h4>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-350 leading-relaxed mt-2 m-0">
          {analysis.aiRecommendation}
        </p>

        {analysis.detectedIssues.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-850">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Detected Flaws</p>
            <div className="space-y-1">
              {analysis.detectedIssues.map((issue, idx) => (
                <div key={idx} className="flex gap-1.5 items-center text-[10px] font-bold text-rose-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanResultCard;
