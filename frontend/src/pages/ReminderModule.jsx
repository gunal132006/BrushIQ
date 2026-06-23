import React, { useState, useEffect } from 'react';
import { reminderService, familyService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ReminderCard from '../components/ReminderCard';
import { Bell, AlertCircle } from 'lucide-react';

const ReminderModule = () => {
  const { darkMode } = useTheme();

  const [reminders, setReminders] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [remRes, memRes] = await Promise.all([
        reminderService.getReminders(),
        familyService.getMembers(),
      ]);
      setReminders(remRes.data);
      setFamilyMembers(memRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve active reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async (id) => {
    try {
      await reminderService.completeReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to complete reminder');
    }
  };

  const filteredReminders = selectedMemberId === 'all' 
    ? reminders 
    : reminders.filter(r => r.familyMemberId === selectedMemberId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400">Loading active reminders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Header and Filter */}
      <div className="flex justify-between items-center px-1">
        <p className="text-xs text-slate-455 dark:text-slate-500 font-bold m-0 uppercase tracking-wide">
          Pending Checklist ({filteredReminders.length})
        </p>

        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className={`px-2.5 py-1.5 rounded-lg border outline-none font-semibold text-xs transition-all ${
            darkMode 
              ? 'bg-slate-900 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <option value="all">All Profiles</option>
          {familyMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35 p-3 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {filteredReminders.length === 0 ? (
        <div className={`text-center py-12 border border-dashed rounded-2xl ${
          darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-250'
        }`}>
          <Bell className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <h4 className="font-bold text-sm mb-1">No Active Reminders</h4>
          <p className="text-slate-400 text-xs px-4 leading-normal">
            Reminders generate automatically based on toothbrush age, usage counts, and scanning intervals.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReminders.map((reminder) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onComplete={handleComplete} 
            />
          ))}
        </div>
      )}

      {/* Guidelines info */}
      <div className={`p-4 rounded-2xl border flex gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-xs m-0">Hygiene Reminder Cycles</h4>
          <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
            Healthy brushes generate weekly check-ins. Moderately worn brushes step up to 3-day checks. Defective brushes generate daily alerts to remind you to replace them.
          </p>
        </div>
      </div>

    </div>
  );
};

export default ReminderModule;
