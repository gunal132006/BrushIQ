import React from 'react';
import { Sparkles } from 'lucide-react';

const SplashScreen = ({ progressMessage = 'Loading BrushIQ Workspace...' }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
      {/* Centered Mobile Container Mockup */}
      <div className="relative max-w-[480px] w-full min-h-screen md:min-h-[850px] md:h-[850px] flex flex-col items-center justify-between p-6 bg-[#0b0f19] border-x border-slate-900 shadow-[#000000_0px_25px_50px_-12px] md:rounded-[36px] overflow-hidden">
        
        {/* Decorative ambient blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-60 h-60 rounded-full bg-secondary/5 blur-[60px] pointer-events-none" />

        {/* Empty top spacing */}
        <div className="h-24" />

        {/* Logo and Titles */}
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
          <div className="relative mb-6 flex items-center justify-center">
            {/* Pulsing glow rings */}
            <div className="absolute w-24 h-24 rounded-3xl bg-primary/20 animate-ping opacity-75" />
            <div className="absolute w-20 h-20 rounded-3xl bg-secondary/10 animate-pulse" />
            
            {/* Centered primary brand container */}
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-primary/30 border border-white/10 scale-105 transition-transform duration-500">
              <Sparkles className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white m-0">
            Brush<span className="bg-gradient-to-r from-teal-400 to-primary bg-clip-text text-transparent">IQ</span>
          </h1>
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 m-0">
            AI-POWERED ORAL HEALTHCARE
          </p>
          
          <p className="text-xs text-slate-400 max-w-xs mt-4 leading-relaxed font-semibold px-4">
            Computer vision diagnosis, splay wear mapping, and clinical hygiene recommendations.
          </p>
        </div>

        {/* Footer loading progress */}
        <div className="w-full flex flex-col items-center gap-3 shrink-0 pb-12 z-10">
          <div className="w-36 bg-slate-900 h-1.5 rounded-full overflow-hidden p-[1px] border border-slate-800">
            <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full animate-[loading-bar_1.8s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider animate-pulse">
            {progressMessage}
          </p>
        </div>

        {/* CSS Keyframe for the sliding loading bar */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(100%); }
          }
        `}} />

      </div>
    </div>
  );
};

export default SplashScreen;
