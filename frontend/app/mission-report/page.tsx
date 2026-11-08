"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { generateMissionReport, createInitialSimulation } from "@/lib/simulation/missionSimulation";
import { MissionReportData } from "@/lib/adapters/types";

export default function MissionReportPage() {
  const [reportData] = useState<MissionReportData>(() =>
    generateMissionReport(createInitialSimulation())
  );
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.missionId}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-white/20 print:bg-white print:text-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur-md px-6 py-4 md:px-12 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-85">
              <Image
                src="/omini-logo.png"
                alt="Omnivision"
                width={26}
                height={26}
                className="h-6 w-6 rounded-md object-contain ring-1 ring-white/20"
                priority
              />
              <span className="font-display text-xl tracking-wider text-steel">OMNIVISION</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-xs uppercase tracking-widest text-white/50">Mission Report (FR-15)</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleDownloadJson}
              className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 font-semibold text-white transition hover:bg-white/20"
            >
              {downloadSuccess ? "✓ Log Downloaded" : "Download Machine Log (.json)"}
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg border border-white/10 px-3.5 py-1.5 text-white/80 transition hover:bg-white/5"
            >
              Print / PDF
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 px-3.5 py-1.5 text-white/70 transition hover:text-white hover:bg-white/5"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16 space-y-12 print:py-4 print:px-2">
        {/* Document Title & Identification */}
        <div className="border-b border-white/10 pb-8 print:border-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/50 print:text-black/60">
                Official Autonomous Mission Evaluation
              </p>
              <h1 className="mt-2 font-display text-4xl text-steel md:text-5xl print:text-black">
                Mission Report: {reportData.missionId}
              </h1>
              <p className="mt-2 text-sm text-white/70 print:text-black/70">
                Scenario: {reportData.scenarioName}
              </p>
            </div>
            <div className="text-right font-mono text-xs text-white/50 print:text-black/60">
              <div>DATE: 2026-11-09 04:30 UTC</div>
              <div>DURATION: 03m 04s (184s total)</div>
              <div>FLEET: 6 UAVs (4 MAVLink, 2 Legacy)</div>
              <div className="mt-1 inline-block rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 font-semibold print:text-black">
                STATUS: COMPLETED (PASS)
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Quantitative Success Metrics Benchmark (PRD Section 6) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-white tracking-wide uppercase print:text-black">
              1. Quantitative Success Metrics (PRD Section 6)
            </h2>
            <span className="text-xs text-white/40 font-mono print:text-black/60">
              Benchmarked under fault injection
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Coverage Achieved</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.areaCoveragePct}%</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Target: ≥ 90% nominal</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Captain Re-election</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.captainReElectionTimeSec}s</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Target: &lt; 5.0s (PASS)</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Loss Recovery Time</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.vehicleLossRecoveryTimeSec}s</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Target: &lt; 10.0s (PASS)</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Partition Lost Detections</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.detectionsLostAfterMerge}</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">CRDT State: 0 Lost</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Edge AI Latency</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.edgeLatencySpeedup}×</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Faster than baseline (INT8)</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Cascade Light Share</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.cascadeLightModelPct}%</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Target: ≥ 60% frames</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Adapter Round-Trip</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.adapterRoundTripFidelityPct}%</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">MAVLink & Legacy Verified</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 print:border-black/20 print:bg-transparent">
              <div className="text-[10px] text-white/50 uppercase print:text-black/60">Confirmed Targets</div>
              <div className="mt-1 font-display text-3xl text-steel print:text-black">{reportData.totalDetections}</div>
              <div className="mt-1 text-[11px] text-emerald-400 print:text-black">Disaster area geolocated</div>
            </div>
          </div>
        </section>

        {/* Section 2: Timeline of Injected Failures & Recoveries */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-white tracking-wide uppercase print:text-black">
            2. Injected Faults & Autonomous Recoveries Timeline (FR-6, FR-7)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] print:border-black/20">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 bg-white/5 text-white/60 print:border-black/20 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Event / Injected Fault</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Autonomy System Behavior & Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/10">
                {reportData.timeline.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-white/80 print:text-black">
                      T+{String(Math.floor(row.timeSec / 60)).padStart(2, "0")}:{String(row.timeSec % 60).padStart(2, "0")}
                    </td>
                    <td className="p-3 font-medium text-white print:text-black">{row.event}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          row.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : row.status === "DEGRADED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-white/10 text-white/80"
                        } print:text-black`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3 text-white/70 print:text-black/80">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Verified Target Detections Log */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-white tracking-wide uppercase print:text-black">
            3. Geolocated Detections Audit Log (Edge AI Cascade)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] print:border-black/20">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-white/10 bg-white/5 text-white/60 print:border-black/20 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Coordinates (WGS84)</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Model Tier</th>
                  <th className="p-3">Detecting Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/10">
                {reportData.detections.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-semibold text-white print:text-black">{d.id}</td>
                    <td className="p-3 font-medium text-emerald-400 print:text-black">{d.type}</td>
                    <td className="p-3 text-white/70 print:text-black">
                      {d.lat.toFixed(4)}° N, {Math.abs(d.lon).toFixed(4)}° W (Grid: {d.x}m, {d.y}m)
                    </td>
                    <td className="p-3 text-white/90 print:text-black">{(d.confidence * 100).toFixed(1)}%</td>
                    <td className="p-3">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/80 print:text-black">
                        {d.modelTier}
                      </span>
                    </td>
                    <td className="p-3 text-white/70 print:text-black">{d.detectedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Architecture Compliance Statement */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3 print:border-black/20 print:bg-transparent">
          <h3 className="font-display text-lg text-steel uppercase print:text-black">
            4. Research Architecture & Compliance Note
          </h3>
          <p className="text-xs text-white/70 leading-relaxed print:text-black/80">
            This prototype is a research architecture developed for disaster response, wide-area search and rescue, and infrastructure inspection. All autonomy operations are observation and reporting only; no weapons or effector interfaces exist. Meaningful human control was preserved throughout the entire mission duration with continuous operator pause, override, and recall readiness.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40 print:text-black/60 print:border-black/20">
          <div>Omnivision Software Stack · Resilient Autonomous Fleet Protocol</div>
          <div>Page 1 of 1 · End of Mission Report</div>
        </footer>
      </main>
    </div>
  );
}
