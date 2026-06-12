import Navbar from "../components/navbar";

export default function TwinPage() {
  return (
    <div className="min-h-screen bg-[#f8f9f5] pb-24">
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 sm:px-10">
          <h1 className="text-2xl font-semibold text-slate-900">Health Twin</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            A personal wellness companion that can later visualize your avatar while predicting key health signals and recommending seasonally aligned nourishment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[440px_minmax(0,1fr)]">
          <section className="rounded-3xl bg-slate-950 p-6 text-slate-100 shadow-sm ring-1 ring-slate-900/10">
            <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-950/90 p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-sky-300">Avatar panel</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Character preview</h2>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  placeholder
                </span>
              </div>

              <div className="relative flex items-center justify-center overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8">
                <div className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed border-slate-700 bg-slate-950/90 text-center px-4 py-6">
                  <div className="mb-4 h-32 w-32 rounded-full border border-slate-700 bg-slate-800" />
                  <p className="max-w-xs text-xs leading-6 text-slate-400">
                    Future character area. Render body map, avatar, expression, or real-time biometrics here.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-3xl bg-slate-900/80 px-4 py-4 text-xs text-slate-300 ring-1 ring-slate-800">
                  <p className="font-medium text-slate-100">Status</p>
                  <p className="mt-2 text-xs text-slate-400">Ready to enrich with live sensor data and personalization.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 px-4 py-4 text-xs text-slate-300 ring-1 ring-slate-800">
                  <p className="font-medium text-slate-100">Hint</p>
                  <p className="mt-2 text-xs text-slate-400">Embed a 3D character or avatar based on user prakriti and wellbeing profile.</p>
                </div>
              </div>
            </div>
          </section>

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
          </section>
        </div>
      </div>
    </main>
    <Navbar />
    </div>
  );
}
