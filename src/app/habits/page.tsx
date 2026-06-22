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
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export default function HabitsPage() {
  const [dailies, setDailies] = useState<TrackedItem[]>([]);
  const [habits, setHabits] = useState<TrackedItem[]>([]);

  const heatmapGridRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const complianceChartRef = useRef<HTMLCanvasElement>(null);
  const habitsVsDailiesChartRef = useRef<HTMLCanvasElement>(null);

  const handleStatusToggle = (id: string, type: 'daily' | 'habit', trigger: 'positive' | 'negative') => {
    const updateList = (list: TrackedItem[]): TrackedItem[] =>
      list.map(item => {
        if (item.id === id) {
          return { ...item, status: item.status === trigger ? 'neutral' : trigger } as TrackedItem;
        }
        return item;
      });

    if (type === 'daily') {
      setDailies(updateList(dailies));
    } else {
      setHabits(updateList(habits));
    }
  };

  const handleModify = async (id: string, type: 'daily' | 'habit') => {
    const newName = window.prompt('Enter new name', type === 'daily'
      ? dailies.find(item => item.id === id)?.name
      : habits.find(item => item.id === id)?.name);

    if (!newName || !newName.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to modify items.');
      return;
    }

    console.log('Modify request', { id, type, newName });

    try {
      const res = await fetch(`/api/${type === 'daily' ? 'dailies' : 'habits'}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ habit_name: newName }),
      });

      const payloadText = await res.text();
      let payload = payloadText;
      try {
        const json = JSON.parse(payloadText);
        payload = json.error || payloadText;
      } catch {
        payload = payloadText;
      }

      if (!res.ok) {
        console.error('Failed to update item', { id, type, payload });
        alert(`Update failed: ${payload}`);
        return;
      }

      await fetchTrackedItems();
    } catch (err) {
      console.error('Failed to update item', err);
      alert('Update failed. Check console for details.');
    }
  };

  const handleDelete = async (id: string, type: 'daily' | 'habit') => {
    const endpoint = type === 'daily' ? '/api/dailies' : '/api/habits';
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to delete items.');
      return;
    }

    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await res.text();
      if (!res.ok) {
        console.error('Failed to delete item', payload);
        alert(`Delete failed: ${payload}`);
        return;
      }

      await fetchTrackedItems();
    } catch (err) {
      console.error('Failed to delete item', err);
      alert('Delete failed. Check console for details.');
    }
  };

  async function fetchTrackedItems() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [habitsRes, dailiesRes] = await Promise.all([
        fetch('/api/habits', { headers: authHeaders() }),
        fetch('/api/dailies', { headers: authHeaders() }),
      ]);

      if (!habitsRes.ok || !dailiesRes.ok) {
        console.error('Failed to load data');
        return;
      }

      const habitsData = await habitsRes.json();
      const dailiesData = await dailiesRes.json();

      setHabits((habitsData.habits || []).map((item: any) => ({
        id: item.id,
        name: item.habit_name,
        status: 'neutral'
      })));

      setDailies((dailiesData.dailies || []).map((item: any) => ({
        id: item.id,
        name: item.habit_name,
        status: 'neutral'
      })));

    } catch (err) {
      console.error('Failed to load habits data', err);
    }
  }

  useEffect(() => {
    fetchTrackedItems();
    const intervalId = window.setInterval(fetchTrackedItems, 15000);
    window.addEventListener('focus', fetchTrackedItems);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', fetchTrackedItems);
    };
  }, []);

  useEffect(() => {
    if (!heatmapGridRef.current || !tooltipRef.current) return;

    const heatmapGrid = heatmapGridRef.current;
    const tooltip = tooltipRef.current;

    heatmapGrid.innerHTML = '';
    const year = 2026;

    const yearData = [];
    for (let day = 0; day < 365; day++) {
      const date = new Date(year, 0, 1 + day);
      const compliance = Math.floor(Math.random() * 101);
      const totalHabits = Math.floor(Math.random() * 10) + 1;
      const completedHabits = Math.floor(Math.random() * (totalHabits + 1));
      yearData.push({ date, compliance, completedHabits, totalHabits });
    }

    const startDate = new Date(year, 0, 1);
    const dayOffset = (startDate.getDay() + 6) % 7; 
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - dayOffset);

    const eventListeners: any[] = [];

    for (let week = 0; week < 53; week++) {
      for (let weekday = 0; weekday < 7; weekday++) {
        const cell = document.createElement('div');
        cell.className = 'w-full aspect-square rounded-[2px] transition-colors duration-200 cursor-pointer';

        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + week * 7 + weekday);

        if (date.getFullYear() === year) {
          const timeDiff = date.getTime() - new Date(year, 0, 1).getTime();
          const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const data = yearData[dayIndex];

          if (!data) continue;

          let bgClass = 'bg-gray-100 dark:bg-gray-800';
          if (data.compliance >= 75) {
            bgClass = 'bg-[#86CA1A]';
          } else if (data.compliance >= 50) {
            bgClass = 'bg-[#C9D43A]';
          } else if (data.compliance >= 25) {
            bgClass = 'bg-[#FFCC24]';
          } else if (data.compliance >= 10) {
            bgClass = 'bg-[#F49521]';
          } else if (data.compliance > 0) {
            bgClass = 'bg-[#EE6125]';
          } else{
            bgClass = 'bg-[#D01E18]';
          }
          cell.className += ` ${bgClass}`;

          cell.dataset.tooltip = JSON.stringify({
            date: date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            compliance: data.compliance,
            completed: data.completedHabits,
            total: data.totalHabits
          });

          const handleMouseEnter = (e: MouseEvent) => {
            const targetData = JSON.parse((e.target as HTMLElement).dataset.tooltip || '{}');
            tooltip.innerHTML = `
                <div class="font-semibold text-xs mb-1">${targetData.date}</div>
                <div class="text-xs">Compliance: <span class="font-bold">${targetData.compliance}%</span></div>
                <div class="text-xs text-gray-300">${targetData.completed}/${targetData.total} items done</div>
            `;
            tooltip.classList.remove('hidden');
            tooltip.className = "absolute z-30 bg-gray-900 text-white text-xs rounded p-2 shadow-md border border-gray-700 pointer-events-none whitespace-nowrap";
            
            requestAnimationFrame(() => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const container = heatmapGrid.parentElement?.getBoundingClientRect();
                
                if (!container) return;
                
                let left = rect.left - container.left - (tooltip.offsetWidth / 2) + (rect.width / 2);
                let top = rect.top - container.top - tooltip.offsetHeight - 8;

                if (left < 0) left = 4;
                if (left + tooltip.offsetWidth > container.width) {
                  left = container.width - tooltip.offsetWidth - 4;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });
          };

          const handleMouseLeave = () => {
            tooltip.classList.add('hidden');
          };

          cell.addEventListener('mouseenter', handleMouseEnter as any);
          cell.addEventListener('mouseleave', handleMouseLeave as any);
          eventListeners.push({ cell, handleMouseEnter, handleMouseLeave });
        } else {
          cell.className += ' bg-transparent pointer-events-none';
        }

        cell.style.gridRowStart = `${weekday + 1}`;
        cell.style.gridColumnStart = `${week + 1}`;
        heatmapGrid.appendChild(cell);
      }
    }

    return () => {
      eventListeners.forEach(({ cell, handleMouseEnter, handleMouseLeave }) => {
        if (cell) {
          cell.removeEventListener('mouseenter', handleMouseEnter);
          cell.removeEventListener('mouseleave', handleMouseLeave);
        }
      });
    };
  }, []);

  useEffect(() => {
    const canvas1 = complianceChartRef.current;
    const canvas2 = habitsVsDailiesChartRef.current;

    if (!canvas1 || !canvas2) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');

    if (!ctx1 || !ctx2) return;

    const months = [];
    const complianceData = [];
    const habitsData = [];
    const dailiesData = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleString('default', { month: 'short' }));
      complianceData.push(Math.floor(Math.random() * 30) + 50);
      habitsData.push(Math.floor(Math.random() * 25) + 60);
      dailiesData.push(Math.floor(Math.random() * 30) + 40);
    }

    const safeConfigOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 12 } } },
        tooltip: { padding: 8, cornerRadius: 4 }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          max: 100,
          ticks: { callback: function(value: any) { return value + '%'; } }
        }
      }
    };

    const chart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Overall Compliance %',
          data: complianceData,
          borderColor: 'rgb(21, 128, 61)',
          backgroundColor: 'rgba(21, 128, 61, 0.1)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: safeConfigOptions
    });

    const chart2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Habits Compliance %',
            data: habitsData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 4
          },
          {
            label: 'Dailies Compliance %',
            data: dailiesData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          }
        ]
      },
      options: safeConfigOptions
    });

    return () => {
      chart1.destroy();
      chart2.destroy();
    };
  }, []);

  const getItemTextClasses = (status: 'neutral' | 'positive' | 'negative') => {
    if (status === 'positive') return 'text-blue-900 transition-colors duration-300';
    if (status === 'negative') return 'text-red-900 transition-colors duration-300';
    return 'text-gray-800 transition-colors duration-300';
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfdfa] pb-20">
      <Navbar />

      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto">
        
        {/* Profile and Streak Heading Header from image_347ba8.png */}
        <header className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
              Good morning <span className="inline-block animate-wave [animation-duration:2s] text-4xl pb-2">👋</span>
            </h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">
              Track • Improve • Thrive
            </p>
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

        {/* Segmented Trackers View Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Dailies Master Showcase Card Box */}
          <section className="bg-[#A6C7F2] border noise-bg border-sky-100 rounded-[32px] p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-sky-100">
              <div className=" flex items-center gap-3">
                <div className="z-10 p-2.5 bg-sky-700 rounded-2xl text-white shadow-md shadow-sky-700/10">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="z-10 text-xl font-bold text-sky-1000">Dailies</h2>
                  <p className="z-10 text-xs text-sky-900 font-medium mt-0.5">
                    {dailies.filter(d => d.status !== 'neutral').length}/{dailies.length} Completed
                  </p>
                </div>
              </div>
              <Link href="/dailies" className="z-10">
                <button className="bg-sky-700 hover:bg-sky-800 text-white font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition-all shadow-sm shadow-sky-700/10 hover:shadow-md active:scale-95">
                  <Plus size={16} />
                  <span>Add Daily</span>
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              {dailies.map(item => (
                <div 
                  key={item.id} 
                  className={`rounded-2xl border transition-all duration-300 flex justify-between items-stretch overflow-hidden select-none min-h-[72px] shadow-sm relative bg-white ${
                    item.status === 'positive' ? 'border-blue-300' : item.status === 'negative' ? 'border-red-300' : 'border-gray-100/80'
                  }`}
                >
                  <div className={`absolute top-0 left-0 h-full bg-blue-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'positive' ? 'w-full' : 'w-0'}`} />
                  <div className={`absolute top-0 right-0 h-full bg-red-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'negative' ? 'w-full' : 'w-0'}`} />

                  <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                    item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-r border-gray-100'
                  }`}>
                    <button 
                      onClick={() => handleStatusToggle(item.id, 'daily', 'positive')}
                      className="w-3.5 h-10 rounded-full bg-blue-500/90 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    />
                  </div>
                  
                  <div className={`flex-1 px-5 flex items-center justify-between min-w-0 z-10 relative ${getItemTextClasses(item.status)}`}>
                    <span className="font-semibold text-base tracking-tight truncate pr-4">{item.name}</span>
                    <div className="flex gap-1.5 flex-shrink-0 bg-black/[0.03] p-1 rounded-xl opacity-40 hover:opacity-100 transition-opacity">
                      {item.status !== 'neutral' && (
                        <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleStatusToggle(item.id, 'daily', item.status as 'positive' | 'negative')} title="Reset status">
                          <RotateCcw size={15} />
                        </button>
                      )}
                      <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleModify(item.id, 'daily')}>
                        <Edit size={15} />
                      </button>
                      <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all text-red-600/80 hover:text-red-600" onClick={() => handleDelete(item.id, 'daily')}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                    item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-l border-gray-100'
                  }`}>
                    <button 
                      onClick={() => handleStatusToggle(item.id, 'daily', 'negative')}
                      className="w-3.5 h-10 rounded-full bg-red-500/90 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Habits Master Showcase Card Box */}
          <section className="bg-[#AED27D] noise-bg border border-sky-100 rounded-[32px] p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-700 rounded-2xl text-white shadow-md shadow-emerald-700/10 z-10">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-950 z-10">Habits</h2>
                  <p className="text-xs text-emerald-930 font-medium mt-0.5 z-10">
                    {habits.filter(h => h.status !== 'neutral').length}/{habits.length} Tracked Today
                  </p>
                </div>
              </div>
              <div className="flex gap-2 z-10">
                <Link href="/habitadd">
                  <button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 text-sm transition-all shadow-sm shadow-emerald-700/10 hover:shadow-md active:scale-95">
                    <Plus size={16} />
                    <span>Add Habit</span>
                  </button>
                </Link>
              </div>
            </div>


            <div className="space-y-4">
              {habits.map(item => (
                <div 
                  key={item.id} 
                  className={`rounded-2xl border transition-all duration-300 flex justify-between items-stretch overflow-hidden select-none min-h-[72px] shadow-sm relative bg-white ${
                    item.status === 'positive' ? 'border-blue-300' : item.status === 'negative' ? 'border-red-300' : 'border-gray-100/80'
                  }`}
                >
                  <div className={`absolute top-0 left-0 h-full bg-blue-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'positive' ? 'w-full' : 'w-0'}`} />
                  <div className={`absolute top-0 right-0 h-full bg-red-100/95 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'negative' ? 'w-full' : 'w-0'}`} />

                  <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                    item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-r border-gray-100'
                  }`}>
                    <button 
                      onClick={() => handleStatusToggle(item.id, 'habit', 'positive')}
                      className="w-3.5 h-10 rounded-full bg-blue-500/90 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    />
                  </div>
                  
                  <div className={`flex-1 px-5 flex items-center justify-between min-w-0 z-10 relative ${getItemTextClasses(item.status)}`}>
                    <span className="font-semibold text-base tracking-tight truncate pr-4">{item.name}</span>
                    <div className="flex gap-1.5 flex-shrink-0 bg-black/[0.03] p-1 rounded-xl opacity-40 hover:opacity-100 transition-opacity">
                      {item.status !== 'neutral' && (
                        <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleStatusToggle(item.id, 'habit', item.status as 'positive' | 'negative')} title="Reset status">
                          <RotateCcw size={15} />
                        </button>
                      )}
                      <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleModify(item.id, 'habit')}>
                        <Edit size={15} />
                      </button>
                      <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all text-red-600/80 hover:text-red-600" onClick={() => handleDelete(item.id, 'habit')}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                    item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-l border-gray-100'
                  }`}>
                    <button 
                      onClick={() => handleStatusToggle(item.id, 'habit', 'negative')}
                      className="w-3.5 h-10 rounded-full bg-red-500/90 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Heatmap Grid Row View */}
        <section className="mb-12 p-6 bg-white rounded-3xl shadow-sm border border-gray-200 w-full">
          <h2 className="text-xl font-bold text-green-950 mb-6">Yearly Compliance Calendar</h2>
          
          <div className="w-full flex flex-col">
            <div className="flex items-start gap-4 w-full relative">
              <div className="grid grid-rows-7 h-[84px] text-[10px] text-gray-400 select-none font-medium pr-1 gap-[3px] mt-7">
                <span className="row-start-2 flex items-center">Mon</span>
                <span className="row-start-4 flex items-center">Wed</span>
                <span className="row-start-6 flex items-center">Fri</span>
              </div>

              <div className="flex-1 min-w-0">
                <div 
                  className="w-full grid grid-flow-col text-xs font-medium text-gray-400 select-none pb-2"
                  style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))' }}
                >
                  <span className="col-span-4 text-left">Jan</span>
                  <span className="col-span-4 text-left">Feb</span>
                  <span className="col-span-4 text-left">Mar</span>
                  <span className="col-span-5 text-left">Apr</span>
                  <span className="col-span-4 text-left">May</span>
                  <span className="col-span-4 text-left">Jun</span>
                  <span className="col-span-4 text-left">Jul</span>
                  <span className="col-span-5 text-left">Aug</span>
                  <span className="col-span-4 text-left">Sep</span>
                  <span className="col-span-4 text-left">Oct</span>
                  <span className="col-span-4 text-left">Nov</span>
                  <span className="col-span-5 text-left">Dec</span>
                </div>

                <div className="relative">
                  <div 
                    ref={heatmapGridRef}
                    className="w-full grid grid-rows-7 grid-flow-col gap-[3px]"
                    style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))' }}
                  ></div>
                  <div ref={tooltipRef} id="tooltip" className="hidden absolute transition-opacity duration-150"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 text-xs text-gray-400 pr-1">
            <span>Less</span>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#D01E18]"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#EE6125]"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#F49521]"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#FFCC24]"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#C9D43A]"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-[#86CA1A]"></div>
            <span>More</span>
          </div>
        </section>

        {/* Analytics Section Row Layouts */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-green-950 mb-6">Analytics Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Compliance Trend (Last 12 Months)</h3>
              <div className="h-[220px]">
                <canvas ref={complianceChartRef}></canvas>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Habits vs Dailies Comparison</h3>
              <div className="h-[220px]">
                <canvas ref={habitsVsDailiesChartRef}></canvas>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}