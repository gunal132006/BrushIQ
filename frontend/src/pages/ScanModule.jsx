import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { familyService, toothbrushService, scanService } from '../services/api';
import { classifyImageClientSide } from '../services/imageClassifier';
import { useTheme } from '../context/ThemeContext';
import { Camera, Upload, AlertCircle, RefreshCw, CheckCircle, Video, Plus, Edit3, X, Pencil, User, ShieldAlert } from 'lucide-react';

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

  // Client-Side TensorFlow.js Classification State
  const [mlStatus, setMlStatus] = useState('idle'); // 'idle' | 'classifying' | 'human' | 'toothbrush' | 'other'
  const [mlResult, setMlResult] = useState(null);

  // Inline Modals State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberModalMode, setMemberModalMode] = useState('add'); // 'add' | 'edit'
  const [memberName, setMemberName] = useState('');
  const [memberAge, setMemberAge] = useState(25);
  const [memberGender, setMemberGender] = useState('Other');
  const [memberRelationship, setMemberRelationship] = useState('Self');
  const [memberModalError, setMemberModalError] = useState('');

  const [isBrushModalOpen, setIsBrushModalOpen] = useState(false);
  const [brushModalMode, setBrushModalMode] = useState('add'); // 'add' | 'edit'
  const [brushBrand, setBrushBrand] = useState('Oral-B');
  const [brushModel, setBrushModel] = useState('Pro 1000');
  const [brushColor, setBrushColor] = useState('Blue');
  const [brushType, setBrushType] = useState('Manual');
  const [brushPurchaseDate, setBrushPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [brushModalError, setBrushModalError] = useState('');

  const brushTypes = ['Manual', 'Electric', 'Sonic', 'Kids', 'Orthodontic'];
  const relationships = ['Self', 'Spouse', 'Child', 'Parent', 'Other'];

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

  const fetchMembers = async () => {
    try {
      const membersRes = await familyService.getMembers();
      setFamilyMembers(membersRes.data);
      if (location.state && location.state.memberId) {
        setSelectedMemberId(location.state.memberId);
      } else if (membersRes.data.length > 0 && !selectedMemberId) {
        setSelectedMemberId(membersRes.data[0].id);
      }
      return membersRes.data;
    } catch (err) {
      console.error(err);
      setError('Failed to load profiles. Check backend connection.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [location.state]);

  const fetchBrushes = async (memberId) => {
    if (!memberId) {
      setToothbrushes([]);
      setSelectedBrushId('');
      return;
    }
    try {
      const res = await toothbrushService.getToothbrushes(memberId);
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

  useEffect(() => {
    fetchBrushes(selectedMemberId);
  }, [selectedMemberId, location.state]);

  // Family Member Modal Handlers
  const openAddMemberModal = () => {
    setMemberModalMode('add');
    setMemberName('');
    setMemberAge(25);
    setMemberGender('Other');
    setMemberRelationship('Self');
    setMemberModalError('');
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = () => {
    const currentMember = familyMembers.find(m => m.id === selectedMemberId);
    if (!currentMember) return;
    setMemberModalMode('edit');
    setMemberName(currentMember.name || '');
    setMemberAge(currentMember.age || 25);
    setMemberGender(currentMember.gender || 'Other');
    setMemberRelationship(currentMember.relationship || 'Self');
    setMemberModalError('');
    setIsMemberModalOpen(true);
  };

  const handleSaveMemberModal = async (e) => {
    e.preventDefault();
    if (!memberName.trim()) {
      return setMemberModalError('Please enter a name');
    }
    try {
      setMemberModalError('');
      if (memberModalMode === 'add') {
        const res = await familyService.addMember(
          memberName.trim(),
          parseInt(memberAge) || 25,
          memberGender,
          memberRelationship,
          null
        );
        const updatedMembers = [...familyMembers, res.data];
        setFamilyMembers(updatedMembers);
        setSelectedMemberId(res.data.id);
      } else {
        const res = await familyService.updateMember(
          selectedMemberId,
          memberName.trim(),
          parseInt(memberAge) || 25,
          memberGender,
          memberRelationship,
          null
        );
        setFamilyMembers(prev => prev.map(m => m.id === selectedMemberId ? res.data : m));
      }
      setIsMemberModalOpen(false);
    } catch (err) {
      console.error(err);
      setMemberModalError(err.response?.data?.message || 'Failed to save family member profile');
    }
  };

  // Toothbrush Modal Handlers
  const openAddBrushModal = () => {
    if (!selectedMemberId) {
      alert('Please add or select a family member first.');
      return;
    }
    setBrushModalMode('add');
    setBrushBrand('Oral-B');
    setBrushModel('Pro 1000');
    setBrushColor('Blue');
    setBrushType('Manual');
    setBrushPurchaseDate(new Date().toISOString().split('T')[0]);
    setBrushModalError('');
    setIsBrushModalOpen(true);
  };

  const openEditBrushModal = () => {
    const currentBrush = toothbrushes.find(b => b.id === selectedBrushId) || toothbrushes[0];
    if (!currentBrush) {
      return openAddBrushModal();
    }
    if (currentBrush.id !== selectedBrushId) {
      setSelectedBrushId(currentBrush.id);
    }
    setBrushModalMode('edit');
    setBrushBrand(currentBrush.brand || 'Oral-B');
    setBrushModel(currentBrush.model || 'Pro 1000');
    setBrushColor(currentBrush.color || 'Blue');
    setBrushType(currentBrush.type || 'Manual');
    setBrushPurchaseDate((currentBrush.purchaseDate || new Date().toISOString()).split('T')[0]);
    setBrushModalError('');
    setIsBrushModalOpen(true);
  };

  const handleSaveBrushModal = async (e) => {
    e.preventDefault();
    if (!brushBrand.trim() || !brushModel.trim()) {
      return setBrushModalError('Brand and Model are required');
    }
    try {
      setBrushModalError('');
      if (brushModalMode === 'add') {
        const res = await toothbrushService.addToothbrush(
          selectedMemberId,
          brushBrand.trim(),
          brushModel.trim(),
          brushColor.trim() || 'White',
          brushType,
          brushPurchaseDate
        );
        const newBrushes = [res.data, ...toothbrushes];
        setToothbrushes(newBrushes);
        setSelectedBrushId(res.data.id);
      } else {
        const targetBrushId = selectedBrushId || (toothbrushes[0] && toothbrushes[0].id);
        const res = await toothbrushService.updateToothbrush(
          targetBrushId,
          brushBrand.trim(),
          brushModel.trim(),
          brushColor.trim() || 'White',
          brushType,
          brushPurchaseDate
        );
        setToothbrushes(prev => prev.map(b => b.id === targetBrushId ? { ...b, ...res.data } : b));
        setSelectedBrushId(targetBrushId);
      }
      setIsBrushModalOpen(false);
      setError('');
    } catch (err) {
      console.error(err);
      setBrushModalError(err.response?.data?.message || 'Failed to save toothbrush');
    }
  };

  const handleQuickRegisterBrush = async () => {
    try {
      setError('');
      let memberId = selectedMemberId;
      if (!memberId || familyMembers.length === 0) {
        const memRes = await familyService.addMember('Myself', 25, 'Other', 'Self', null);
        memberId = memRes.data.id;
        setFamilyMembers([memRes.data]);
        setSelectedMemberId(memberId);
      }
      const today = new Date().toISOString().split('T')[0];
      const brushRes = await toothbrushService.addToothbrush(
        memberId,
        'Oral-B',
        'Pro 1000',
        'Blue',
        'Manual',
        today
      );
      setToothbrushes([brushRes.data]);
      setSelectedBrushId(brushRes.data.id);
    } catch (err) {
      console.error(err);
      setError('Failed to register default toothbrush.');
    }
  };

  const startCamera = async () => {
    setError('');
    setCapturedImage(null);
    setFileToUpload(null);
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false
        });
      } catch (e) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Webcam access error. Please check browser camera permissions or upload an image file instead.');
    }
  };

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      const handleLoadedMetadata = () => {
        video.play().catch(e => console.error('Video play error:', e));
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      // Also try playing immediately in case metadata already loaded
      if (video.readyState >= 1) {
        video.play().catch(e => console.error('Video play error:', e));
      }
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [isCameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
    setMlStatus('classifying');
    setMlResult(null);

    // Step 1: Execute Client-Side TensorFlow.js MobileNet Model Inference in Browser
    try {
      const classification = await classifyImageClientSide(fileToUpload || capturedImage);
      setMlResult(classification);

      if (classification.category === 'human') {
        setMlStatus('human');
        setAnalyzing(false);
        return; // STOP! Do NOT run bristle wear detection
      }

      if (classification.category === 'unmatched' || classification.category === 'other') {
        setMlStatus('unmatched');
        setAnalyzing(false);
        return; // STOP! Do NOT run bristle wear detection
      }

      setMlStatus('toothbrush');
    } catch (err) {
      console.warn('[Client ML Warning] Client-side classification error, proceeding to backend analysis:', err);
      setMlStatus('toothbrush');
    }

    // Step 2: Ensure valid image File object exists
    let targetFile = fileToUpload;
    if (!targetFile && capturedImage && capturedImage.startsWith('data:')) {
      try {
        const arr = capturedImage.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        targetFile = new File([u8arr], 'toothbrush-scan.jpg', { type: mime });
      } catch (e) {
        console.error('Error constructing File from dataURL:', e);
      }
    }

    if (!targetFile) {
      setAnalyzing(false);
      return setError('Unable to process image file. Please re-capture or upload a file.');
    }

    // Step 3: Proceed with toothbrush bristle wear diagnostic analysis
    let apiResult = null;
    let apiError = null;

    const apiPromise = (async () => {
      try {
        const formData = new FormData();
        formData.append('image', targetFile);
        const res = await scanService.analyzeScan(formData);
        apiResult = res.data;
        console.log('[ScanModule Debug] Scan API analysis result:', apiResult);
      } catch (err) {
        console.error('[ScanModule Error] Scan API analysis error:', err);
        apiError = err.response?.data?.message || 'Unable to analyze this image. Please try again with a clear toothbrush image.';
      }
    })();

    for (let step = 0; step < 5; step++) {
      setCurrentCheckpoint(step);
      await new Promise(r => setTimeout(r, 600));
    }
    setCurrentCheckpoint(5);

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
        
        {/* Family Member Row */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="scanMemberId" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Family Member
            </label>
            <div className="flex items-center gap-1.5">
              {selectedMemberId && (
                <button
                  type="button"
                  onClick={openEditMemberModal}
                  className="px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  title="Edit member details"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={openAddMemberModal}
                className="px-2 py-0.5 text-[10px] font-bold text-primary dark:text-blue-400 bg-primary/10 hover:bg-primary/20 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                title="Add new family member"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
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
            {familyMembers.length === 0 ? (
              <option value="">No profiles registered</option>
            ) : (
              familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relationship || 'Self'})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Toothbrush Row */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="scanBrushId" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Toothbrush
            </label>
            <div className="flex items-center gap-1.5">
              {selectedBrushId && (
                <button
                  type="button"
                  onClick={openEditBrushModal}
                  className="px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  title="Edit toothbrush details"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
              <button
                type="button"
                onClick={openAddBrushModal}
                className="px-2 py-0.5 text-[10px] font-bold text-primary dark:text-blue-400 bg-primary/10 hover:bg-primary/20 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                title="Add new toothbrush"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
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
              <option value="">No brushes registered</option>
            ) : (
              toothbrushes.map((b) => (
                <option key={b.id} value={b.id}>{b.brand} {b.model}</option>
              ))
            )}
          </select>
          {toothbrushes.length === 0 && (
            <button
              type="button"
              onClick={handleQuickRegisterBrush}
              className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              + Quick-Register Default Toothbrush
            </button>
          )}
        </div>
      </div>

      {/* Camera Panel */}
      <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <canvas ref={canvasRef} className="hidden" />

        {analyzing ? (
          <div className="w-full flex flex-col items-center justify-center py-6 px-2 space-y-6 animate-fade-in min-h-[300px]">
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

            <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/30 relative bg-slate-950 shadow-lg shadow-primary/10 shrink-0">
              {capturedImage && (
                <img src={capturedImage} alt="Scanning preview" className="w-full h-full object-cover opacity-60" />
              )}
              <div className="laser-line-scan" />
              <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-400 rounded-tl animate-pulse" />
              <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-400 rounded-tr animate-pulse" />
              <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-400 rounded-bl animate-pulse" />
              <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-400 rounded-br animate-pulse" />
            </div>

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
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-teal-400 flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 rounded-full border border-teal-400/30 bg-teal-400/5 flex items-center justify-center">
                  <span className="text-[9px] text-teal-400 font-extrabold uppercase text-center px-1">
                    Align Head
                  </span>
                </div>
              </div>
            </div>

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

            {/* Client-Side TensorFlow.js Classification Feedback Banner */}
            {mlStatus === 'human' && (
              <div className="w-full max-w-sm p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 space-y-1.5 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 font-black text-sm">
                  <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Human Detected</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {mlResult?.message || 'This image contains a human. Please upload a toothbrush image for analysis.'}
                </p>
                {mlResult?.label && (
                  <span className="inline-block px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 text-[10px] font-bold rounded-md">
                    TF.js ML Prediction: {mlResult.label} ({Math.round(mlResult.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
            )}

            {(mlStatus === 'unmatched' || mlStatus === 'other') && (
              <div className="w-full max-w-sm p-4 rounded-2xl bg-rose-50 dark:bg-rose-955/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-1.5 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 font-black text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>Unmatched Image</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {mlResult?.message || 'Please upload a clear image of a toothbrush.'}
                </p>
                {mlResult?.label && (
                  <span className="inline-block px-2 py-0.5 bg-rose-200/60 dark:bg-rose-900/60 text-[10px] font-bold rounded-md">
                    Detected: {mlResult.label} ({Math.round(mlResult.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
            )}

            {mlStatus === 'toothbrush' && (
              <div className="w-full max-w-sm p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-teal-800 dark:text-teal-300 space-y-1 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 font-black text-xs">
                  <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Toothbrush Detected</span>
                </div>
                <p className="text-[11px] font-semibold">
                  Analyzing toothbrush bristle condition...
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleStartAnalysis}
                className="px-4.5 py-2 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs shadow cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Analyze Wear
              </button>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setFileToUpload(null);
                  setMlStatus('idle');
                  setMlResult(null);
                  startCamera();
                }}
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

      {/* MEMBER EDIT / ADD MODAL */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setIsMemberModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold mb-4 pr-6">
              {memberModalMode === 'add' ? 'Add Family Member' : 'Edit Family Member Profile'}
            </h3>

            {memberModalError && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 p-2.5 rounded-xl mb-4 text-xs font-semibold">
                {memberModalError}
              </div>
            )}

            <form onSubmit={handleSaveMemberModal} className="space-y-3 text-left">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="E.g., Nirosha"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={memberAge}
                    onChange={(e) => setMemberAge(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Relationship</label>
                  <select
                    value={memberRelationship}
                    onChange={(e) => setMemberRelationship(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {relationships.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOOTHBRUSH EDIT / ADD MODAL */}
      {isBrushModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setIsBrushModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold mb-4 pr-6">
              {brushModalMode === 'add' ? 'Register New Toothbrush' : 'Edit Toothbrush Details'}
            </h3>

            {brushModalError && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 p-2.5 rounded-xl mb-4 text-xs font-semibold">
                {brushModalError}
              </div>
            )}

            <form onSubmit={handleSaveBrushModal} className="space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={brushBrand}
                    onChange={(e) => setBrushBrand(e.target.value)}
                    placeholder="E.g., Oral-B"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Model</label>
                  <input
                    type="text"
                    value={brushModel}
                    onChange={(e) => setBrushModel(e.target.value)}
                    placeholder="E.g., Pro 1000"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    placeholder="E.g., Blue"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Brush Type</label>
                  <select
                    value={brushType}
                    onChange={(e) => setBrushType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {brushTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={brushPurchaseDate}
                  onChange={(e) => setBrushPurchaseDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBrushModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow cursor-pointer"
                >
                  Save Toothbrush
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScanModule;
