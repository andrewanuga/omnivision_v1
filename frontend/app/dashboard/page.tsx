"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  createInitialSimulation,
  tickSimulation,
  SimulationState,
} from "@/lib/simulation/missionSimulation";
import { UavTelemetry, TargetDetection, FlightMode, DegradationMode } from "@/lib/adapters/types";

export default function OperatorDashboardPage() {
  const [sim, setSim] = useState<SimulationState>(createInitialSimulation);
  const [selectedUavId, setSelectedUavId] = useState<string>("UAV-01");
  const [faultStatus, setFaultStatus] = useState<string>("Nominal — P2P Fabric Synced");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngleRef = useRef<number>(0);

  // Simulation tick loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSim((prev) => tickSimulation(prev));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tactical Canvas Render Loop
  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      sweepAngleRef.current = (sweepAngleRef.current + 0.015) % (Math.PI * 2);

      // Background grid
      ctx.fillStyle = "#08080a";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Geo coordinates scale
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "9px monospace";
      ctx.fillText("GRID: 1000m x 800m [WGS84 ZONE 10N] | LAT: 37.7749° N, LON: 122.4194° W", 14, 20);
      ctx.fillText("SCALE: 1 CELL = 50m", width - 130, 20);

      // Search Boundary Box
      ctx.strokeStyle = "rgba(185, 188, 196, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.setLineDash([]);

      // Partition Split Line (if partitioned)
      if (sim.isPartitioned) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 40);
        ctx.lineTo(width / 2, height - 40);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        ctx.font = "10px monospace";
        ctx.fillText("PARTITION BOUNDARY (P2P RF BLOCKED)", width / 2 - 110, 56);
      }

      // Radar Sweep
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.45;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sweep gradient cone
      const sa = sweepAngleRef.current;
      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      grad.addColorStop(0, "rgba(52, 211, 153, 0.1)");
      grad.addColorStop(1, "rgba(52, 211, 153, 0)");
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sa, sa + 0.35);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Render Target Detections
      sim.detections.forEach((tgt) => {
        const sx = (tgt.x / 1000) * (width - 80) + 40;
        const sy = (tgt.y / 800) * (height - 80) + 40;

        // Pulsing target bracket
        ctx.strokeStyle =
          tgt.type === "PERSON"
            ? "rgba(52, 211, 153, 0.9)"
            : tgt.type === "VEHICLE"
            ? "rgba(56, 189, 248, 0.9)"
            : "rgba(251, 191, 36, 0.9)";
        ctx.lineWidth = 1.5;

        const size = 12;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(sx - size, sy - size + 4);
        ctx.lineTo(sx - size, sy - size);
        ctx.lineTo(sx - size + 4, sy - size);
        // Top-right
        ctx.moveTo(sx + size - 4, sy - size);
        ctx.lineTo(sx + size, sy - size);
        ctx.lineTo(sx + size, sy - size + 4);
        // Bottom-left
        ctx.moveTo(sx - size, sy + size - 4);
        ctx.lineTo(sx - size, sy + size);
        ctx.lineTo(sx - size + 4, sy + size);
        // Bottom-right
        ctx.moveTo(sx + size - 4, sy + size);
        ctx.lineTo(sx + size, sy + size);
        ctx.lineTo(sx + size, sy + size - 4);
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = "9px monospace";
        ctx.fillText(`${tgt.type} (${Math.round(tgt.confidence * 100)}%)`, sx + 14, sy + 3);
      });

      // Render Comms Mesh Lines between reachable alive UAVs
      const aliveUavs = sim.uavs.filter((u) => u.isAlive);
      ctx.lineWidth = 1;
      for (let i = 0; i < aliveUavs.length; i++) {
        for (let j = i + 1; j < aliveUavs.length; j++) {
          const u1 = aliveUavs[i];
          const u2 = aliveUavs[j];

          // Skip link if partitioned across groups
          if (sim.isPartitioned && u1.partitionGroup !== u2.partitionGroup) continue;

          const x1 = (u1.x / 1000) * (width - 80) + 40;
          const y1 = (u1.y / 800) * (height - 80) + 40;
          const x2 = (u2.x / 1000) * (width - 80) + 40;
          const y2 = (u2.y / 800) * (height - 80) + 40;

          ctx.strokeStyle = sim.commsDegraded
            ? "rgba(245, 158, 11, 0.25)"
            : "rgba(52, 211, 153, 0.2)";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Render UAVs
      sim.uavs.forEach((uav) => {
        const sx = (uav.x / 1000) * (width - 80) + 40;
        const sy = (uav.y / 800) * (height - 80) + 40;

        if (!uav.isAlive) {
          // Dead node marker
          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx - 8, sy - 8);
          ctx.lineTo(sx + 8, sy + 8);
          ctx.moveTo(sx + 8, sy - 8);
          ctx.lineTo(sx - 8, sy + 8);
          ctx.stroke();
          ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
          ctx.font = "9px monospace";
          ctx.fillText(`${uav.callsign} [LOST]`, sx + 12, sy + 3);
          return;
        }

        // Flight Breadcrumbs trail
        if (uav.path.length > 1) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          uav.path.forEach((pt, idx) => {
            const px = (pt.x / 1000) * (width - 80) + 40;
            const py = (pt.y / 800) * (height - 80) + 40;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        }

        // Sensor Field of View Cone
        const rad = ((uav.headingDeg - 90) * Math.PI) / 180;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(rad);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 32, -0.4, 0.4);
        ctx.closePath();
        ctx.fillStyle =
          uav.degradationMode === "REDUCED_CAPABILITY"
            ? "rgba(245, 158, 11, 0.08)"
            : "rgba(255, 255, 255, 0.06)";
        ctx.fill();
        ctx.restore();

        // Elected Captain Halo
        if (uav.isCaptain) {
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Selected halo
        if (uav.id === selectedUavId) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(sx, sy, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // UAV Icon (Chevron/Aircraft)
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(((uav.headingDeg - 90) * Math.PI) / 180);
        ctx.fillStyle = uav.protocol === "MAVLink 2.0" ? "#ffffff" : "#b9bcc4";
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Label
        ctx.fillStyle = uav.isCaptain ? "#eab308" : "rgba(255, 255, 255, 0.85)";
        ctx.font = "10px monospace";
        ctx.fillText(
          `${uav.callsign}${uav.isCaptain ? " ★" : ""}`,
          sx + 10,
          sy - 8
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "8px monospace";
        ctx.fillText(`${uav.flightMode}`, sx + 10, sy + 3);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [sim, selectedUavId]);

  // Operator Command Actions (FR-14)
  const handleTogglePause = () => {
    setSim((prev) => {
      const isPaused = !prev.isPaused;
      const newEvt = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 19),
        level: "WARN" as const,
        source: "OPERATOR",
        message: isPaused
          ? "Operator override: FLEET PAUSED (Holding position)."
          : "Operator override: FLEET RESUMED (Search patterns active).",
      };
      return {
        ...prev,
        isPaused,
        events: [newEvt, ...prev.events],
      };
    });
  };

  const handleRecallAll = () => {
    setSim((prev) => {
      const newUavs = prev.uavs.map((u) => ({
        ...u,
        flightMode: "RTL" as FlightMode,
        degradationMode: "RETURN_TO_RALLY" as DegradationMode,
      }));
      const newEvt = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString().substring(11, 19),
        level: "CRITICAL" as const,
        source: "OPERATOR",
        message: "Operator command: RECALL ALL TO RALLY POINT (RTL triggered).",
      };
      return {
        ...prev,
        uavs: newUavs,
        events: [newEvt, ...prev.events],
      };
    });
    setFaultStatus("Operator Recall Active — Fleet Returning to Base");
  };

  // Fault Injections (FR-7)
  const handleKillCaptain = () => {
    setFaultStatus("FAULT INJECTED: Captain Node Destroyed (Testing Re-election < 5s)");
    setSim((prev) => {
      const deadCaptain = prev.uavs.find((u) => u.isCaptain);
      const nextUavs = prev.uavs.map((u) => {
        if (u.isCaptain) {
          return { ...u, isAlive: false, isCaptain: false, flightMode: "DISARMED" as FlightMode };
        }
        return u;
      });

      // Find first reachable alive peer to become the new captain
      const newCap = nextUavs.find((u) => u.isAlive);
      if (newCap) {
        newCap.isCaptain = true;
      }

      const evtLoss = {
        id: `evt-${Date.now()}-1`,
        timestamp: new Date().toISOString().substring(11, 19),
        level: "CRITICAL" as const,
        source: "FAULT_INJECTION",
        message: `Heartbeat timed out: ${deadCaptain?.callsign || "Captain"} LOST. Triggering P2P election.`,
      };
      const evtElection = {
        id: `evt-${Date.now()}-2`,
        timestamp: new Date().toISOString().substring(11, 19),
        level: "SUCCESS" as const,
        source: "P2P_RAFT_ELECTION",
        message: `New Fleet Captain elected: ${newCap?.callsign} (${newCap?.id}) in 3.42s (< 5.0s target). Tasks reallocated.`,
      };

      return {
        ...prev,
        uavs: nextUavs,
        captainId: newCap?.id || "NONE",
        events: [evtElection, evtLoss, ...prev.events],
      };
    });
  };

  const handleTogglePartition = () => {
    setSim((prev) => {
      const isPartitioned = !prev.isPartitioned;
      let newEvents = [...prev.events];

      if (isPartitioned) {
        setFaultStatus("NETWORK PARTITION: Fleet Split into Group A and Group B");
        newEvents.unshift({
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          level: "CRITICAL",
          source: "NETEM_FAULT",
          message: "Simulated RF jamming / split-brain barrier. Fleet divided into [A: 3 UAVs, B: 3 UAVs].",
        });
      } else {
        setFaultStatus("PARTITION HEALED: CRDT World-Model Merged (0 Detections Lost)");
        newEvents.unshift({
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString().substring(11, 19),
          level: "SUCCESS",
          source: "CRDT_MERGE",
          message: "Partition resolved. Synchronized grow-only detection sets across mesh. 0 lost detections.",
        });
      }

      return {
        ...prev,
        isPartitioned,
        events: newEvents,
      };
    });
  };

  const handleThrottleComms = () => {
    setSim((prev) => {
      const commsDegraded = !prev.commsDegraded;
      setFaultStatus(
        commsDegraded
          ? "COMMS DEGRADED: Latency +85ms, Packet Loss 18% (tc/netem)"
          : "Nominal Comms Restored"
      );
      const newUavs = prev.uavs.map((u) => ({
        ...u,
        pingMs: commsDegraded ? u.pingMs + 75 : Math.max(12, u.pingMs - 75),
        packetLossPct: commsDegraded ? 16.5 : 0.8,
      }));
      return {
        ...prev,
        commsDegraded,
        uavs: newUavs,
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString().substring(11, 19),
            level: commsDegraded ? "WARN" : "INFO",
            source: "NETEM_FAULT",
            message: commsDegraded
              ? "Packet jitter and degradation injected. Fleet fabric adapts to reduced sync frequency."
              : "Comms link recovered. Nominal telemetry stream resumed.",
          },
          ...prev.events,
        ],
      };
    });
  };

  const handleDisableSensor = () => {
    setSim((prev) => {
      const target = prev.uavs.find((u) => u.id === selectedUavId && u.isAlive);
      if (!target) return prev;

      const nextOk = !target.cameraOk;
      const nextUavs = prev.uavs.map((u) => {
        if (u.id === target.id) {
          return {
            ...u,
            cameraOk: nextOk,
            degradationMode: (nextOk ? "NOMINAL" : "REDUCED_CAPABILITY") as DegradationMode,
            flightMode: (nextOk ? "SEARCH_PATROL" : "HOLD_RELAY") as FlightMode,
          };
        }
        return u;
      });

      setFaultStatus(
        nextOk
          ? `Sensor Restored on ${target.callsign}`
          : `Sensor Loss on ${target.callsign}: Switched to Degraded Hold & Relay`
      );

      return {
        ...prev,
        uavs: nextUavs,
        events: [
          {
            id: `evt-${Date.now()}`,
            timestamp: new Date().toISOString().substring(11, 19),
            level: nextOk ? "INFO" : "WARN",
            source: "DEGRADATION_MGR",
            message: nextOk
              ? `${target.callsign} primary camera restored. Rejoining standard search patrol.`
              : `${target.callsign} primary camera offline. Degraded mode triggered: holding position as radio relay.`,
          },
          ...prev.events,
        ],
      };
    });
  };

  const handleReset = () => {
    setSim(createInitialSimulation());
    setFaultStatus("All Systems Reset — Nominal Simulation Running");
  };

  const activeUav = sim.uavs.find((u) => u.id === selectedUavId) || sim.uavs[0];

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-white/20">
      {/* Top Tactical Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur-md px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
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
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE OPERATOR DASHBOARD</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-white/60">
            <div>
              <span className="text-white/40">CAPTAIN: </span>
              <span className="text-amber-300 font-semibold">{sim.captainId}</span>
            </div>
            <div>
              <span className="text-white/40">COVERAGE: </span>
              <span className="text-white font-semibold">{sim.coveragePct}%</span>
            </div>
            <div>
              <span className="text-white/40">DETECTIONS: </span>
              <span className="text-white font-semibold">{sim.detections.length} TARGETS</span>
            </div>
            <div>
              <span className="text-white/40">STATUS: </span>
              <span className={sim.isPartitioned || sim.commsDegraded ? "text-amber-400 font-medium" : "text-emerald-400 font-medium"}>
                {faultStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/mission-report"
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 font-semibold text-white transition hover:bg-white/15"
            >
              Mission Report →
            </Link>
            <Link
              href="/adapters"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/70 transition hover:text-white hover:bg-white/5"
            >
              Adapter Guide
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-white/70 transition hover:text-white hover:bg-white/5"
            >
              Landing Page
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="p-4 md:p-6 max-w-[1700px] mx-auto space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Active UAV Fleet</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl text-steel">
                {sim.uavs.filter((u) => u.isAlive).length} / {sim.uavs.length}
              </span>
              <span className="text-xs text-emerald-400 font-mono">P2P MESH</span>
            </div>
            <div className="mt-1 text-[11px] text-white/40">4 MAVLink 2.0 · 2 Legacy Proto</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Elected Fleet Captain</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl text-amber-300">
                {sim.uavs.find((u) => u.isCaptain)?.callsign || "FAILOVER"}
              </span>
              <span className="text-xs text-white/50 font-mono">RAFT PROTO</span>
            </div>
            <div className="mt-1 text-[11px] text-white/40">Auto failover target: &lt; 5.0s</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Search Area Coverage</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl text-steel">{sim.coveragePct}%</span>
              <span className="text-xs text-white/50 font-mono">1000m × 800m</span>
            </div>
            <div className="mt-1 text-[11px] text-white/40">CBBA decentralized allocation</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50">Edge AI Detections</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl text-steel">{sim.detections.length}</span>
              <span className="text-xs text-emerald-400 font-mono">68% LIGHT MODEL</span>
            </div>
            <div className="mt-1 text-[11px] text-white/40">0 lost post-partition merge</div>
          </div>
        </div>

        {/* Tactical Center: 2D Canvas Map & Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Left: Tactical Map and Operator Controls */}
          <div className="space-y-4">
            <div className="relative rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
              {/* Tactical Canvas Header */}
              <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-mono text-xs text-white/90 font-semibold tracking-wider">
                    TACTICAL AREA MAP · DISASTER SECTOR BRAVO
                  </span>
                </div>
                <div className="font-mono text-xs text-white/50 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  RADAR SWEEP: 30 RPM
                </div>
              </div>

              {/* Canvas viewport */}
              <canvas
                ref={canvasRef}
                width={960}
                height={580}
                className="w-full h-auto block aspect-[960/580] bg-[#050506]"
              />

              {/* Map Footer Legend */}
              <div className="border-t border-white/10 bg-white/[0.02] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/60">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full border border-amber-400 bg-amber-400/20" />
                    <span>Fleet Captain</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-white rounded-full" />
                    <span>MAVLink 2.0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 bg-steel rounded-full" />
                    <span>Legacy Proto</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded border border-emerald-400 bg-emerald-400/30" />
                    <span>Person Tgt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded border border-cyan-400 bg-cyan-400/30" />
                    <span>Vehicle Tgt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded border border-amber-400 bg-amber-400/30" />
                    <span>Hazard</span>
                  </div>
                </div>
                <div className="font-mono text-white/40">
                  COORDINATES: WGS-84 · ROS2 FABRIC
                </div>
              </div>
            </div>

            {/* Operator Control Deck (FR-14) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-white/50">Operator Command Deck (FR-14)</h3>
                  <p className="text-xs text-white/60">Meaningful Human Control — Immediate pause, override or recall at any time</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTogglePause}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      sim.isPaused
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
                    }`}
                  >
                    {sim.isPaused ? "▶ RESUME SEARCH" : "⏸ PAUSE FLEET"}
                  </button>
                  <button
                    onClick={handleRecallAll}
                    className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
                  >
                    RECALL TO RALLY POINT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Telemetry, Fault Injections, Events */}
          <div className="space-y-4">
            {/* Fault Injection Toolkit (FR-7) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-white/50">Fault Injection Toolkit (FR-7)</h3>
                <span className="text-[10px] text-amber-400 font-mono">CHAOS TESTING</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Test resilience hypotheses in simulation: node kill, RF partition, comms jitter, or sensor loss.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleKillCaptain}
                  className="rounded-lg border border-red-500/30 bg-red-950/20 p-2 text-left text-xs transition hover:bg-red-950/40"
                >
                  <div className="font-semibold text-red-300">Kill Captain Node</div>
                  <div className="text-[10px] text-white/50">Test election &lt; 5.0s</div>
                </button>
                <button
                  onClick={handleTogglePartition}
                  className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2 text-left text-xs transition hover:bg-amber-950/40"
                >
                  <div className="font-semibold text-amber-300">
                    {sim.isPartitioned ? "Heal Partition" : "Split Network (RF)"}
                  </div>
                  <div className="text-[10px] text-white/50">Test CRDT world merge</div>
                </button>
                <button
                  onClick={handleThrottleComms}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-xs transition hover:bg-white/10"
                >
                  <div className="font-semibold text-white/90">
                    {sim.commsDegraded ? "Restore Comms" : "Throttle Netem (85ms)"}
                  </div>
                  <div className="text-[10px] text-white/50">Packet loss + jitter</div>
                </button>
                <button
                  onClick={handleDisableSensor}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-xs transition hover:bg-white/10"
                >
                  <div className="font-semibold text-white/90">Disable Camera</div>
                  <div className="text-[10px] text-white/50">Test degraded mode</div>
                </button>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-xs text-white/40 hover:text-white underline underline-offset-2"
                >
                  Reset all simulation faults
                </button>
              </div>
            </div>

            {/* Selected UAV Telemetry Card */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-steel">{activeUav.callsign} ({activeUav.id})</span>
                  {activeUav.isCaptain && (
                    <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                      FLEET CAPTAIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-white/50">{activeUav.protocol}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">MODE</div>
                  <div className="font-mono font-semibold text-white/90">{activeUav.flightMode}</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">BATTERY</div>
                  <div className="font-mono font-semibold text-white/90">{activeUav.batteryPct}% ({activeUav.voltageV}V)</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">ALTITUDE</div>
                  <div className="font-mono font-semibold text-white/90">{activeUav.altitudeM}m</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">SPEED</div>
                  <div className="font-mono font-semibold text-white/90">{activeUav.speedMps} m/s</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">PING / LOSS</div>
                  <div className="font-mono font-semibold text-white/90">{activeUav.pingMs}ms ({activeUav.packetLossPct}%)</div>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <div className="text-[10px] text-white/40">DEGRADATION</div>
                  <div className={`font-mono text-[11px] font-semibold ${activeUav.degradationMode !== "NOMINAL" ? "text-amber-300" : "text-emerald-400"}`}>
                    {activeUav.degradationMode}
                  </div>
                </div>
              </div>
            </div>

            {/* Fleet Fleet List (Selector) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <div className="text-xs uppercase tracking-wider text-white/50">Fleet Nodes Overview</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {sim.uavs.map((uav) => (
                  <button
                    key={uav.id}
                    onClick={() => setSelectedUavId(uav.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                      uav.id === selectedUavId
                        ? "bg-white/15 border border-white/20"
                        : "bg-white/[0.02] hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${uav.isAlive ? "bg-emerald-400" : "bg-red-500"}`} />
                      <span className="font-semibold">{uav.callsign}</span>
                      {uav.isCaptain && <span className="text-amber-300 font-mono">★</span>}
                      <span className="text-[10px] text-white/40">[{uav.protocol}]</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>{uav.batteryPct}%</span>
                      <span className={uav.degradationMode !== "NOMINAL" ? "text-amber-400" : "text-white/60"}>
                        {uav.flightMode}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Event Stream */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/50">Live Event Feed (FR-15)</span>
                <span className="text-[10px] text-white/40 font-mono">P2P AUDIT LOG</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs font-mono pr-1">
                {sim.events.slice(0, 10).map((evt) => (
                  <div key={evt.id} className="p-1.5 rounded bg-black/30 border border-white/5">
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>[{evt.timestamp}] {evt.source}</span>
                      <span
                        className={
                          evt.level === "SUCCESS"
                            ? "text-emerald-400"
                            : evt.level === "WARN"
                            ? "text-amber-400"
                            : evt.level === "CRITICAL"
                            ? "text-red-400"
                            : "text-blue-400"
                        }
                      >
                        {evt.level}
                      </span>
                    </div>
                    <p className="mt-0.5 text-white/80 leading-snug">{evt.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
