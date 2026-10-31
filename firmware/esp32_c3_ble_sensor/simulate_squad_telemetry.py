#!/usr/bin/env python3
"""
Second Skin Sport - Multi-Athlete Squad Telemetry Simulator
Agent 1: Firmware Specialist

This simulator generates high-fidelity raw IMU telemetry matching the ESP32-C3 + MPU6050
firmware protocol and streams batches to Spring Boot Backend (POST /api/v1/sensor/batches).

Physical Units Convention (Mandatory):
- Accelerations (ax, ay, az): m/s^2 (Standard SI, 1g = 9.80665 m/s^2)
- Angular Velocity (gx, gy, gz): deg/s (degrees per second)
"""

import sys
import time
import math
import random
import json
import argparse
from datetime import datetime, timezone

try:
    import urllib.request
except ImportError:
    pass

BACKEND_BATCH_URL = "http://localhost:8080/api/v1/sensor/batches"

SQUAD_DEVICES = [
    {"deviceId": "SSS-PATCH-001", "name": "Alex Johnson", "number": 7, "role": "STARTER", "fatigue_rate": 1.5},
    {"deviceId": "SSS-PATCH-002", "name": "Sarah Jenkins", "number": 23, "role": "STARTER", "fatigue_rate": 0.8},
    {"deviceId": "SSS-PATCH-003", "name": "David Beckham", "number": 34, "role": "STARTER", "fatigue_rate": 1.2},
    {"deviceId": "SSS-PATCH-004", "name": "Chris Paul", "number": 11, "role": "BENCH", "fatigue_rate": 0.1},
    {"deviceId": "SSS-PATCH-005", "name": "Emma Watson", "number": 15, "role": "BENCH", "fatigue_rate": 0.1},
]

def generate_imu_reading(is_fatigue_sprint=False, is_jump=False):
    """
    Generates 6-axis kinematics adhering to physical units.
    """
    if is_jump:
        # High impact landing: 4g - 5.5g in m/s^2 (39 - 54 m/s^2)
        ax = random.uniform(-2.0, 2.0)
        ay = random.uniform(-2.0, 2.0)
        az = random.uniform(39.2, 53.9)
        gx = random.uniform(-120.0, 120.0)
        gy = random.uniform(-90.0, 90.0)
        gz = random.uniform(-60.0, 60.0)
        intensity = 95
    elif is_fatigue_sprint:
        # Intense movement with deceleration spikes
        ax = random.uniform(8.0, 14.5) * (1 if random.random() > 0.5 else -1)
        ay = random.uniform(6.0, 12.0) * (1 if random.random() > 0.5 else -1)
        az = 9.81 + random.uniform(-4.0, 8.0)
        gx = random.uniform(-180.0, 180.0)
        gy = random.uniform(-140.0, 140.0)
        gz = random.uniform(-110.0, 110.0)
        intensity = random.randint(85, 98)
    else:
        # Normal running / court positioning
        ax = random.uniform(-3.5, 3.5)
        ay = random.uniform(-3.0, 3.0)
        az = 9.81 + random.uniform(-2.0, 2.5)
        gx = random.uniform(-45.0, 45.0)
        gy = random.uniform(-35.0, 35.0)
        gz = random.uniform(-30.0, 30.0)
        intensity = random.randint(55, 75)

    pitch = math.atan2(ay, math.sqrt(ax * ax + az * az)) * 180.0 / math.pi
    roll = math.atan2(-ax, az) * 180.0 / math.pi
    yaw = random.uniform(-180.0, 180.0)

    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    return {
        "timestamp": now_iso,
        "accelerometerX": round(ax, 2),
        "accelerometerY": round(ay, 2),
        "accelerometerZ": round(az, 2),
        "gyroscopeX": round(gx, 2),
        "gyroscopeY": round(gy, 2),
        "gyroscopeZ": round(gz, 2),
        "pitch": round(pitch, 1),
        "roll": round(roll, 1),
        "yaw": round(yaw, 1),
        "movementIntensity": intensity
    }

def send_device_batch(device_info, num_samples=10, simulate_high_fatigue=False):
    """
    Builds SensorBatchDTO and POSTs to Spring Boot backend.
    """
    is_starter = device_info.get("role") == "STARTER"
    readings = []

    for i in range(num_samples):
        # 15% chance of jump for starters, higher if high fatigue simulation
        is_jump = is_starter and (random.random() < 0.25 if simulate_high_fatigue else random.random() < 0.10)
        reading = generate_imu_reading(is_fatigue_sprint=simulate_high_fatigue or is_starter, is_jump=is_jump)
        readings.append(reading)

    payload = {
        "deviceId": device_info["deviceId"],
        "sessionId": 1,
        "batteryLevel": random.randint(75, 98),
        "readings": readings
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BACKEND_BATCH_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, body
    except Exception as e:
        return 0, str(e)

def main():
    parser = argparse.ArgumentParser(description="Second Skin Sport - Squad Telemetry Simulator")
    parser.add_argument("--iterations", type=int, default=10, help="Number of batch cycles to send (default: 10)")
    parser.add_argument("--interval", type=float, default=1.5, help="Seconds between batches (default: 1.5)")
    parser.add_argument("--fatigue-target", type=str, default="SSS-PATCH-001", help="Device ID to trigger fatigue rotation alert")
    args = parser.parse_args()

    print("==================================================================")
    print(" 🏀 SECOND SKIN SPORT - SQUAD TACTICAL SIMULATOR (FIRMWARE AGENT)")
    print("==================================================================")
    print(f"Target: {BACKEND_BATCH_URL}")
    print(f"Cycles: {args.iterations} | Interval: {args.interval}s")
    print(f"High-Fatigue Stress Device: {args.fatigue_target}")
    print("------------------------------------------------------------------")

    for cycle in range(1, args.iterations + 1):
        print(f"\n[Cycle {cycle}/{args.iterations}] Streaming squad sensor batches...")
        for dev in SQUAD_DEVICES:
            is_target = dev["deviceId"] == args.fatigue_target
            status, res = send_device_batch(dev, num_samples=8, simulate_high_fatigue=is_target)
            marker = "⚠️ HIGH LOAD" if is_target else "⚡ Normal"
            print(f"  -> {dev['name']} ({dev['deviceId']}) [{marker}]: HTTP {status}")
        time.sleep(args.interval)

    print("\n✅ Simulation cycle completed! Check Coach Tactical Command Dashboard.")

if __name__ == "__main__":
    main()
