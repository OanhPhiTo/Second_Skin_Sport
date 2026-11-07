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

  // ----------------------------------------------------
  // 📝 CHẾ ĐỘ GHI LOG CSV & GẮN NHÃN DỮ LIỆU THỰC (BƯỚC 3)
  // ----------------------------------------------------
  const [isLoggingCsv, setIsLoggingCsv] = useState(false);
  const isLoggingCsvRef = useRef(false);
  const [csvActiveLabel, setCsvActiveLabel] = useState('RUN'); // 'IDLE' | 'WALK' | 'RUN' | 'JUMP'
  const csvActiveLabelRef = useRef('RUN');
  const [csvLogsCount, setCsvLogsCount] = useState(0);
  const csvLogsRef = useRef([]);

  useEffect(() => {
    isLoggingCsvRef.current = isLoggingCsv;
  }, [isLoggingCsv]);

  useEffect(() => {
    csvActiveLabelRef.current = csvActiveLabel;
  }, [csvActiveLabel]);

  // ----------------------------------------------------
  // ⚙️ CẤU HÌNH NGƯỠNG ĐỘNG HỌC (KINEMATIC FSM CONFIG STRUCT)
  // ----------------------------------------------------
  const [kinematicConfig, setKinematicConfig] = useState({
    flightThresh: 0.40,
    runImpact: 2.00,
    jumpImpact: 2.80,
    jumpAirtime: 220,
    runRefractory: 150,
    jumpRefractory: 350,
  });

  // Dynamic Battery Tracker
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

  const [selectedSport, setSelectedSportState] = useState(() => {
    try {
      return localStorage.getItem('sss_selected_sport') || 'Basketball';
    } catch (e) {
      return 'Basketball';
    }
  });

  const setSelectedSport = useCallback((sport) => {
    setSelectedSportState(sport);
    try {
      localStorage.setItem('sss_selected_sport', sport);
    } catch (e) {}
    autoSessionRef.current.targetSport = sport;
    setAutoSessionDisplay((prev) => ({ ...prev, sport }));
  }, []);

  const isSavingSessionRef = useRef(false);
  const autoSessionRef = useRef({
    status: 'idle',
    startTime: null,
    lastActiveTime: null,
    targetSport: 'Basketball',
    jumpCount: 0,
    stepCount: 0,
    runStepCount: 0,
    walkStepCount: 0,
    directionChangeCount: 0,
    lastTurnTime: 0,
    sampleCount: 0,
    accelSum: 0,
    maxAccel: 0,
    lastJumpHeightCm: 0,
    lastAirtime: 0,
    lastImpactG: 0,
    cadence: 0,
    classifiedActivity: 'idle',
    trajectoryPoints: [],
  });

  const [autoSessionDisplay, setAutoSessionDisplay] = useState({
    status: 'idle',
    elapsedSeconds: 0,
    jumpCount: 0,
    stepCount: 0,
    runStepCount: 0,
    walkStepCount: 0,
    cadence: 0,
    jumpHeight: 0,
    directionChangeCount: 0,
    avgAccel: 0,
    sport: 'Basketball',
    landingSoftness: 84,
    peakImpactG: 2.1,
    explosiveness: 86,
    airtime: 0.38,
    trunkStability: 88,
    classifiedActivity: 'idle',
    lastSavedSession: null,
    isSaving: false,
  });

  const [wifiSending, setWifiSending] = useState(false);
  const [wifiFeedback, setWifiFeedback] = useState(null);

  // Bắt đầu phiên tập thủ công
  const startTrackingSession = useCallback(({ sport, targetDurationMinutes = 45 } = {}) => {
    if (bleStatus !== 'connected') {
      throw new Error('Chưa kết nối thiết bị cảm biến Second Skin Pod.');
    }
    const currentSport = sport || selectedSport || 'Basketball';
    const session = autoSessionRef.current;
    session.status = 'recording';
    session.startTime = new Date();
    session.lastActiveTime = Date.now();
    session.targetSport = currentSport;
    session.sampleCount = 0;
    session.accelSum = 0;
    session.maxAccel = 0;
    session.jumpCount = 0;
    session.stepCount = 0;
    session.runStepCount = 0;
    session.walkStepCount = 0;
    session.directionChangeCount = 0;
    session.trajectoryPoints = [];

    try {
      bleService.sendResetSessionCommand();
    } catch (e) {}

    setAutoSessionDisplay({
      status: 'recording',
      elapsedSeconds: 0,
      targetDurationMinutes,
      sport: currentSport,
      jumpCount: 0,
      stepCount: 0,
      runStepCount: 0,
      walkStepCount: 0,
      cadence: 0,
      jumpHeight: 0,
      directionChangeCount: 0,
      avgAccel: 0,
      landingSoftness: 85,
      peakImpactG: 2.1,
      explosiveness: 80,
      airtime: 0,
      trunkStability: 88,
      classifiedActivity: 'active',
      isSaving: false,
    });
    setActionMessage(`⏱ Đang theo dõi buổi tập ${currentSport} (${targetDurationMinutes} phút)... Hãy bắt đầu vận động!`);
    return true;
  }, [bleStatus, selectedSport]);

  // Lưu phiên tập
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
        ? Math.round(Math.max(1.5, ((session.dynamicAccelSum || session.accelSum || 0) / session.sampleCount) * 1.35) * 100) / 100
        : 2.85;

      const chosenSport = session.targetSport || selectedSport || 'Basketball';

      // Tính cường độ chuyển động thể thao thực tế (55% - 94%)
      const calculatedIntensity = session.sampleCount > 0 && session.intensitySum
        ? Math.min(94, Math.max(55, Math.round(session.intensitySum / session.sampleCount)))
        : Math.min(94, Math.max(55, Math.round(52 + (avgAccel - 1.5) * 14 + Math.min(18, session.jumpCount * 0.4))));

      // Tính điểm hiệu suất đa tiêu chí (68% - 96%)
      const skillBonus = chosenSport === 'Running'
        ? Math.min(32, Math.round(session.directionChangeCount * 0.4 + 10))
        : Math.min(38, Math.round(session.jumpCount * 0.75 + session.directionChangeCount * 0.15));
      const calculatedScore = Math.min(96, Math.max(68, Math.round(calculatedIntensity * 0.52 + skillBonus + 8)));

      const payload = {
        deviceId: bleService.device?.name || 'SecondSkin_ESP32',
        sport: chosenSport,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: durationMin,
        totalJumps: session.jumpCount,
        directionChanges: session.directionChangeCount,
        averageAcceleration: avgAccel,
        averageSpeed: chosenSport === 'Basketball' ? 18.2 : chosenSport === 'Volleyball' ? 16.0 : 14.8,
        movementIntensity: calculatedIntensity,
        performanceScore: calculatedScore,
        trajectoryPoints: session.trajectoryPoints,
      };

      const saved = await sessionService.createAutoSession(payload);
      const sportLabel = chosenSport === 'Basketball' ? 'Bóng rổ' : chosenSport === 'Volleyball' ? 'Bóng chuyền' : 'Chạy bộ';
      setActionMessage(`🎉 Buổi tập ${sportLabel} đã lưu thành công! Điểm đánh giá: ${saved.performanceScore || calculatedScore}/100.`);

      try {
        window.dispatchEvent(new CustomEvent('sss_session_completed', { detail: saved }));
      } catch (e) {}

      setAutoSessionDisplay({
        status: 'idle',
        elapsedSeconds: 0,
        jumpCount: 0,
        stepCount: 0,
        runStepCount: 0,
        walkStepCount: 0,
        cadence: 0,
        jumpHeight: 0,
        directionChangeCount: 0,
        avgAccel: 0,
        sport: chosenSport,
        lastSavedSession: saved,
        isSaving: false,
      });

      try {
        bleService.sendResetSessionCommand();
      } catch (e) {}

      autoSessionRef.current = {
        status: 'idle',
        startTime: null,
        lastActiveTime: null,
        jumpCount: 0,
        stepCount: 0,
        runStepCount: 0,
        walkStepCount: 0,
        directionChangeCount: 0,
        lastTurnTime: 0,
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

  // ----------------------------------------------------
  // 📥 LẮNG NGHE DỮ LIỆU TELEMETRY TỪ ESP32 QUA BLE
  // ----------------------------------------------------
  useEffect(() => {
    const unsubData = bleService.onData((data) => {
      const ax = data.ax ?? 0;
      const ay = data.ay ?? 0;
      const az = data.az ?? 9.81;
      const gx = data.gx ?? 0;
      const gy = data.gy ?? 0;
      const gz = data.gz ?? 0;
      const amagVal = data.amag !== undefined ? Number(data.amag) : Number((Math.hypot(ax, ay, az) / 9.80665).toFixed(2));
      const rawMagnitude = Math.hypot(ax, ay, az);
      // Gia tốc động học (loại bỏ trọng lực 1G ~ 9.80665 m/s²)
      const dynamicAccel = Math.max(0.2, Math.abs(rawMagnitude - 9.80665));
      // Cường độ tức thời dựa trên mức tải động học (50% - 95%)
      const intensity = Math.min(96, Math.max(48, Math.round(52 + Math.abs(amagVal - 1.0) * 45)));

      // 1. Ghi log CSV nếu đang bật chế độ thu thập dữ liệu
      if (isLoggingCsvRef.current) {
        csvLogsRef.current.push({
          timestamp_ms: Date.now(),
          ax: Number(ax.toFixed(2)),
          ay: Number(ay.toFixed(2)),
          az: Number(az.toFixed(2)),
          gx: Number(gx.toFixed(1)),
          gy: Number(gy.toFixed(1)),
          gz: Number(gz.toFixed(1)),
          a_mag: amagVal,
          label: csvActiveLabelRef.current,
          event: data.evt || 'NONE',
        });
        setCsvLogsCount(csvLogsRef.current.length);
      }

      // 2. Cập nhật mức Pin
      const rawHwBat = data.bat ?? data.b;
      const tracker = batteryTrackerRef.current;
      let effectiveBattery = tracker.currentBat;

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
        effectiveBattery = rawHwBat;
        tracker.currentBat = rawHwBat;
      }

      setLivePacketCount((prev) => prev + 1);
      setBleTelemetry({
        ...data,
        amag: amagVal,
        bat: effectiveBattery,
        chg: tracker.isCharging,
      });

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

      // 3. THUẬT TOÁN ĐỘNG HỌC REALTIME DUAL-ENGINE (ĐẦU GỐI)
      // Tự động phân tích động học trực tiếp từ telemetry cảm biến trên Web,
      // đồng thời hợp nhất với Firmware nếu firmware gửi số đếm hợp lệ!
      const session = autoSessionRef.current;
      const now = Date.now();
      const gyroMagnitude = Math.hypot(gx, gy, gz);

      // Cập nhật đỉnh xung lực tiếp đất nếu đang trong pha Landing
      if (session.kineState === 'LANDING') {
        if (amagVal > session.peakLandingG) {
          session.peakLandingG = amagVal;
        }
      }

      // Xử lý giai đoạn trơ (Refractory)
      if (session.kineState === 'REFRACTORY') {
        if (now >= session.refractoryUntil) {
          session.kineState = 'GROUND';
        }
      }

      if (session.kineState === 'GROUND') {
        // A. Pha bay cú nhảy (ở đầu gối, khi nhảy rời đất amag < 0.65g)
        if (amagVal < 0.65) {
          session.kineState = 'FLIGHT';
          session.flightStartTime = now;
        }
        // B. Phát hiện đỉnh tiếp đất bước chạy: amag >= 1.65g và vung cẳng chân gyro >= 50 deg/s
        else if (amagVal >= 1.65 && now - session.lastStepTime > 220 && now - session.lastJumpTime > 450) {
          const stepInterval = now - session.lastStepTime;
          // Chu kỳ bước chạy hợp lệ: 220ms - 650ms
          if (stepInterval >= 220 && stepInterval <= 650) {
            session.consecutiveRunSteps = (session.consecutiveRunSteps || 0) + 1;
            if (session.consecutiveRunSteps >= 2) {
              session.webRunStepCount = (session.webRunStepCount || 0) + 1;
              session.classifiedActivity = 'running';
            }
            session.lastStepTime = now;
            session.refractoryUntil = now + 180;
            session.kineState = 'REFRACTORY';
          } else if (stepInterval > 650) {
            session.consecutiveRunSteps = 1;
            session.lastStepTime = now;
          }
        }
        // Đi bộ / cử động nhẹ xem như nền tĩnh, KHÔNG ĐẾM BƯỚC
      }
      else if (session.kineState === 'FLIGHT') {
        // Kết thúc pha bay khi gia tốc bật trở lại
        if (amagVal >= 0.65) {
          const flightTime = now - session.flightStartTime;
          if (flightTime >= 110 && flightTime <= 750) {
            session.flightDuration = flightTime;
            session.kineState = 'LANDING';
            session.landingStartTime = now;
            session.peakLandingG = amagVal;
          } else {
            session.kineState = 'GROUND';
          }
        } else if (now - session.flightStartTime > 800) {
          session.kineState = 'GROUND';
        }
      }
      else if (session.kineState === 'LANDING') {
        const windowExpired = (now - session.landingStartTime >= 140);
        if (windowExpired || (session.peakLandingG >= 2.20 && amagVal < session.peakLandingG * 0.75)) {
          // XÁC NHẬN CÚ NHẢY (JUMP)
          if (session.flightDuration >= 110 && session.peakLandingG >= 2.20) {
            session.webJumpCount = (session.webJumpCount || 0) + 1;
            session.lastJumpTime = now;
            const airtimeSec = session.flightDuration / 1000.0;
            session.lastAirtime = Math.round(airtimeSec * 100) / 100;
            session.lastJumpHeightCm = Math.round(0.125 * 9.80665 * airtimeSec * airtimeSec * 1000) / 10;
            session.lastImpactG = Math.round(session.peakLandingG * 10) / 10;
            session.classifiedActivity = 'jumping';
            session.consecutiveRunSteps = 0; // Cú nhảy ngắt chuỗi chạy
            session.kineState = 'REFRACTORY';
            session.refractoryUntil = now + 350;
          } else {
            session.kineState = 'GROUND';
          }
        }
      }

      // HỢP NHẤT DUAL-ENGINE: Lấy giá trị lớn nhất giữa thuật toán Web và Firmware (Chỉ đếm CHẠY & NHẢY)
      const hwJumps = Number(data.jc ?? 0);
      const hwSteps = Number(data.steps ?? 0);
      const hwRunSteps = Number(data.rsteps ?? 0);

      session.jumpCount = Math.max(session.webJumpCount || 0, hwJumps);
      session.runStepCount = Math.max(session.webRunStepCount || 0, hwRunSteps);
      session.stepCount = Math.max(session.runStepCount, hwSteps);
      session.walkStepCount = 0;

      if (data.jh !== undefined && data.jh > 0) session.lastJumpHeightCm = data.jh;
      if (data.s && data.s !== 'idle') session.classifiedActivity = data.s;

      // Phát hiện đổi hướng (Agility turn > 80 deg/s)
      if (gyroMagnitude > 80.0 && now - (session.lastTurnTime || 0) > 350) {
        session.directionChangeCount = (session.directionChangeCount || 0) + 1;
        session.lastTurnTime = now;
      }

      // Tự động kích hoạt trạng thái session nếu có vận động
      const isMotionActive = Boolean(data.s && ['running', 'jumping', 'active'].includes(data.s)) || amagVal > 1.3 || gyroMagnitude > 50.0;
      if (isMotionActive) {
        session.lastActiveTime = Date.now();
        if (session.status === 'idle') {
          session.status = 'recording';
          session.startTime = new Date();
          session.sampleCount = 0;
          session.accelSum = 0;
          session.dynamicAccelSum = 0;
          session.intensitySum = 0;
          session.maxAccel = 0;
          setAutoSessionDisplay((prev) => ({
            ...prev,
            status: 'recording',
            classifiedActivity: data.s || 'running',
          }));
        } else if (session.status === 'cooldown') {
          session.status = 'recording';
        }
      }

      // Tích lũy số liệu
      if (session.status === 'recording' || session.status === 'cooldown') {
        session.sampleCount += 1;
        session.accelSum += dynamicAccel;
        session.dynamicAccelSum = (session.dynamicAccelSum || 0) + dynamicAccel;
        session.intensitySum = (session.intensitySum || 0) + intensity;
        if (dynamicAccel > session.maxAccel) {
          session.maxAccel = dynamicAccel;
        }

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
        setActionMessage(`Đã kết nối thành công với ${details.deviceName || 'thiết bị Second Skin'}!`);
        setTimeout(() => setActionMessage(''), 4000);
      } else if (status === 'disconnected') {
        setBleDevice(null);
        setBleTelemetry(null);
        setSensorStatus((prev) => ({ ...prev, connected: false }));
        setActionMessage('Đã ngắt kết nối Bluetooth.');
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

  // Timer ticker: cập nhật thời gian trôi qua và số liệu giao diện
  useEffect(() => {
    const timer = setInterval(() => {
      const session = autoSessionRef.current;
      if (session.status === 'recording' || session.status === 'cooldown') {
        const now = Date.now();
        const elapsed = session.startTime ? Math.floor((now - session.startTime.getTime()) / 1000) : 0;
        const avg = session.sampleCount > 0 ? (session.accelSum / session.sampleCount) : 2.5;

        setAutoSessionDisplay((prev) => ({
          ...prev,
          status: session.status,
          elapsedSeconds: elapsed,
          jumpCount: session.jumpCount,
          stepCount: session.stepCount,
          runStepCount: session.runStepCount || 0,
          walkStepCount: session.walkStepCount || 0,
          cadence: session.runStepCount > 0 && elapsed > 0 ? Math.round((session.runStepCount / (elapsed / 60))) : 0,
          jumpHeight: session.lastJumpHeightCm,
          directionChangeCount: session.directionChangeCount,
          avgAccel: Math.round(avg * 100) / 100,
          sport: session.targetSport || selectedSport || 'Basketball',
          classifiedActivity: session.classifiedActivity,
        }));

        if (!isSavingSessionRef.current && session.status !== 'saving' && session.lastActiveTime && now - session.lastActiveTime >= 180000 && session.sampleCount >= 50) {
          finalizeAutoSession(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [finalizeAutoSession, selectedSport]);

  // ----------------------------------------------------
  // 🛠️ HÀM ĐIỀU KHIỂN GHI LOG CSV & CẤU HÌNH NGƯỠNG
  // ----------------------------------------------------
  const startCsvLogging = useCallback(async () => {
    csvLogsRef.current = [];
    setCsvLogsCount(0);
    setIsLoggingCsv(true);
    try {
      await bleService.sendCsvLogCommand(true);
    } catch (e) {}
    setActionMessage('🔴 Đang ghi log CSV thời gian thực! Hãy thực hiện các động tác và bấm nút gắn nhãn.');
  }, []);

  const stopCsvLogging = useCallback(async () => {
    setIsLoggingCsv(false);
    try {
      await bleService.sendCsvLogCommand(false);
    } catch (e) {}
    setActionMessage(`⏹ Đã dừng ghi log CSV. Thu được ${csvLogsRef.current.length} mẫu.`);
  }, []);

  const downloadCsvLog = useCallback(() => {
    const logs = csvLogsRef.current;
    if (!logs || logs.length === 0) {
      alert('Chưa có dữ liệu log CSV nào được ghi!');
      return;
    }
    const header = 'timestamp_ms,ax,ay,az,gx,gy,gz,a_mag,label,event\n';
    const rows = logs.map((r) =>
      `${r.timestamp_ms},${r.ax},${r.ay},${r.az},${r.gx},${r.gy},${r.gz},${r.a_mag},${r.label},${r.event}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `secondskin_knee_log_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const updateKinematicConfig = useCallback(async (newConfig) => {
    setKinematicConfig(newConfig);
    await bleService.sendKinematicConfig(newConfig);
    setActionMessage('⚙️ Đã cập nhật độ nhạy chuyển động thành công!');
    setTimeout(() => setActionMessage(''), 3500);
  }, []);

  const calibrateImu = useCallback(async () => {
    await bleService.sendCalibrateCommand();
    setActionMessage('⚖️ Đang cân bằng cảm biến... Vui lòng giữ yên thiết bị trong 2 giây!');
    setTimeout(() => setActionMessage(''), 4000);
  }, []);

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
    setWifiFeedback({ status: 'sending', msg: 'Đang lưu thông tin Wi-Fi cho thiết bị...' });
    try {
      await bleService.sendWifiConfig({ ssid, password, backendUrl });
    } catch (err) {
      setWifiSending(false);
      setWifiFeedback({ status: 'wifi_failed', msg: err.message || 'Không thể lưu cài đặt Wi-Fi' });
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
    selectedSport,
    setSelectedSport,
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
    // Công cụ kiểm thử & cấu hình ngưỡng
    isLoggingCsv,
    csvActiveLabel,
    csvLogsCount,
    startCsvLogging,
    stopCsvLogging,
    setCsvActiveLabel,
    downloadCsvLog,
    kinematicConfig,
    updateKinematicConfig,
    calibrateImu,
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
