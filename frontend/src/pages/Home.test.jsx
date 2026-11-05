import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

// Mock Canvas 2D Context for jsdom
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    transform: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    drawImage: vi.fn(),
    setLineDash: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    strokeRect: vi.fn(),
    roundRect: vi.fn(),
    rect: vi.fn(),
    fillText: vi.fn()
  }));
});

// Mock authService
vi.mock('../services/api', () => ({
  authService: {
    isAuthenticated: vi.fn(() => false),
    getUserRole: vi.fn(() => 'USER'),
    getCurrentUser: vi.fn(() => ({ name: 'Test User', role: 'USER' }))
  }
}));

describe('Home Page (Clean, Focused Hero with 3D Model and Official S Logo)', () => {
  it('renders official slogan and core product branding in Hero section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/NÂNG TẦM HIỆU SUẤT/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Track Movement, Elevate Performance/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SECOND SKIN/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bắt Đầu Buổi Tập Ngay/i)).toBeInTheDocument();
  });

  it('renders interactive 3D model with official S logo badges and angle presets', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // 3D HUD Badge on Hero
    expect(screen.getByText(/MÔ HÌNH 3D XOAY 360°/i)).toBeInTheDocument();

    // Color chips
    expect(screen.getByText(/Vỏ Trắng/i)).toBeInTheDocument();
    expect(screen.getByText(/Nút Đen Cạnh Bên/i)).toBeInTheDocument();
    expect(screen.getByText(/Logo Chữ S Chuẩn Thương Hiệu/i)).toBeInTheDocument();

    // 3D Angle buttons
    expect(screen.getByText(/Mặt Trên \(Logo S\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Cạnh Bên \(Nút Đen\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Nghiêng 3D/i)).toBeInTheDocument();
  });

  it('renders mission, vision, and 4 core pillars cleanly', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Sứ Mệnh \(Our Mission\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tầm Nhìn \(Our Vision\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Đo Lường Chuẩn Xác Động Học/i)).toBeInTheDocument();
    expect(screen.getByText(/Cảnh Báo Quá Tải & Chấn Thương/i)).toBeInTheDocument();
    expect(screen.getByText(/Huấn Luyện Viên Điều Phối Đội Hình/i)).toBeInTheDocument();
    expect(screen.getByText(/Trợ Lý AI Phân Tích Cá Nhân Hóa/i)).toBeInTheDocument();
  });

  it('renders development team contact details and footer information', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Liên Hệ Đội Ngũ Phát Triển/i)).toBeInTheDocument();
    expect(screen.getByText(/contact@secondskinsport.io/i)).toBeInTheDocument();
    expect(screen.getByText(/\+84 \(0\) 987 654 321/i)).toBeInTheDocument();
    expect(screen.getByText(/Second Skin Dev Team/i)).toBeInTheDocument();
  });
});
