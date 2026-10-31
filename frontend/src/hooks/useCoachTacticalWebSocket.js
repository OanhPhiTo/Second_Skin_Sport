import { useState, useEffect, useRef } from 'react';

/**
 * Hook kết nối WebSocket cho Bàn điều khiển chiến thuật của Huấn luyện viên (Coach).
 * Tuân thủ nghiêm ngặt quy tắc kiến trúc:
 * 1. Luôn đóng / hủy kết nối (unsubscribe / socket.close) khi unmount để tránh rò rỉ bộ nhớ.
 * 2. Giới hạn số lượng điểm hiển thị tối đa (mặc định 100 điểm) để tránh treo trình duyệt.
 */
export function useCoachTacticalWebSocket(teamId = 1, options = {}) {
  const {
    url = 'ws://localhost:8080/ws/sensor-data/websocket',
    maxDataPoints = 100,
  } = options;

  const [tacticalSummary, setTacticalSummary] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
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

          // Check if payload is squad tactical summary
          if (raw.activeOnField !== undefined || raw.benchSubstitutes !== undefined || raw.teamId !== undefined) {
            setTacticalSummary(raw);

            // Record squad average fatigue telemetry history (capped at maxDataPoints)
            const point = {
              time: new Date().toLocaleTimeString('vi-VN', { minute: '2-digit', second: '2-digit' }),
              avgFatigue: raw.averageFatigue ?? 0,
              highFatigueCount: raw.highFatigueCount ?? 0,
            };

            setTelemetryHistory((prev) => {
              const updated = [...prev, point];
              if (updated.length > maxDataPoints) {
                return updated.slice(updated.length - maxDataPoints);
              }
              return updated;
            });
          }
        } catch (e) {
          // Ignore control / STOMP frame heartbeats
        }
      };

      ws.onerror = () => {
        if (isSubscribed) {
          setError('Không thể kết nối kênh chiến thuật WebSocket.');
          setConnected(false);
        }
      };

      ws.onclose = () => {
        if (isSubscribed) {
          setConnected(false);
        }
      };
    } catch (err) {
      if (isSubscribed) {
        setError(err?.message || 'Lỗi khởi tạo WebSocket.');
        setConnected(false);
      }
    }

    // MANDATORY CLEANUP: Luôn đóng / hủy kết nối khi unmount để tránh rò rỉ bộ nhớ
    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [teamId, url, maxDataPoints]);

  return {
    tacticalSummary,
    telemetryHistory,
    connected,
    error,
    setTacticalSummary,
  };
}

export default useCoachTacticalWebSocket;
