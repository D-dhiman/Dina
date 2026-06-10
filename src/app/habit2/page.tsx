"use client";

import { useState } from 'react';
import Navbar from "../components/navbar";
import { Plus, Edit, Trash2, RotateCcw, CalendarDays, Sparkles, Flame } from 'lucide-react';

interface HabitItem {
  id: number;
  name: string;
  status: 'neutral' | 'positive' | 'negative';
}

export default function Habit2Page() {
  const [habits, setHabits] = useState<HabitItem[]>(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Habit ${i + 1}`,
      status: ['neutral', 'positive', 'negative'][Math.floor(Math.random() * 3)] as 'neutral' | 'positive' | 'negative',
    }))
  );

  const handleStatusToggle = (id: number, trigger: 'positive' | 'negative') => {
    setHabits(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === trigger ? 'neutral' : trigger }
          : item
      )
    );
  };

  const handleModify = (id: number) => {
    alert(`Modify habit with id: ${id}`);
  };

  const handleDelete = (id: number) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
  };

  const getItemTextClasses = (status: 'neutral' | 'positive' | 'negative') => {
    if (status === 'positive') return 'text-blue-950 transition-colors duration-300';
    if (status === 'negative') return 'text-red-950 transition-colors duration-300';
    return 'text-gray-800 transition-colors duration-300';
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfdfa] pb-20">
      <Navbar />

      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight flex items-center gap-2">
              Good morning <span className="inline-block animate-bounce [animation-duration:3s]">👋</span>
            </h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">
              Track your habits
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Circle Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#062e14] border border-[#14532d] flex items-center justify-center text-white font-semibold text-sm shadow-inner cursor-pointer select-none">
              U
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200 text-center">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Completed Today</h3>
            <p className="text-2xl font-bold text-blue-600">
              {habits.filter(h => h.status === 'positive').length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200 text-center">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Pending</h3>
            <p className="text-2xl font-bold text-yellow-500">
              {habits.filter(h => h.status === 'neutral').length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200 text-center">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Missed</h3>
            <p className="text-2xl font-bold text-red-500">
              {habits.filter(h => h.status === 'negative').length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-200 text-center">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Total Habits</h3>
            <p className="text-2xl font-bold text-gray-600">
              {habits.length}
            </p>
          </div>
        </div>

        {/* Habits List */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Habits</h2>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 text-sm transition-shadow hover:shadow-md"
            >
              <Plus size={16} />
              <span>Add New Habit</span>
            </button>
          </div>

          <div className="space-y-3">
            {habits.map(item => (
              <div
                key={item.id}
                className={`rounded-xl border transition-all duration-300 flex justify-between items-stretch overflow-hidden shadow-sm relative bg-white ${
                  item.status === 'positive' ? 'border-blue-200' : item.status === 'negative' ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                {/* Progress Bar Background */}
                <div className={`absolute top-0 left-0 h-full bg-blue-50/90 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'positive' ? 'w-full' : 'w-0'}`} />
                <div className={`absolute top-0 right-0 h-full bg-red-50/90 transition-all duration-500 ease-out z-0 pointer-events-none ${item.status === 'negative' ? 'w-full' : 'w-0'}`} />

                {/* Left Trigger (Positive) */}
                <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                  item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-r border-gray-100'
                }`}>
                  <button
                    onClick={() => handleStatusToggle(item.id, 'positive')}
                    className="w-3.5 h-10 rounded-full bg-blue-500/90 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  />
                </div>

                {/* Item Content */}
                <div className={`flex-1 px-5 flex items-center justify-between min-w-0 z-10 relative ${getItemTextClasses(item.status)}`}>
                  <span className="font-semibold text-base tracking-tight truncate pr-4">{item.name}</span>
                  <div className="flex gap-1.5 flex-shrink-0 bg-black/[0.03] p-1 rounded-xl opacity-40 hover:opacity-100 transition-opacity">
                    {item.status !== 'neutral' && (
                      <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleStatusToggle(item.id, item.status as 'positive' | 'negative')} title="Reset status">
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all" onClick={() => handleModify(item.id)}>
                      <Edit size={15} />
                    </button>
                    <button className="p-1 text-inherit hover:bg-black/5 rounded-md transition-all text-red-600/80 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Right Trigger (Negative) */}
                <div className={`flex items-center justify-center transition-all duration-500 ease-out z-10 relative overflow-hidden ${
                  item.status !== 'neutral' ? 'w-0 opacity-0 px-0' : 'w-12 opacity-100 px-3 bg-gray-50 border-l border-gray-100'
                }`}>
                  <button
                    onClick={() => handleStatusToggle(item.id, 'negative')}
                    className="w-3.5 h-10 rounded-full bg-red-500/90 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Motivational Footer */}
        <div className="mt-12 p-8 bg-white rounded-3xl shadow-sm border border-gray-200 text-center">
          <p className="text-lg text-gray-600 mb-4">
            "Consistency is the key to transformation. Small daily improvements lead to stunning long-term results."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
              <Flame size={20} className="text-blue-500" />
              <span className="text-blue-600 font-medium">7-day streak</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-xl">
              <CalendarDays size={20} className="text-blue-500" />
              <span className="text-blue-600 font-medium">View monthly calendar</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}