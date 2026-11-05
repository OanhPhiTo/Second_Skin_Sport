import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import bleService from '../services/bleService';
import { sessionService } from '../services/api';

const BleContext = createContext(null);

export function BleProvider({ children }) {
  const initialDevInfo = bleService.getDeviceInfo();
  const [bleStatus, setBleStatus] = useState(initialDevInfo.isConnected ? 'connected' : 'disconnected');
  const [bleDevice, setBleDevice] = useState(
    initialDevInfo.isConnected ? { deviceName: initialDevInfo.deviceName, deviceId: initialDevInfo.deviceId } : null
  );
  const [bleError, setBleError] = useState('');
  const [livePacketCount, setLivePacketCount] = useState(0);
  const [bleTelemetry, setBleTelemetry] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Dynamic Battery Tracker: Supports real ADC hardware telemetry and active session drain simulation
  const batteryTrackerRef = useRef({
    currentBat: (() => {
      try {
        const saved = localStorage.getItem('sss_battery_level');
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (!isNaN(parsed) && parsed >= 5 && parsed <= 100) return parsed;
        }
      } catch (e) {}
      return 96;
    })(),
    lastHwBat: null,
    hwBatChangeCount: 0,
    lastDrainTime: Date.now(),
    lastChargeTime: Date.now(),
    isCharging: (() => {
      try {
        return localStorage.getItem('sss_is_charging') === 'true';
      } catch (e) {
        return false;
      }
    })(),
  });

  const [isCharging, setIsCharging] = useState(batteryTrackerRef.current.isCharging);

  // Normalized live sensor status for components like SensorCard
  const [sensorStatus, setSensorStatus] = useState({
    connected: initialDevInfo.isConnected,
    batteryLevel: batteryTrackerRef.current.currentBat,
    isCharging: batteryTrackerRef.current.isCharging,
    deviceName: initialDevInfo.deviceName || 'SecondSkin_ESP32',
    currentData: {
      accelerometerX: 0.0,
      accelerometerY: 0.0,
      accelerometerZ: 9.81,
      gyroscopeX: 0.0,
      gyroscopeY: 0.0,
      gyroscopeZ: 0.0,
      pitch: 0.0,
      roll: 0.0,
      yaw: 0.0,
      movementIntensity: 0,
    },
  });

  // Persistent in-memory Auto Session State (Kinematic FSM & Zero-Touch Tracking)
  const isSavingSessionRef = useRef(false);
  const autoSessionRef = useRef({
    status: 'idle', // 'idle' | 'recording' | 'cooldown'
    startTime: null,
    lastActiveTime: null,
    kineState: 'GROUND', // 'GROUND' | 'TAKEOFF' | 'AIRBORNE' | 'REFRACTORY'
    airtimeStartTime: 0,
    takeoffTime: 0,
    lastJumpTime: 0,
    lastStepTime: 0,
    lastTurnTime: 0,
    consecutiveRunSteps: 0,
    consecutiveWalkSteps: 0,
    supportedSamplesInAir: 0,
    hardwareBaselineJumps: 0,
    hardwareBaselineSteps: 0,
    takeoffPitch: 0,
    jumpCount: 0,
    stepCount: 0,
    walkStepCount: 0,
    runStepCount: 0,
    directionChangeCount: 0,
    sampleCount: 0,
    accelSum: 0,
    maxAccel: 0,
    lastJumpHeightCm: 0,
    lastAirtime: 0,
    lastImpactG: 0,
    cadence: 0,
    classifiedActivity: 'idle',
    trajectoryPoints: [], // max 60 points in RAM
  });

  const [autoSessionDisplay, setAutoSessionDisplay] = useState({
    status: 'idle',
    elapsedSeconds: 0,
    hardwareBaselineJumps: 0,
    hardwareBaselineSteps: 0,
    takeoffPitch: 0,
    jumpCount: 0,
    stepCount: 0,
    walkStepCount: 0,
    runStepCount: 0,
    cadence: 0,
    jumpHeight: 0,
    directionChangeCount: 0,
    avgAccel: 0,
    sport: 'Running',
    landingSoftness: 84,
    peakImpactG: 2.1,
    explosiveness: 86,
    airtime: 0.38,
    bilateralBalance: 94,
    trunkStability: 88,
    classifiedActivity: 'idle',
    lastSavedSession: null,
    isSaving: false,
  });

  // Wi-Fi Provisioning State
  const [wifiSending, setWifiSending] = useState(false);
  const [wifiFeedback, setWifiFeedback] = useState(null);

  // Finalize auto session helper
    const startTrackingSession = useCallback(({ sport = 'Basketball', targetDurationMinutes = 45 } = {}) => {
    if (bleStatus !== 'connected') {
      throw new Error('Chưa kết nối thiết bị cảm biến Second Skin Pod.');
    }
    const session = autoSessionRef.current;
    session.status = 'recording';
    session.startTime = new Date();
    session.lastActiveTime = Date.now();
    session.targetSport = sport;
    session.targetDurationMinutes = targetDurationMinutes;
    session.sampleCount = 0;
    session.accelSum = 0;
    session.maxAccel = 0;
    session.hardwareBaselineJumps = bleTelemetry?.jc || 0;
    session.hardwareBaselineSteps = bleTelemetry?.steps || 0;
    try {
      bleService.sendResetSessionCommand();
    } catch (e) {}
    session.stepCount = 0;
          session.walkStepCount = 0;
          session.runStepCount = 0;
    session.directionChangeCount = 0;
    session.trajectoryPoints = [];

    setAutoSessionDisplay({
      status: 'recording',
      elapsedSeconds: 0,
      targetDurationMinutes,
      sport,
      hardwareBaselineJumps: 0,
    hardwareBaselineSteps: 0,
    takeoffPitch: 0,
    jumpCount: 0,
    stepCount: 0,
    walkStepCount: 0,
    runStepCount: 0,
      cadence: 0,
      jumpHeight: 0,
      directionChangeCount: 0,
      avgAccel: 0,
      landingSoftness: 85,
      peakImpactG: 2.1,
      explosiveness: 80,
      airtime: 0,
      bilateralBalance: 94,
      trunkStability: 88,
      classifiedActivity: 'active',
      isSaving: false,
    });
    setActionMessage(`⏱ Đang theo dõi buổi tập ${sport} (${targetDurationMinutes} phút)... Hãy bắt đầu vận động!`);
    return true;
  }, [bleStatus]);

  const finalizeAutoSession = useCallback(async (manual = false) => {
    const session = autoSessionRef.current;
    if (session.status === 'idle' || session.status === 'saving' || isSavingSessionRef.current) return;
    isSavingSessionRef.current = true;
    session.status = 'saving';

    setAutoSessionDisplay((prev) => ({ ...prev, isSaving: true }));
    try {
      const endTime = new Date();
      const startTime = session.startTime || new Date(Date.now() - 60000);
      const durationMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
      const avgAccel = session.sampleCount > 0
        ? Math.round((session.accelSum / session.sampleCount) * 100) / 100
        : 2.85;

      // Distinguish sport: Basketball vs Walking vs Running
      const detectedSport = session.targetSport || (session.jumpCount >= 8 || (session.jumpCount >= 4 && session.directionChangeCount >= 25))
        ? 'Basketball'
        : (session.classifiedActivity === 'walking' || (session.stepCount > 0 && session.cadence > 0 && session.cadence < 125))
          ? 'Walking'
          : 'Running';

      const payload = {
        deviceId: bleService.device?.name || 'SecondSkin_ESP32',
        sport: detectedSport,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durationMin,
        totalJumps: session.jumpCount,
        directionChanges: session.directionChangeCount,
        averageAcceleration: avgAccel,
        averageSpeed: detectedSport === 'Basketball' ? 18.2 : 14.8,
        movementIntensity: Math.min(100, Math.round(avgAccel * 25)),
        trajectoryPoints: session.trajectoryPoints,
      };

      const saved = await sessionService.createAutoSession(payload);
      setActionMessage(`🎉 Buổi tập ${detectedSport} đã tự động lưu! Điểm đánh giá: ${saved.performanceScore || 88}/100.`);
      
      // Dispatch global session completed event for Notification Engine
      try {
        window.dispatchEvent(new CustomEvent('sss_session_completed', { detail: saved }));
      } catch (e) {}
      
      setAutoSessionDisplay({
        status: 'idle',
        elapsedSeconds: 0,
        hardwareBaselineJumps: 0,
    hardwareBaselineSteps: 0,
    takeoffPitch: 0,
    jumpCount: 0,
    stepCount: 0,
    walkStepCount: 0,
    runStepCount: 0,
        cadence: 0,
        jumpHeight: 0,
        directionChangeCount: 0,
        avgAccel: 0,
        sport: detectedSport,
        lastSavedSession: saved,
        isSaving: false,
      });

      try {
        bleService.sendResetSessionCommand();
      } catch (e) {}

      // Reset in-memory session ref
      autoSessionRef.current = {
        status: 'idle',
        startTime: null,
        lastActiveTime: null,
        kineState: 'GROUND',
        airtimeStartTime: 0,
        takeoffTime: 0,
        lastJumpTime: 0,
        lastStepTime: 0,
        lastTurnTime: 0,
        consecutiveRunSteps: 0,
        consecutiveWalkSteps: 0,
        supportedSamplesInAir: 0,
        hardwareBaselineJumps: 0,
    hardwareBaselineSteps: 0,
    takeoffPitch: 0,
    jumpCount: 0,
    stepCount: 0,
    walkStepCount: 0,
    runStepCount: 0,
        directionChangeCount: 0,
        sampleCount: 0,
        accelSum: 0,
        maxAccel: 0,
        lastJumpHeightCm: 0,
        lastAirtime: 0,
        lastImpactG: 0,
        cadence: 0,
        classifiedActivity: 'idle',
        trajectoryPoints: [],
      };

      setTimeout(() => setActionMessage(''), 7000);
    } catch (err) {
      console.error('Error saving auto session:', err);
      setAutoSessionDisplay((prev) => ({ ...prev, isSaving: false }));
    } finally {
      isSavingSessionRef.current = false;
      if (session.status === 'saving') {
        session.status = 'idle';
      }
    }
  }, []);

  // Listen to BLE data & status across the whole application lifecycle
  useEffect(() => {
    const unsubData = bleService.onData((data) => {
      const ax = data.ax ?? 0;
      const ay = data.ay ?? 0;
      const az = data.az ?? 9.81;
      const gx = data.gx ?? 0;
      const gy = data.gy ?? 0;
      const gz = data.gz ?? 0;
      const rawMagnitude = Math.hypot(ax, ay, az);
      const intensity = Math.min(100, Math.round(Math.hypot(ax, ay, az - 9.81) * 12));

      // Dynamic Battery & Charging Calculation:
      const rawHwBat = data.bat ?? data.b;
      const tracker = batteryTrackerRef.current;
      let effectiveBattery = tracker.currentBat;

      // Detect hardware charging flag if available in payload
      if (data.chg !== undefined && data.chg !== null) {
        const hwChg = Boolean(data.chg);
        if (tracker.isCharging !== hwChg) {
          tracker.isCharging = hwChg;
          setIsCharging(hwChg);
          try {
            localStorage.setItem('sss_is_charging', hwChg.toString());
          } catch (e) {}
        }
      }

      if (rawHwBat !== undefined && rawHwBat !== null && rawHwBat > 0 && rawHwBat <= 100) {
        if (tracker.lastHwBat !== null && rawHwBat !== tracker.lastHwBat) {
          // Hardware ADC or dynamic firmware is actively updating battery
          tracker.hwBatChangeCount++;
          tracker.currentBat = rawHwBat;
          tracker.lastDrainTime = Date.now();
          tracker.lastChargeTime = Date.now();
          effectiveBattery = rawHwBat;
          try {
            localStorage.setItem('sss_battery_level', effectiveBattery.toString());
          } catch (e) {}
        } else if (tracker.hwBatChangeCount > 0) {
          effectiveBattery = rawHwBat;
        } else {
          // Hardware value is static (e.g. initial packet, or older firmware sending static 92)
          if (tracker.lastHwBat === null) {
            tracker.currentBat = rawHwBat;
            effectiveBattery = rawHwBat;
            tracker.lastDrainTime = Date.now();
            tracker.lastChargeTime = Date.now();
          } else {
            const nowTime = Date.now();
            if (tracker.isCharging) {
              // Charging mode: battery percentage increases up to 100% (+1% every 25s)
              if (nowTime - tracker.lastChargeTime >= 25000) {
                tracker.lastChargeTime = nowTime;
                if (tracker.currentBat < 100) {
                  tracker.currentBat = Math.min(100, tracker.currentBat + 1);
                  effectiveBattery = tracker.currentBat;
                  try {
                    localStorage.setItem('sss_battery_level', effectiveBattery.toString());
                  } catch (e) {}
                }
              } else {
                effectiveBattery = tracker.currentBat;
              }
            } else {
              // Discharging mode: during active operational sports test
              const drainInterval = intensity > 40 ? 60000 : 120000;
              if (nowTime - tracker.lastDrainTime >= drainInterval) {
                tracker.lastDrainTime = nowTime;
                tracker.currentBat = Math.max(5, tracker.currentBat - 1);
                effectiveBattery = tracker.currentBat;
                try {
                  localStorage.setItem('sss_battery_level', effectiveBattery.toString());
                } catch (e) {}
              } else {
                effectiveBattery = tracker.currentBat;
              }
            }
          }
        }
        tracker.lastHwBat = rawHwBat;
      }

      setLivePacketCount((prev) => prev + 1);
      setBleTelemetry({
        ...data,
        bat: effectiveBattery,
        chg: tracker.isCharging,
      });

      // Real-time update into normalized sensor status
      setSensorStatus({
        connected: true,
        batteryLevel: effectiveBattery,
        isCharging: tracker.isCharging,
        deviceName: bleService.device?.name || 'SecondSkin_ESP32',
        currentData: {
          accelerometerX: ax,
          accelerometerY: ay,
          accelerometerZ: az,
          gyroscopeX: gx,
          gyroscopeY: gy,
          gyroscopeZ: gz,
          pitch: data.pitch ?? 0,
          roll: data.roll ?? 0,
          yaw: data.yaw ?? 0,
          movementIntensity: intensity,
        },
      });

      const gyroMagnitude = Math.hypot(gx, gy, gz);

      // Intelligent Auto-Session Processing (Multi-axis Kinematic FSM)
      const dynAccel = Math.abs(rawMagnitude - 9.80665);
      const isFirmwareActive = Boolean(data.s && ['active', 'running', 'walking', 'jumping'].includes(data.s));
      const isMotionActive = isFirmwareActive || dynAccel > 1.2 || gyroMagnitude > 40.0;
      const dataState = isMotionActive ? 'active' : (dynAccel < 0.6 && gyroMagnitude < 20.0 ? 'idle' : 'cooldown');
      const now = Date.now();
      const session = autoSessionRef.current;

      // 1. Refractory Lockout Recovery
      if (session.kineState === 'REFRACTORY') {
        if (now - session.lastJumpTime >= 550) {
          session.kineState = 'GROUND';
        }
      }

      // 2. Kinematic State Machine for Jump Detection (Multi-axis Kinematic FSM)
      // Sequence: GROUND -> TAKEOFF -> AIRBORNE (free fall < 7.2 m/s² >= 150ms) -> LANDING (impact >= 15.0 m/s²) -> REFRACTORY (550ms)
      switch (session.kineState) {
        case 'GROUND':
          // Natural takeoff thrust (>= 12.5 m/s²) to enter jump sequence (rejects walking / steady gravity)
          if (rawMagnitude >= 12.5) {
            session.kineState = 'TAKEOFF';
            session.takeoffTime = now;
            session.takeoffPitch = data.pitch ?? 0;
          }
          break;

        case 'TAKEOFF':
          if (rawMagnitude < 8.0) {
            // Orientation stability check: in thigh lift, sensor tilts heavily (> 45°), whereas in sports jump/layup trunk remains within range
            const pitchDelta = Math.abs((data.pitch ?? 0) - (session.takeoffPitch || 0));
            if (gyroMagnitude <= 450.0 && pitchDelta < 45.0) {
              session.kineState = 'AIRBORNE';
              session.airtimeStartTime = now;
              session.supportedSamplesInAir = 0;
            } else {
              session.kineState = 'GROUND';
            }
          } else if (now - session.takeoffTime > 350) {
            session.kineState = 'GROUND';
          }
          break;

        case 'AIRBORNE':
          if (gyroMagnitude > 450.0) {
            session.kineState = 'GROUND';
            session.supportedSamplesInAir = 0;
          } else if (rawMagnitude < 8.0) {
            session.supportedSamplesInAir = 0;
          } else if (rawMagnitude >= 13.0) {
            // Touchdown landing impact! (Valid jump confirmed)
            const flightDurationMs = now - session.airtimeStartTime;
            if (flightDurationMs >= 135 && flightDurationMs <= 850) {
              session.jumpCount += 1;
              session.lastJumpTime = now;
              const airtimeSec = flightDurationMs / 1000.0;
              session.lastAirtime = Math.round(airtimeSec * 100) / 100;
              // Jump height: h = (1/8) * g * t^2
              session.lastJumpHeightCm = Math.round(0.125 * 9.80665 * airtimeSec * airtimeSec * 1000) / 10;
              session.lastImpactG = Math.round((rawMagnitude / 9.80665) * 10) / 10;
              session.kineState = 'REFRACTORY';
              session.classifiedActivity = 'jumping';
              session.consecutiveRunSteps = 0;
              session.consecutiveWalkSteps = 0;
              session.lastStepTime = now;
            } else {
              session.kineState = 'GROUND';
            }
          } else if (rawMagnitude >= 8.5 && rawMagnitude < 12.8) {
            session.supportedSamplesInAir = (session.supportedSamplesInAir || 0) + 1;
            if (session.supportedSamplesInAir >= 3) {
              session.kineState = 'GROUND';
              session.supportedSamplesInAir = 0;
            }
          } else if (now - session.airtimeStartTime > 850) {
            session.kineState = 'GROUND';
          }
          break;

        case 'REFRACTORY':
          break;
      }

      // 3. Phân biệt Đi bộ (Walking) vs Chạy bộ (Running):
      // Không kích hoạt bước chân khi đang bay, trong thời gian chống dội hoặc trong vòng 350ms sau cú nhảy
      if (session.kineState !== 'AIRBORNE' && session.kineState !== 'REFRACTORY' && (now - session.lastJumpTime > 500)) {
        const stepInterval = now - session.lastStepTime;

        // Kịch bản A: Chạy bộ (Running) - Xung lực mạnh (14.0 - 25.0 m/s²), nhịp nhanh (200 - 480ms)
        if (rawMagnitude >= 14.0 && rawMagnitude <= 25.0) {
          if (stepInterval >= 200 && stepInterval <= 480) {
            session.consecutiveRunSteps = (session.consecutiveRunSteps || 0) + 1;
            session.consecutiveWalkSteps = 0;
            if (session.consecutiveRunSteps >= 2) {
              session.runStepCount = (session.runStepCount || 0) + 1;
              session.stepCount = (session.walkStepCount || 0) + session.runStepCount;
              session.cadence = Math.round(60000 / stepInterval);
              session.classifiedActivity = 'running';
            }
            session.lastStepTime = now;
          } else if (stepInterval > 480 && stepInterval <= 850) {
            session.consecutiveWalkSteps = (session.consecutiveWalkSteps || 0) + 1;
            session.consecutiveRunSteps = 0;
            if (session.consecutiveWalkSteps >= 2) {
              session.walkStepCount = (session.walkStepCount || 0) + 1;
              session.stepCount = session.walkStepCount + (session.runStepCount || 0);
              session.cadence = Math.round(60000 / stepInterval);
              session.classifiedActivity = 'walking';
            }
            session.lastStepTime = now;
          } else if (stepInterval > 950) {
            session.consecutiveWalkSteps = 1;
            session.consecutiveRunSteps = 0;
            session.lastStepTime = now;
          }
        }
      }

      // Tự động chuyển về trạng thái IDLE nếu không chuyển động sau 2.5s
      if (now - session.lastStepTime > 2500 && now - session.lastJumpTime > 2500) {
        if (session.classifiedActivity !== 'idle') {
          session.classifiedActivity = 'idle';
        }
        session.consecutiveRunSteps = 0;
        session.consecutiveWalkSteps = 0;
      }

      // If firmware transmitted steps or jump count directly, sync relative to session baseline
      const rawHardwareJumps = data.jc ?? 0;
      const rawHardwareSteps = data.steps ?? 0;
      const rawHardwareWalkSteps = data.wsteps ?? (data.ws ?? 0);
      const rawHardwareRunSteps = data.rsteps ?? (data.rs ?? 0);

      if (rawHardwareJumps < (session.hardwareBaselineJumps || 0)) {
        session.hardwareBaselineJumps = 0;
      }
      if (rawHardwareSteps < (session.hardwareBaselineSteps || 0)) {
        session.hardwareBaselineSteps = 0;
      }
      if (rawHardwareWalkSteps < (session.hardwareBaselineWalkSteps || 0)) {
        session.hardwareBaselineWalkSteps = 0;
      }
      if (rawHardwareRunSteps < (session.hardwareBaselineRunSteps || 0)) {
        session.hardwareBaselineRunSteps = 0;
      }

      const relativeHwJumps = Math.max(0, rawHardwareJumps - (session.hardwareBaselineJumps || 0));
      const relativeHwSteps = Math.max(0, rawHardwareSteps - (session.hardwareBaselineSteps || 0));
      const relativeHwWalkSteps = Math.max(0, rawHardwareWalkSteps - (session.hardwareBaselineWalkSteps || 0));
      const relativeHwRunSteps = Math.max(0, rawHardwareRunSteps - (session.hardwareBaselineRunSteps || 0));

      if (relativeHwJumps > session.jumpCount) {
        session.jumpCount = relativeHwJumps;
        if (data.jh !== undefined && data.jh > 0) {
          session.lastJumpHeightCm = data.jh;
        }
      }
      if (relativeHwWalkSteps > (session.walkStepCount || 0)) {
        session.walkStepCount = relativeHwWalkSteps;
      }
      if (relativeHwRunSteps > (session.runStepCount || 0)) {
        session.runStepCount = relativeHwRunSteps;
      }
      const calculatedTotalSteps = Math.max(
        relativeHwSteps,
        (session.walkStepCount || 0) + (session.runStepCount || 0)
      );
      if (calculatedTotalSteps > session.stepCount) {
        session.stepCount = calculatedTotalSteps;
      }

      // Agility direction turn (> 120°/s)
      if (gyroMagnitude > 75.0 && now - session.lastTurnTime > 350) {
        session.directionChangeCount += 1;
        session.lastTurnTime = now;
      }

      // Auto Start Trigger
      if (dataState === 'active') {
        session.lastActiveTime = now;
        if (session.status === 'idle') {
          session.status = 'recording';
          session.startTime = new Date();
          session.sampleCount = 0;
          session.accelSum = 0;
          session.maxAccel = 0;
          session.directionChangeCount = 0;
          session.hardwareBaselineJumps = data.jc || 0;
          session.hardwareBaselineSteps = data.steps || 0;
          session.jumpCount = 0;
          session.stepCount = 0;
          session.walkStepCount = 0;
          session.runStepCount = 0;
          session.trajectoryPoints = [];
          try {
            bleService.sendResetSessionCommand();
          } catch (e) {}
          setAutoSessionDisplay((prev) => ({
            ...prev,
            status: 'recording',
            classifiedActivity: 'active',
          }));
          session.trajectoryPoints = [];
          setActionMessage('🏃 Đã phát hiện vận động! Hệ thống đang tự động ghi nhận phiên tập...');
        } else if (session.status === 'cooldown') {
          session.status = 'recording';
        }
      } else if (dataState === 'cooldown' && session.status === 'recording') {
        session.status = 'cooldown';
      }

      // Accumulate metrics
      if (session.status === 'recording' || session.status === 'cooldown') {
        session.sampleCount += 1;
        session.accelSum += rawMagnitude;
        if (rawMagnitude > session.maxAccel) {
          session.maxAccel = rawMagnitude;
        }

        // Downsample trajectory (1 pt per 10 samples, max 60)
        if (session.sampleCount % 10 === 0 && session.trajectoryPoints.length < 60) {
          session.trajectoryPoints.push({
            timestamp: new Date().toISOString(),
            accelerometerX: ax,
            accelerometerY: ay,
            accelerometerZ: az,
            gyroscopeX: gx,
            gyroscopeY: gy,
            gyroscopeZ: gz,
            pitch: data.pitch ?? 0,
            roll: data.roll ?? 0,
            yaw: data.yaw ?? 0,
            movementIntensity: intensity,
          });
        }
      }
    });

    const unsubStatus = (status, details) => {
      setBleStatus(status);
      if (status === 'connected') {
        setBleDevice(details);
        setBleError('');
        setSensorStatus((prev) => ({
          ...prev,
          connected: true,
          deviceName: details.deviceName || 'SecondSkin_ESP32',
        }));
        setActionMessage(`Đã kết nối Bluetooth với ${details.deviceName || 'ESP32-C3'}!`);
        setTimeout(() => setActionMessage(''), 4000);
      } else if (status === 'disconnected') {
        setBleDevice(null);
        setBleTelemetry(null);
        setSensorStatus((prev) => ({ ...prev, connected: false }));
        const activeSession = autoSessionRef.current;
        if (activeSession && (activeSession.status === 'recording' || activeSession.status === 'cooldown')) {
          const hasData = activeSession.sampleCount >= 15 ||
            (activeSession.startTime && (Date.now() - activeSession.startTime.getTime()) >= 15000);
          if (hasData) {
            setActionMessage('⚠️ Thiết bị đã tắt / ngắt kết nối. Đang tự động lưu phiên tập...');
            finalizeAutoSession(false);
          } else {
            activeSession.status = 'idle';
            setAutoSessionDisplay((prev) => ({ ...prev, status: 'idle', elapsedSeconds: 0, isSaving: false }));
            setActionMessage('Đã ngắt kết nối Bluetooth.');
            setTimeout(() => setActionMessage(''), 3000);
          }
        } else {
          setActionMessage('Đã ngắt kết nối Bluetooth.');
        }
        setTimeout(() => setActionMessage(''), 3000);
      } else if (status === 'error') {
        setBleError(details.error || 'Lỗi kết nối Bluetooth');
      }
    };
    const unsubStatusRemover = bleService.onStatus(unsubStatus);

    const unsubWifi = bleService.onWifiStatus((res) => {
      setWifiSending(false);
      setWifiFeedback(res);
    });

    return () => {
      unsubData();
      unsubStatusRemover();
      unsubWifi();
    };
  }, []);

  // Timer ticker: updates live elapsed time and auto-finalizes when user rests for 3 mins
  useEffect(() => {
    const timer = setInterval(() => {
      const session = autoSessionRef.current;
      if (session.status === 'recording' || session.status === 'cooldown') {
        const now = Date.now();
        const elapsed = session.startTime ? Math.floor((now - session.startTime.getTime()) / 1000) : 0;
        const avg = session.sampleCount > 0 ? (session.accelSum / session.sampleCount) : 2.5;
        const detectedSport = (session.jumpCount >= 8 || (session.jumpCount >= 4 && session.directionChangeCount >= 25))
          ? 'Basketball'
          : (session.classifiedActivity === 'walking' || (session.stepCount > 0 && session.cadence > 0 && session.cadence < 125))
            ? 'Walking'
            : 'Running';

        const peakG = session.lastImpactG > 0
          ? session.lastImpactG
          : Math.round(Math.min(3.6, Math.max(1.8, ((session.maxAccel || avg) / 9.80665))) * 10) / 10;
        const softness = Math.round(100 - Math.min(55, Math.max(0, (peakG - 1.8) * 22)));
        const explosiveness = Math.min(100, Math.max(50, Math.round((session.maxAccel || avg) * 3.2)));
        const airtime = session.lastAirtime > 0 ? session.lastAirtime : (session.jumpCount > 0 ? 0.38 : 0.0);
        const trunkStability = Math.min(96, Math.max(72, Math.round(100 - (avg * 3.5))));

        setAutoSessionDisplay((prev) => ({
          ...prev,
          status: session.status,
          elapsedSeconds: elapsed,
          jumpCount: session.jumpCount,
          stepCount: session.stepCount,
          walkStepCount: session.walkStepCount || 0,
          runStepCount: session.runStepCount || 0,
          cadence: session.cadence,
          jumpHeight: session.lastJumpHeightCm,
          directionChangeCount: session.directionChangeCount,
          avgAccel: Math.round(avg * 100) / 100,
          sport: detectedSport,
          landingSoftness: softness,
          peakImpactG: peakG,
          explosiveness: explosiveness,
          airtime: airtime,
          bilateralBalance: 94,
          trunkStability: trunkStability,
          classifiedActivity: session.classifiedActivity,
        }));

        // Auto finalize if user has rested for >= 180 seconds (3 mins) with sufficient data (> 50 samples)
        if (!isSavingSessionRef.current && session.status !== 'saving' && session.lastActiveTime && now - session.lastActiveTime >= 180000 && session.sampleCount >= 50) {
          finalizeAutoSession(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [finalizeAutoSession]);

  // Dynamic battery decay or charge in standby/mock mode
  useEffect(() => {
    const interval = setInterval(() => {
      if (bleStatus !== 'connected') {
        const tracker = batteryTrackerRef.current;
        const now = Date.now();
        if (tracker.isCharging) {
          // Charging in standby/mock: +1% every 25s
          if (now - tracker.lastChargeTime >= 25000) {
            tracker.lastChargeTime = now;
            if (tracker.currentBat < 100) {
              tracker.currentBat = Math.min(100, tracker.currentBat + 1);
              setSensorStatus((prev) => ({
                ...prev,
                batteryLevel: tracker.currentBat,
                isCharging: true,
              }));
              try {
                localStorage.setItem('sss_battery_level', tracker.currentBat.toString());
              } catch (e) {}
            }
          }
        } else {
          // Discharging in standby/mock mode: 1% drain every 150s (2.5 minutes)
          if (now - tracker.lastDrainTime >= 150000) {
            tracker.lastDrainTime = now;
            tracker.currentBat = Math.max(5, tracker.currentBat - 1);
            setSensorStatus((prev) => ({
              ...prev,
              batteryLevel: tracker.currentBat,
              isCharging: false,
            }));
            try {
              localStorage.setItem('sss_battery_level', tracker.currentBat.toString());
            } catch (e) {}
          }
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [bleStatus]);

  // Actions
  const connectBle = async () => {
    setBleError('');
    try {
      const dev = await bleService.connect();
      return dev;
    } catch (err) {
      console.error('BLE connection failed:', err);
      setBleError(err.message || 'Không thể kết nối Bluetooth.');
      throw err;
    }
  };

  const disconnectBle = async () => {
    try {
      await bleService.disconnect();
    } catch (err) {
      console.error('BLE disconnect error:', err);
    }
  };

  const sendWifiConfig = async ({ ssid, password, backendUrl }) => {
    setWifiSending(true);
    setWifiFeedback({ status: 'sending', msg: 'Đang gửi thông tin Wi-Fi xuống ESP32...' });
    try {
      await bleService.sendWifiConfig({ ssid, password, backendUrl });
    } catch (err) {
      setWifiSending(false);
      setWifiFeedback({ status: 'wifi_failed', msg: err.message || 'Lỗi gửi lệnh xuống ESP32' });
      throw err;
    }
  };

  const toggleCharging = useCallback(async (state) => {
    if (bleStatus !== 'connected' || !bleService.isConnected) {
      setActionMessage('Chưa kết nối thiết bị BLE thực tế để thay đổi trạng thái sạc.');
      return false;
    }
    const targetState = state !== undefined ? Boolean(state) : !batteryTrackerRef.current.isCharging;
    batteryTrackerRef.current.isCharging = targetState;
    batteryTrackerRef.current.lastChargeTime = Date.now();
    batteryTrackerRef.current.lastDrainTime = Date.now();
    setIsCharging(targetState);
    try {
      localStorage.setItem('sss_is_charging', targetState.toString());
    } catch (e) {}

    // Send command to ESP32 over BLE if connected
    try {
      await bleService.sendChargingCommand(targetState);
    } catch (e) {}

    setActionMessage(
      targetState
        ? '⚡ Đã kết nối nguồn sạc! Pin đang được nạp điện (+1%/25s).'
        : '🔋 Đã ngắt sạc. Thiết bị chuyển sang sử dụng pin Li-Po nội bộ.'
    );
    setTimeout(() => setActionMessage(''), 4500);
    return true;
  }, [bleStatus]);

  const value = {
    bleStatus,
    bleDevice,
    bleError,
    livePacketCount,
    bleTelemetry,
    sensorStatus,
    isCharging,
    toggleCharging,
    autoSession: autoSessionDisplay,
    actionMessage,
    setActionMessage,
    wifiSending,
    wifiFeedback,
    connectBle,
    disconnectBle,
    finalizeAutoSession,
    startTrackingSession,
    sendWifiConfig,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle() {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error('useBle must be used within a BleProvider');
  }
  return context;
}

export default BleContext;
