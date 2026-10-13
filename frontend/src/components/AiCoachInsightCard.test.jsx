import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AiCoachInsightCard from './AiCoachInsightCard';

describe('AiCoachInsightCard Component', () => {
  const sampleInsights = {
    activityType: 'Bóng rổ - Tấn công & Bật nhảy linh hoạt',
    performanceScore: 92,
    currentPerformance: 'Bạn đã chơi một trận bóng rổ nhiệt huyết trong 45 phút với 42 cú bật nhảy. Độ bùng nổ đạt 88/100.',
    areasForImprovement: [
      'Lực tiếp đất sau các pha tranh chấp trên không đạt tới 3.1G, cần chùng gối sâu hơn.',
      'Duy trì nhịp thở ổn định khi chuyển hướng liên tục.'
    ],
    actionableDrills: [
      'Bài tập Depth Drop từ bục 30cm: 3 hiệp x 8 lần để giảm chấn gối.',
      'Bài tập Đứng thăng bằng 1 chân: 3 hiệp x 30 giây.'
    ],
    biomechanicalMetrics: {
      landingSoftnessScore: 80,
      peakLandingImpactG: 2.6,
      bilateralSymmetryPct: 94,
      dominantSide: 'BALANCED',
      cadenceRpm: 135,
      rhythmConsistencyPct: 89,
      trunkStabilityScore: 86,
      trunkLeanAngleDegrees: 7.5,
      explosivenessScore: 88,
      averageAirtimeSeconds: 0.44,
      fatigueIndex: 16,
    },
    injuryRiskLevel: 'LOW',
    injuryRiskExplanation: 'Khả năng giảm chấn và phối hợp vận động an toàn tuyệt đối.',
    estimatedCalories: 450,
    recoveryAdvice: [
      'Chườm lạnh nhẹ hai khớp gối 15 phút.',
      'Bổ sung nước và protein trong 30 phút sau trận đấu.'
    ],
    aiSummary: 'Buổi tập diễn ra tuyệt vời!'
  };

  it('renders nothing when insights prop is null or undefined', () => {
    const { container } = render(<AiCoachInsightCard insights={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders current performance text and human-friendly sections', () => {
    render(<AiCoachInsightCard insights={sampleInsights} />);

    // Header & Performance
    expect(screen.getByText('Bóng rổ - Tấn công & Bật nhảy linh hoạt')).toBeDefined();
    expect(screen.getByText('92%')).toBeDefined();
    expect(screen.getByText('Bạn Đang Hoạt Động Ra Sao?')).toBeDefined();
    expect(screen.getByText(/Bạn đã chơi một trận bóng rổ nhiệt huyết/i)).toBeDefined();

    // 5 Biomechanical Metrics
    expect(screen.getByText('Độ Êm Tiếp Đất')).toBeDefined();
    expect(screen.getByText('Cân Bằng 2 Chân')).toBeDefined();
    expect(screen.getByText('Nhịp Vận Động')).toBeDefined();
    expect(screen.getByText('Độ Vững Thân Trên')).toBeDefined();
    expect(screen.getByText('Độ Bùng Nổ')).toBeDefined();

    // Areas for improvement
    expect(screen.getByText('Bạn Cần Cải Thiện Điều Gì?')).toBeDefined();
    expect(screen.getByText(/Lực tiếp đất sau các pha tranh chấp trên không/i)).toBeDefined();

    // Actionable drills
    expect(screen.getByText('Bài Tập Bổ Trợ Gợi Ý (Khắc Phục Điểm Yếu)')).toBeDefined();
    expect(screen.getByText(/Bài tập Depth Drop từ bục 30cm/i)).toBeDefined();

    // Injury & Recovery
    expect(screen.getByText('ĐÁNH GIÁ NGUY CƠ CHẤN THƯƠNG')).toBeDefined();
    expect(screen.getByText('AN TOÀN ✓')).toBeDefined();
    expect(screen.getByText('450')).toBeDefined();
  });

  it('handles fallback gracefully when biomechanicalMetrics are partially missing', () => {
    const minimalInsights = {
      activityType: 'Chạy bộ',
      performanceScore: 85,
      currentPerformance: 'Nhịp bước đều đặn.',
      areasForImprovement: [],
      actionableDrills: [],
      injuryRiskLevel: 'MEDIUM',
      injuryRiskExplanation: 'Căng cơ nhẹ.',
      estimatedCalories: 300,
    };

    render(<AiCoachInsightCard insights={minimalInsights} />);
    expect(screen.getByText('Chạy bộ')).toBeDefined();
    expect(screen.getByText('TRUNG BÌNH')).toBeDefined();
  });
});
