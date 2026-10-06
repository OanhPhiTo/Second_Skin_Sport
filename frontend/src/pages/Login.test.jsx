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

  test('navigates admin to /admin/users on login', async () => {
    authService.login.mockResolvedValueOnce({ token: 'admin-token', role: 'ADMIN' });
    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'admin@secondskin.com' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập$/i }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  test('displays error message on login failure', async () => {
    authService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });
    renderWithRouter(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'wrong-pass' } });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
