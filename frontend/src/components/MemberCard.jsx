import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, Edit2, Trash2, Calendar } from 'lucide-react';

const MemberCard = ({ member, onEdit, onDelete, onClick }) => {
  const { darkMode } = useTheme();

  const getHealthColor = (score) => {
    if (!score) return 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500';
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30';
    if (score >= 50) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30';
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer ${
        darkMode ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Profile info left */}
        <div className="flex gap-3 items-center min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
            {member.profilePhotoUrl ? (
              <img 
                src={member.profilePhotoUrl} 
                alt={member.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '';
                }}
              />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          
          <div className="min-w-0">
            <h4 className="font-bold text-base truncate m-0 leading-tight flex items-center gap-1.5">
              {member.name}
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-black uppercase tracking-wider">
                {member.relationship}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mt-1 block">
              {member.age} yrs • {member.gender}
            </span>
          </div>
        </div>

        {/* Action buttons right */}
        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(member)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              darkMode 
                ? 'border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
            title="Edit Profile"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="p-2 rounded-lg border border-rose-100 dark:border-rose-950/20 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Delete Profile"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toothbrush and health status summary block */}
      <div className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
        darkMode ? 'bg-slate-950/40' : 'bg-slate-50/75'
      }`}>
        <div className="space-y-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 m-0">ACTIVE TOOTHBRUSH</p>
          <p className="font-bold truncate m-0 text-slate-700 dark:text-slate-350">
            {member.toothbrushBrand ? `${member.toothbrushBrand} ${member.toothbrushModel}` : 'No toothbrush assigned'}
          </p>
          {member.lastScanDate && (
            <p className="text-[9px] font-semibold text-slate-400 m-0 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Last scan: {new Date(member.lastScanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 m-0 mb-1">HEALTH SCORE</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getHealthColor(member.healthScore)}`}>
            {member.healthScore ? `${Math.round(member.healthScore)}%` : 'No Scans'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
