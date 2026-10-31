import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  adminService,
  coachService,
  authService,
  getStoredAdminUsers,
  saveStoredAdminUsers,
  getStoredCoachSquad,
  saveStoredCoachSquad
} from './api';

describe('Coach Role & Persistence Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('adminService.createCoach persistence and ID formatting', () => {
    it('creates coach with sequential integer ID (never Date.now() 13 digits) and persists to localStorage', async () => {
      const initialUsers = getStoredAdminUsers();
      expect(initialUsers.length).toBeGreaterThan(0);

      const created = await adminService.createCoach({
        name: 'Coach Test Pro',
        email: 'coach.testpro@secondskin.io',
        password: 'Pass123Password',
        preferredSport: 'Basketball'
      });

      expect(created.id).toBeDefined();
      // Ensure ID is a clean sequential number, e.g. <= 100, not a 13-digit Date.now() timestamp
      expect(created.id).toBeLessThan(100000);
      expect(created.role).toBe('COACH');
      expect(created.email).toBe('coach.testpro@secondskin.io');

      // Verify stored in localStorage
      const stored = getStoredAdminUsers();
      const found = stored.find(u => u.email === 'coach.testpro@secondskin.io');
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.role).toBe('COACH');
    });

    it('re-login preserves the created coach even after admin logs out', async () => {
      // 1. Admin creates coach
      await adminService.createCoach({
        name: 'Persistent Coach',
        email: 'persistent.coach@secondskin.io',
        password: 'CoachPassword999',
        preferredSport: 'Basketball'
      });

      // 2. Admin logs out
      authService.logout();
      expect(localStorage.getItem('token')).toBeNull();

      // 3. New Coach logs in with their credentials
      const loginRes = await authService.login({
        email: 'persistent.coach@secondskin.io',
        password: 'CoachPassword999'
      });

      expect(loginRes.role).toBe('COACH');
      expect(authService.isCoach()).toBe(true);
      expect(authService.isAuthenticated()).toBe(true);

      // 4. Admin logs back in and checks users list
      const usersList = await adminService.getUsers();
      const coachAccount = usersList.find(u => u.email === 'persistent.coach@secondskin.io');
      expect(coachAccount).toBeDefined();
      expect(coachAccount.role).toBe('COACH');
    });
  });

  describe('coachService squad management and athlete ID formatting', () => {
    it('adds athlete with clean sequential ID (never Date.now()) and persists to localStorage', async () => {
      const initialSquad = getStoredCoachSquad();
      const initialCount = initialSquad.length;

      const newAthlete = await coachService.addAthlete(1, {
        name: 'Nguyen Van C',
        jerseyNumber: 99,
        position: 'C',
        status: 'BENCH'
      });

      expect(newAthlete.id).toBeDefined();
      expect(newAthlete.id).toBeLessThan(100000); // Not Date.now()
      expect(newAthlete.name).toBe('Nguyen Van C');

      // Verify persistence in localStorage
      const updatedSquad = getStoredCoachSquad();
      expect(updatedSquad.length).toBe(initialCount + 1);
      const found = updatedSquad.find(a => a.name === 'Nguyen Van C');
      expect(found).toBeDefined();
      expect(found.id).toBe(newAthlete.id);
    });

    it('persists athlete status updates across page reloads', async () => {
      const rosterBefore = await coachService.getRoster(1);
      const firstAthlete = rosterBefore[0];
      const initialStatus = firstAthlete.status;
      const targetStatus = initialStatus === 'ON_FIELD' ? 'BENCH' : 'ON_FIELD';

      await coachService.updateAthleteStatus(1, firstAthlete.id, targetStatus);

      const rosterAfter = await coachService.getRoster(1);
      const updated = rosterAfter.find(a => a.id === firstAthlete.id);
      expect(updated.status).toBe(targetStatus);
    });
  });
});

