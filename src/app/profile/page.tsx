"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import {
  Flame, Edit2, Check, X, User, Activity, Target, Settings2,
  Droplets, Moon, Footprints, Apple, Heart, Weight,
  ChevronRight, Plus, Trash2, Pill, Clock, CalendarDays, Wrench,
  Cpu, Link2, Link2Off
} from "lucide-react";

const SKYBLUE_BG = "#0369a1";

function getAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

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

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-black/10 last:border-0">
      <span className="text-sm text-gray-700/80 w-36 flex-shrink-0 font-medium">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            className="bg-white/90 text-gray-900 text-sm rounded-xl px-3 py-1.5 w-36 outline-none border border-black/20 focus:border-sky-600 shadow-inner"
          />
          {suffix && <span className="text-gray-600 text-xs">{suffix}</span>}
          <button onClick={commit} className="text-sky-700 hover:text-sky-900 transition-colors"><Check size={16} /></button>
          <button onClick={cancel} className="text-gray-500 hover:text-gray-700 transition-colors"><X size={16} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 font-semibold">{value || "—"}{suffix ? ` ${suffix}` : ""}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-gray-500/70 hover:text-gray-900 transition-colors ml-1">
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
  onDelete: () => void;
}

function GoalCard({ icon, label, value, unit, color, onSave, onDelete }: GoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  return (
    <div className="bg-white/80 border border-black/5 rounded-2xl p-4 flex flex-col gap-3 shadow-md backdrop-blur-xs relative group">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl shadow-xs ${color}`}>{icon}</div>
        <div className="flex items-center gap-1">
          {editing ? (
            <button onClick={cancel} className="text-gray-400 hover:text-gray-700 p-1 transition-colors"><X size={14} /></button>
          ) : (
            <>
              <button onClick={onDelete} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"><Trash2 size={14} /></button>
              <button onClick={() => { setDraft(value); setEditing(true); }} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"><Edit2 size={14} /></button>
            </>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-600 font-medium mb-1 truncate">{label}</p>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }} className="bg-white text-gray-900 text-lg font-bold rounded-lg px-2 py-0.5 w-20 outline-none border border-gray-300 focus:border-emerald-600 shadow-inner" />
            <span className="text-gray-500 text-xs truncate max-w-[40px]">{unit}</span>
            <button onClick={commit} className="text-emerald-700 hover:text-emerald-900 ml-1"><Check size={14} /></button>
          </div>
        ) : (
          <p className="text-lg font-extrabold text-gray-900 truncate">{value} <span className="text-sm font-medium text-gray-500">{unit}</span></p>
        )}
      </div>
    </div>
  );
}

interface MedicationRowProps {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  onDelete: () => void;
}

function MedicationRow({ name, dosage, frequency, times, onDelete }: MedicationRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-black/10 last:border-0 group">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="p-1.5 bg-white/60 rounded-lg text-purple-900 mt-0.5 flex-shrink-0"><Pill size={15} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs font-semibold text-purple-950/70">
            <span>{dosage}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-purple-800"><CalendarDays size={11} /> {frequency}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
          {times.map((t, idx) => (
            <div key={idx} className="flex items-center gap-0.5 bg-white/70 px-2 py-0.5 rounded-md border border-purple-200 text-[11px] font-black text-purple-900">
              <Clock size={10} /><span>{t}</span>
            </div>
          ))}
        </div>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"><Trash2 size={14} /></button>
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
    <div className="flex items-center justify-between py-3 border-b border-black/10 last:border-0">
      <div>
        <p className="text-sm text-slate-900 font-semibold">{label}</p>
        <p className="text-xs text-slate-700 font-medium mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 shadow-inner ${value ? "bg-emerald-600" : "bg-slate-400"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

interface CustomGoal { id: string; label: string; unit: string; icon: React.ReactNode; color: string; }
interface MedicationItem { id: string; name: string; dosage: string; frequency: string; times: string[]; }
interface IotDevice { id: string; name: string; type: string; status: "Connected" | "Disconnected"; lastSynced: string; }

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);

  const [profile, setProfile] = useState({ name: "", age: "", weight: "", height: "", bloodType: "", dob: "" });
  const [diet, setDiet] = useState({ type: "", allergies: "", restrictions: "" });
  const [doshas, setDoshas] = useState({ vata: 0, pitta: 0, kapha: 0, primary: "" });
  const [dayStreak, setDayStreak] = useState(0);
  const [daysActive, setDaysActive] = useState(0);

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [isCreatingMed, setIsCreatingMed] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFrequency, setNewMedFrequency] = useState("Daily");
  const [newMedManualFrequency, setNewMedManualFrequency] = useState("");
  const [newMedTimes, setNewMedTimes] = useState<string[]>(["08:00"]);

  const [goals, setGoals] = useState<Record<string, string>>({ steps: "10000", water: "2.5", sleep: "8", calories: "2200", weight: "68", activeMinutes: "45" });
  const [goalTypes, setGoalTypes] = useState<CustomGoal[]>([
    { id: "steps", label: "Daily steps", unit: "steps", icon: <Footprints size={16} className="text-amber-800" />, color: "bg-amber-300" },
    { id: "water", label: "Water intake", unit: "L / day", icon: <Droplets size={16} className="text-sky-800" />, color: "bg-sky-300" },
    { id: "sleep", label: "Sleep target", unit: "hrs", icon: <Moon size={16} className="text-purple-800" />, color: "bg-purple-300" },
    { id: "calories", label: "Calories", unit: "kcal", icon: <Apple size={16} className="text-rose-800" />, color: "bg-rose-300" },
    { id: "weight", label: "Target weight", unit: "kg", icon: <Weight size={16} className="text-emerald-800" />, color: "bg-emerald-300" },
    { id: "activeMinutes", label: "Active time", unit: "min / day", icon: <Activity size={16} className="text-orange-800" />, color: "bg-orange-300" },
  ]);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [newGoalLabel, setNewGoalLabel] = useState("");
  const [newGoalUnit, setNewGoalUnit] = useState("");
  const [newGoalValue, setNewGoalValue] = useState("");

  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [isPairingDevice, setIsPairingDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("Smart Watch");

  const [prefs, setPrefs] = useState({ notifications: true, weeklyReport: true, reminders: false, darkMode: false, metricUnits: true, shareData: false });

  // ── Fetch on load ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const [profileRes, medsRes] = await Promise.all([
          fetch("/api/user/profile", { headers: authHeaders() }),
          fetch("/api/medications", { headers: authHeaders() }),
        ]);

        if (profileRes.status === 401) { router.push("/login"); return; }

        const profileData = await profileRes.json();
        const u = profileData.user;

        if (!u) {
          console.error('User data not found in response');
          return;
        }

        setProfile({
          name: u.name || "",
          age: u.date_of_birth ? getAge(u.date_of_birth).toString() : "",
          weight: u.weight?.toString() || "",
          height: u.height?.toString() || "",
          bloodType: u.blood_type || "",
          dob: u.date_of_birth ? u.date_of_birth.split("T")[0] : "",
        });

        setDiet({
          type: u.diet_type || "",
          allergies: u.allergies || "",
          restrictions: u.dietary_restrictions || "",
        });

        setDoshas({
          vata: u.dosha_vata || 0,
          pitta: u.dosha_pitta || 0,
          kapha: u.dosha_kapha || 0,
          primary: u.primary_dosha || "",
        });

        setDayStreak(u.day_streak || 0);
        setDaysActive(u.days_active || 0);
        setProfileComplete(profileData.profileComplete);
        setIncompleteFields(profileData.incompleteFields || []);

        if (u.preferences) setPrefs(p => ({ ...p, ...u.preferences }));
        if (u.health_goals) setGoals(g => ({ ...g, ...u.health_goals }));

        const medsData = await medsRes.json();
        if (medsData.medications) {
          setMedications(medsData.medications.map((m: any) => ({
            id: m.id,
            name: m.name,
            dosage: m.dose || "",
            frequency: m.frequency || "",
            times: m.consumption_time ? [m.consumption_time.slice(0, 5)] : [],
          })));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────
  const patchProfile = async (fields: Record<string, any>) => {
    await fetch("/api/user/profile/update", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(fields),
    });
  };

  const updateProfile = (key: string) => async (val: string) => {
    setProfile(p => ({ ...p, [key]: val }));
    const map: Record<string, string> = { name: "name", weight: "weight", height: "height", bloodType: "blood_type", dob: "date_of_birth" };
    await patchProfile({ [map[key]]: val });
  };

  const updateDiet = (key: string) => async (val: string) => {
    setDiet(d => ({ ...d, [key]: val }));
    const map: Record<string, string> = { type: "diet_type", allergies: "allergies", restrictions: "dietary_restrictions" };
    await patchProfile({ [map[key]]: val });
  };

  const updatePref = (key: string) => async (val: boolean) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await patchProfile({ preferences: updated });
  };

  const updateGoal = (key: string) => async (val: string) => {
    const updated = { ...goals, [key]: val };
    setGoals(updated);
    await patchProfile({ health_goals: updated });
  };

  const deleteGoal = (id: string) => {
    setGoalTypes(prev => prev.filter(g => g.id !== id));
    setGoals(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
  };

  const handleCreateGoal = () => {
    const dynamicId = newGoalLabel.toLowerCase().replace(/\s+/g, "-");
    setGoalTypes(prev => [...prev, { id: dynamicId, label: newGoalLabel, unit: newGoalUnit || "units", icon: <Target size={16} className="text-emerald-800" />, color: "bg-emerald-300" }]);
    updateGoal(dynamicId)(newGoalValue);
    setIsCreatingGoal(false);
    setNewGoalLabel(""); setNewGoalUnit(""); setNewGoalValue("");
  };

  const deleteMedication = async (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    await fetch(`/api/medications/${id}`, { method: "DELETE", headers: authHeaders() });
  };

  const handleCreateMedication = async () => {
    const finalFrequency = newMedFrequency === "Manual" ? (newMedManualFrequency || "Custom Schedule") : newMedFrequency;
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: newMedName,
        dose: newMedDosage || "1 dose",
        frequency: finalFrequency,
        consumption_time: newMedTimes[0],
        type: "supplement",
        form: "tablet",
        prescribed_by: "self",
        started_on: new Date().toISOString().split("T")[0],
      }),
    });
    const data = await res.json();
    if (data.medication) {
      setMedications(prev => [...prev, {
        id: data.medication.id,
        name: data.medication.name,
        dosage: data.medication.dose,
        frequency: data.medication.frequency,
        times: newMedTimes,
      }]);
    }
    setIsCreatingMed(false);
    setNewMedName(""); setNewMedDosage(""); setNewMedFrequency("Daily"); setNewMedManualFrequency(""); setNewMedTimes(["08:00"]);
  };

  const handleFrequencyPresetChange = (freq: string) => {
    setNewMedFrequency(freq);
    if (freq === "Twice a day") setNewMedTimes(["08:00", "20:00"]);
    else if (freq === "Thrice a day") setNewMedTimes(["08:00", "14:00", "20:00"]);
    else setNewMedTimes(["08:00"]);
  };
  const handleTimeChange = (index: number, val: string) => { const u = [...newMedTimes]; u[index] = val; setNewMedTimes(u); };
  const addTimeSlot = () => setNewMedTimes([...newMedTimes, "12:00"]);
  const removeTimeSlot = (index: number) => { if (newMedTimes.length > 1) setNewMedTimes(newMedTimes.filter((_, i) => i !== index)); };

  const toggleDeviceStatus = (id: string) => setDevices(prev => prev.map(d => d.id === id ? { ...d, status: d.status === "Connected" ? "Disconnected" : "Connected", lastSynced: "Just now" } : d));
  const removeDevice = (id: string) => setDevices(prev => prev.filter(d => d.id !== id));
  const handlePairDevice = () => {
    if (!newDeviceName) return;
    setDevices(prev => [...prev, { id: `dev-${Date.now()}`, name: newDeviceName, type: newDeviceType, status: "Connected", lastSynced: "Just now" }]);
    setIsPairingDevice(false); setNewDeviceName("");
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("prakriti_id");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafb96]/10">
      <p className="text-gray-500 font-semibold">Loading profile...</p>
    </div>
  );

  const statsData = [
    { label: "Day streak", value: dayStreak.toString(), icon: <Flame size={16} className="text-sky-600 fill-sky-400" /> },
    { label: "Habits tracked", value: "0", icon: <Activity size={16} className="text-sky-800" /> },
    { label: "Goals hit", value: "0", icon: <Target size={16} className="text-sky-700" /> },
    { label: "Days active", value: daysActive.toString(), icon: <Heart size={16} className="text-sky-600" /> },
  ];

  return (
    <div className="min-h-screen bg-[#fafb96]/10 pb-24">
      <main className="w-full max-w-2xl mx-auto py-10 px-4 sm:px-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#0f240f] tracking-tight">Profile</h1>
            <p className="text-sm text-[#556050] font-bold mt-1">Your health identity</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-full shadow-md">
            <Flame size={18} className="text-amber-700 fill-amber-600" />
            <span className="text-sm font-black text-amber-900">{dayStreak}</span>
          </div>
        </header>

        {/* Incomplete profile warning */}
        {!profileComplete && (
          <div className="mb-6 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-black text-amber-800">Finish your profile</p>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">Missing: {incompleteFields.join(", ")}</p>
            </div>
          </div>
        )}

        {/* User card */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-sky-100 to-sky-200 border border-sky-300/60 shadow-md">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl flex-shrink-0 border-2 border-white shadow-md" style={{ background: SKYBLUE_BG }}>
              {profile.name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-sky-950 truncate">{profile.name || "—"}</h2>
              <p className="text-sky-800/90 text-sm font-bold mt-0.5">Age {profile.age || "—"} · {profile.weight || "—"} kg · {profile.height || "—"} cm</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.bloodType && (
                  <span className="text-xs bg-sky-600/15 text-sky-900 font-extrabold px-3 py-1 rounded-full border border-sky-400/30">Blood type: {profile.bloodType}</span>
                )}
                {doshas.primary && (
                  <span className="text-xs bg-green-600/15 text-green-900 font-extrabold px-3 py-1 rounded-full border border-green-400/30">{doshas.primary} Prakriti</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-6">
            {statsData.map(s => (
              <div key={s.label} className="bg-white/90 border border-sky-100 rounded-2xl p-3 text-center shadow-sm">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-sky-950 font-black text-lg leading-tight">{s.value}</p>
                <p className="text-sky-800 text-[10px] font-bold mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Personal info */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-[#ffedd5] to-[#fed7aa] border border-[#fdba74]/40 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[#7c2d12] stroke-[2.5]" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-[#7c2d12] font-black">Personal info</h3>
          </div>
          <div className="bg-white/40 p-2.5 rounded-2xl border border-orange-200/40">
            <EditableField label="Name" value={profile.name} onSave={updateProfile("name")} />
            <EditableField label="Date of birth" value={profile.dob} onSave={updateProfile("dob")} type="date" />
            <EditableField label="Age" value={profile.age} onSave={updateProfile("age")} type="number" suffix="yrs" />
            <EditableField label="Weight" value={profile.weight} onSave={updateProfile("weight")} type="number" suffix="kg" />
            <EditableField label="Height" value={profile.height} onSave={updateProfile("height")} type="number" suffix="cm" />
            <EditableField label="Blood type" value={profile.bloodType} onSave={updateProfile("bloodType")} />
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-[#fef08a] to-[#fde047] border border-[#facc15]/40 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Apple size={16} className="text-[#713f12] stroke-[2.5]" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-[#713f12] font-black">Dietary Preferences</h3>
          </div>
          <div className="bg-white/40 p-2.5 rounded-2xl border border-yellow-300/40">
            <EditableField label="Diet Type" value={diet.type} onSave={updateDiet("type")} />
            <EditableField label="Allergies" value={diet.allergies} onSave={updateDiet("allergies")} />
            <EditableField label="Restrictions" value={diet.restrictions} onSave={updateDiet("restrictions")} />
          </div>
        </div>

        {/* Medications */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-[#e9d5ff] to-[#d8b4fe] border border-[#c084fc]/40 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pill size={16} className="text-[#581c87] stroke-[2.5]" />
              <h3 className="text-sm uppercase tracking-[0.18em] text-[#581c87] font-black">Medication Schedule</h3>
            </div>
            {!isCreatingMed && (
              <button onClick={() => setIsCreatingMed(true)} className="flex items-center gap-2 text-[#581c87] hover:bg-purple-300/60 transition-colors px-3 py-1.5 rounded-lg bg-white/90 border border-[#c084fc]/50 text-sm font-bold shadow-sm">
                <Plus size={16} /><span>Add Medication</span>
              </button>
            )}
          </div>

          {isCreatingMed ? (
            <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-[#c084fc]/40 shadow-inner">
              <div>
                <label className="block text-sm font-bold text-[#581c87] mb-1">Medication Name</label>
                <input type="text" value={newMedName} onChange={e => setNewMedName(e.target.value)} placeholder="e.g., Metformin, Aspirin, Vitamin C" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-purple-600 focus:outline-none text-sm shadow-xs" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#581c87] mb-1">Dosage Allocation</label>
                  <input type="text" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} placeholder="e.g., 1 tablet, 500mg" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-purple-600 focus:outline-none text-sm shadow-xs" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#581c87] mb-1">Frequency</label>
                  <select value={newMedFrequency} onChange={e => handleFrequencyPresetChange(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-2 focus:border-purple-600 focus:outline-none text-sm shadow-xs h-[38px] font-medium">
                    <option value="Daily">Daily</option>
                    <option value="Twice a day">Twice a day</option>
                    <option value="Thrice a day">Thrice a day</option>
                    <option value="Alternate days">Alternate days</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Emergency Only">Emergency Only</option>
                    <option value="Manual">Custom / Manual Entry</option>
                  </select>
                </div>
              </div>
              {newMedFrequency === "Manual" && (
                <div className="bg-purple-100/50 border border-purple-300/40 p-3 rounded-xl flex items-center gap-3 shadow-inner">
                  <Wrench size={16} className="text-purple-800 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#581c87] mb-1">Type Custom Frequency Schedule</label>
                    <input type="text" value={newMedManualFrequency} onChange={e => setNewMedManualFrequency(e.target.value)} placeholder="e.g., Every 6 hours, 4 times a week" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-2.5 py-1.5 focus:border-purple-600 focus:outline-none text-xs shadow-xs" />
                  </div>
                </div>
              )}
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-[#581c87] uppercase tracking-wider">Intake Time Allocation(s)</label>
                  {(newMedFrequency === "Manual" || newMedFrequency === "Emergency Only") && (
                    <button type="button" onClick={addTimeSlot} className="text-xs bg-white text-purple-700 hover:bg-purple-100 border border-purple-300 font-extrabold px-2 py-0.5 rounded-md shadow-xs transition-colors">+ Add Time Slot</button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {newMedTimes.map((timeValue, index) => (
                    <div key={index} className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-gray-200 shadow-2xs">
                      <input type="time" value={timeValue} onChange={e => handleTimeChange(index, e.target.value)} className="w-full bg-transparent text-gray-900 font-medium focus:outline-none text-xs" />
                      {newMedTimes.length > 1 && (newMedFrequency === "Manual" || newMedFrequency === "Emergency Only") && (
                        <button type="button" onClick={() => removeTimeSlot(index)} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors"><X size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCreatingMed(false)} className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 text-sm font-bold">Cancel</button>
                <button onClick={handleCreateMedication} disabled={!newMedName || !newMedDosage || (newMedFrequency === "Manual" && !newMedManualFrequency)} className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm ${(!newMedName || !newMedDosage || (newMedFrequency === "Manual" && !newMedManualFrequency)) ? "opacity-50 cursor-not-allowed" : ""}`}>Add Schedule</button>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 p-2.5 rounded-2xl border border-purple-300/40">
              {medications.length === 0 ? (
                <p className="text-center py-4 text-xs font-semibold text-purple-950/60">No medications allocated. Use the button above to add one.</p>
              ) : (
                medications.map(med => (
                  <MedicationRow key={med.id} id={med.id} name={med.name} dosage={med.dosage} frequency={med.frequency} times={med.times} onDelete={() => deleteMedication(med.id)} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Health goals */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#6ee7b7]/40 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#065f46] stroke-[2.5]" />
              <h3 className="text-sm uppercase tracking-[0.18em] text-[#065f46] font-black">Health goals</h3>
            </div>
            {!isCreatingGoal && (
              <button onClick={() => setIsCreatingGoal(true)} className="flex items-center gap-2 text-[#064e3b] hover:bg-emerald-300/60 transition-colors px-3 py-1.5 rounded-lg bg-white/90 border border-[#6ee7b7]/50 text-sm font-bold shadow-sm">
                <Plus size={16} /><span>Create goal</span>
              </button>
            )}
          </div>
          {isCreatingGoal ? (
            <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-[#6ee7b7]/40 shadow-inner">
              <div>
                <label className="block text-sm font-bold text-[#065f46] mb-1">Goal Type / Title</label>
                <input type="text" value={newGoalLabel} onChange={e => setNewGoalLabel(e.target.value)} placeholder="e.g., Green Tea, Reading, Pushups" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none text-sm shadow-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-[#065f46] mb-1">Target Value</label>
                  <input type="number" value={newGoalValue} onChange={e => setNewGoalValue(e.target.value)} placeholder="e.g., 3, 45, 500" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none text-sm shadow-xs" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#065f46] mb-1">Unit</label>
                  <input type="text" value={newGoalUnit} onChange={e => setNewGoalUnit(e.target.value)} placeholder="e.g., cups, pages, reps" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none text-sm shadow-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCreatingGoal(false)} className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 text-sm font-bold">Cancel</button>
                <button onClick={handleCreateGoal} disabled={!newGoalLabel || !newGoalValue} className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm ${!newGoalLabel || !newGoalValue ? "opacity-50 cursor-not-allowed" : ""}`}>Create goal</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {goalTypes.map(type => (
                <GoalCard key={type.id} icon={type.icon} label={type.label} value={goals[type.id] || "0"} unit={type.unit} color={type.color} onSave={updateGoal(type.id)} onDelete={() => deleteGoal(type.id)} />
              ))}
            </div>
          )}
        </div>

        {/* IoT & Wearables */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-teal-100 to-teal-200 border border-teal-300/50 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-teal-900 stroke-[2.5]" />
              <h3 className="text-sm uppercase tracking-[0.18em] text-teal-900 font-black">IoT & Wearables</h3>
            </div>
            {!isPairingDevice && (
              <button onClick={() => setIsPairingDevice(true)} className="flex items-center gap-1.5 text-teal-900 hover:bg-teal-300/50 transition-colors px-3 py-1.5 rounded-lg bg-white/90 border border-teal-300/40 text-sm font-bold shadow-sm">
                <Plus size={16} /><span>Pair Device</span>
              </button>
            )}
          </div>
          {isPairingDevice ? (
            <div className="space-y-4 bg-white/80 p-4 rounded-2xl border border-teal-300/50 shadow-inner">
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-1">Device Name / Model</label>
                <input type="text" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} placeholder="e.g., Apple Watch Series 9, Oura Ring" className="w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 rounded-lg px-3 py-2 focus:border-teal-600 focus:outline-none text-sm shadow-xs" />
              </div>
              <div>
                <label className="block text-sm font-bold text-teal-900 mb-1">Device Type</label>
                <select value={newDeviceType} onChange={e => setNewDeviceType(e.target.value)} className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-2 focus:border-teal-600 focus:outline-none text-sm h-[38px] font-medium shadow-xs">
                  <option value="Smart Watch">Smart Watch / Fitness Tracker</option>
                  <option value="Smart Scale">Smart Scale</option>
                  <option value="Blood Pressure Monitor">Blood Pressure Monitor</option>
                  <option value="Continuous Glucose Monitor">Continuous Glucose Monitor (CGM)</option>
                  <option value="Smart Ring">Smart Ring</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setIsPairingDevice(false)} className="text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 text-sm font-bold">Cancel</button>
                <button onClick={handlePairDevice} disabled={!newDeviceName} className={`px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition-colors text-sm shadow-sm ${!newDeviceName ? "opacity-50 cursor-not-allowed" : ""}`}>Connect & Sync</button>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 p-2.5 rounded-2xl border border-teal-200/50 space-y-2">
              {devices.length === 0 ? (
                <p className="text-center py-4 text-xs font-semibold text-teal-950/60">No automated IoT trackers synchronized yet.</p>
              ) : (
                devices.map(dev => (
                  <div key={dev.id} className="flex items-center justify-between bg-white/70 border border-teal-100/50 p-3 rounded-xl shadow-xs group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-900 truncate">{dev.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-black border uppercase tracking-wider ${dev.status === "Connected" ? "bg-emerald-100 border-emerald-200 text-emerald-800" : "bg-gray-100 border-gray-200 text-gray-500"}`}>{dev.status}</span>
                      </div>
                      <p className="text-xs font-semibold text-teal-950/60 mt-0.5">{dev.type} • <span className="italic">Last sync: {dev.lastSynced}</span></p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => toggleDeviceStatus(dev.id)} className={`p-1.5 rounded-lg border transition-all shadow-xs ${dev.status === "Connected" ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`}>
                        {dev.status === "Connected" ? <Link2Off size={14} /> : <Link2 size={14} />}
                      </button>
                      <button onClick={() => removeDevice(dev.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 sm:opacity-0 group-hover:opacity-100 transition-all duration-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="rounded-3xl p-6 mb-6 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] border border-[#93c5fd]/40 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={16} className="text-[#1e3a8a] stroke-[2.5]" />
            <h3 className="text-sm uppercase tracking-[0.18em] text-[#1e3a8a] font-black">Preferences</h3>
          </div>
          <div className="bg-white/30 p-2.5 rounded-2xl border border-blue-200/40">
            <TogglePref label="Push notifications" description="Daily reminders and streak alerts" value={prefs.notifications} onChange={updatePref("notifications")} />
            <TogglePref label="Weekly report" description="Summary every Sunday morning" value={prefs.weeklyReport} onChange={updatePref("weeklyReport")} />
            <TogglePref label="Habit reminders" description="Nudges for incomplete habits" value={prefs.reminders} onChange={updatePref("reminders")} />
            <TogglePref label="Metric units" description="kg, cm, litres" value={prefs.metricUnits} onChange={updatePref("metricUnits")} />
            <TogglePref label="Share anonymised data" description="Help improve the app" value={prefs.shareData} onChange={updatePref("shareData")} />
          </div>
        </div>

        {/* Account actions */}
        <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-md">
          {[
            { label: "Export my data", sub: "Download a CSV of all your logs" },
            { label: "Connected devices", sub: "Sync with wearables" },
            { label: "Privacy policy", sub: "" },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors text-left">
              <div>
                <p className="text-sm font-bold text-gray-800">{item.label}</p>
                {item.sub && <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.sub}</p>}
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
          <button onClick={handleSignOut} className="w-full px-6 py-4 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
            Sign out
          </button>
        </div>

      </main>
      <Navbar />
    </div>
  );
}