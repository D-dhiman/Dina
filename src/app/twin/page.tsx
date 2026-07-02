"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

// Points directly to your FastAPI microservice
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return { 
    "Content-Type": "application/json", 
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export default function HealthReportPage() {
  const router = useRouter();
  
  // Dynamic Profile Identifier configuration
  const testPatientId = "pid1789456"; 

  // Telemetry & Profile State
  const [backendHealthScore, setBackendHealthScore] = useState(32);
  const [userName, setUserName] = useState("Maya Okafor");
  const [userAge, setUserAge] = useState(28);
  const [userGender, setUserGender] = useState("Female");
  const [loading, setLoading] = useState(true);

  // Dynamic Telemetry State Text Blocks
  const [riskAnalysis, setRiskAnalysis] = useState("Loading dynamic risk analysis matrix...");
  const [preventiveParams, setPreventiveParams] = useState("Calculating operational metrics data...");
  const [interpretation, setInterpretation] = useState("Parsing clinical engine narrative summaries...");

  // Matrix Tracker States
  const [dailies, setDailies] = useState<ActivityItem[]>([]);
  const [habits, setHabits] = useState<ActivityItem[]>([]);

  const [newDailyName, setNewDailyName] = useState("");
  const [newDailyCat, setNewDailyCat] = useState<"New" | "Modified" | "Delete">("New");
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCat, setNewHabitCat] = useState<"New" | "Modified" | "Delete">("New");
  
  const [isSavingDailies, setIsSavingDailies] = useState(false);
  const [isSavingHabits, setIsSavingHabits] = useState(false);

  // ── Fetch Report Telemetry & Existing Prescriptions ────────────────
  useEffect(() => {
    async function fetchReportData() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!token) { router.push("/login"); return; }

        console.log(`📡 Querying twin core telemetry matrix at: ${BACKEND_URL}/twin/assess/${testPatientId}`);
        const telemetryRes = await fetch(`${BACKEND_URL}/twin/assess/${testPatientId}`, { 
          headers: authHeaders() 
        });
        
        if (telemetryRes.status === 401) { 
          router.push("/login"); 
          return; 
        }
        
        if (!telemetryRes.ok) {
          throw new Error(`FastAPI Telemetry Error: Handled with status ${telemetryRes.status}`);
        }

        const data = await telemetryRes.json();
        console.log("📊 Received Verified Twin Engine Data Payload:", data);
        
        // 1. Map core profile user blocks
        setUserName(data.user?.name || "Maya Okafor");
        setUserAge(data.user?.age || 28);
        setUserGender(data.user?.gender || "Female");
        setBackendHealthScore(data.user?.health_score ?? 32);

        // 2. Map dynamic text insight blocks
        setRiskAnalysis(data.analytics?.risk_block || "CRITICAL ALERT: Markers indicate immediate variance from healthy baseline. Close clinical evaluation recommended.");
        setPreventiveParams(data.analytics?.preventive || "PAUSE NON-ESSENTIALS: Restrict excessive physical exertion. Prioritize direct tracking protocols.");
        setInterpretation(data.analytics?.interpretation || "Markers are trending in the right direction, with one habit pattern worth watching this quarter. Sleep consistency remains primary focal marker.");

        // 3. Map Prescribed Dailies Routine Array
        if (data.dailies && data.dailies.length > 0) {
          setDailies(data.dailies.map((d: any) => ({
            id: d.id || String(Math.random()),
            name: d.habit_name || d.name,
            category: d.system_action || "New"
          })));
        } else {
          setDailies([
            { id: "d1", name: "Meditation (Mindfulness)", category: "New" },
            { id: "d2", name: "Morning hydration logs", category: "Modified" }
          ]);
        }

        // 4. Map Prescribed Habits Routine Array
        if (data.habits && data.habits.length > 0) {
          setHabits(data.habits.map((h: any) => ({
            id: h.id || String(Math.random()),
            name: h.habit_name || h.name,
            category: h.system_action || "New"
          })));
        } else {
          setHabits([
            { id: "h1", name: "Skincare regimen setup", category: "New" },
            { id: "h2", name: "Screen boundaries", category: "Modified" }
          ]);
        }

      } catch (err) {
        console.error("🔴 Connection/Sync with FastAPI instance lost or structurally misaligned:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, [router, testPatientId]);

  // ── Sync Handler for Alterations ──────────────────────────────────
  const persistTrackedItems = async (type: 'daily' | 'habit', itemsList: ActivityItem[]) => {
    const isDaily = type === 'daily';
    const targetSetter = isDaily ? setIsSavingDailies : setIsSavingHabits;
    targetSetter(true);

    try {
      // Direct integration matching your backend endpoint topology layout rules
      const endpoint = isDaily 
        ? `${BACKEND_URL}/twin/dailies/sync` 
        : `${BACKEND_URL}/twin/habits/sync`;

      const payload = {
        patient_id: testPatientId,
        prescriptions: itemsList.map(item => ({
          name: item.name,
          system_action: item.category, 
          frequency: "daily",
          updated_at: new Date().toISOString()
        }))
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`FastAPI sync engine rejected state mutations`);
      alert(`Prescribed updates synced successfully down to digital twin core.`);
    } catch (error) {
      console.error(error);
      alert(`Failed to sync changes into operational data tables.`);
    } finally {
      targetSetter(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9f5]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading system telemetry asset models...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 bg-[#f8f9f5] pb-20 text-gray-900 antialiased">
      <Navbar />

      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        
        {/* UPPER MAIN LAYOUT LAYER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SIDE PANEL: Profile Map */}
          <div className="md:col-span-5 h-full">
            <div className="bg-[#062e14] text-emerald-200 font-mono text-xl h-full min-h-[28rem] rounded-3xl flex flex-col justify-between p-6 shadow-xl relative overflow-hidden border border-[#14532d]">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-transparent to-black/80 pointer-events-none" />
              <div className="z-10 flex justify-between items-start">
                <div>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                    Full Body Map
                  </span>
                </div>
                <div className="text-right text-xs text-emerald-400 font-bold">ID: #{testPatientId.toUpperCase()}</div>
              </div>
              
              <div className="z-10 flex flex-col items-center justify-center text-center py-12">
                <div className="w-32 h-32 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg backdrop-blur-xs transition-transform hover:scale-105 duration-300">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-black text-white font-sans tracking-tight">{userName}</h2>
                <p className="text-emerald-300 text-sm font-sans font-bold mt-1">Age {userAge} · {userGender}</p>
              </div>

              <div className="z-10 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-[11px] font-sans font-medium text-emerald-200 text-center uppercase tracking-widest">
                  Rendering complete • System stable
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE PANEL: Engine Telemetry Metrics */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            
            {/* Health Score Panel Box */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shadow-inner border border-amber-200 shrink-0">
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

              {/* PROMINENT POPPED-UP WARNING BANNER */}
              {backendHealthScore < 35 && (
                <div className="flex items-center gap-2.5 mr-1 shrink-0">
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-2xl shadow-xl shadow-red-200 border border-red-700 relative animate-pulse">
                    Need to see Dr.
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-rose-600 border-b-[6px] border-b-transparent" />
                  </div>

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
              <div className="rounded-3xl p-5 bg-gradient-to-br from-red-50 to-orange-100 border border-orange-200 shadow-sm">
                <div className="font-mono text-xs text-orange-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Risk block analysis
                </div>
                <p className="text-xs font-semibold text-orange-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-orange-200/40">
                  {riskAnalysis}
                </p>
              </div>

              <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 shadow-sm">
                <div className="font-mono text-xs text-emerald-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Preventive parameters
                </div>
                <p className="text-xs font-semibold text-emerald-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-emerald-200/40">
                  {preventiveParams}
                </p>
              </div>
            </div>

            {/* Evaluation Interpretation */}
            <div className="rounded-3xl p-5 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-[#062e14]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#062e14]">
                  Interpretation for the health report
                </h3>
              </div>
              <div className="bg-[#f8f9f5] p-3 rounded-2xl border border-gray-200">
                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                  {interpretation}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* THREE COLUMN ACTION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">
          
          {/* COLUMN 1: Cleaned Food Prescription Block */}
          <div className="rounded-3xl p-5 bg-white border border-gray-200 shadow-sm flex flex-col group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-gray-100 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
              <Apple size={90} />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Salad size={18} className="text-[#062e14]" />
              <h3 className="text-sm uppercase tracking-wider text-[#062e14] font-black">Food Prescription</h3>
            </div>
            <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
              {[
                { name: "Leafy greens", amount: "4–5 servings / wk", icon: <Salad size={16} className="text-emerald-700" /> },
                { name: "Oily fish", amount: "2 servings / wk", icon: <Fish size={16} className="text-blue-700" /> },
                { name: "Reduce sugar", amount: "< 25g / day", icon: <Candy size={16} className="text-amber-700" /> }
              ].map((food, idx) => (
                <div key={idx} className="bg-[#f8f9f5] p-3 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    {food.icon}
                    <span className="text-xs font-extrabold text-gray-900">{food.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-black text-gray-700 bg-gray-200 px-2 py-0.5 rounded-md">
                    {food.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: Dailies Matrix Tracker */}
          <div className="rounded-3xl p-5 bg-[#8fa8c8]/30 border border-[#8fa8c8]/50 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-800" />
                  <h3 className="text-sm uppercase tracking-wider text-slate-800 font-black">Dailies</h3>
                </div>
                <span className="text-[10px] font-mono bg-white/60 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                  {dailies.length} Prescribed
                </span>
              </div>
              
              <div className="bg-white/60 p-1.5 rounded-2xl border border-gray-200 grid grid-cols-12 gap-1.5 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newDailyName}
                  onChange={(e) => setNewDailyName(e.target.value)}
                  placeholder="Prescription name..." 
                  className="col-span-6 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-slate-500 font-medium"
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
                  className="col-span-2 flex items-center justify-center w-full h-7 bg-slate-700 rounded-xl text-white hover:bg-slate-800 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {dailies.map(item => (
                  <div key={item.id} className="bg-white/80 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs shadow-xs">
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
            <button onClick={() => persistTrackedItems('daily', dailies)} disabled={isSavingDailies} className="w-full mt-4 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md uppercase tracking-wider">
              {isSavingDailies ? "Syncing..." : "save daily alterations"}
            </button>
          </div>

          {/* COLUMN 3: Habits Matrix Tracker */}
          <div className="rounded-3xl p-5 bg-[#8fa96b]/30 border border-[#8fa96b]/50 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-950" />
                  <h3 className="text-sm uppercase tracking-wider text-emerald-950 font-black">Habits</h3>
                </div>
                <span className="text-[10px] font-mono bg-white/60 text-[#062e14] px-2 py-0.5 rounded-full font-bold">
                  {habits.length} Prescribed
                </span>
              </div>

              <div className="bg-white/60 p-1.5 rounded-2xl border border-gray-200 grid grid-cols-12 gap-1.5 mb-3 items-center shadow-xs">
                <input 
                  type="text" 
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Prescription name..." 
                  className="col-span-6 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:border-emerald-700 font-medium"
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
                  className="col-span-2 flex items-center justify-center w-full h-7 bg-emerald-700 rounded-xl text-white hover:bg-emerald-800 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
                {habits.map(item => (
                  <div key={item.id} className="bg-white/80 p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs shadow-xs">
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
            <button onClick={() => persistTrackedItems('habit', habits)} disabled={isSavingHabits} className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md uppercase tracking-wider">
              {isSavingHabits ? "Syncing..." : "save habit alterations"}
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}