'use client';

import React, { useState } from "react";
import Navbar from "../components/navbar";

export default function TwinPage() {
  const [reminder, setReminder] = useState<'visit-dr'|'no-need'|'urgent'>('no-need');
  const [flags, setFlags] = useState({ fallRisk: false, allergy: false, medication: false });
  const [risk, setRisk] = useState('Low');
  const [details, setDetails] = useState('');

  const toggle = (key: keyof typeof flags) => setFlags(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-[#f8f9f5] pb-24">
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
            {/* Left panel: avatar + reminder */}
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-4">
                <div className="w-28 flex-shrink-0">
                  {/* Replace /avatar-anime.png with your asset or external URL */}
                  <img src="/avatar-anime.png" alt="anime avatar" className="rounded-xl w-28 h-28 object-cover border" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Reminder</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">Care check</h2>
                    </div>
                    <div className="text-xs text-slate-500">Today</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <label className={`px-3 py-2 rounded-xl border cursor-pointer ${reminder==='visit-dr'?'bg-rose-50 border-rose-200':''}`}>
                      <input type="radio" name="reminder" checked={reminder==='visit-dr'} onChange={()=>setReminder('visit-dr')} className="mr-2" />Need to visit Dr.
                    </label>

                    <label className={`px-3 py-2 rounded-xl border cursor-pointer ${reminder==='no-need'?'bg-green-50 border-green-200':''}`}>
                      <input type="radio" name="reminder" checked={reminder==='no-need'} onChange={()=>setReminder('no-need')} className="mr-2" />No need
                    </label>

                    <label className={`px-3 py-2 rounded-xl border cursor-pointer ${reminder==='urgent'?'bg-yellow-50 border-yellow-200':''}`}>
                      <input type="radio" name="reminder" checked={reminder==='urgent'} onChange={()=>setReminder('urgent')} className="mr-2" />Urgently
                    </label>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-600">Danger flags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={()=>toggle('fallRisk')} className={`px-3 py-1 rounded-md border ${flags.fallRisk?'bg-red-100 border-red-200':'bg-slate-50'}`}>Fall risk</button>
                      <button type="button" onClick={()=>toggle('allergy')} className={`px-3 py-1 rounded-md border ${flags.allergy?'bg-red-100 border-red-200':'bg-slate-50'}`}>Allergy</button>
                      <button type="button" onClick={()=>toggle('medication')} className={`px-3 py-1 rounded-md border ${flags.medication?'bg-red-100 border-red-200':'bg-slate-50'}`}>Medication</button>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-slate-700">What is the risk?</label>
                      <select value={risk} onChange={e=>setRisk(e.target.value)} className="ml-2 rounded-md border px-2 py-1 text-sm">
                        <option>Low</option>
                        <option>Moderate</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>

                    <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Describe the risk (optional)" className="mt-3 w-full rounded-md border p-2 text-sm" />

                    <div className="mt-4">
                      <button onClick={()=>{ void (async ()=>{ alert(JSON.stringify({ reminder, flags, risk, details }, null, 2)); })(); }} className="px-4 py-2 bg-sky-600 text-white rounded-md">Save reminder</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Right column: original content preserved */}

            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Predictive alerts</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Health insights</h2>
                  </div>
                  <p className="text-xs text-slate-500">Updated just now</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium text-slate-500">Insulin spike</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">High risk</p>
                    <p className="mt-3 text-xs text-slate-600">
                      Your recent food intake suggests a spike in blood sugar over the next 2 hours. Consider low-GI snacks.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium text-slate-500">Cold warning</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">Moderate</p>
                    <p className="mt-3 text-xs text-slate-600">
                      Seasonal humidity and immune balance indicate a higher chance of chills. Keep warm and rest well.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium text-slate-500">Energy forecast</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">Stable</p>
                    <p className="mt-3 text-xs text-slate-600">
                      Your current metabolic pattern is steady. Maintain hydration and avoid heavy appetites late evening.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium text-slate-500">Stress alert</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">Low</p>
                    <p className="mt-3 text-xs text-slate-600">
                      Readings show calm tendencies today. Continue mindful breathing and light movement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-sky-600">Food recommendations</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Seasonal & prakriti guide</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Spring / Kapha</span>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Spring</p>
                    <p className="mt-3 text-base font-semibold text-slate-900">Light, warm meals</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      <li>• Mung bean soup</li>
                      <li>• Steamed greens with ginger</li>
                      <li>• Warm spiced tea</li>
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Pitta</p>
                    <p className="mt-3 text-base font-semibold text-slate-900">Cooling & balanced</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      <li>• Cucumber raita</li>
                      <li>• Sweet fruit bowl</li>
                      <li>• Coconut water</li>
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Vata</p>
                    <p className="mt-3 text-base font-semibold text-slate-900">Warm, grounding diet</p>
                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                      <li>• Oat porridge</li>
                      <li>• Root vegetable stew</li>
                      <li>• Ghee-drizzled dal</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Action items</h2>
              <p className="mt-3 text-sm text-slate-600">
                Use this space for quick follow-ups, like daily self-check prompts, weather-aware advice, and personalized nutrition notes.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-500">Today&apos;s focus</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">Hydrate early</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-500">Best habit</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">Gentle evening walk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Navbar />
    </div>
  );
}
