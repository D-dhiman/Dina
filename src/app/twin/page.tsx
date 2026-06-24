"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import { 
  Star, Flag, FileText, Salad, Fish, Candy, 
  Check, Flame, Plus, Trash2, Sparkles, CalendarDays, 
  ArrowRightLeft, Apple
} from "lucide-react";

interface ActivityItem {
  id: string;
  name: string;
  category: "New" | "Modified" | "Delete";
}

export default function HealthReportPage() {
  // Backend config parameters
  const backendHealthScore = "94"; 
  const backendFlagState: "urgent" | "non_immediate" | "no_need" = "urgent"; 

  // Interactive lists states
  const [dailies, setDailies] = useState<ActivityItem[]>([
    { id: "d1", name: "Meditation (Mindfulness)", category: "New" },
    { id: "d2", name: "Morning hydration logs", category: "Modified" },
    { id: "d3", name: "Late caffeine log allocation", category: "Delete" }
  ]);

  const [habits, setHabits] = useState<ActivityItem[]>([
    { id: "h1", name: "Skincare regimen setup", category: "New" },
    { id: "h2", name: "Screen boundaries", category: "Modified" },
    { id: "h3", name: "Midnight snacking routines", category: "Delete" }
  ]);

  // Form states for custom item injection
  const [newDailyName, setNewDailyName] = useState("");
  const [newDailyCat, setNewDailyCat] = useState<"New" | "Modified" | "Delete">("New");
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCat, setNewHabitCat] = useState<"New" | "Modified" | "Delete">("New");

  // Helper actions to stream prescriptions instantly into tracking groups
  const injectAsDaily = (name: string) => {
    const newItem: ActivityItem = { id: Date.now().toString(), name, category: "New" };
    setDailies((prev) => [...prev, newItem]);
  };

  const injectAsHabit = (name: string) => {
    const newItem: ActivityItem = { id: Date.now().toString(), name, category: "New" };
    setHabits((prev) => [...prev, newItem]);
  };

  // Flag states automated configurations mapping
  const flagConfigs = {
    urgent: {
      title: "CRITICAL ACTION REQUIRED",
      label: "Urgently need to see Dr.",
      badgeStyle: "bg-gradient-to-r from-red-600 to-rose-700 text-white animate-pulse shadow-xl shadow-red-200/50 border-red-700",
      riskText: "CRITICAL ALERT: Markers indicate immediate variance from healthy baseline. Close clinical evaluation recommended.",
      preventativeText: "PAUSE NON-ESSENTIALS: Restrict excessive physical exertion. Prioritize direct tracking protocols."
    },
    non_immediate: {
      title: "ATTENTION REQUIRED",
      label: "Need Dr. but not immediate",
      badgeStyle: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-200/50 border-amber-600",
      riskText: "MODERATE VARIANCE: Minor shifts noted in tracking logs. Schedule a routine follow-up within 14 days.",
      preventativeText: "MAINTAIN REGIMEN: Continue current lifestyle adjustments. Refrain from introducing new variables."
    },
    no_need: {
      title: "STATUS CLEAR",
      label: "No need for Dr.",
      badgeStyle: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-200/40 border-emerald-700",
      riskText: "STABLE BASELINE: All metric indicators are within expected margins. No signs of physiological stress.",
      preventativeText: "OPTIMIZE HABITS: Maintain standard preventive plans. Safe to escalate conditioning parameters."
    }
  };

  const activeConfig = flagConfigs[backendFlagState];

  return (
    <div className="min-h-screen bg-[#fafb96]/10 text-gray-900 antialiased pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* UPPER MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Avatar & Prescriptions */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Expanded Body Visual Layer */}
            <div className="bg-sky-950 text-sky-200 font-mono text-xl h-[31rem] rounded-3xl flex flex-col justify-between p-6 shadow-xl relative overflow-hidden border border-sky-800">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 via-transparent to-black/80 pointer-events-none" />
              <div className="z-10 flex justify-between items-start">
                <div>
                  <span className="text-xs bg-sky-500/20 text-sky-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-sky-500/30">
                    Full Body Map
                  </span>
                </div>
                <div className="text-right text-xs text-sky-400 font-bold">ID: #9954-A0</div>
              </div>
              
              <div className="z-10 flex flex-col items-center justify-center text-center py-12">
                <div className="w-32 h-32 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg backdrop-blur-xs transition-transform hover:scale-105 duration-300">
                  M
                </div>
                <h2 className="text-2xl font-black text-white font-sans tracking-tight">Maya Okafor</h2>
                <p className="text-sky-300 text-sm font-sans font-bold mt-1">Age 28 · Female</p>
              </div>

              <div className="z-10 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-[11px] font-sans font-medium text-sky-200 text-center uppercase tracking-widest">
                  Rendering complete • System stable
                </p>
              </div>
            </div>

            {/* Food Prescription Block with Interactive Streaming Actions */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#fef08a] to-[#fde047] border border-[#facc15]/60 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-yellow-500/20 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
                <Apple size={100} />
              </div>
              
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Salad size={18} className="text-[#713f12]" />
                <h3 className="text-xs uppercase tracking-[0.2em] text-[#713f12] font-black">
                  Food Prescription
                </h3>
              </div>
              
              <div className="space-y-3 relative z-10">
                {[
                  { name: "Leafy greens", amount: "4–5 servings / wk", icon: <Salad size={16} className="text-emerald-700" /> },
                  { name: "Oily fish", amount: "2 servings / wk", icon: <Fish size={16} className="text-blue-700" /> },
                  { name: "Reduce sugar intake", amount: "< 25g / day", icon: <Candy size={16} className="text-amber-700" /> }
                ].map((food, idx) => (
                  <div key={idx} className="bg-white/70 hover:bg-white/90 p-3 rounded-2xl border border-yellow-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        {food.icon}
                        <span className="text-sm font-extrabold text-gray-900">{food.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-yellow-900/70 block mt-0.5 ml-6">{food.amount}</span>
                    </div>
                    
                    {/* Add options to stream as Dailies or Habits */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-yellow-600/10">
                      <button 
                        onClick={() => injectAsDaily(`${food.name} (${food.amount})`)}
                        className="text-[10px] font-mono font-black uppercase px-2 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Plus size={10} /> Daily
                      </button>
                      <button 
                        onClick={() => injectAsHabit(`${food.name} (${food.amount})`)}
                        className="text-[10px] font-mono font-black uppercase px-2 py-1 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Plus size={10} /> Habit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Metrics, Automated Badges, Explanations */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Top Row Layout Action - Centered Health Score Metric Weight */}
            <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md flex items-center justify-between bg-gradient-to-r from-amber-50 to-white hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-200 rounded-2xl flex items-center justify-center shadow-inner border border-amber-300">
                  <Star size={30} className="text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xs uppercase font-black tracking-widest text-amber-800">Overall Health Score</h2>
                  <p className="text-[11px] font-bold text-gray-500 mt-0.5">Calculated by engine telemetry</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-gray-900 font-mono tracking-tighter">
                  {backendHealthScore}
                </span>
                <span className="text-lg font-bold text-gray-400">/100</span>
              </div>
            </div>

            {/* Pure Preset String Auto Indicator Badge Box */}
            <div className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all duration-300 ${activeConfig.badgeStyle}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
                  <Flag size={20} className="fill-white" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-90 block font-bold">
                    {activeConfig.title}
                  </span>
                  <span className="text-lg font-black tracking-tight">{activeConfig.label}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-black border border-white/40 px-3 py-1 rounded-full bg-white/20 uppercase tracking-wider hidden sm:inline-block">
                Active Priority
              </span>
            </div>

            {/* Block Layout Summaries paired dynamically to Backend Flag selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl p-5 bg-gradient-to-br from-sky-100 to-sky-200 border border-sky-300/60 shadow-md flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs text-sky-950 uppercase tracking-widest mb-3 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600" /> Risk block analysis
                  </div>
                  <p className="text-xs font-semibold text-sky-900 leading-relaxed bg-white/60 p-3.5 rounded-2xl border border-sky-300/40 shadow-xs">
                    {activeConfig.riskText}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/60 shadow-md flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs text-emerald-950 uppercase tracking-widest mb-3 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" /> Preventive parameters
                  </div>
                  <p className="text-xs font-semibold text-emerald-900 leading-relaxed bg-white/60 p-3.5 rounded-2xl border border-emerald-300/40 shadow-xs">
                    {activeConfig.preventativeText}
                  </p>
                </div>
              </div>
            </div>

            {/* Interpretation Card */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#e9d5ff] to-[#d8b4fe] border border-[#c084fc]/50 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-[#581c87]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#581c87]">
                  Interpretation for the health report
                </h3>
              </div>
              <div className="bg-white/50 p-4 rounded-2xl border border-purple-300/40 shadow-xs">
                <p className="text-sm font-medium text-purple-950 leading-relaxed">
                  Markers are trending in the right direction, with one habit pattern worth watching this quarter. Cholesterol and resting heart rate have both improved since the last review. Sleep consistency remains primary focal marker.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* PARALLEL INTERACTIVE TRACKING PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Dailies Tracker element layout */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#6ee7b7]/50 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#065f46]" />
                  <h3 className="text-sm uppercase tracking-wider text-[#065f46] font-black">Dailies</h3>
                </div>
                <span className="text-[10px] font-mono bg-[#065f46]/10 text-[#065f46] px-2 py-0.5 rounded-full font-bold">
                  {dailies.length} Loaded
                </span>
              </div>
              
              {/* Form Input subrow selector */}
              <div className="bg-white/60 p-2 rounded-2xl border border-emerald-300/40 flex gap-2 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newDailyName}
                  onChange={(e) => setNewDailyName(e.target.value)}
                  placeholder="Add item..." 
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
                <select 
                  value={newDailyCat}
                  onChange={(e) => setNewDailyCat(e.target.value as any)}
                  className="bg-white border border-gray-200 rounded-xl px-1.5 py-1.5 text-[11px] font-black text-gray-700"
                >
                  <option value="New">New</option>
                  <option value="Modified">Mod</option>
                  <option value="Delete">Del</option>
                </select>
                <button 
                  onClick={() => {
                    if(!newDailyName) return;
                    setDailies([...dailies, { id: Date.now().toString(), name: newDailyName, category: newDailyCat }]);
                    setNewDailyName("");
                  }}
                  className="p-1.5 bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {dailies.map(item => (
                  <div key={item.id} className="bg-white/80 hover:bg-white p-2.5 rounded-xl border border-emerald-300/30 flex items-center justify-between text-xs transition-all shadow-xs group">
                    <span className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      item.category === 'New' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
                      item.category === 'Modified' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                      'bg-red-100 border-red-200 text-red-800'
                    }`}>
                      {item.category}
                    </span>
                    <span className="font-bold text-gray-800 flex-1 px-3 truncate">{item.name}</span>
                    <button 
                      onClick={() => setDailies(dailies.filter(d => d.id !== item.id))}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md uppercase tracking-wider">
              save daily modifications
            </button>
          </div>

          {/* Habits Panel with identical row matching arrays */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-100 to-teal-200 border border-teal-300/50 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-teal-900" />
                  <h3 className="text-sm uppercase tracking-wider text-teal-900 font-black">Habits</h3>
                </div>
                <span className="text-[10px] font-mono bg-teal-900/10 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                  {habits.length} Loaded
                </span>
              </div>

              {/* Form Input subrow selector */}
              <div className="bg-white/60 p-2 rounded-2xl border border-teal-300/40 flex gap-2 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Add habit..." 
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 font-medium"
                />
                <select 
                  value={newHabitCat}
                  onChange={(e) => setNewHabitCat(e.target.value as any)}
                  className="bg-white border border-gray-200 rounded-xl px-1.5 py-1.5 text-[11px] font-black text-gray-700"
                >
                  <option value="New">New</option>
                  <option value="Modified">Mod</option>
                  <option value="Delete">Del</option>
                </select>
                <button 
                  onClick={() => {
                    if(!newHabitName) return;
                    setHabits([...habits, { id: Date.now().toString(), name: newHabitName, category: newHabitCat }]);
                    setNewHabitName("");
                  }}
                  className="p-1.5 bg-teal-600 rounded-xl text-white hover:bg-teal-700 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {habits.map(item => (
                  <div key={item.id} className="bg-white/80 hover:bg-white p-2.5 rounded-xl border border-teal-300/30 flex items-center justify-between text-xs transition-all shadow-xs group">
                    <span className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      item.category === 'New' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
                      item.category === 'Modified' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                      'bg-red-100 border-red-200 text-red-800'
                    }`}>
                      {item.category}
                    </span>
                    <span className="font-bold text-gray-800 flex-1 px-3 truncate">{item.name}</span>
                    <button 
                      onClick={() => setHabits(habits.filter(h => h.id !== item.id))}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full mt-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md uppercase tracking-wider">
              save habit modifications
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}