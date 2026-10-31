import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUsers from './AdminUsers';
import { adminService } from '../services/api';

vi.mock('../services/api', () => ({
  adminService: {
    getUsers: vi.fn(),
    createCoach: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    updateRole: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('AdminUsers Component (Admin Coach Management)', () => {
  const mockUsers = [
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
      id: 4,
      name: 'Mike Torres',
      email: 'mike.coach@secondskin.io',
      role: 'COACH',
      preferredSport: 'Basketball',
      createdAt: '2026-09-12T09:20:00',
      enabled: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getUsers.mockResolvedValue([...mockUsers]);
  });

  it('renders users list with sequential IDs and recognizes Coach role', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Quản Lý Người Dùng & Phân Quyền')).toBeInTheDocument();
    });

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('Mike Torres')).toBeInTheDocument();
    expect(screen.getByText('HUẤN LUYỆN VIÊN')).toBeInTheDocument();
  });

  it('creates coach with sequential integer ID and shows success notification', async () => {
    const createdCoach = {
      id: 7,
      name: 'HLV Tran Van B',
      email: 'coach.b@secondskin.io',
      role: 'COACH',
      preferredSport: 'Basketball',
      createdAt: new Date().toISOString(),
      enabled: true,
    };

    adminService.createCoach.mockResolvedValueOnce(createdCoach);

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Thêm HLV Mới')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText('Thêm HLV Mới'));
    expect(screen.getByText('Cấp Tài Khoản Huấn Luyện Viên (COACH)')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Ví dụ: HLV Nguyễn Văn An'), {
      target: { value: 'HLV Tran Van B' },
    });
    fireEvent.change(screen.getByPlaceholderText('coach.an@secondskin.io'), {
      target: { value: 'coach.b@secondskin.io' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tối thiểu 6 ký tự'), {
      target: { value: 'CoachPass123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Tạo Tài Khoản Coach' }));

    await waitFor(() => {
      expect(adminService.createCoach).toHaveBeenCalledWith({
        name: 'HLV Tran Van B',
        email: 'coach.b@secondskin.io',
        password: 'CoachPass123',
        preferredSport: 'Basketball',
      });
    });

    // Verifies new coach appears in table with sequential ID #7, NOT a 13-digit number
    await waitFor(() => {
      expect(screen.getByText('#7')).toBeInTheDocument();
      expect(screen.getByText('HLV Tran Van B')).toBeInTheDocument();
      expect(screen.getByText('Đã cấp tài khoản Huấn Luyện Viên thành công cho HLV Tran Van B!')).toBeInTheDocument();
    });
  });

  it('shows error toast when createCoach rejects with duplicate email error', async () => {
    adminService.createCoach.mockRejectedValueOnce({
      response: {
        data: {
          message: "Email 'mike.coach@secondskin.io' đã tồn tại trên hệ thống.",
        },
      },
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Thêm HLV Mới')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Thêm HLV Mới'));

    fireEvent.change(screen.getByPlaceholderText('Ví dụ: HLV Nguyễn Văn An'), {
      target: { value: 'Mike Duplicate' },
    });
    fireEvent.change(screen.getByPlaceholderText('coach.an@secondskin.io'), {
      target: { value: 'mike.coach@secondskin.io' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tối thiểu 6 ký tự'), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tạo Tài Khoản Coach' }));

    await waitFor(() => {
      expect(
        screen.getByText("Email 'mike.coach@secondskin.io' đã tồn tại trên hệ thống.")
      ).toBeInTheDocument();
    });
  });

  it('allows promoting USER to COACH role via dropdown select', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    adminService.updateRole.mockResolvedValueOnce({ success: true });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    });

    const selects = screen.getAllByTitle('Chuyển đổi vai trò tài khoản');
    // Select for Alex Johnson (index 1)
    fireEvent.change(selects[1], { target: { value: 'COACH' } });

    await waitFor(() => {
      expect(adminService.updateRole).toHaveBeenCalledWith(2, 'COACH');
    });
  });
});
