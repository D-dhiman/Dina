"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, ChartOptions, ChartData, registerables } from "chart.js";
import Navbar from "../components/navbar";

Chart.register(...registerables);

// ─── 1. HRV Trend (line) ─────────────────────────────────────────────────────
const hrvLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const hrvData: ChartData<"line"> = {
  labels: hrvLabels,
  datasets: [{
    label: "HRV (ms)",
    data: [42, 38, 45, 41, 36, 33, 39, 44, 47, 43, 40, 46],
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.07)",
    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
    pointBackgroundColor: "#10b981",
  }, {
    label: "Resting HR (bpm)",
    data: [68, 72, 66, 70, 75, 78, 71, 67, 65, 69, 72, 67],
    borderColor: "#f43f5e",
    backgroundColor: "rgba(244,63,94,0.05)",
    fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
    pointBackgroundColor: "#f43f5e",
  }],
};
const hrvOptions: ChartOptions<"line"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  plugins: {
    legend: { position: "top", labels: { color: "#64748b", font: { size: 11 } } },
    tooltip: { mode: "index", intersect: false, padding: 10 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } },
    y: { beginAtZero: false, ticks: { color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
  },
};

// ─── 2. Sleep Architecture (stacked bar) ─────────────────────────────────────
const sleepLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const sleepData: ChartData<"bar"> = {
  labels: sleepLabels,
  datasets: [
    { label: "Deep (hrs)",  data: [1.2, 0.9, 1.5, 1.1, 0.8, 1.6, 1.3], backgroundColor: "#4338ca", borderRadius: 4 },
    { label: "REM (hrs)",   data: [1.8, 1.5, 2.0, 1.7, 1.4, 2.1, 1.9], backgroundColor: "#6366f1", borderRadius: 4 },
    { label: "Light (hrs)", data: [3.5, 3.8, 3.2, 3.6, 4.0, 3.1, 3.4], backgroundColor: "#a5b4fc", borderRadius: 4 },
  ],
};
const sleepOptions: ChartOptions<"bar"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { position: "top", labels: { color: "#64748b", font: { size: 11 } } },
    tooltip: { padding: 10 },
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { color: "#94a3b8" } },
    y: { stacked: true, ticks: { color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
  },
};

// ─── 3. Dosha Imbalance Radar ─────────────────────────────────────────────────
const doshaData: ChartData<"radar"> = {
  labels: ["Vata Balance","Pitta Balance","Kapha Balance","Agni (Digestion)","Ojas (Immunity)","Prana (Energy)"],
  datasets: [{
    label: "Current",
    data: [65, 80, 45, 70, 55, 72],
    borderColor: "#f97316",
    backgroundColor: "rgba(249,115,22,0.12)",
    pointBackgroundColor: "#f97316",
    pointRadius: 4,
  }, {
    label: "Optimal",
    data: [80, 80, 80, 80, 80, 80],
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.06)",
    pointBackgroundColor: "#10b981",
    pointRadius: 3,
    borderDash: [4, 3],
  }],
};
const doshaOptions: ChartOptions<"radar"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { position: "bottom", labels: { color: "#64748b", font: { size: 11 }, padding: 14 } },
  },
  scales: {
    r: {
      min: 0, max: 100,
      ticks: { stepSize: 20, color: "#94a3b8", font: { size: 9 }, backdropColor: "transparent" },
      grid: { color: "#e2e8f0" },
      pointLabels: { color: "#475569", font: { size: 10 } },
    },
  },
};

// ─── 4. Pulse × Sleep scatter ─────────────────────────────────────────────────
const pulseScatterData: ChartData<"scatter"> = {
  datasets: [{
    label: "Daily readings",
    data: [
      {x:65,y:82},{x:72,y:68},{x:68,y:75},{x:78,y:58},{x:62,y:88},
      {x:74,y:64},{x:70,y:71},{x:80,y:55},{x:66,y:80},{x:76,y:60},
      {x:64,y:85},{x:73,y:66},{x:69,y:78},{x:77,y:59},{x:63,y:87},
    ],
    backgroundColor: "rgba(99,102,241,0.6)",
    pointRadius: 6, pointHoverRadius: 8,
  }],
};
const pulseScatterOptions: ChartOptions<"scatter"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, callbacks: { label: (c) => ` HR: ${c.parsed.x ?? 0} bpm · Sleep: ${c.parsed.y ?? 0}%` } },
  },
  scales: {
    x: { title: { display: true, text: "Resting HR (bpm)", color: "#94a3b8", font: { size: 10 } }, grid: { color: "#f1f5f9" }, ticks: { color: "#94a3b8" } },
    y: { title: { display: true, text: "Sleep Quality %", color: "#94a3b8", font: { size: 10 } }, grid: { color: "#f1f5f9" }, ticks: { color: "#94a3b8" } },
  },
};

// ─── 5. Inflammatory Load (line) ──────────────────────────────────────────────
const inflameLabels = ["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"];
const inflameData: ChartData<"line"> = {
  labels: inflameLabels,
  datasets: [{
    label: "Inflammation Index",
    data: [28, 35, 42, 38, 55, 61, 49, 44, 38, 32, 29, 25],
    borderColor: "#f97316",
    backgroundColor: "rgba(249,115,22,0.08)",
    fill: true, tension: 0.4, pointRadius: 4,
    pointBackgroundColor: (ctx) => {
      const v = ctx.raw as number;
      return v > 50 ? "#ef4444" : v > 35 ? "#f97316" : "#10b981";
    },
    pointHoverRadius: 7,
  }],
};
const inflameOptions: ChartOptions<"line"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, callbacks: { label: (c) => { const v = c.parsed.y ?? 0; return ` Index: ${v} ${v > 50 ? "⚠ High" : v > 35 ? "↑ Elevated" : "✓ Normal"}`; } } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 10 } } },
    y: { beginAtZero: true, max: 80, ticks: { color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
  },
};

// ─── 6. Yearly Wellness (line with anomaly) ───────────────────────────────────
const wellnessLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const wellnessData: ChartData<"bar"> = {
  labels: wellnessLabels,
  datasets: [{
    label: "Wellness Score",
    data: [68, 72, 76, 81, 84, 78, 73, 80, 85, 88, 83, 87],
    backgroundColor: wellnessLabels.map((_, i) => {
      const vals = [68,72,76,81,84,78,73,80,85,88,83,87];
      return vals[i] < 75 ? "rgba(244,63,94,0.7)" : "rgba(99,102,241,0.75)";
    }),
    borderRadius: 8,
    maxBarThickness: 36,
  }],
};
const wellnessOptions: ChartOptions<"bar"> = {
  responsive: true, maintainAspectRatio: false,
  animation: { duration: 900 },
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, callbacks: { label: (c) => { const v = c.parsed.y ?? 0; return ` Score: ${v}${v < 75 ? " ⚠ Anomaly flagged" : ""}`; } } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    y: { beginAtZero: false, min: 50, max: 100, ticks: { color: "#94a3b8" }, grid: { color: "#f1f5f9" } },
  },
};

// ─── Compliance bars (pure HTML) ──────────────────────────────────────────────
const complianceRows = [
  { name: "Medication adherence", pct: 92, color: "#6366f1" },
  { name: "Exercise sessions",    pct: 78, color: "#10b981" },
  { name: "Sleep schedule",       pct: 84, color: "#8b5cf6" },
  { name: "Hydration target",     pct: 95, color: "#0ea5e9" },
  { name: "Dietary guidelines",   pct: 71, color: "#f97316" },
];

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const kpis = [
  { label: "Yearly Wellness",   value: "83",   unit: "/100", delta: "+15pts", up: true,  color: "#10b981" },
  { label: "Avg HRV",          value: "41",   unit: "ms",   delta: "-3ms",   up: false, color: "#f43f5e" },
  { label: "Sleep Efficiency",  value: "79",   unit: "%",    delta: "+4%",    up: true,  color: "#6366f1" },
  { label: "Dosha Alignment",   value: "68",   unit: "%",    delta: "↑Pitta", up: false, color: "#f97316" },
];

// ─── Temperature heatmap ──────────────────────────────────────────────────────
const tempDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const tempWeeks = ["W1","W2","W3","W4"];
const tempGrid = [
  [36.6,36.8,37.1,37.4,37.0,36.7,36.5],
  [36.5,36.6,36.9,37.6,37.2,36.8,36.6],
  [36.7,36.9,37.0,37.2,36.9,36.6,36.5],
  [36.6,36.7,36.8,36.9,36.7,36.5,36.4],
];
const tempStyle = (v: number): React.CSSProperties => {
  if (v < 36.7) return { backgroundColor: "#e0f2fe", border: "1px solid #bae6fd" };
  if (v < 37.0) return { backgroundColor: "#86efac" };
  if (v < 37.3) return { backgroundColor: "#fbbf24" };
  return { backgroundColor: "#f87171" };
};

export default function AnalyticsPage() {
  const hrvRef      = useRef<HTMLCanvasElement | null>(null);
  const sleepRef    = useRef<HTMLCanvasElement | null>(null);
  const doshaRef    = useRef<HTMLCanvasElement | null>(null);
  const scatterRef  = useRef<HTMLCanvasElement | null>(null);
  const inflameRef  = useRef<HTMLCanvasElement | null>(null);
  const wellnessRef = useRef<HTMLCanvasElement | null>(null);
  const reportRef   = useRef<HTMLDivElement | null>(null);
  const chartsRef   = useRef<Chart[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    const make = (ref: React.RefObject<HTMLCanvasElement | null>, type: any, data: any, options: any) => {
      if (ref.current) chartsRef.current.push(new Chart(ref.current, { type, data, options }));
    };

    make(hrvRef,      "line",    hrvData,          hrvOptions);
    make(sleepRef,    "bar",     sleepData,        sleepOptions);
    make(doshaRef,    "radar",   doshaData,        doshaOptions);
    make(scatterRef,  "scatter", pulseScatterData, pulseScatterOptions);
    make(inflameRef,  "line",    inflameData,      inflameOptions);
    make(wellnessRef, "bar",     wellnessData,     wellnessOptions);

    return () => { chartsRef.current.forEach((c) => c.destroy()); chartsRef.current = []; };
  }, []);

  // ── Download: identical logic from previous version, untouched ──────────────
  const handleDownload = async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);

    try {
      const canvasEls = reportRef.current.querySelectorAll("canvas");
      const placeholders: Array<{ canvas: HTMLCanvasElement; img: HTMLImageElement }> = [];

      canvasEls.forEach((canvas) => {
        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.style.cssText = canvas.style.cssText;
        img.width  = canvas.offsetWidth;
        img.height = canvas.offsetHeight;
        img.style.width  = canvas.offsetWidth  + "px";
        img.style.height = canvas.offsetHeight + "px";
        canvas.parentElement?.replaceChild(img, canvas);
        placeholders.push({ canvas, img });
      });

      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const h2c = (window as any).html2canvas;
      const { jsPDF } = (window as any).jspdf;

      const capturedCanvas = await h2c(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        logging: false,
      });

      placeholders.forEach(({ canvas, img }) => {
        img.parentElement?.replaceChild(canvas, img);
      });

      const imgData = capturedCanvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH  = (capturedCanvas.height / capturedCanvas.width) * pageW;

      if (imgH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        let remaining = imgH;
        while (remaining > 0) {
          pdf.addImage(imgData, "PNG", 0, -yOffset, pageW, imgH);
          remaining -= pageH;
          yOffset   += pageH;
          if (remaining > 0) pdf.addPage();
        }
      }

      pdf.save(`DINA-AI-Analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", paddingBottom: "7rem", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        backgroundColor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1", margin: 0 }}>Dashboard</p>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>DINA-AI Analytics</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "5px 12px", fontSize: 11, color: "#64748b", fontWeight: 500 }}>
              <span style={{ height: 6, width: 6, borderRadius: "50%", backgroundColor: "#6366f1", display: "inline-block" }} />
              Year 2026 · Full Report
            </span>
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                backgroundColor: downloading ? "#475569" : "#0f172a",
                color: "#fff", border: "none", borderRadius: 12,
                padding: "10px 18px", fontSize: 13, fontWeight: 700,
                cursor: downloading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "all 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? "Generating PDF…" : "Download Report PDF"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Printable dashboard ── */}
      <main ref={reportRef} id="analytics-report"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {kpis.map((k) => (
            <div key={k.label} style={cardStyle}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: 0 }}>{k.label}</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</span>
                {k.unit && <span style={{ fontSize: 12, color: "#94a3b8", marginBottom: 3 }}>{k.unit}</span>}
              </div>
              <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: k.up ? "#f0fdf4" : "#fff1f2", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: k.up ? "#16a34a" : "#e11d48" }}>
                <span>{k.up ? "▲" : "▼"}</span><span>{k.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 1: HRV + Sleep Architecture ── */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f43f5e", margin: 0 }}>Vitals Correlation Engine</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Heart Rate Variability vs Resting Pulse — Yearly</h2>
            <div style={{ height: 220, position: "relative" }}><canvas ref={hrvRef} /></div>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6366f1", margin: 0 }}>Sleep Architecture</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Deep · REM · Light Breakdown</h2>
            <div style={{ height: 220, position: "relative" }}><canvas ref={sleepRef} /></div>
          </div>
        </div>

        {/* ── Row 2: Dosha Radar + Pulse×Sleep Scatter ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: 0 }}>Ayurvedic Core</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Dosha Imbalance Map vs Optimal</h2>
            <div style={{ height: 240, position: "relative" }}><canvas ref={doshaRef} /></div>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#6366f1", margin: 0 }}>Cross-vital Insight</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Pulse × Sleep Quality Correlation</h2>
            <div style={{ height: 240, position: "relative" }}><canvas ref={scatterRef} /></div>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>Each dot = one day · Lower HR → Better sleep quality</p>
          </div>
        </div>

        {/* ── Row 3: Inflammatory Load + Temperature Heatmap ── */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: 0 }}>Root Problem Detector</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Inflammatory Load Index — 12 Weeks</h2>
            <div style={{ height: 200, position: "relative" }}><canvas ref={inflameRef} /></div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {[["#10b981","Normal (<35)"],["#f97316","Elevated (35–50)"],["#ef4444","High (>50)"]].map(([c,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, display: "inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0ea5e9", margin: 0 }}>Early Warning Signal</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 12px", letterSpacing: "-0.01em" }}>Body Temperature Log (°C)</h2>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px 3px", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: 24, fontSize: 9, color: "#cbd5e1" }}></th>
                  {tempDays.map((d) => <th key={d} style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8", textAlign: "center" }}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {tempWeeks.map((w, wi) => (
                  <tr key={w}>
                    <td style={{ fontSize: 9, fontWeight: 700, color: "#64748b" }}>{w}</td>
                    {tempGrid[wi].map((v, di) => (
                      <td key={di} style={{ padding: 0 }}>
                        <div style={{ height: 22, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#1e293b", ...tempStyle(v) }}>{v}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 9, color: "#94a3b8", flexWrap: "wrap" }}>
              {[["#e0f2fe","<36.7 Low"],["#86efac","36.7–37.0 Normal"],["#fbbf24","37.0–37.3 Elevated"],["#f87171",">37.3 Fever"]].map(([bg,l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: bg, display: "inline-block", border: "1px solid #e2e8f0" }} />{l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Yearly Wellness + Compliance ── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#10b981", margin: 0 }}>Master Report</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Yearly Wellness Score with Anomaly Flags</h2>
            <div style={{ height: 200, position: "relative" }}><canvas ref={wellnessRef} /></div>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: "8px 0 0" }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, backgroundColor: "rgba(244,63,94,0.7)", marginRight: 4 }} />
              Red bars = anomaly months (score &lt;75) · Root cause investigation recommended
            </p>
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8b5cf6", margin: 0 }}>Adherence Tracker</p>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "4px 0 16px", letterSpacing: "-0.01em" }}>Compliance Thresholds</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {complianceRows.map((row) => (
                <div key={row.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{row.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>{row.pct}%</span>
                  </div>
                  <div style={{ height: 7, width: "100%", backgroundColor: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${row.pct}%`, backgroundColor: row.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
          <p style={{ fontSize: 10, color: "#cbd5e1", fontWeight: 600, letterSpacing: "0.05em", margin: 0 }}>
            DINA-AI — Digital Intelligent Natural Ayurvedic Assistant · Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </main>

      <Navbar />
    </div>
  );
}

// ─── Helper: load script from CDN once ───────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}