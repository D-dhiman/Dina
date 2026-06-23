"use client";

import { useEffect, useRef, useState } from 'react';
import Navbar from "../components/navbar";
import { Plus, Edit, Trash2, RotateCcw, CalendarDays, Sparkles, Flame } from 'lucide-react';
import Link from "next/link";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  LineElement
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  BarElement
);

interface TrackedItem {
  id: string;
  name: string;
  status: 'neutral' | 'positive' | 'negative';
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const TODAY = new Date().toISOString().split('T')[0];

export default function HabitsPage() {
  const [dailies, setDailies] = useState<TrackedItem[]>([]);
  const [habits, setHabits] = useState<TrackedItem[]>([]);
  const [dayStreak, setDayStreak] = useState(0);
  const [userName, setUserName] = useState("");
  const [yearData, setYearData] = useState<Record<string, any>>({});

  const heatmapGridRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const complianceChartRef = useRef<HTMLCanvasElement>(null);
  const habitsVsDailiesChartRef = useRef<HTMLCanvasElement>(null);
  const chart1Ref = useRef<Chart | null>(null);
  const chart2Ref = useRef<Chart | null>(null);

  // ── Save completion to backend ──────────────────────────────────────────────
  const saveCompletion = async (
    id: string,
    type: 'habit' | 'daily',
    status: 'positive' | 'negative' | 'neutral'
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { console.warn('[saveCompletion] no token'); return; }

      const endpoint = type === 'habit' ? '/api/habit-completions' : '/api/daily-completions';
      const payload = {
        [`${type}_id`]: id,
        completion_date: TODAY,
        is_completed: status === 'positive' ? true : status === 'negative' ? false : null,
      };

      console.log(`[saveCompletion] POST ${endpoint}`, payload);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`[saveCompletion] ${endpoint} failed ${res.status}:`, data);
      } else {
        console.log(`[saveCompletion] ${endpoint} ok:`, data);
      }
    } catch (err) {
      console.error(`[saveCompletion] ${type} exception:`, err);
    }
  };

  // ── Toggle handler — optimistic UI + backend save ──────────────────────────
  const handleStatusToggle = (
    id: string,
    type: 'daily' | 'habit',
    trigger: 'positive' | 'negative'
  ) => {
    const updateList = (list: TrackedItem[]): TrackedItem[] =>
      list.map(item => {
        if (item.id !== id) return item;
        const newStatus = item.status === trigger ? 'neutral' : trigger;
        // fire-and-forget save
        saveCompletion(id, type, newStatus);
        return { ...item, status: newStatus };
      });

    if (type === 'daily') setDailies(prev => updateList(prev));
    else setHabits(prev => updateList(prev));
  };

  // ── Fetch habits + dailies, then restore today's statuses ─────────────────
  async function fetchTrackedItems() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [habitsRes, dailiesRes, habitCompRes, dailyCompRes] = await Promise.all([
        fetch('/api/habits',            { headers: authHeaders() }),
        fetch('/api/dailies',           { headers: authHeaders() }),
        fetch(`/api/habit-completions?date=${TODAY}`,  { headers: authHeaders() }),
        fetch(`/api/daily-completions?date=${TODAY}`,  { headers: authHeaders() }),
      ]);

      if (!habitsRes.ok || !dailiesRes.ok) {
        console.error('Failed to load data');
        return;
      }

      const habitsData   = await habitsRes.json();
      const dailiesData  = await dailiesRes.json();

      // Build a status map from today's completions: { id -> 'positive' | 'negative' | 'neutral' }
      const habitStatusMap: Record<string, 'positive' | 'negative' | 'neutral'> = {};
      const dailyStatusMap: Record<string, 'positive' | 'negative' | 'neutral'> = {};

      if (habitCompRes.ok) {
        const hc = await habitCompRes.json();
        (hc.completions || []).forEach((c: any) => {
          habitStatusMap[c.habit_id] = c.is_completed === true
            ? 'positive'
            : c.is_completed === false
            ? 'negative'
            : 'neutral';
        });
      }

      if (dailyCompRes.ok) {
        const dc = await dailyCompRes.json();
        console.log('[fetchTrackedItems] daily completions raw:', dc.completions);
        (dc.completions || []).forEach((c: any) => {
          dailyStatusMap[c.daily_id] = c.is_completed === true
            ? 'positive'
            : c.is_completed === false
            ? 'negative'
            : 'neutral';
        });
        console.log('[fetchTrackedItems] dailyStatusMap:', dailyStatusMap);
      } else {
        console.error('[fetchTrackedItems] daily-completions GET failed:', dailyCompRes.status);
      }

      setUserName(habitsData.user?.name?.split(" ")[0] || "");
      setDayStreak(habitsData.user?.day_streak || 0);

      setHabits((habitsData.habits || []).map((item: any) => ({
        id: item.id,
        name: item.habit_name,
        status: habitStatusMap[item.id] ?? 'neutral',
      })));

      setDailies((dailiesData.dailies || []).map((item: any) => ({
        id: item.id,
        name: item.habit_name,
        status: dailyStatusMap[item.id] ?? 'neutral',
      })));

    } catch (err) {
      console.error('Failed to load habits data', err);
    }
  }

  // ── Yearly compliance heatmap data ─────────────────────────────────────────
  const calculateFrontendCompliance = async () => {
    const completedDailies = dailies.filter(d => d.status === 'positive').length;
    const completedHabits  = habits.filter(h => h.status === 'positive').length;
    const totalItems = dailies.length + habits.length;
    const currentTodayCompliance = totalItems > 0
      ? Math.round(((completedDailies + completedHabits) / totalItems) * 100)
      : 0;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/yearly-compliance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data.yearlyRecords) {
        const dataMap: Record<string, any> = {};
        data.yearlyRecords.forEach((record: any) => { dataMap[record.dateStr] = record; });
        dataMap[TODAY] = {
          ...dataMap[TODAY],
          dateStr: TODAY,
          compliance: currentTodayCompliance,
          completedDailies,
          completedHabits,
          totalDailies: dailies.length,
          totalHabits: habits.length,
        };
        setYearData(dataMap);
      }
    } catch (err) {
      console.error('Failed to sync compliance:', err);
    }
  };

  const handleModify = async (id: string, type: 'daily' | 'habit') => {
    const list = type === 'daily' ? dailies : habits;
    const newName = window.prompt('Enter new name', list.find(i => i.id === id)?.name);
    if (!newName?.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/${type === 'daily' ? 'dailies' : 'habits'}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ habit_name: newName }),
      });
      if (!res.ok) return;
      await fetchTrackedItems();
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const handleDelete = async (id: string, type: 'daily' | 'habit') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/${type === 'daily' ? 'dailies' : 'habits'}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      await fetchTrackedItems();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  useEffect(() => { fetchTrackedItems(); }, []);
  useEffect(() => { calculateFrontendCompliance(); }, [dailies, habits]);

  // ── Heatmap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!heatmapGridRef.current || !tooltipRef.current || Object.keys(yearData).length === 0) return;

    const heatmapGrid = heatmapGridRef.current;
    const tooltip     = tooltipRef.current;
    heatmapGrid.innerHTML = '';

    const year      = 2026;
    const startDate = new Date(year, 0, 1);
    const dayOffset = (startDate.getDay() + 6) % 7;
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - dayOffset);

    const eventListeners: any[] = [];

    for (let week = 0; week < 53; week++) {
      for (let weekday = 0; weekday < 7; weekday++) {
        const cell = document.createElement('div');
        cell.className = 'rounded-[2px] transition-colors duration-200 cursor-pointer w-full aspect-square';

        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + week * 7 + weekday);

        if (date.getFullYear() === year) {
          const dateStr = date.toISOString().split('T')[0];
          const data = yearData[dateStr] || {
            compliance: 0, completedDailies: 0, completedHabits: 0,
            totalDailies: dailies.length, totalHabits: habits.length,
          };

          let bgClass = 'bg-gray-200';
          if      (data.compliance >= 75) bgClass = 'bg-[#86CA1A]';
          else if (data.compliance >= 50) bgClass = 'bg-[#C9D43A]';
          else if (data.compliance >= 25) bgClass = 'bg-[#FFCC24]';
          else if (data.compliance >= 10) bgClass = 'bg-[#F49521]';
          else if (data.compliance >  0)  bgClass = 'bg-[#EE6125]';

          cell.className += ` ${bgClass}`;
          cell.dataset.tooltip = JSON.stringify({
            date: date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            compliance: data.compliance,
            completed: data.completedDailies + data.completedHabits,
            total: data.totalDailies + data.totalHabits,
          });

          const handleMouseEnter = (e: MouseEvent) => {
            const d = JSON.parse((e.target as HTMLElement).dataset.tooltip || '{}');
            tooltip.innerHTML =
              `<div class="font-semibold text-xs mb-1">${d.date}</div>` +
              `<div class="text-xs">Compliance: <span class="font-bold">${d.compliance}%</span></div>` +
              `<div class="text-xs text-gray-300">${d.completed}/${d.total} items done</div>`;
            tooltip.className = "absolute z-30 bg-gray-900 text-white text-xs rounded p-2 shadow-md border border-gray-700 pointer-events-none whitespace-nowrap";

            requestAnimationFrame(() => {
              const rect      = (e.target as HTMLElement).getBoundingClientRect();
              const container = heatmapGrid.parentElement?.getBoundingClientRect();
              if (!container) return;
              let left = rect.left - container.left - (tooltip.offsetWidth / 2) + (rect.width / 2);
              let top  = rect.top  - container.top  - tooltip.offsetHeight - 8;
              if (left < 0) left = 4;
              if (left + tooltip.offsetWidth > container.width) left = container.width - tooltip.offsetWidth - 4;
              tooltip.style.left = left + "px";
              tooltip.style.top  = top  + "px";
            });
          };
          const handleMouseLeave = () => { tooltip.className = "hidden"; };

          cell.addEventListener('mouseenter', handleMouseEnter as any);
          cell.addEventListener('mouseleave', handleMouseLeave as any);
          eventListeners.push({ cell, handleMouseEnter, handleMouseLeave });
        } else {
          cell.className += ' bg-transparent pointer-events-none';
        }

        cell.style.gridRowStart    = (weekday + 1).toString();
        cell.style.gridColumnStart = (week    + 1).toString();
        heatmapGrid.appendChild(cell);
      }
    }

    return () => {
      eventListeners.forEach(({ cell, handleMouseEnter, handleMouseLeave }) => {
        cell?.removeEventListener('mouseenter', handleMouseEnter);
        cell?.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [yearData]);

  // ── Charts ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas1 = complianceChartRef.current;
    const canvas2 = habitsVsDailiesChartRef.current;
    if (!canvas1 || !canvas2) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    if (!ctx1 || !ctx2) return;

    if (chart1Ref.current) chart1Ref.current.destroy();
    if (chart2Ref.current) chart2Ref.current.destroy();

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const completedDailies = dailies.filter(d => d.status === 'positive').length;
    const completedHabits  = habits.filter(h => h.status === 'positive').length;
    const currentLiveScore = habits.length + dailies.length > 0
      ? Math.round(((completedDailies + completedHabits) / (habits.length + dailies.length)) * 100)
      : 0;

    const complianceTrend = [65, 70, 72, 68, 74, currentLiveScore, 0, 0, 0, 0, 0, 0];
    const habitStats      = [60, 65, 70, 62, 80, habits.length  > 0 ? Math.round((completedHabits  / habits.length)  * 100) : 0, 0, 0, 0, 0, 0, 0];
    const dailyStats      = [70, 75, 74, 73, 68, dailies.length > 0 ? Math.round((completedDailies / dailies.length) * 100) : 0, 0, 0, 0, 0, 0, 0];

    const baseOpts: any = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 } } },
        tooltip: { padding: 8, cornerRadius: 4 },
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: (v: any) => v + '%' } },
      },
    };

    chart1Ref.current = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{ label: 'Overall Compliance %', data: complianceTrend,
          borderColor: 'rgb(21,128,61)', backgroundColor: 'rgba(21,128,61,0.1)',
          tension: 0.3, borderWidth: 2, pointRadius: 3 }],
      },
      options: baseOpts,
    });

    chart2Ref.current = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Habits Compliance %',  data: habitStats, backgroundColor: 'rgba(59,130,246,0.8)',  borderRadius: 4 },
          { label: 'Dailies Compliance %', data: dailyStats, backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 4 },
        ],
      },
      options: baseOpts,
    });

    return () => {
      chart1Ref.current?.destroy();
      chart2Ref.current?.destroy();
    };
  }, [dailies, habits]);

  const getItemTextClasses = (status: 'neutral' | 'positive' | 'negative') => {
    if (status === 'positive') return 'text-blue-900 transition-colors duration-300';
    if (status === 'negative') return 'text-red-900 transition-colors duration-300';
    return 'text-gray-800 transition-colors duration-300';
  };

  const renderItem = (item: TrackedItem, type: 'daily' | 'habit') => (
    <div
      key={item.id}
      className={`rounded-2xl border transition-all duration-300 flex justify-between items-stretch overflow-hidden select-none min-h-[72px] shadow-sm relative bg-white ${
        item.status === 'positive' ? 'border-blue-300' : item.status === 'negative' ? 'border-red-300' : 'border-gray-100/80'
      }`}
    >
      {/* Background fill overlays */}
      <div className={`absolute top-0 left-0 h-full bg-blue-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'positive' ? 'w-full' : 'w-0'}`} />
      <div className={`absolute top-0 right-0 h-full bg-red-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'negative' ? 'w-full' : 'w-0'}`} />

      {/* Green toggle (left) */}
      <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
        item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-r border-gray-100'
      }`}>
        <button
          onClick={() => handleStatusToggle(item.id, type, 'positive')}
          className="w-3.5 h-10 rounded-full bg-blue-500/90 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        />
      </div>

      {/* Name + actions */}
      <div className={`flex-1 px-5 flex items-center justify-between min-w-0 z-10 relative ${getItemTextClasses(item.status)}`}>
        <span className="font-semibold text-base tracking-tight truncate pr-4">{item.name}</span>
        <div className="flex gap-1.5 flex-shrink-0 bg-black/[0.03] p-1 rounded-xl opacity-40 hover:opacity-100 transition-opacity">
          {item.status !== 'neutral' && (
            <button
              className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all"
              onClick={() => handleStatusToggle(item.id, type, item.status as 'positive' | 'negative')}
              title="Reset status"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleModify(item.id, type)}>
            <Edit size={15} />
          </button>
          <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all text-red-600/80 hover:text-red-600" onClick={() => handleDelete(item.id, type)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Red toggle (right) */}
      <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
        item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-l border-gray-100'
      }`}>
        <button
          onClick={() => handleStatusToggle(item.id, type, 'negative')}
          className="w-3.5 h-10 rounded-full bg-red-500/90 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fcfdfa] pb-20">
      <Navbar />

      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto">
        <header className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
              Good morning, {userName} <span className="inline-block animate-wave [animation-duration:2s] text-4xl pb-2">👋</span>
            </h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">Track • Improve • Thrive</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-sm">
              <Flame size={18} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-amber-800">{dayStreak}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#062e14] border border-[#14532d] flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer select-none">
              {userName.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Dailies Card */}
          <section className="bg-[#A6C7F2] border noise-bg border-sky-100 rounded-[32px] p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="z-10 p-2.5 bg-sky-700 rounded-2xl text-white shadow-md shadow-sky-700/10">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="z-10 text-xl font-bold" style={{ color: "#0c2340" }}>Dailies</h2>
                  <p className="z-10 text-xs font-medium mt-0.5" style={{ color: "#1e3a5f" }}>
                    {dailies.filter(d => d.status === 'positive').length}/{dailies.length} Completed
                  </p>
                </div>
              </div>
              <Link href="/dailies" className="z-10">
                <button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition-all shadow-sm">
                  <Plus size={16} /><span>Add Daily</span>
                </button>
              </Link>
            </div>
            <div className="space-y-4">{dailies.map(item => renderItem(item, 'daily'))}</div>
          </section>

          {/* Habits Card */}
          <section className="bg-[#AED27D] noise-bg border border-sky-100 rounded-[32px] p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-700 rounded-2xl text-white shadow-md shadow-emerald-700/10 z-10">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold z-10" style={{ color: "#1a3d1a" }}>Habits</h2>
                  <p className="text-xs font-medium mt-0.5 z-10" style={{ color: "#2d5a2d" }}>
                    {habits.filter(h => h.status === 'positive').length}/{habits.length} Tracked Today
                  </p>
                </div>
              </div>
              <Link href="/habitadd" className="z-10">
                <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition-all shadow-sm">
                  <Plus size={16} /><span>Add Habit</span>
                </button>
              </Link>
            </div>
            <div className="space-y-4">{habits.map(item => renderItem(item, 'habit'))}</div>
          </section>
        </div>

        {/* Consistency Grid */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm mb-12 relative">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CalendarDays size={18} className="text-gray-500" /> Consistency Grid
          </h3>
          <div className="w-full overflow-x-auto pb-2 select-none">
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex gap-2 items-start relative">
                <div className="flex flex-col justify-between text-[10px] font-medium text-gray-400 h-[104px] pt-1 w-6 text-right pr-1 shrink-0">
                  <span>Mon</span><span>Wed</span><span>Fri</span>
                </div>
                <div className="relative flex-1 min-w-0">
                  <div
                    ref={heatmapGridRef}
                    className="grid grid-rows-7 grid-flow-col gap-[3px] w-full"
                    style={{ gridTemplateColumns: 'repeat(53, 1fr)' }}
                  />
                  <div ref={tooltipRef} className="hidden" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm h-[320px]">
            <canvas ref={complianceChartRef} />
          </section>
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 lg:p-8 shadow-sm h-[320px]">
            <canvas ref={habitsVsDailiesChartRef} />
          </section>
        </div>
      </main>
    </div>
  );
}