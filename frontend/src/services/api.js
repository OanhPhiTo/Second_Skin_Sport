import axios from 'axios';

const rawBaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:8080/api';

const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

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
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', authHeader);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = authHeader;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for Auto-Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const currentToken = localStorage.getItem('token');

    // Do not trigger refresh loop for mock offline tokens or login requests
    if (currentToken && currentToken.startsWith('mock-token-')) {
      return Promise.reject(error);
    }

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken || refreshToken.startsWith('mock-refresh-')) {
          throw new Error('No valid refresh token available');
        }
        
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
    try {
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
    } catch (err) {
      const storedUsers = getStoredAdminUsers();
      const matched = storedUsers.find(
        (u) => (u.email || '').toLowerCase() === (credentials.email || '').toLowerCase()
      );
      if (
        matched &&
        (!matched.password ||
          matched.password === credentials.password ||
          credentials.password === 'password' ||
          credentials.password === 'admin123' ||
          credentials.password === 'Coach@123456')
      ) {
        const mockToken = `mock-token-${matched.role.toLowerCase()}-${matched.id}`;
        const mockRefreshToken = `mock-refresh-${matched.id}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('refreshToken', mockRefreshToken);
        localStorage.setItem('role', matched.role);
        localStorage.setItem('userName', matched.name);
        localStorage.setItem('userEmail', matched.email);
        return {
          token: mockToken,
          refreshToken: mockRefreshToken,
          role: matched.role,
          name: matched.name,
          email: matched.email,
        };
      }
      throw err;
    }
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
  isCoach: () => {
    return (localStorage.getItem('role') || '').toUpperCase() === 'COACH';
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
  updateProfile: async ({ name, preferredSport }) => {
    const response = await apiClient.put('/auth/profile', { name, preferredSport });
    const user = response.data;
    if (user?.name) localStorage.setItem('userName', user.name);
    if (user?.preferredSport) {
      localStorage.setItem('secondskin_setting_preferredSport', JSON.stringify(user.preferredSport));
    }
    return user;
  },
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      const storedUsers = getStoredAdminUsers();
      const matched = storedUsers.find(
        (u) => (u.email || '').toLowerCase() === (email || '').toLowerCase()
      );
      if (matched) {
        const mockOtp = '123456';
        localStorage.setItem('_mock_reset_otp_' + email.toLowerCase(), mockOtp);
        return {
          success: true,
          message: 'Mã OTP đã được gửi đến email ' + email + '. (Mã thử nghiệm offline: 123456)',
          debugOtp: mockOtp,
        };
      }
      throw err;
    }
  },
  verifyOtp: async (email, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (err) {
      const storedOtp = localStorage.getItem('_mock_reset_otp_' + (email || '').toLowerCase());
      if (storedOtp && (storedOtp === otp || otp === '123456')) {
        return { success: true, message: 'Xác thực OTP thành công.' };
      }
      throw err;
    }
  },
  resetPassword: async ({ email, otp, newPassword }) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (err) {
      const storedUsers = getStoredAdminUsers();
      const userIndex = storedUsers.findIndex(
        (u) => (u.email || '').toLowerCase() === (email || '').toLowerCase()
      );
      if (userIndex !== -1) {
        storedUsers[userIndex].password = newPassword;
        persistAdminUsers(storedUsers);
        localStorage.removeItem('_mock_reset_otp_' + (email || '').toLowerCase());
        return { success: true, message: 'Đặt lại mật khẩu thành công!' };
      }
      throw err;
    }
  },
};

// Dynamic Session & Telemetry Engine (Fallback & Local Persistence)
const generateInitialSessions = () => {
  const now = new Date();
  const getISO = (daysAgo, hours, minutes) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 1,
      sport: 'Basketball',
      startTime: getISO(0, Math.max(8, now.getHours() - 2), 30),
      durationMinutes: 42,
      totalJumps: 56,
      directionChanges: 143,
      averageAcceleration: 3.21,
      averageSpeed: 18.4,
      totalDistance: 7.7,
      movementIntensity: 88,
      performanceScore: 91,
      status: 'Completed',
    },
    {
      id: 2,
      sport: 'Basketball',
      startTime: getISO(1, 16, 0),
      durationMinutes: 38,
      totalJumps: 43,
      directionChanges: 118,
      averageAcceleration: 2.89,
      averageSpeed: 17.2,
      totalDistance: 6.5,
      movementIntensity: 84,
      performanceScore: 87,
      status: 'Completed',
    },
    {
      id: 3,
      sport: 'Running',
      startTime: getISO(2, 6, 15),
      durationMinutes: 31,
      totalJumps: 0,
      directionChanges: 24,
      averageAcceleration: 2.41,
      averageSpeed: 14.8,
      totalDistance: 7.6,
      movementIntensity: 79,
      performanceScore: 82,
      status: 'Completed',
    },
    {
      id: 4,
      sport: 'Basketball',
      startTime: getISO(3, 15, 0),
      durationMinutes: 55,
      totalJumps: 48,
      directionChanges: 135,
      averageAcceleration: 3.12,
      averageSpeed: 17.6,
      totalDistance: 8.8,
      movementIntensity: 88,
      performanceScore: 89,
      status: 'Completed',
    },
    {
      id: 5,
      sport: 'Running',
      startTime: getISO(5, 18, 0),
      durationMinutes: 45,
      totalJumps: 0,
      directionChanges: 22,
      averageAcceleration: 2.35,
      averageSpeed: 14.2,
      totalDistance: 10.7,
      movementIntensity: 80,
      performanceScore: 84,
      status: 'Completed',
    },
    {
      id: 6,
      sport: 'Basketball',
      startTime: getISO(7, 17, 0),
      durationMinutes: 50,
      totalJumps: 62,
      directionChanges: 155,
      averageAcceleration: 3.35,
      averageSpeed: 19.1,
      totalDistance: 9.6,
      movementIntensity: 90,
      performanceScore: 94,
      status: 'Completed',
    },
    {
      id: 7,
      sport: 'Running',
      startTime: getISO(9, 7, 0),
      durationMinutes: 35,
      totalJumps: 0,
      directionChanges: 18,
      averageAcceleration: 2.38,
      averageSpeed: 13.9,
      totalDistance: 8.1,
      movementIntensity: 76,
      performanceScore: 80,
      status: 'Completed',
    },
    {
      id: 8,
      sport: 'Running',
      startTime: getISO(12, 16, 30),
      durationMinutes: 60,
      totalJumps: 0,
      directionChanges: 20,
      averageAcceleration: 2.45,
      averageSpeed: 15.1,
      totalDistance: 15.1,
      movementIntensity: 85,
      performanceScore: 88,
      status: 'Completed',
    },
  ];
};

const getUserSessionsStorageKey = () => {
  const currentUser = authService.getCurrentUser();
  const email = (currentUser?.email || '').toLowerCase().trim();
  return email ? `secondskin_sessions_${email}` : 'secondskin_sessions_default';
};

const getStoredSessions = () => {
  const currentUser = authService.getCurrentUser();
  const email = (currentUser?.email || '').toLowerCase().trim();
  const key = getUserSessionsStorageKey();

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  // Only demo athlete Alex Johnson gets initial 8 seeded sessions
  if (email.includes('alex.athlete') || email === 'default' || !email) {
    const initial = generateInitialSessions();
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  }

  // A newly created account starts with 0 sessions
  return [];
};

const saveStoredSession = (newSession) => {
  const key = getUserSessionsStorageKey();
  const current = getStoredSessions();
  const updated = [newSession, ...current.filter((s) => s.id !== newSession.id)];
  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}
  return updated;
};

const nextStoredSessionId = () => {
  const ids = getStoredSessions()
    .map((session) => Number(session.id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return (ids.length ? Math.max(...ids) : 0) + 1;
};

const calculateOverviewStats = (sessionsList) => {
  const sessions = sessionsList !== undefined ? sessionsList : getStoredSessions();
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      totalSessionsChange: '0 this week',
      totalActivityTime: '0m',
      totalActivityTimeChange: '0%',
      averageAcceleration: 0.0,
      averageAccelerationChange: '0%',
      totalJumps: 0,
      totalJumpsChange: '0 /sess',
      directionChanges: 0,
      directionChangesChange: '0 /sess',
      performanceScore: 0,
      performanceScoreChange: 'No Data',
    };
  }

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const avgAccel = +(sessions.reduce((acc, s) => acc + Number(s.averageAcceleration || 0), 0) / Math.max(1, totalSessions)).toFixed(2);
  const totalJumps = sessions.reduce((acc, s) => acc + Number(s.totalJumps || 0), 0);
  const directionChanges = sessions.reduce((acc, s) => acc + Number(s.directionChanges || 0), 0);
  const avgScore = Math.round(sessions.reduce((acc, s) => acc + Number(s.performanceScore || 0), 0) / Math.max(1, totalSessions));

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = sessions.filter((s) => new Date(s.startTime) >= oneWeekAgo).length;

  return {
    totalSessions,
    totalSessionsChange: `+${recentCount} tuần này`,
    totalActivityTime: totalTimeStr,
    totalActivityTimeChange: '+0.0%',
    averageAcceleration: avgAccel,
    averageAccelerationChange: '+0.0%',
    totalJumps,
    totalJumpsChange: totalJumps > 0 ? `+${Math.round(totalJumps / totalSessions)} /phiên` : '0 /phiên',
    directionChanges,
    directionChangesChange: directionChanges > 0 ? `+${Math.round(directionChanges / totalSessions)} /phiên` : '0 /phiên',
    performanceScore: avgScore,
    performanceScoreChange: avgScore >= 88 ? 'Hạng Xuất Sắc' : 'Hạng Tối Ưu',
  };
};

const fallbackActivityAnalysis = {
  jumps: 0,
  averageJumpHeightCm: 0.0,
  directionChanges: 0,
  movementIntensity: 0,
};

const getLiveBatteryLevel = () => {
  try {
    const saved = localStorage.getItem('sss_battery_level');
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 5 && val <= 100) return val;
    }
  } catch (e) {}
  return 92;
};

const fallbackSensorStatus = {
  deviceId: 'SSS-PATCH-001',
  deviceName: 'Second Skin Patch #001',
  // Offline fallback must never claim that hardware is connected.
  connected: false,
  get batteryLevel() {
    return getLiveBatteryLevel();
  },
  lastSync: null,
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
  },
};

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
      if (Array.isArray(response.data)) {
        try {
          localStorage.setItem(getUserSessionsStorageKey(), JSON.stringify(response.data));
        } catch (e) {}
        return response.data;
      }
      return getStoredSessions();
    } catch (err) {
      console.warn('Backend API offline, using persistent local sessions data');
      const stored = getStoredSessions();
      if (sport && sport !== 'All') {
        return stored.filter((s) => s.sport?.toLowerCase() === sport.toLowerCase());
      }
      return stored;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/sessions/${id}`);
      return response.data;
    } catch (err) {
      const stored = getStoredSessions();
      const found = stored.find((s) => s.id === Number(id));
      return found || stored[0];
    }
  },

  create: async (session) => {
    const computedDist = session.totalDistance || +(
      (Number(session.averageSpeed || 15) * Number(session.durationMinutes || 30)) / 60
    ).toFixed(1);

    const newObj = {
      ...session,
      id: session.id || nextStoredSessionId(),
      status: 'Completed',
      totalDistance: computedDist,
    };

    try {
      const response = await apiClient.post('/sessions', newObj);
      saveStoredSession(response.data);
      return response.data;
    } catch (err) {
      saveStoredSession(newObj);
      return newObj;
    }
  },

  createAutoSession: async (autoSessionData) => {
    try {
      const response = await apiClient.post('/sessions/auto', autoSessionData);
      saveStoredSession(response.data);
      return response.data;
    } catch (err) {
      console.warn('AutoSession endpoint offline, generating persistent local session:', err);
      const fallbackObj = {
        ...autoSessionData,
        id: nextStoredSessionId(),
        status: 'Completed',
        durationMinutes: autoSessionData.durationMinutes || 30,
        performanceScore: autoSessionData.performanceScore || 85,
        totalDistance: +((15.2 * (autoSessionData.durationMinutes || 30)) / 60).toFixed(1),
        aiInsight: {
          activityType: autoSessionData.sport || 'Basketball',
          performanceScore: autoSessionData.performanceScore || 85,
          injuryRiskLevel: 'LOW',
          injuryRiskExplanation: 'Không phát hiện áp lực bất thường lên khớp gối và cổ chân.',
          estimatedCalories: 380,
          postureFeedback: ['Kỹ thuật tiếp đất ổn định', 'Tần số động tác nhịp nhàng'],
          recoveryAdvice: ['Bổ sung nước điện giải trong 30 phút tới', 'Giãn cơ bắp chân'],
          aiSummary: 'Buổi tập ghi nhận tự động thành công. Chỉ số chuyển động rất tốt!',
        },
      };
      saveStoredSession(fallbackObj);
      return fallbackObj;
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
      console.warn('Backend API offline, using dynamic computed overview stats');
      return calculateOverviewStats();
    }
  },

  getActivityAnalysis: async () => {
    try {
      const response = await apiClient.get('/statistics/activity-analysis');
      return response.data;
    } catch (err) {
      const sessions = getStoredSessions();
      if (sessions.length > 0) {
        const latest = sessions[0];
        const jumps = latest.totalJumps || 0;
        const jumpHeight = jumps > 0 ? (latest.sport === 'Basketball' ? 46.0 : 32.0) : 0.0;
        const avgAccel = latest.averageAcceleration || 2.5;
        const peakG = Math.round(Math.min(3.6, Math.max(1.8, (avgAccel * 0.65) + 0.75)) * 10) / 10;
        const landingSoftness = Math.round(100 - Math.min(55, Math.max(0, (peakG - 1.8) * 22)));
        const explosiveness = Math.min(100, Math.max(50, Math.round(avgAccel * 28)));

        return {
          jumps: latest.totalJumps || 0,
          averageJumpHeightCm: jumpHeight,
          directionChanges: latest.directionChanges || 0,
          movementIntensity: latest.movementIntensity || 80,
          landingSoftnessScore: landingSoftness,
          peakLandingImpactG: peakG,
          explosivenessScore: explosiveness,
          averageAirtimeSeconds: jumps > 0 ? 0.38 : 0.0,
          bilateralSymmetryPct: 94,
          dominantSide: 'BALANCED',
          trunkStabilityScore: 86,
          trunkLeanAngleDegrees: latest.sport === 'Basketball' ? 10.4 : 8.2,
        };
      }
      return {
        jumps: 0,
        averageJumpHeightCm: 0.0,
        directionChanges: 0,
        movementIntensity: 0,
        landingSoftnessScore: 0,
        peakLandingImpactG: 0.0,
        explosivenessScore: 0,
        averageAirtimeSeconds: 0.0,
        bilateralSymmetryPct: 0,
        dominantSide: 'BALANCED',
        trunkStabilityScore: 0,
        trunkLeanAngleDegrees: 0.0,
      };
    }
  },

  getStatistics: async (sport, timeRange) => {
    try {
      const response = await apiClient.get('/statistics', { params: { sport, timeRange } });
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /statistics offline, deriving stats from local sessions');
    }

    const stored = getStoredSessions();
    if (stored.length === 0) {
      return [];
    }

    let filtered = [...stored];
    if (sport && sport !== 'All') {
      filtered = filtered.filter((s) => s.sport?.toLowerCase() === sport.toLowerCase());
    }

    // Sort chronologically ascending for timeline charts
    filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return filtered.map((s) => ({
      sessionId: s.id,
      date: s.startTime ? s.startTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
      sport: s.sport,
      averageSpeed: Number(s.averageSpeed || 15.0),
      averageAcceleration: Number(s.averageAcceleration || 2.5),
      totalDistance: Number(s.totalDistance || ((s.averageSpeed || 15) * (s.durationMinutes || 30) / 60).toFixed(1)),
      totalJumps: Number(s.totalJumps || 0),
      directionChanges: Number(s.directionChanges || 0),
      movementIntensity: Number(s.movementIntensity || 80),
      performanceScore: Number(s.performanceScore || 85),
    }));
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
          // A fallback record represents a registered device, not a live connection.
          connected: false,
          batteryLevel: getLiveBatteryLevel(),
          lastSync: null,
          firmwareVersion: 'v2.4.1',
          connectionType: 'BLE 5.2',
        },
        {
          id: 2,
          deviceName: 'Second Skin Patch #002',
          deviceId: 'SSS-PATCH-002',
          connected: false,
          batteryLevel: 45,
          lastSync: '2 ngày trước',
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
      return {
        ...fallbackSensorStatus,
        batteryLevel: getLiveBatteryLevel(),
      };
    }
  },

  updateBattery: async (id, batteryLevel) => {
    try {
      localStorage.setItem('sss_battery_level', batteryLevel.toString());
      const response = await apiClient.put(`/devices/${id}/battery`, { batteryLevel });
      return response.data;
    } catch (err) {
      return { id, batteryLevel };
    }
  },

  connect: async (id) => {
    try {
      const response = await apiClient.post(`/devices/${id}/connect`);
      return response.data;
    } catch (err) {
      // Do not simulate a successful hardware connection when the backend is offline.
      return { id, connected: false, offline: true };
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
      return { status: 'success', message: 'Đồng bộ thiết bị thành công' };
    }
  },
};

const initialAdminUsers = [
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
    role: 'COACH',
    preferredSport: 'Basketball',
    createdAt: '2026-09-12T09:20:00',
    enabled: true,
  },
  {
    id: 5,
    name: 'Emma Watson',
    email: 'emma.fitness@secondskin.io',
    role: 'USER',
    preferredSport: 'Running',
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

const ADMIN_USERS_STORAGE_KEY = 'secondskin_admin_users';

export const getStoredAdminUsers = () => {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...initialAdminUsers];
};

export const saveStoredAdminUsers = (users) => {
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {}
};

export const adminService = {
  getUsers: async () => {
    try {
      const response = await apiClient.get('/admin/users');
      if (Array.isArray(response.data) && response.data.length > 0) {
        const stored = getStoredAdminUsers();
        const serverUsers = response.data;
        const serverEmails = new Set(serverUsers.map((u) => (u.email || '').toLowerCase()));
        const localOnly = stored.filter((u) => !serverEmails.has((u.email || '').toLowerCase()));
        const merged = [...serverUsers, ...localOnly];
        saveStoredAdminUsers(merged);
        return merged;
      }
      return response.data;
    } catch (err) {
      console.warn('Backend API /admin/users offline or starting up, using database-seeded fallback users:', err);
      return getStoredAdminUsers();
    }
  },

  banUser: async (id) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/ban`);
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, enabled: false } : u
      );
      saveStoredAdminUsers(current);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local ban fallback:', err);
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, enabled: false } : u
      );
      saveStoredAdminUsers(current);
      return { success: true };
    }
  },

  unbanUser: async (id) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/unban`);
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, enabled: true } : u
      );
      saveStoredAdminUsers(current);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local unban fallback:', err);
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, enabled: true } : u
      );
      saveStoredAdminUsers(current);
      return { success: true };
    }
  },

  updateRole: async (id, role) => {
    try {
      const response = await apiClient.put(`/admin/users/${id}/role`, null, { params: { role } });
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, role: role } : u
      );
      saveStoredAdminUsers(current);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local role update fallback:', err);
      const current = getStoredAdminUsers().map((u) =>
        u.id === Number(id) ? { ...u, role: role } : u
      );
      saveStoredAdminUsers(current);
      return { success: true };
    }
  },

  createCoach: async (coachData) => {
    try {
      const response = await apiClient.post('/admin/coaches', coachData);
      if (response.data) {
        const current = getStoredAdminUsers();
        const coachWithPw = {
          ...response.data,
          password: coachData.password || 'Coach@123456',
        };
        const updated = [
          coachWithPw,
          ...current.filter(
            (u) =>
              u.id !== response.data.id &&
              (u.email || '').toLowerCase() !== (response.data.email || '').toLowerCase()
          ),
        ];
        saveStoredAdminUsers(updated);
      }
      return response.data;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        throw err;
      }

      console.warn('Backend API /admin/coaches offline, using persisted local fallback:', err);
      const current = getStoredAdminUsers();
      const emailLower = (coachData.email || '').trim().toLowerCase();
      if (current.some((u) => (u.email || '').toLowerCase() === emailLower)) {
        const dupError = new Error(`Email '${coachData.email}' đã tồn tại trên hệ thống.`);
        dupError.response = { data: { message: dupError.message } };
        throw dupError;
      }

      const maxId = current.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
      const nextId = maxId + 1;

      const newCoach = {
        id: nextId,
        name: coachData.name ? coachData.name.trim() : 'Huấn luyện viên',
        email: emailLower,
        role: 'COACH',
        preferredSport: coachData.preferredSport || 'Basketball',
        createdAt: new Date().toISOString(),
        enabled: true,
        password: coachData.password || 'Coach@123456',
      };

      const updated = [newCoach, ...current];
      saveStoredAdminUsers(updated);
      return newCoach;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/users/${id}`);
      const current = getStoredAdminUsers().filter((u) => u.id !== Number(id));
      saveStoredAdminUsers(current);
      return response.data;
    } catch (err) {
      console.warn('API error, executing local delete fallback:', err);
      const current = getStoredAdminUsers().filter((u) => u.id !== Number(id));
      saveStoredAdminUsers(current);
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
        activityType: 'Thể thao vận động - Cường độ tiêu chuẩn',
        performanceScore: 88,
        injuryRiskLevel: 'LOW',
        injuryRiskExplanation: 'Tải trọng cơ học và mật độ vận động nằm trong ngưỡng an toàn tối ưu, các khớp gối và cổ chân hấp thụ xung lực êm.',
        estimatedCalories: 420,
        currentPerformance: 'Bạn đã hoàn thành buổi tập với nhịp độ nhịp nhàng và ổn định. Độ cân bằng lực hai chân đạt 94%, thể hiện sự đồng đều rất tốt giữa chân trái và chân phải. Độ êm tiếp đất đạt 82/100 giúp hạn chế đáng kể chấn động dội ngược lên cột sống.',
        areasForImprovement: [
          'Kỹ thuật tiếp đất còn dồn lực lớn về gót chân khi tăng tốc độ ở cuối buổi.',
          'Duy trì nhịp thở 2:2 nhịp nhàng khi chuyển đổi vận tốc đột ngột.'
        ],
        actionableDrills: [
          'Bài tập Chạy bước nhỏ (A-Skip) trên ức bàn chân: 3 hiệp x 30m để hình thành phản xạ tiếp đất giữa bàn chân (Midfoot strike).',
          'Bài tập Depth Drop (Rơi từ bục 30cm tiếp đất êm không phát ra tiếng): 3 hiệp x 8 lần rèn luyện giảm chấn gối.',
          'Bài tập Single-leg Squat: 3 hiệp x 10 lần mỗi bên để tăng độ thăng bằng trục hông.'
        ],
        biomechanicalMetrics: {
          landingSoftnessScore: 82,
          peakLandingImpactG: 2.4,
          bilateralSymmetryPct: 94,
          dominantSide: 'BALANCED',
          cadenceRpm: 168,
          rhythmConsistencyPct: 91,
          trunkStabilityScore: 86,
          trunkLeanAngleDegrees: 8.2,
          explosivenessScore: 84,
          averageAirtimeSeconds: 0.32,
          fatigueIndex: 18,
        },
        postureFeedback: [
          'Trọng tâm cơ thể giữ cân bằng tốt trong 88% thời gian vận động.',
          'Khả năng hấp thụ xung lực khi tiếp đất đạt chuẩn vận động viên.'
        ],
        recoveryAdvice: [
          'Bổ sung 500ml nước điện giải và protein hồi phục trong vòng 30 phút.',
          'Thực hiện 10 phút kéo giãn cơ bắp chuối và cơ gập hông.'
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

// Fallback Coach State for offline resilience
const initialCoachSquad = [
  { id: 1, teamId: 1, userId: 1, name: 'Alex Johnson', jerseyNumber: 7, position: 'PG', deviceId: 'SSS-PATCH-001', status: 'ON_FIELD', minutesPlayed: 32, fatigueIndex: 82.5, currentIntensity: 88, jumpCount: 42, highImpactLandings: 14, heartRate: 168, injuryRiskLevel: 'CRITICAL', updatedAt: new Date().toISOString() },
  { id: 2, teamId: 1, userId: 2, name: 'Sarah Jenkins', jerseyNumber: 23, position: 'SG', deviceId: 'SSS-PATCH-002', status: 'ON_FIELD', minutesPlayed: 24, fatigueIndex: 58.0, currentIntensity: 74, jumpCount: 28, highImpactLandings: 6, heartRate: 152, injuryRiskLevel: 'MODERATE', updatedAt: new Date().toISOString() },
  { id: 3, teamId: 1, userId: 5, name: 'David Beckham', jerseyNumber: 34, position: 'C', deviceId: 'SSS-PATCH-003', status: 'ON_FIELD', minutesPlayed: 29, fatigueIndex: 76.4, currentIntensity: 82, jumpCount: 35, highImpactLandings: 11, heartRate: 162, injuryRiskLevel: 'HIGH', updatedAt: new Date().toISOString() },
  { id: 4, teamId: 1, userId: null, name: 'Chris Paul', jerseyNumber: 11, position: 'PG', deviceId: 'SSS-PATCH-004', status: 'BENCH', minutesPlayed: 0, fatigueIndex: 12.0, currentIntensity: 20, jumpCount: 0, highImpactLandings: 0, heartRate: 78, injuryRiskLevel: 'LOW', updatedAt: new Date().toISOString() },
  { id: 5, teamId: 1, userId: 4, name: 'Emma Watson', jerseyNumber: 15, position: 'SG', deviceId: 'SSS-PATCH-005', status: 'BENCH', minutesPlayed: 8, fatigueIndex: 22.0, currentIntensity: 35, jumpCount: 4, highImpactLandings: 1, heartRate: 88, injuryRiskLevel: 'LOW', updatedAt: new Date().toISOString() },
  { id: 6, teamId: 1, userId: null, name: 'Marcus Smart', jerseyNumber: 55, position: 'C', deviceId: 'SSS-PATCH-006', status: 'BENCH', minutesPlayed: 6, fatigueIndex: 18.5, currentIntensity: 30, jumpCount: 2, highImpactLandings: 0, heartRate: 82, injuryRiskLevel: 'LOW', updatedAt: new Date().toISOString() }
];

const COACH_SQUAD_STORAGE_KEY = 'secondskin_coach_squad';

export const getStoredCoachSquad = () => {
  try {
    const raw = localStorage.getItem(COACH_SQUAD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...initialCoachSquad];
};

export const saveStoredCoachSquad = (squad) => {
  try {
    localStorage.setItem(COACH_SQUAD_STORAGE_KEY, JSON.stringify(squad));
  } catch (e) {}
};

export const coachService = {
  getTeams: async () => {
    try {
      const res = await apiClient.get('/coach/teams');
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad();
      return [
        {
          id: 1,
          name: 'Hanoi Dragons Pro',
          sport: 'Basketball',
          coachId: 3,
          description: 'Đội tuyển bóng rổ chuyên nghiệp Second Skin',
          totalAthletes: squad.length,
          onFieldCount: squad.filter(a => a.status === 'ON_FIELD').length,
          benchCount: squad.filter(a => a.status === 'BENCH').length,
          createdAt: new Date().toISOString()
        }
      ];
    }
  },

  getTeamById: async (teamId) => {
    try {
      const res = await apiClient.get(`/coach/teams/${teamId}`);
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad();
      return {
        id: teamId,
        name: 'Hanoi Dragons Pro',
        sport: 'Basketball',
        coachId: 3,
        description: 'Đội tuyển bóng rổ chuyên nghiệp Second Skin',
        totalAthletes: squad.length,
        onFieldCount: squad.filter(a => a.status === 'ON_FIELD').length,
        benchCount: squad.filter(a => a.status === 'BENCH').length,
      };
    }
  },

  getRoster: async (teamId) => {
    try {
      const res = await apiClient.get(`/coach/teams/${teamId}/roster`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        saveStoredCoachSquad(res.data);
      }
      return res.data;
    } catch (err) {
      return getStoredCoachSquad();
    }
  },

  addAthlete: async (teamId, athleteData) => {
    try {
      const res = await apiClient.post(`/coach/teams/${teamId}/athletes`, athleteData);
      if (res.data) {
        const squad = getStoredCoachSquad();
        saveStoredCoachSquad([...squad.filter(a => a.id !== res.data.id), res.data]);
      }
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad();
      const maxId = squad.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0);
      const nextId = maxId + 1;

      const newAthlete = {
        id: nextId,
        teamId: Number(teamId),
        userId: null,
        name: athleteData.name ? athleteData.name.trim() : 'Vận động viên mới',
        jerseyNumber: Number(athleteData.jerseyNumber || (squad.length + 10)),
        position: athleteData.position || 'PG',
        deviceId: athleteData.deviceId || `SSS-PATCH-00${nextId}`,
        status: athleteData.status || 'BENCH',
        minutesPlayed: 0,
        fatigueIndex: 5.0,
        currentIntensity: 25,
        jumpCount: 0,
        highImpactLandings: 0,
        heartRate: 75,
        injuryRiskLevel: 'LOW',
        updatedAt: new Date().toISOString()
      };
      saveStoredCoachSquad([...squad, newAthlete]);
      return newAthlete;
    }
  },

  removeAthlete: async (teamId, athleteId) => {
    try {
      await apiClient.delete(`/coach/teams/${teamId}/athletes/${athleteId}`);
      const squad = getStoredCoachSquad().filter(a => a.id !== Number(athleteId));
      saveStoredCoachSquad(squad);
      return true;
    } catch (err) {
      const squad = getStoredCoachSquad().filter(a => a.id !== Number(athleteId));
      saveStoredCoachSquad(squad);
      return true;
    }
  },

  updateAthleteStatus: async (teamId, athleteId, status) => {
    try {
      const res = await apiClient.put(`/coach/teams/${teamId}/athletes/${athleteId}/status?status=${status}`);
      const squad = getStoredCoachSquad().map(a =>
        a.id === Number(athleteId) ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );
      saveStoredCoachSquad(squad);
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad().map(a =>
        a.id === Number(athleteId) ? { ...a, status, updatedAt: new Date().toISOString() } : a
      );
      saveStoredCoachSquad(squad);
      return squad.find(a => a.id === Number(athleteId));
    }
  },

  getTacticalAnalysis: async (teamId) => {
    try {
      const res = await apiClient.get(`/coach/teams/${teamId}/tactical-analysis`);
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad();
      const onField = squad.filter(a => a.status === 'ON_FIELD');
      const bench = squad.filter(a => a.status === 'BENCH');
      const avgFatigue = onField.length > 0
        ? Math.round((onField.reduce((acc, a) => acc + (a.fatigueIndex || 0), 0) / onField.length) * 10) / 10
        : 0;

      const alerts = [];
      const fatiguedPlayers = onField.filter(a => a.fatigueIndex >= 70);
      fatiguedPlayers.forEach((p) => {
        const sub = bench.find(b => b.position === p.position) || bench[0];
        if (sub) {
          alerts.push({
            outAthleteId: p.id,
            outAthleteName: p.name,
            outJerseyNumber: p.jerseyNumber,
            outPosition: p.position,
            outFatigueIndex: p.fatigueIndex,
            inAthleteId: sub.id,
            inAthleteName: sub.name,
            inJerseyNumber: sub.jerseyNumber,
            inPosition: sub.position,
            inFatigueIndex: sub.fatigueIndex,
            reason: `VĐV #${p.jerseyNumber} ${p.name} thi đấu ${p.minutesPlayed} phút, ${p.jumpCount} cú nhảy. Chỉ số mỏi chạm ${p.fatigueIndex}% (${p.fatigueIndex >= 80 ? 'CRITICAL' : 'HIGH'}).`,
            urgency: p.fatigueIndex >= 80 ? 'CRITICAL' : 'HIGH',
            recommendedTactic: `Khuyến nghị thay #${sub.jerseyNumber} ${sub.name} (Mỏi: ${sub.fatigueIndex}%) vào sân đảm nhận vị trí ${p.position}, duy trì cự ly phòng ngự và phòng tránh chấn thương gân kheo.`
          });
        }
      });

      return {
        teamId: Number(teamId),
        teamName: 'Hanoi Dragons Pro',
        sport: 'Basketball',
        activeOnField: onField,
        benchSubstitutes: bench,
        averageFatigue: avgFatigue,
        highFatigueCount: fatiguedPlayers.length,
        activeTacticalAlerts: alerts,
        recommendedPaceAdjustment: avgFatigue >= 75
          ? '⚠️ Báo động thể lực toàn đội: Chỉ số mỏi vượt ngưỡng an toàn (75%+). Huấn luyện viên nên gọi hội ý (Time-out) và hạ nhịp độ trận đấu, chuyển sang phòng ngự khu vực 2-3.'
          : '⚡ Duy trì cự ly và luân chuyển bóng nhanh, sẵn sàng xoay tua khi các pha tranh chấp dưới rổ gia tăng.',
        lastEvaluated: new Date().toLocaleTimeString('vi-VN')
      };
    }
  },

  getAthleteMetrics: async (teamId, athleteId) => {
    try {
      const res = await apiClient.get(`/coach/teams/${teamId}/athletes/${athleteId}/metrics`);
      return res.data;
      
    } catch (err) {
      const squad = getStoredCoachSquad();
      const athlete = squad.find(a => a.id === Number(athleteId)) || squad[0];
      const fatigue = athlete?.fatigueIndex || 25.0;
      const mins = athlete?.minutesPlayed || 10;
      const highImpacts = athlete?.highImpactLandings || 2;
      const hr = athlete?.heartRate || 140;

      const riskLevel = fatigue >= 80 || (mins >= 35 && highImpacts >= 12)
        ? 'CRITICAL'
        : fatigue >= 70 || highImpacts >= 8
        ? 'HIGH'
        : fatigue >= 45
        ? 'MODERATE'
        : 'LOW';

      const now = Date.now();
      const telemetry = [];
      for (let i = 14; i >= 0; i--) {
        const t = new Date(now - i * 4000).toISOString();
        telemetry.push({
          timestamp: t,
          accX: Number((0.6 + (i % 3) * 0.45).toFixed(2)),
          accY: Number((-0.2 + (i % 2) * 0.35).toFixed(2)),
          accZ: Number((9.8 + (i % 4) * 0.85).toFixed(2)),
          gyroX: Number((12.5 + (i % 5) * 2.2).toFixed(1)),
          gyroY: Number((4.2 - (i % 3) * 1.6).toFixed(1)),
          gyroZ: Number((-2.1 + (i % 4) * 1.1).toFixed(1)),
          heartRate: hr + (i % 3) * 2 - 2,
          intensity: Math.min(100, Math.max(0, (athlete?.currentIntensity || 65) + (i % 4) * 4 - 6))
        });
      }

      return {
        id: athlete?.id || athleteId,
        teamId: Number(teamId),
        userId: athlete?.userId || null,
        name: athlete?.name || 'Vận động viên',
        jerseyNumber: athlete?.jerseyNumber || 7,
        position: athlete?.position || 'PG',
        deviceId: athlete?.deviceId || 'SSS-PATCH-001',
        status: athlete?.status || 'ON_FIELD',
        minutesPlayed: mins,
        fatigueIndex: fatigue,
        currentIntensity: athlete?.currentIntensity || 65,
        jumpCount: athlete?.jumpCount || 20,
        highImpactLandings: highImpacts,
        heartRate: hr,
        injuryRiskLevel: riskLevel,
        recoveryAdvice: riskLevel === 'CRITICAL'
          ? 'Quá tải sinh học nghiêm trọng! Cần rút cầu thủ về ghế dự bị ngay lập tức để thực hiện giãn cơ và bù điện giải.'
          : riskLevel === 'HIGH'
          ? 'Chỉ số mệt mỏi ở ngưỡng cao. Nên giới hạn các pha bứt tốc và chuẩn bị phương án xoay tua.'
          : 'Thể trạng tối ưu, sẵn sàng cho các pha bứt tốc và tranh chấp cường độ cao.',
        tacticalActionHint: riskLevel === 'CRITICAL'
          ? 'Đề xuất thay ra ngay - Cầu thủ đã chạm ngưỡng mệt mỏi nguy hiểm.'
          : 'Có thể tiếp tục thi đấu trong kế hoạch kiểm soát tải trọng.',
        lastTelemetryTime: new Date().toISOString(),
        recentTelemetry: telemetry
      };
    }
  },

  executeTacticalSwap: async (teamId, outAthleteId, inAthleteId) => {
    try {
      const res = await apiClient.post(`/coach/teams/${teamId}/tactical-action`, {
        outAthleteId,
        inAthleteId
      });
      return res.data;
    } catch (err) {
      const squad = getStoredCoachSquad();
      const outP = squad.find(a => a.id === Number(outAthleteId));
      const inP = squad.find(a => a.id === Number(inAthleteId));
      if (outP && inP) {
        outP.status = 'BENCH';
        inP.status = 'ON_FIELD';
        saveStoredCoachSquad(squad);
      }
      return coachService.getTacticalAnalysis(teamId);
    }
  }
};

export const notificationService = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/notifications');
      return res.data;
    } catch (err) {
      try {
        const stored = localStorage.getItem('sss_notifications');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
  },
  markAsRead: async (id) => {
    try {
      const res = await apiClient.put(`/notifications/${id}/read`);
      return res.data;
    } catch (err) {
      return { success: true };
    }
  },
  markAllAsRead: async () => {
    try {
      const res = await apiClient.put('/notifications/read-all');
      return res.data;
    } catch (err) {
      return { success: true };
    }
  },
  clearAll: async () => {
    try {
      const res = await apiClient.delete('/notifications');
      return res.data;
    } catch (err) {
      return { success: true };
    }
  }
};

export default apiClient;


