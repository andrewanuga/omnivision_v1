"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades and lifts its children in the first time they scroll into view. */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-12 max-w-2xl md:mb-16">
      <p className="text-[11px] tracking-[0.25em] text-white/50">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-[1.02] text-steel md:text-6xl">{title}</h2>
      {sub && <p className="mt-5 text-base leading-relaxed text-white/60">{sub}</p>}
    </Reveal>
  );
}

const Wrap = ({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) => (
  <section id={id} className={`relative scroll-mt-20 px-6 py-28 md:px-12 md:py-36 ${className}`}>
    <div className="mx-auto max-w-6xl">{children}</div>
  </section>
);

/* ---------- content (from the PRD) ---------- */

const PROBLEMS = [
  ["The link is a single point of failure", "Most uncrewed systems lean on a ground station. When the link degrades or a vehicle drops out, missions fail or vehicles simply return home."],
  ["Modern AI is too heavy for the airframe", "State-of-the-art detection models outgrow the small onboard computers most drones actually carry."],
  ["Legacy protocols make change painful", "Existing platforms speak older or proprietary protocols, so adding new software means replacing hardware."],
];

const STEPS = [
  ["Normal operations", "The fleet divides the area, each vehicle flies its search pattern and detections are shared. The operator sees a live map and detection feed."],
  ["Comms degradation", "Latency spikes and packet loss rise. The fleet keeps coordinating at reduced update rates."],
  ["Network partition", "The fleet splits into two groups. Each elects its own captain and carries on, then merges world models on reconnection."],
  ["Captain loss", "The current captain is taken out. A new one is elected within the target time and the mission continues."],
  ["Component failure", "A vehicle loses its camera or main compute and drops to a degraded mode: a smaller model, or relay-and-support duty."],
  ["Mission complete", "Coverage finishes and the fleet produces a report: coverage %, detections and a timeline of every failure and recovery."],
];

const LAYERS = [
  ["Operator dashboard + mission report", "Live map, vehicle health, captain identity, comms graph, detections. Pause, override or recall at any time.", "React · map library"],
  ["Fleet fabric", "Discovery, captain election, decentralized task allocation, world-model merge and health monitoring.", "Zenoh / DDS · Raft-style election · CBBA / auctions · CRDTs"],
  ["Per-vehicle autonomy agent", "Local mission plan, degradation mode manager and the edge AI cascade.", "ROS 2 · ONNX Runtime · INT8 / pruning / distillation"],
  ["Vehicle abstraction + adapters", "One small, typed vehicle interface in front of every platform.", "MAVLink (pymavlink / MAVSDK) · mock legacy protocol"],
  ["Simulation + fault injection", "Multiple simulated UAVs with cameras, and on-demand faults: latency, loss, partitions, node death.", "PX4 SITL · Gazebo · tc/netem · Docker"],
];

const METRICS = [
  ["≥ 90%", "Mission completion", "Nominal runs reaching required coverage, across 30+ seeded runs per scenario. ≥ 75% under injected faults."],
  ["< 5 s", "Captain re-election", "From captain loss to a new captain accepted by all reachable peers."],
  ["< 10 s", "Recovery after vehicle loss", "Until a lost vehicle's tasks are reassigned to the rest of the fleet."],
  ["0", "Detections lost after merge", "World models converge after a partition heals, with nothing dropped."],
  ["3×", "Faster edge inference", "Per-frame latency versus the baseline model, under emulated edge limits."],
  ["≤ 5 pts", "Accuracy retention", "mAP / F1 of the compressed model versus the uncompressed baseline."],
  ["≥ 60%", "Frames on the light model", "Share of frames the cascade handles without waking the heavy model."],
  ["100%", "Adapter fidelity", "Command and telemetry round-trip success on the defined test suite."],
];

const MODES = [
  ["Continue mission", "Comms lost, but the local plan is intact. Keep searching and buffer detections."],
  ["Hold and relay", "Hover at a useful point and bridge messages between separated peers."],
  ["Reduced-capability search", "Camera or compute degraded. Switch to a smaller model and a narrower task."],
  ["Return to rally point", "When nothing useful remains, recover safely to a pre-agreed location."],
];

const USE_CASES = [
  ["Disaster response", "Collapsed structures, flooded valleys, wildfire edges, where infrastructure is the first thing to go."],
  ["Search and rescue", "Wide-area search for people that can't stop because one radio dropped."],
  ["Infrastructure inspection", "Pipelines, power lines and industrial yards with patchy coverage."],
  ["Perimeter monitoring", "Persistent observation and reporting over large, remote sites."],
];

const ROADMAP = [
  ["Now", "Simulation prototype", "4–6 simulated UAVs, fault injection, edge benchmarks and a working MAVLink adapter."],
  ["Phase 2", "Hardware-in-the-loop", "A low-cost flight controller and companion computer, real edge benchmarks, a second real adapter."],
  ["Phase 3", "Small physical fleet", "A controlled, legally approved test environment, real radio mesh and GPS-denied navigation experiments."],
  ["Phase 4", "Hardening", "Security hardening, third-party review and certification paths with an experienced partner."],
];

const PRINCIPLES = [
  ["Observation and reporting only", "No weapons, payload-release, target-selection or engagement logic. No interface to any effector."],
  ["A human can always step in", "Whenever a link exists, the operator can pause, override or recall any vehicle or the whole fleet."],
  ["No offensive capability", "Network degradation is used only to test our own resilience. No jamming, no offensive cyber."],
  ["Honest numbers", "Seeded, reproducible runs, published methods and failure cases. A research architecture, not \"military grade\"."],
];

/* ---------- sections ---------- */

export default function Sections() {
  return (
    <div className="relative z-10 bg-ink">

      {/* Problem */}
      <Wrap id="problem">
        <Heading
          eyebrow="The problem"
          title="Capable but fragile, or robust but limited"
          sub="Today's teams are forced to choose. Omnivision is a software layer that removes the trade-off: one coordination fabric, the best AI the hardware can afford, and graceful degradation instead of failure."
        />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          {PROBLEMS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 100} className="h-full">
              <div className="h-full bg-ink p-8">
                <span className="font-display text-5xl text-white/10">0{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* Demo scenario */}
      <Wrap id="scenario" className="border-t border-white/5">
        <Heading
          eyebrow="The demo"
          title="One mission. Everything goes wrong."
          sub="A fleet of 4–6 simulated UAVs searches a defined area for people, vehicles and hazard markers, while we break it on purpose."
        />
        <ol className="relative ml-3 border-l border-white/10 md:ml-0 md:grid md:grid-cols-2 md:gap-x-16 md:border-l-0">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="relative pb-12 pl-8 md:pl-0">
              <Reveal delay={(i % 2) * 120}>
                <div className="flex items-start gap-5">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border border-white/40 bg-ink md:static md:mt-1 md:grid md:h-10 md:w-10 md:shrink-0 md:place-items-center md:text-xs md:text-white/70">
                    <span className="hidden md:inline">{i + 1}</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Wrap>

      {/* Architecture */}
      <Wrap id="architecture" className="border-t border-white/5">
        <Heading
          eyebrow="Architecture"
          title="Five layers, one stack"
          sub="Each area is a separate package with a documented interface. Any vehicle can serve as the gateway to the operator."
        />
        <div className="flex flex-col gap-3">
          {LAYERS.map(([t, d, tech], i) => (
            <Reveal key={t} delay={i * 80}>
              <div
                className="group grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06] md:grid-cols-[48px_1fr_1.1fr] md:items-center"
                style={{ marginLeft: `${i * 2}%`, marginRight: `${(LAYERS.length - 1 - i) * 2}%` }}
              >
                <span className="font-display text-2xl text-white/25">L{LAYERS.length - i}</span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{d}</p>
                </div>
                <p className="text-xs leading-relaxed tracking-wide text-white/40 md:text-right">{tech}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* Degradation modes */}
      <Wrap id="autonomy" className="border-t border-white/5">
        <div className="grid gap-16 md:grid-cols-[1fr_1.2fr] md:items-start">
          <Heading
            eyebrow="Autonomy under loss"
            title="Degrade on purpose, not by accident"
            sub="Every vehicle carries a local mission plan and an explicit policy for loss of comms, peers or components. Faults trigger clean, testable transitions, never improvisation."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {MODES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
                  <div className="mb-4 flex items-center gap-2 text-[11px] tracking-[0.2em] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/60" />MODE {i + 1}
                  </div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Wrap>

      {/* Metrics */}
      <Wrap id="metrics" className="border-t border-white/5">
        <Heading
          eyebrow="Success metrics"
          title="Numbers we hold ourselves to"
          sub="Starting targets for the simulation prototype, calibrated after baseline runs. Design targets, not field results."
        />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map(([v, k, d], i) => (
            <Reveal key={k} delay={(i % 4) * 80} className="h-full">
              <div className="h-full bg-ink p-7">
                <div className="font-display text-5xl text-steel">{v}</div>
                <h3 className="mt-4 text-sm font-semibold">{k}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/50">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* Use cases */}
      <Wrap id="use-cases" className="border-t border-white/5">
        <Heading eyebrow="Where it matters" title="Built for places the network forgets" />
        <div className="grid gap-4 md:grid-cols-4">
          {USE_CASES.map(([t, d], i) => (
            <Reveal key={t} delay={i * 90} className="h-full">
              <div className="flex h-full min-h-[220px] flex-col justify-end rounded-2xl border border-white/10 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.08),transparent)] p-6">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* Roadmap */}
      <Wrap id="roadmap" className="border-t border-white/5">
        <Heading eyebrow="Roadmap" title="From simulation to the sky" sub="A pilot track with disaster-response, inspection and infrastructure partners runs in parallel, on the same core architecture." />
        <div className="relative grid gap-8 md:grid-cols-4">
          <div aria-hidden className="absolute left-0 right-0 top-[7px] hidden h-px bg-gradient-to-r from-white/50 via-white/15 to-transparent md:block" />
          {ROADMAP.map(([when, t, d], i) => (
            <Reveal key={t} delay={i * 110}>
              <div className="relative">
                <span className={`block h-3.5 w-3.5 rounded-full border ${i === 0 ? "border-white bg-white" : "border-white/40 bg-ink"}`} />
                <p className="mt-6 text-[11px] tracking-[0.25em] text-white/40">{when.toUpperCase()}</p>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* Principles */}
      <Wrap id="principles" className="border-t border-white/5">
        <Heading eyebrow="Principles" title="What we will and won't build" sub="Written down before we pitch anyone. It protects the team and makes us a more credible partner." />
        <div className="grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map(([t, d], i) => (
            <Reveal key={t} delay={(i % 2) * 100}>
              <div className="flex gap-5 rounded-2xl border border-white/10 p-6">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5" />
                </svg>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* CTA */}
      <section id="contact" className="relative scroll-mt-20 overflow-hidden border-t border-white/5 px-6 py-32 md:px-12 md:py-44">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display text-[20vw] leading-none text-white/[0.03]">OMNIVISION</span>
        <Reveal className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/omini-logo.png"
              alt="Omnivision Logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-contain ring-1 ring-white/20 shadow-xl"
            />
          </div>
          <p className="text-[11px] tracking-[0.25em] text-white/50">Work with us</p>
          <h2 className="mt-4 font-display text-5xl leading-[1] text-steel md:text-7xl">Help us keep the fleet flying</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60">
            We&apos;re looking for mentors, pilot partners and funders in disaster response, inspection and infrastructure. See the demo, break it, and tell us what you need to say yes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white/80">Launch Operator Dashboard</Link>
            <Link href="/mission-report" className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/50">View Mission Report</Link>
            <Link href="/adapters" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition hover:text-white hover:border-white/30">Adapter Guide</Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/5 px-6 py-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-white/40 md:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/omini-logo.png"
              alt="Omnivision Logo"
              width={20}
              height={20}
              className="h-5 w-5 rounded-md object-contain ring-1 ring-white/15"
            />
            <span>Omnivision · Resilient decentralized autonomy stack</span>
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
            <Link href="/mission-report" className="hover:text-white transition">Mission Report</Link>
            <Link href="/adapters" className="hover:text-white transition">Adapters</Link>
          </div>
          <p>Simulation prototype. A research architecture, not a certified or fielded product.</p>
        </div>
      </footer>
    </div>
  );
}
