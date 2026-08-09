import React from 'react';
import { Sparkles } from 'lucide-react';

const SplashScreen = ({ progressMessage = 'Loading BrushIQ Workspace...' }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0f19] relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-secondary/5 blur-[80px] pointer-events-none" />

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center text-center z-10 px-6">
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-3xl bg-primary/20 animate-ping opacity-75" />
          <div className="absolute w-20 h-20 rounded-3xl bg-secondary/10 animate-pulse" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-primary/30 border border-white/10">
            <Sparkles className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white m-0">
          Brush<span className="bg-gradient-to-r from-teal-400 to-primary bg-clip-text text-transparent">IQ</span>
        </h1>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-4">
          AI-Powered Oral Healthcare
        </p>

        <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-semibold mb-8">
          Computer vision diagnosis, splay wear mapping, and clinical hygiene recommendations.
        </p>

        <div className="flex flex-col items-center gap-3">
          <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
              style={{ width: '60%', animation: 'loading-bar 1.8s ease-in-out infinite' }}
            />
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider animate-pulse">
            {progressMessage}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
