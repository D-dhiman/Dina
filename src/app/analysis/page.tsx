"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Chart, ChartOptions, ChartData, registerables } from "chart.js";
import Navbar from "../components/navbar";
import { Download } from "lucide-react";

Chart.register(...registerables);

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

// ─── SLEEP DATA HELPERS ───────────────────────────────────────────────────────
function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = String(t).split(":").map(Number);
  if (parts.length < 2 || parts.some((p) => Number.isNaN(p))) return null;
  return parts[0] * 60 + parts[1];
}

function computeSleepDurationHours(sleepTime: string | null, wakeTime: string | null): number | null {
  const s = parseTimeToMinutes(sleepTime);
  const w = parseTimeToMinutes(wakeTime);
  if (s == null || w == null) return null;
  let diffMinutes = w - s;
  if (diffMinutes <= 0) diffMinutes += 24 * 60;
  return diffMinutes / 60;
}

function computeSleepStages(totalHours: number, qualityRaw: number | null | undefined) {
  const q = Math.min(10, Math.max(1, qualityRaw ?? 5));
  const deepRatio = 0.15 + (q / 10) * 0.1;
  const remRatio  = 0.2  + (q / 10) * 0.08;
  const lightRatio = Math.max(0, 1 - deepRatio - remRatio);
  return {
    deep:  Math.round(totalHours * deepRatio  * 10) / 10,
    rem:   Math.round(totalHours * remRatio   * 10) / 10,
    light: Math.round(totalHours * lightRatio * 10) / 10,
  };
}

// ─── STATIC CHART OPTIONS ────────────────────────────────────────────────────
const sleepOptions: ChartOptions<"bar"> = {
  responsive: true, maintainAspectRatio: false,
  scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } },
};

const doshaOptions: ChartOptions<"radar"> = {
  responsive: true, maintainAspectRatio: false,
  scales: {
    r: {
      min: 0, max: 100,
      ticks: { stepSize: 20 },
      pointLabels: { font: { size: 11, weight: "bold" } },
    },
  },
};

const FALLBACK_HEALTHSCORE_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FALLBACK_HEALTHSCORE_VALUES = [62, 65, 70, 74, 72, 69, 75, 79, 82, 85, 83, 88];
const healthScoreOptions: ChartOptions<"line"> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: "top" } },
  scales: {
    x: { grid: { display: false } },
    y: { min: 50, max: 100, ticks: { stepSize: 10 } },
  },
};

// inflameData removed — now computed dynamically from daily logs + habits

const FALLBACK_WELLNESS_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FALLBACK_WELLNESS_SCORES = [68, 72, 76, 81, 84, 78, 73, 80, 85, 88, 83, 87];

const baseLineOptions: ChartOptions<"line"> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: "top" } },
  scales: { x: { grid: { display: false } }, y: { beginAtZero: false } },
};

const kpis = [
  { label: "Yearly Wellness",  value: "83", bgHex: "#AED27D", textHex: "#1a3d1a" },
  { label: "Sleep Efficiency", value: "79", bgHex: "#A6C7F2", textHex: "#0c2340" },
];

const CHART_SECTIONS = [
  { title: "Weekly Habits Update",          key: "habits",      bg: "#ffffff" },
  { title: "Sleep Architecture",            key: "sleep",       bg: "#A6C7F2" },
  { title: "Wellness Check Radar",          key: "dosha",       bg: "#AED27D" },
  { title: "Overall Health Score Trend",    key: "healthscore", bg: "#ffffff" },
  { title: "Inflammatory Index Tracker",    key: "inflame",     bg: "#ffffff" },
  { title: "Longitudinal Wellness Base",    key: "wellness",    bg: "#ffffff" },
];

// ─── DOSHA AXIS LABELS (Ayurvedic wellness dimensions) ──────────────────────
const DOSHA_LABELS = [
  "Agni & Kosta",
  "Sharirika & Bala",
  "Indriya & Upadhatu",
  "Manasika",
];

// Map backend section keys → radar axis index
const SECTION_TO_DOSHA: Record<string, number> = {
  "Digestion & Metabolism":    0, // Agni & Kosta
  "Physical Body & Vitality":  1, // Sharirika & Bala
  "Senses, Skin & Speech":     2, // Indriya & Upadhatu
  "Mind, Mood & Emotions":     3, // Manasika
};

export default function AnalyticsPage() {
  const chartRefs  = useRef<Record<string, HTMLCanvasElement | null>>({});
  const chartsRef  = useRef<Chart[]>([]);

  const [downloading,    setDownloading]    = useState(false);
  const [downloadError,  setDownloadError]  = useState<string | null>(null);

  // ── Habit state ──────────────────────────────────────────────────────────
  const [habitLabels, setHabitLabels] = useState<string[]>([]);
  const [habitCounts, setHabitCounts] = useState<number[]>([]);
  const [habitTotal,  setHabitTotal]  = useState<number>(0);
  const [habitReady,  setHabitReady]  = useState(false);

  // ── Sleep state ──────────────────────────────────────────────────────────
  const [sleepLabels,    setSleepLabels]    = useState<string[]>([]);
  const [sleepDeep,      setSleepDeep]      = useState<number[]>([]);
  const [sleepRem,       setSleepRem]       = useState<number[]>([]);
  const [sleepLight,     setSleepLight]     = useState<number[]>([]);
  const [sleepAvgHours,  setSleepAvgHours]  = useState<number>(0);
  const [sleepReady,     setSleepReady]     = useState(false);

  // ── Wellness state ───────────────────────────────────────────────────────
  const [wellnessLabels, setWellnessLabels] = useState<string[]>([]);
  const [wellnessScores, setWellnessScores] = useState<number[]>([]);
  const [wellnessLatest, setWellnessLatest] = useState<number | null>(null);
  const [wellnessReady,  setWellnessReady]  = useState(false);

  // ── Health Score Trend state ─────────────────────────────────────────────
  const [healthScoreLabels,   setHealthScoreLabels]   = useState<string[]>([]);
  const [healthScoreValues,   setHealthScoreValues]   = useState<number[]>([]);
  const [healthScoreBaseline, setHealthScoreBaseline] = useState<number>(0);
  const [healthScoreLatest,   setHealthScoreLatest]   = useState<number | null>(null);
  const [healthScoreReady,    setHealthScoreReady]    = useState(false);

  // ── Dosha / Wellness-Check Radar state ──────────────────────────────────
  const [doshaActual, setDoshaActual] = useState<number[]>([0, 0, 0, 0]);
  const [doshaReady,  setDoshaReady]  = useState(false);

  // ── Inflammatory Load Index state ────────────────────────────────────────
  const [inflameLabels,  setInflameLabels]  = useState<string[]>([]);
  const [inflameScores,  setInflameScores]  = useState<number[]>([]);
  const [inflameReady,   setInflameReady]   = useState(false);
  const [inflameLatest,  setInflameLatest]  = useState<number | null>(null);

  const setRef = (key: string) => (el: HTMLCanvasElement | null) => {
    chartRefs.current[key] = el;
  };

  // ── Fetch habit completions ───────────────────────────────────────────────
  useEffect(() => {
    async function fetchHabits() {
      try {
        const dates: string[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split("T")[0];
        });

        const responses = await Promise.all(
          dates.map(date =>
            fetch(`/api/habit-completions?date=${date}`, { headers: authHeaders() })
              .then(r => r.ok ? r.json() : { completions: [] })
              .catch(() => ({ completions: [] }))
          )
        );

        const counts: number[] = responses.map(data =>
          (data.completions ?? []).filter((c: any) => c.is_completed === true).length
        );
        const labels: string[] = dates.map(dateStr => {
          const d = new Date(dateStr + "T00:00:00");
          return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        });

        setHabitLabels(labels);
        setHabitCounts(counts);
        setHabitTotal(counts.reduce((s, v) => s + v, 0));
      } catch {
        setHabitLabels(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
        setHabitCounts([0, 0, 0, 0, 0, 0, 0]);
        setHabitTotal(0);
      } finally {
        setHabitReady(true);
      }
    }
    fetchHabits();
  }, []);

  // ── Fetch daily logs for Sleep Architecture ───────────────────────────────
  useEffect(() => {
    async function fetchSleep() {
      try {
        const dates: string[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split("T")[0];
        });

        const responses = await Promise.all(
          dates.map(date =>
            fetch(`/api/daily-logs?date=${date}`, { headers: authHeaders() })
              .then(r => (r.ok ? r.json() : { logs: [] }))
              .catch(() => ({ logs: [] }))
          )
        );

        const deep: number[] = [];
        const rem:  number[] = [];
        const light: number[] = [];
        let totalHoursSum = 0;
        let nightsWithData = 0;

        responses.forEach((data) => {
          const log = (data.logs ?? [])[0];
          const totalHours = log
            ? computeSleepDurationHours(log.sleep_time, log.wake_time)
            : null;

          if (totalHours != null) {
            const stages = computeSleepStages(totalHours, log.sleep_quality);
            deep.push(stages.deep);
            rem.push(stages.rem);
            light.push(stages.light);
            totalHoursSum += totalHours;
            nightsWithData += 1;
          } else {
            deep.push(0); rem.push(0); light.push(0);
          }
        });

        const labels: string[] = dates.map(dateStr => {
          const d = new Date(dateStr + "T00:00:00");
          return d.toLocaleDateString("en-US", { weekday: "short" });
        });

        setSleepLabels(labels);
        setSleepDeep(deep);
        setSleepRem(rem);
        setSleepLight(light);
        setSleepAvgHours(nightsWithData > 0 ? totalHoursSum / nightsWithData : 0);
      } catch {
        setSleepLabels(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]);
        setSleepDeep([0,0,0,0,0,0,0]);
        setSleepRem([0,0,0,0,0,0,0]);
        setSleepLight([0,0,0,0,0,0,0]);
        setSleepAvgHours(0);
      } finally {
        setSleepReady(true);
      }
    }
    fetchSleep();
  }, []);

  // ── Fetch wellness assessments (Longitudinal Wellness Base) ───────────────
  useEffect(() => {
    async function fetchWellness() {
      try {
        const res  = await fetch(`/api/wellness`, { headers: authHeaders() });
        const data = res.ok ? await res.json() : { assessments: [] };
        const assessments = (data.assessments ?? []).slice().reverse();

        if (assessments.length === 0) {
          setWellnessLabels(FALLBACK_WELLNESS_LABELS);
          setWellnessScores(FALLBACK_WELLNESS_SCORES);
          setWellnessLatest(null);
          return;
        }

        const labels = assessments.map((a: any) =>
          new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        const scores = assessments.map((a: any) => Math.round(Number(a.total_score) * 10) / 10);

        setWellnessLabels(labels);
        setWellnessScores(scores);
        setWellnessLatest(scores[scores.length - 1]);
      } catch {
        setWellnessLabels(FALLBACK_WELLNESS_LABELS);
        setWellnessScores(FALLBACK_WELLNESS_SCORES);
        setWellnessLatest(null);
      } finally {
        setWellnessReady(true);
      }
    }
    fetchWellness();
  }, []);

  // ── Fetch prediction history (Overall Health Score Trend) ─────────────────
  useEffect(() => {
    async function fetchHealthScore() {
      try {
        const res  = await fetch(`/api/predictions?limit=30`, { headers: authHeaders() });
        const data = res.ok ? await res.json() : { predictions: [] };
        const predictions = data.predictions ?? [];

        if (predictions.length === 0) {
          setHealthScoreLabels(FALLBACK_HEALTHSCORE_LABELS);
          setHealthScoreValues(FALLBACK_HEALTHSCORE_VALUES);
          setHealthScoreBaseline(
            FALLBACK_HEALTHSCORE_VALUES.reduce((s: number, v: number) => s + v, 0) / FALLBACK_HEALTHSCORE_VALUES.length
          );
          setHealthScoreLatest(null);
          return;
        }

        const labels = predictions.map((p: any) =>
          new Date(p.forecast_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        );
        const values   = predictions.map((p: any) => Math.round(Number(p.health_score) * 10) / 10);
        const baseline = values.reduce((s: number, v: number) => s + v, 0) / values.length;

        setHealthScoreLabels(labels);
        setHealthScoreValues(values);
        setHealthScoreBaseline(Math.round(baseline * 10) / 10);
        setHealthScoreLatest(values[values.length - 1]);
      } catch {
        setHealthScoreLabels(FALLBACK_HEALTHSCORE_LABELS);
        setHealthScoreValues(FALLBACK_HEALTHSCORE_VALUES);
        setHealthScoreBaseline(
          FALLBACK_HEALTHSCORE_VALUES.reduce((s: number, v: number) => s + v, 0) / FALLBACK_HEALTHSCORE_VALUES.length
        );
        setHealthScoreLatest(null);
      } finally {
        setHealthScoreReady(true);
      }
    }
    fetchHealthScore();
  }, []);

  // ── Fetch Inflammatory Load Index — 12 weeks from daily_logs fields ─────
  // Uses fields actually stored by your daily-logs API:
  //   poor_sleep   ×25  deep sleep < 1 hr (derived from sleep_time/wake_time/quality)
  //   high_stress  ×25  stress_level >= 7  (scale 1–10)
  //   low_mood     ×20  mood_score <= 3    (scale 1–10)
  //   poor_diet    ×15  meal_details contains inflammatory keywords
  //   overtraining ×15  exercise_duration > 60 min two consecutive days
  // Normalised to 0–100. No wearable data needed.
  useEffect(() => {
    async function fetchInflame() {
      try {
        // Use GET without ?date to get last 7 logs, then batch-fetch week by week
        // The API supports ?date=YYYY-MM-DD (single day) — fetch all 84 in parallel
        const allDates: string[] = Array.from({ length: 84 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (83 - i)); // oldest → today
          return d.toISOString().split("T")[0];
        });

        // Single batch of 84 daily-log requests (your existing API, no changes needed)
        const logResponses = await Promise.all(
          allDates.map(date =>
            fetch(`/api/daily-logs?date=${date}`, { headers: authHeaders() })
              .then(r => r.ok ? r.json() : { logs: [] })
              .catch(() => ({ logs: [] }))
          )
        );

        // Per-day signal extraction from real daily_logs fields
        type DaySignal = {
          poorSleep:    boolean;  // deep sleep < 1 hr
          highStress:   boolean;  // stress_level >= 7
          lowMood:      boolean;  // mood_score <= 3
          poorDiet:     boolean;  // meal_details has inflammatory keywords
          exerciseMins: number;   // exercise_duration in minutes (for overtraining)
        };

        const daySignals: DaySignal[] = allDates.map((_, i) => {
          const log = (logResponses[i].logs ?? [])[0];

          // Poor sleep — derived from sleep/wake times + quality
          let poorSleep = false;
          if (log?.sleep_time && log?.wake_time) {
            const dur = computeSleepDurationHours(log.sleep_time, log.wake_time);
            if (dur != null) {
              const stages = computeSleepStages(dur, log.sleep_quality);
              poorSleep = stages.deep < 1.0;
            }
          }

          // High stress — stress_level field (1–10 scale)
          const highStress = log?.stress_level != null
            ? Number(log.stress_level) >= 7
            : false;

          // Low mood — mood_score field (1–10 scale)
          const lowMood = log?.mood_score != null
            ? Number(log.mood_score) <= 3
            : false;

          // Poor diet — scan meal_details (stored as JSON or string) for
          // inflammatory food keywords
          let poorDiet = false;
          if (log?.meal_details) {
            const mealStr = typeof log.meal_details === "string"
              ? log.meal_details
              : JSON.stringify(log.meal_details);
            poorDiet = /fried|junk|spicy|alcohol|sugar|processed|fast.?food|maida|refined/i
              .test(mealStr);
          }

          // Exercise duration (minutes) — for overtraining detection
          const exerciseMins = log?.exercise_duration != null
            ? Number(log.exercise_duration)
            : 0;

          return { poorSleep, highStress, lowMood, poorDiet, exerciseMins };
        });

        // Aggregate into 12 weekly scores
        // Weights: sleep×25, stress×25, mood×20, diet×15, overtrain×15
        // Max possible per week: 7×25 + 7×25 + 7×20 + 7×15 + 6×15 = 770
        const weekLabels: string[] = [];
        const weekScores: number[] = [];

        for (let w = 0; w < 12; w++) {
          const slice = daySignals.slice(w * 7, w * 7 + 7);

          let poorSlp = 0, highStr = 0, lowMd = 0, poorDt = 0, overTrain = 0;
          slice.forEach((day, di) => {
            if (day.poorSleep)  poorSlp++;
            if (day.highStress) highStr++;
            if (day.lowMood)    lowMd++;
            if (day.poorDiet)   poorDt++;
            // Overtraining: >60 min exercise two days in a row with no rest
            if (
              day.exerciseMins > 60 &&
              di < 6 &&
              slice[di + 1]?.exerciseMins > 60
            ) overTrain++;
          });

          const raw    = poorSlp * 25 + highStr * 25 + lowMd * 20 + poorDt * 15 + overTrain * 15;
          const maxRaw = 7 * 25 + 7 * 25 + 7 * 20 + 7 * 15 + 6 * 15;
          const score  = Math.round((raw / maxRaw) * 100);

          weekLabels.push(w === 11 ? "Now" : `W${w + 1}`);
          weekScores.push(score);
        }

        setInflameLabels(weekLabels);
        setInflameScores(weekScores);
        setInflameLatest(weekScores[weekScores.length - 1]);
      } catch {
        setInflameLabels(["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","Now"]);
        setInflameScores([28, 35, 42, 38, 55, 61, 49, 44, 38, 32, 29, 25]);
        setInflameLatest(25);
      } finally {
        setInflameReady(true);
      }
    }
    fetchInflame();
  }, []);

  // ── Fetch wellness → Dosha / Wellness-Check Radar ─────────────────────────  // Re-uses the same /api/wellness endpoint. Takes the latest assessment
  // (index 0, already DESC order), reads each section's raw_score (1–5),
  // converts to 0–100, and maps to the four Ayurvedic radar axes.
  useEffect(() => {
    async function fetchDosha() {
      try {
        const res  = await fetch(`/api/wellness`, { headers: authHeaders() });
        const data = res.ok ? await res.json() : { assessments: [] };
        const latest = (data.assessments ?? [])[0];

        if (!latest?.section_scores) {
          setDoshaActual([50, 50, 50, 50]);
          return;
        }

        const s: Record<string, { raw_score?: number }> = typeof latest.section_scores === "string"
          ? JSON.parse(latest.section_scores)
          : latest.section_scores;

        // raw_score is 1–5 scale → convert to 0–100
        const toPercent = (key: string): number => {
          const raw = s[key]?.raw_score ?? 1;
          return Math.round(((raw - 1) / 4) * 100);
        };

        const actual = [0, 0, 0, 0];
        for (const [sectionKey, axisIndex] of Object.entries(SECTION_TO_DOSHA)) {
          actual[axisIndex] = toPercent(sectionKey);
        }

        setDoshaActual(actual);
      } catch {
        setDoshaActual([50, 50, 50, 50]);
      } finally {
        setDoshaReady(true);
      }
    }
    fetchDosha();
  }, []);

  // ── Build / rebuild all charts once every data source is ready ────────────
  useEffect(() => {
    if (!habitReady || !sleepReady || !wellnessReady || !healthScoreReady || !doshaReady || !inflameReady) return;

    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    const make = (key: string, type: any, data: any, options: any) => {
      const el = chartRefs.current[key];
      if (el) chartsRef.current.push(new Chart(el, { type, data, options }));
    };

    // ── Weekly Habits ──────────────────────────────────────────────────────
    const maxCount = Math.max(...habitCounts, 1);
    make("habits", "bar", {
      labels: habitLabels,
      datasets: [
        {
          type: "bar" as const,
          label: "Habits Completed",
          data: habitCounts,
          backgroundColor: habitCounts.map(v =>
            v >= maxCount * 0.85 ? "rgba(4, 120, 87, 0.85)"
            : v >= maxCount * 0.5 ? "rgba(16, 185, 129, 0.65)"
            : "rgba(16, 185, 129, 0.3)"
          ),
          borderRadius: 8,
          yAxisID: "y",
        },
        {
          type: "line" as const,
          label: "7-day trend",
          data: habitCounts,
          borderColor: "rgba(4, 120, 87, 0.5)",
          backgroundColor: "transparent",
          borderDash: [4, 3],
          pointRadius: 3,
          tension: 0.4,
          yAxisID: "y",
        },
      ],
    }, {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: {
          callbacks: {
            afterTitle: (items: any[]) => {
              const v = items[0]?.parsed?.y ?? 0;
              return v === maxCount ? "🏆 Best day this week!" : "";
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: "Habits done", font: { size: 10 } },
        },
      },
    });

    // ── Sleep Architecture ─────────────────────────────────────────────────
    make("sleep", "bar", {
      labels: sleepLabels,
      datasets: [
        { label: "Deep (hrs)",  data: sleepDeep,  backgroundColor: "rgba(29, 78, 216, 1)",   borderRadius: 4 },
        { label: "REM (hrs)",   data: sleepRem,   backgroundColor: "rgba(59, 130, 246, 1)",  borderRadius: 4 },
        { label: "Light (hrs)", data: sleepLight, backgroundColor: "rgba(147, 197, 253, 1)", borderRadius: 4 },
      ],
    }, sleepOptions);

    // ── Wellness Check Radar (was Dosha Imbalance Map) ─────────────────────
    // Axes: Agni & Kosta | Sharirika & Bala | Indriya & Upadhatu | Manasika
    // Data sourced from latest wellness assessment via /api/wellness
    make("dosha", "radar", {
      labels: DOSHA_LABELS,
      datasets: [
        {
          label: "Current Status",
          data: doshaActual,
          borderColor: "rgba(194, 65, 12, 1)",
          backgroundColor: "rgba(249, 115, 22, 0.12)",
          pointBackgroundColor: "rgba(249, 115, 22, 1)",
          pointRadius: 4,
        },
        {
          label: "Optimal Target",
          data: Array(DOSHA_LABELS.length).fill(80),
          borderColor: "rgba(4, 120, 87, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.06)",
          pointBackgroundColor: "rgba(16, 185, 129, 1)",
          pointRadius: 3,
          borderDash: [4, 3],
        },
      ],
    }, doshaOptions);

    // ── Overall Health Score Trend ─────────────────────────────────────────
    make("healthscore", "line", {
      labels: healthScoreLabels,
      datasets: [
        {
          label: "Overall Health Score",
          data: healthScoreValues,
          borderColor: "rgba(29, 78, 216, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          fill: true, tension: 0.45,
          pointRadius: 5, pointHoverRadius: 7,
          pointBackgroundColor: "rgba(29, 78, 216, 1)",
          borderWidth: 2.5,
        },
        {
          label: "Baseline (avg)",
          data: Array(healthScoreValues.length).fill(healthScoreBaseline),
          borderColor: "rgba(156, 163, 175, 0.6)",
          backgroundColor: "transparent",
          borderDash: [5, 4],
          pointRadius: 0, borderWidth: 1.5, tension: 0,
        },
      ],
    }, healthScoreOptions);

    // ── Inflammatory Load Index (dynamic, color-coded points) ─────────────
    // Formula: sleep×25 + stress×25 + mood×20 + diet×15 + overtrain×15
    // 🟢 Green  = score < 35  (Normal)
    // 🟠 Orange = score 35–50 (Elevated)
    // 🔴 Red    = score > 50  (High)
    const inflamePointColors = inflameScores.map(s =>
      s < 35  ? "rgba(22, 163, 74, 1)"   // green
      : s <= 50 ? "rgba(234, 88, 12, 1)" // orange
      : "rgba(220, 38, 38, 1)"            // red
    );
    const inflamePointBg = inflameScores.map(s =>
      s < 35  ? "rgba(22, 163, 74, 0.15)"
      : s <= 50 ? "rgba(234, 88, 12, 0.15)"
      : "rgba(220, 38, 38, 0.15)"
    );
    make("inflame", "line", {
      labels: inflameLabels,
      datasets: [{
        label: "Inflammatory Load",
        data: inflameScores,
        borderColor: "rgba(156, 163, 175, 0.6)",
        backgroundColor: "rgba(249, 115, 22, 0.04)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: inflamePointColors,
        pointBorderColor: inflamePointColors,
        pointBorderWidth: 2,
        pointRadius: 7,
        pointHoverRadius: 9,
      }],
    }, {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.parsed.y;
              const status = v < 35 ? "🟢 Normal" : v <= 50 ? "🟠 Elevated" : "🔴 High";
              return ` Score: ${v}  ${status}`;
            },
            afterLabel: (ctx: any) => {
              const v = ctx.parsed.y;
              if (v > 50)  return " Investigate this week — multiple signals fired";
              if (v > 35)  return " Monitor closely — early warning";
              return " All clear";
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          min: 0, max: 100,
          ticks: { stepSize: 25 },
          grid: { color: "rgba(0,0,0,0.05)" },
        },
      },
    });

    // ── Longitudinal Wellness Base ─────────────────────────────────────────
    make("wellness", "bar", {
      labels: wellnessLabels,
      datasets: [{
        label: "Wellness Score",
        data: wellnessScores,
        backgroundColor: "rgba(4, 120, 87, 0.75)",
        borderRadius: 6,
      }],
    }, {
      ...baseLineOptions,
      scales: { ...baseLineOptions.scales, y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    });

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, [
    habitReady, habitLabels, habitCounts,
    sleepReady, sleepLabels, sleepDeep, sleepRem, sleepLight,
    wellnessReady, wellnessLabels, wellnessScores,
    healthScoreReady, healthScoreLabels, healthScoreValues, healthScoreBaseline,
    doshaReady, doshaActual,
    inflameReady, inflameLabels, inflameScores,
  ]);

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const jsPDF = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;
      if (!jsPDF) throw new Error("jsPDF failed to load.");

      const pdf   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const PW    = 297;
      const PH    = 210;
      const MARGIN  = 10;
      const usableW = PW - MARGIN * 2;

      pdf.setFillColor(252, 253, 250);
      pdf.rect(0, 0, PW, PH, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(30, 58, 30);
      pdf.text("DINA-AI Analytics Report", MARGIN, 22);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(138, 148, 133);
      pdf.text(
        `Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
        MARGIN, 30
      );

      const kpiBoxW = 60;
      kpis.forEach((k, i) => {
        const x   = MARGIN + i * (kpiBoxW + 6);
        const y   = 38;
        const hex = k.bgHex.replace("#", "");
        pdf.setFillColor(parseInt(hex.substring(0,2),16), parseInt(hex.substring(2,4),16), parseInt(hex.substring(4,6),16));
        pdf.roundedRect(x, y, kpiBoxW, 28, 5, 5, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(k.label.toUpperCase(), x + 4, y + 9);
        const th = k.textHex.replace("#", "");
        pdf.setTextColor(parseInt(th.substring(0,2),16), parseInt(th.substring(2,4),16), parseInt(th.substring(4,6),16));
        pdf.setFontSize(26);
        pdf.text(k.value, x + 4, y + 23);
      });

      const CHARTS_PER_ROW = 2;
      const chartW = (usableW - 6) / CHARTS_PER_ROW;
      const chartH = 70;
      const startY = 80;
      let col = 0, row = 0, pageInitialized = false;

      for (const section of CHART_SECTIONS) {
        const canvas = chartRefs.current[section.key];
        if (!canvas) continue;
        const imgData = canvas.toDataURL("image/png");

        if (col === 0 && row === 2) {
          pdf.addPage();
          pdf.setFillColor(252, 253, 250);
          pdf.rect(0, 0, PW, PH, "F");
          row = 0;
          pageInitialized = true;
        }

        const x = MARGIN + col * (chartW + 6);
        const y = (pageInitialized ? MARGIN : startY) + row * (chartH + 12);
        const bg = section.bg.replace("#", "");

        pdf.setFillColor(parseInt(bg.substring(0,2),16), parseInt(bg.substring(2,4),16), parseInt(bg.substring(4,6),16));
        pdf.roundedRect(x, y, chartW, chartH, 5, 5, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(30, 58, 30);
        pdf.text(section.title, x + 4, y + 7);

        const imgAspect = canvas.height / canvas.width;
        const imgW = chartW - 8;
        const imgH = Math.min(imgW * imgAspect, chartH - 14);
        pdf.addImage(imgData, "PNG", x + 4, y + 10, imgW, imgH);

        col++;
        if (col >= CHARTS_PER_ROW) { col = 0; row++; }
      }

      pdf.save(`DINA-AI-Analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setDownloadError(err?.message ?? "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen pb-20 font-sans" style={{ backgroundColor: "#fcfdfa" }}>
      <Navbar />
      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto flex flex-col gap-8">

        {/* Header */}
        <header
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6"
          style={{ borderBottom: "1px solid #f0f0f0" }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1e3a1e" }}>
              DINA-AI Analytics Engine
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: "#8a9485" }}>
              Deep Ayurvedic Insights &amp; Longitudinal Health Trends
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="font-semibold py-2 px-4 rounded-xl flex items-center gap-2 text-sm transition-colors"
              style={{
                color: "#fff",
                backgroundColor: downloading ? "#9ca3af" : "#047857",
                cursor: downloading ? "not-allowed" : "pointer",
              }}
            >
              <Download size={16} />
              <span>{downloading ? "Generating PDF…" : "Download Report PDF"}</span>
            </button>
            {downloadError && (
              <p className="text-xs max-w-xs text-right" style={{ color: "#ef4444" }}>{downloadError}</p>
            )}
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-[32px] p-6 shadow-sm"
              style={{ backgroundColor: k.bgHex, border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "rgba(0,0,0,0.4)" }}>
                {k.label}
              </p>
              <span className="text-3xl font-black" style={{ color: k.textHex }}>{k.value}</span>
            </div>
          ))}
          {/* Dynamic habits KPI */}
          <div
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#fef9c3", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "rgba(0,0,0,0.4)" }}>
              Habits This Week
            </p>
            <span className="text-3xl font-black" style={{ color: "#713f12" }}>
              {habitReady ? habitTotal : "—"}
            </span>
          </div>
        </div>

        {/* Weekly Habits + Sleep */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section
            className="lg:col-span-2 rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1e3a1e" }}>Weekly Habits Update</h2>
                <p className="text-xs mt-0.5" style={{ color: "#8a9485" }}>
                  Habits completed per day · Dashed line = 7-day trend
                </p>
              </div>
              {habitReady && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#f0fdf4", color: "#166534" }}
                >
                  {habitTotal} total this week
                </span>
              )}
            </div>
            <div className="h-[240px] relative mt-4">
              {!habitReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Loading habit data…</p>
                </div>
              )}
              <canvas ref={setRef("habits")} />
            </div>
          </section>

          <section
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: "#0c2340" }}>Sleep Architecture</h2>
              {sleepReady && sleepAvgHours > 0 && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
                >
                  {sleepAvgHours.toFixed(1)}h avg
                </span>
              )}
            </div>
            <p className="text-xs mb-4" style={{ color: "#8a9485" }}>
              Estimated from logged sleep/wake times &amp; quality
            </p>
            <div className="h-[240px] relative">
              {!sleepReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Loading sleep data…</p>
                </div>
              )}
              <canvas ref={setRef("sleep")} />
            </div>
          </section>
        </div>

        {/* Wellness Check Radar + Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1a3d1a" }}>Wellness Check</h2>
                <p className="text-xs mt-0.5" style={{ color: "#8a9485" }}>
                  Agni &amp; Kosta · Sharirika &amp; Bala · Indriya &amp; Upadhatu · Manasika
                </p>
              </div>
              {doshaReady && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#fef9c3", color: "#713f12" }}
                >
                  Latest assessment
                </span>
              )}
            </div>
            <div className="h-[260px] relative mt-2">
              {!doshaReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Loading wellness data…</p>
                </div>
              )}
              <canvas ref={setRef("dosha")} />
            </div>
          </section>

          <section
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: "#1e3a1e" }}>Overall Health Score Trend</h2>
              {healthScoreReady && healthScoreLatest != null && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
                >
                  Latest: {healthScoreLatest}
                </span>
              )}
            </div>
            <p className="text-xs mb-4" style={{ color: "#8a9485" }}>
              Composite score · Dashed = your average baseline
            </p>
            <div className="h-[220px] relative">
              {!healthScoreReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Loading health score data…</p>
                </div>
              )}
              <canvas ref={setRef("healthscore")} />
            </div>
          </section>
        </div>

        {/* Inflammation + Wellness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#1e3a1e" }}>Inflammatory Load Index</h2>
                <p className="text-xs mt-0.5" style={{ color: "#8a9485" }}>
                  🟢 &lt;35 Normal · 🟠 35–50 Elevated · 🔴 &gt;50 High · 12-week composite
                </p>
              </div>
              {inflameReady && inflameLatest != null && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{
                    backgroundColor:
                      inflameLatest < 35  ? "#f0fdf4"
                      : inflameLatest <= 50 ? "#fff7ed"
                      : "#fef2f2",
                    color:
                      inflameLatest < 35  ? "#166534"
                      : inflameLatest <= 50 ? "#c2410c"
                      : "#dc2626",
                  }}
                >
                  {inflameLatest < 35 ? "🟢" : inflameLatest <= 50 ? "🟠" : "🔴"} {inflameLatest}
                </span>
              )}
            </div>
            <div className="h-[200px] relative mt-2">
              {!inflameReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Calculating inflammatory load…</p>
                </div>
              )}
              <canvas ref={setRef("inflame")} />
            </div>
          </section>

          <section
            className="rounded-[32px] p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold" style={{ color: "#1e3a1e" }}>Longitudinal Wellness Base</h2>
              {wellnessReady && wellnessLatest != null && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ backgroundColor: "#f0fdf4", color: "#166534" }}
                >
                  Latest: {wellnessLatest}
                </span>
              )}
            </div>
            <p className="text-xs mb-4" style={{ color: "#8a9485" }}>
              Last 5 wellness assessments · 0–100 composite score
            </p>
            <div className="h-[200px] relative">
              {!wellnessReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "#8a9485" }}>Loading wellness data…</p>
                </div>
              )}
              <canvas ref={setRef("wellness")} />
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}