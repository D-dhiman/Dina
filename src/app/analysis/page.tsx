"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Chart, ChartOptions, ChartData, registerables } from "chart.js";
import Navbar from "../components/navbar";
import { Shield, Heart, Zap, Download } from "lucide-react";

Chart.register(...registerables);

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

// ─── CHART DATA ───────────────────────────────────────────────────────────────
const hrvLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const hrvData: ChartData<"line"> = {
  labels: hrvLabels,
  datasets: [{
    label: "HRV (ms)",
    data: [42, 38, 45, 41, 36, 33, 39, 44, 47, 43, 40, 46],
    borderColor: "rgba(4, 120, 87, 1)",
    backgroundColor: "rgba(16, 185, 129, 0.07)",
    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
    pointBackgroundColor: "rgba(16, 185, 129, 1)",
  }, {
    label: "Resting HR (bpm)",
    data: [68, 72, 66, 70, 75, 78, 71, 67, 65, 69, 72, 67],
    borderColor: "rgba(185, 28, 28, 1)",
    backgroundColor: "rgba(244, 63, 94, 0.05)",
    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
    pointBackgroundColor: "rgba(244, 63, 94, 1)",
  }],
};
const hrvOptions: ChartOptions<"line"> = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: "top" } },
  scales: { x: { grid: { display: false } }, y: { beginAtZero: false } },
};

const sleepLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const sleepData: ChartData<"bar"> = {
  labels: sleepLabels,
  datasets: [
    { label: "Deep (hrs)",  data: [1.2, 0.9, 1.5, 1.1, 0.8, 1.6, 1.3], backgroundColor: "rgba(29, 78, 216, 1)", borderRadius: 4 },
    { label: "REM (hrs)",   data: [1.8, 1.5, 2.0, 1.7, 1.4, 2.1, 1.9], backgroundColor: "rgba(59, 130, 246, 1)", borderRadius: 4 },
    { label: "Light (hrs)", data: [3.5, 3.8, 3.2, 3.6, 4.0, 3.1, 3.4], backgroundColor: "rgba(147, 197, 253, 1)", borderRadius: 4 },
  ],
};
const sleepOptions: ChartOptions<"bar"> = {
  responsive: true, maintainAspectRatio: false,
  scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } },
};

const doshaData: ChartData<"radar"> = {
  labels: ["Vata Balance","Pitta Balance","Kapha Balance","Agni (Digestion)","Ojas (Immunity)","Prana (Energy)"],
  datasets: [{
    label: "Current Status",
    data: [65, 80, 45, 70, 55, 72],
    borderColor: "rgba(194, 65, 12, 1)",
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    pointBackgroundColor: "rgba(249, 115, 22, 1)",
    pointRadius: 4,
  }, {
    label: "Optimal Target",
    data: [80, 80, 80, 80, 80, 80],
    borderColor: "rgba(4, 120, 87, 1)",
    backgroundColor: "rgba(16, 185, 129, 0.06)",
    pointBackgroundColor: "rgba(16, 185, 129, 1)",
    pointRadius: 3,
    borderDash: [4, 3],
  }],
};
const doshaOptions: ChartOptions<"radar"> = {
  responsive: true, maintainAspectRatio: false,
  scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 }, pointLabels: { font: { size: 11, weight: "bold" } } } },
};

const pulseScatterData: ChartData<"scatter"> = {
  datasets: [{
    label: "Daily Logs",
    data: [{x:65,y:82},{x:72,y:68},{x:68,y:75},{x:78,y:58},{x:62,y:88}],
    backgroundColor: "rgba(29, 78, 216, 0.7)",
    pointRadius: 6,
  }],
};

const inflameData: ChartData<"line"> = {
  labels: ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"],
  datasets: [{
    label: "Inflammation Index",
    data: [28, 35, 42, 38, 55, 61, 49, 44, 38, 32, 29, 25],
    borderColor: "rgba(234, 88, 12, 1)",
    backgroundColor: "rgba(249, 115, 22, 0.05)",
    fill: true, tension: 0.4,
  }],
};

const wellnessData: ChartData<"bar"> = {
  labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  datasets: [{
    label: "Wellness Score",
    data: [68, 72, 76, 81, 84, 78, 73, 80, 85, 88, 83, 87],
    backgroundColor: "rgba(4, 120, 87, 0.75)",
    borderRadius: 6,
  }],
};

const kpis = [
  { label: "Yearly Wellness",  value: "83", bgHex: "#AED27D", textHex: "#1a3d1a" },
  { label: "Avg HRV",          value: "41", bgHex: "#fecaca", textHex: "#450a0a" },
  { label: "Sleep Efficiency", value: "79", bgHex: "#A6C7F2", textHex: "#0c2340" },
];

// Chart layout config for PDF — title + ref key
const CHART_SECTIONS = [
  { title: "Heart Rate Variability vs Resting Pulse", key: "hrv",     bg: "#ffffff" },
  { title: "Sleep Architecture",                       key: "sleep",   bg: "#A6C7F2" },
  { title: "Dosha Imbalance Map",                      key: "dosha",   bg: "#AED27D" },
  { title: "Pulse × Sleep Overlap",                    key: "scatter", bg: "#ffffff" },
  { title: "Inflammatory Index Tracker",               key: "inflame", bg: "#ffffff" },
  { title: "Longitudinal Wellness Base",               key: "wellness",bg: "#ffffff" },
];

export default function AnalyticsPage() {
  const chartRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const chartsRef = useRef<Chart[]>([]);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const setRef = (key: string) => (el: HTMLCanvasElement | null) => {
    chartRefs.current[key] = el;
  };

  useEffect(() => {
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    const make = (key: string, type: any, data: any, options: any) => {
      const el = chartRefs.current[key];
      if (el) chartsRef.current.push(new Chart(el, { type, data, options }));
    };

    make("hrv",     "line",    hrvData,          hrvOptions);
    make("sleep",   "bar",     sleepData,        sleepOptions);
    make("dosha",   "radar",   doshaData,        doshaOptions);
    make("scatter", "scatter", pulseScatterData, { responsive: true, maintainAspectRatio: false });
    make("inflame", "line",    inflameData,      { ...hrvOptions });
    make("wellness","bar",     wellnessData,     { ...hrvOptions });

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, []);

  // ─── PDF built directly from chart canvases — zero html2canvas, zero lab() errors ───
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const jsPDF = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;
      if (!jsPDF) throw new Error("jsPDF failed to load.");

      // A4 landscape: 297 × 210 mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const PW = 297; // page width mm
      const PH = 210; // page height mm
      const MARGIN = 10;
      const usableW = PW - MARGIN * 2;

      // ── Cover / KPI page ──────────────────────────────────────────────────
      pdf.setFillColor(252, 253, 250);
      pdf.rect(0, 0, PW, PH, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(30, 58, 30);
      pdf.text("DINA-AI Analytics Report", MARGIN, 22);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(138, 148, 133);
      pdf.text(`Generated ${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}`, MARGIN, 30);

      // KPI boxes
      const kpiBoxW = 60;
      kpis.forEach((k, i) => {
        const x = MARGIN + i * (kpiBoxW + 6);
        const y = 38;
        // box fill
        const hex = k.bgHex.replace("#","");
        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,6),16);
        pdf.setFillColor(r, g, b);
        pdf.roundedRect(x, y, kpiBoxW, 28, 5, 5, "F");
        // label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(k.label.toUpperCase(), x + 4, y + 9);
        // value
        const th = k.textHex.replace("#","");
        pdf.setTextColor(parseInt(th.substring(0,2),16), parseInt(th.substring(2,4),16), parseInt(th.substring(4,6),16));
        pdf.setFontSize(26);
        pdf.setFont("helvetica", "bold");
        pdf.text(k.value, x + 4, y + 23);
      });

      // ── Chart pages: 2 charts per page, side by side ──────────────────────
      const CHARTS_PER_ROW = 2;
      const chartW = (usableW - 6) / CHARTS_PER_ROW; // mm per chart
      const chartH = 70; // mm height per chart block
      const startY = 80;

      // We'll fit up to 2 rows (4 charts) on the cover page below KPIs,
      // then remaining charts on a new page
      let col = 0;
      let row = 0;
      let pageInitialized = false;

      for (const section of CHART_SECTIONS) {
        const canvas = chartRefs.current[section.key];
        if (!canvas) continue;

        const imgData = canvas.toDataURL("image/png");

        // New page every 4 charts (2 cols × 2 rows), but first 4 go on cover page
        if (col === 0 && row === 2) {
          pdf.addPage();
          pdf.setFillColor(252, 253, 250);
          pdf.rect(0, 0, PW, PH, "F");
          row = 0;
          pageInitialized = true;
        }

        const x = MARGIN + col * (chartW + 6);
        const y = (pageInitialized ? MARGIN : startY) + row * (chartH + 12);

        // Section background
        const bg = section.bg.replace("#","");
        pdf.setFillColor(parseInt(bg.substring(0,2),16), parseInt(bg.substring(2,4),16), parseInt(bg.substring(4,6),16));
        pdf.roundedRect(x, y, chartW, chartH, 5, 5, "F");

        // Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(30, 58, 30);
        pdf.text(section.title, x + 4, y + 7);

        // Chart image (preserve aspect ratio)
        const imgAspect = canvas.height / canvas.width;
        const imgW = chartW - 8;
        const imgH = Math.min(imgW * imgAspect, chartH - 14);
        pdf.addImage(imgData, "PNG", x + 4, y + 10, imgW, imgH);

        col++;
        if (col >= CHARTS_PER_ROW) { col = 0; row++; }
      }

      pdf.save(`DINA-AI-Analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setDownloadError(err?.message ?? "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  return (
    <div className="w-full min-h-screen pb-20 font-sans" style={{ backgroundColor: "#fcfdfa" }}>
      <Navbar />
      <main className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto flex flex-col gap-8">

        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1e3a1e" }}>
              DINA-AI Analytics Engine 📊
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: "#8a9485" }}>
              Deep Ayurvedic Insights &amp; Longitudinal Health Trends
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="font-semibold py-2 px-4 rounded-xl flex items-center gap-2 text-sm transition-colors"
              style={{
                color: "#fff",
                backgroundColor: downloading ? "#9ca3af" : "#047857",
                cursor: downloading ? "not-allowed" : "pointer",
              }}
            >
              <Download size={16} />
              <span>{downloading ? "Generating PDF…" : "Download Report PDF"}</span>
            </button>
            {downloadError && (
              <p className="text-xs max-w-xs text-right" style={{ color: "#ef4444" }}>{downloadError}</p>
            )}
          </div>
        </header>

        {/* KPI Cards — all inline styles, zero Tailwind color classes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: k.bgHex, border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "rgba(0,0,0,0.4)" }}>{k.label}</p>
              <span className="text-3xl font-black" style={{ color: k.textHex }}>{k.value}</span>
            </div>
          ))}
        </div>

        {/* HRV + Sleep */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: "#1e3a1e" }}>Heart Rate Variability vs Resting Pulse</h2>
            <div className="h-[240px] relative"><canvas ref={setRef("hrv")} /></div>
          </section>
          <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#A6C7F2" }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: "#0c2340" }}>Sleep Architecture</h2>
            <div className="h-[240px] relative"><canvas ref={setRef("sleep")} /></div>
          </section>
        </div>

        {/* Dosha + Scatter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#AED27D" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#1a3d1a" }}>Dosha Imbalance Map</h2>
            <div className="h-[260px] relative"><canvas ref={setRef("dosha")} /></div>
          </section>
          <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#1e3a1e" }}>Pulse × Sleep Overlap</h2>
            <div className="h-[220px] relative"><canvas ref={setRef("scatter")} /></div>
          </section>
        </div>

        {/* Inflammation + Wellness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#1e3a1e" }}>Inflammatory Index Tracker</h2>
            <div className="h-[200px] relative"><canvas ref={setRef("inflame")} /></div>
          </section>
          <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#1e3a1e" }}>Longitudinal Wellness Base</h2>
            <div className="h-[200px] relative"><canvas ref={setRef("wellness")} /></div>
          </section>
        </div>
      </main>
    </div>
  );
}