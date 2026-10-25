import { useState, useEffect, useRef } from 'react';

export interface SensorTelemetry {
  timestamp?: string;
  accelerometerX: number;
  accelerometerY: number;
  accelerometerZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
  movementIntensity?: number;
}

export interface JumpEvent {
  deviceId?: string;
  timestamp?: string;
  airtimeSeconds: number;
  jumpHeightCm: number;
  landingImpactMs2: number;
  landingImpactG: number;
  jumpIndex: number;
  activityType?: string;
}

export interface UseSensorWebSocketOptions {
  url?: string;
  topic?: string;
  maxDataPoints?: number;
}

/**
 * Hook quản lý kết nối WebSocket cho dữ liệu cảm biến thời gian thực.
 * Tuân thủ quy tắc kiến trúc:
 * 1. Luôn đóng / hủy kết nối (unsubscribe / close) khi unmount để tránh rò rỉ bộ nhớ.
 * 2. Giới hạn số lượng điểm hiển thị tối đa (mặc định 100 điểm) để tránh treo trình duyệt.
 */
export function useSensorWebSocket(options: UseSensorWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:8080/ws/sensor-data/websocket',
    maxDataPoints = 100,
  } = options;

  const [dataPoints, setDataPoints] = useState<SensorTelemetry[]>([]);
  const [latestData, setLatestData] = useState<SensorTelemetry | null>(null);
  const [latestJump, setLatestJump] = useState<JumpEvent | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) {
          ws.close();
          return;
        }
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          // Detect Jump Event
          if (raw.jumpIndex !== undefined || raw.activityType === 'JUMP') {
            const jump: JumpEvent = {
              deviceId: raw.deviceId,
              timestamp: raw.timestamp || new Date().toISOString(),
              airtimeSeconds: Number(raw.airtimeSeconds ?? 0),
              jumpHeightCm: Number(raw.jumpHeightCm ?? 0),
              landingImpactMs2: Number(raw.landingImpactMs2 ?? 0),
              landingImpactG: Number(raw.landingImpactG ?? 0),
              jumpIndex: Number(raw.jumpIndex ?? 1),
              activityType: raw.activityType || 'JUMP',
            };
            setLatestJump(jump);
            return;
          }

          // Filter sensor telemetry frame
          const telemetry: SensorTelemetry = {
            timestamp: raw.timestamp || new Date().toISOString(),
            accelerometerX: Number(raw.accelerometerX ?? raw.ax ?? 0),
            accelerometerY: Number(raw.accelerometerY ?? raw.ay ?? 0),
            accelerometerZ: Number(raw.accelerometerZ ?? raw.az ?? 9.81),
            gyroscopeX: Number(raw.gyroscopeX ?? raw.gx ?? 0),
            gyroscopeY: Number(raw.gyroscopeY ?? raw.gy ?? 0),
            gyroscopeZ: Number(raw.gyroscopeZ ?? raw.gz ?? 0),
            pitch: Number(raw.pitch ?? 0),
            roll: Number(raw.roll ?? 0),
            yaw: Number(raw.yaw ?? 0),
            movementIntensity: Number(raw.movementIntensity ?? 75),
          };

          setLatestData(telemetry);

          // Capped at maxDataPoints (tối đa 100 điểm)
          setDataPoints((prev) => {
            const next = [...prev, telemetry];
            if (next.length > maxDataPoints) {
              return next.slice(next.length - maxDataPoints);
            }
            return next;
          });
        } catch (parseErr) {
          // Ignore heartbeats or non-JSON control messages
        }
      };

      ws.onerror = () => {
        if (isSubscribed) {
          setError('Không thể kết nối WebSocket sensor stream.');
          setConnected(false);
        }
      };

      ws.onclose = () => {
        if (isSubscribed) {
          setConnected(false);
        }
      };
    } catch (e: any) {
      if (isSubscribed) {
        setError(e?.message || 'Lỗi khởi tạo WebSocket.');
        setConnected(false);
      }
    }

    // CLEANUP: Luôn đóng / hủy kết nối khi unmount để tránh rò rỉ bộ nhớ
    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url, maxDataPoints]);

  return {
    dataPoints,
    latestData,
    latestJump,
    connected,
    error,
  };
}

export default useSensorWebSocket;
