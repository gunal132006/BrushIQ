import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { familyService, toothbrushService, scanService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Camera, Upload, AlertCircle, RefreshCw, CheckCircle, Video } from 'lucide-react';

const ScanModule = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [toothbrushes, setToothbrushes] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBrushId, setSelectedBrushId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(0);
  const [error, setError] = useState('');

  const checkpoints = [
    'Checking capture illumination & contrast...',
    'Segmenting bristle boundary region...',
    'Measuring bristle splay & spread index...',
    'Evaluating density fill rate & wear trend...',
    'Formulating clinical hygiene advice...'
  ];

  // Capture variables
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [brushingFrequency, setBrushingFrequency] = useState('2x daily');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const membersRes = await familyService.getMembers();
        setFamilyMembers(membersRes.data);
        if (location.state && location.state.memberId) {
          setSelectedMemberId(location.state.memberId);
        } else if (membersRes.data.length > 0) {
          setSelectedMemberId(membersRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load profiles. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [location.state]);

  useEffect(() => {
    if (!selectedMemberId) return;
    const fetchBrushes = async () => {
      try {
        const res = await toothbrushService.getToothbrushes(selectedMemberId);
        setToothbrushes(res.data);
        if (location.state && location.state.toothbrushId && res.data.some(b => b.id === location.state.toothbrushId)) {
          setSelectedBrushId(location.state.toothbrushId);
        } else if (res.data.length > 0) {
          setSelectedBrushId(res.data[0].id);
        } else {
          setSelectedBrushId('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBrushes();
  }, [selectedMemberId, location.state]);

  const startCamera = async () => {
    setError('');
    setCapturedImage(null);
    setFileToUpload(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 480, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('webcam access blocked. Please upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-toothbrush.jpg', { type: 'image/jpeg' });
        setFileToUpload(file);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const handleFileChange = (e) => {
    setError('');
    stopCamera();
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return setError('Please upload an image file');
      }
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedBrushId) {
      return setError('Please select a toothbrush');
    }
    if (!fileToUpload) {
      return setError('Please capture or upload an image');
    }

    setError('');
    setAnalyzing(true);
    setCurrentCheckpoint(0);

    let apiResult = null;
    let apiError = null;

    // Start API request in parallel
    const apiPromise = (async () => {
      try {
        const formData = new FormData();
        formData.append('image', fileToUpload);
        const res = await scanService.analyzeScan(formData);
        apiResult = res.data;
      } catch (err) {
        console.error(err);
        apiError = err.response?.data?.message || 'AI analysis engine error. Try again.';
      }
    })();

    // Run checkpoints animation sequential checks
    for (let step = 0; step < 5; step++) {
      setCurrentCheckpoint(step);
      await new Promise(r => setTimeout(r, 600)); // 600ms per checkpoint
    }
    setCurrentCheckpoint(5); // All complete

    // Await API resolution
    await apiPromise;

    setAnalyzing(false);

    if (apiError) {
      setError(apiError);
    } else if (apiResult) {
      navigate('/result', {
        state: {
          analysis: apiResult,
          toothbrushId: selectedBrushId,
          brushingFrequency,
          memberName: familyMembers.find(m => m.id === selectedMemberId)?.name
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading scanner module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-3 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select context panel */}
      <div className={`p-4 rounded-2xl border space-y-3.5 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div>
          <label htmlFor="scanMemberId" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Family Member</label>
          <select
            id="scanMemberId"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
              darkMode 
                ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
            }`}
            disabled={analyzing}
          >
            {familyMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scanBrushId" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Toothbrush</label>
          <select
            id="scanBrushId"
            value={selectedBrushId}
            onChange={(e) => setSelectedBrushId(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
              darkMode 
                ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
            }`}
            disabled={analyzing || toothbrushes.length === 0}
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

      {/* Camera Panel */}
      <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <canvas ref={canvasRef} className="hidden" />

        {analyzing ? (
          <div className="w-full flex flex-col items-center justify-center py-6 px-2 space-y-6 animate-fade-in min-h-[300px]">
            {/* CSS Styles for laser line scanning */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes laser-scan {
                0% { top: 0%; opacity: 0.8; }
                50% { top: 100%; opacity: 0.8; }
                100% { top: 0%; opacity: 0.8; }
              }
              .laser-line-scan {
                position: absolute;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(90deg, transparent, #14B8A6, #1565D8, #14B8A6, transparent);
                box-shadow: 0 0 10px #14B8A6, 0 0 16px #1565D8;
                animation: laser-scan 2.5s infinite linear;
              }
            `}} />

            {/* Scanned Image Viewfinder with laser line */}
            <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/30 relative bg-slate-950 shadow-lg shadow-primary/10 shrink-0">
              {capturedImage && (
                <img src={capturedImage} alt="Scanning preview" className="w-full h-full object-cover opacity-60" />
              )}
              {/* Glowing scanning laser line */}
              <div className="laser-line-scan" />
              
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-400 rounded-tl animate-pulse" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-400 rounded-tr animate-pulse" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-400 rounded-bl animate-pulse" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-400 rounded-br animate-pulse" />
            </div>

            {/* Checkpoints list */}
            <div className="w-full max-w-xs space-y-3 text-left bg-slate-50 dark:bg-slate-950/40 p-4 border dark:border-slate-850 rounded-2xl">
              <span className="text-[8px] font-black uppercase text-slate-400 block tracking-widest mb-1.5">AI Diagnostic Sequence</span>
              
              {checkpoints.map((cp, idx) => {
                const isDone = currentCheckpoint > idx;
                const isActive = currentCheckpoint === idx;
                return (
                  <div key={idx} className="flex items-center gap-2.5 text-[11px] font-bold">
                    {isDone ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-350 dark:border-slate-800 shrink-0" />
                    )}
                    <span className={isDone ? 'text-slate-400 dark:text-slate-500 line-through' : isActive ? 'text-primary dark:text-teal-400 font-black' : 'text-slate-400'}>
                      {cp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isCameraActive ? (
          <div className="w-full relative rounded-xl overflow-hidden aspect-square bg-black flex items-center justify-center max-w-[320px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Guide Circle Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-teal-400 flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 rounded-full border border-teal-400/30 bg-teal-400/5 flex items-center justify-center">
                  <span className="text-[9px] text-teal-400 font-extrabold uppercase text-center px-1">
                    Align Head
                  </span>
                </div>
              </div>
            </div>

            {/* controls */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
              <button
                onClick={captureFrame}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-lg text-xs shadow cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white font-extrabold rounded-lg text-xs cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="relative rounded-xl overflow-hidden max-w-[200px] border dark:border-slate-800 border-slate-200">
              <img src={capturedImage} alt="Preview" className="w-full h-auto" />
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-teal-500 text-white text-[8px] font-extrabold uppercase tracking-wide rounded shadow">
                Ready
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStartAnalysis}
                className="px-4.5 py-2 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs shadow cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Analyze Wear
              </button>
              <button
                onClick={startCamera}
                className="px-3.5 py-2 border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl text-xs cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Re-take
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mx-auto mb-3 border border-primary/10">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm mb-1 m-0">Bristle Scanning Console</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4 px-4 leading-normal">
              Capture bristles top-down using your webcam or select a local photo file.
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={startCamera}
                className="px-4.5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs shadow cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" /> Open Camera
              </button>
              
              <label className={`px-4 py-2.5 border rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5 ${
                darkMode 
                  ? 'border-slate-850 bg-slate-950 text-white hover:bg-slate-800' 
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}>
                <Upload className="w-4 h-4 text-slate-400" /> Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ScanModule;
