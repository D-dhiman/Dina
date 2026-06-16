import { useState, useEffect, useRef } from "react";

const slides = [
  {
    label: "Heart Rate",
    value: "78",
    unit: "BPM",
    sub: "Resting · Normal range",
    visual: "wave",
  },
  {
    label: "Sleep",
    value: "7.4",
    unit: "hrs",
    sub: "10:45 PM → 6:10 AM · Good",
    visual: "bars",
    bars: [40, 60, 80, 50, 90, 70, 65],
  },
  {
    label: "Blood Pressure",
    value: "120",
    unit: "/ 80",
    sub: "mmHg · Optimal",
    visual: "bp",
  },
  {
    label: "Steps",
    value: "8,432",
    unit: "steps",
    sub: "10,000 goal · 84% complete",
    visual: "progress",
    progress: 84,
  },
  {
    label: "Exercise",
    value: "45",
    unit: "min",
    sub: "Running · Today",
    visual: "stats",
    stats: [
      { val: "3.2", label: "km" },
      { val: "Run", label: "type" },
      { val: "142", label: "bpm" },
    ],
  },
  {
    label: "Calories",
    value: "376",
    unit: "kcal",
    sub: "Active burn · Today",
    visual: "bars",
    bars: [45, 60, 80, 55, 70, 90, 50],
  },
];

export default function HealthCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (n: number, dir: "left" | "right" = "left") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent((n + slides.length) % slides.length);
      setAnimating(false);
    }, 300);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 3000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = slides[current];

  return (
    <div className="bg-[#0d1f14] rounded-xl border border-[#1a3a22] p-4 w-full h-full select-none overflow-hidden">

      {/* Slide content */}
      <div
        key={current}
        style={{
          animation: `slideIn${direction === "left" ? "Left" : "Right"} 0.3s ease`,
        }}
        className="flex flex-col gap-3"
      >
        {/* Label */}
        <p className="text-[11px] tracking-[0.15em] uppercase text-[#5db87a]">
          {slide.label}
        </p>

        {/* Big number */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-semibold text-white leading-none">
            {slide.value}
          </span>
          <span className="text-sm text-[#5db87a]">{slide.unit}</span>
        </div>

        {/* Visual */}
        <div className="h-[64px] flex items-end">
          {slide.visual === "wave" && (
            <svg viewBox="0 0 280 56" className="w-full h-full">
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                points="0,38 30,36 50,18 70,43 90,28 110,40 130,16 150,33 170,38 200,26 230,36 260,20 280,34"
                fill="none" stroke="#4ade80" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <polyline
                points="0,38 30,36 50,18 70,43 90,28 110,40 130,16 150,33 170,38 200,26 230,36 260,20 280,34 280,56 0,56"
                fill="url(#wg)" stroke="none"
              />
            </svg>
          )}
          {slide.visual === "bars" && slide.bars && (
            <div className="flex gap-1 items-end w-full h-full">
              {slide.bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${h}%`,
                      background: i % 2 === 0 ? "#4ade80" : "#22c55e",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {slide.visual === "bp" && (
            <div className="flex gap-2 w-full">
              {[{ label: "Systolic", pct: 68 }, { label: "Diastolic", pct: 55 }].map(({ label, pct }) => (
                <div key={label} className="flex-1 bg-[#1a3a22] rounded-lg px-3 py-2">
                  <p className="text-[11px] text-[#3a6648] mb-2">{label}</p>
                  <div className="h-1.5 bg-[#0d1f14] rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {slide.visual === "progress" && slide.progress !== undefined && (
            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-between text-[11px] text-[#3a6648]">
                <span>{slide.value} steps</span>
                <span>10,000</span>
              </div>
              <div className="bg-[#1a3a22] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${slide.progress}%`,
                    background: "linear-gradient(90deg, #166534, #4ade80)",
                  }}
                />
              </div>
            </div>
          )}
          {slide.visual === "stats" && slide.stats && (
            <div className="flex gap-2 w-full">
              {slide.stats.map(({ val, label }) => (
                <div key={label} className="flex-1 bg-[#1a3a22] rounded-lg py-2 text-center">
                  <p className="text-base font-semibold text-green-400">{val}</p>
                  <p className="text-[11px] text-[#3a6648]">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sub label */}
        <p className="text-[11px] text-[#3a6648]">{slide.sub}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i, i > current ? "left" : "right"); startTimer(); }}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "18px" : "6px",
              height: "6px",
              background: i === current ? "#4ade80" : "#1a3a22",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}