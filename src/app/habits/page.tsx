"use client";

import { useEffect, useRef, useState } from 'react';
import Navbar from "../components/navbar"; // Path updated to match your dashboard page
import { Plus, Edit, Trash2 } from 'lucide-react';
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

// Explicitly register all required controllers and components
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

export default function HabitsPage() {
  const [dailies, setDailies] = useState([
    { id: 1, name: 'Tongue scraping', completed: true },
    { id: 2, name: 'Abhyanga oil massage', completed: false },
    { id: 3, name: 'Early rising/Brahma Muhurta', completed: true }
  ]);

  const [habits, setHabits] = useState([
    { id: 1, name: 'Meditation', completed: false },
    { id: 2, name: 'Yoga', completed: true },
    { id: 3, name: 'Drinking warm water in the morning', completed: false },
    { id: 4, name: 'Evening walk', completed: true }
  ]);

  const heatmapGridRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const complianceChartRef = useRef<HTMLCanvasElement>(null);
  const habitsVsDailiesChartRef = useRef<HTMLCanvasElement>(null);

  // Generate GitHub-style horizontal yearly calendar matrix
  useEffect(() => {
    if (!heatmapGridRef.current || !tooltipRef.current) return;

    const heatmapGrid = heatmapGridRef.current;
    const tooltip = tooltipRef.current;

    heatmapGrid.innerHTML = '';

    const year = 2026;

    // Generate random data for each day of the year
    const yearData = [];
    for (let day = 0; day < 365; day++) {
      const date = new Date(year, 0, 1 + day);
      const compliance = Math.floor(Math.random() * 101);
      const totalHabits = Math.floor(Math.random() * 10) + 1;
      const completedHabits = Math.floor(Math.random() * (totalHabits + 1));
      yearData.push({ date, compliance, completedHabits, totalHabits });
    }

    // Find the Monday of the week that contains Jan 1
    const startDate = new Date(year, 0, 1);
    const dayOffset = (startDate.getDay() + 6) % 7; 
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - dayOffset);

    const eventListeners: any[] = [];

    // Column-First matrix: 53 columns, 7 rows
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
            bgClass = 'bg-green-600';
          } else if (data.compliance >= 50) {
            bgClass = 'bg-green-400';
          } else if (data.compliance >= 25) {
            bgClass = 'bg-green-300';
          } else if (data.compliance > 0) {
            bgClass = 'bg-green-100';
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
                <div class="text-xs text-gray-300">${targetData.completed}/${targetData.total} habits done</div>
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

  // Safe types compiled fallback options for generic canvas context charts
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
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    };

    const chart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Overall Compliance %',
          data: complianceData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3
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
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          },
          {
            label: 'Dailies Compliance %',
            data: dailiesData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)'
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

  return (
    <div className="w-full min-h-screen bg-[#f8f9f5] pb-20">
      {/* Navbar Added at layout base layout layer */}
      <Navbar />

      <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 container mx-auto">
        {/* Header Title Banner */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-green-800">Dina AI Dashboard</h1>
          <p className="text-lg text-green-600 mt-2">AI-driven Ayurvedic Dinacharya & Ritucharya Compliance Platform</p>
        </header>

        {/* Dashboard Panels Split Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Dailies Column Card */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-900">Dailies</h2>
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-sm">
                <Plus size={16} />
                <span>Create</span>
              </button>
            </div>
            <div className="space-y-3">
              {dailies.map(item => (
                <div key={item.id} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <span className="flex-1 text-gray-800 font-medium">{item.name}</span>
                  <div className="flex gap-2">
                    <button className="text-green-600 hover:text-green-800" onClick={() => handleModify(item.id, 'daily')}>
                      <Edit size={16} />
                    </button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id, 'daily')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Habits Column Card */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-900">Habits</h2>
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-sm">
                <Plus size={16} />
                <span>Create</span>
              </button>
            </div>
            <div className="space-y-3">
              {habits.map(item => (
                <div key={item.id} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-200 flex justify-between items-center">
                  <span className="flex-1 text-gray-800 font-medium">{item.name}</span>
                  <div className="flex gap-2">
                    <button className="text-green-600 hover:text-green-800" onClick={() => handleModify(item.id, 'habit')}>
                      <Edit size={16} />
                    </button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id, 'habit')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Calendar Matrix Board Component with Exact Matching Track Headers */}
        <section className="mb-12 p-6 bg-white rounded-3xl shadow-sm border border-gray-200 w-full">
          <h2 className="text-xl font-semibold text-green-900 mb-6">Yearly Compliance Calendar</h2>
          
          <div className="w-full flex flex-col">
            <div className="flex items-start gap-4 w-full relative">
              
              {/* Left Row labels padding */}
              <div className="grid grid-rows-7 h-[84px] text-[10px] text-gray-400 select-none font-medium pr-1 gap-[3px] mt-7">
                <span className="row-start-2 flex items-center">Mon</span>
                <span className="row-start-4 flex items-center">Wed</span>
                <span className="row-start-6 flex items-center">Fri</span>
              </div>

              {/* Grid content and Month labels matching layout blocks */}
              <div className="flex-1 min-w-0">
                
                {/* Fixed Column Grid for Header Month layout labels */}
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

                {/* Grid Elements Map Box */}
                <div className="relative">
                  <div 
                    ref={heatmapGridRef}
                    className="w-full grid grid-rows-7 grid-flow-col gap-[3px]"
                    style={{ gridTemplateColumns: 'repeat(53, minmax(0, 1fr))' }}
                  ></div>
                  
                  {/* Tooltip Hover Module */}
                  <div ref={tooltipRef} id="tooltip" className="hidden absolute transition-opacity duration-150"></div>
                </div>

              </div>
            </div>
          </div>

          {/* Color scale footer indexes */}
          <div className="mt-5 flex items-center justify-end gap-2 text-xs text-gray-400 pr-1">
            <span>Less</span>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-gray-100 border border-gray-200"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-green-100"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-green-300"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-green-400"></div>
            <div className="w-[10px] h-[10px] rounded-[2px] bg-green-600"></div>
            <span>More</span>
          </div>
        </section>

        {/* Analytics Display Panel Wrapper */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-green-900 mb-6">Analytics</h2>
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