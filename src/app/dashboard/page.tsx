"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../components/navbar";
import JournalLog from "../components/journalLog";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

const sections = [
  {
    title: "Habits",
    description: "Build and maintain your daily habits",
    pill: "3 / 5 done",
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Dailies",
    description: "Your recurring daily tasks and check-ins",
    pill: "2 pending",
    color: "bg-amber-50 text-amber-700",
  },
];

const weekDays = [
  {
    label: "Mon",
    day: "11",
    events: [
      { label: "Doctor visit", color: "bg-rose-400" },
      { label: "Meditation", color: "bg-indigo-400" },
    ],
  },
  {
    label: "Tue",
    day: "12",
    events: [
      { label: "Therapy call", color: "bg-emerald-400" },
    ],
  },
  {
    label: "Wed",
    day: "13",
    events: [
      { label: "Gym session", color: "bg-sky-400" },
      { label: "Supplements", color: "bg-orange-400" },
    ],
  },
  {
    label: "Thu",
    day: "14",
    events: [],
  },
  {
    label: "Fri",
    day: "15",
    events: [
      { label: "Nutrition review", color: "bg-fuchsia-400" },
    ],
  },
  {
    label: "Sat",
    day: "16",
    events: [],
  },
  {
    label: "Sun",
    day: "17",
    events: [
      { label: "Rest day", color: "bg-lime-400" },
    ],
  },
];

function WeeklyPlanner() {
  const [selectedDay, setSelectedDay] = useState("Tue");

  return (
    <div className="mt-8 w-full rounded-3xl bg-slate-900 p-6 text-white">
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <p className="text-sm text-slate-300">Weekly planner</p>
          <p className="text-lg font-semibold text-white">Your health agenda</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {weekDays.map((day) => {
          const isSelected = day.label === selectedDay;
          return (
            <button
              key={day.label}
              onClick={() => setSelectedDay(day.label)}
              className={`relative flex-shrink-0 rounded-3xl p-4 h-48 text-left transition-all duration-300 ease-out ${
                isSelected
                  ? "flex-[1.4] bg-emerald-500 shadow-2xl"
                  : "flex-1 min-w-[88px] bg-slate-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  {day.label}
                </span>
                <span className={`rounded-2xl px-2 py-1 text-sm font-semibold ${isSelected ? "bg-white/20 text-white" : "bg-slate-700 text-slate-200"}`}>
                  {day.day}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {day.events.length > 0 ? (
                  day.events.map((event) => (
                    <span key={event.label} className={`h-2.5 w-2.5 rounded-full ${event.color}`} />
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">No plans</span>
                )}
              </div>

              {isSelected && day.events.length > 0 && (
                <div className="mt-4 space-y-2">
                  {day.events.map((event) => (
                    <div key={event.label} className="flex items-center gap-3 rounded-3xl bg-white/10 px-3 py-2 text-sm text-white">
                      <span className={`h-2.5 w-2.5 rounded-full ${event.color}`} />
                      <span>{event.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const habitContinuityChartRef = useRef<HTMLCanvasElement>(null);
  const healthOverviewChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const habitChartCanvas = habitContinuityChartRef.current;
    const healthChartCanvas = healthOverviewChartRef.current;

    if (!habitChartCanvas || !healthChartCanvas) return;

    const habitCtx = habitChartCanvas.getContext("2d");
    const healthCtx = healthChartCanvas.getContext("2d");
    if (!habitCtx || !healthCtx) return;

    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const continuityData = [3, 4, 5, 4, 6, 7, 8];
    const healthData = [78, 84, 82, 88, 90, 87, 92];

    const habitChart = new Chart(habitCtx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Habit continuity",
            data: continuityData,
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            fill: true,
            tension: 0.35,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { intersect: false, mode: "index" },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 10,
            ticks: { stepSize: 2 },
          },
        },
      },
    });

    const healthChart = new Chart(healthCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Overall health score",
            data: healthData,
            backgroundColor: "rgba(59, 130, 246, 0.8)",
            borderRadius: 12,
            barPercentage: 0.65,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { intersect: false, mode: "index" },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: { stepSize: 20 },
          },
        },
      },
    });

    return () => {
      habitChart.destroy();
      healthChart.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9f5] pb-20">
      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full p-6 ">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-2xl font-bold text-[#284C24] mb-2">
                Good morning 👋
              </h1>
              <p className="text-sm sm:text-sm text-[#855A1D]/80">
                Here's your overview for today
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <div className="px-3 py-2 text-md font-medium text-amber-700 flex items-center gap-1">
                <span className="text-xl">🔥</span>
                <span>7</span>
              </div>
              <div className="rounded-full bg-[var(--dina-green)] w-11 h-11 flex items-center justify-center text-white font-semibold text-md">
                U
              </div>
            </div>
          </div>
        </div>

        <WeeklyPlanner />

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {sections.map((s) => (
            <div
              key={s.title}
              className="w-full sm:w-1/2 bg-white border border-gray-200 rounded-3xl p-6 text-center"
            >
              <h2 className="font-semibold text-gray-900 text-lg mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{s.description}</p>
              <span className={`text-xs px-3 py-2 rounded-full ${s.color}`}>
                {s.pill}
              </span>
            </div>
          ))}
        </div>

        <div className ="mt-8 w-full rounded-3xl bg-[#80C963] p-3 text-white">
          <JournalLog />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Habit continuity</p>
                <h2 className="text-xl font-semibold text-slate-900">Weekly streak</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">8 days</span>
            </div>
            <div className="h-72">
              <canvas ref={habitContinuityChartRef}></canvas>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Overall health</p>
                <h2 className="text-xl font-semibold text-slate-900">Health score trend</h2>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800">Avg 86%</span>
            </div>
            <div className="h-72">
              <canvas ref={healthOverviewChartRef}></canvas>
            </div>
          </section>
        </div>

      </main>
      <Navbar />
    </div>
  );
}