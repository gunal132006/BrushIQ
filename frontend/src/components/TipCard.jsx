import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Heart, ArrowRight } from 'lucide-react';

const TipCard = ({ tip, isBookmarked, onToggleBookmark, onReadMore }) => {
  const { darkMode } = useTheme();

  return (
    <div 
      onClick={onReadMore}
      className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
      }`}
    >
      {/* Top Illustration Banner */}
      <div className="relative w-full h-40 bg-gradient-to-br from-primary/10 to-teal-400/5 overflow-hidden">
        {tip.illustrationUrl ? (
          <img 
            src={tip.illustrationUrl} 
            alt={tip.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-teal-500 flex items-center justify-center">
            <span className="text-white text-3xl font-black opacity-30">BrushIQ</span>
          </div>
        )}

        {/* Category Pill Tag */}
        <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-primary text-white shadow shadow-primary/20">
          {tip.category}
        </span>

        {/* Floating Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent opening read more
            onToggleBookmark(tip);
          }}
          className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center shadow backdrop-blur-sm transition-colors cursor-pointer ${
            darkMode 
              ? 'bg-slate-950/60 hover:bg-slate-950 text-slate-400' 
              : 'bg-white/80 hover:bg-white text-slate-500'
          }`}
        >
          <Heart 
            className={`w-4.5 h-4.5 transition-colors ${
              isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-rose-500'
            }`} 
          />
        </button>
      </div>

      {/* Card Details area */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-2">
        <div>
          <h4 className="font-black text-sm leading-snug m-0 line-clamp-1">{tip.title}</h4>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 leading-normal line-clamp-2">
            {tip.content}
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 dark:border-slate-850 mt-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-primary">Read Article</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default TipCard;
