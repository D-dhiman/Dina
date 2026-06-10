"use client";

import { useState } from 'react';
import Navbar from "../components/navbar";
import { Plus, Flame, Sparkles, Target, Zap } from 'lucide-react';

export default function DailiesPage() {
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState<string>("exercise");
  const [prescribedTime, setPrescribedTime] = useState("08:00"); 
  const [lastTimeToDo, setLastTimeToDo] = useState("21:00");     
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  const categoriesList = [
    { id: 'exercise', label: 'Exercise', desc: 'Workouts & movement' },
    { id: 'meal', label: 'Meal', desc: 'Diet & nutrition' },
    { id: 'sleep', label: 'Sleep', desc: 'Rest & recovery' },
    { id: 'work', label: 'Work/Prod', desc: 'Tasks & focus' },
    { id: 'mindset', label: 'Mindset', desc: 'Meditation & clarity' },
    { id: 'learning', label: 'Learning', desc: 'Skills & reading' },
    { id: 'health', label: 'Health', desc: 'Hygiene & vitals' },
    { id: 'finance', label: 'Finance', desc: 'Budget & savings' },
    { id: 'social', label: 'Social', desc: 'Family & networking' }
  ];

  const handleCreateDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    console.log({
      id: crypto.randomUUID(),
      habitName,
      category,
      prescribedTime,
      lastTimeToDo,
      frequency,
      streakCount: 0, 
      longestStreak: 0,
      createdAt: new Date().toISOString()
    });

    setHabitName("");
    setPrescribedTime("08:00");
    setLastTimeToDo("21:00");
  };

  const getSelectedCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'meal':
        return 'bg-[#006944] border-[#006944] text-white shadow-lg shadow-[#006944]/20 ring-4 ring-[#006944]/10 scale-[1.02]';
      case 'exercise':
        return 'bg-emerald-700 border-emerald-700 text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-700/10 scale-[1.02]';
      case 'sleep':
        return 'bg-indigo-700 border-indigo-700 text-white shadow-lg shadow-indigo-700/20 ring-4 ring-indigo-700/10 scale-[1.02]';
      case 'work':
        return 'bg-blue-700 border-blue-700 text-white shadow-lg shadow-blue-700/20 ring-4 ring-blue-700/10 scale-[1.02]';
      case 'mindset':
        return 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20 ring-4 ring-amber-600/10 scale-[1.02]';
      case 'learning':
        return 'bg-cyan-700 border-cyan-700 text-white shadow-lg shadow-cyan-700/20 ring-4 ring-cyan-700/10 scale-[1.02]';
      case 'health':
        return 'bg-rose-700 border-rose-700 text-white shadow-lg shadow-rose-700/20 ring-4 ring-rose-700/10 scale-[1.02]';
      case 'finance':
        return 'bg-purple-700 border-purple-700 text-white shadow-lg shadow-purple-700/20 ring-4 ring-purple-700/10 scale-[1.02]';
      case 'social':
        return 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20 ring-4 ring-orange-600/10 scale-[1.02]';
      default:
        return 'bg-gray-800 border-gray-800 text-white shadow-md scale-[1.02]';
    }
  };

  return (
    // Deepest background page switched to a premium warm cream layout palette
    <div className="w-full min-h-screen bg-[#f9f8f3] pb-24 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Header Banner Component Block */}
        <header className="flex items-center justify-between mx-5 mb-8 border-b border-gray-200/60 pb-6 transition-all duration-300">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#112a11] tracking-tight flex items-center gap-2">
              Create a new Daily to improve your lifestyle
            </h1>
          </div>
        </header>

        {/* Elevated Workspace Form Card */}
        <div className="w-full bg-white border border-gray-200/70 rounded-[36px] p-8 sm:p-12 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-10 pb-5 border-b border-gray-100">
            <h2 className="text-2xl font-black text-[#112a11] flex items-center gap-3">
              <Sparkles size={24} className="text-emerald-600 animate-pulse" />
              Create new Daily
            </h2>
            <span className="hidden sm:inline-block text-xs font-bold text-emerald-700/80 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest">
              Standard Matrix Input
            </span>
          </div>

          <form onSubmit={handleCreateDaily} className="space-y-10">
            
            {/* Task Title Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Target size={14} className="text-gray-400" />
                Task Title
              </label>
              <input
                type="text"
                required
                placeholder="What lifestyle design choice are we implementing today?"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="w-full text-base sm:text-lg bg-[#faf9f5] border border-gray-200/80 rounded-2xl px-6 py-4.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 font-medium transition-all duration-200"
              />
            </div>

            {/* Luxurious Expanded Category Boxes Selection Grid */}
            <div className="space-y-3.5">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Category Selection</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`group text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 select-none flex flex-col gap-1.5 ${
                      category === cat.id
                        ? getSelectedCategoryStyles(cat.id)
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-[#faf9f5] hover:-translate-y-0.5 active:translate-y-0 shadow-2xs'
                    }`}
                  >
                    <span className="text-sm font-extrabold tracking-wide uppercase">
                      {cat.label}
                    </span>
                    <span className={`text-xs transition-colors line-clamp-1 ${
                      category === cat.id ? 'text-white/80 font-medium' : 'text-gray-400 group-hover:text-gray-500'
                    }`}>
                      {cat.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* High-Padding Frequency Selector Module */}
            <div className="space-y-3.5">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Frequency</label>
              <div className="grid grid-cols-3 gap-4">
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-4 sm:py-5 px-4 text-sm font-extrabold rounded-2xl transition-all duration-200 border text-center ${
                      frequency === freq
                        ? 'bg-[#4a5ab5] border-[#4a5ab5] text-white shadow-lg shadow-indigo-600/10 scale-[1.01]'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-[#faf9f5] active:scale-[0.99] shadow-2xs'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Padding Time Configuration Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Scheduled Target Time</label>
                <input
                  type="time"
                  value={prescribedTime}
                  onChange={(e) => setPrescribedTime(e.target.value)}
                  className="w-full text-base bg-[#faf9f5] border border-gray-200/80 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Latest Action Cutoff</label>
                <input
                  type="time"
                  value={lastTimeToDo}
                  onChange={(e) => setLastTimeToDo(e.target.value)}
                  className="w-full text-base bg-[#faf9f5] border border-gray-200/80 rounded-2xl p-4 font-bold text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors shadow-2xs"
                />
              </div>
            </div>

            {/* Visual Action Button Container */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold py-5 px-6 rounded-2xl text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-xl hover:shadow-emerald-900/10 active:scale-[0.99]"
              >
                <Plus size={22} strokeWidth={2.5} />
                <span>Create Daily Row</span>
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}