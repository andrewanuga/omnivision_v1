"""
Common Vehicle Interface (CVI)
==============================
Defines the standard, typed abstraction between the Omnivision fleet autonomy
stack (peer-to-peer fabric, captain election, decentralized task allocation)
and underlying vehicle autopilots / flight controllers.

Design Goals:
1. Typed and minimal: no vehicle-specific quirks leak into the fleet fabric.
2. Bidirectional: asynchronous telemetry streaming and robust command execution.
3. Fault-aware: first-class support for explicit degradation modes (FR-6).
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Callable, Optional, Dict, Any, List
import time


class FlightMode(str, Enum):
    """Standardized high-level flight modes recognized by the autonomy stack."""
    DISARMED = "DISARMED"
    STANDBY = "STANDBY"
    TAKEOFF = "TAKEOFF"
    SEARCH_PATROL = "SEARCH_PATROL"
    HOLD_RELAY = "HOLD_RELAY"          # Degradation mode: hover and serve as radio relay
    REDUCED_SEARCH = "REDUCED_SEARCH"  # Degradation mode: search with constrained sensors/compute
    RTL = "RTL"                        # Return to Launch / Rally point
    LANDING = "LANDING"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


class DegradationMode(str, Enum):
    """Explicit fault responses per FR-6."""
    NOMINAL = "NOMINAL"
    COMMS_LOST_AUTONOMOUS = "COMMS_LOST_AUTONOMOUS"
    HOLD_AND_RELAY = "HOLD_AND_RELAY"
    REDUCED_CAPABILITY = "REDUCED_CAPABILITY"
    RETURN_TO_RALLY = "RETURN_TO_RALLY"
    EMERGENCY_LAND = "EMERGENCY_LAND"


class CommandType(str, Enum):
    ARM = "ARM"
    DISARM = "DISARM"
    TAKEOFF = "TAKEOFF"
    LAND = "LAND"
    GOTO_WAYPOINT = "GOTO_WAYPOINT"
    SET_VELOCITY = "SET_VELOCITY"
    RETURN_TO_LAUNCH = "RETURN_TO_LAUNCH"
    SET_DEGRADATION_MODE = "SET_DEGRADATION_MODE"
    HOLD_POSITION = "HOLD_POSITION"
    RECALL = "RECALL"


class CommandStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    TIMED_OUT = "TIMED_OUT"
    FAILED = "FAILED"


@dataclass(frozen=True)
class GeoPoint:
    """WGS84 Coordinates."""
    latitude_deg: float
    longitude_deg: float
    altitude_msl_m: float
    altitude_relative_m: float = 0.0


@dataclass(frozen=True)
class VelocityVector:
    """Velocity in North-East-Down (NED) frame (m/s)."""
    vx_mps: float
    vy_mps: float
    vz_mps: float


@dataclass(frozen=True)
class AttitudeAngles:
    """Attitude in radians."""
    roll_rad: float
    pitch_rad: float
    yaw_rad: float


@dataclass(frozen=True)
class BatteryState:
    voltage_v: float
    remaining_percent: float
    current_draw_a: float = 0.0
    cell_count: int = 4


@dataclass(frozen=True)
class ComponentHealth:
    comms_link_quality_pct: float       # 0.0 to 100.0%
    packet_loss_pct: float              # 0.0 to 100.0%
    primary_camera_ok: bool = True
    ai_accelerator_ok: bool = True
    gps_fix: bool = True
    cpu_utilization_pct: float = 0.0
    memory_utilization_pct: float = 0.0


@dataclass(frozen=True)
class VehicleTelemetry:
    """Unified telemetry broadcast packet emitted by all vehicle adapters."""
    vehicle_id: str
    timestamp_unix: float
    flight_mode: FlightMode
    degradation_mode: DegradationMode
    is_armed: bool
    is_in_air: bool
    position: GeoPoint
    velocity: VelocityVector
    attitude: AttitudeAngles
    battery: BatteryState
    health: ComponentHealth
    heading_deg: float
    custom_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class VehicleCommand:
    """Unified command payload sent from autonomy stack down to vehicle autopilot."""
    command_id: str
    vehicle_id: str
    command_type: CommandType
    timestamp_created: float = field(default_factory=time.time)
    target_position: Optional[GeoPoint] = None
    target_velocity: Optional[VelocityVector] = None
    target_mode: Optional[FlightMode] = None
    target_degradation: Optional[DegradationMode] = None
    target_speed_mps: float = 8.0
    timeout_sec: float = 5.0


@dataclass
class CommandExecutionResult:
    command_id: str
    vehicle_id: str
    status: CommandStatus
    message: str = ""
    timestamp_finished: float = field(default_factory=time.time)


TelemetryCallback = Callable[[VehicleTelemetry], None]


class VehicleAdapter(ABC):
    """
    Abstract Base Class for all Omnivision vehicle adapters.
    
    Whether the vehicle is running PX4 over MAVLink, ArduPilot over Serial,
    or a legacy custom 1990s payload microcontroller, it must conform to this
    interface.
    """

    def __init__(self, vehicle_id: str):
        self.vehicle_id = vehicle_id
        self._telemetry_subscribers: List[TelemetryCallback] = []
        self._is_connected = False

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    def subscribe_telemetry(self, callback: TelemetryCallback) -> None:
        """Register a callback for unified telemetry updates."""
        if callback not in self._telemetry_subscribers:
            self._telemetry_subscribers.append(callback)

    def unsubscribe_telemetry(self, callback: TelemetryCallback) -> None:
        if callback in self._telemetry_subscribers:
            self._telemetry_subscribers.remove(callback)

    def _publish_telemetry(self, telemetry: VehicleTelemetry) -> None:
        """Internal helper for adapter implementations to dispatch telemetry."""
        for cb in self._telemetry_subscribers:
            try:
                cb(telemetry)
            except Exception as e:
                # Never let an observer crash the adapter
                print(f"[Adapter {self.vehicle_id}] Telemetry dispatch error: {e}")

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection with the underlying autopilot / communications link."""
        pass

    @abstractmethod
    def disconnect(self) -> None:
        """Safely tear down link connection."""
        pass

    @abstractmethod
    def execute_command(self, cmd: VehicleCommand) -> CommandExecutionResult:
        """
        Execute a standard autonomy command through the native protocol.
        Must return a CommandExecutionResult synchronously or via tracked completion.
        """
        pass

    @abstractmethod
    def get_latest_telemetry(self) -> Optional[VehicleTelemetry]:
        """Fetch the most recent unified telemetry frame cached by the adapter."""
        pass
