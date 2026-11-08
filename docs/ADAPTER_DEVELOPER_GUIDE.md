# Omnivision Adapter Developer Guide
**Resilient Decentralized Autonomy Stack — Vehicle Abstraction Layer**

---

## 1. Executive Summary & Purpose

In real-world defense, search-and-rescue, and industrial operations, drone fleets are rarely homogenous. Operators operate a mixture of modern PX4/ArduPilot airframes, specialized commercial inspection drones, and legacy proprietary platforms with archaic protocols.

The **Common Vehicle Interface (CVI)** is the architectural boundary that decouples the Omnivision decentralized autonomy stack (peer-to-peer fabric, leader election, consensus task allocation, edge AI cascade) from the physical autopilot protocols.

```
+--------------------------------------------------------------+
|       Omnivision Fleet Fabric & Decentralized Autonomy       |
|    (P2P Fabric, Captain Election, Task Allocation, AI)       |
+--------------------------------------------------------------+
                               |
               Unified Telemetry / Commands (CVI)
                               v
+--------------------------------------------------------------+
|              Vehicle Abstraction Layer (Adapters)            |
|  +--------------------+  +--------------------------------+  |
|  |  MAVLink Adapter   |  |   Legacy Proprietary Adapter   |  |
|  |  (PX4, ArduPilot)  |  |   (AN-PRC, 1990s Hex Protocol) |  |
|  +--------------------+  +--------------------------------+  |
+--------------------------------------------------------------+
            |                                     |
    MAVLink 2.0 (UDP)                    Serial Frame (RS-422)
            v                                     v
   PX4 SITL / Pixhawk                     Proprietary Airframe
```

---

## 2. The Common Vehicle Interface (CVI) Specification

All vehicle integrations implement the abstract class `VehicleAdapter` (`adapters/interface.py`).

### 2.1 Core Telemetry Object: `VehicleTelemetry`
Emitted periodically (typically 2 Hz to 10 Hz) across the P2P fabric:

| Field | Type | Description |
| :--- | :--- | :--- |
| `vehicle_id` | `str` | Unique node identifier (e.g. `UAV-01`, `CHARLIE-03`) |
| `timestamp_unix` | `float` | Epoch timestamp in seconds |
| `flight_mode` | `FlightMode` | High-level mode: `STANDBY`, `TAKEOFF`, `SEARCH_PATROL`, `HOLD_RELAY`, `RTL`, `MANUAL_OVERRIDE` |
| `degradation_mode` | `DegradationMode` | Explicit fault policy: `NOMINAL`, `COMMS_LOST_AUTONOMOUS`, `HOLD_AND_RELAY`, `REDUCED_CAPABILITY`, `RETURN_TO_RALLY` |
| `is_armed` | `bool` | Propulsion power state |
| `is_in_air` | `bool` | True if airborne (> 1.0m AGL) |
| `position` | `GeoPoint` | WGS84 `latitude_deg`, `longitude_deg`, `altitude_msl_m`, `altitude_relative_m` |
| `velocity` | `VelocityVector` | North-East-Down (NED) frame velocities (`vx_mps`, `vy_mps`, `vz_mps`) |
| `attitude` | `AttitudeAngles` | Euler angles (`roll_rad`, `pitch_rad`, `yaw_rad`) |
| `battery` | `BatteryState` | `voltage_v`, `remaining_percent`, `current_draw_a` |
| `health` | `ComponentHealth` | `comms_link_quality_pct`, `packet_loss_pct`, `primary_camera_ok`, `ai_accelerator_ok`, `gps_fix`, `cpu_utilization_pct` |

### 2.2 Core Command Object: `VehicleCommand`
Commands delivered to an individual drone or dispatched by the fleet captain:

| Command Type | Associated Parameters | Target Autopilot Action |
| :--- | :--- | :--- |
| `ARM` / `DISARM` | None | Arm or disarm motor ESCs safely |
| `TAKEOFF` | `target_position.altitude_relative_m` | Controlled vertical ascent to target AGL |
| `GOTO_WAYPOINT` | `target_position`, `target_speed_mps` | Fly to coordinate with designated speed and acceptance radius |
| `SET_VELOCITY` | `target_velocity` | Direct NED velocity vector steering |
| `RETURN_TO_LAUNCH` | None | Autonomous return to home/rally point and safe landing |
| `SET_DEGRADATION_MODE` | `target_degradation` | Enter predefined failsafe mode per FR-6 |
| `HOLD_POSITION` | None | Immediate loiter/hover at current location |
| `RECALL` | None | Immediate return to pre-agreed rally point |

All command dispatches return a typed `CommandExecutionResult` containing:
- `command_id`: Correlated tracking ID
- `status`: `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`, or `FAILED`
- `message`: Diagnostic protocol string with wire round-trip latency

---

## 3. Step-by-Step: Writing a Custom Adapter

To integrate a new drone platform, follow these four steps:

### Step 1: Subclass `VehicleAdapter`
```python
from adapters.interface import VehicleAdapter, VehicleCommand, CommandExecutionResult, CommandStatus

class MyCustomUavAdapter(VehicleAdapter):
    def __init__(self, vehicle_id: str, endpoint_config: dict):
        super().__init__(vehicle_id)
        self.config = endpoint_config
        self._latest_telemetry = None
```

### Step 2: Implement Connection & Health Lifecycles
```python
    def connect(self) -> bool:
        # Establish socket/serial connection to vehicle
        self._is_connected = True
        return True

    def disconnect(self) -> None:
        self._is_connected = False
```

### Step 3: Implement Telemetry Translation Loop
Map proprietary sensor registers to `VehicleTelemetry` and call `self._publish_telemetry()`:
```python
    def _on_raw_hardware_packet(self, raw_bytes: bytes):
        parsed = parse_hardware_packet(raw_bytes)
        telemetry = VehicleTelemetry(
            vehicle_id=self.vehicle_id,
            timestamp_unix=time.time(),
            flight_mode=FlightMode.SEARCH_PATROL,
            degradation_mode=DegradationMode.NOMINAL,
            is_armed=parsed.is_armed,
            is_in_air=parsed.alt > 1.0,
            position=GeoPoint(parsed.lat, parsed.lon, parsed.alt_msl, parsed.alt_rel),
            velocity=VelocityVector(parsed.vx, parsed.vy, parsed.vz),
            attitude=AttitudeAngles(parsed.roll, parsed.pitch, parsed.yaw),
            battery=BatteryState(voltage_v=parsed.volt, remaining_percent=parsed.pct),
            health=ComponentHealth(comms_link_quality_pct=parsed.rssi, packet_loss_pct=0.0),
            heading_deg=parsed.heading,
        )
        self._latest_telemetry = telemetry
        self._publish_telemetry(telemetry)
```

### Step 4: Implement Command Dispatch with Round-Trip Feedback
Translate `VehicleCommand` into the vehicle's native wire commands and ensure explicit acknowledgments are recorded:
```python
    def execute_command(self, cmd: VehicleCommand) -> CommandExecutionResult:
        if cmd.command_type == CommandType.GOTO_WAYPOINT:
            wire_pkt = build_native_packet(cmd.target_position)
            ack = self.send_and_wait_ack(wire_pkt, timeout=cmd.timeout_sec)
            return CommandExecutionResult(
                command_id=cmd.command_id,
                vehicle_id=self.vehicle_id,
                status=CommandStatus.COMPLETED if ack else CommandStatus.TIMED_OUT,
                message="Native waypoint dispatched",
            )
```

---

## 4. Reference Implementations Included in Omnivision

### 4.1 MAVLink 2.0 Adapter (`adapters/mavlink_adapter.py`)
- Used with **PX4 SITL with Gazebo** and hardware Pixhawk boards.
- Maps `GLOBAL_POSITION_INT` (scaled $10^7$ integers) to floating point degrees.
- Maps `COMMAND_LONG` message types (`MAV_CMD_NAV_WAYPOINT`, `MAV_CMD_NAV_TAKEOFF`, `MAV_CMD_COMPONENT_ARM_DISARM`).
- Supports automatic UDP loopback and heartbeat generation.

### 4.2 Mock Legacy Protocol Adapter (`adapters/mock_legacy_adapter.py`)
- Simulates an awkward 1990s binary protocol (`LEGACY-SERVO-1998` / `AN-PRC`).
- Uses fixed 22-byte framed packets:
  - Header: `0x7E 0x55`
  - Opcode byte (e.g. `0x20` for GOTO, `0x30` for RTL)
  - Big-endian signed coordinates scaled by $100,000$
  - 8-bit XOR checksum
- Proves that legacy platforms requiring manual byte packing, baud-throttling, and integer conversions are seamlessly absorbed by the Common Vehicle Interface.

---

## 5. STANAG 4586 Interoperability Mapping

For defense interoperability, the NATO **STANAG 4586** (Standard Interfaces of UAV Control System) maps to the Omnivision CVI as follows:

| STANAG 4586 Message ID | STANAG Message Name | Omnivision CVI Equivalent |
| :--- | :--- | :--- |
| `DLI Message #200` | Inertial States | `VehicleTelemetry.position`, `velocity`, `attitude` |
| `DLI Message #300` | Air Vehicle Auxiliary Status | `VehicleTelemetry.battery`, `ComponentHealth` |
| `DLI Message #800` | Waypoint Command | `VehicleCommand(CommandType.GOTO_WAYPOINT)` |
| `DLI Message #1000` | Mode / Engine Control Command | `VehicleCommand(CommandType.ARM / DISARM / SET_FLIGHT_MODE)` |
| `DLI Message #1400` | Vehicle Steering Command | `VehicleCommand(CommandType.SET_VELOCITY)` |

---

## 6. Verification and Testing

All adapters must achieve **100% round-trip fidelity** across the test suite before field deployment:
```bash
python -m unittest adapters/test_adapters.py
```
This tests:
1. Connection lifecycle and graceful disconnection
2. Command round-trip completion and ACK latency
3. Zero-loss telemetry emission
4. Transition into all 4 explicit degradation modes (`HOLD_AND_RELAY`, `REDUCED_CAPABILITY`, `RETURN_TO_RALLY`, `COMMS_LOST_AUTONOMOUS`)
