"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../components/navbar";
import JournalLog from "../components/journalLog";
import {Flame, ChevronDown, CheckCheckIcon} from 'lucide-react';
import { useRouter } from "next/navigation";

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
import HealthCarousel from "../components/HealthCarousel";

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
    color: "bg-[#FFFFFF] text-black-700",
    bgColor: "#8fa96b",
    borderColor: "transparent",
    shape:"triangle",
  },
  {
    title: "Dailies",
    description: "Your recurring daily tasks and check-ins",
    pill: "2 pending",
    color: "bg-[#FFFFFF] text-black-700",
    bgColor: "#8fa8c8",
    borderColor: "transparent",
    shape:"star",
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
    <div className="mt-8 w-full rounded-3xl p-6 text-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/weeklyplanerbg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
        {/* Dark overlay over img */}
      <div className="absolute inset-0 bg-black/10 rounded-3xl z-0" /> 
      <div className="flex items-center justify-between gap-4 pb-4">
        <div>
          <p className="text-md text-slate-300">Weekly planner</p>
          <p className="text-xl font-semibold text-white">Your health agenda</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {weekDays.map((day) => {
          const isSelected = day.label === selectedDay;
          return (
            <button
              key={day.label}
              onClick={() => setSelectedDay(day.label)}
              style={{
                backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.48)' : 'rgba(0, 0, 0, 0.42)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              className={`relative flex-shrink-0 rounded-3xl p-4 h-48 text-left transition-all duration-300 ease-out ${isSelected ? 'flex-[1.4] shadow-2xl' : 'flex-1 min-w-[88px]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-white/90">
                  {day.label}
                </span>
                <span className={`rounded-2xl px-2 py-1 text-sm font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/90'}`}>
                  {day.day}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {day.events.length > 0 ? (
                  day.events.map((event) => (
                    <span key={event.label} className={`h-2.5 w-2.5 rounded-full ${event.color}`} />
                  ))
                ) : (
                  <span className="text-[11px] text-white/70">No plans</span>
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
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const router = useRouter();

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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 bg-[#f8f9f5] pb-20">
      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
                Good morning 
              </h1>
              <p className="text-sm text-[#8a9485] font-medium mt-1">
                Here's your overview for today
              </p>
            </div>
            <span className="inline-block animate-wave [animation-duration:2s] text-4xl pb-2">👋</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-800">7</span>
            </div>
            
            {/* User Profile Circle Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#062e14] border border-[#14532d] flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer select-none">
              U
            </div>
          </div>
        </header>

        <WeeklyPlanner />

        <div onClick={() => router.push("/habits")} className="mt-8 flex flex-col items-left justify-center gap-4 sm:flex-row cursor-pointer">
          {sections.map((s) => (
            <div
              key={s.title}
              style={{
                backgroundColor: s.bgColor,
                borderColor: s.borderColor,
              }}
              className="w-full sm:w-1/2 border-1 rounded-3xl p-6 text-left relative overflow-hidden"
            >
              {s.shape === "triangle" && (
                <div
                  className="absolute -bottom-14 right-[-6px] w-40 h-40 opacity-40 rotate-[-15deg] "
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "90px solid transparent",
                    borderRight: "90px solid transparent",
                    borderTop: "150px solid rgba(0,0,0,0.25)",
                  }}
                />
              )}
              {s.shape === "star" && (() => {
                const cx = 50, cy = 50, points = 10;
                const angle = Math.PI / points;
                const pts = Array.from({ length: points * 2 }, (_, i) => {
                  const r = i % 2 === 0 ? 50 : 28;  // outer=50, inner=28 (higher = more filled)
                  const a = i * angle - Math.PI / 2;
                  return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
                }).join(" ");

                return (
                  <svg
                    className="absolute -bottom-[-12px] -right-7 opacity-30 rotate-45"
                    width="180" height="180" viewBox="0 0 100 100"
                  >
                    <polygon points={pts} fill=" rgba(0, 0, 0, 0.42)" />
                  </svg>
                );
              })()}
              <h2 className="font-semibold text-gray-900 text-lg mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-gray-700 mb-4">{s.description}</p>
              <span className={`text-xs px-3 py-2 border border-gray-300 rounded-full ${s.color}`}>
                {s.pill}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 w-full h-full grid grid-cols-[3fr_1fr] gap-3">
          <div className="bg-gray-60 rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#1D4258] mb-3">Medication Schedule</h2>
            <p className="text-md font-semibold text-[#25668E] mb-4">Morning Dose</p>
            <ul className="space-y-2 text-sm font-medium">
              <li className="flex items-center justify-between">
                <div className="flex items-left gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-650">Medicine 1</span>
                </div>
                <span className="text-sm text-gray-500">8:00 AM</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-left gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-650">Medicine 2</span>
                </div>
                <span className="text-sm text-gray-500">2:00 PM</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-left gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-gray-650">Medicine 3</span>
                </div>
                <span className="text-sm text-gray-500">8:00 PM</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-400 shadow-sm flex flex-col items-center justify-center">
           <HealthCarousel />
          </div>
        </div>

        <div className="mt-4 w-full rounded-3xl relative overflow-hidden scroll-vertical noise-bg"
            style={{ background: "linear-gradient(135deg, #39210b 0%, #5c2c07 30%, #8e450d 100%)" }}
          >
          {/* visible container*/}
          <div
            className="p-6 flex items-center justify-between group cursor-pointer"
            onClick={() => setIsJournalOpen(!isJournalOpen)}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
                animation: "sheen 0.6s ease forwards",
              }}
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-1">Daily check-in</p>
              <h2 className="text-lg font-semibold text-white">Log today's activity</h2>
              <p className="text-sm text-white/80 mt-1">How were your activities today?</p>
            </div>
            <ChevronDown
              size={40}
              className={`text-white transition-transform duration-300 flex-shrink-0 ${isJournalOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Collapsible journal */}
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
            isJournalOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-3 pb-3">
              <JournalLog />
            </div>
          </div>
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