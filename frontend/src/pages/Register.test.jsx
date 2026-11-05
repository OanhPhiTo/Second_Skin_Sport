import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import Register from './Register';
import { authService } from '../services/api';

vi.mock('../services/api', () => ({
  authService: {
    register: vi.fn(),
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  test('renders register form', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText('Tạo Tài Khoản')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập họ và tên')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập email của bạn')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số')).toBeInTheDocument();
  });

  test('calls authService.register on form submit and navigates', async () => {
    authService.register.mockResolvedValueOnce({ token: 'mock-token' });
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tạo mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays validation error if password is less than 8 characters', async () => {
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tạo mật khẩu/i), { target: { value: 'pass1' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: 'pass1' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(await screen.findByText('Mật khẩu phải có ít nhất 8 ký tự.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('displays validation error if password does not contain both letters and numbers', async () => {
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tạo mật khẩu/i), { target: { value: 'passwordonly' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: 'passwordonly' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(await screen.findByText('Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('displays validation error if confirm password does not match', async () => {
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tạo mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: 'different123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('displays duplicate email error from server clearly', async () => {
    authService.register.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.'
        }
      }
    });
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Huy Tran' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'huytpn.ce190719@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Tạo mật khẩu/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(await screen.findByText('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.')).toBeInTheDocument();
  });
});
