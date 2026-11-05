import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { UnitProvider, useUnit } from './UnitContext';

function TestConsumer() {
  const { isImperial, unitLabels, formatAccel, formatSpeed, formatHeight, updateUnits } = useUnit();

  return (
    <div>
      <span data-testid="is-imperial">{String(isImperial)}</span>
      <span data-testid="accel-unit">{unitLabels.accel}</span>
      <span data-testid="speed-unit">{unitLabels.speed}</span>
      <span data-testid="height-unit">{unitLabels.height}</span>
      <span data-testid="formatted-accel">{formatAccel(9.81)}</span>
      <span data-testid="formatted-speed">{formatSpeed(36)}</span>
      <span data-testid="formatted-height">{formatHeight(50)}</span>
      <button onClick={() => updateUnits('Hệ Anh-Mỹ (G, mph, inches)')}>
        Switch to Imperial
      </button>
      <button onClick={() => updateUnits('Hệ mét (m/s², km/h, cm)')}>
        Switch to Metric
      </button>
    </div>
  );
}

describe('UnitContext & Dynamic Measurement Formatting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to Metric system (m/s², km/h, cm)', () => {
    render(
      <UnitProvider>
        <TestConsumer />
      </UnitProvider>
    );

    expect(screen.getByTestId('is-imperial').textContent).toBe('false');
    expect(screen.getByTestId('accel-unit').textContent).toBe('m/s²');
    expect(screen.getByTestId('speed-unit').textContent).toBe('km/h');
    expect(screen.getByTestId('height-unit').textContent).toBe('cm');
    expect(screen.getByTestId('formatted-accel').textContent).toBe('9.8 m/s²');
    expect(screen.getByTestId('formatted-speed').textContent).toBe('36.0 km/h');
    expect(screen.getByTestId('formatted-height').textContent).toBe('50 cm');
  });

  it('switches to Imperial system (G, mph, inches) dynamically', () => {
    render(
      <UnitProvider>
        <TestConsumer />
      </UnitProvider>
    );

    const switchBtn = screen.getByText('Switch to Imperial');
    act(() => {
      switchBtn.click();
    });

    expect(screen.getByTestId('is-imperial').textContent).toBe('true');
    expect(screen.getByTestId('accel-unit').textContent).toBe('G');
    expect(screen.getByTestId('speed-unit').textContent).toBe('mph');
    expect(screen.getByTestId('height-unit').textContent).toBe('in');
    expect(screen.getByTestId('formatted-accel').textContent).toBe('1.00 G');
    // 36 km/h * 0.621371 = 22.37 -> 22.4 mph
    expect(screen.getByTestId('formatted-speed').textContent).toBe('22.4 mph');
    // 50 cm * 0.3937 = 19.68 -> 19.7 in
    expect(screen.getByTestId('formatted-height').textContent).toBe('19.7 in');
  });

  it('persists selection to localStorage and notifies listeners', () => {
    render(
      <UnitProvider>
        <TestConsumer />
      </UnitProvider>
    );

    act(() => {
      screen.getByText('Switch to Imperial').click();
    });

    const stored = JSON.parse(localStorage.getItem('secondskin_setting_units'));
    expect(stored).toBe('Hệ Anh-Mỹ (G, mph, inches)');
  });
});
