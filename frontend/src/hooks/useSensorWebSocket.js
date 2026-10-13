import { useState, useEffect, useRef } from 'react';

/**
 * Hook quản lý kết nối WebSocket cho dữ liệu cảm biến thời gian thực.
 * Tuân thủ quy tắc kiến trúc:
 * 1. Luôn đóng / hủy kết nối (unsubscribe / close) khi unmount để tránh rò rỉ bộ nhớ.
 * 2. Giới hạn số lượng điểm hiển thị tối đa (mặc định 100 điểm) để tránh treo trình duyệt.
 */
export function useSensorWebSocket(options = {}) {
  const {
    url = 'ws://localhost:8080/ws/sensor-data/websocket',
    maxDataPoints = 100,
  } = options;

  const [dataPoints, setDataPoints] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

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
          const telemetry = {
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
            heartRate: Number(raw.heartRate ?? 135),
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
          // Ignore non-JSON
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
    } catch (e) {
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
    connected,
    error,
  };
}

export default useSensorWebSocket;
