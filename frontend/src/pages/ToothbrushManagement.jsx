import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toothbrushService, familyService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import BrushCard from '../components/BrushCard';
import { ToothbrushSkeleton } from '../components/SkeletonLoader';

import { Sparkles, Plus, X } from 'lucide-react';

const ToothbrushManagement = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [toothbrushes, setToothbrushes] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal forms state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrushId, setEditingBrushId] = useState(null);
  const [familyMemberId, setFamilyMemberId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [type, setType] = useState('Manual');
  const [purchaseDate, setPurchaseDate] = useState('');

  const brushTypes = ['Manual', 'Electric', 'Sonic', 'Kids', 'Orthodontic'];

  const loadData = async () => {
    try {
      const [brushesRes, membersRes] = await Promise.all([
        toothbrushService.getToothbrushes(),
        familyService.getMembers(),
      ]);
      setToothbrushes(brushesRes.data);
      setFamilyMembers(membersRes.data);
      
      if (membersRes.data.length > 0) {
        setFamilyMemberId(membersRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve toothbrush records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (familyMembers.length > 0 && location.state && location.state.memberId) {
      setFamilyMemberId(location.state.memberId);
      setBrand('');
      setModel('');
      setColor('');
      setType('Manual');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setEditingBrushId(null);
      setError('');
      setIsModalOpen(true);
    }
  }, [familyMembers, location.state]);

  const handleOpenAddModal = () => {
    if (familyMembers.length === 0) {
      alert('Please create a family member profile first before registering a toothbrush.');
      return;
    }
    setEditingBrushId(null);
    setBrand('');
    setModel('');
    setColor('');
    setType('Manual');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brush) => {
    setEditingBrushId(brush.id);
    setFamilyMemberId(brush.familyMemberId);
    setBrand(brush.brand);
    setModel(brush.model);
    setColor(brush.color);
    setType(brush.type);
    setPurchaseDate(brush.purchaseDate.split('T')[0]);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this toothbrush? This will delete all its scans and historical data.')) {
      return;
    }

    try {
      await toothbrushService.deleteToothbrush(id);
      setToothbrushes((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to remove toothbrush record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!familyMemberId || !brand || !model || !color || !type || !purchaseDate) {
      return setError('All fields are required');
    }

    setError('');
    try {
      if (editingBrushId) {
        const res = await toothbrushService.updateToothbrush(
          editingBrushId,
          brand,
          model,
          color,
          type,
          purchaseDate
        );
        setToothbrushes((prev) => 
          prev.map((b) => {
            if (b.id === editingBrushId) {
              const matchedMember = familyMembers.find(m => m.id === res.data.familyMemberId);
              return { ...res.data, memberName: matchedMember ? matchedMember.name : b.memberName };
            }
            return b;
          })
        );
      } else {
        const res = await toothbrushService.addToothbrush(
          familyMemberId,
          brand,
          model,
          color,
          type,
          purchaseDate
        );
        const matchedMember = familyMembers.find(m => m.id === res.data.familyMemberId);
        setToothbrushes((prev) => [{ ...res.data, memberName: matchedMember ? matchedMember.name : '' }, ...prev]);
      }
      setIsModalOpen(false);
      if (location.state && location.state.memberId) {
        navigate('/family', { state: { selectedMemberId: familyMemberId } });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save toothbrush');
    }
  };

  if (loading) {
    return <ToothbrushSkeleton />;
  }

  return (
    <div className="space-y-4">
      
      <div className="flex justify-between items-center px-1">
        <p className="text-xs text-slate-450 dark:text-slate-500 font-bold m-0 uppercase tracking-wide">
          Toothbrush List ({toothbrushes.length})
        </p>
        <button
          onClick={handleOpenAddModal}
          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-extrabold text-[10px] uppercase tracking-wider shadow shadow-primary/20 flex items-center gap-1 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Brush
        </button>
      </div>

      {toothbrushes.length === 0 ? (
        <div className={`text-center py-12 border border-dashed rounded-2xl ${
          darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-250 shadow-sm'
        }`}>
          <Sparkles className="w-12 h-12 mx-auto text-slate-350 mb-3" />
          <h4 className="font-bold text-sm mb-1.5">No Toothbrushes Registered</h4>
          <p className="text-slate-400 text-xs max-w-xs mx-auto mb-4 px-3 leading-relaxed">
            Register your active toothbrush to start tracing its bristle wear and receiving alerts.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md cursor-pointer transition-all"
          >
            Register First Brush
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {toothbrushes.map((brush) => (
            <BrushCard
              key={brush.id}
              brush={brush}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit/Create Form Modal - styled relative to the mobile mockup container */}
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
              {editingBrushId ? 'Edit Toothbrush' : 'Register Toothbrush'}
            </h3>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-2.5 rounded-xl mb-4 text-[10px] font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {!editingBrushId && (
                <div>
                  <label htmlFor="familyMemberId" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Assign to Family Profile</label>
                  <select
                    id="familyMemberId"
                    value={familyMemberId}
                    onChange={(e) => setFamilyMemberId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-55 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="brand" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Brand</label>
                  <input
                    id="brand"
                    type="text"
                    placeholder="E.g., Oral-B"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Model</label>
                  <input
                    id="model"
                    type="text"
                    placeholder="E.g., Pro 1000"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="color" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Color</label>
                  <input
                    id="color"
                    type="text"
                    placeholder="E.g., Blue"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Brush Type</label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                        : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
                    }`}
                  >
                    {brushTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">Purchase Date</label>
                <input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-semibold text-xs transition-all focus:ring-2 focus:ring-primary/20 ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-850 focus:border-primary text-white' 
                      : 'bg-slate-50 border-slate-200 focus:border-primary focus:bg-white text-slate-900'
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

export default ToothbrushManagement;
