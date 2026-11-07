"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = { beam: boolean; onToggle: () => void };

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

export default function Nav({ beam, onToggle }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 py-3 md:px-8">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-ink/75 px-4 py-2.5 backdrop-blur-md">
        {/* Left Side: Back to Top & Anchor Links */}
        <div className="flex items-center gap-5">
          <button
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/90 transition hover:bg-white/20 hover:text-white"
          >
            <Icon d="M19 12H5M11 6l-6 6 6 6" />
          </button>

          <nav className="hidden lg:flex items-center gap-5 text-xs uppercase tracking-wider text-white/70">
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
            <a href="#metrics" className="transition hover:text-white">Metrics</a>
            <a href="#autonomy" className="transition hover:text-white">Autonomy</a>
          </nav>
        </div>

        {/* Center: Brand Logo & Title */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 rounded-full transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          aria-label="Omnivision Logo"
        >
          <Image
            src="/omini-logo.png"
            alt="Omnivision Logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain shadow-sm ring-1 ring-white/20"
            priority
          />
          <span className="font-semibold text-xs tracking-[0.2em] text-white/90 uppercase font-sans">
            Omnivision
          </span>
        </button>

        {/* Right Side: New Application Routes & Controls */}
        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-2 text-xs">
            <Link
              href="/dashboard"
              className="group flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-semibold text-white transition hover:bg-white/20 hover:border-white/30"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Dashboard</span>
            </Link>
            <Link
              href="/mission-report"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Mission Report
            </Link>
            <Link
              href="/adapters"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Adapters
            </Link>
          </nav>

          {/* Scan Beam Toggle */}
          <button
            role="switch"
            aria-checked={beam}
            aria-label="Toggle Scan Beam"
            title="Toggle Drone Scan Beam"
            onClick={onToggle}
            className={`relative hidden sm:block h-6 w-11 rounded-full transition ${beam ? "bg-white/40" : "bg-white/15"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${beam ? "left-[22px]" : "left-0.5"}`} />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 md:hidden"
          >
            {mobileMenuOpen ? (
              <Icon d="M6 18L18 6M6 6l12 12" />
            ) : (
              <Icon d="M4 6h16M4 12h16M4 18h16" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-ink/95 p-4 backdrop-blur-xl shadow-2xl md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Operator Dashboard</span>
              </div>
              <span>→</span>
            </Link>

            <Link
              href="/mission-report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-white/90"
            >
              <span>Mission Report (FR-15)</span>
              <span>→</span>
            </Link>

            <Link
              href="/adapters"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-white/90"
            >
              <span>Adapter Developer Guide</span>
              <span>→</span>
            </Link>

            <div className="my-2 border-t border-white/10" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center text-white/70 hover:text-white"
              >
                Architecture
              </a>
              <a
                href="#metrics"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center text-white/70 hover:text-white"
              >
                Metrics
              </a>
              <a
                href="#scenario"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center text-white/70 hover:text-white"
              >
                Demo Scenario
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center text-white/70 hover:text-white"
              >
                Contact
              </a>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white/70">
              <span>Scan Beam Effect</span>
              <button
                role="switch"
                aria-checked={beam}
                aria-label="Toggle Scan Beam"
                onClick={onToggle}
                className={`relative h-5 w-10 rounded-full transition ${beam ? "bg-white/40" : "bg-white/15"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${beam ? "left-[21px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
