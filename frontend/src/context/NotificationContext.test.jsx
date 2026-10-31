import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationProvider, useNotification } from './NotificationContext';

function TestConsumer({ onReady }) {
  const notif = useNotification();
  React.useEffect(() => {
    if (onReady) onReady(notif);
  }, [notif, onReady]);

  return (
    <div>
      <span data-testid="unread-count">{notif.unreadCount}</span>
      <span data-testid="notif-count">{notif.notifications.length}</span>
      <button
        onClick={() =>
          notif.notifySessionCompleted({
            id: 99,
            sport: 'Basketball',
            durationMinutes: 45,
            performanceScore: 92,
            totalJumps: 28,
            averageAcceleration: 3.2,
          })
        }
      >
        Complete Session
      </button>
      <button onClick={notif.markAllAsRead}>Mark All Read</button>
      <button onClick={notif.clearAllNotifications}>Clear All</button>
    </div>
  );
}

describe('NotificationContext & Session Completed Notification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial notifications and calculates unread count', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    expect(Number(screen.getByTestId('unread-count').textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId('notif-count').textContent)).toBeGreaterThan(0);
  });

  it('triggers notification when notifySessionCompleted is called', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    const initialCount = Number(screen.getByTestId('notif-count').textContent);

    act(() => {
      screen.getByText('Complete Session').click();
    });

    const newCount = Number(screen.getByTestId('notif-count').textContent);
    expect(newCount).toBe(initialCount + 1);
  });

  it('marks all notifications as read', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Mark All Read').click();
    });

    expect(Number(screen.getByTestId('unread-count').textContent)).toBe(0);
  });

  it('clears all notifications', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Clear All').click();
    });

    expect(Number(screen.getByTestId('notif-count').textContent)).toBe(0);
    expect(Number(screen.getByTestId('unread-count').textContent)).toBe(0);
  });
});

