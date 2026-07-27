"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { Heart, ChevronLeft, ChevronRight, Check } from "lucide-react";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

type Option = { label: string; value: string };

type ScaleQuestion = { id: string; type: "scale"; text: string };
type RadioQuestion = { id: string; type: "radio"; text: string; options: Option[] };
type DropdownQuestion = { id: string; type: "dropdown"; text: string; options: Option[] };
type CheckboxQuestion = {
  id: string;
  type: "checkbox";
  text: string;
  options: Option[];
  max?: number;
};

type Question = ScaleQuestion | RadioQuestion | DropdownQuestion | CheckboxQuestion;

type Section = {
  title: string;
  subtitle: string;
  intro?: string;
  questions: Question[];
};

const scaleLabels = ["Never", "Rarely", "Sometimes", "Mostly", "Always"];

const sections: Section[] = [
  {
    title: "Dushya",
    subtitle: "Affected Systems / Tissue Targets",
    questions: [
      {
        id: "dushya",
        type: "checkbox",
        text: "Are you currently noticing discomfort in any specific bodily systems or structural areas? (Select all that apply)",
        options: [
          { label: "Energy & Fluid Levels: Feeling constantly fatigued, heavy, or experiencing sudden water retention. (Rasa Dhatu)", value: "rasa" },
          { label: "Skin & Blood Quality: Experiencing sudden skin rashes, acne, inflammation, or internal heat. (Rakta Dhatu)", value: "rakta" },
          { label: "Muscles & Posture: Chronic stiffness, heaviness, or muscle fatigue without heavy exercise. (Mamsa Dhatu)", value: "mamsa" },
          { label: "Metabolism & Body Heat: Excessive, sticky sweat, or deep sluggishness. (Meda Dhatu)", value: "meda" },
          { label: "Bones & Hair: Popping or cracking joints, minor lower back aches, brittle nails, or sudden hair loss. (Asthi Dhatu)", value: "asthi" },
          { label: "Nerves & Focus: Frequent mental fogginess, persistent anxiety, or a racing mind. (Majja Dhatu)", value: "majja" },
        ],
      },
    ],
  },
  {
    title: "Bala",
    subtitle: "Physical Strength & Stamina",
    questions: [
      {
        id: "bala",
        type: "radio",
        text: "Rate your current level of physical stamina and natural immunity against common seasonal bugs.",
        options: [
          { label: "Excellent Strength (Pravara): High stamina, I rarely catch seasonal colds, and I recover very quickly from physical exertion.", value: "excellent" },
          { label: "Moderate Strength (Madhyama): Average daily energy; I manage tasks well but catch seasonal bugs once or twice a year.", value: "moderate" },
          { label: "Low Strength (Avara): I tire out very quickly, feel physically weak, and seem to catch every bug going around.", value: "low" },
        ],
      },
    ],
  },
  {
    title: "Agni",
    subtitle: "Current Metabolic Digestive Quality",
    questions: [
      {
        id: "agni",
        type: "radio",
        text: "How does your digestive system behave on a typical day right now?",
        options: [
          { label: "Balanced (Samagni): Smooth, highly predictable, and handles standard meals without any issues.", value: "balanced" },
          { label: "Unpredictable (Vishamagni): Prone to sudden gas, bloating, and fluctuating hunger levels.", value: "unpredictable" },
          { label: "Hyperactive / Intense (Tikshnagni): Intense hunger that turns into acidity, burning sensations, or heartburn if I don't eat immediately.", value: "hyperactive" },
          { label: "Sluggish / Slow (Mandagni): Very low appetite; food sits heavily in my stomach for hours after a small meal.", value: "sluggish" },
        ],
      },
    ],
  },
  {
    title: "Satva",
    subtitle: "Mental Strength & Baseline Resilience",
    questions: [
      {
        id: "satva",
        type: "radio",
        text: "How does your mind typically respond when you are placed under sudden pressure or a stressful situation?",
        options: [
          { label: "Calm & Centered (Pravara): I stay clear-headed, emotionally steady, and look for solutions without panicking.", value: "calm" },
          { label: "Restless & Driven (Madhyama): I get highly passionate, but also easily anxious, reactive, or frustrated.", value: "restless" },
          { label: "Overwhelmed & Foggy (Avara): I tend to shut down, procrastinate, feel deeply helpless, or experience intense mental fog.", value: "overwhelmed" },
        ],
      },
    ],
  },
  {
    title: "Satmya",
    subtitle: "Habitual Tolerance & Adaptability",
    questions: [
      {
        id: "satmya",
        type: "dropdown",
        text: "How easily does your body adapt when you switch to unfamiliar foods or travel to a completely different climate?",
        options: [
          { label: "High Adaptability: I adapt effortlessly; my digestion and energy remain stable regardless of what I eat or where I travel.", value: "high" },
          { label: "Moderate Adaptability: I handle changes well if they are gradual, but sudden shifts in food or weather make me slightly uncomfortable.", value: "moderate" },
          { label: "Restricted Adaptability: I am highly sensitive; minor changes in my diet, routine, or climate quickly cause digestive issues or low energy.", value: "restricted" },
        ],
      },
    ],
  },
  {
    title: "Ahara",
    subtitle: "Dietary Quality & Staples",
    questions: [
      {
        id: "ahara_char",
        type: "checkbox",
        text: "What has been the primary characteristic of the meals you have consumed over the last 3\u20135 days? (Select all that apply)",
        options: [
          { label: "Warm, freshly prepared, home-cooked, and simple meals.", value: "warm_fresh" },
          { label: "Cold, raw (salads/smoothies), dry, or packaged/processed snacks.", value: "cold_raw_processed" },
          { label: "Highly spicy, oily, deeply fried, or heavily fermented foods.", value: "spicy_oily_fermented" },
          { label: "Irregular meals, frequent skipping, or eating late at night.", value: "irregular_skipping" },
        ],
      },
      {
        id: "ahara_staple",
        type: "checkbox",
        max: 5,
        text: "Select up to 5 of your most common, everyday staple foods (foods you consume almost daily):",
        options: [
          { label: "Wholesome grains & pulses (Whole rice, Oats, Wheat, Mung Dal, Lentils)", value: "wholesome_grains" },
          { label: "Healthy fats & natural sweeteners (Ghee, Sesame/Coconut oil, Raw Honey, Jaggery)", value: "healthy_fats" },
          { label: "Fresh produce & dairy (Fresh seasonal vegetables, Sweet fruits, Fresh milk, Buttermilk)", value: "fresh_produce_dairy" },
          { label: "Refined carbs & sugars (White bread, Maida, white sugar, packaged bakery items)", value: "refined_carbs" },
          { label: "Processed & preserved foods (Canned items, frozen ready-meals, instant noodles, chips)", value: "processed_preserved" },
          { label: "Heavy / Fermented items (Excess red meat, aged cheeses, carbonated sodas, fried fast-food)", value: "heavy_fermented" },
        ],
      },
    ],
  },
  {
    title: "Avastha",
    subtitle: "Current General Health Phase",
    questions: [
      {
        id: "avastha",
        type: "dropdown",
        text: "Which phrase best captures your general state of living over the last week?",
        options: [
          { label: "Healthy Baseline: I am feeling normal and maintaining my regular daily lifestyle.", value: "baseline" },
          { label: "Acute Stress / Fatigue: I am currently dealing with high stress, lack of sleep, or sudden exhaustion.", value: "stress" },
          { label: "Healing / Recovery: I am actively recovering from a recent illness, infection, or medical issue.", value: "recovery" },
          { label: "Persistent Imbalance: I am managing a long-term, ongoing health condition.", value: "chronic" },
        ],
      },
    ],
  },
  {
    title: "Digestion & Excretion",
    subtitle: "Daily Symptom Tracking",
    intro: "Rate each statement from 1 to 5 based on how you have been feeling over the last 7 to 10 days.",
    questions: [
      { id: "q8", type: "scale", text: "Within an hour after eating, I feel light, comfortable, and energized (free of gas, bloating, or immediate heaviness)." },
      { id: "q9", type: "scale", text: "My morning elimination (bowel movement) is smooth, effortless, and happens regularly without any strain or discomfort." },
      { id: "q10", type: "scale", text: "I wake up with a clean, pink tongue that is free of any thick white or yellowish coating." },
    ],
  },
  {
    title: "Vitality, Sleep & Senses",
    subtitle: "Daily Symptom Tracking",
    intro: "Rate each statement from 1 to 5 based on how you have been feeling over the last 7 to 10 days.",
    questions: [
      { id: "q11", type: "scale", text: "I fall asleep easily and wake up feeling genuinely refreshed, light, and clear-headed rather than groggy." },
      { id: "q12", type: "scale", text: "My physical energy levels remain steady and sustained throughout the day without sudden afternoon crashes." },
      { id: "q13", type: "scale", text: "My thirst is stable and easily satisfied; my mouth, throat, and lips rarely feel uncomfortably dry or sticky." },
      { id: "q14", type: "scale", text: "My senses are sharp and clear (stable vision, precise hearing, and a vibrant, accurate sense of taste)." },
      { id: "q15", type: "scale", text: "My voice feels strong, clear, and resonant when speaking, and my mind feels free of fogginess." },
    ],
  },
  {
    title: "Mind & Emotional Resilience",
    subtitle: "Daily Symptom Tracking",
    intro: "Rate each statement from 1 to 5 based on how you have been feeling over the last 7 to 10 days.",
    questions: [
      { id: "q16", type: "scale", text: "I approach my daily work, studies, and responsibilities with a natural sense of enthusiasm and drive." },
      { id: "q17", type: "scale", text: "I feel emotionally stable, centered, and capable of processing daily stress without feeling easily overwhelmed or anxious." },
    ],
  },
];

const sectionTheme = { bg: "bg-[#6BBB62]", border: "border-[#4AA338]", text: "text-[#141414]" };

// Answers can be: number (scale/1-5), string (radio/dropdown value), or string[] (checkbox values)
type AnswerValue = number | string | string[];

export default function WellnessPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ total: number; max: number } | null>(null);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const section = sections[currentSection];
  const theme = sectionTheme;

  function isAnswered(q: Question) {
    const val = answers[q.id];
    if (q.type === "checkbox") return Array.isArray(val) && val.length > 0;
    return val !== undefined && val !== "";
  }

  const sectionAnswered = section.questions.every(isAnswered);
  const isLastSection = currentSection === sections.length - 1;

  function selectScale(qId: string, value: number) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function selectRadioOrDropdown(qId: string, value: string) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function toggleCheckbox(q: CheckboxQuestion, value: string) {
    setAnswers(prev => {
      const current = (prev[q.id] as string[] | undefined) ?? [];
      const alreadySelected = current.includes(value);

      if (alreadySelected) {
        const next = current.filter(v => v !== value);
        const copy = { ...prev };
        if (next.length === 0) {
          delete copy[q.id];
        } else {
          copy[q.id] = next;
        }
        return copy;
      }

      if (q.max && current.length >= q.max) {
        return prev; // limit reached, ignore new selection
      }

      return { ...prev, [q.id]: [...current, value] };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/wellness", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (data.assessment) {
        setResult({ total: data.healthScore, max: 100 });
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to submit assessment", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && result) {
    const pct = Math.round(result.total);
    return (
      <div className="min-h-screen bg-[#fafb96]/10 pb-24">
        <main className="w-full max-w-2xl mx-auto py-10 px-4 sm:px-6">
          <div className="rounded-3xl p-8 bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] border border-[#6ee7b7]/40 shadow-md text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-[#065f46] mb-2">Assessment saved</h2>
            <p className="text-sm text-[#065f46]/80 font-medium mb-6">
              Your wellness score today
            </p>
            <div className="bg-white/60 rounded-2xl p-4 mb-6">
              <p className="text-4xl font-black text-[#065f46]">{pct}</p>
              <p className="text-xs text-[#065f46]/70 font-semibold mt-1">out of 100</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                Back to dashboard
              </button>
              <button
                onClick={() => router.push("/twin")}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
              >
                Twin analysis
              </button>
            </div>
          </div>
        </main>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafb96]/10 pb-24">
      <main className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6">

        {/* Header */}
        <header className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-2">
            <Heart size={22} className="text-rose-500 fill-rose-200" />
            <div>
              <h1 className="text-3xl font-black text-[#0f240f] tracking-tight">Wellness Check</h1>
              <p className="text-sm text-[#556050] font-bold mt-1">Ayurvedic profile & symptom assessment</p>
            </div>
          </div>
        </header>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Section {currentSection + 1} of {sections.length}
            </span>
            <span className="text-xs font-bold text-gray-500">{progress}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Section card */}
        <div className={`rounded-3xl p-6 mb-6 bg-gradient-to-br ${theme.bg} noise-bg border ${theme.border} shadow-md`}>
          <div className="mb-5 z-10">
            <p className={`text-xs uppercase tracking-[0.18em] font-black ${theme.text}/70`}>{section.subtitle}</p>
            <h2 className={`text-xl font-black ${theme.text}`}>{section.title}</h2>
            {section.intro && (
              <p className={`text-xs font-semibold mt-1 ${theme.text}/70`}>{section.intro}</p>
            )}
          </div>

          <div className="space-y-5 z-10">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="bg-white/60 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  {idx + 1}. {q.text}
                  {q.type === "checkbox" && q.max && (
                    <span className="block text-xs font-medium text-gray-500 mt-1">
                      Selected {(answers[q.id] as string[] | undefined)?.length ?? 0} / {q.max}
                    </span>
                  )}
                </p>

                {q.type === "scale" && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => selectScale(q.id, val)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-bold transition-colors ${
                          answers[q.id] === val
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <span className="text-base">{val}</span>
                        <span className="text-[9px] font-medium leading-tight text-center">
                          {scaleLabels[val - 1]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "radio" && (
                  <div className="space-y-2">
                    {q.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => selectRadioOrDropdown(q.id, opt.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                          answers[q.id] === opt.value
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "checkbox" && (
                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const selected = ((answers[q.id] as string[] | undefined) ?? []).includes(opt.value);
                      const atMax = !!q.max && !selected && ((answers[q.id] as string[] | undefined)?.length ?? 0) >= q.max;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => toggleCheckbox(q, opt.value)}
                          disabled={atMax}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-start gap-2 ${
                            selected
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : atMax
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                              selected ? "bg-white border-white" : "border-gray-300"
                            }`}
                          >
                            {selected && <Check size={12} className="text-emerald-600" />}
                          </span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "dropdown" && (
                  <select
                    value={(answers[q.id] as string | undefined) ?? ""}
                    onChange={e => selectRadioOrDropdown(q.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {q.options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentSection(s => Math.max(0, s - 1))}
            disabled={currentSection === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {!isLastSection ? (
            <button
              onClick={() => setCurrentSection(s => Math.min(sections.length - 1, s + 1))}
              disabled={!sectionAnswered}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!sectionAnswered || submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Submit assessment"}
            </button>
          )}
        </div>

      </main>
      <Navbar />
    </div>
  );
}