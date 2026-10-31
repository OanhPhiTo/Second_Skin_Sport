import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoachTacticalWebSocket } from './useCoachTacticalWebSocket';

describe('useCoachTacticalWebSocket Hook (Coach Role)', () => {
  let latestInstance;

  class MockWebSocket {
    constructor(url) {
      this.url = url;
      this.send = vi.fn();
      this.close = vi.fn();
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      this.onclose = null;
      latestInstance = this;
    }
  }

  beforeEach(() => {
    latestInstance = null;
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state and connects successfully', () => {
    const { result } = renderHook(() => useCoachTacticalWebSocket(1));

    expect(result.current.tacticalSummary).toBeNull();
    expect(result.current.telemetryHistory).toEqual([]);
    expect(result.current.connected).toBe(false);

    // Simulate open
    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('receives tactical summary payload and appends to telemetry buffer', () => {
    const { result } = renderHook(() => useCoachTacticalWebSocket(1));

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    const mockPayload = {
      teamId: 1,
      teamName: 'Hanoi Dragons Pro',
      averageFatigue: 76.5,
      highFatigueCount: 1,
      activeOnField: [{ id: 10, name: 'Alex Johnson', fatigueIndex: 82.5 }],
      benchSubstitutes: [{ id: 11, name: 'Chris Paul', fatigueIndex: 12.0 }],
    };

    act(() => {
      if (latestInstance && latestInstance.onmessage) {
        latestInstance.onmessage({ data: JSON.stringify(mockPayload) });
      }
    });

    expect(result.current.tacticalSummary).not.toBeNull();
    expect(result.current.tacticalSummary.teamName).toBe('Hanoi Dragons Pro');
    expect(result.current.tacticalSummary.averageFatigue).toBe(76.5);
    expect(result.current.telemetryHistory.length).toBe(1);
    expect(result.current.telemetryHistory[0].avgFatigue).toBe(76.5);
  });

  it('caps telemetry history at maxDataPoints to prevent browser freeze', () => {
    const { result } = renderHook(() => useCoachTacticalWebSocket(1, { maxDataPoints: 3 }));

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    for (let i = 1; i <= 6; i++) {
      act(() => {
        if (latestInstance && latestInstance.onmessage) {
          latestInstance.onmessage({
            data: JSON.stringify({
              teamId: 1,
              averageFatigue: 50 + i,
              highFatigueCount: 0,
              activeOnField: [],
              benchSubstitutes: [],
            }),
          });
        }
      });
    }

    // Should only retain the last 3 points
    expect(result.current.telemetryHistory.length).toBe(3);
    expect(result.current.telemetryHistory[2].avgFatigue).toBe(56);
  });

  it('strictly closes WebSocket on unmount to prevent memory leaks', () => {
    const { unmount } = renderHook(() => useCoachTacticalWebSocket(1));

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    const closeSpy = latestInstance.close;
    unmount();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
