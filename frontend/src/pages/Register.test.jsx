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
  });

  test('calls authService.register on form submit and navigates', async () => {
    authService.register.mockResolvedValueOnce({ token: 'mock-token' });
    renderWithRouter(<Register />);
    
    fireEvent.change(screen.getByPlaceholderText('Nhập họ và tên'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Nhập email của bạn'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Tạo mật khẩu'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Running' } });
    
    fireEvent.click(screen.getByRole('button', { name: /đăng ký/i }));
    
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      preferredSport: 'Running'
    });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
