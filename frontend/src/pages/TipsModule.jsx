import React, { useState, useEffect } from 'react';
import { tipsService, familyService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import TipCard from '../components/TipCard';
import { TipsSkeleton } from '../components/SkeletonLoader';

import { 
  Sparkles, 
  Award, 
  BookOpen, 
  CheckSquare, 
  Smile, 
  UserPlus, 
  Search, 
  Bookmark, 
  ArrowLeft, 
  Clock, 
  X,
  Info
} from 'lucide-react';

const TipsModule = () => {
  const { darkMode } = useTheme();

  const [generalTips, setGeneralTips] = useState([]);
  const [personalizedTips, setPersonalizedTips] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected tip for Read More modal view
  const [selectedTip, setSelectedTip] = useState(null);

  // Bookmarks state local to localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('brushiq_bookmarked_tips');
    return saved ? JSON.parse(saved) : [];
  });

  const categories = [
    'All',
    'Dental Hygiene',
    'Brushing Techniques',
    'Brush Maintenance',
    'Kids Oral Care',
    'Senior Oral Care',
    'AI Personalized',
    'Bookmarks'
  ];

  const loadInitialData = async () => {
    try {
      const [tipsRes, memRes] = await Promise.all([
        tipsService.getTips(),
        familyService.getMembers()
      ]);
      setGeneralTips(tipsRes.data);
      setFamilyMembers(memRes.data);
      if (memRes.data.length > 0) {
        setSelectedMemberId(memRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch educational guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'AI Personalized' || !selectedMemberId) return;

    const fetchPersonalized = async () => {
      setPersonalizedLoading(true);
      try {
        const res = await tipsService.getPersonalizedTips(selectedMemberId);
        setPersonalizedTips(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setPersonalizedLoading(false);
      }
    };
    fetchPersonalized();
  }, [selectedMemberId, activeTab]);

  const handleToggleBookmark = (tip) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.some((t) => t.id === tip.id);
      let next;
      if (isBookmarked) {
        next = prev.filter((t) => t.id !== tip.id);
      } else {
        next = [...prev, tip];
      }
      localStorage.setItem('brushiq_bookmarked_tips', JSON.stringify(next));
      return next;
    });
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'All':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Dental Hygiene':
        return <CheckSquare className="w-3.5 h-3.5" />;
      case 'Brushing Techniques':
        return <Award className="w-3.5 h-3.5" />;
      case 'Brush Maintenance':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Kids Oral Care':
        return <Smile className="w-3.5 h-3.5 text-teal-400" />;
      case 'Senior Oral Care':
        return <UserPlus className="w-3.5 h-3.5 text-orange-400" />;
      case 'AI Personalized':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      case 'Bookmarks':
        return <Bookmark className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // 1. Filter tips by Category Tab
  const getSourceTips = () => {
    if (activeTab === 'All') return generalTips;
    if (activeTab === 'AI Personalized') return personalizedTips;
    if (activeTab === 'Bookmarks') return bookmarks;
    return generalTips.filter((tip) => tip.category === activeTab);
  };

  // 2. Filter tips by search query
  const filteredTips = getSourceTips().filter((tip) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tip.title.toLowerCase().includes(q) ||
      tip.content.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <TipsSkeleton />;
  }

  // Calculate dynamic reading time (e.g. 100 words per minute)
  const calculateReadTime = (content) => {
    if (!content) return 1;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.round(words / 100));
  };

  return (
    <div className="space-y-4">
      {selectedTip ? (
        /* ================= READ MORE ARTICLE PAGE ================= */
        <div className="space-y-4 animate-fade-in pb-8">
          {/* Back Action Header */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={() => setSelectedTip(null)}
              className="flex items-center gap-1 text-[10px] uppercase font-extrabold text-slate-450 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Guides
            </button>
            <span className="text-[9px] font-black uppercase text-slate-400">Article Details</span>
          </div>

          {/* Large Header Banner */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            {selectedTip.illustrationUrl ? (
              <img src={selectedTip.illustrationUrl} alt={selectedTip.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary to-teal-500 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white/40" />
              </div>
            )}
            
            {/* Tag Badge */}
            <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary text-white shadow shadow-primary/20">
              {selectedTip.category}
            </span>
          </div>

          {/* Content Card details */}
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="text-xl font-black leading-tight mb-4">{selectedTip.title}</h3>
            
            {/* Metadata Info */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {calculateReadTime(selectedTip.content)} Min Read</span>
              
              <button
                onClick={() => handleToggleBookmark(selectedTip)}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                  bookmarks.some(t => t.id === selectedTip.id)
                    ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/40'
                    : 'border-slate-200 dark:border-slate-800 text-slate-450'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {bookmarks.some(t => t.id === selectedTip.id) ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>

            <p className="text-sm font-semibold leading-relaxed text-slate-655 dark:text-slate-350 m-0">
              {selectedTip.content}
            </p>
          </div>

          <button
            onClick={() => setSelectedTip(null)}
            className="w-full py-3 rounded-xl border dark:border-slate-800 font-extrabold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors cursor-pointer"
          >
            Back to Articles
          </button>
        </div>
      ) : (
        /* ================= MAIN DASHBOARD VIEW ================= */
        <div className="space-y-4 animate-fade-in">
          {/* Search Input Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search oral care guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl border outline-none font-semibold text-xs transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 focus:border-primary text-white' 
                  : 'bg-white border-slate-200 focus:border-primary text-slate-900 shadow-sm'
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Tabs Scrollable Row */}
          <div className="flex overflow-x-auto gap-2 border-b dark:border-slate-800 border-slate-100 pb-px scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3.5 py-2.5 border-b-2 font-black text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === cat
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                {getTabIcon(cat)}
                {cat === 'AI Personalized' ? 'Personalized' : cat}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Member Profile chips (only for AI Personalized tab) */}
          {activeTab === 'AI Personalized' && familyMembers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 shrink-0">Profile:</span>
              {familyMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] cursor-pointer transition-all ${
                    selectedMemberId === m.id
                      ? 'bg-primary text-white border-primary'
                      : darkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* Tips List */}
          {personalizedLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : filteredTips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-bold text-xs gap-2">
              <Info className="w-8 h-8 text-slate-300" />
              <span>{searchQuery ? 'No guides match your search query.' : 'No articles found in this section.'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTips.map((tip) => (
                <TipCard 
                  key={tip.id} 
                  tip={tip} 
                  isBookmarked={bookmarks.some(t => t.id === tip.id)}
                  onToggleBookmark={handleToggleBookmark}
                  onReadMore={() => setSelectedTip(tip)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TipsModule;
