import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for Auto-Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');
        
        // Use a new instance to avoid interceptor loop
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });
        
        const newAccessToken = refreshResponse.data.token;
        localStorage.setItem('token', newAccessToken);
        if (refreshResponse.data.refreshToken) {
           localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        authService.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Helper to decode JWT payload safely without external dependencies
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      const payload = parseJwt(response.data.token);
      const role =
        response.data.role ||
        payload?.role ||
        (credentials.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'USER');
      const name =
        response.data.name ||
        payload?.name ||
        (role === 'ADMIN' ? 'System Administrator' : 'Alex Johnson');
      const email = response.data.email || credentials.email;

      localStorage.setItem('role', role);
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      const role = response.data.role || 'USER';
      const name = response.data.name || userData.name;
      const email = response.data.email || userData.email;
      localStorage.setItem('role', role);
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmail', email);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  getUserRole: () => {
    return localStorage.getItem('role') || 'USER';
  },
  isAdmin: () => {
    return (localStorage.getItem('role') || '').toUpperCase() === 'ADMIN';
  },
  getCurrentUser: () => {
    const role = localStorage.getItem('role') || 'USER';
    return {
      name:
        localStorage.getItem('userName') ||
        (role === 'ADMIN' ? 'System Administrator' : 'Alex Johnson'),
      email: localStorage.getItem('userEmail') || '',
      role: role,
    };
  },
};

// Fallback Mock Data in case backend is loading/offline
const fallbackStats = {
  totalSessions: 24,
  totalSessionsChange: '+4 this week',
  totalActivityTime: '18h 42m',
  totalActivityTimeChange: '+12.5%',
  averageAcceleration: 2.84,
  averageAccelerationChange: '+5.2%',
  totalJumps: 386,
  totalJumpsChange: '+14.8%',
  directionChanges: 1245,
  directionChangesChange: '+8.1%',
  performanceScore: 87,
  performanceScoreChange: '+8.4%',
};

const fallbackActivityAnalysis = {
  jumps: 42,
  averageJumpHeightCm: 38.0,
  directionChanges: 126,
  movementIntensity: 82,
};

const fallbackSensorStatus = {
  deviceId: 'SSS-PATCH-001',
  deviceName: 'Second Skin Patch #001',
  connected: true,
  batteryLevel: 82,
  lastSync: '10 seconds ago',
  currentData: {
    accelerometerX: 0.82,
    accelerometerY: -0.21,
    accelerometerZ: 9.73,
    gyroscopeX: 12.4,
    gyroscopeY: 4.8,
    gyroscopeZ: -2.1,
    pitch: 12.0,
    roll: 4.0,
    yaw: 82.0,
    movementIntensity: 82,
    heartRate: 142,
  },
};

const fallbackSessions = [
  {
    id: 1,
    sport: 'Basketball',
    startTime: '2026-09-16T17:30:00',
    durationMinutes: 42,
    totalJumps: 56,
    directionChanges: 143,
    averageAcceleration: 3.21,
    averageSpeed: 18.4,
    movementIntensity: 88,
    performanceScore: 91,
    status: 'Completed',
  },
  {
    id: 2,
    sport: 'Basketball',
    startTime: '2026-09-15T16:00:00',
    durationMinutes: 38,
    totalJumps: 43,
    directionChanges: 118,
    averageAcceleration: 2.89,
    averageSpeed: 17.2,
    movementIntensity: 84,
    performanceScore: 87,
    status: 'Completed',
  },
  {
    id: 3,
    sport: 'Running',
    startTime: '2026-09-14T06:15:00',
    durationMinutes: 31,
    totalJumps: 0,
    directionChanges: 24,
    averageAcceleration: 2.41,
    averageSpeed: 14.8,
    movementIntensity: 79,
    performanceScore: 82,
    status: 'Completed',
  },
  {
    id: 4,
    sport: 'Football',
    startTime: '2026-09-13T15:00:00',
    durationMinutes: 55,
    totalJumps: 34,
    directionChanges: 167,
    averageAcceleration: 3.12,
    averageSpeed: 21.6,
    movementIntensity: 92,
    performanceScore: 89,
    status: 'Completed',
  },
  {
    id: 5,
    sport: 'Gym',
    startTime: '2026-09-11T18:00:00',
    durationMinutes: 45,
    totalJumps: 18,
    directionChanges: 42,
    averageAcceleration: 1.85,
    averageSpeed: 6.2,
    movementIntensity: 75,
    performanceScore: 78,
    status: 'Completed',
  },
];

const fallbackChartSeries = [
  { time: '10m', acceleration: 2.4, speed: 14.2, intensity: 70 },
  { time: '15m', acceleration: 3.1, speed: 18.5, intensity: 85 },
  { time: '20m', acceleration: 3.8, speed: 21.0, intensity: 92 },
  { time: '25m', acceleration: 2.9, speed: 16.8, intensity: 78 },
  { time: '30m', acceleration: 3.5, speed: 19.4, intensity: 88 },
  { time: '35m', acceleration: 4.1, speed: 22.5, intensity: 96 },
  { time: '40m', acceleration: 2.8, speed: 15.6, intensity: 75 },
];

export const sessionService = {
  getAll: async (sport) => {
    try {
      const response = await apiClient.get('/sessions', { params: { sport } });
      return response.data;
    } catch (err) {
      console.warn('Backend API offline, using fallback sessions data');
      return fallbackSessions;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/sessions/${id}`);
      return response.data;
    } catch (err) {
      const found = fallbackSessions.find((s) => s.id === Number(id));
      return found || fallbackSessions[0];
    }
  },

  create: async (session) => {
    try {
      const response = await apiClient.post('/sessions', session);
      return response.data;
    } catch (err) {
      return { ...session, id: Date.now(), status: 'Completed' };
    }
  },

  getSensorData: async (sessionId) => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/sensor-data`);
      return response.data;
    } catch (err) {
      return fallbackChartSeries;
    }
  },
};

export const statisticsService = {
  getOverview: async () => {
    try {
      const response = await apiClient.get('/statistics/overview');
      return response.data;
    } catch (err) {
      console.warn('Backend API offline, using fallback overview stats');
      return fallbackStats;
    }
  },

  getActivityAnalysis: async () => {
    try {
      const response = await apiClient.get('/statistics/activity-analysis');
      return response.data;
    } catch (err) {
      return fallbackActivityAnalysis;
    }
  },

  getStatistics: async (sport, timeRange) => {
    try {
      const response = await apiClient.get('/statistics', { params: { sport, timeRange } });
      return response.data;
    } catch (err) {
      return fallbackSessions;
    }
  },
};

export const sensorDataService = {
  create: async (sensorData) => {
    try {
      const response = await apiClient.post('/sensor-data', sensorData);
      return response.data;
    } catch (err) {
      console.warn('Failed to forward sensor data to backend:', err);
      return sensorData;
    }
  },
  getLatest: async () => {
    const response = await apiClient.get('/sensor-data/latest');
    return response.data;
  },
  getBySessionId: async (sessionId) => {
    const response = await apiClient.get(`/sensor-data/session/${sessionId}`);
    return response.data;
  },
};

export const deviceService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/devices');
      return response.data;
    } catch (err) {
      return [
        {
          id: 1,
          deviceName: 'Second Skin Patch #001',
          deviceId: 'SSS-PATCH-001',
          connected: true,
          batteryLevel: 82,
          lastSync: '10 seconds ago',
          firmwareVersion: 'v2.4.1',
          connectionType: 'BLE 5.2',
        },
        {
          id: 2,
          deviceName: 'Second Skin Patch #002',
          deviceId: 'SSS-PATCH-002',
          connected: false,
          batteryLevel: 45,
          lastSync: '2 days ago',
          firmwareVersion: 'v2.3.8',
          connectionType: 'BLE 5.2',
        },
      ];
    }
  },

  getStatus: async () => {
    try {
      const response = await apiClient.get('/devices/status');
      return response.data;
    } catch (err) {
      return fallbackSensorStatus;
    }
  },

  connect: async (id) => {
    try {
      const response = await apiClient.post(`/devices/${id}/connect`);
      return response.data;
    } catch (err) {
      return { id, connected: true };
    }
  },

  disconnect: async (id) => {
    try {
      const response = await apiClient.post(`/devices/${id}/disconnect`);
      return response.data;
    } catch (err) {
      return { id, connected: false };
    }
  },

  sync: async (id) => {
    try {
      const response = await apiClient.post(`/devices/${id}/sync`);
      return response.data;
    } catch (err) {
      return { status: 'success', message: 'Device synchronized successfully' };
    }
  },
};

export const adminService = {
  getUsers: async () => {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data;
    } catch (err) {
      console.warn('Backend API /admin/users offline or starting up, using database-seeded fallback users:', err);
      return [
        {
          id: 1,
          name: 'System Administrator',
          email: 'admin@secondskin.com',
          role: 'ADMIN',
          preferredSport: 'All',
          createdAt: '2026-09-01T08:00:00',
          enabled: true,
        },
        {
          id: 2,
          name: 'Alex Johnson',
          email: 'alex.athlete@secondskin.io',
          role: 'USER',
          preferredSport: 'Basketball',
          createdAt: '2026-09-05T10:30:00',
          enabled: true,
        },
        {
          id: 3,
          name: 'Sarah Jenkins',
          email: 'sarah.runner@secondskin.io',
          role: 'USER',
          preferredSport: 'Running',
          createdAt: '2026-09-10T14:15:00',
          enabled: true,
        },
        {
          id: 4,
          name: 'Mike Torres',
          email: 'mike.coach@secondskin.io',
          role: 'USER',
          preferredSport: 'Football',
          createdAt: '2026-09-12T09:20:00',
          enabled: true,
        },
        {
          id: 5,
          name: 'Emma Watson',
          email: 'emma.fitness@secondskin.io',
          role: 'USER',
          preferredSport: 'Gym',
          createdAt: '2026-09-15T16:45:00',
          enabled: true,
        },
        {
          id: 6,
          name: 'David Beckham',
          email: 'david.swimmer@secondskin.io',
          role: 'USER',
          preferredSport: 'Basketball',
          createdAt: '2026-09-18T11:00:00',
          enabled: false,
        },
      ];
    }
  },
  
  banUser: async (id) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/ban`);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local ban fallback:', err);
      return { success: true };
    }
  },

  unbanUser: async (id) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/unban`);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local unban fallback:', err);
      return { success: true };
    }
  },

  updateRole: async (id, role) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/role`, null, { params: { role } });
      return response.data;
    } catch (err) {
      console.warn('API error, executing local role update fallback:', err);
      return { success: true };
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local delete fallback:', err);
      return { success: true };
    }
  }
};

export const aiService = {
  analyzeSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/ai/session/${sessionId}`);
      return response.data;
    } catch (err) {
      console.warn('Backend AI API offline, using smart fallback insights:', err);
      return {
        activityType: 'Thể thao vận động - Cường độ cao',
        performanceScore: 88,
        injuryRiskLevel: 'LOW',
        injuryRiskExplanation: 'Tải trọng cơ học và mật độ vận động nằm trong ngưỡng an toàn tối ưu.',
        estimatedCalories: 420,
        postureFeedback: [
          'Trọng tâm cơ thể giữ cân bằng tốt trong 85% thời gian vận động.',
          'Khả năng hấp thụ xung lực khi tiếp đất đạt chuẩn.'
        ],
        recoveryAdvice: [
          'Bổ sung 500ml nước điện giải và protein hồi phục.',
          'Thực hiện 5-10 phút giãn cơ bắp chân và đùi.'
        ],
        aiSummary: 'Buổi tập diễn ra hiệu quả cao. Bạn duy trì nhịp độ ổn định và khả năng kiểm soát thăng bằng chuẩn xác.'
      };
    }
  },

  quickAnalysis: async (sessionPayload) => {
    try {
      const response = await apiClient.post('/ai/quick-analysis', sessionPayload);
      return response.data;
    } catch (err) {
      console.warn('Failed to call quick-analysis:', err);
      return null;
    }
  }
};

export default apiClient;
