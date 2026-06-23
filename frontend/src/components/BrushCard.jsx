import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Edit2, Trash2, Calendar, User } from 'lucide-react';

const BrushCard = ({ brush, onEdit, onDelete }) => {
  const { darkMode } = useTheme();

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
    }`}>
      <div>
        <div className="flex justify-between items-center">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
            darkMode ? 'bg-slate-850 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            {brush.type}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            <User className="w-3 h-3" />
            <span>{brush.memberName}</span>
          </div>
        </div>

        <h3 className="text-base font-bold mt-2.5 m-0 leading-tight">
          {brush.brand} <span className="font-semibold text-slate-450">{brush.model}</span>
        </h3>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Color:</span>
          <span 
            className="w-3.5 h-3.5 rounded-full border border-slate-200/50 inline-block shadow-sm"
            style={{ backgroundColor: brush.color.toLowerCase() }}
            title={brush.color}
          />
          <span className="text-xs font-semibold text-slate-500">{brush.color}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850 mt-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(brush.purchaseDate)}</span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(brush)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              darkMode 
                ? 'border-slate-850 hover:bg-slate-800 text-slate-400' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-500'
            }`}
            title="Edit Brush"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(brush.id)}
            className="p-1.5 rounded-lg border border-rose-100 dark:border-rose-950/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Remove Brush"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrushCard;
