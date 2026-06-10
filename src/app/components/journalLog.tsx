"use client";

import { useState } from "react";

const inter = { style: { fontFamily: "var(--font-inter), system-ui, sans-serif" } };

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-4xl transition-transform hover:scale-110 leading-none"
          style={{ color: n <= (hovered || value) ? "#F59E0B" : "#D1D5DB" }}
          aria-label={`${n} star`}
        >
          {n <= (hovered || value) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

const stressColors = [
  "#1D9E75", "#1D9E75", "#5DCAA5",
  "#EF9F27", "#EF9F27", "#EF9F27",
  "#D85A30", "#D85A30", "#E24B4A", "#E24B4A",
];
const stressLabels = [
  "Very calm", "Very calm", "Calm",
  "Mild", "Moderate", "Moderate",
  "High", "High", "Very high", "Severe",
];

function StressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = ((value - 1) / 9) * 100;
  const color = stressColors[value - 1];
  const label = stressLabels[value - 1];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-3xl font-semibold transition-colors" style={{ color }}>{value}</span>
        <span className="text-base font-medium transition-colors" style={{ color }}>{label}</span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 border border-gray-200">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: color }}
        />
        <input
          type="range" min={1} max={10} step={1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Stress score"
        />
      </div>
      <div className="flex justify-between mt-2">
        {[1, 5, 10].map((n) => (
          <span key={n} className="text-sm text-gray-400">{n}</span>
        ))}
      </div>
    </div>
  );
}

type EmojiOption = { val: number; emoji: string };

function EmojiPicker({ options, value, onChange }: {
  options: EmojiOption[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.val}
          onClick={() => onChange(o.val)}
          className={`text-3xl px-4 py-2 rounded-2xl border transition ${
            value === o.val ? "bg-white border-gray-400" : "bg-gray-50 border-gray-200"
          }`}
        >
          {o.emoji}
        </button>
      ))}
    </div>
  );
}

const moodEmojis: EmojiOption[] = [
  { val: 1, emoji: "😞" }, { val: 2, emoji: "😕" }, { val: 3, emoji: "😐" },
  { val: 4, emoji: "🙂" }, { val: 5, emoji: "😄" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-base text-gray-800 focus:outline-none focus:border-emerald-400";

const exerciseTypes = ["light", "moderate", "heavy"] as const;
type ExerciseType = (typeof exerciseTypes)[number];

const exercisePillStyle: Record<ExerciseType, string> = {
  light:    "bg-emerald-50 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-50 text-amber-800 border-amber-300",
  heavy:    "bg-rose-50 text-rose-800 border-rose-300",
};

const mealConfig = [
  { key: "breakfast" as const, label: "Breakfast", bg: "bg-amber-50",   titleColor: "text-amber-900"   },
  { key: "lunch"     as const, label: "Lunch",     bg: "bg-emerald-50", titleColor: "text-emerald-900" },
  { key: "dinner"    as const, label: "Dinner",    bg: "bg-violet-50",  titleColor: "text-violet-900"  },
];

export default function JournalLog() {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate]                         = useState(today);
  const [wakeTime, setWakeTime]                 = useState("07:00");
  const [sleepTime, setSleepTime]               = useState("23:00");
  const [sleepQuality, setSleepQuality]         = useState(0);
  const [steps, setSteps]                       = useState("");
  const [exerciseDuration, setExerciseDuration] = useState("");
  const [exerciseType, setExerciseType]         = useState<ExerciseType>("light");
  const [meals, setMeals] = useState({
    breakfast: { time: "08:30", calories: "", healthScore: "" },
    lunch:     { time: "13:00", calories: "", healthScore: "" },
    dinner:    { time: "19:30", calories: "", healthScore: "" },
  });
  const [mood, setMood]               = useState(3);
  const [stress, setStress]           = useState(5);
  const [habitsDone, setHabitsDone]   = useState(false);
  const [dailiesDone, setDailiesDone] = useState(false);
  const [notes, setNotes]             = useState("");

  const updateMeal = (meal: keyof typeof meals, field: string, value: string) =>
    setMeals((prev) => ({ ...prev, [meal]: { ...prev[meal], [field]: value } }));

  const divider      = "border-t border-gray-100 pt-6 mt-6";
  const sectionLabel = "text-base font-bold text-gray-700 uppercase tracking-widest mb-4";

  return (
    <div
      className="bg-white border border-gray-200 rounded-3xl px-8 py-8"
      style={inter.style}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-20 ">
        <h2 className="text-2xl font-bold text-gray-900">Daily log</h2>
        <input
          type="date" value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Sleep */}
      <div className="px-1">
        <p className={sectionLabel}>Sleep</p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Wake time">
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Sleep time">
              <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Sleep quality">
            <StarRating value={sleepQuality} onChange={setSleepQuality} />
          </Field>
        </div>
      </div>

      {/* Activity */}
      <div className={divider + " px-1"}>
        <p className={sectionLabel}>Activity</p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Steps">
              <input type="number" placeholder="e.g. 8000" value={steps}
                onChange={(e) => setSteps(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Duration (min)">
              <input type="number" placeholder="e.g. 30" value={exerciseDuration}
                onChange={(e) => setExerciseDuration(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Exercise type">
            <div className="flex gap-3 mt-0.5">
              {exerciseTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setExerciseType(t)}
                  className={`px-5 py-2 rounded-full text-base border transition capitalize font-medium ${
                    exerciseType === t ? exercisePillStyle[t] : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* Meals */}
      <div className={divider + " px-1"}>
        <p className={sectionLabel}>Meals</p>
        <div className="grid grid-cols-3 gap-3">
          {mealConfig.map(({ key, label, bg, titleColor }) => (
            <div key={key} className={`${bg} rounded-2xl px-4 py-4 flex flex-col gap-3`}>
              <p className={`text-base font-bold ${titleColor}`}>{label}</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-500">Time</label>
                <input type="time" value={meals[key].time}
                  onChange={(e) => updateMeal(key, "time", e.target.value)}
                  className="bg-white/60 border border-black/[0.08] rounded-xl px-3 py-2 text-sm text-gray-800 w-full focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-500">Calories</label>
                <input type="number" placeholder="kcal" value={meals[key].calories}
                  onChange={(e) => updateMeal(key, "calories", e.target.value)}
                  className="bg-white/60 border border-black/[0.08] rounded-xl px-3 py-2 text-sm text-gray-800 w-full focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-500">Health score</label>
                <select value={meals[key].healthScore}
                  onChange={(e) => updateMeal(key, "healthScore", e.target.value)}
                  className="bg-white/60 border border-black/[0.08] rounded-xl px-3 py-2 text-sm text-gray-800 w-full focus:outline-none">
                  <option value="">— pick —</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood & Stress */}
      <div className={divider + " px-1"}>
        <p className={sectionLabel}>How are you feeling?</p>
        <div className="flex flex-col gap-5">
          <Field label="Mood">
            <EmojiPicker options={moodEmojis} value={mood} onChange={setMood} />
          </Field>
          <Field label="Stress">
            <StressSlider value={stress} onChange={setStress} />
          </Field>
        </div>
      </div>

      {/* Completion */}
      <div className={divider + " px-1"}>
        <p className={sectionLabel}>Completion</p>
        <div className="flex flex-col gap-4">
          {[
            { label: "Habits done?",  value: habitsDone,  set: setHabitsDone  },
            { label: "Dailies done?", value: dailiesDone, set: setDailiesDone },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-base font-medium text-gray-700">{label}</span>
              <button
                onClick={() => set(!value)}
                className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                  value ? "bg-emerald-500" : "bg-gray-200"
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  value ? "left-6" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className={divider + " px-1"}>
        <p className={sectionLabel}>Notes</p>
        <textarea
          rows={4} value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was your day? Anything on your mind..."
          className={inputCls + " resize-none"}
        />
      </div>

      <div className="px-1 mt-6">
        <button className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-2xl transition">
          Save log
        </button>
      </div>

    </div>
  );
}