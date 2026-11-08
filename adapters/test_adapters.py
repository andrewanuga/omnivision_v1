"""
Adapter Test Suite
==================
Tests the Common Vehicle Interface, MAVLink Adapter, and Mock Legacy Adapter.
Verifies FR-11 and FR-12 requirements:
- 100% round-trip fidelity on defined command test suite
- Telemetry format consistency
- Fault and degradation mode transitions
"""

import unittest
from adapters import (
    MAVLinkAdapter,
    MockLegacyAdapter,
    VehicleCommand,
    CommandType,
    CommandStatus,
    FlightMode,
    DegradationMode,
    GeoPoint,
)


class TestAdapters(unittest.TestCase):

    def setUp(self):
        self.mavlink_adapter = MAVLinkAdapter(vehicle_id="UAV-01-PX4", connection_url="udp:127.0.0.1:14540")
        self.legacy_adapter = MockLegacyAdapter(vehicle_id="UAV-02-LEGACY", serial_port="COM3_EMULATED")

    def test_mavlink_adapter_lifecycle_and_commands(self):
        self.assertTrue(self.mavlink_adapter.connect())
        self.assertTrue(self.mavlink_adapter.is_connected)

        # Telemetry should be available
        telem = self.mavlink_adapter.get_latest_telemetry()
        self.assertIsNotNone(telem)
        self.assertEqual(telem.vehicle_id, "UAV-01-PX4")

        # 1. ARM
        cmd_arm = VehicleCommand(command_id="CMD-01", vehicle_id="UAV-01-PX4", command_type=CommandType.ARM)
        res = self.mavlink_adapter.execute_command(cmd_arm)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertTrue(self.mavlink_adapter.get_latest_telemetry().is_armed)

        # 2. TAKEOFF
        cmd_to = VehicleCommand(
            command_id="CMD-02",
            vehicle_id="UAV-01-PX4",
            command_type=CommandType.TAKEOFF,
            target_position=GeoPoint(latitude_deg=37.7749, longitude_deg=-122.4194, altitude_msl_m=145.0, altitude_relative_m=25.0),
        )
        res = self.mavlink_adapter.execute_command(cmd_to)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.mavlink_adapter.get_latest_telemetry().flight_mode, FlightMode.TAKEOFF)

        # 3. GOTO WAYPOINT
        cmd_wp = VehicleCommand(
            command_id="CMD-03",
            vehicle_id="UAV-01-PX4",
            command_type=CommandType.GOTO_WAYPOINT,
            target_position=GeoPoint(latitude_deg=37.7780, longitude_deg=-122.4150, altitude_msl_m=145.0, altitude_relative_m=25.0),
        )
        res = self.mavlink_adapter.execute_command(cmd_wp)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.mavlink_adapter.get_latest_telemetry().position.latitude_deg, 37.7780)

        # 4. DEGRADATION: HOLD & RELAY
        cmd_deg = VehicleCommand(
            command_id="CMD-04",
            vehicle_id="UAV-01-PX4",
            command_type=CommandType.SET_DEGRADATION_MODE,
            target_degradation=DegradationMode.HOLD_AND_RELAY,
        )
        res = self.mavlink_adapter.execute_command(cmd_deg)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.mavlink_adapter.get_latest_telemetry().degradation_mode, DegradationMode.HOLD_AND_RELAY)
        self.assertEqual(self.mavlink_adapter.get_latest_telemetry().flight_mode, FlightMode.HOLD_RELAY)

        # 5. RTL / RECALL
        cmd_rtl = VehicleCommand(command_id="CMD-05", vehicle_id="UAV-01-PX4", command_type=CommandType.RETURN_TO_LAUNCH)
        res = self.mavlink_adapter.execute_command(cmd_rtl)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.mavlink_adapter.get_latest_telemetry().flight_mode, FlightMode.RTL)

    def test_mock_legacy_adapter_lifecycle_and_commands(self):
        self.assertTrue(self.legacy_adapter.connect())
        self.assertTrue(self.legacy_adapter.is_connected)

        telem = self.legacy_adapter.get_latest_telemetry()
        self.assertIsNotNone(telem)
        self.assertEqual(telem.vehicle_id, "UAV-02-LEGACY")
        self.assertEqual(telem.custom_metadata["protocol"], "LEGACY-SERVO-1998")

        # GOTO WAYPOINT via framed legacy binary opcode 0x20
        cmd_wp = VehicleCommand(
            command_id="CMD-L01",
            vehicle_id="UAV-02-LEGACY",
            command_type=CommandType.GOTO_WAYPOINT,
            target_position=GeoPoint(latitude_deg=37.7812, longitude_deg=-122.4110, altitude_msl_m=125.0, altitude_relative_m=25.0),
        )
        res = self.legacy_adapter.execute_command(cmd_wp)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertIn("Legacy frame 0x20 ACKed", res.message)
        self.assertAlmostEqual(self.legacy_adapter.get_latest_telemetry().position.latitude_deg, 37.7812, places=4)

        # DEGRADATION: REDUCED_CAPABILITY
        cmd_deg = VehicleCommand(
            command_id="CMD-L02",
            vehicle_id="UAV-02-LEGACY",
            command_type=CommandType.SET_DEGRADATION_MODE,
            target_degradation=DegradationMode.REDUCED_CAPABILITY,
        )
        res = self.legacy_adapter.execute_command(cmd_deg)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.legacy_adapter.get_latest_telemetry().degradation_mode, DegradationMode.REDUCED_CAPABILITY)

        # RECALL
        cmd_recall = VehicleCommand(command_id="CMD-L03", vehicle_id="UAV-02-LEGACY", command_type=CommandType.RECALL)
        res = self.legacy_adapter.execute_command(cmd_recall)
        self.assertEqual(res.status, CommandStatus.COMPLETED)
        self.assertEqual(self.legacy_adapter.get_latest_telemetry().flight_mode, FlightMode.RTL)


if __name__ == "__main__":
    unittest.main()
