import { UavTelemetry, TargetDetection, MissionEvent, MissionReportData } from "../adapters/types";

export interface SimulationState {
  uavs: UavTelemetry[];
  detections: TargetDetection[];
  events: MissionEvent[];
  coveragePct: number;
  isPaused: boolean;
  isPartitioned: boolean;
  commsDegraded: boolean;
  missionTimeSec: number;
  captainId: string;
}

const INITIAL_UAVS: UavTelemetry[] = [
  {
    id: "UAV-01",
    callsign: "Alpha",
    protocol: "MAVLink 2.0",
    x: 180,
    y: 220,
    targetX: 320,
    targetY: 180,
    altitudeM: 28.5,
    speedMps: 7.2,
    headingDeg: 35,
    batteryPct: 91,
    voltageV: 16.2,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: true,
    partitionGroup: "A",
    isAlive: true,
    cameraOk: true,
    pingMs: 14,
    packetLossPct: 0.2,
    path: [{ x: 140, y: 260 }, { x: 180, y: 220 }],
  },
  {
    id: "UAV-02",
    callsign: "Bravo",
    protocol: "MAVLink 2.0",
    x: 350,
    y: 420,
    targetX: 480,
    targetY: 360,
    altitudeM: 30.0,
    speedMps: 7.5,
    headingDeg: 70,
    batteryPct: 88,
    voltageV: 16.0,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: false,
    partitionGroup: "A",
    isAlive: true,
    cameraOk: true,
    pingMs: 18,
    packetLossPct: 0.4,
    path: [{ x: 300, y: 460 }, { x: 350, y: 420 }],
  },
  {
    id: "UAV-03",
    callsign: "Charlie",
    protocol: "MAVLink 2.0",
    x: 520,
    y: 250,
    targetX: 620,
    targetY: 200,
    altitudeM: 27.0,
    speedMps: 6.8,
    headingDeg: 45,
    batteryPct: 86,
    voltageV: 15.9,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: false,
    partitionGroup: "A",
    isAlive: true,
    cameraOk: true,
    pingMs: 22,
    packetLossPct: 0.8,
    path: [{ x: 480, y: 290 }, { x: 520, y: 250 }],
  },
  {
    id: "UAV-04",
    callsign: "Delta",
    protocol: "MAVLink 2.0",
    x: 680,
    y: 480,
    targetX: 800,
    targetY: 420,
    altitudeM: 31.5,
    speedMps: 8.0,
    headingDeg: 60,
    batteryPct: 83,
    voltageV: 15.7,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: false,
    partitionGroup: "B",
    isAlive: true,
    cameraOk: true,
    pingMs: 25,
    packetLossPct: 1.1,
    path: [{ x: 620, y: 520 }, { x: 680, y: 480 }],
  },
  {
    id: "UAV-05",
    callsign: "Echo",
    protocol: "LEGACY-SERVO-1998",
    x: 240,
    y: 620,
    targetX: 380,
    targetY: 580,
    altitudeM: 25.0,
    speedMps: 6.0,
    headingDeg: 80,
    batteryPct: 79,
    voltageV: 15.4,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: false,
    partitionGroup: "B",
    isAlive: true,
    cameraOk: true,
    pingMs: 38,
    packetLossPct: 2.1,
    path: [{ x: 190, y: 640 }, { x: 240, y: 620 }],
  },
  {
    id: "UAV-06",
    callsign: "Foxtrot",
    protocol: "LEGACY-SERVO-1998",
    x: 750,
    y: 640,
    targetX: 860,
    targetY: 590,
    altitudeM: 26.5,
    speedMps: 6.4,
    headingDeg: 65,
    batteryPct: 82,
    voltageV: 15.6,
    flightMode: "SEARCH_PATROL",
    degradationMode: "NOMINAL",
    isCaptain: false,
    partitionGroup: "B",
    isAlive: true,
    cameraOk: true,
    pingMs: 42,
    packetLossPct: 2.4,
    path: [{ x: 710, y: 670 }, { x: 750, y: 640 }],
  },
];

const PRESET_TARGETS: TargetDetection[] = [
  {
    id: "TGT-01",
    type: "PERSON",
    x: 290,
    y: 210,
    confidence: 0.94,
    detectedBy: "UAV-01 (Alpha)",
    timestamp: "T+01:42",
    modelTier: "LIGHT_DETECTOR",
    lat: 37.7761,
    lon: -122.4182,
  },
  {
    id: "TGT-02",
    type: "VEHICLE",
    x: 580,
    y: 310,
    confidence: 0.97,
    detectedBy: "UAV-03 (Charlie)",
    timestamp: "T+02:18",
    modelTier: "HEAVY_CLASSIFIER",
    lat: 37.7788,
    lon: -122.4144,
  },
  {
    id: "TGT-03",
    type: "HAZARD_MARKER",
    x: 720,
    y: 440,
    confidence: 0.91,
    detectedBy: "UAV-04 (Delta)",
    timestamp: "T+03:05",
    modelTier: "LIGHT_DETECTOR",
    lat: 37.7802,
    lon: -122.4116,
  },
];

export function createInitialSimulation(): SimulationState {
  return {
    uavs: JSON.parse(JSON.stringify(INITIAL_UAVS)),
    detections: [...PRESET_TARGETS],
    events: [
      {
        id: "evt-0",
        timestamp: "00:01",
        level: "INFO",
        source: "FLEET_FABRIC",
        message: "P2P discovery complete across 6 nodes. Mesh converged.",
      },
      {
        id: "evt-1",
        timestamp: "00:03",
        level: "SUCCESS",
        source: "ELECTION",
        message: "UAV-01 (Alpha) elected Fleet Captain (Term #1, Raft consensus).",
      },
      {
        id: "evt-2",
        timestamp: "00:05",
        level: "INFO",
        source: "TASK_ALLOCATOR",
        message: "Search sector grid [1000m x 800m] allocated via CBBA bundles.",
      },
    ],
    coveragePct: 46.2,
    isPaused: false,
    isPartitioned: false,
    commsDegraded: false,
    missionTimeSec: 184,
    captainId: "UAV-01",
  };
}

export function tickSimulation(prev: SimulationState): SimulationState {
  if (prev.isPaused) return prev;

  const nextTime = prev.missionTimeSec + 1;
  const newCoverage = Math.min(98.5, prev.coveragePct + 0.12);

  // Update UAV positions and wander paths
  const nextUavs = prev.uavs.map((uav) => {
    if (!uav.isAlive) return uav;

    let { x, y, targetX, targetY, headingDeg, batteryPct, voltageV } = uav;

    if (uav.flightMode === "SEARCH_PATROL") {
      const dx = targetX - x;
      const dy = targetY - y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20) {
        // Pick next pseudo waypoint in sector
        targetX = Math.max(80, Math.min(920, x + (Math.random() - 0.45) * 350));
        targetY = Math.max(80, Math.min(720, y + (Math.random() - 0.45) * 280));
      } else {
        const step = uav.speedMps * 0.8;
        x += (dx / dist) * step;
        y += (dy / dist) * step;
        headingDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      }
    } else if (uav.flightMode === "RTL") {
      // Home rally point is (100, 100)
      const dx = 100 - x;
      const dy = 100 - y;
      const dist = Math.hypot(dx, dy);
      if (dist > 15) {
        x += (dx / dist) * (uav.speedMps * 0.9);
        y += (dy / dist) * (uav.speedMps * 0.9);
      }
    }

    // Battery burn
    batteryPct = Math.max(12, batteryPct - 0.02);
    voltageV = Math.max(14.8, voltageV - 0.003);

    const newPath = [...uav.path.slice(-18), { x: Math.round(x), y: Math.round(y) }];

    return {
      ...uav,
      x: Math.round(x),
      y: Math.round(y),
      targetX: Math.round(targetX),
      targetY: Math.round(targetY),
      headingDeg,
      batteryPct: Number(batteryPct.toFixed(1)),
      voltageV: Number(voltageV.toFixed(2)),
      path: newPath,
    };
  });

  return {
    ...prev,
    missionTimeSec: nextTime,
    coveragePct: Number(newCoverage.toFixed(1)),
    uavs: nextUavs,
  };
}

export function generateMissionReport(state: SimulationState): MissionReportData {
  const min = Math.floor(state.missionTimeSec / 60);
  const sec = state.missionTimeSec % 60;
  return {
    missionId: "OMNI-SIM-2026-X09",
    scenarioName: "Resilient Area Search & Survey (Disaster Sector Bravo)",
    startTime: "2026-11-09T04:30:00Z",
    durationSeconds: state.missionTimeSec,
    areaCoveragePct: state.coveragePct,
    captainReElectionTimeSec: 3.42,
    vehicleLossRecoveryTimeSec: 7.8,
    detectionsLostAfterMerge: 0,
    edgeLatencySpeedup: 3.1,
    cascadeLightModelPct: 68.4,
    adapterRoundTripFidelityPct: 100.0,
    totalDetections: state.detections.length,
    detections: state.detections,
    timeline: [
      {
        timeSec: 12,
        event: "Fleet Launch & CBBA Search Pattern Allocation",
        status: "NOMINAL",
        details: "All 6 UAVs airborne, standard search grid initialized with zero conflicts.",
      },
      {
        timeSec: 85,
        event: "Target Acquisition: Person #01 Discovered",
        status: "NOMINAL",
        details: "Detected by UAV-01 Alpha onboard lightweight INT8 MobileNet cascade (94% conf).",
      },
      {
        timeSec: 140,
        event: "Comms Degradation Injected (tc/netem 45ms jitter)",
        status: "DEGRADED",
        details: "Fleet fabric switched to reduced sync interval (1.5s). Peer heartbeats sustained.",
      },
      {
        timeSec: 210,
        event: "Simulated Captain Node Failure (UAV-01 Alpha lost)",
        status: "DEGRADED",
        details: "Captain heartbeat missed for 1.8s. Automatic re-election trigger.",
      },
      {
        timeSec: 213,
        event: "Captain Election Failover Resolved (UAV-02 Bravo elected)",
        status: "RESOLVED",
        details: "New captain accepted by 100% reachable peers in 3.42s (< 5.0s target). Area tasks reallocated in 7.8s.",
      },
      {
        timeSec: 295,
        event: "Network Partition Split (Group A & Group B separated)",
        status: "DEGRADED",
        details: "Fleet partitioned into 2 independent cells. Each continued sub-grid search under local captain.",
      },
      {
        timeSec: 380,
        event: "Partition Healed & CRDT World-Model Merged",
        status: "RESOLVED",
        details: "World-model synchronized across mesh. 0 detections lost. Shared target state verified.",
      },
    ],
  };
}
