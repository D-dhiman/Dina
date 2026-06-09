"use client";

import { useEffect, useRef, useState } from 'react';
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
  LineElement,
  ChartOptions
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

  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const complianceChartRef = useRef<HTMLCanvasElement>(null);
  const habitsVsDailiesChartRef = useRef<HTMLCanvasElement>(null);

  // Generate yearly calendar
  useEffect(() => {
    if (!heatmapContainerRef.current) return;

    const heatmapContainer = heatmapContainerRef.current;
    const monthLabels = heatmapContainer.querySelector('#month-labels') as HTMLElement;
    const heatmapGrid = heatmapContainer.querySelector('#heatmap-grid') as HTMLElement;
    const tooltip = tooltipRef.current;

    if (!monthLabels || !heatmapGrid || !tooltip) return;

    // Clear existing content
    monthLabels.innerHTML = '';
    heatmapGrid.innerHTML = '';

    const year = 2026;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Generate random data for each day of the year
    const yearData = [];
    for (let day = 0; day < 365; day++) {
      const date = new Date(year, 0, 1 + day);
      const compliance = Math.floor(Math.random() * 101); // 0-100
      const totalHabits = Math.floor(Math.random() * 10) + 1; // 1-10
      const completedHabits = Math.floor(Math.random() * (totalHabits + 1)); // 0-totalHabits
      yearData.push({ date, compliance, completedHabits, totalHabits });
    }

    // Find the Monday of the week that contains Jan 1
    const startDate = new Date(year, 0, 1);
    const dayOffset = (startDate.getUTCDay() + 6) % 7; // days to go back to Monday
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - dayOffset);

    // Store event listeners for cleanup
    const eventListeners: any[] = [];

    // Create the heatmap cells (53 weeks * 7 days = 371 cells)
    for (let week = 0; week < 53; week++) {
      for (let weekday = 0; weekday < 7; weekday++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + week * 7 + weekday);

        // Check if this date is in the current year
        if (date.getFullYear() === year) {
          // Find the day of the year (0-364)
          const timeDiff = date.getTime() - new Date(year, 0, 1).getTime();
          const dayIndex = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const data = yearData[dayIndex];

          // Set background color based on compliance
          let bgClass = '';
          if (data.compliance >= 67) {
            bgClass = 'bg-green-500'; // High compliance
          } else if (data.compliance >= 34) {
            bgClass = 'bg-green-300'; // Medium compliance
          } else {
            bgClass = 'bg-green-100'; // Low compliance
          }
          cell.classList.add(bgClass);

          // Store data for tooltip
          cell.dataset.tooltip = JSON.stringify({
            date: date.toDateString(),
            compliance: data.compliance,
            completed: data.completedHabits,
            total: data.totalHabits
          });

          // Add hover event listener
          const handleMouseEnter = (e: MouseEvent) => {
            const targetData = JSON.parse((e.target as HTMLElement).dataset.tooltip || '{}');
            tooltip.innerHTML = `
                <div>${targetData.date}</div>
                <div>Compliance: ${targetData.compliance}%</div>
                <div>Completed: ${targetData.completed}/${targetData.total} habits</div>
            `;
            tooltip.classList.add('show');
            
            requestAnimationFrame(() => {
                // Position tooltip near the cursor with boundary checking
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                let left = rect.left + window.scrollX;
                let top = rect.bottom + window.scrollY + 8;

                // Prevent tooltip from going off-screen right
                const tooltipWidth = tooltip.offsetWidth;
                if (left + tooltipWidth > window.innerWidth + window.scrollX) {
                    left = window.innerWidth + window.scrollX - tooltipWidth - 10;
                }

                // Prevent tooltip from going off-screen bottom
                const tooltipHeight = tooltip.offsetHeight;
                if (top + tooltipHeight > window.innerHeight + window.scrollY) {
                    top = rect.top + window.scrollY - tooltipHeight - 8;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });
          };

          const handleMouseLeave = () => {
            tooltip.classList.remove('show');
          };

          cell.addEventListener('mouseenter', handleMouseEnter as any);
          cell.addEventListener('mouseleave', handleMouseLeave as any);
          eventListeners.push({ cell, handleMouseEnter, handleMouseLeave });
        }

        heatmapGrid.appendChild(cell);
      }
    }

    // Generate month labels
    monthNames.forEach((monthName, monthIndex) => {
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0); // last day of the month

      if (firstDay.getFullYear() !== year || lastDay.getFullYear() !== year) return;

      // Calculate week and weekday for first and last day
      const getWeekAndWeekday = (targetDate: Date) => {
        const daysSinceGridStart = Math.floor((targetDate.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24));
        const computedWeek = Math.floor(daysSinceGridStart / 7);
        const computedWeekday = daysSinceGridStart % 7;
        return { week: computedWeek, weekday: computedWeekday };
      };

      const firstPos = getWeekAndWeekday(firstDay);
      const lastPos = getWeekAndWeekday(lastDay);

      // Only consider weeks (columns) for horizontal span
      const startWeek = firstPos.week;
      const endWeek = lastPos.week;
      const numWeeks = endWeek - startWeek + 1;

      // Calculate pixel position and width
      const cellSize = 10; // px
      const gap = 2; // px
      const left = startWeek * (cellSize + gap);
      const width = numWeeks * cellSize + (numWeeks - 1) * gap;

      const label = document.createElement('div');
      label.className = 'month-label';
      label.textContent = monthName;
      label.style.left = `${left}px`;
      label.style.width = `${width}px`;
      monthLabels.appendChild(label);
    });

    // Cleanup function
    return () => {
      eventListeners.forEach(({ cell, handleMouseEnter, handleMouseLeave }) => {
        if (cell) {
          cell.removeEventListener('mouseenter', handleMouseEnter);
          cell.removeEventListener('mouseleave', handleMouseLeave);
        }
      });
    };
  }, []);

  // Render analytics charts
  useEffect(() => {
    const ctx1 = complianceChartRef.current?.getContext('2d');
    const ctx2 = habitsVsDailiesChartRef.current?.getContext('2d');

    // Type checking guard clause to make sure context exists
    if (!ctx1 || !ctx2) return;

    // Generate sample data for the last 12 months
    const months = [];
    const complianceData = [];
    const habitsData = [];
    const dailiesData = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleString('default', { month: 'short' }));
      complianceData.push(Math.floor(Math.random() * 30) + 50); // 50-80
      habitsData.push(Math.floor(Math.random() * 25) + 60);     // 60-85
      dailiesData.push(Math.floor(Math.random() * 30) + 40);    // 40-70
    }

    // Explicitly typed configuration block to resolve deep nested scale interface errors
    const chartOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 14
            },
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 8,
          cornerRadius: 4
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            color: '#6b7280',
            font: {
              size: 12
            }
          },
          grid: {
            color: '#e5e7eb'
          }
        },
        x: {
          ticks: {
            color: '#6b7280',
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        }
      }
    };

    // Instantiate charts cleanly
    const chart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Overall Compliance %',
          data: complianceData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          borderWidth: 3,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: chartOptions
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
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Dailies Compliance %',
            data: dailiesData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: chartOptions
    });

    return () => {
      chart1.destroy();
      chart2.destroy();
    };
  }, []);

  const handleModify = (id: number, type: 'daily' | 'habit') => {
    alert(`Modify ${type} with id: ${id}`);
  };

  const handleDelete = (id: number, type: 'daily' | 'habit') => {
    if (type === 'daily') {
      setDailies(dailies.filter(daily => daily.id !== id));
    } else {
      setHabits(habits.filter(habit => habit.id !== id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold text-green-800">Dina AI</h1>
        <p className="text-lg text-green-600 mt-2">AI-driven Ayurvedic Dinacharya & Ritucharya Compliance Platform</p>
      </header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Dailies (Left) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-900">Dailies</h2>
            <button id="create-daily-btn" className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-sm">
              <Plus size={16} />
              <span>Create</span>
            </button>
          </div>
          <div id="dailies-list" className="space-y-3">
            {dailies.map(item => (
              <div key={item.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <span className="flex-1">{item.name}</span>
                <div className="flex gap-2">
                  <button
                    className="modify-btn text-green-600 hover:text-green-800"
                    onClick={() => handleModify(item.id, 'daily')}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="delete-btn text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(item.id, 'daily')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Habits (Right) */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-900">Habits</h2>
            <button id="create-habit-btn" className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded flex items-center gap-1 text-sm">
              <Plus size={16} />
              <span>Create</span>
            </button>
          </div>
          <div id="habits-list" className="space-y-3">
            {habits.map(item => (
              <div key={item.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <span className="flex-1">{item.name}</span>
                <div className="flex gap-2">
                  <button
                    className="modify-btn text-green-600 hover:text-green-800"
                    onClick={() => handleModify(item.id, 'habit')}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="delete-btn text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(item.id, 'habit')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Yearly Block Calendar */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-green-900 mb-4">Yearly Compliance Calendar</h2>
        <div className="calendar-container overflow-x-auto">
          <div ref={heatmapContainerRef} className="relative">
            <div id="month-labels" className="absolute left-0 top-0 flex items-start space-x-0 pointer-events-none"></div>
            <div id="heatmap-grid" className="ml-[0] mt-[24px] grid grid-cols-53 gap-[2px]"></div>
            <div ref={tooltipRef} id="tooltip" className="hidden z-10"></div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-green-600">
          <div className="legend-item">
            <div className="legend-color bg-green-500"></div>
            <span>High Compliance</span>
          </div>
          <div className="legend-item">
            <div className="legend-color bg-green-300"></div>
            <span>Medium Compliance</span>
          </div>
          <div className="legend-item">
            <div className="legend-color bg-green-100"></div>
            <span>Low Compliance</span>
          </div>
        </div>
      </section>

      {/* Analytics Charts */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-green-900 mb-6">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="text-lg font-semibold text-green-900">Compliance Trend (Last 12 Months)</h3>
            </div>
            <div className="chart-content">
              <canvas ref={complianceChartRef} height="220"></canvas>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="text-lg font-semibold text-green-900">Habits vs Dailies Comparison</h3>
            </div>
            <div className="chart-content">
              <canvas ref={habitsVsDailiesChartRef} height="220"></canvas>
            </div>
          </div>
        </div>
        
      </section>
    </div>
  );
}