"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AdaptersDeveloperGuidePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "mavlink" | "legacy" | "stanag">("overview");

  return (
    <div className="min-h-screen bg-ink text-white selection:bg-white/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur-md px-6 py-4 md:px-12">
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
            <span className="text-xs uppercase tracking-widest text-white/50">Adapter Developer Guide</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 font-semibold text-white transition hover:bg-white/20"
            >
              Operator Dashboard →
            </Link>
            <Link
              href="/mission-report"
              className="rounded-lg border border-white/10 px-3.5 py-1.5 text-white/70 transition hover:text-white hover:bg-white/5"
            >
              Mission Report
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-white/10 px-3.5 py-1.5 text-white/70 transition hover:text-white hover:bg-white/5"
            >
              Landing Page
            </Link>
          </div>
        </div>
      </header>

      {/* Guide Body */}
      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16 space-y-12">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/50">
            Vehicle Abstraction Layer · Member 4 Workstream
          </p>
          <h1 className="mt-3 font-display text-4xl text-steel md:text-6xl">
            Adapter Developer Guide
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60 leading-relaxed">
            The Common Vehicle Interface (CVI) decouples Omnivision&apos;s decentralized autonomy fabric from underlying flight hardware. Add new or legacy platforms without rewriting the coordination stack.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "overview"
                ? "bg-white text-ink"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            1. CVI Architecture & Types
          </button>
          <button
            onClick={() => setActiveTab("mavlink")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "mavlink"
                ? "bg-white text-ink"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            2. MAVLink 2.0 Adapter
          </button>
          <button
            onClick={() => setActiveTab("legacy")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "legacy"
                ? "bg-white text-ink"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            3. Mock Legacy Adapter
          </button>
          <button
            onClick={() => setActiveTab("stanag")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "stanag"
                ? "bg-white text-ink"
                : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            4. NATO STANAG 4586 Mapping
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="font-display text-2xl text-white">Common Vehicle Interface (CVI)</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                The abstraction boundary is defined as an abstract base class <code className="text-amber-300">VehicleAdapter</code> in <code className="text-white/90">adapters/interface.py</code>. It enforces a strictly typed contract so that the fleet coordinator, Raft leader election, and consensus bundle task allocation operate purely on standardized coordinate spaces.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                  <div className="font-mono text-xs text-white/50 uppercase">Input: VehicleCommand</div>
                  <ul className="text-xs space-y-1.5 text-white/80 font-mono">
                    <li>• <span className="text-emerald-400">ARM / DISARM</span> — Motor propulsion gate</li>
                    <li>• <span className="text-emerald-400">TAKEOFF(altitude_m)</span> — Controlled vertical climb</li>
                    <li>• <span className="text-emerald-400">GOTO_WAYPOINT(lat, lon, alt, speed)</span></li>
                    <li>• <span className="text-emerald-400">SET_VELOCITY(vx, vy, vz)</span> — NED velocity steering</li>
                    <li>• <span className="text-emerald-400">RETURN_TO_LAUNCH</span> — Home/Rally recovery</li>
                    <li>• <span className="text-emerald-400">SET_DEGRADATION_MODE</span> — Explicit FR-6 faults</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                  <div className="font-mono text-xs text-white/50 uppercase">Output: VehicleTelemetry (Broadcast)</div>
                  <ul className="text-xs space-y-1.5 text-white/80 font-mono">
                    <li>• <span className="text-cyan-400">position</span> — WGS84 lat, lon, alt_msl, alt_rel</li>
                    <li>• <span className="text-cyan-400">velocity</span> — NED frame vx, vy, vz in m/s</li>
                    <li>• <span className="text-cyan-400">attitude</span> — Euler roll, pitch, yaw radians</li>
                    <li>• <span className="text-cyan-400">battery</span> — Voltage (V), remaining (%), current (A)</li>
                    <li>• <span className="text-cyan-400">health</span> — Link quality, packet loss, sensor flags</li>
                    <li>• <span className="text-cyan-400">flight_mode</span> — SEARCH_PATROL, HOLD_RELAY, etc.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-display text-xl text-white">Implementation Architecture</h3>
              <div className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-white/80 overflow-x-auto leading-relaxed">
{`from adapters.interface import VehicleAdapter, VehicleCommand, CommandExecutionResult, CommandStatus

class CustomPlatformAdapter(VehicleAdapter):
    def connect(self) -> bool:
        # Establish connection with hardware / SITL socket
        self._is_connected = True
        return True

    def execute_command(self, cmd: VehicleCommand) -> CommandExecutionResult:
        # Translate unified VehicleCommand into platform wire format
        # Return ACK status and round-trip latency
        return CommandExecutionResult(
            command_id=cmd.command_id,
            vehicle_id=self.vehicle_id,
            status=CommandStatus.COMPLETED,
            message="Wire command ACKed",
        )

    def get_latest_telemetry(self) -> VehicleTelemetry:
        return self._latest_telemetry`}
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: MAVLink */}
        {activeTab === "mavlink" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-white">MAVLink 2.0 Adapter (`adapters/mavlink_adapter.py`)</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Provides direct integration with PX4 Autopilot (PX4 SITL with Gazebo, or hardware Pixhawk flight controllers) and ArduPilot vehicles over UDP, TCP, or Serial.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Protocol Translation Mappings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/10 text-white/50">
                    <tr>
                      <th className="pb-2">CVI Command</th>
                      <th className="pb-2">MAVLink Message ID</th>
                      <th className="pb-2">Parameters Mapped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    <tr>
                      <td className="py-2 text-emerald-400">GOTO_WAYPOINT</td>
                      <td className="py-2">MAV_CMD_DO_REPOSITION (192)</td>
                      <td className="py-2">lat * 1e7, lon * 1e7, alt, speed_mps</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400">TAKEOFF</td>
                      <td className="py-2">MAV_CMD_NAV_TAKEOFF (22)</td>
                      <td className="py-2">pitch=0, yaw=NaN, target_alt</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400">ARM / DISARM</td>
                      <td className="py-2">MAV_CMD_COMPONENT_ARM_DISARM (400)</td>
                      <td className="py-2">param1 = 1 (Arm) / 0 (Disarm)</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400">RETURN_TO_LAUNCH</td>
                      <td className="py-2">MAV_CMD_NAV_RETURN_TO_LAUNCH (20)</td>
                      <td className="py-2">None (Triggers autopilot RTL failsafe)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Legacy */}
        {activeTab === "legacy" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-white">Mock Legacy Protocol (`adapters/mock_legacy_adapter.py`)</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Demonstrates integration with archaic 1990s binary hardware protocols (<code className="text-amber-300">LEGACY-SERVO-1998</code> / AN-PRC byte packet). Proves that Omnivision can upgrade existing defense and industrial fleets without replacing physical avionics.
            </p>

            <div className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-white/80 space-y-2">
              <div className="text-white/50">// 22-Byte Fixed Binary Telegram Frame</div>
              <div className="text-emerald-400">[0:2]   SYNC: 0x7E 0x55</div>
              <div>[2]     OPCODE: 0x20 (NAV_GOTO) / 0x30 (RTL) / 0x50 (ARM)</div>
              <div>[3:7]   LAT_INT: 4-byte big-endian int32 (degrees × 100,000)</div>
              <div>[7:11]  LON_INT: 4-byte big-endian int32 (degrees × 100,000)</div>
              <div>[11:13] ALT_DM: 2-byte uint16 decimeters (meters × 10)</div>
              <div>[13:15] SPEED_CMS: 2-byte uint16 cm/s</div>
              <div>[15:17] HEADING_DEG: 2-byte uint16 (0-360)</div>
              <div>[17]    MODE_FLAGS: bit0=armed, bit1=airborne, bit2=degraded</div>
              <div>[18:20] BATT_MV: 2-byte uint16 (millivolts)</div>
              <div>[20]    HEALTH_PCT: 1-byte link quality (0-100)</div>
              <div className="text-amber-400">[21]    CHECKSUM: 1-byte XOR of bytes [2:21]</div>
            </div>
          </div>
        )}

        {/* Tab 4: STANAG 4586 */}
        {activeTab === "stanag" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-white">NATO STANAG 4586 Interoperability Mapping</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              STANAG 4586 defines standard interfaces of UAV control systems for NATO interoperability. The Common Vehicle Interface maps cleanly into the STANAG Data Link Interface (DLI) message set:
            </p>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-white/10 bg-white/5 text-white/60">
                  <tr>
                    <th className="p-3">STANAG 4586 Message</th>
                    <th className="p-3">Message Type</th>
                    <th className="p-3">Omnivision CVI Translation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  <tr>
                    <td className="p-3 text-emerald-400">DLI Message #200</td>
                    <td className="p-3">Inertial States</td>
                    <td className="p-3">VehicleTelemetry.position, velocity, attitude</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-400">DLI Message #300</td>
                    <td className="p-3">Air Vehicle Auxiliary Status</td>
                    <td className="p-3">VehicleTelemetry.battery, ComponentHealth</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-400">DLI Message #800</td>
                    <td className="p-3">Waypoint Command</td>
                    <td className="p-3">VehicleCommand(CommandType.GOTO_WAYPOINT)</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-emerald-400">DLI Message #1000</td>
                    <td className="p-3">Mode / Engine Control</td>
                    <td className="p-3">VehicleCommand(CommandType.ARM / DISARM)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Verification & Test Suite */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-steel uppercase">Automated Verification Suite</h3>
            <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-semibold">
              100% FIDELITY PASS
            </span>
          </div>
          <p className="text-xs text-white/70">
            Run the automated test harness to verify command round-trip fidelity, telemetry bounds, and degradation mode state machines:
          </p>
          <div className="rounded-lg bg-black/70 p-3 font-mono text-xs text-emerald-400">
            $ python -m unittest adapters/test_adapters.py
          </div>
        </section>
      </main>
    </div>
  );
}
