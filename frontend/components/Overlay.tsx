"use client";

import Image from "next/image";
import { ss } from "@/lib/progress";

const CHIPS = [
  { k: "Fleet size", v: "4–6 UAVs", cls: "left-[36%] top-[66%]" },
  { k: "Captain re-election", v: "under 5 s", cls: "left-[8%] top-[74%]" },
  { k: "Edge inference", v: "3× faster", cls: "left-[24%] top-[84%]" },
  { k: "Frames on the light model", v: "60%+", cls: "left-[58%] top-[78%]" },
  { k: "Detections lost after a merge", v: "0", cls: "left-[10%] top-[91%]" },
];

const LEFT = [
  ["Peer-to-peer fleet fabric", "Vehicles find each other and share state directly. No ground station required.", "M5 12a3 3 0 1 0 0 .01M19 5a3 3 0 1 0 0 .01M19 19a3 3 0 1 0 0 .01M8 11l8-5M8 13l8 5"],
  ["A captain, not a command center", "Any vehicle can hold the captain role. If it drops, the fleet elects a new one on its own.", "M4 18h16M5 18 4 8l5 4 3-6 3 6 5-4-1 10"],
  ["Merge after a split", "Groups that lose contact keep working, then rejoin without losing a single detection.", "M4 5c6 0 6 7 8 7s2 7 8 7M4 19c6 0 6-7 8-7s2-7 8-7"],
];
const RIGHT = [
  ["Graceful degradation", "Lose comms, a peer, a camera or compute and the drone drops to a defined mode while the fleet reassigns its area.", "M3 12h4l3-7 4 14 3-7h4"],
  ["Edge AI cascade", "A tiny always-on detector wakes a heavier model only when needed, so small onboard computers do more.", "M4 6h16v12H4zM9 10h6v4H9z"],
  ["Legacy adapters", "MAVLink and custom protocols plug in behind one vehicle interface. No platform replacement.", "M9 7V3m6 4V3M7 7h10v5a5 5 0 0 1-10 0zM12 17v4"],
];

function Card({ t, d, icon, x, o }: { t: string; d: string; icon: string; x: number; o: number }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md"
      style={{ opacity: o, transform: `translateX(${x * (1 - o)}px)` }}
    >
      <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={icon} /></svg>
      </div>
      <h3 className="text-sm font-semibold">{t}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/60">{d}</p>
    </div>
  );
}

export default function Overlay({ p }: { p: number }) {
  const hero = 1 - ss(0.14, 0.38, p);
  const top = ss(0.5, 0.7, p);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div style={{ opacity: hero }}>
        <span aria-hidden className="absolute inset-x-0 top-24 select-none text-center font-display text-[20vw] leading-none text-white/[0.04]">OMNIVISION</span>
        <div className="absolute left-6 top-28 max-w-sm md:left-12 md:top-32" style={{ transform: `translateY(${-p * 80}px)` }}>
          <div className="mb-3 flex items-center gap-2">
            <Image
              src="/omini-logo.png"
              alt="Omnivision logo"
              width={22}
              height={22}
              className="h-5 w-5 rounded-md object-contain ring-1 ring-white/20"
              priority
            />
            <p className="text-[11px] tracking-[0.25em] text-white/50 uppercase">Simulation prototype</p>
          </div>
          <h1 className="font-display text-6xl leading-[0.95] text-steel md:text-7xl">Omnivision</h1>
          <p className="mt-4 text-lg leading-snug text-white/90">A drone fleet that keeps working when the link doesn’t.</p>
          <p className="mt-3 text-sm leading-relaxed text-white/60">Peer-to-peer coordination, edge AI and legacy adapters in one stack, for search, survey and inspection missions.</p>
        </div>
        {CHIPS.map((c, i) => {
          const o = ss(0.02 + i * 0.015, 0.1 + i * 0.015, p);
          return (
            <div key={c.k} className={`absolute hidden text-xs md:block ${c.cls}`} style={{ opacity: o * 0.9 }}>
              <div className="drift flex items-baseline gap-2" style={{ animationDelay: `${i * 0.6}s` }}>
                <span className="text-white/90">{c.k}</span>
                <span className="text-white/40">{c.v}</span>
              </div>
            </div>
          );
        })}
        <p className="absolute bottom-6 left-1/2 w-full -translate-x-1/2 px-6 text-center text-xs text-white/40">
          Design targets for the simulation prototype, not field results. Scroll to explore.
        </p>
      </div>

      <div style={{ opacity: top }} className="absolute inset-0">
        <div className="absolute inset-x-0 top-20 px-6 text-center">
          <p className="text-[11px] tracking-[0.25em] text-white/50">Seen from above</p>
          <h2 className="font-display text-3xl text-white md:text-4xl">Built for the day the link drops</h2>
        </div>
        <div className="absolute inset-x-10 bottom-16 top-40 hidden grid-cols-[minmax(0,270px)_1fr_minmax(0,270px)] gap-6 md:grid">
          <div className="flex flex-col justify-center gap-4">{LEFT.map(([t, d, i]) => <Card key={t} t={t} d={d} icon={i} x={-40} o={top} />)}</div>
          <div />
          <div className="flex flex-col justify-center gap-4">{RIGHT.map(([t, d, i]) => <Card key={t} t={t} d={d} icon={i} x={40} o={top} />)}</div>
        </div>
        <p className="absolute inset-x-0 bottom-6 px-6 text-center text-xs text-white/50">
          Observation and reporting only. No weapons or effector interfaces. An operator can pause, override or recall at any time.
        </p>
      </div>
    </div>
  );
}
