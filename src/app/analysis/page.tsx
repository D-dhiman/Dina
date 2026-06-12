"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  registerables,
} from "chart.js";
import Navbar from "../components/navbar";

Chart.register(...registerables);

const healthLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const habitLabels = ["Meditation", "Exercise", "Reading", "Hydration", "Sleep"];

const healthData: ChartData<"line"> = {
  labels: healthLabels,
  datasets: [
    {
      label: "Sleep (hours)",
      data: [7, 6.5, 8, 7.5, 7, 8, 7.2],
      borderColor: "#22c55e",
      backgroundColor: "rgba(34, 197, 94, 0.2)",
      fill: true,
      tension: 0.35,
      pointRadius: 4,
    },
    {
      label: "Water (L)",
      data: [1.8, 2.0, 2.2, 1.9, 2.1, 2.3, 2.0],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      fill: true,
      tension: 0.35,
      pointRadius: 4,
    },
  ],
};

const habitData: ChartData<"bar"> = {
  labels: habitLabels,
  datasets: [
    {
      label: "Completion %",
      data: [90, 80, 75, 95, 88],
      backgroundColor: [
        "#38bdf8",
        "#f97316",
        "#8b5cf6",
        "#22c55e",
        "#f43f5e",
      ],
      borderRadius: 12,
      maxBarThickness: 48,
    },
  ],
};

const lineOptions: ChartOptions<"line"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#334155",
      },
    },
    tooltip: {
      mode: "index",
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#475569",
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#475569",
      },
    },
  },
};

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.parsed.y}%`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#475569",
      },
    },
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        color: "#475569",
      },
    },
  },
};

export default function AnalysisPage() {
  const healthRef = useRef<HTMLCanvasElement | null>(null);
  const habitRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let healthChart: Chart<"line"> | null = null;
    let habitChart: Chart<"bar"> | null = null;

    if (healthRef.current) {
      healthChart = new Chart(healthRef.current, {
        type: "line",
        data: healthData,
        options: lineOptions,
      });
    }

    if (habitRef.current) {
      habitChart = new Chart(habitRef.current, {
        type: "bar",
        data: habitData,
        options: barOptions,
      });
    }

    return () => {
      healthChart?.destroy();
      habitChart?.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9f5] pb-24">
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 sm:px-10">
            <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Visualize your health progress and habit performance with weekly trends and completion analytics.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-600">Health Trends</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Sleep and Hydration</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs text-slate-700">
                Weekly view
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Average sleep</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">7.3h</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Average water</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">2.0L</p>
                </div>
              </div>
              <div className="rounded-[2rem] bg-slate-950/5 p-4">
                <canvas ref={healthRef} className="h-80 w-full" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Habit Tracking</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Weekly completion</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-xs text-slate-700">
                Progress report
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Best habit</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">Hydration</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Average completion</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">86% </p>
                </div>
              </div>
              <div className="rounded-[2rem] bg-slate-950/5 p-4">
                <canvas ref={habitRef} className="h-72 w-full" />
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Insights</h2>
          <p className="mt-3 text-sm text-slate-600">
            Your sleep and water intake are tracking consistently, and habit completion is strong. Focus on improving exercise and reading consistency to keep your weekly progress rising.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">On-track habits</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">3 / 5</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Best performance</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">95% hydration</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Goal signal</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Keep building streaks</p>
            </div>
          </div>
        </section>
      </div>
    </main>
    <Navbar />
    </div>
  );
}
