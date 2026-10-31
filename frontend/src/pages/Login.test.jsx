import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import Login from './Login';
import { authService } from '../services/api';

// Mock authService
vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
    isAdmin: vi.fn(() => false),
    forgotPassword: vi.fn(),
    verifyOtp: vi.fn(),
    resetPassword: vi.fn(),
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  test('renders login form', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Chào mừng trở lại')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập email của bạn')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quên mật khẩu\?/i })).toBeInTheDocument();
  });

  test('calls authService.login on form submit and navigates athlete to /', async () => {
    authService.login.mockResolvedValueOnce({ token: 'mock-token', role: 'USER' });
    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập$/i }));
    
    expect(authService.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('navigates admin to /admin on login', async () => {
    authService.login.mockResolvedValueOnce({ token: 'admin-token', role: 'ADMIN' });
    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'admin@secondskin.com' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập$/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('displays error message on login failure', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });
    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập$/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('opens forgot password modal and goes through 3 steps: email -> otp -> new password', async () => {
    authService.forgotPassword.mockResolvedValueOnce({
      success: true,
      message: 'Mã xác thực OTP đã được gửi',
      debugOtp: '123456'
    });
    authService.verifyOtp.mockResolvedValueOnce({
      success: true,
      message: 'Xác thực OTP thành công'
    });
    authService.resetPassword.mockResolvedValueOnce({
      success: true,
      message: 'Đặt lại mật khẩu thành công!'
    });

    renderWithRouter(<Login />);

    // Click "Quên mật khẩu?" button
    fireEvent.click(screen.getByRole('button', { name: /quên mật khẩu\?/i }));

    // Step 1: Modal should show email input
    expect(screen.getByRole('heading', { name: 'Quên mật khẩu?' })).toBeInTheDocument();
    const forgotEmailInput = screen.getByPlaceholderText('nhap.email@secondskin.io');
    fireEvent.change(forgotEmailInput, { target: { value: 'athlete@secondskin.io' } });
    fireEvent.click(screen.getByRole('button', { name: /tiếp tục & gửi mã otp/i }));

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith('athlete@secondskin.io');
    });

    // Step 2: Modal should transition to OTP input
    await waitFor(() => {
      expect(screen.getByText('Nhập mã xác thực OTP')).toBeInTheDocument();
    });
    const otpInput = screen.getByPlaceholderText('• • • • • •');
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /xác thực otp/i }));

    await waitFor(() => {
      expect(authService.verifyOtp).toHaveBeenCalledWith('athlete@secondskin.io', '123456');
    });

    // Step 3: Modal should transition to Reset Password input
    await waitFor(() => {
      expect(screen.getByText('Đặt lại mật khẩu mới')).toBeInTheDocument();
    });
    const newPassInput = screen.getByPlaceholderText('Tối thiểu 6 ký tự');
    const confirmPassInput = screen.getByPlaceholderText('Nhập lại mật khẩu mới');

    fireEvent.change(newPassInput, { target: { value: 'NewSecret123!' } });
    fireEvent.change(confirmPassInput, { target: { value: 'NewSecret123!' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận đổi mật khẩu/i }));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({
        email: 'athlete@secondskin.io',
        otp: '123456',
        newPassword: 'NewSecret123!'
      });
    });

    // Step 4: Success confirmation screen
    await waitFor(() => {
      expect(screen.getByText('Đổi mật khẩu thành công!')).toBeInTheDocument();
    });
  });
});
