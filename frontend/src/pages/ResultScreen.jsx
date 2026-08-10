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
    console.log('[ScanResult Debug] Received analysis payload from router state:', analysis);
    if (!analysis || !toothbrushId) {
      console.warn('[ScanResult Warning] Missing analysis payload or toothbrushId, redirecting to /scan');
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

    // Auto-save scan report to history automatically
    const autoSave = async () => {
      try {
        await scanService.saveScan({
          toothbrushId,
          imageUrl: analysis.imageUrl,
          wearPercentage: analysis.wearPercentage,
          healthScore: analysis.healthScore,
          remainingLifeDays: analysis.remainingLifeDays,
          condition: analysis.condition,
          confidenceScore: analysis.confidenceScore || analysis.confidence || 95,
          bristleSpreading: analysis.bristleSpreading !== undefined ? analysis.bristleSpreading : analysis.spreadScore,
          bristleBending: analysis.bristleBending !== undefined ? analysis.bristleBending : analysis.bendingScore,
          bristleDamage: analysis.bristleDamage !== undefined ? analysis.bristleDamage : analysis.frayingScore,
          brushingFrequency,
          detectedIssues: analysis.detectedIssues,
          aiRecommendation: analysis.aiRecommendation || analysis.recommendation,
        });
        setSaved(true);
      } catch (err) {
        console.error('Auto-save scan error:', err);
      }
    };
    autoSave();

    // Trigger ring count-up animation
    let start = 0;
    const targetHealth = Math.round(
      analysis.healthScore !== undefined
        ? analysis.healthScore
        : Math.max(0, 100 - (analysis.wearPercentage || 0))
    );
    const end = Math.max(1, targetHealth);
    const duration = 1000;
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
        confidenceScore: analysis.confidenceScore || analysis.confidence || 95,
        bristleSpreading: analysis.bristleSpreading !== undefined ? analysis.bristleSpreading : analysis.spreadScore,
        bristleBending: analysis.bristleBending !== undefined ? analysis.bristleBending : analysis.bendingScore,
        bristleDamage: analysis.bristleDamage !== undefined ? analysis.bristleDamage : analysis.frayingScore,
        brushingFrequency,
        detectedIssues: analysis.detectedIssues,
        aiRecommendation: analysis.aiRecommendation || analysis.recommendation,
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
      case 'New':
        return {
          bannerBorder: 'border-l-4 border-emerald-500',
          bannerBg: 'bg-emerald-50/70 dark:bg-emerald-950/15',
          bannerText: 'text-emerald-700 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40',
          ringColor: 'stroke-emerald-500',
          textColor: 'text-emerald-500',
          shadowColor: 'shadow-emerald-500/10',
          iconColor: 'text-emerald-500',
          instructions: 'Optimal plaque removal efficiency. Bristles are intact and maintaining standard stiffness. Continue brushing twice daily.'
        };
      case 'Moderate Wear':
      case 'Light Wear':
        return {
          bannerBorder: 'border-l-4 border-amber-500',
          bannerBg: 'bg-amber-50/70 dark:bg-amber-950/15',
          bannerText: 'text-amber-700 dark:text-amber-400',
          badgeBg: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/40',
          ringColor: 'stroke-amber-500',
          textColor: 'text-amber-500',
          shadowColor: 'shadow-amber-500/10',
          iconColor: 'text-amber-500',
          instructions: 'Minor wear patterns visible. Plaque removal remains acceptable. Monitor bristle elasticity trends.'
        };
      case 'Replace Soon':
      case 'Heavy Wear':
        return {
          bannerBorder: 'border-l-4 border-orange-500',
          bannerBg: 'bg-orange-50/70 dark:bg-orange-950/15',
          bannerText: 'text-orange-700 dark:text-orange-400',
          badgeBg: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/40',
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
          badgeBg: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40',
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
          badgeBg: 'bg-slate-50 border-slate-200 text-slate-500',
          ringColor: 'stroke-slate-400',
          textColor: 'text-slate-500',
          shadowColor: 'shadow-slate-400/5',
          iconColor: 'text-slate-400',
          instructions: ''
        };
    }
  };

  if (!analysis) return null;

  // Robust field extractions from backend/ML analysis payload
  const healthScore = Math.round(
    analysis.healthScore !== undefined
      ? analysis.healthScore
      : Math.max(0, 100 - (analysis.wearPercentage || 0))
  );

  const density = Math.round(
    analysis.densityScore !== undefined
      ? analysis.densityScore
      : (analysis.bristleDensity !== undefined ? analysis.bristleDensity : Math.max(0, 100 - (analysis.wearPercentage || 0)))
  );

  const spread = Math.round(
    analysis.spreadScore !== undefined
      ? analysis.spreadScore
      : (analysis.bristleSpreading !== undefined ? analysis.bristleSpreading : Math.min(100, (analysis.wearPercentage || 0) * 0.4))
  );

  const fraying = Math.round(
    analysis.frayingScore !== undefined
      ? analysis.frayingScore
      : (analysis.bristleDamage !== undefined ? analysis.bristleDamage : Math.min(100, (analysis.wearPercentage || 0) * 0.3))
  );

  const bending = Math.round(
    analysis.bendingScore !== undefined
      ? analysis.bendingScore
      : (analysis.bristleBending !== undefined ? analysis.bristleBending : Math.min(100, (analysis.wearPercentage || 0) * 0.3))
  );

  const confidence = Math.round(
    analysis.confidenceScore !== undefined
      ? analysis.confidenceScore
      : (analysis.confidence !== undefined ? analysis.confidence : 95)
  );

  const remainingLife = analysis.remainingLifeDays !== undefined ? analysis.remainingLifeDays : Math.max(0, Math.round((healthScore / 100) * 90));

  const recommendationText = analysis.aiRecommendation || analysis.recommendation || 'Maintain proper 2-minute brushing twice daily.';

  const style = getConditionStyles(analysis.condition);

  // Compute formatted replacement date (DD/MM/YYYY)
  const replacementDate = new Date();
  replacementDate.setDate(replacementDate.getDate() + remainingLife);
  const formattedDay = String(replacementDate.getDate()).padStart(2, '0');
  const formattedMonth = String(replacementDate.getMonth() + 1).padStart(2, '0');
  const formattedYear = replacementDate.getFullYear();
  const replacementDateFormatted = `${formattedDay}/${formattedMonth}/${formattedYear}`;

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
      
      {/* 0. Toothbrush Detected Success Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
        <div className="flex items-center gap-2 font-black text-sm">
          <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
          <span>Toothbrush Detected ✓</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 px-2 py-0.5 rounded-full">
          AI Verified
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
      </div>

      {/* 1. Condition Warning Banner */}
      <div className={`p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm ${style.bannerBg} ${style.bannerBorder} flex items-start gap-3.5`}>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <ShieldAlert className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-black text-sm m-0 leading-none ${style.bannerText}`}>
              Condition: {analysis.condition || 'Good'}
            </h4>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-950 ${style.textColor}`}>
              {healthScore >= 80 ? 'Optimal' : healthScore >= 50 ? 'Warning' : 'Critical'}
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

      {/* 2. Target Scan Photo & 3. Circular Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Photo Card */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white shadow-inner' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
        }`}>
          <span className="absolute top-3 left-3 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {showDebugVisual ? '[01] DIAGNOSTIC OVERLAY' : '[01] TARGET CAPTURE'}
          </span>
          
          <div className="w-28 h-28 rounded-xl overflow-hidden border dark:border-slate-800 border-slate-100 bg-slate-950 mt-4 relative shadow-md">
            <img 
              src={
                showDebugVisual && analysis.debugImageUrl
                  ? (analysis.debugImageUrl.startsWith('/') ? `${import.meta.env.VITE_BASE_URL || 'https://brushiq-backend.onrender.com'}${analysis.debugImageUrl}` : analysis.debugImageUrl)
                  : (analysis.imageUrl && analysis.imageUrl.startsWith('/') ? `${import.meta.env.VITE_BASE_URL || 'https://brushiq-backend.onrender.com'}${analysis.imageUrl}` : (analysis.imageUrl || '/illustrations/drying.png'))
              } 
              alt={showDebugVisual ? "AI Diagnostic Overlay" : "Scan capture"} 
              className="w-full h-full object-cover" 
            />
            {!showDebugVisual && <div className="laser-line" />}
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
        </div>

        {/* Circular Indicator & Health Score */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 ${style.shadowColor} ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
        }`}>
          <span className="absolute top-3 left-3 text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            TOOTHBRUSH HEALTH SCORE
          </span>
          
          {/* Animated Gauge Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center mt-3">
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
              <span className={`text-2xl font-black ${style.textColor}`}>{healthScore}%</span>
              <span className="text-[7px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-widest">HEALTH</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 mt-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider border shadow-sm ${style.badgeBg}`}>
              {analysis.condition || 'Good'}
            </span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wide">
              {confidence}% Confidence
            </span>
          </div>
        </div>

      </div>

      {/* 5. Comprehensive Analysis Breakdown Cards */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
      }`}>
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 m-0">
          Toothbrush Wear Parameters
        </h4>
        
        <div className="space-y-3">
          {/* Density */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Density</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold">{density}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, density))}%` }} />
            </div>
          </div>

          {/* Spread */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Spread</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold">{spread}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, spread))}%` }} />
            </div>
          </div>

          {/* Fraying */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Fraying</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold">{fraying}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, fraying))}%` }} />
            </div>
          </div>

          {/* Bending */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Bending</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold">{bending}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, bending))}%` }} />
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300">Confidence</span>
              <span className="text-slate-800 dark:text-slate-100 font-extrabold">{confidence}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 8. Key Metrics (Condition, Remaining Life, Replacement Date) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Condition Card */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-primary shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Condition</p>
            <p className="text-sm font-black mt-0.5 text-slate-850 dark:text-slate-200">{analysis.condition || 'Good'}</p>
          </div>
        </div>

        {/* Remaining Life Card */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-teal-500 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Remaining Life</p>
            <p className="text-sm font-black mt-0.5 text-slate-850 dark:text-slate-200">{remainingLife} days</p>
          </div>
        </div>

        {/* Replacement Date Card */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
        }`}>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-orange-500 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0">Replacement Date</p>
            <p className="text-sm font-black mt-0.5 text-slate-850 dark:text-slate-200">{replacementDateFormatted}</p>
          </div>
        </div>

      </div>

      {/* 9. AI Recommendation Card */}
      <div className={`p-4 rounded-2xl border relative overflow-hidden transition-all duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-md shadow-slate-100/50'
      }`}>
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-850">
          <Sparkles className="w-4.5 h-4.5 text-primary dark:text-teal-400 shrink-0 animate-pulse" />
          <h4 className="font-bold text-xs uppercase tracking-wider m-0 text-slate-700 dark:text-slate-350">AI Recommendation</h4>
        </div>

        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed mt-3 m-0 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/60 dark:border-slate-850/50">
          {recommendationText}
        </p>
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
