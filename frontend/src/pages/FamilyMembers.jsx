import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { familyService, scanService, reminderService, tipsService, toothbrushService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import MemberCard from '../components/MemberCard';
import { FamilyMembersSkeleton } from '../components/SkeletonLoader';

import { 
  Users, 
  Plus, 
  X, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Activity, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Check 
} from 'lucide-react';

const FamilyMembers = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected member for detail view
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberScans, setMemberScans] = useState([]);
  const [memberReminders, setMemberReminders] = useState([]);
  const [memberTips, setMemberTips] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [relationship, setRelationship] = useState('Spouse');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Toothbrush modal states
  const [isBrushModalOpen, setIsBrushModalOpen] = useState(false);
  const [brushBrand, setBrushBrand] = useState('');
  const [brushModel, setBrushModel] = useState('');
  const [brushColor, setBrushColor] = useState('');
  const [brushType, setBrushType] = useState('Manual');
  const [brushPurchaseDate, setBrushPurchaseDate] = useState('');
  const [editingBrushId, setEditingBrushId] = useState(null);
  const [brushError, setBrushError] = useState('');

  const relationships = ['Self', 'Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'];
  const genders = ['Male', 'Female', 'Non-binary', 'Other'];

  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleOpenAssignModal = () => {
    setEditingBrushId(null);
    setBrushBrand('');
    setBrushModel('');
    setBrushColor('');
    setBrushType('Manual');
    setBrushPurchaseDate(new Date().toISOString().split('T')[0]);
    setBrushError('');
    setIsBrushModalOpen(true);
  };

  const handleOpenEditBrushModal = () => {
    if (!selectedMember || !selectedMember.toothbrushId) return;
    setEditingBrushId(selectedMember.toothbrushId);
    setBrushBrand(selectedMember.toothbrushBrand || '');
    setBrushModel(selectedMember.toothbrushModel || '');
    setBrushColor(selectedMember.toothbrushColor || '');
    setBrushType(selectedMember.toothbrushType || 'Manual');
    if (selectedMember.toothbrushPurchaseDate) {
      setBrushPurchaseDate(new Date(selectedMember.toothbrushPurchaseDate).toISOString().split('T')[0]);
    } else {
      setBrushPurchaseDate(new Date().toISOString().split('T')[0]);
    }
    setBrushError('');
    setIsBrushModalOpen(true);
  };

  const handleSaveToothbrush = async (e) => {
    e.preventDefault();
    if (!brushBrand || !brushModel || !brushPurchaseDate) {
      return setBrushError('Brand, model, and purchase date are required');
    }

    setBrushError('');
    console.log('--- Toothbrush Assignment Debug Logs ---');
    console.log('Selected Member ID:', selectedMember.id);
    console.log('Editing Brush ID:', editingBrushId);

    try {
      let apiRes;
      if (editingBrushId) {
        apiRes = await toothbrushService.updateToothbrush(
          editingBrushId,
          brushBrand,
          brushModel,
          brushColor,
          brushType,
          brushPurchaseDate
        );
        console.log('Created/Updated Toothbrush ID:', editingBrushId);
        console.log('Assigned Family Member ID:', selectedMember.id);
      } else {
        apiRes = await toothbrushService.addToothbrush(
          selectedMember.id,
          brushBrand,
          brushModel,
          brushColor,
          brushType,
          brushPurchaseDate
        );
        console.log('Created/Updated Toothbrush ID:', apiRes.data.id);
        console.log('Assigned Family Member ID:', apiRes.data.familyMemberId);
      }

      console.log('API Response:', apiRes.data);

      setIsBrushModalOpen(false);

      const updatedMembers = await fetchMembers();
      console.log('Refreshed Members List:', updatedMembers);

      const updatedMember = updatedMembers.find(m => m.id === selectedMember.id);
      if (updatedMember) {
        setSelectedMember(updatedMember);
        console.log('Refreshed Toothbrush Data:', {
          toothbrushId: updatedMember.toothbrushId,
          toothbrushBrand: updatedMember.toothbrushBrand,
          toothbrushModel: updatedMember.toothbrushModel,
          toothbrushColor: updatedMember.toothbrushColor,
          toothbrushType: updatedMember.toothbrushType,
          toothbrushPurchaseDate: updatedMember.toothbrushPurchaseDate,
          healthScore: updatedMember.healthScore,
          toothbrushCondition: updatedMember.toothbrushCondition
        });
      }

      console.log('----------------------------------------');
    } catch (err) {
      console.error('Error saving toothbrush:', err);
      setBrushError(err.response?.data?.message || 'Failed to save toothbrush assignment');
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await familyService.getMembers();
      setMembers(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      setError('Could not retrieve family profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0 && location.state && location.state.selectedMemberId) {
      const matched = members.find(m => m.id === location.state.selectedMemberId);
      if (matched) {
        setSelectedMember(matched);
        // Clear history state to avoid loops on tab clicks
        window.history.replaceState({}, document.title);
      }
    }
  }, [members, location.state]);

  // Fetch details when a member is selected
  useEffect(() => {
    if (!selectedMember) return;

    const fetchMemberDetails = async () => {
      setDetailLoading(true);
      try {
        // 1. Fetch tips
        const tipsRes = await tipsService.getPersonalizedTips(selectedMember.id);
        setMemberTips(tipsRes.data);

        // 2. Fetch reminders
        const remindersRes = await reminderService.getReminders(selectedMember.id);
        setMemberReminders(remindersRes.data.filter(r => !r.isCompleted));

        // 3. Fetch scans history if toothbrush assigned
        if (selectedMember.toothbrushId) {
          const scansRes = await scanService.getHistory(selectedMember.toothbrushId);
          // Sort scans chronologically (oldest to newest for trend line)
          const sortedScans = scansRes.data.sort((a, b) => new Date(a.scanDate) - new Date(b.scanDate));
          setMemberScans(sortedScans);
        } else {
          setMemberScans([]);
        }
      } catch (err) {
        console.error('Error fetching member details:', err);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchMemberDetails();
  }, [selectedMember]);

  const handleOpenAddModal = () => {
    setEditingMemberId(null);
    setName('');
    setAge('');
    setGender('Male');
    setRelationship('Spouse');
    setProfilePhotoUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMemberId(member.id);
    setName(member.name);
    setAge(member.age.toString());
    setGender(member.gender);
    setRelationship(member.relationship);
    setProfilePhotoUrl(member.profilePhotoUrl || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this family member profile? This will also remove their toothbrush and scan histories.')) {
      return;
    }

    try {
      await familyService.deleteMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      if (selectedMember && selectedMember.id === id) {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete family profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !age || !gender || !relationship) {
      return setError('Name, age, gender, and relationship are required');
    }

    setError('');
    try {
      if (editingMemberId) {
        const res = await familyService.updateMember(
          editingMemberId,
          name,
          parseInt(age),
          gender,
          relationship,
          profilePhotoUrl
        );
        
        // Fetch full list again to make sure lateral joins fetch matching brush/scan stats
        await fetchMembers();
        
        if (selectedMember && selectedMember.id === editingMemberId) {
          setSelectedMember({ ...selectedMember, ...res.data });
        }
      } else {
        await familyService.addMember(
          name,
          parseInt(age),
          gender,
          relationship,
          profilePhotoUrl
        );
        await fetchMembers();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save family profile');
    }
  };

  const handleCompleteReminder = async (reminderId) => {
    try {
      await reminderService.completeReminder(reminderId);
      setMemberReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err) {
      console.error('Failed to complete reminder:', err);
    }
  };

  // 1. Calculate Family Overview Dashboard Stats
  const totalMembers = members.length;
  const healthyBrushes = members.filter(m => m.toothbrushId && (m.healthScore >= 80 || m.toothbrushCondition === 'Good')).length;
  const replaceSoon = members.filter(m => m.toothbrushCondition === 'Replace Soon').length;
  const replaceImmediately = members.filter(m => m.toothbrushCondition === 'Replace Immediately' || (m.toothbrushId && m.healthScore < 50)).length;

  // Render SVG Health Trend Line Chart
  const renderTrendChart = () => {
    if (memberScans.length < 2) {
      return (
        <div className="h-28 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-850">
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
            Need at least 2 scans to plot trend
          </p>
        </div>
      );
    }

    const paddingX = 25;
    const paddingY = 20;
    const width = 340;
    const height = 120;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    const xStep = chartWidth / (memberScans.length - 1);
    
    // Map scan scores to Y points (0 to 100 range)
    const points = memberScans.map((scan, i) => {
      const x = paddingX + i * xStep;
      const score = Math.round(scan.healthScore);
      const y = paddingY + chartHeight - (score / 100) * chartHeight;
      return { x, y, score, date: new Date(scan.scanDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' }) };
    });

    const polylinePointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="space-y-1">
        <div className="relative border border-slate-100 dark:border-slate-850 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid gridlines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />
            <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />
            <line x1={paddingX} y1={paddingY + chartHeight} x2={width - paddingX} y2={paddingY + chartHeight} stroke={darkMode ? "#1e293b" : "#f1f5f9"} strokeWidth="1" />
            
            {/* Dotted horizontal guideline for 80% Healthy threshold */}
            <line 
              x1={paddingX} 
              y1={paddingY + chartHeight - 0.8 * chartHeight} 
              x2={width - paddingX} 
              y2={paddingY + chartHeight - 0.8 * chartHeight} 
              stroke="#10B981" 
              strokeDasharray="3,3" 
              strokeWidth="0.8" 
              opacity="0.6"
            />

            {/* Score label text */}
            <text x={paddingX - 5} y={paddingY + 3} fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="end">100</text>
            <text x={paddingX - 5} y={paddingY + chartHeight / 2 + 3} fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="end">50</text>
            <text x={paddingX - 5} y={paddingY + chartHeight + 3} fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="end">0</text>

            {/* Trend line polyline */}
            <polyline
              fill="none"
              stroke="url(#chartGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePointsStr}
            />

            {/* Color definition for gradient stroke */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1565D8" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
            </defs>

            {/* Plot point dots and values */}
            {points.map((p, index) => (
              <g key={index}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill={darkMode ? "#0f172a" : "#ffffff"}
                  stroke={p.score >= 80 ? "#10B981" : p.score >= 50 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="2.5"
                />
                <text
                  x={p.x}
                  y={p.y - 8}
                  fill={darkMode ? "#e2e8f0" : "#334155"}
                  fontSize="7.5"
                  fontWeight="black"
                  textAnchor="middle"
                >
                  {p.score}%
                </text>
                <text
                  x={p.x}
                  y={height - 4}
                  fill="#94a3b8"
                  fontSize="6.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="text-[7.5px] uppercase font-bold text-center text-slate-400 dark:text-slate-500 tracking-wider">
          CHRONOLOGICAL TOOTHBRUSH HEALTH TREND (80%+ OPTIMAL ZONE)
        </p>
      </div>
    );
  };

  if (loading) {
    return <FamilyMembersSkeleton />;
  }

  // Calculate toothbrush days used
  const calculateDaysUsed = (dateStr) => {
    if (!dateStr) return 0;
    const purchase = new Date(dateStr);
    const diffTime = Math.abs(new Date() - purchase);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {selectedMember ? (
        /* ================= MEMBER DETAIL VIEW ================= */
        <div className="space-y-4 animate-fade-in pb-8">
          
          {/* Detail Back Navigation */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => setSelectedMember(null)}
              className="flex items-center gap-1 text-[10px] uppercase font-extrabold text-slate-450 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Family
            </button>
            <span className="text-[9px] font-black uppercase text-slate-400">Member Dossier</span>
          </div>

          {/* Profile Header */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
              {selectedMember.profilePhotoUrl ? (
                <img src={selectedMember.profilePhotoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black leading-none m-0">{selectedMember.name}</h3>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8.5px] font-extrabold uppercase tracking-wider">
                  {selectedMember.relationship}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 m-0 uppercase tracking-wide">
                {selectedMember.age} Years Old • {selectedMember.gender}
              </p>
            </div>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Health Trend Chart */}
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" /> Health Trend Chart
                </h4>
                {renderTrendChart()}
              </div>

              {/* Assigned Toothbrush Details */}
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-500" /> Active Toothbrush
                </h4>
                {selectedMember.toothbrushBrand ? (
                  <div className="space-y-3">
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Toothbrush Name</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">
                          {selectedMember.toothbrushBrand} {selectedMember.toothbrushModel}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Brand</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {selectedMember.toothbrushBrand}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Type</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {selectedMember.toothbrushType}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Purchase Date</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {formatDateString(selectedMember.toothbrushPurchaseDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Health Score</span>
                          <span className="font-black text-slate-700 dark:text-slate-300">
                            {selectedMember.healthScore !== null && selectedMember.healthScore !== undefined
                              ? `${Math.round(selectedMember.healthScore)}/100`
                              : 'No Scans'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Condition</span>
                          <span className={`font-black uppercase ${
                            selectedMember.toothbrushCondition === 'Good' 
                              ? 'text-emerald-500' 
                              : selectedMember.toothbrushCondition === 'Moderate Wear' 
                                ? 'text-amber-500' 
                                : 'text-rose-500'
                          }`}>
                            {selectedMember.toothbrushCondition || 'Unknown'}
                          </span>
                        </div>
                        {selectedMember.toothbrushColor && (
                          <div>
                            <span className="text-slate-400 font-bold uppercase block text-[9px] tracking-wider">Color</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {selectedMember.toothbrushColor}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex gap-2 justify-end">
                      <button
                        onClick={() => navigate('/scan', { 
                          state: { 
                            memberId: selectedMember.id,
                            toothbrushId: selectedMember.toothbrushId 
                          } 
                        })}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg shadow shadow-primary/10 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                      >
                        Scan Now
                      </button>
                      <button
                        onClick={handleOpenEditBrushModal}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          darkMode 
                            ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleOpenAssignModal}
                        className={`px-3 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                          darkMode 
                            ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50/50 dark:bg-slate-950/40 border border-dashed rounded-xl">
                    <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-500 mb-2.5">No toothbrush assigned to profile</p>
                    <button
                      onClick={handleOpenAssignModal}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-extrabold text-[9px] uppercase tracking-wider transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                      Go Assign Toothbrush
                    </button>
                  </div>
                )}
              </div>

              {/* Active Reminders */}
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-500" /> Active Reminders
                </h4>
                {memberReminders.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center m-0 font-bold py-2 uppercase tracking-wide">
                    All clear! No pending hygiene checks.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memberReminders.map(reminder => (
                      <div key={reminder.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl flex items-start gap-2.5">
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="w-4 h-4 rounded border-2 border-slate-300 hover:border-teal-500 flex items-center justify-center cursor-pointer shrink-0 mt-0.5"
                        >
                          <Check className="w-3 h-3 text-transparent hover:text-teal-500" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 m-0 leading-normal">{reminder.message}</p>
                          <span className="text-[9px] font-bold text-orange-500 uppercase mt-1 block">
                            Due: {new Date(reminder.nextReminderDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personalized AI Tips */}
              <div className={`p-4 rounded-2xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Personalized Care Tips
                </h4>
                {memberTips.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center m-0 font-bold py-2 uppercase tracking-wide">
                    Analyze a scan to unlock personalized tips.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {memberTips.map((tip, index) => (
                      <div key={index} className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-xl space-y-1">
                        <span className="text-[8px] font-black uppercase text-primary dark:text-teal-400 tracking-wider">
                          {tip.category}
                        </span>
                        <h5 className="font-bold text-xs m-0 text-slate-850 dark:text-slate-205">{tip.title}</h5>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal m-0 mt-1">{tip.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scan History list */}
              {selectedMember.toothbrushId && memberScans.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" /> Scan History Timeline
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {memberScans.slice().reverse().map(scan => (
                      <div key={scan.id} className="p-2.5 bg-slate-50/50 dark:bg-slate-950/40 border dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold">{new Date(scan.scanDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Confidence: {scan.confidenceScore}%</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                            scan.healthScore >= 80 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : scan.healthScore >= 50 
                                ? 'bg-amber-50 text-amber-600' 
                                : 'bg-rose-50 text-rose-600'
                          }`}>
                            {Math.round(scan.healthScore)}% • {scan.condition.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      ) : (
        /* ================= REGULAR MEMBERS LIST & DASHBOARD ================= */
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex justify-between items-center px-1">
            <p className="text-xs text-slate-450 dark:text-slate-500 font-bold m-0 uppercase tracking-wide">
              Family overview dashboard
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-extrabold text-[10px] uppercase tracking-wider shadow shadow-primary/20 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Profile
            </button>
          </div>

          {/* 2. Family Overview Dashboard Grid (2x2 premium layout) */}
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Total Members */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
            }`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0 tracking-wider">Total Members</span>
              <p className="text-xl font-black mt-1.5 leading-none flex items-baseline gap-1.5">
                {totalMembers}
                <span className="text-[10px] font-bold text-slate-400 uppercase">Profiles</span>
              </p>
            </div>

            {/* Healthy Brushes */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
            }`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy Brushes
              </span>
              <p className="text-xl font-black mt-1.5 leading-none flex items-baseline gap-1.5 text-emerald-500">
                {healthyBrushes}
                <span className="text-[10px] font-bold text-slate-450 uppercase">Active</span>
              </p>
            </div>

            {/* Replace Soon */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
            }`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-550" /> Replace Soon
              </span>
              <p className="text-xl font-black mt-1.5 leading-none flex items-baseline gap-1.5 text-amber-500">
                {replaceSoon}
                <span className="text-[10px] font-bold text-slate-450 uppercase">Pending</span>
              </p>
            </div>

            {/* Replace Immediately */}
            <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-100/30'
            }`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 m-0 tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Critical Wear
              </span>
              <p className="text-xl font-black mt-1.5 leading-none flex items-baseline gap-1.5 text-rose-500">
                {replaceImmediately}
                <span className="text-[10px] font-bold text-slate-455 uppercase">Alerts</span>
              </p>
            </div>

          </div>

          <p className="text-[9px] text-slate-400 dark:text-slate-550 font-bold m-0 mt-3 px-1 uppercase tracking-widest">
            Household Members ({members.length}) • TAP TO VIEW REPORTS
          </p>

          {members.length === 0 ? (
            <div className={`text-center py-12 border border-dashed rounded-2xl ${
              darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-250 shadow-sm'
            }`}>
              <Users className="w-12 h-12 mx-auto text-slate-350 mb-3" />
              <h4 className="font-bold text-sm mb-1.5">No Family Profiles Created</h4>
              <p className="text-slate-400 text-xs max-w-xs mx-auto mb-4 px-3 leading-relaxed">
                Create profiles for everyone in your home to track their brushes and scans separately.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onClick={() => setSelectedMember(member)}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Edit/Create Form Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-5">
          <div className={`w-full max-w-[390px] rounded-2xl border p-5 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-950'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold mb-4 pr-6 leading-none">
              {editingMemberId ? 'Edit Family Profile' : 'Add Family Profile'}
            </h3>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-2.5 rounded-xl mb-4 text-[10px] font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              <div>
                <label htmlFor="memberName" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Name</label>
                <input
                  id="memberName"
                  type="text"
                  placeholder="E.g., Emily"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="memberAge" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Age</label>
                  <input
                    id="memberAge"
                    type="number"
                    placeholder="E.g., 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="memberRelationship" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Relationship</label>
                  <select
                    id="memberRelationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  >
                    {relationships.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="memberGender" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Gender</label>
                <select
                  id="memberGender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="memberPhotoUrl" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Profile Photo URL (Optional)</label>
                <input
                  id="memberPhotoUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-slate-55 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3.5 border-t border-slate-100 dark:border-slate-850 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    darkMode 
                      ? 'border-slate-850 hover:bg-slate-800 text-slate-400' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign/Edit Toothbrush Modal */}
      {isBrushModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-5 animate-fade-in">
          <div className={`w-full max-w-[390px] rounded-2xl border p-5 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-950'
          }`}>
            <button
              type="button"
              onClick={() => setIsBrushModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all duration-200 active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold mb-4 pr-6 leading-none">
              {editingBrushId ? 'Edit Toothbrush' : 'Assign Toothbrush'}
            </h3>

            {brushError && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-2.5 rounded-xl mb-4 text-[10px] font-semibold">
                {brushError}
              </div>
            )}

            <form onSubmit={handleSaveToothbrush} className="space-y-3.5 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="brushBrand" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Brand *</label>
                  <input
                    id="brushBrand"
                    type="text"
                    placeholder="E.g., Oral-B"
                    value={brushBrand}
                    onChange={(e) => setBrushBrand(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="brushModel" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Model *</label>
                  <input
                    id="brushModel"
                    type="text"
                    placeholder="E.g., Cross Action"
                    value={brushModel}
                    onChange={(e) => setBrushModel(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="brushColor" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-450 mb-1">Color</label>
                  <input
                    id="brushColor"
                    type="text"
                    placeholder="E.g., Blue"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="brushType" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-450 mb-1">Brush Type</label>
                  <select
                    id="brushType"
                    value={brushType}
                    onChange={(e) => setBrushType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  >
                    <option value="Manual">Manual</option>
                    <option value="Electric">Electric</option>
                    <option value="Sonic">Sonic</option>
                    <option value="Kids">Kids</option>
                    <option value="Orthodontic">Orthodontic</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="brushPurchaseDate" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-450 mb-1">Purchase Date *</label>
                <input
                  id="brushPurchaseDate"
                  type="date"
                  value={brushPurchaseDate}
                  onChange={(e) => setBrushPurchaseDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3.5 border-t border-slate-100 dark:border-slate-850 mt-4">
                <button
                  type="button"
                  onClick={() => setIsBrushModalOpen(false)}
                  className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    darkMode 
                      ? 'border-slate-850 hover:bg-slate-800 text-slate-400' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
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

export default FamilyMembers;
