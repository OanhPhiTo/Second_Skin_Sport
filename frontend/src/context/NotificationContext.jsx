import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/api';

const NotificationContext = createContext(null);

const DEFAULT_INITIAL_NOTIFICATIONS = [
  {
    id: 'demo-notif-1',
    title: 'Hoàn thành phiên tập Bóng rổ!',
    message: 'Bạn đã hoàn thành 42 phút thi đấu. Điểm hiệu suất: 88/100, 56 lần bật nhảy, độ êm tiếp đất đạt 84%.',
    type: 'SESSION_COMPLETED',
    sessionId: 1,
    sport: 'Basketball',
    durationMinutes: 42,
    performanceScore: 88,
    totalJumps: 56,
    averageAcceleration: 2.85,
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-notif-2',
    title: 'Đồng bộ cảm biến thành công',
    message: 'Miếng dán Second Skin ESP32-C3 đã stream và mã hóa 1.250 gói tin động học ổn định.',
    type: 'SYSTEM',
    sessionId: null,
    sport: null,
    durationMinutes: null,
    performanceScore: null,
    totalJumps: null,
    averageAcceleration: null,
    read: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('sss_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored notifications:', e);
    }
    return DEFAULT_INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState([]);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem('sss_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const addNotification = useCallback((item) => {
    const id = item.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNotif = {
      id,
      title: item.title || 'Thông báo mới',
      message: item.message || '',
      type: item.type || 'SYSTEM',
      sessionId: item.sessionId || null,
      sport: item.sport || null,
      durationMinutes: item.durationMinutes || null,
      performanceScore: item.performanceScore || null,
      totalJumps: item.totalJumps || null,
      averageAcceleration: item.averageAcceleration || null,
      read: false,
      createdAt: item.createdAt || new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Push into floating toasts (keep up to 3 toasts concurrently)
    setToasts((prev) => [newNotif, ...prev.slice(0, 2)]);

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 6000);

    return newNotif;
  }, [dismissToast]);

  /**
   * Helper chuyên biệt: Bắn thông báo khi kết thúc một phiên tập
   */
  const notifySessionCompleted = useCallback((sessionData) => {
    if (!sessionData) return;

    const sport = sessionData.sport || 'Vận động';
    const sportLabel = sport === 'Basketball' ? 'Bóng rổ' : sport === 'Running' ? 'Chạy bộ' : sport;
    const duration = sessionData.durationMinutes || 1;
    const score = sessionData.performanceScore || 85;
    const jumps = sessionData.totalJumps || 0;
    const accel = sessionData.averageAcceleration || 2.5;

    const title = `🎉 Hoàn thành phiên tập ${sportLabel}!`;
    const message = `Bạn đã hoàn thành buổi tập ${sportLabel} (${duration} phút). Điểm hiệu suất: ${score}/100${jumps > 0 ? `, ${jumps} lần bật nhảy` : ''}.`;

    return addNotification({
      title,
      message,
      type: 'SESSION_COMPLETED',
      sessionId: sessionData.id,
      sport,
      durationMinutes: duration,
      performanceScore: score,
      totalJumps: jumps,
      averageAcceleration: accel,
    });
  }, [addNotification]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    notificationService.markAsRead(id).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllAsRead().catch(() => {});
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    notificationService.clearAll().catch(() => {});
  }, []);

  // Listen for local session completed events
  useEffect(() => {
    const handleSessionCompleted = (e) => {
      if (e?.detail) {
        notifySessionCompleted(e.detail);
      }
    };
    window.addEventListener('sss_session_completed', handleSessionCompleted);
    return () => window.removeEventListener('sss_session_completed', handleSessionCompleted);
  }, [notifySessionCompleted]);

  // Real-time WebSocket connection to receive session notifications from backend
  useEffect(() => {
    let ws = null;
    let isSubscribed = true;

    try {
      const rawBaseUrl =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
        'http://localhost:8080/api';
      const wsUrl = rawBaseUrl.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws/sensor-data';
      const token = localStorage.getItem('token');

      // Native WebSocket connection with token
      const fullUrl = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
      ws = new WebSocket(fullUrl);

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const text = event.data;
          // Simple STOMP payload extraction if text contains JSON
          if (text && text.includes('{') && text.includes('SESSION_COMPLETED')) {
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const parsed = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
              if (parsed && (parsed.type === 'SESSION_COMPLETED' || parsed.sessionId)) {
                addNotification(parsed);
              }
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      isSubscribed = false;
      if (ws) {
        try {
          ws.close();
        } catch (e) {}
      }
    };
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    addNotification,
    notifySessionCompleted,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    dismissToast,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
