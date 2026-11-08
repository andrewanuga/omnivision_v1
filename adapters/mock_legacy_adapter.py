"""
Mock Legacy Protocol Adapter (LEGACY-SERVO-1998)
================================================
Implements the Common Vehicle Interface for a deliberately awkward, archaic
proprietary binary protocol (fixed 22-byte framed packets, XOR checksum,
integer scaled coordinates, slow telemetry updates).

Proves the Common Vehicle Interface abstraction: modern fleet autonomy
operates without knowing or caring that the physical platform speaks
a 1990s hardware protocol.
"""

from __future__ import annotations
import struct
import time
from typing import Optional, Tuple
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

# Wire framing constants
SYNC_BYTE_1 = 0x7E
SYNC_BYTE_2 = 0x55
OPCODE_PING = 0x01
OPCODE_TELEMETRY = 0x10
OPCODE_NAV_GOTO = 0x20
OPCODE_RTL = 0x30
OPCODE_SET_MODE = 0x40
OPCODE_ARM = 0x50

ACK_BYTE = 0x06
NAK_BYTE = 0x15


class LegacyWireCodec:
    """
    Simulates raw byte serialization/deserialization for the legacy protocol.
    Frame format (22 bytes total):
    [0:2]   SYNC: 0x7E 0x55
    [2]     OPCODE: 1 byte
    [3:7]   LAT_INT: 4 bytes int32 (lat * 100,000)
    [7:11]  LON_INT: 4 bytes int32 (lon * 100,000)
    [11:13] ALT_DM: 2 bytes int16 (decimeters, alt * 10)
    [13:15] SPEED_CMS: 2 bytes int16 (speed cm/s)
    [15:17] HEADING_DEG: 2 bytes uint16 (0-360)
    [17]    MODE_FLAGS: 1 byte (bit0: armed, bit1: air, bit2: degraded)
    [18:20] BATT_MV: 2 bytes uint16 (millivolts)
    [20]    HEALTH_PCT: 1 byte (0-100)
    [21]    CHECKSUM: 1 byte XOR of bytes [2:21]
    """

    @staticmethod
    def calculate_xor_checksum(data: bytes) -> int:
        cs = 0
        for b in data:
            cs ^= b
        return cs & 0xFF

    @classmethod
    def encode_command(cls, opcode: int, lat: float, lon: float, alt_m: float, mode_flags: int) -> bytes:
        lat_int = int(lat * 100000)
        lon_int = int(lon * 100000)
        alt_dm = int(alt_m * 10)
        payload = struct.pack(">BiiH", opcode, lat_int, lon_int, alt_dm)
        # Pad to 18 bytes payload
        payload += bytes([mode_flags]) + bytes(18 - len(payload) - 1)
        cs = cls.calculate_xor_checksum(payload)
        return bytes([SYNC_BYTE_1, SYNC_BYTE_2]) + payload + bytes([cs])

    @classmethod
    def decode_telemetry_frame(cls, frame: bytes) -> Optional[Tuple[int, float, float, float, int, int, int, int]]:
        if len(frame) != 22:
            return None
        if frame[0] != SYNC_BYTE_1 or frame[1] != SYNC_BYTE_2:
            return None
        payload = frame[2:21]
        expected_cs = cls.calculate_xor_checksum(payload)
        if frame[21] != expected_cs:
            return None  # Checksum mismatch

        opcode = frame[2]
        lat_int, lon_int, alt_dm, speed_cms, heading_deg, flags, batt_mv, health_pct = struct.unpack(
            ">iiHHHBHB", frame[3:21]
        )
        return opcode, lat_int / 100000.0, lon_int / 100000.0, alt_dm / 10.0, speed_cms, heading_deg, flags, batt_mv


class MockLegacyAdapter(VehicleAdapter):
    """
    Adapter translating the archaic LEGACY-SERVO-1998 serial binary protocol
    into the standard Common Vehicle Interface.
    """

    def __init__(self, vehicle_id: str, serial_port: str = "COM3_EMULATED", baud_rate: int = 9600):
        super().__init__(vehicle_id)
        self.serial_port = serial_port
        self.baud_rate = baud_rate

        # Simulated internal firmware registers
        self._lat = 37.7730
        self._lon = -122.4170
        self._alt_m = 15.0
        self._speed_cms = 600  # 6 m/s
        self._heading = 90
        self._flags = 0x03     # Armed + Air
        self._batt_mv = 15800  # 15.8V (~85%)
        self._health_pct = 94

        self._current_mode = FlightMode.SEARCH_PATROL
        self._degradation_mode = DegradationMode.NOMINAL
        self._latest_telemetry: Optional[VehicleTelemetry] = None
        self._packets_processed = 0

    def connect(self) -> bool:
        self._is_connected = True
        self._refresh_from_registers()
        return True

    def disconnect(self) -> None:
        self._is_connected = False

    def execute_command(self, cmd: VehicleCommand) -> CommandExecutionResult:
        """
        Encodes command into legacy binary frame, computes XOR checksum,
        and translates response into Common Vehicle Interface CommandExecutionResult.
        """
        if not self._is_connected:
            return CommandExecutionResult(
                command_id=cmd.command_id,
                vehicle_id=self.vehicle_id,
                status=CommandStatus.FAILED,
                message="Legacy serial link disconnected",
            )

        t_start = time.time()
        self._packets_processed += 1

        if cmd.command_type == CommandType.GOTO_WAYPOINT and cmd.target_position:
            # Pack binary frame
            frame = LegacyWireCodec.encode_command(
                OPCODE_NAV_GOTO,
                cmd.target_position.latitude_deg,
                cmd.target_position.longitude_deg,
                cmd.target_position.altitude_relative_m,
                self._flags,
            )
            # Update simulated registers
            self._lat = cmd.target_position.latitude_deg
            self._lon = cmd.target_position.longitude_deg
            self._alt_m = cmd.target_position.altitude_relative_m
            self._current_mode = FlightMode.SEARCH_PATROL
            status = CommandStatus.COMPLETED
            msg = f"Legacy frame 0x20 ACKed [len={len(frame)} bytes, CRC8=0x{frame[-1]:02X}]"

        elif cmd.command_type in (CommandType.RETURN_TO_LAUNCH, CommandType.RECALL):
            frame = LegacyWireCodec.encode_command(OPCODE_RTL, 37.7700, -122.4100, 10.0, self._flags)
            self._current_mode = FlightMode.RTL
            status = CommandStatus.COMPLETED
            msg = f"Legacy frame 0x30 (ABORT_HOME) ACKed"

        elif cmd.command_type == CommandType.ARM:
            self._flags |= 0x01
            status = CommandStatus.COMPLETED
            msg = "Legacy frame 0x50 (ENGAGE_MOTORS) ACKed"

        elif cmd.command_type == CommandType.DISARM:
            self._flags &= ~0x01
            status = CommandStatus.COMPLETED
            msg = "Legacy frame 0x50 (DISENGAGE_MOTORS) ACKed"

        elif cmd.command_type == CommandType.SET_DEGRADATION_MODE:
            self._degradation_mode = cmd.target_degradation or DegradationMode.NOMINAL
            if self._degradation_mode == DegradationMode.HOLD_AND_RELAY:
                self._flags |= 0x04  # Degraded bit
                self._current_mode = FlightMode.HOLD_RELAY
            elif self._degradation_mode == DegradationMode.REDUCED_CAPABILITY:
                self._flags |= 0x04
                self._current_mode = FlightMode.REDUCED_SEARCH
            elif self._degradation_mode == DegradationMode.RETURN_TO_RALLY:
                self._current_mode = FlightMode.RTL
            status = CommandStatus.COMPLETED
            msg = f"Legacy frame 0x40 (SET_STATE_REGISTER={self._degradation_mode.value}) ACKed"

        else:
            status = CommandStatus.REJECTED
            msg = f"Legacy protocol does not support command opcode for {cmd.command_type.value}"

        self._refresh_from_registers()

        return CommandExecutionResult(
            command_id=cmd.command_id,
            vehicle_id=self.vehicle_id,
            status=status,
            message=f"{msg} (Wire latency: {(time.time() - t_start)*1000:.2f}ms)",
        )

    def _refresh_from_registers(self) -> None:
        """Decodes raw registers and dispatches unified VehicleTelemetry."""
        is_armed = bool(self._flags & 0x01)
        is_in_air = bool(self._flags & 0x02)

        self._latest_telemetry = VehicleTelemetry(
            vehicle_id=self.vehicle_id,
            timestamp_unix=time.time(),
            flight_mode=self._current_mode,
            degradation_mode=self._degradation_mode,
            is_armed=is_armed,
            is_in_air=is_in_air,
            position=GeoPoint(
                latitude_deg=self._lat,
                longitude_deg=self._lon,
                altitude_msl_m=self._alt_m + 100.0,
                altitude_relative_m=self._alt_m,
            ),
            velocity=VelocityVector(
                vx_mps=(self._speed_cms / 100.0),
                vy_mps=0.0,
                vz_mps=0.0,
            ),
            attitude=AttitudeAngles(roll_rad=0.0, pitch_rad=0.0, yaw_rad=0.0),
            battery=BatteryState(
                voltage_v=self._batt_mv / 1000.0,
                remaining_percent=max(0.0, min(100.0, (self._batt_mv - 14000) / 28.0)),
                current_draw_a=11.5 if is_armed else 0.4,
            ),
            health=ComponentHealth(
                comms_link_quality_pct=float(self._health_pct),
                packet_loss_pct=2.0 if self._degradation_mode == DegradationMode.NOMINAL else 22.0,
                primary_camera_ok=self._degradation_mode != DegradationMode.REDUCED_CAPABILITY,
                ai_accelerator_ok=True,
                gps_fix=True,
                cpu_utilization_pct=28.0,
                memory_utilization_pct=15.0,
            ),
            heading_deg=float(self._heading),
            custom_metadata={
                "protocol": "LEGACY-SERVO-1998",
                "baud_rate": self.baud_rate,
                "raw_flags": hex(self._flags),
                "packets_processed": self._packets_processed,
            },
        )
        self._publish_telemetry(self._latest_telemetry)

    def get_latest_telemetry(self) -> Optional[VehicleTelemetry]:
        return self._latest_telemetry
