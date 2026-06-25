"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import JournalLog from "../components/journalLog";
import { Flame, ChevronDown } from "lucide-react";
import HealthCarousel from "../components/HealthCarousel";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeekDays(currentDate: string) {
  const date = new Date(currentDate);
  const day = date.getDay(); // 0 = Sunday
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7)); // get Monday

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label,
      day: d.getDate().toString(),
      fullDate: d.toISOString().split("T")[0],
      events: [] as { label: string; color: string }[],
    };
  });
}

interface Plan {
  id: string;
  plan_date: string;
  label: string;
  color: string;
}

function authHeadersLocal() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const colorOptions = [
  "bg-rose-400", "bg-indigo-400", "bg-emerald-400",
  "bg-sky-400", "bg-orange-400", "bg-fuchsia-400", "bg-lime-400",
];

function WeeklyPlanner({ currentDate, todayLabel }: { currentDate: string; todayLabel: string }) {
  const [selectedDay, setSelectedDay] = useState(todayLabel);
  const weekDays = getWeekDays(currentDate);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(colorOptions[0]);
  const [newDate, setNewDate] = useState(currentDate);

  const selectedDate = weekDays.find(d => d.label === selectedDay)?.fullDate;

  useEffect(() => {
    if (isAdding && selectedDate) setNewDate(selectedDate);
  }, [isAdding, selectedDate]);

  useEffect(() => {
    async function fetchPlans() {
      if (weekDays.length === 0) return;
      const start = weekDays[0].fullDate;
      const end = weekDays[6].fullDate;
      try {
        const res = await fetch(`/api/calendar-plans?start=${start}&end=${end}`, {
          headers: authHeadersLocal(),
        });
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error("Failed to load plans", err);
      }
    }
    fetchPlans();
  }, [currentDate]);

  const plansForDay = (fullDate: string) => plans.filter(p => p.plan_date.split("T")[0] === fullDate);

  async function handleAddPlan() {
    if (!newLabel || !newDate) return;
    try {
      const res = await fetch("/api/calendar-plans", {
        method: "POST",
        headers: authHeadersLocal(),
        body: JSON.stringify({ plan_date: newDate, label: newLabel, color: newColor }),
      });
      const data = await res.json();
      if (data.plan) {
        const start = weekDays[0]?.fullDate;
        const end = weekDays[6]?.fullDate;
        if (newDate >= start && newDate <= end) {
          setPlans(prev => [...prev, data.plan]);
        }
      }
      setNewLabel("");
      setNewColor(colorOptions[0]);
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add plan", err);
    }
  }

  async function handleDeletePlan(id: string) {
    setPlans(prev => prev.filter(p => p.id !== id));
    try {
      await fetch(`/api/calendar-plans/${id}`, { method: "DELETE", headers: authHeadersLocal() });
    } catch (err) {
      console.error("Failed to delete plan", err);
    }
  }

  return (
    <div className="mt-8 w-full rounded-3xl p-6 text-white relative overflow-hidden"
      style={{ backgroundImage: "url('/weeklyplanerbg.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/10 rounded-3xl z-0" />

      <div className="flex items-center justify-between gap-4 pb-4 relative z-10">
        <div>
          <p className="text-md text-slate-300">Weekly planner</p>
          <p className="text-xl font-semibold text-white">Your health agenda</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full border border-white/20 transition"
        >
          + Add plan
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 relative z-10">
        {weekDays.map((day) => {
          const isSelected = day.label === selectedDay;
          const isToday = day.label === todayLabel;
          const dayPlans = plansForDay(day.fullDate);
          return (
            <div
                key={day.label}
                onClick={() => setSelectedDay(day.label)}
                role="button"
                tabIndex={0}
                style={{ backgroundColor: isSelected ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.42)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", border: isToday ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)" }}
                className={`relative flex-shrink-0 rounded-3xl p-4 h-48 text-left transition-all duration-300 ease-out cursor-pointer ${isSelected ? "flex-[1.4] shadow-2xl" : "flex-1 min-w-[88px]"}`}
              >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-white/90">{day.label}</span>
                <span className={`rounded-2xl px-2 py-1 text-sm font-semibold ${isToday ? "bg-white text-black" : isSelected ? "bg-white/20 text-white" : "bg-white/10 text-white/90"}`}>
                  {day.day}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {dayPlans.length > 0
                  ? dayPlans.map(p => <span key={p.id} className={`h-2.5 w-2.5 rounded-full ${p.color}`} />)
                  : <span className="text-[11px] text-white/70">{isToday ? "Today" : "No plans"}</span>
                }
              </div>
              {isSelected && dayPlans.length > 0 && (
                <div className="mt-4 space-y-2">
                  {dayPlans.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-3xl bg-white/10 px-3 py-2 text-sm text-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${p.color}`} />
                        <span className="truncate">{p.label}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id); }}
                        className="text-white/60 hover:text-white flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="relative z-10 mt-4 bg-white/95 rounded-2xl p-4 text-gray-900 shadow-xl">
          <p className="text-sm font-bold mb-2">Add a plan</p>

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={newDate}
            min={currentDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 mt-1 focus:outline-none focus:border-emerald-400"
          />

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plan</label>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Doctor visit"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 mt-1 focus:outline-none focus:border-emerald-400"
          />

          <div className="flex gap-2 mb-3">
            {colorOptions.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`h-6 w-6 rounded-full ${c} ${newColor === c ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="text-sm font-bold text-gray-500 px-3 py-1.5">Cancel</button>
            <button onClick={handleAddPlan} disabled={!newLabel || !newDate} className="text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg disabled:opacity-50">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Medication { id: string; name: string; dose: string; frequency: string; consumption_time: string; }
interface Habit { id: string; habit_name: string; streak_count: number; }

export default function DashboardPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [dayStreak, setDayStreak] = useState(0);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailies, setDailies] = useState<Habit[]>([]);
  const [checkedMeds, setCheckedMeds] = useState<Record<string, boolean>>({});
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState("");
  const [todayLabel, setTodayLabel] = useState("Mon");
  const [, setCurrentTime] = useState(""); // Kept variable layout stable if state logic relies on placeholder

  // ── Fetch dashboard data ──────────────────────────────────────────
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = localStorage.getItem("token");
        if (!token) { router.push("/login"); return; }

        const res = await fetch("/api/dashboard", { headers: authHeaders() });
        if (res.status === 401) { router.push("/login"); return; }

        const today = new Date().toISOString().split("T")[0];
        const completionsRes = await fetch(`/api/habit-completions?date=${today}`, { headers: authHeaders() });
        if (completionsRes.ok) {
          const completionsData = await completionsRes.json();
          const completed: Record<string, boolean> = {};
          completionsData.completions.forEach((c: any) => {
            if (c.is_completed) completed[c.habit_id] = true;
          });
          setCheckedHabits(completed);
        }
        const data = await res.json();
        setUserName(data.user?.name?.split(" ")[0] || "");
        setDayStreak(data.user?.day_streak || 0);
        setMedications(data.medications || []);
        setHabits(data.habits || []);
        setDailies(data.dailies || []);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  // ── Date-Time API initialization ──────────────────────────────────
  useEffect(() => {
    async function fetchDateTime() {
      try {
        const res = await fetch("http://localhost:8000/datetime/auto");
        const data = await res.json();
        setCurrentDate(data.date);           
        setCurrentTime(data.time);           
        const dayMap: Record<string, string> = {
          Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
          Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
        };
        setTodayLabel(dayMap[data.day_of_week] || "Mon");
      } catch (err) {
        const now = new Date();
        const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        setCurrentDate(now.toISOString().split("T")[0]);
        setTodayLabel(labels[now.getDay()]);
      }
    }

    if (!loading) {
      fetchDateTime();
    }
  }, [loading]);

  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const habitsCompleted = Object.values(checkedHabits).filter(Boolean).length;

  const sections = [
    {
      title: "Habits",
      description: "Build and maintain your daily habits",
      pill: `${habitsCompleted} / ${habits.length} done`,
      color: "bg-[#FFFFFF] text-black-700",
      bgColor: "#8fa96b",
      borderColor: "transparent",
      shape: "triangle",
      href: "/habits",
    },
    {
      title: "Dailies",
      description: "Your recurring daily tasks and check-ins",
      pill: `${dailies.length} pending`,
      color: "bg-[#FFFFFF] text-black-700",
      bgColor: "#8fa8c8",
      borderColor: "transparent",
      shape: "star",
      href: "/dailies",
    },
  ];

  const morningMeds = medications.filter(m => {
    const hour = parseInt(m.consumption_time?.slice(0, 2) || "0");
    return hour < 12;
  });
  const afternoonMeds = medications.filter(m => {
    const hour = parseInt(m.consumption_time?.slice(0, 2) || "0");
    return hour >= 12 && hour < 17;
  });
  const eveningMeds = medications.filter(m => {
    const hour = parseInt(m.consumption_time?.slice(0, 2) || "0");
    return hour >= 17;
  });

  function formatTime(time: string) {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9f5]">
      <p className="text-gray-500 font-medium">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 bg-[#f8f9f5] pb-20">
      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
                {getGreeting()}{userName ? `, ${userName}` : ""}
              </h1>
              <p className="text-sm text-[#8a9485] font-medium mt-1">Here's your overview for today</p>
            </div>
            <span className="inline-block animate-wave [animation-duration:2s] text-4xl pb-2">👋</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-800">{dayStreak}</span>
            </div>
            <div
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full bg-[#062e14] border border-[#14532d] flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer select-none"
            >
              {userName.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {currentDate && <WeeklyPlanner currentDate={currentDate} todayLabel={todayLabel} />}

        {/* Habits + Dailies cards */}
        <div className="mt-8 flex flex-col items-left justify-center gap-4 sm:flex-row">
          {sections.map((s) => (
            <div
              key={s.title}
              onClick={() => router.push(s.href)}
              style={{ backgroundColor: s.bgColor, borderColor: s.borderColor }}
              className="w-full sm:w-1/2 border-1 rounded-3xl p-6 text-left relative overflow-hidden cursor-pointer"
            >
              {s.shape === "triangle" && (
                <div className="absolute -bottom-14 right-[-6px] w-40 h-40 opacity-40 rotate-[-15deg]"
                  style={{ width: 0, height: 0, borderLeft: "90px solid transparent", borderRight: "90px solid transparent", borderTop: "150px solid rgba(0,0,0,0.25)" }} />
              )}
              {s.shape === "star" && (() => {
                const cx = 50, cy = 50, points = 10;
                const angle = Math.PI / points;
                const pts = Array.from({ length: points * 2 }, (_, i) => {
                  const r = i % 2 === 0 ? 50 : 28;
                  const a = i * angle - Math.PI / 2;
                  return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
                }).join(" ");
                return (
                  <svg className="absolute -bottom-[-12px] -right-7 opacity-30 rotate-45" width="180" height="180" viewBox="0 0 100 100">
                    <polygon points={pts} fill="rgba(0,0,0,0.42)" />
                  </svg>
                );
              })()}
              <h2 className="font-semibold text-gray-900 text-lg mb-2">{s.title}</h2>
              <p className="text-sm text-gray-700 mb-4">{s.description}</p>
              <span className={`text-xs px-3 py-2 border border-gray-300 rounded-full ${s.color}`}>{s.pill}</span>
            </div>
          ))}
        </div>

        {/* Medication schedule  + carousel */}
        <div className="mt-8 w-full h-full grid grid-cols-[3fr_1fr] gap-3">
          <div className="bg-gray-60 rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#1D4258] mb-3">Medication Schedule</h2>

            {medications.length === 0 ? (
              <p className="text-sm text-gray-400">No medications scheduled.</p>
            ) : (
              <>
                {morningMeds.length > 0 && (
                  <>
                    <p className="text-md font-semibold text-[#25668E] mb-3">Morning</p>
                    <ul className="space-y-2 text-sm font-medium mb-4">
                      {morningMeds.map(med => (
                        <li key={med.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!checkedMeds[med.id]}
                              onChange={e => setCheckedMeds(prev => ({ ...prev, [med.id]: e.target.checked }))}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className={checkedMeds[med.id] ? "line-through text-gray-400" : "text-gray-650"}>
                              {med.name} — {med.dose}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{formatTime(med.consumption_time)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {afternoonMeds.length > 0 && (
                  <>
                    <p className="text-md font-semibold text-[#25668E] mb-3">Afternoon</p>
                    <ul className="space-y-2 text-sm font-medium mb-4">
                      {afternoonMeds.map(med => (
                        <li key={med.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!checkedMeds[med.id]}
                              onChange={e => setCheckedMeds(prev => ({ ...prev, [med.id]: e.target.checked }))}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className={checkedMeds[med.id] ? "line-through text-gray-400" : "text-gray-650"}>
                              {med.name} — {med.dose}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{formatTime(med.consumption_time)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {eveningMeds.length > 0 && (
                  <>
                    <p className="text-md font-semibold text-[#25668E] mb-3">Evening</p>
                    <ul className="space-y-2 text-sm font-medium">
                      {eveningMeds.map(med => (
                        <li key={med.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!checkedMeds[med.id]}
                              onChange={e => setCheckedMeds(prev => ({ ...prev, [med.id]: e.target.checked }))}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <span className={checkedMeds[med.id] ? "line-through text-gray-400" : "text-gray-650"}>
                              {med.name} — {med.dose}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{formatTime(med.consumption_time)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
          <div className="rounded-xl border border-gray-400 shadow-sm flex flex-col items-center justify-center">
            <HealthCarousel />
          </div>
        </div>

        {/* Journal */}
        <div className="mt-4 w-full rounded-3xl relative overflow-hidden scroll-vertical noise-bg"
          style={{ background: "linear-gradient(135deg, #39210b 0%, #5c2c07 30%, #8e450d 100%)" }}>
          <div className="p-6 flex items-center justify-between group cursor-pointer" onClick={() => setIsJournalOpen(!isJournalOpen)}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)", backgroundSize: "200% 100%", animation: "sheen 0.6s ease forwards" }} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-1">Daily check-in</p>
              <h2 className="text-lg font-semibold text-white">Log today's activity</h2>
              <p className="text-sm text-white/80 mt-1">How were your activities today?</p>
            </div>
            <ChevronDown size={40} className={`text-white transition-transform duration-300 flex-shrink-0 ${isJournalOpen ? "rotate-180" : ""}`} />
          </div>
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isJournalOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-3 pb-3"><JournalLog /></div>
          </div>
        </div>

      </main>
      <Navbar />
    </div>
  );
}