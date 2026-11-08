/**
 * Common Vehicle Interface (CVI) — TypeScript Definitions
 * Mirrors the core Python CVI specification for frontend visualization & simulation.
 */

export type FlightMode =
  | "STANDBY"
  | "TAKEOFF"
  | "SEARCH_PATROL"
  | "HOLD_RELAY"
  | "REDUCED_SEARCH"
  | "RTL"
  | "LANDING"
  | "MANUAL_OVERRIDE";

export type DegradationMode =
  | "NOMINAL"
  | "COMMS_LOST_AUTONOMOUS"
  | "HOLD_AND_RELAY"
  | "REDUCED_CAPABILITY"
  | "RETURN_TO_RALLY";

export type TargetType = "PERSON" | "VEHICLE" | "HAZARD_MARKER";

export interface TargetDetection {
  id: string;
  type: TargetType;
  x: number; // grid meters 0..1000
  y: number; // grid meters 0..800
  confidence: number;
  detectedBy: string;
  timestamp: string;
  modelTier: "LIGHT_DETECTOR" | "HEAVY_CLASSIFIER";
  lat: number;
  lon: number;
}

export interface UavTelemetry {
  id: string;
  callsign: string;
  protocol: "MAVLink 2.0" | "LEGACY-SERVO-1998";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  altitudeM: number;
  speedMps: number;
  headingDeg: number;
  batteryPct: number;
  voltageV: number;
  flightMode: FlightMode;
  degradationMode: DegradationMode;
  isCaptain: boolean;
  partitionGroup: "A" | "B";
  isAlive: boolean;
  cameraOk: boolean;
  pingMs: number;
  packetLossPct: number;
  path: Array<{ x: number; y: number }>;
}

export interface MissionEvent {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "CRITICAL" | "SUCCESS";
  source: string;
  message: string;
}

export interface MissionReportData {
  missionId: string;
  scenarioName: string;
  startTime: string;
  durationSeconds: number;
  areaCoveragePct: number;
  captainReElectionTimeSec: number;
  vehicleLossRecoveryTimeSec: number;
  detectionsLostAfterMerge: number;
  edgeLatencySpeedup: number;
  cascadeLightModelPct: number;
  adapterRoundTripFidelityPct: number;
  totalDetections: number;
  detections: TargetDetection[];
  timeline: Array<{
    timeSec: number;
    event: string;
    status: "RESOLVED" | "DEGRADED" | "NOMINAL";
    details: string;
  }>;
}
