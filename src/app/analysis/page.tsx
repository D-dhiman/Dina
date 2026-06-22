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
  { label: "Yearly Wellness",  value: "83", unit: "/100", delta: "+15pts", bgClass: "bg-[#AED27D]", hexColor: "#052e16", icon: <Shield size={20} /> },
  { label: "Avg HRV",          value: "41", unit: "ms",   delta: "-3ms",   bgClass: "bg-red-200",   hexColor: "#4c0519", icon: <Heart size={20} /> },
  { label: "Sleep Efficiency", value: "79", unit: "%",    delta: "+4%",    bgClass: "bg-[#A6C7F2]", hexColor: "#082f49", icon: <Zap size={20} /> },
];

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
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Build all charts on mount
  useEffect(() => {
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    const make = (
      ref: React.RefObject<HTMLCanvasElement | null>,
      type: any,
      data: any,
      options: any
    ) => {
      if (ref.current) {
        chartsRef.current.push(new Chart(ref.current, { type, data, options }));
      }
    };

    make(hrvRef,      "line",    hrvData,          hrvOptions);
    make(sleepRef,    "bar",     sleepData,        sleepOptions);
    make(doshaRef,    "radar",   doshaData,        doshaOptions);
    make(scatterRef,  "scatter", pulseScatterData, { responsive: true, maintainAspectRatio: false });
    make(inflameRef,  "line",    inflameData,      { ...hrvOptions });
    make(wellnessRef, "bar",     wellnessData,     { ...hrvOptions });

    return () => {
      chartsRef.current.forEach((c) => c.destroy());
      chartsRef.current = [];
    };
  }, []);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);
    setDownloadError(null);

    // Snapshot every canvas → <img> so html2canvas captures rasterized chart pixels
    const canvasEls = Array.from(
      reportRef.current.querySelectorAll<HTMLCanvasElement>("canvas")
    );
    const swaps: Array<{ canvas: HTMLCanvasElement; img: HTMLImageElement; parent: Element; next: ChildNode | null }> = [];

    for (const canvas of canvasEls) {
      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.style.width  = canvas.offsetWidth  + "px";
      img.style.height = canvas.offsetHeight + "px";
      img.style.display = "block";
      const parent = canvas.parentElement!;
      const next   = canvas.nextSibling;
      parent.replaceChild(img, canvas);
      swaps.push({ canvas, img, parent, next });
    }

    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const h2c    = (window as any).html2canvas;
      const jsPDF  = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;

      if (!h2c || !jsPDF) throw new Error("PDF libraries failed to load.");

      const captured = await h2c(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#fcfdfa",
        logging: false,
        // Ensure full scroll height is captured
        windowWidth:  reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      const imgData = captured.toDataURL("image/png");
      const pdf     = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const ratio  = captured.height / captured.width;
      const imgH   = pageW * ratio;

      // If content is taller than one page, split across multiple pages
      if (imgH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        const srcH  = captured.width * (pageH / pageW); // source px height per page slice

        while (yOffset < captured.height) {
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width  = captured.width;
          sliceCanvas.height = Math.min(srcH, captured.height - yOffset);
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(captured, 0, -yOffset);
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
          yOffset += srcH;
          if (yOffset < captured.height) pdf.addPage();
        }
      }

      pdf.save(`DINA-AI-Analytics-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setDownloadError(err?.message ?? "Download failed. Please try again.");
    } finally {
      // Restore all canvases
      for (const { canvas, img, parent, next } of swaps) {
        if (next) parent.insertBefore(canvas, next);
        else parent.appendChild(canvas);
        img.remove();
      }
      setDownloading(false);
    }
  }, [downloading]);

  return (
    <div className="w-full min-h-screen bg-[#fcfdfa] pb-20 font-sans">
      <Navbar />
      <main
        ref={reportRef}
        className="w-full py-10 px-4 sm:px-6 lg:px-8 container mx-auto flex flex-col gap-8"
      >
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a1e] tracking-tight">
              DINA-AI Analytics Engine 📊
            </h1>
            <p className="text-sm text-[#8a9485] font-medium mt-1">
              Deep Ayurvedic Insights &amp; Longitudinal Health Trends
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="font-semibold py-2 px-4 rounded-xl flex items-center gap-2 text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={16} />
              <span>{downloading ? "Generating PDF…" : "Download Report PDF"}</span>
            </button>
            {downloadError && (
              <p className="text-xs text-red-500 max-w-xs text-right">{downloadError}</p>
            )}
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`${k.bgClass} border border-white/20 rounded-[32px] p-6 shadow-sm`}>
              <p className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "rgba(0,0,0,0.4)" }}>{k.label}</p>
              <span className="text-3xl font-black" style={{ color: k.hexColor }}>{k.value}</span>
            </div>
          ))}
        </div>

        {/* HRV + Sleep */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e3a1e] mb-6">Heart Rate Variability vs Resting Pulse</h2>
            <div className="h-[240px] relative"><canvas ref={hrvRef} /></div>
          </section>
          <section className="bg-[#A6C7F2] rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6" style={{ color: "#082f49" }}>Sleep Architecture</h2>
            <div className="h-[240px] relative"><canvas ref={sleepRef} /></div>
          </section>
        </div>

        {/* Dosha + Scatter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#AED27D] rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4" style={{ color: "#052e16" }}>Dosha Imbalance Map</h2>
            <div className="h-[260px] relative"><canvas ref={doshaRef} /></div>
          </section>
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e3a1e] mb-4">Pulse × Sleep Overlap</h2>
            <div className="h-[220px] relative"><canvas ref={scatterRef} /></div>
          </section>
        </div>

        {/* Inflammation + Wellness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e3a1e] mb-4">Inflammatory Index Tracker</h2>
            <div className="h-[200px] relative"><canvas ref={inflameRef} /></div>
          </section>
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e3a1e] mb-4">Longitudinal Wellness Base</h2>
            <div className="h-[200px] relative"><canvas ref={wellnessRef} /></div>
          </section>
        </div>
      </main>
    </div>
  );
}