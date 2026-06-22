"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { Heart, ChevronLeft, ChevronRight, Check } from "lucide-react";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const sections = [
  {
    title: "Digestion & Metabolism",
    subtitle: "Agni & Kosta",
    questions: [
      { id: "q1", text: "I feel a clear, strong, and predictable hunger at regular times every day." },
      { id: "q2", text: "Within an hour after eating, I feel light, comfortable, and energized (no bloating or heavy sleepiness)." },
      { id: "q3", text: "I wake up with a clean, pink tongue that is free of any thick white or yellowish coating." },
      { id: "q4", text: "My morning elimination (bowel movement) is smooth, effortless, and happens regularly without any strain." },
    ],
  },
  {
    title: "Physical Body & Vitality",
    subtitle: "Sharirika & Bala",
    questions: [
      { id: "q5", text: "I fall asleep easily and wake up feeling genuinely refreshed, light, and clear-headed." },
      { id: "q6", text: "My physical body feels naturally light, agile, and comfortable to move around in." },
      { id: "q7", text: "My muscles and joints are completely free of unexplained aches, random pain, or chronic stiffness." },
      { id: "q8", text: "My thirst is normal and easily satisfied; my mouth, throat, and lips rarely feel uncomfortably dry." },
      { id: "q9", text: "My energy levels remain steady and sustained throughout the day without sudden afternoon crashes." },
      { id: "q10", text: "My body adapts well to temperatures; I sweat moderately during exercise and my hands/feet stay comfortably warm." },
    ],
  },
  {
    title: "Senses, Skin & Speech",
    subtitle: "Indriya & Upadhatu",
    questions: [
      { id: "q11", text: "My senses are sharp and clear (stable vision, precise hearing, and a vibrant, accurate sense of taste)." },
      { id: "q12", text: "My skin has a healthy, natural glow/luster, and my hair feels rooted and healthy rather than weak or brittle." },
      { id: "q13", text: "My voice feels strong, clear, and resonant, and my mind is sharp enough to find the right words easily." },
    ],
  },
  {
    title: "Mind, Mood & Emotions",
    subtitle: "Manasika",
    questions: [
      { id: "q14", text: "I approach my daily work, studies, and responsibilities with a natural sense of enthusiasm and drive." },
      { id: "q15", text: "I feel emotionally stable, centered, and capable of processing daily stress without feeling easily overwhelmed or anxious." },
    ],
  },
];

const scaleLabels = ["Never", "Rarely", "Sometimes", "Mostly", "Always"];

const sectionThemes = [
  { bg: "bg-[#6BBB62]", border: "border-[#4AA338]", text: "text-[#141414]" },
  {  bg: "bg-[#6BBB62]", border: "border-[#4AA338]", text: "text-[#141414]" },
  { bg: "bg-[#6BBB62]", border: "border-[#4AA338]", text: "text-[#141414]" },
  {  bg: "bg-[#6BBB62]", border: "border-[#4AA338]", text: "text-[#141414]"},
];

export default function WellnessPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ total: number; max: number } | null>(null);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const section = sections[currentSection];
  const theme = sectionThemes[currentSection];
  const sectionAnswered = section.questions.every(q => answers[q.id] !== undefined);
  const isLastSection = currentSection === sections.length - 1;

  function selectAnswer(qId: string, value: number) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
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
            <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
            >
                Back to dashboard
            </button>
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
              <p className="text-sm text-[#556050] font-bold mt-1">How have you felt this past week?</p>
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
          </div>

          <div className="space-y-5 z-10">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="bg-white/60 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  {idx + 1}. {q.text}
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => selectAnswer(q.id, val)}
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