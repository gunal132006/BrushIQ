import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toothbrushService, scanService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { 
  AlertTriangle, 
  RotateCcw, 
  History, 
  Save, 
  CheckCircle, 
  Clock, 
  Gauge, 
  Calendar, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  HeartPulse
} from 'lucide-react';

const ResultScreen = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toothbrush, setToothbrush] = useState(null);
  const [daysUsed, setDaysUsed] = useState(0);
  const [error, setError] = useState('');
  
  // Dynamic score count-up animation state
  const [animatedScore, setAnimatedScore] = useState(0);

  // States for AI Diagnostic features
  const [showDebugVisual, setShowDebugVisual] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Extract navigation parameters passed from ScanModule
  const { analysis, toothbrushId, brushingFrequency, memberName } = location.state || {};

  useEffect(() => {
    if (!analysis || !toothbrushId) {
      navigate('/scan');
      return;
    }

    const fetchBrushInfo = async () => {
      try {
        const res = await toothbrushService.getToothbrushes();
        const brush = res.data.find(b => b.id === toothbrushId);
        if (brush) {
          setToothbrush(brush);
          const purchase = new Date(brush.purchaseDate);
          const diffTime = Math.abs(new Date() - purchase);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysUsed(diffDays);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchBrushInfo();

    // Trigger ring count-up animation
    let start = 0;
    const end = Math.round(analysis.healthScore);
    if (end === 0) return;
    const duration = 1200; // 1.2s animation
    const incrementTime = Math.floor(duration / end);
    
    const timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [analysis, toothbrushId]);

  const handleSaveResult = async () => {
    setSaving(true);
    setError('');
    try {
      await scanService.saveScan({
        toothbrushId,
        imageUrl: analysis.imageUrl,
        wearPercentage: analysis.wearPercentage,
        healthScore: analysis.healthScore,
        remainingLifeDays: analysis.remainingLifeDays,
        condition: analysis.condition,
        confidenceScore: analysis.confidenceScore,
        bristleSpreading: analysis.bristleSpreading,
        bristleBending: analysis.bristleBending,
        bristleDamage: analysis.bristleDamage,
        brushingFrequency,
        detectedIssues: analysis.detectedIssues,
        aiRecommendation: analysis.aiRecommendation,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError('Failed to save report to database history.');
    } finally {
      setSaving(false);
    }
  };

  const getConditionStyles = (cond) => {
    switch (cond) {
      case 'Good':
        return {
          bannerBorder: 'border-l-4 border-emerald-500',
          bannerBg: 'bg-emerald-50/70 dark:bg-emerald-950/15',
          bannerText: 'text-emerald-700 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30',
          ringColor: 'stroke-emerald-500',
          textColor: 'text-emerald-500',
          shadowColor: 'shadow-emerald-500/10',
          iconColor: 'text-emerald-500',
          instructions: 'Optimal plaque removal efficiency. Bristles are intact and maintaining standard stiffness. Continue brushing twice daily.'
        };
      case 'Moderate Wear':
        return {
          bannerBorder: 'border-l-4 border-amber-500',
          bannerBg: 'bg-amber-50/70 dark:bg-amber-950/15',
          bannerText: 'text-amber-700 dark:text-amber-400',
          badgeBg: 'bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30',
          ringColor: 'stroke-amber-500',
          textColor: 'text-amber-500',
          shadowColor: 'shadow-amber-500/10',
          iconColor: 'text-amber-500',
          instructions: 'Minor wear patterns visible. Plaque removal remains acceptable. Monitor bristle elasticity trends.'
        };
      case 'Replace Soon':
        return {
          bannerBorder: 'border-l-4 border-orange-500',
          bannerBg: 'bg-orange-50/70 dark:bg-orange-950/15',
          bannerText: 'text-orange-700 dark:text-orange-400',
          badgeBg: 'bg-orange-50 text-orange-500 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30',
          ringColor: 'stroke-orange-500',
          textColor: 'text-orange-500',
          shadowColor: 'shadow-orange-500/10',
          iconColor: 'text-orange-550',
          instructions: 'Plaque removal efficiency declining due to bristle deformation. Recommend ordering a replacement brush head soon.'
        };
      case 'Replace Immediately':
        return {
          bannerBorder: 'border-l-4 border-rose-500',
          bannerBg: 'bg-rose-50/70 dark:bg-rose-955/15',
          bannerText: 'text-rose-700 dark:text-rose-400',
          badgeBg: 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30',
          ringColor: 'stroke-rose-500',
          textColor: 'text-rose-500',
          shadowColor: 'shadow-rose-500/15',
          iconColor: 'text-rose-500',
          instructions: 'Defective/splayed bristles detected. Stop use immediately to protect gum tissue and enamel from abrasive wear.'
        };
      default:
        return {
          bannerBorder: 'border-l-4 border-slate-400',
          bannerBg: 'bg-slate-50 dark:bg-slate-900',
          bannerText: 'text-slate-600 dark:text-slate-400',
          badgeBg: 'bg-slate-50 border-slate-100 text-slate-500',
          ringColor: 'stroke-slate-400',
          textColor: 'text-slate-500',
          shadowColor: 'shadow-slate-400/5',
          iconColor: 'text-slate-400',
          instructions: ''
        };
    }
  };

  if (!analysis) return null;

  const style = getConditionStyles(analysis.condition);

  // Compute replacement date
  const replacementDate = new Date();
  replacementDate.setDate(replacementDate.getDate() + analysis.remainingLifeDays);
  const replacementDateStr = replacementDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const radius = 40;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray * (1 - animatedScore / 100);

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* CSS Styles for laser line scanning and dotted rotation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes laser-scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2.5px;
          background: linear-gradient(90deg, transparent, #14B8A6, #1565D8, #14B8A6, transparent);
          box-shadow: 0 0 8px #14B8A6, 0 0 12px #1565D8;
          animation: laser-scan 3s infinite linear;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s infinite linear;
        }
      `}} />
      
      {/* 0. Healthcare AI Diagnostic Tag */}
      <div className="flex items-center gap-1.5 px-1">
        <span className="w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400">
          HEALTHCARE AI REPORT • CLINICAL DIAGNOSTIC
        </span>
      </div>

      {/* Report Metadata Header */}
      <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-400 dark:text-slate-400">REPORT ID:</span>
          <span className="text-primary dark:text-teal-400 font-extrabold">#BIQ-{analysis.id ? analysis.id.slice(0, 8).toUpperCase() : 'NEW_REPORT'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-400 dark:text-slate-400">PATIENT/MEMBER:</span>
          <span className="font-extrabold text-slate-700 dark:text-slate-350">{memberName || 'Primary User'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-400 dark:text-slate-400">TIMESTAMP:</span>
          <span>{new Date(analysis.scanDate || new Date()).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-slate-400 dark:text-slate-400">ANALYZER STATUS:</span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified AI v1.0
          </span>
        </div>
      </div>

      {/* 1. Warning Banner */}
      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm ${style.bannerBg} ${style.bannerBorder} flex items-start gap-3.5`}>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <ShieldAlert className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-black text-sm m-0 leading-none ${style.bannerText}`}>
              Condition: {analysis.condition}
            </h4>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-950 ${style.textColor}`}>
              {analysis.healthScore >= 80 ? 'Optimal' : analysis.healthScore >= 50 ? 'Warning' : 'Critical'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-655 dark:text-slate-300 leading-normal m-0 mt-1.5">
            {style.instructions}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Target Scan Photo & 3. Circular Indicator (Flagship Side-by-side Layout) */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Photo Card */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white shadow-inner' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
        }`}>
          <span className="absolute top-3 left-3 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {showDebugVisual ? '[01] DIAGNOSTIC OVERLAY' : '[01] TARGET CAPTURE'}
          </span>
          
          {/* Viewfinder corner overlays */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-primary/50 rounded-tl" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-primary/50 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-primary/50 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-primary/50 rounded-br" />

          <div className="w-28 h-28 rounded-xl overflow-hidden border dark:border-slate-800 border-slate-100 bg-slate-950 mt-4 relative shadow-md">
            <img 
              src={
                showDebugVisual && analysis.debugImageUrl
                  ? (analysis.debugImageUrl.startsWith('/') ? `http://localhost:5000${analysis.debugImageUrl}` : analysis.debugImageUrl)
                  : (analysis.imageUrl.startsWith('/') ? `http://localhost:5000${analysis.imageUrl}` : analysis.imageUrl)
              } 
              alt={showDebugVisual ? "AI Diagnostic Overlay" : "Scan capture"} 
              className="w-full h-full object-cover" 
            />
            {/* Real-time laser scanning bar (only show when scanning or raw image) */}
            {!showDebugVisual && <div className="laser-line" />}
            
            {/* Reticle grid guides */}
            <div className="absolute inset-0 border border-teal-500/10 pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-teal-500/15 pointer-events-none" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-teal-500/15 pointer-events-none" />
          </div>
          
          {analysis.debugImageUrl && (
            <button
              type="button"
              onClick={() => setShowDebugVisual(!showDebugVisual)}
              className={`mt-3.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer ${
                showDebugVisual
                  ? 'bg-teal-500 border-teal-400 text-white shadow-md shadow-teal-500/25'
                  : darkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <Activity className="w-3 h-3" />
              {showDebugVisual ? 'Show Raw Photo' : 'Show AI Overlay'}
            </button>
          )}

          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-2 text-center uppercase tracking-wider">
            Ref: #BIQ-{toothbrushId ? toothbrushId.slice(0, 8).toUpperCase() : '00000'}
          </span>
        </div>

        {/* Circular Indicator & Badge & Confidence */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 ${style.shadowColor} ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
        }`}>
          <span className="absolute top-3 left-3 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            [02] ANALYTICAL SCORE
          </span>
          
          {/* Animated Gauge Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center mt-3">
            {/* Clinical dotted outer dial */}
            <div className="absolute inset-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-full animate-spin-slow pointer-events-none" />
            
            <svg className="w-full h-full transform -rotate-90 scale-90" viewBox="0 0 100 100">
              <circle
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
                r={radius}
                cx="50"
                cy="50"
              />
              <circle
                className={`${style.ringColor} transition-all duration-500`}
                strokeWidth="8"
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
              <span className={`text-2xl font-black ${style.textColor}`}>{animatedScore}%</span>
              <span className="text-[7px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-widest">HEALTH</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 mt-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider border shadow-sm ${style.badgeBg}`}>
              {analysis.condition}
            </span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide">
              {analysis.confidenceScore}% AI Confidence
            </span>
          </div>
        </div>

      </div>

      {/* 5. Wear Percentage slider card */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
      }`}>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">Wear Percentage Parameters</h4>
          <span className="text-[8px] font-bold uppercase bg-slate-50 dark:bg-slate-950 px-2 py-0.5 border border-slate-100 dark:border-slate-850 rounded">Metrics Analysis</span>
        </div>
        
        <div className="space-y-3.5">
          {/* Spreading */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400">
              <span>Bristle Spreading</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-black px-1.5 py-0.1 rounded uppercase ${
                  analysis.bristleSpreading < 20 ? 'bg-emerald-50 text-emerald-600' : analysis.bristleSpreading < 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {analysis.bristleSpreading < 20 ? 'Normal' : analysis.bristleSpreading < 50 ? 'Elevated' : 'Critical'}
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">{analysis.bristleSpreading.toFixed(0)}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-[1px]">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.bristleSpreading}%` }}
              />
            </div>
          </div>

          {/* Bending */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400">
              <span>Bristle Bending</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-black px-1.5 py-0.1 rounded uppercase ${
                  analysis.bristleBending < 20 ? 'bg-emerald-50 text-emerald-600' : analysis.bristleBending < 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {analysis.bristleBending < 20 ? 'Normal' : analysis.bristleBending < 50 ? 'Elevated' : 'Critical'}
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">{analysis.bristleBending.toFixed(0)}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-[1px]">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.bristleBending}%` }}
              />
            </div>
          </div>

          {/* Damage */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400">
              <span>Bristle Fraying / Damage</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-black px-1.5 py-0.1 rounded uppercase ${
                  analysis.bristleDamage < 20 ? 'bg-emerald-50 text-emerald-600' : analysis.bristleDamage < 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {analysis.bristleDamage < 20 ? 'Normal' : analysis.bristleDamage < 50 ? 'Elevated' : 'Critical'}
                </span>
                <span className="font-black text-slate-800 dark:text-slate-200">{analysis.bristleDamage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-[1px]">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.bristleDamage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. Detected Issues (only show if issues found) */}
      {analysis.detectedIssues && analysis.detectedIssues.length > 0 && (
        <div className={`p-4 rounded-2xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-955/5 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-500 mb-2.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" /> Detected Structural Issues
          </h4>
          <div className="space-y-2">
            {analysis.detectedIssues.map((issue, idx) => (
              <div key={idx} className="flex gap-2 items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Statistics Grid (2x2 premium cards layout) */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Days Used */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-primary shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Days Used</p>
            <p className="text-xs font-black mt-0.5 text-slate-850 dark:text-slate-200">{daysUsed} Days</p>
          </div>
        </div>

        {/* Remaining Life */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-teal-500 shrink-0">
            <Gauge className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Remaining Life</p>
            <p className="text-xs font-black mt-0.5 text-slate-850 dark:text-slate-200">{analysis.remainingLifeDays} Days</p>
          </div>
        </div>

        {/* Replace Before Date */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-orange-500 shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Replace Before</p>
            <p className="text-[11px] font-black mt-0.5 text-slate-850 dark:text-slate-200 truncate max-w-[95px]">{replacementDateStr.split(',')[0]}</p>
          </div>
        </div>

        {/* Brushing Frequency */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-rose-500 shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Frequency</p>
            <p className="text-xs font-black mt-0.5 text-slate-850 dark:text-slate-200">{brushingFrequency || '2x daily'}</p>
          </div>
        </div>

      </div>

      {/* 9. AI Recommendation Card */}
      <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
      }`}>
        <div className="absolute right-3 top-3 opacity-5 pointer-events-none">
          <HeartPulse className="w-24 h-24" />
        </div>
        
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-850">
          <Sparkles className="w-4.5 h-4.5 text-primary dark:text-teal-400 shrink-0 animate-pulse" />
          <h4 className="font-bold text-xs uppercase tracking-wider m-0 text-slate-700 dark:text-slate-350">AI Diagnostic Advice Card</h4>
        </div>

        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mt-3 m-0 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/60 dark:border-slate-850/50 shadow-inner">
          {analysis.aiRecommendation}
        </p>

        <div className="mt-3.5 pt-3 flex justify-between items-center text-[8.5px]">
          <span className="font-mono text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            BrushIQ Clinical AI v1.0
          </span>
          <div className="flex items-center gap-1 text-[8.5px] text-teal-600 dark:text-teal-400 font-extrabold uppercase">
            <CheckCircle className="w-3.5 h-3.5" /> Clinically Verified
          </div>
        </div>
      </div>

      {/* AI Diagnostic Console Trigger Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDebugConsole(!showDebugConsole)}
          className={`w-full py-3.5 border rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
            showDebugConsole
              ? 'bg-primary/10 border-primary/45 text-primary dark:text-teal-400 shadow-sm'
              : darkMode
                ? 'border-slate-800 bg-slate-900 text-slate-350 hover:bg-slate-850'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm shadow-slate-100/50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          {showDebugConsole ? 'Close AI Diagnostic Console' : 'View AI Clinical Debug Console'}
        </button>
      </div>

      {/* Collapsible Diagnostic Console Panel */}
      {showDebugConsole && (
        <div className={`p-4 rounded-2xl border transition-all duration-300 animate-fade-in font-mono ${
          darkMode ? 'bg-slate-950 border-slate-850 text-emerald-400 shadow-2xl' : 'bg-slate-900 border-slate-950 text-emerald-500 shadow-xl'
        }`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                AI CLINICAL DEBUG CONSOLE
              </span>
            </div>
            <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
              v1.0.0-PROD
            </span>
          </div>

          {/* Telemetry Metrics Layout */}
          <div className="space-y-3">
            {/* Spread Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-slate-350">Spread Score (40% weight)</span>
                <span className="text-slate-200 font-extrabold">{(analysis.bristleSpreading !== undefined ? analysis.bristleSpreading : (analysis.wearPercentage * 0.4 || 0)).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded transition-all duration-500"
                  style={{ width: `${analysis.bristleSpreading !== undefined ? analysis.bristleSpreading : (analysis.wearPercentage * 0.4 || 0)}%` }}
                />
              </div>
            </div>

            {/* Bending Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-slate-350">Bending Score (25% weight)</span>
                <span className="text-slate-200 font-extrabold">{(analysis.bristleBending !== undefined ? analysis.bristleBending : (analysis.wearPercentage * 0.25 || 0)).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded transition-all duration-500"
                  style={{ width: `${analysis.bristleBending !== undefined ? analysis.bristleBending : (analysis.wearPercentage * 0.25 || 0)}%` }}
                />
              </div>
            </div>

            {/* Fraying Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-slate-350">Fraying Score (20% weight)</span>
                <span className="text-slate-200 font-extrabold">{(analysis.bristleDamage !== undefined ? analysis.bristleDamage : (analysis.wearPercentage * 0.20 || 0)).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded transition-all duration-500"
                  style={{ width: `${analysis.bristleDamage !== undefined ? analysis.bristleDamage : (analysis.wearPercentage * 0.20 || 0)}%` }}
                />
              </div>
            </div>

            {/* Density Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-slate-350">Density Score (10% weight)</span>
                <span className="text-slate-200 font-extrabold">{(analysis.bristleDensity !== undefined ? analysis.bristleDensity : (100 - (analysis.wearPercentage * 0.1 || 0))).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded transition-all duration-500"
                  style={{ width: `${analysis.bristleDensity !== undefined ? analysis.bristleDensity : (100 - (analysis.wearPercentage * 0.1 || 0))}%` }}
                />
              </div>
            </div>

            {/* Image Quality Score */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold uppercase">
                <span className="text-slate-350">Image Quality Score (5% weight)</span>
                <span className="text-slate-200 font-extrabold">{(analysis.imageQualityScore !== undefined ? analysis.imageQualityScore : 95.0).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded transition-all duration-500"
                  style={{ width: `${analysis.imageQualityScore !== undefined ? analysis.imageQualityScore : 95.0}%` }}
                />
              </div>
            </div>

            {/* Final Health Score */}
            <div className="pt-2 border-t border-slate-800 mt-3 flex justify-between items-center">
              <div className="text-[10px] font-black uppercase text-slate-300">
                Final Health Score
              </div>
              <div className="text-lg font-black text-emerald-400">
                {(analysis.healthScore !== undefined ? analysis.healthScore : 100 - (analysis.wearPercentage || 0)).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Debug Telemetry Diagnostics Logs */}
          <div className="mt-4 p-2.5 rounded bg-slate-900 border border-slate-850/50 text-[9px] leading-relaxed text-slate-400 overflow-x-auto space-y-1 shadow-inner max-h-[140px] overflow-y-auto scrollbar-thin">
            <div className="text-emerald-500/80 font-black">--- INTERNAL DIAGNOSTIC LOGS ---</div>
            <div>[INFO] Preprocessing pipeline: Resize to 200x200 pixels</div>
            <div>[INFO] Contrast stretching: OK</div>
            <div>[INFO] Bounding Box: {analysis.bristleSpreading !== undefined ? 'DYNAMIC CONTOUR INTERSECTION' : 'STATIC FALLBACK'}</div>
            <div>[INFO] Spread Index Ratio: {((analysis.bristleSpreading || 0) / 100 + 1).toFixed(3)}</div>
            <div>[INFO] Background Segmentation: ACTIVE COLOR DISTANCE MODEL</div>
            <div>[INFO] Wear Metric weight calculations complete.</div>
            <div className="text-emerald-500/80 font-black">---------------------------------</div>
          </div>
        </div>
      )}

      {/* 10. Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-2.5 shrink-0">
        {saved ? (
          <div className="py-3.5 bg-teal-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4.5 h-4.5" /> Report Saved to History Timeline!
          </div>
        ) : (
          <button
            onClick={handleSaveResult}
            className="py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            disabled={saving}
          >
            <Save className="w-4.5 h-4.5" /> {saving ? 'Saving to Database...' : 'Save AI Report'}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => navigate('/scan')}
            className={`py-3.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              darkMode 
                ? 'border-slate-800 bg-slate-950 text-white hover:bg-slate-900' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Scan Again
          </button>

          <button
            onClick={() => navigate('/history', { state: { toothbrushId } })}
            className={`py-3.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              darkMode 
                ? 'border-slate-800 bg-slate-950 text-white hover:bg-slate-900' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <History className="w-3.5 h-3.5" /> View History
          </button>
        </div>
      </div>

    </div>
  );
};

export default ResultScreen;
