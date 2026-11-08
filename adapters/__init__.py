"""
Omnivision Vehicle Adapters Package
===================================
Provides protocol translation between heterogeneous autopilots/transceivers
and the Omnivision decentralized autonomy fabric.
"""

from .interface import (
    VehicleAdapter,
    VehicleTelemetry,
    VehicleCommand,
    CommandExecutionResult,
    CommandType,
    CommandStatus,
    FlightMode,
    DegradationMode,
    GeoPoint,
    VelocityVector,
    AttitudeAngles,
    BatteryState,
    ComponentHealth,
)
from .mavlink_adapter import MAVLinkAdapter
from .mock_legacy_adapter import MockLegacyAdapter

__all__ = [
    "VehicleAdapter",
    "VehicleTelemetry",
    "VehicleCommand",
    "CommandExecutionResult",
    "CommandType",
    "CommandStatus",
    "FlightMode",
    "DegradationMode",
    "GeoPoint",
    "VelocityVector",
    "AttitudeAngles",
    "BatteryState",
    "ComponentHealth",
    "MAVLinkAdapter",
    "MockLegacyAdapter",
]
