import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachDashboard from './CoachDashboard';
import { coachService } from '../services/api';

// Mock Recharts to avoid jsdom dimension issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="mock-chart-container">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="mock-area-chart">{children}</div>,
  Area: () => <div />,
  LineChart: ({ children }) => <div data-testid="mock-line-chart">{children}</div>,
  Line: () => <div />,
  Legend: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
}));

// Mock WebSocket hook
vi.mock('../hooks/useCoachTacticalWebSocket', () => ({
  default: () => ({
    tacticalSummary: null,
    telemetryHistory: [],
    connected: true,
    error: null,
  }),
}));

// Mock coachService
vi.mock('../services/api', () => ({
  coachService: {
    getTeams: vi.fn(),
    getTacticalAnalysis: vi.fn(),
    executeTacticalSwap: vi.fn(),
    getAthleteMetrics: vi.fn(),
  },
}));

describe('CoachDashboard Component (Role Coach)', () => {
  const mockTacticalData = {
    teamId: 1,
    teamName: 'Hanoi Dragons Pro',
    sport: 'Basketball',
    averageFatigue: 78.5,
    highFatigueCount: 1,
    activeOnField: [
      {
        id: 1,
        name: 'Alex Johnson',
        jerseyNumber: 7,
        position: 'PG',
        deviceId: 'SSS-PATCH-001',
        status: 'ON_FIELD',
        fatigueIndex: 82.5,
        minutesPlayed: 32,
        jumpCount: 42,
        highImpactLandings: 14,
        heartRate: 168,
        injuryRiskLevel: 'CRITICAL',
      },
      {
        id: 2,
        name: 'Sarah Jenkins',
        jerseyNumber: 23,
        position: 'SG',
        deviceId: 'SSS-PATCH-002',
        status: 'ON_FIELD',
        fatigueIndex: 58.0,
        minutesPlayed: 24,
        jumpCount: 28,
        highImpactLandings: 6,
        heartRate: 152,
        injuryRiskLevel: 'MODERATE',
      },
    ],
    benchSubstitutes: [
      {
        id: 4,
        name: 'Chris Paul',
        jerseyNumber: 11,
        position: 'PG',
        deviceId: 'SSS-PATCH-004',
        status: 'BENCH',
        fatigueIndex: 12.0,
        minutesPlayed: 0,
      },
    ],
    activeTacticalAlerts: [
      {
        outAthleteId: 1,
        outAthleteName: 'Alex Johnson',
        outJerseyNumber: 7,
        outPosition: 'PG',
        outFatigueIndex: 82.5,
        inAthleteId: 4,
        inAthleteName: 'Chris Paul',
        inJerseyNumber: 11,
        inPosition: 'PG',
        inFatigueIndex: 12.0,
        reason: 'Alex Johnson thi đấu 32 phút, chỉ số mỏi 82.5%.',
        urgency: 'CRITICAL',
        recommendedTactic: 'Khuyến nghị thay #11 Chris Paul vào sân.',
      },
    ],
    recommendedPaceAdjustment: '⚠️ Báo động thể lực toàn đội: Huấn luyện viên nên hạ nhịp độ trận đấu.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    coachService.getTeams.mockResolvedValue([
      { id: 1, name: 'Hanoi Dragons Pro', sport: 'Basketball' }
    ]);
    coachService.getTacticalAnalysis.mockResolvedValue(mockTacticalData);
  });

  it('renders squad tactical overview and metrics cards', async () => {
    render(<CoachDashboard />);

    expect(await screen.findByText('Hanoi Dragons Pro')).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('⚠️ NGUY CƠ CAO')).toBeInTheDocument();
  });

  it('renders active players on field and bench reserves', async () => {
    render(<CoachDashboard />);

    const alexEls = await screen.findAllByText('Alex Johnson');
    expect(alexEls.length).toBeGreaterThan(0);
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    const chrisEls = screen.getAllByText('Chris Paul');
    expect(chrisEls.length).toBeGreaterThan(0);

    // Check on-field and bench section titles
    expect(screen.getByText(/CẦU THỦ TRÊN SÂN/i)).toBeInTheDocument();
    expect(screen.getByText(/CẦU THỦ DỰ BỊ SẴN SÀNG/i)).toBeInTheDocument();
  });

  it('displays Urgent Tactical Rotation alert banner when high fatigue detected', async () => {
    render(<CoachDashboard />);

    expect(await screen.findByText(/ĐỀ XUẤT XOAY TUA CHIẾN THUẬT TỰ ĐỘNG/i)).toBeInTheDocument();
    expect(screen.getByText('Alex Johnson thi đấu 32 phút, chỉ số mỏi 82.5%.')).toBeInTheDocument();
    expect(screen.getByText(/Khuyến nghị thay #11 Chris Paul vào sân/i)).toBeInTheDocument();
    expect(screen.getByText('Thực Hiện Thay Người Ngay')).toBeInTheDocument();
  });

  it('calls executeTacticalSwap when coach clicks swap action', async () => {
    const swappedData = {
      ...mockTacticalData,
      activeTacticalAlerts: [],
      averageFatigue: 55.0,
    };
    coachService.executeTacticalSwap.mockResolvedValue(swappedData);

    render(<CoachDashboard />);

    const swapButton = await screen.findByText('Thực Hiện Thay Người Ngay');
    fireEvent.click(swapButton);

    await waitFor(() => {
      expect(coachService.executeTacticalSwap).toHaveBeenCalledWith(1, 1, 4);
    });
  });

  it('opens detailed athlete telemetry drawer when coach clicks inspect button', async () => {
    coachService.getAthleteMetrics.mockResolvedValue({
      id: 1,
      name: 'Alex Johnson',
      jerseyNumber: 7,
      position: 'PG',
      deviceId: 'SSS-PATCH-001',
      status: 'ON_FIELD',
      heartRate: 168,
      fatigueIndex: 82.5,
      injuryRiskLevel: 'CRITICAL',
      jumpCount: 42,
      highImpactLandings: 14,
      currentIntensity: 88,
      recoveryAdvice: 'Cảnh báo quá tải tải trọng sinh học!',
      tacticalActionHint: 'Đề xuất thay ra ngay',
      recentTelemetry: [
        {
          timestamp: new Date().toISOString(),
          accX: 1.2,
          accY: -0.4,
          accZ: 14.5,
          gyroX: 15,
          gyroY: 3,
          gyroZ: -1,
          heartRate: 168,
          intensity: 88,
        },
      ],
    });

    render(<CoachDashboard />);

    const inspectButtons = await screen.findAllByText('Xem Thông Số Chi Tiết');
    expect(inspectButtons.length).toBeGreaterThan(0);
    fireEvent.click(inspectButtons[0]);

    expect(
      await screen.findByText('TÍN HIỆU ĐỘNG HỌC THỜI GIAN THỰC (IMU TELEMETRY STREAM)')
    ).toBeInTheDocument();
    expect(screen.getByText('Nhịp Tim Tức Thời')).toBeInTheDocument();
    expect(screen.getByText('Cảnh báo quá tải tải trọng sinh học!')).toBeInTheDocument();
  });
});
