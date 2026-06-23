import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { familyService, toothbrushService, scanService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { History, Calendar, Activity } from 'lucide-react';

const HistoryModule = () => {
  const { darkMode } = useTheme();
  const location = useLocation();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [toothbrushes, setToothbrushes] = useState([]);
  const [scans, setScans] = useState([]);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBrushId, setSelectedBrushId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');

  const passedBrushId = location.state?.toothbrushId;
  const selectedBrushObj = toothbrushes.find(b => b.id === selectedBrushId);


  useEffect(() => {
    const initData = async () => {
      try {
        const membersRes = await familyService.getMembers();
        setFamilyMembers(membersRes.data);
        
        if (membersRes.data.length > 0) {
          if (passedBrushId) {
            const brushesRes = await toothbrushService.getToothbrushes();
            const brush = brushesRes.data.find(b => b.id === passedBrushId);
            if (brush) {
              setToothbrushes(brushesRes.data.filter(b => b.familyMemberId === brush.familyMemberId));
              setSelectedMemberId(brush.familyMemberId);
              setSelectedBrushId(brush.id);
              return;
            }
          }
          setSelectedMemberId(membersRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load filter profiles.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [passedBrushId]);

  useEffect(() => {
    if (!selectedMemberId || passedBrushId) return;
    const fetchBrushes = async () => {
      try {
        const res = await toothbrushService.getToothbrushes(selectedMemberId);
        setToothbrushes(res.data);
        if (res.data.length > 0) {
          setSelectedBrushId(res.data[0].id);
        } else {
          setSelectedBrushId('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBrushes();
  }, [selectedMemberId]);

  useEffect(() => {
    if (!selectedBrushId) {
      setScans([]);
      return;
    }
    
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await scanService.getHistory(selectedBrushId);
        setScans(res.data.sort((a, b) => new Date(a.scanDate) - new Date(b.scanDate)));
      } catch (err) {
        console.error(err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedBrushId]);

  const getConditionColor = (cond) => {
    switch (cond) {
      case 'Good':
        return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
      case 'Moderate Wear':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30';
      default:
        return 'text-rose-500 bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/30';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysUsed = (dateStr) => {
    if (!dateStr) return 0;
    const purchase = new Date(dateStr);
    const diffTime = Math.abs(new Date() - purchase);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


  const renderProgressChart = () => {
    if (scans.length < 2) return null;

    const width = 400; // Scaled down for mobile layout
    const height = 140;
    const padding = 25;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = scans.map((scan, index) => {
      const x = padding + (index / (scans.length - 1)) * chartWidth;
      const y = height - padding - (scan.healthScore / 100) * chartHeight;
      return { x, y, score: scan.healthScore, date: new Date(scan.scanDate).toLocaleDateString() };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return (
      <div className="w-full flex justify-center pt-2 overflow-x-hidden">
        <svg className="w-full" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1565D8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1565D8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={padding + chartHeight/2} x2={width - padding} y2={padding + chartHeight/2} className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="1" strokeDasharray="3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="url(#chartGradient)"
          />

          <path
            d={pathD}
            fill="none"
            className="stroke-primary"
            strokeWidth="3.0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                className="fill-white stroke-primary cursor-pointer"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-400 font-extrabold text-[8px] uppercase tracking-wide"
              >
                {pt.date.split('/')[0] + '/' + pt.date.split('/')[1]}
              </text>
              <text
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                className="fill-primary font-bold text-[9px]"
              >
                {Math.round(pt.score)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const timelineScans = [...scans].reverse();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading scan timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Filters selectors */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 mb-1">Family Member</label>
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              setSelectedBrushId('');
            }}
            className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                : 'bg-slate-50 border-slate-200 focus:border-primary text-slate-900'
            }`}
          >
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 mb-1">Select Toothbrush</label>
          <select
            value={selectedBrushId}
            onChange={(e) => setSelectedBrushId(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                : 'bg-slate-50 border-slate-200 focus:border-primary text-slate-900'
            }`}
            disabled={toothbrushes.length === 0}
          >
            {toothbrushes.length === 0 ? (
              <option>No brushes registered</option>
            ) : (
              toothbrushes.map((b) => (
                <option key={b.id} value={b.id}>{b.brand} {b.model}</option>
              ))
            )}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {selectedBrushId ? (
        <div className="space-y-4">
          
          {/* Toothbrush Details Header */}
          {selectedBrushObj && (
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-900'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Toothbrush Details</span>
                  <h3 className="text-base font-black mt-1 m-0">
                    {selectedBrushObj.brand} <span className="text-slate-400 dark:text-slate-500 font-bold">{selectedBrushObj.model}</span>
                  </h3>
                  <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 m-0 uppercase">
                    Type: {selectedBrushObj.type} • Color: {selectedBrushObj.color}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  darkMode ? 'bg-slate-850 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {familyMembers.find(m => m.id === selectedMemberId)?.name}'s Brush
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-850 mt-3.5 text-[10px]">
                <div>
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">Duration in Use</span>
                  <span className="font-black text-slate-700 dark:text-slate-350 text-xs">
                    {calculateDaysUsed(selectedBrushObj.purchaseDate)} Days
                  </span>
                </div>
                <div>
                  <span className="text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider block">Current Status</span>
                  <span className={`font-black text-xs uppercase ${
                    scans.length > 0
                      ? scans[scans.length - 1].condition === 'Good'
                        ? 'text-emerald-500'
                        : scans[scans.length - 1].condition === 'Moderate Wear'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      : 'text-slate-400'
                  }`}>
                    {scans.length > 0 ? scans[scans.length - 1].condition : 'No Scans Yet'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {historyLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : scans.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-2xl ${
              darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-250'
            }`}>
              <History className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-sm mb-1">No Scan History Found</h4>
              <p className="text-slate-400 text-xs px-3 leading-relaxed">
                Record a bristle scan photo to start tracing toothbrush wear.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* SVG Progress Graph */}
              {scans.length >= 2 && (
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-sm mb-1 m-0 flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-primary" /> Health Degradation Trend
                  </h4>
                  {renderProgressChart()}
                </div>
              )}

              {/* Timeline scroll */}
              <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4.5 ml-3 space-y-4.5 py-1">

              {timelineScans.map((scan) => (
                <div key={scan.id} className="relative">
                  
                  {/* node */}
                  <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-slate-50 dark:border-[#0b0f19] flex items-center justify-center shadow" />

                  <div className={`p-4 rounded-2xl border flex gap-4 ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm'
                  }`}>
                    
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden border dark:border-slate-850 border-slate-100 shrink-0 bg-slate-950 flex items-center justify-center">
                      <img 
                        src={scan.imageUrl.startsWith('/') ? `http://localhost:5000${scan.imageUrl}` : scan.imageUrl} 
                        alt="Scan Thumbnail" 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Stats */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${getConditionColor(scan.condition)}`}>
                          {scan.condition.split(' ')[0]}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(scan.scanDate).split(',')[0]}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-850 text-center">
                        <div>
                          <p className="text-[8px] uppercase font-bold text-slate-400 m-0">Health</p>
                          <p className="text-xs font-black text-primary mt-0.5">{Math.round(scan.healthScore)}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-bold text-slate-400 m-0">Wear</p>
                          <p className="text-xs font-black mt-0.5">{Math.round(scan.wearPercentage)}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase font-bold text-slate-400 m-0">Days Left</p>
                          <p className="text-xs font-black mt-0.5">{scan.remainingLifeDays}d</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
      ) : (
        <div className="text-center py-12 text-slate-400 font-bold text-xs">
          Please select a toothbrush to check scan history logs.
        </div>
      )}

    </div>
  );
};

export default HistoryModule;
