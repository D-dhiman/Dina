"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import { 
  Star, FileText, Salad, Fish, Candy, 
  Plus, Trash2, Sparkles, CalendarDays, Apple
} from "lucide-react";

interface ActivityItem {
  id: string;
  name: string;
  category: "New" | "Modified" | "Delete";
}

export default function HealthReportPage() {
  // Set this below 35 to see the highlighted warning and danger image pop up instantly
  const backendHealthScore = 32; 

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

  const [newDailyName, setNewDailyName] = useState("");
  const [newDailyCat, setNewDailyCat] = useState<"New" | "Modified" | "Delete">("New");
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCat, setNewHabitCat] = useState<"New" | "Modified" | "Delete">("New");
  const [isSavingDailies, setIsSavingDailies] = useState(false);
  const [isSavingHabits, setIsSavingHabits] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const persistTrackedItems = async (type: 'daily' | 'habit', itemsList: ActivityItem[]) => {
    const isDaily = type === 'daily';
    const targetSetter = isDaily ? setIsSavingDailies : setIsSavingHabits;
    targetSetter(true);

    try {
      const endpoint = isDaily ? '/api/dailies/sync-prescription' : '/api/habits/sync-prescription';
      const payload = {
        prescriptions: itemsList.map(item => ({
          name: item.name,
          system_action: item.category, 
          frequency: "daily",
          updated_at: new Date().toISOString()
        }))
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Sync failed`);
      alert(`Prescribed updates synced successfully.`);
    } catch (error) {
      console.error(error);
      alert(`Failed to sync changes.`);
    } finally {
      targetSetter(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafb96]/10 text-gray-900 antialiased pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* UPPER MAIN LAYOUT LAYER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SIDE PANEL: Profile Map */}
          <div className="md:col-span-5 h-full">
            <div className="bg-sky-950 text-sky-200 font-mono text-xl h-full min-h-[28rem] rounded-3xl flex flex-col justify-between p-6 shadow-xl relative overflow-hidden border border-sky-800">
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
          </div>

          {/* RIGHT SIDE PANEL: Engine Telemetry Metrics */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            
            {/* Health Score Panel Box */}
            <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md flex items-center justify-between bg-gradient-to-r from-amber-50 to-white hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-200 rounded-2xl flex items-center justify-center shadow-inner border border-amber-300 shrink-0">
                  <Star size={30} className="text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black text-gray-900 font-mono tracking-tighter">
                      {backendHealthScore}
                    </span>
                    <span className="text-lg font-bold text-gray-400 ml-0.5">/100</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mt-0.5">Calculated by engine telemetry</p>
                </div>
              </div>

              {/* PROMINENT POPPED-UP WARNING BANNER: Only renders when score < 35 */}
              {backendHealthScore < 35 && (
                <div className="flex items-center gap-2.5 mr-1 shrink-0">
                  
                  {/* Highlighted Speech Callout Box (Pulse animation retained for prominence, can be removed if desired) */}
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-2xl shadow-xl shadow-red-200 border border-red-700 relative animate-pulse">
                    Need to see Dr.
                    {/* CSS Speech Bubble Pointer Tip */}
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-rose-600 border-b-[6px] border-b-transparent" />
                  </div>

                  {/* Danger Icon without bounce animation */}
                  <div className="flex items-center justify-center p-1">
                    <img 
                      src="/danger.png" 
                      alt="Critical System Warning" 
                      className="w-12 h-12 object-contain drop-shadow-md"
                    />
                  </div>

                </div>
              )}
            </div>

            {/* Matrix Block Explanations Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl p-5 bg-gradient-to-br from-sky-100 to-sky-200 border border-sky-300/60 shadow-md">
                <div className="font-mono text-xs text-sky-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" /> Risk block analysis
                </div>
                <p className="text-xs font-semibold text-sky-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-sky-300/40">
                  CRITICAL ALERT: Markers indicate immediate variance from healthy baseline. Close clinical evaluation recommended.
                </p>
              </div>

              <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/60 shadow-md">
                <div className="font-mono text-xs text-emerald-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Preventive parameters
                </div>
                <p className="text-xs font-semibold text-emerald-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-emerald-300/40">
                  PAUSE NON-ESSENTIALS: Restrict excessive physical exertion. Prioritize direct tracking protocols.
                </p>
              </div>
            </div>

            {/* Evaluation Interpretation */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300/50 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-[#581c87]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#581c87]">
                  Interpretation for the health report
                </h3>
              </div>
              <div className="bg-white/50 p-3 rounded-2xl border border-purple-300/40">
                <p className="text-sm font-medium text-purple-950 leading-relaxed">
                  Markers are trending in the right direction, with one habit pattern worth watching this quarter. Sleep consistency remains primary focal marker.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* THREE COLUMN ACTION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
          
          {/* COLUMN 1: Cleaned Food Prescription Block */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#fef08a] to-[#fde047] border border-[#facc15]/60 shadow-md flex flex-col group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-yellow-500/10 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
              <Apple size={90} />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Salad size={18} className="text-[#713f12]" />
              <h3 className="text-sm uppercase tracking-wider text-[#713f12] font-black">Food Prescription</h3>
            </div>
            <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
              {[
                { name: "Leafy greens", amount: "4–5 servings / wk", icon: <Salad size={16} className="text-emerald-700" /> },
                { name: "Oily fish", amount: "2 servings / wk", icon: <Fish size={16} className="text-blue-700" /> },
                { name: "Reduce sugar", amount: "< 25g / day", icon: <Candy size={16} className="text-amber-700" /> }
              ].map((food, idx) => (
                <div key={idx} className="bg-white/70 p-3 rounded-2xl border border-yellow-400/30 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    {food.icon}
                    <span className="text-xs font-extrabold text-gray-900">{food.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-black text-yellow-900/80 bg-yellow-400/20 px-2 py-0.5 rounded-md">
                    {food.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: Dailies Matrix Tracker */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#6ee7b7]/50 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#065f46]" />
                  <h3 className="text-sm uppercase tracking-wider text-[#065f46] font-black">Dailies</h3>
                </div>
                <span className="text-[10px] font-mono bg-[#065f46]/10 text-[#065f46] px-2 py-0.5 rounded-full font-bold">
                  {dailies.length} Prescribed
                </span>
              </div>
              
              <div className="bg-white/60 p-1.5 rounded-2xl border border-emerald-300/40 grid grid-cols-12 gap-1.5 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newDailyName}
                  onChange={(e) => setNewDailyName(e.target.value)}
                  placeholder="Prescription name..." 
                  className="col-span-6 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
                <select 
                  value={newDailyCat}
                  onChange={(e) => setNewDailyCat(e.target.value as any)}
                  className="col-span-4 min-w-0 bg-white border border-gray-200 rounded-xl px-1 py-1 text-[11px] font-black text-gray-700 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Modified">Mod</option>
                  <option value="Delete">Del</option>
                </select>
                <button 
                  onClick={() => { if(!newDailyName) return; setDailies([...dailies, { id: Date.now().toString(), name: newDailyName, category: newDailyCat }]); setNewDailyName(""); }} 
                  className="col-span-2 flex items-center justify-center w-full h-7 bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {dailies.map(item => (
                  <div key={item.id} className="bg-white/80 p-2.5 rounded-xl border border-emerald-300/30 flex items-center justify-between text-xs shadow-xs">
                    <span className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      item.category === 'New' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
                      item.category === 'Modified' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-red-100 border-red-200 text-red-800'
                    }`}>{item.category}</span>
                    <span className="font-bold text-gray-800 flex-1 px-3 truncate">{item.name}</span>
                    <button onClick={() => setDailies(dailies.filter(d => d.id !== item.id))} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => persistTrackedItems('daily', dailies)} disabled={isSavingDailies} className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md uppercase tracking-wider">
              {isSavingDailies ? "Syncing..." : "save daily alterations"}
            </button>
          </div>

          {/* COLUMN 3: Habits Matrix Tracker */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-teal-100 to-teal-200 border border-teal-300/50 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-teal-900" />
                  <h3 className="text-sm uppercase tracking-wider text-teal-900 font-black">Habits</h3>
                </div>
                <span className="text-[10px] font-mono bg-teal-900/10 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                  {habits.length} Prescribed
                </span>
              </div>

              <div className="bg-white/60 p-1.5 rounded-2xl border border-teal-300/40 grid grid-cols-12 gap-1.5 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Prescription name..." 
                  className="col-span-6 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-teal-500 font-medium"
                />
                <select 
                  value={newHabitCat}
                  onChange={(e) => setNewHabitCat(e.target.value as any)}
                  className="col-span-4 min-w-0 bg-white border border-gray-200 rounded-xl px-1 py-1 text-[11px] font-black text-gray-700 focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Modified">Mod</option>
                  <option value="Delete">Del</option>
                </select>
                <button 
                  onClick={() => { if(!newHabitName) return; setHabits([...habits, { id: Date.now().toString(), name: newHabitName, category: newHabitCat }]); setNewHabitName(""); }} 
                  className="col-span-2 flex items-center justify-center w-full h-7 bg-teal-600 rounded-xl text-white hover:bg-teal-700 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {habits.map(item => (
                  <div key={item.id} className="bg-white/80 p-2.5 rounded-xl border border-teal-300/30 flex items-center justify-between text-xs shadow-xs">
                    <span className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      item.category === 'New' ? 'bg-emerald-100 border-emerald-200 text-emerald-800' :
                      item.category === 'Modified' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-red-100 border-red-200 text-red-800'
                    }`}>{item.category}</span>
                    <span className="font-bold text-gray-800 flex-1 px-3 truncate">{item.name}</span>
                    <button onClick={() => setHabits(habits.filter(h => h.id !== item.id))} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => persistTrackedItems('habit', habits)} disabled={isSavingHabits} className="w-full mt-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md uppercase tracking-wider">
              {isSavingHabits ? "Syncing..." : "save habit alterations"}
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}