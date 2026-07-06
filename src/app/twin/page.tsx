"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import {
  Star, FileText, Salad, Fish, Candy,
  Trash2, Sparkles, CalendarDays, Apple, CheckCircle2,
  TrendingUp, AlertTriangle, Undo2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Types — mirror the REAL /twin/assess/{patient_id} response from
// routers/twin.py exactly. Nothing here is guessed/mocked.
// ─────────────────────────────────────────────────────────────────────────

interface VerdictKeep { name: string; reason: string }
interface VerdictModify { name: string; current_issue: string; suggested_change: string }
interface VerdictDiscard { name: string; reason: string }
interface VerdictNew { name: string; category?: string; rationale?: string; when?: string; duration?: string }

interface Verdict {
  keep: VerdictKeep[];
  modify: VerdictModify[];
  discard: VerdictDiscard[];
  new: VerdictNew[];
}

interface Horizon {
  day: number;
  predicted_health_score: number;
  section_scores: Record<string, number>;
  key_drivers: string[];
  recovery_note: string;
}

interface ForecastScenario {
  compliance_pct: number;
  horizons: Horizon[];
}

interface Forecast {
  high_compliance: ForecastScenario;
  low_compliance: ForecastScenario;
}

interface ExistingItem {
  id: string;
  habit_name: string;
  category?: string;
  streak_count?: number;
  longest_streak?: number;
  prescribed_time?: string;
  details?: string;
  active?: boolean;
}

interface AssessResponse {
  prediction_id: string | null;
  patient_id: string;
  user: { name: string; date_of_birth?: string; gender: string; health_score: number };
  health_score: number;
  previous_score: number | null;
  delta: number | null;
  label: string;
  health_interpretation: string;
  primary_driver: string;
  main_risk: string;
  habits_verdict: Verdict;
  dailies_verdict: Verdict;
  forecast: Forecast;
  doctor_referral: boolean;
  doctor_referral_reason: string | null;
  existing_habits: ExistingItem[];
  existing_dailies: ExistingItem[];
}

type VerdictTag = "keep" | "modify" | "discard" | "unlisted";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// Find how the LLM verdict for a given DB name — returns tag + supporting detail text.
function resolveVerdictTag(habitName: string, verdict: Verdict): { tag: VerdictTag; detail: string } {
  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(habitName);

  const discardHit = verdict.discard.find(d => norm(d.name) === target);
  if (discardHit) return { tag: "discard", detail: discardHit.reason };

  const modifyHit = verdict.modify.find(m => norm(m.name) === target);
  if (modifyHit) return { tag: "modify", detail: modifyHit.suggested_change || modifyHit.current_issue };

  const keepHit = verdict.keep.find(k => norm(k.name) === target);
  if (keepHit) return { tag: "keep", detail: keepHit.reason };

  return { tag: "unlisted", detail: "No verdict returned for this item yet." };
}

const TAG_STYLES: Record<VerdictTag, string> = {
  keep: "bg-emerald-100 border-emerald-200 text-emerald-800",
  modify: "bg-amber-100 border-amber-200 text-amber-800",
  discard: "bg-red-100 border-red-200 text-red-800",
  unlisted: "bg-gray-100 border-gray-200 text-gray-600",
};

const TAG_LABEL: Record<VerdictTag, string> = {
  keep: "Keep",
  modify: "Modify",
  discard: "Discard",
  unlisted: "Unreviewed",
};

export default function HealthReportPage() {
  const router = useRouter();

  const testPatientId = "pid1789456";

  const [assessment, setAssessment] = useState<AssessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local, editable copies of the DB-backed lists so discard/accept actions
  // can update the UI without re-running the (expensive) LLM assessment.
  const [existingHabits, setExistingHabits] = useState<ExistingItem[]>([]);
  const [existingDailies, setExistingDailies] = useState<ExistingItem[]>([]);
  const [newHabitSuggestions, setNewHabitSuggestions] = useState<VerdictNew[]>([]);
  const [newDailySuggestions, setNewDailySuggestions] = useState<VerdictNew[]>([]);

  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }

      // NOTE: this is a POST endpoint on the backend (routers/twin.py), not GET.
      const res = await fetch(`${BACKEND_URL}/twin/assess/${testPatientId}`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}`);
      }

      const data: AssessResponse = await res.json();
      setAssessment(data);
      setExistingHabits(data.existing_habits || []);
      setExistingDailies(data.existing_dailies || []);
      setNewHabitSuggestions(data.habits_verdict?.new || []);
      setNewDailySuggestions(data.dailies_verdict?.new || []);
    } catch (err) {
      console.error("Failed to load /twin/assess:", err);
      setErrorMsg("Couldn't reach the assessment engine. Showing last known state if any.");
    } finally {
      setLoading(false);
    }
  }, [router, testPatientId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // ── Actions against the real backend routes ─────────────────────────────
  const handleDiscard = async (type: "habit" | "daily", item: ExistingItem) => {
    const key = `discard-${type}-${item.id}`;
    setPendingActionKey(key);
    try {
      const endpoint = type === "habit"
        ? `${BACKEND_URL}/twin/habits/${item.id}/discard`
        : `${BACKEND_URL}/twin/dailies/${item.id}/discard`;
      const res = await fetch(endpoint, { method: "POST", headers: authHeaders() });
      if (!res.ok) throw new Error(`Discard failed with status ${res.status}`);

      if (type === "habit") {
        setExistingHabits(prev => prev.filter(h => h.id !== item.id));
      } else {
        setExistingDailies(prev => prev.filter(d => d.id !== item.id));
      }
    } catch (err) {
      console.error(err);
      alert(`Could not discard "${item.habit_name}". Please try again.`);
    } finally {
      setPendingActionKey(null);
    }
  };

  const handleAcceptSuggestion = async (type: "habit" | "daily", suggestion: VerdictNew) => {
    if (!assessment?.prediction_id) {
      alert("No prediction_id available (LLM likely fell back) — cannot accept suggestions right now.");
      return;
    }
    const key = `accept-${type}-${suggestion.name}`;
    setPendingActionKey(key);
    try {
      const res = await fetch(`${BACKEND_URL}/twin/suggestions/${assessment.prediction_id}/accept`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ suggestion_name: suggestion.name, suggestion_type: type }),
      });
      if (!res.ok) throw new Error(`Accept failed with status ${res.status}`);
      const data = await res.json();

      if (type === "habit") {
        setNewHabitSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
        if (data.inserted) setExistingHabits(prev => [...prev, data.inserted]);
      } else {
        setNewDailySuggestions(prev => prev.filter(s => s.name !== suggestion.name));
        if (data.inserted) setExistingDailies(prev => [...prev, data.inserted]);
      }
    } catch (err) {
      console.error(err);
      alert(`Could not accept "${suggestion.name}". Please try again.`);
    } finally {
      setPendingActionKey(null);
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

  if (!assessment) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9f5]">
      <div className="text-center space-y-3 max-w-sm">
        <p className="text-gray-700 font-semibold text-sm">{errorMsg || "No assessment data available."}</p>
        <button
          onClick={fetchAssessment}
          className="text-xs font-bold uppercase tracking-wider bg-[#062e14] text-white px-4 py-2 rounded-xl"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const {
    user, health_score, previous_score, delta, label,
    health_interpretation, primary_driver, main_risk,
    habits_verdict, dailies_verdict, forecast,
    doctor_referral, doctor_referral_reason,
  } = assessment;

  const userName = user?.name || "Patient";
  const userAge = calcAge(user?.date_of_birth) ?? "—";
  const userGender = user?.gender || "—";

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 bg-[#f8f9f5] pb-20 text-gray-900 antialiased">
      <Navbar />

      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">

        {errorMsg && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2 rounded-2xl">
            {errorMsg}
          </div>
        )}

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
                  {label ? `Status: ${label}` : "Rendering complete • System stable"}
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900 font-mono tracking-tighter">
                      {health_score}
                    </span>
                    <span className="text-lg font-bold text-gray-400 ml-0.5">/100</span>
                    {typeof delta === "number" && (
                      <span className={`text-xs font-black font-mono flex items-center gap-0.5 ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        <TrendingUp size={12} className={delta < 0 ? "rotate-180" : ""} />
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                    {previous_score != null ? `Previous: ${previous_score}/100 · ${label}` : `Calculated by engine telemetry · ${label}`}
                  </p>
                </div>
              </div>

              {/* PROMINENT POPPED-UP WARNING BANNER */}
              {doctor_referral && (
                <div className="flex items-center gap-2.5 mr-1 shrink-0" title={doctor_referral_reason || undefined}>
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-[11px] font-black uppercase tracking-wider px-3.5 py-2 rounded-2xl shadow-xl shadow-red-200 border border-red-700 relative animate-pulse">
                    Need to see Dr.
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-rose-600 border-b-[6px] border-b-transparent" />
                  </div>
                  <div className="flex items-center justify-center p-1">
                    <AlertTriangle size={40} className="text-red-600 drop-shadow-md" />
                  </div>
                </div>
              )}
            </div>

            {/* Matrix Block Explanations Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl p-5 bg-gradient-to-br from-red-50 to-orange-100 border border-orange-200 shadow-sm">
                <div className="font-mono text-xs text-orange-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Main risk
                </div>
                <p className="text-xs font-semibold text-orange-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-orange-200/40">
                  {main_risk || "No specific risk flagged for this assessment."}
                </p>
              </div>

              <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 shadow-sm">
                <div className="font-mono text-xs text-emerald-950 uppercase tracking-widest mb-2 font-extrabold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Primary driver
                </div>
                <p className="text-xs font-semibold text-emerald-900 leading-relaxed bg-white/60 p-3 rounded-2xl border border-emerald-200/40">
                  {primary_driver || "No dominant driver identified this cycle."}
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
                  {health_interpretation || "No interpretation available for this assessment."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* THREE COLUMN ACTION ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-stretch">

          {/* COLUMN 1: Cleaned Food Prescription Block (unchanged — no backend field for this yet) */}
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

          {/* COLUMN 2: Dailies — existing items + LLM verdicts + new suggestions */}
          <VerdictColumn
            title="Dailies"
            icon={<CalendarDays size={18} className="text-slate-800" />}
            tint="bg-[#8fa8c8]/30 border-[#8fa8c8]/50"
            accentText="text-slate-800"
            accentBtn="bg-slate-700 hover:bg-slate-800"
            existingItems={existingDailies}
            verdict={dailies_verdict}
            newSuggestions={newDailySuggestions}
            pendingActionKey={pendingActionKey}
            onDiscard={(item) => handleDiscard("daily", item)}
            onAccept={(s) => handleAcceptSuggestion("daily", s)}
          />

          {/* COLUMN 3: Habits — existing items + LLM verdicts + new suggestions */}
          <VerdictColumn
            title="Habits"
            icon={<Sparkles size={18} className="text-emerald-950" />}
            tint="bg-[#8fa96b]/30 border-[#8fa96b]/50"
            accentText="text-emerald-950"
            accentBtn="bg-emerald-700 hover:bg-emerald-800"
            existingItems={existingHabits}
            verdict={habits_verdict}
            newSuggestions={newHabitSuggestions}
            pendingActionKey={pendingActionKey}
            onDiscard={(item) => handleDiscard("habit", item)}
            onAccept={(s) => handleAcceptSuggestion("habit", s)}
          />

        </div>

        {/* FORECAST ROW — high vs low compliance at day 7 / 14 / 30 */}
        <div className="rounded-3xl p-5 bg-white border border-gray-200 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#062e14]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[#062e14]">
              Health score forecast
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ForecastTable
              label="High compliance"
              pct={forecast?.high_compliance?.compliance_pct}
              horizons={forecast?.high_compliance?.horizons || []}
              tone="emerald"
            />
            <ForecastTable
              label="Low compliance"
              pct={forecast?.low_compliance?.compliance_pct}
              horizons={forecast?.low_compliance?.horizons || []}
              tone="orange"
            />
          </div>
        </div>

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function VerdictColumn({
  title, icon, tint, accentText, accentBtn,
  existingItems, verdict, newSuggestions, pendingActionKey,
  onDiscard, onAccept,
}: {
  title: string;
  icon: React.ReactNode;
  tint: string;
  accentText: string;
  accentBtn: string;
  existingItems: ExistingItem[];
  verdict: Verdict;
  newSuggestions: VerdictNew[];
  pendingActionKey: string | null;
  onDiscard: (item: ExistingItem) => void;
  onAccept: (s: VerdictNew) => void;
}) {
  const type = title === "Habits" ? "habit" : "daily";

  return (
    <div className={`rounded-3xl p-5 ${tint} shadow-sm flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className={`text-sm uppercase tracking-wider font-black ${accentText}`}>{title}</h3>
          </div>
          <span className={`text-[10px] font-mono bg-white/60 px-2 py-0.5 rounded-full font-bold ${accentText}`}>
            {existingItems.length} Prescribed
          </span>
        </div>

        {/* Existing prescriptions, tagged with the LLM's verdict for this cycle */}
        <div className="space-y-2 max-h-[14rem] overflow-y-auto pr-1">
          {existingItems.length === 0 && (
            <p className="text-[11px] font-semibold text-gray-500 italic px-1">No active prescriptions yet.</p>
          )}
          {existingItems.map(item => {
            const { tag, detail } = resolveVerdictTag(item.habit_name, verdict);
            const key = `discard-${type}-${item.id}`;
            return (
              <div key={item.id} className="bg-white/80 p-2.5 rounded-xl border border-gray-200 text-xs shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${TAG_STYLES[tag]}`}>
                    {TAG_LABEL[tag]}
                  </span>
                  <span className="font-bold text-gray-800 flex-1 px-2 truncate">{item.habit_name}</span>
                  <button
                    onClick={() => onDiscard(item)}
                    disabled={pendingActionKey === key}
                    className="text-gray-400 hover:text-red-600 p-1 shrink-0 disabled:opacity-40"
                    title="Discard this prescription"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {tag !== "unlisted" && (
                  <p className="text-[10px] text-gray-500 mt-1 px-0.5 leading-snug">{detail}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* New suggestions from this cycle's LLM verdict, awaiting patient acceptance */}
        {newSuggestions.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-0.5">
              New suggestions
            </p>
            <div className="space-y-2 max-h-[10rem] overflow-y-auto pr-1">
              {newSuggestions.map((s) => {
                const key = `accept-${type}-${s.name}`;
                return (
                  <div key={s.name} className="bg-white/60 p-2.5 rounded-xl border border-dashed border-gray-300 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-800 flex-1 truncate">{s.name}</span>
                      <button
                        onClick={() => onAccept(s)}
                        disabled={pendingActionKey === key}
                        className={`flex items-center gap-1 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg shrink-0 disabled:opacity-40 ${accentBtn}`}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>
                    </div>
                    {s.rationale && (
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">{s.rationale}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastTable({
  label, pct, horizons, tone,
}: {
  label: string;
  pct?: number;
  horizons: Horizon[];
  tone: "emerald" | "orange";
}) {
  const toneClasses = tone === "emerald"
    ? "from-emerald-50 to-teal-100 border-emerald-200 text-emerald-950"
    : "from-red-50 to-orange-100 border-orange-200 text-orange-950";

  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${toneClasses} border`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        {typeof pct === "number" && (
          <span className="text-[10px] font-mono font-black bg-white/60 px-2 py-0.5 rounded-full">
            {pct}% compliance
          </span>
        )}
      </div>

      {horizons.length === 0 ? (
        <p className="text-[11px] font-semibold italic opacity-70">No forecast horizons returned.</p>
      ) : (
        <div className="space-y-2">
          {horizons.map((h) => (
            <div key={h.day} className="bg-white/70 p-2.5 rounded-xl border border-white/40">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider">Day +{h.day}</span>
                <span className="text-lg font-black font-mono">{h.predicted_health_score}<span className="text-xs opacity-60">/100</span></span>
              </div>
              {h.key_drivers?.length > 0 && (
                <p className="text-[10px] mt-1 opacity-80 truncate">
                  Drivers: {h.key_drivers.join(", ")}
                </p>
              )}
              {h.recovery_note && (
                <p className="text-[10px] mt-0.5 opacity-70 leading-snug">{h.recovery_note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
