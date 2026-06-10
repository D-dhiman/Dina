"use client";

import { useState } from 'react';
import Navbar from "../components/navbar";
import { Plus, Flame, Sparkles } from 'lucide-react';

export default function DailiesPage() {
  // Form input control states matching your updated blueprint
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState<string>("exercise");
  const [prescribedTime, setPrescribedTime] = useState("08:00"); 
  const [lastTimeToDo, setLastTimeToDo] = useState("21:00");     
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  const categoriesList = [
    { id: 'exercise', label: 'Exercise' },
    { id: 'meal', label: 'Meal' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'work', label: 'Work/Prod' },
    { id: 'mindset', label: 'Mindset' },
    { id: 'learning', label: 'Learning' },
    { id: 'health', label: 'Health' },
    { id: 'finance', label: 'Finance' },
    { id: 'social', label: 'Social' }
  ];

  const handleCreateDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    // Ready to be linked directly with your DB insert row execution logic
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

    // Reset fields
    setHabitName("");
    setPrescribedTime("08:00");
    setLastTimeToDo("21:00");
  };

  const getSelectedCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'meal':
        return 'bg-[#006944] border-[#006944] text-white shadow-md ring-4 ring-[#006944]/10 scale-[1.01]';
      case 'exercise':
        return 'bg-emerald-700 border-emerald-700 text-white shadow-md ring-4 ring-emerald-700/10 scale-[1.01]';
      case 'sleep':
        return 'bg-indigo-700 border-indigo-700 text-white shadow-md ring-4 ring-indigo-700/10 scale-[1.01]';
      case 'work':
        return 'bg-blue-700 border-blue-700 text-white shadow-md ring-4 ring-blue-700/10 scale-[1.01]';
      case 'mindset':
        return 'bg-amber-600 border-amber-600 text-white shadow-md ring-4 ring-amber-600/10 scale-[1.01]';
      case 'learning':
        return 'bg-cyan-700 border-cyan-700 text-white shadow-md ring-4 ring-cyan-700/10 scale-[1.01]';
      case 'health':
        return 'bg-rose-700 border-rose-700 text-white shadow-md ring-4 ring-rose-700/10 scale-[1.01]';
      case 'finance':
        return 'bg-purple-700 border-purple-700 text-white shadow-md ring-4 ring-purple-700/10 scale-[1.01]';
      case 'social':
        return 'bg-orange-600 border-orange-600 text-white shadow-md ring-4 ring-orange-600/10 scale-[1.01]';
      default:
        return 'bg-gray-800 border-gray-800 text-white shadow-md scale-[1.01]';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfdfa] pb-20 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        
        {/* Header Banner Component Block */}
        <header className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6 transition-all duration-300">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
              Good morning <span className="inline-block animate-bounce [animation-duration:3s]">👋</span>
            </h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">
              Configure and build your lifestyle routine rulesets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-sm hover:scale-105 transition-transform">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-800">7</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#062e14] flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer select-none">
              U
            </div>
          </div>
        </header>

        {/* Full Width Workspace Form Structure */}
        <div className="w-full bg-white border border-gray-200/80 rounded-[32px] p-6 sm:p-10 shadow-xs hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-[#1e3a1e] flex items-center gap-2.5">
              <Sparkles size={22} className="text-emerald-600" />
              Create Habit
            </h2>
            <span className="text-xs font-semibold text-gray-400 tracking-tight">
              All metrics configure standard DB row presets
            </span>
          </div>

          <form onSubmit={handleCreateDaily} className="space-y-8">
            {/* Task Title */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Task Title</label>
              <input
                type="text"
                required
                placeholder="Enter dynamic routine headline..."
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="w-full text-base bg-[#fcfdfa] border border-gray-200 rounded-2xl px-5 py-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 font-medium transition-all duration-200"
              />
            </div>

            {/* Expanded Wide Perspective Category Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category Selection</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-4 px-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all duration-200 text-center select-none ${
                      category === cat.id
                        ? getSelectedCategoryStyles(cat.id)
                        : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50/80 active:scale-[0.99]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency Selector Module */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Frequency</label>
              <div className="grid grid-cols-3 gap-3">
                {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`py-3.5 px-4 text-xs font-bold rounded-xl transition-all duration-200 border ${
                      frequency === freq
                        ? 'bg-[#5c6bc0] border-[#5c6bc0] text-white shadow-md scale-[1.01]'
                        : 'bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100 active:scale-[0.99]'
                    }`}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Configuration Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Scheduled Time</label>
                <input
                  type="time"
                  value={prescribedTime}
                  onChange={(e) => setPrescribedTime(e.target.value)}
                  className="w-full text-sm bg-[#fcfdfa] border border-gray-200 rounded-xl p-3.5 font-medium text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Latest Cutoff Time</label>
                <input
                  type="time"
                  value={lastTimeToDo}
                  onChange={(e) => setLastTimeToDo(e.target.value)}
                  className="w-full text-sm bg-[#fcfdfa] border border-gray-200 rounded-xl p-3.5 font-medium text-gray-700 focus:outline-none focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Form Submit Row Action */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 px-6 rounded-2xl text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <Plus size={20} />
                <span>Create Habit Row</span>
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}