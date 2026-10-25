import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSensorWebSocket } from './useSensorWebSocket';

describe('useSensorWebSocket Hook', () => {
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

  it('initializes with default empty telemetry buffer and connects', () => {
    const { result } = renderHook(() => useSensorWebSocket());

    expect(result.current.dataPoints).toEqual([]);
    expect(result.current.latestData).toBeNull();
    expect(result.current.latestJump).toBeNull();
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

  it('caps telemetry points at maxDataPoints to avoid browser freeze', () => {
    const { result } = renderHook(() => useSensorWebSocket({ maxDataPoints: 5 }));

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    // Send 8 messages
    for (let i = 1; i <= 8; i++) {
      act(() => {
        if (latestInstance && latestInstance.onmessage) {
          latestInstance.onmessage({
            data: JSON.stringify({
              ax: 1.0, ay: 0.5, az: 9.8 + i,
              gx: 10, gy: 5, gz: 2,
              movementIntensity: 80
            })
          });
        }
      });
    }

    // Should only retain the last 5 points
    expect(result.current.dataPoints.length).toBe(5);
    expect(result.current.latestData.accelerometerZ).toBe(9.8 + 8);
  });

  it('captures JumpEvent broadcast from backend WebSocket stream', () => {
    const { result } = renderHook(() => useSensorWebSocket());

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    // Simulate backend sending a JumpEventDTO
    act(() => {
      if (latestInstance && latestInstance.onmessage) {
        latestInstance.onmessage({
          data: JSON.stringify({
            deviceId: 'ESP32-SUPERMINI-01',
            airtimeSeconds: 0.35,
            jumpHeightCm: 15.0,
            landingImpactMs2: 26.5,
            landingImpactG: 2.7,
            jumpIndex: 3,
            activityType: 'JUMP'
          })
        });
      }
    });

    expect(result.current.latestJump).not.toBeNull();
    expect(result.current.latestJump.jumpIndex).toBe(3);
    expect(result.current.latestJump.jumpHeightCm).toBe(15.0);
    expect(result.current.latestJump.landingImpactG).toBe(2.7);
  });

  it('strictly closes and cleans up WebSocket on unmount to prevent memory leaks', () => {
    const { unmount } = renderHook(() => useSensorWebSocket());

    act(() => {
      if (latestInstance && latestInstance.onopen) {
        latestInstance.onopen();
      }
    });

    const closedMock = latestInstance.close;

    // Unmount
    unmount();

    expect(closedMock).toHaveBeenCalledTimes(1);
  });
});
