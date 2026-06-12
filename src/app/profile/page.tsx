"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import {
  Flame, Edit2, Check, X, User, Activity, Target, Settings2,
  Droplets, Moon, Footprints, Apple, Heart, Weight, Ruler,
  ChevronRight
} from "lucide-react";

const AVATAR_BG = "#062e14";

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: string;
  suffix?: string;
}

function EditableField({ label, value, onSave, type = "text", suffix }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
      <span className="text-sm text-white/50 w-32 flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            className="bg-white/10 text-white text-sm rounded-xl px-3 py-1.5 w-36 outline-none border border-white/20 focus:border-white/40"
          />
          {suffix && <span className="text-white/40 text-xs">{suffix}</span>}
          <button onClick={commit} className="text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={16} /></button>
          <button onClick={cancel} className="text-white/40 hover:text-white/70 transition-colors"><X size={16} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{value}{suffix ? ` ${suffix}` : ""}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-white/30 hover:text-white/70 transition-colors ml-1">
            <Edit2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

interface GoalCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
  onSave: (val: string) => void;
}

function GoalCard({ icon, label, value, unit, color, onSave }: GoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="bg-white/8 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <button
          onClick={() => editing ? cancel() : (setDraft(value), setEditing(true))}
          className="text-white/30 hover:text-white/70 transition-colors"
        >
          {editing ? <X size={14} /> : <Edit2 size={14} />}
        </button>
      </div>
      <div>
        <p className="text-xs text-white/50 mb-1">{label}</p>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
              className="bg-white/10 text-white text-lg font-semibold rounded-lg px-2 py-0.5 w-20 outline-none border border-white/30"
            />
            <span className="text-white/40 text-xs">{unit}</span>
            <button onClick={commit} className="text-emerald-400 hover:text-emerald-300 ml-1"><Check size={14} /></button>
          </div>
        ) : (
          <p className="text-lg font-semibold text-white">{value} <span className="text-sm font-normal text-white/40">{unit}</span></p>
        )}
      </div>
    </div>
  );
}

interface TogglePrefProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function TogglePref({ label, description, value, onChange }: TogglePrefProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${value ? "bg-emerald-500" : "bg-white/20"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "User",
    age: "28",
    weight: "72",
    height: "175",
    bloodType: "O+",
    dob: "1997-04-12",
  });

  const [goals, setGoals] = useState({
    steps: "10000",
    water: "2.5",
    sleep: "8",
    calories: "2200",
    weight: "68",
    activeMinutes: "45",
  });

  const [prefs, setPrefs] = useState({
    notifications: true,
    weeklyReport: true,
    reminders: false,
    darkMode: false,
    metricUnits: true,
    shareData: false,
  });

  const updateProfile = (key: string) => (val: string) =>
    setProfile(p => ({ ...p, [key]: val }));

  const updateGoal = (key: string) => (val: string) =>
    setGoals(g => ({ ...g, [key]: val }));

  const updatePref = (key: string) => (val: boolean) =>
    setPrefs(p => ({ ...p, [key]: val }));

  const statsData = [
    { label: "Day streak", value: "7", icon: <Flame size={16} className="text-amber-400 fill-amber-400" /> },
    { label: "Habits tracked", value: "4", icon: <Activity size={16} className="text-emerald-400" /> },
    { label: "Goals hit", value: "12", icon: <Target size={16} className="text-sky-400" /> },
    { label: "Days active", value: "21", icon: <Heart size={16} className="text-rose-400" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9f5] pb-24">
      <main className="w-full max-w-2xl mx-auto py-10 px-4 sm:px-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight">Profile</h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">Your health identity</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-800">7</span>
            </div>
          </div>
        </header>

        {/* Avatar + name card */}
        <div
          className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a1e 0%, #2d5a2d 100%)" }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border-2 border-white/20"
              style={{ background: AVATAR_BG }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white truncate">{profile.name}</h2>
              </div>
              <p className="text-white/50 text-sm mt-0.5">Age {profile.age} · {profile.weight} kg · {profile.height} cm</p>
              <span className="inline-block mt-2 text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full">Blood type: {profile.bloodType}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-6">
            {statsData.map(s => (
              <div key={s.label} className="bg-white/8 border border-white/10 rounded-2xl p-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                <p className="text-white/40 text-[10px] mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Personal info */}
        <div
          className="rounded-3xl p-6 mb-6"
          style={{ background: "linear-gradient(135deg, #31261C 0%, #4a3728 100%)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-white/50" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-white/50 font-medium">Personal info</h3>
          </div>
          <EditableField label="Name" value={profile.name} onSave={updateProfile("name")} />
          <EditableField label="Date of birth" value={profile.dob} onSave={updateProfile("dob")} type="date" />
          <EditableField label="Age" value={profile.age} onSave={updateProfile("age")} type="number" suffix="yrs" />
          <EditableField label="Weight" value={profile.weight} onSave={updateProfile("weight")} type="number" suffix="kg" />
          <EditableField label="Height" value={profile.height} onSave={updateProfile("height")} type="number" suffix="cm" />
          <EditableField label="Blood type" value={profile.bloodType} onSave={updateProfile("bloodType")} />
        </div>

        {/* Health goals */}
        <div
          className="rounded-3xl p-6 mb-6"
          style={{ background: "linear-gradient(135deg, #2a3a2e 0%, #1e2b22 100%)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={16} className="text-white/50" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-white/50 font-medium">Health goals</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <GoalCard icon={<Footprints size={16} className="text-amber-300" />} label="Daily steps" value={goals.steps} unit="steps" color="bg-amber-500/20" onSave={updateGoal("steps")} />
            <GoalCard icon={<Droplets size={16} className="text-sky-300" />} label="Water intake" value={goals.water} unit="L / day" color="bg-sky-500/20" onSave={updateGoal("water")} />
            <GoalCard icon={<Moon size={16} className="text-purple-300" />} label="Sleep target" value={goals.sleep} unit="hrs" color="bg-purple-500/20" onSave={updateGoal("sleep")} />
            <GoalCard icon={<Apple size={16} className="text-rose-300" />} label="Calories" value={goals.calories} unit="kcal" color="bg-rose-500/20" onSave={updateGoal("calories")} />
            <GoalCard icon={<Weight size={16} className="text-emerald-300" />} label="Target weight" value={goals.weight} unit="kg" color="bg-emerald-500/20" onSave={updateGoal("weight")} />
            <GoalCard icon={<Activity size={16} className="text-orange-300" />} label="Active time" value={goals.activeMinutes} unit="min / day" color="bg-orange-500/20" onSave={updateGoal("activeMinutes")} />
          </div>
        </div>

        {/* Preferences */}
        <div
          className="rounded-3xl p-6 mb-6"
          style={{ background: "linear-gradient(135deg, #2a3d52 0%, #1e2d3d 100%)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={16} className="text-white/50" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-white/50 font-medium">Preferences</h3>
          </div>
          <TogglePref label="Push notifications" description="Daily reminders and streak alerts" value={prefs.notifications} onChange={updatePref("notifications")} />
          <TogglePref label="Weekly report" description="Summary every Sunday morning" value={prefs.weeklyReport} onChange={updatePref("weeklyReport")} />
          <TogglePref label="Habit reminders" description="Nudges for incomplete habits" value={prefs.reminders} onChange={updatePref("reminders")} />
          <TogglePref label="Metric units" description="kg, cm, litres" value={prefs.metricUnits} onChange={updatePref("metricUnits")} />
          <TogglePref label="Share anonymised data" description="Help improve the app" value={prefs.shareData} onChange={updatePref("shareData")} />
        </div>

        {/* Account actions */}
        <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white">
          {[
            { label: "Export my data", sub: "Download a CSV of all your logs" },
            { label: "Connected devices", sub: "Sync with wearables" },
            { label: "Privacy policy", sub: "" },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-left">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
          <button className="w-full px-6 py-4 text-left text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            Sign out
          </button>
        </div>

      </main>
      <Navbar />
    </div>
  );
}