import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Zap,
  Cpu,
  Brain,
  Users,
  ArrowRight,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GitBranch,
  Award,
  BarChart3,
  Flame,
  Radio,
  Sparkles
} from 'lucide-react';
import Product3DViewer from '../components/Product3DViewer';
import logoImg from '../assets/logo.png';
import { authService } from '../services/api';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

  // Scroll listener for sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnterApp = () => {
    if (isAuthenticated) {
      const role = authService.getUserRole();
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'COACH') navigate('/coach');
      else navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      {/* =====================================================================
          1. NAVIGATION BAR
          ===================================================================== */}
      <nav className={`home-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="home-nav-inner">
          <Link to="/home" className="home-nav-brand">
            <img src={logoImg} alt="Second Skin Sport Logo" className="home-brand-logo" />
            <span className="home-brand-name">
              SECOND SKIN <span className="highlight-text">SPORT</span>
            </span>
          </Link>

          <div className="home-nav-actions">
            {isAuthenticated ? (
              <button onClick={handleEnterApp} className="btn-home-primary">
                <span>Vào Ứng Dụng</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-home-ghost">Đăng Nhập</Link>
                <Link to="/register" className="btn-home-primary">
                  <span>Trải Nghiệm Ngay</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* =====================================================================
          2. HERO SECTION WITH 3D PRODUCT MODEL ON THE RIGHT
          ===================================================================== */}
      <header id="hero" className="home-hero-section">
        {/* Futuristic Ambient Glows */}
        <div className="ambient-glow glow-cyan" />
        <div className="ambient-glow glow-neon" />

        {/* Left Column: Brand, Slogan, Core Value & Metrics */}
        <div className="home-hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} color="#00ff87" />
            <span>NỀN TẢNG IOT THỂ THAO ĐỘT PHÁ 4.0</span>
          </div>

          <h1 className="hero-title">
            THEO DÕI CHUYỂN ĐỘNG <br />
            <span className="hero-gradient-text">NÂNG TẦM HIỆU SUẤT</span>
          </h1>

          <p className="hero-slogan-en">Track Movement, Elevate Performance</p>

          <p className="hero-description">
            Thiết bị cảm biến siêu nhỏ gọn kết hợp bộ xử lý động học AI phân tích chuyên sâu từng bước nhảy,
            cú bứt tốc và lực va đập tiếp đất theo thời gian thực — bảo vệ vận động viên khỏi chấn thương và
            giúp huấn luyện viên đưa ra quyết định chiến thuật chính xác.
          </p>

          {/* Call to action buttons */}
          <div className="hero-cta-group">
            <button onClick={handleEnterApp} className="hero-btn-cta primary">
              <Activity size={18} />
              <span>Bắt Đầu Buổi Tập Ngay</span>
            </button>
            <a href="#mission" className="hero-btn-cta secondary">
              <Zap size={18} />
              <span>Khám Phá Sứ Mệnh</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hero-metrics-bar">
            <div className="hero-metric-item">
              <span className="metric-number">100<small>Hz</small></span>
              <span className="metric-label">Lấy mẫu cảm biến IMU 6 trục</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-number">&lt; 20<small>ms</small></span>
              <span className="metric-label">Độ trễ truyền BLE thời gian thực</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-number">18<small>g</small></span>
              <span className="metric-label">Trọng lượng siêu nhẹ công thái học</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-number">AI<small>Dual</small></span>
              <span className="metric-label">DSP Kinematics & LLM</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D INTERACTIVE PRODUCT MODEL (Directly inside Hero) */}
        <div className="hero-product-3d-wrap">
          <Product3DViewer />
        </div>
      </header>

      {/* =====================================================================
          3. MISSION & VISION (MỤC TIÊU VÀ SỨ MỆNH)
          ===================================================================== */}
      <section id="mission" className="home-section mission-section">
        <div className="section-header text-center">
          <div className="section-eyebrow">
            <Award size={14} color="#00ff87" />
            <span>MỤC TIÊU & SỨ MỆNH</span>
          </div>
          <h2 className="section-title">
            Vì Sự Phát Triển Bền Vững Của <span className="highlight-text">Thể Thao Việt Nam</span>
          </h2>
          <p className="section-subtitle">
            Chúng tôi sinh ra với khát vọng dân chủ hóa khoa học thể thao công nghệ cao,
            đưa các công cụ giám sát động học chuẩn Olympic đến với mọi sân tập và học viện thể thao.
          </p>
        </div>

        {/* 2-Column Mission vs Vision Banner */}
        <div className="mission-vision-cards">
          <div className="mv-card mission-card">
            <div className="mv-card-icon">
              <Zap size={28} color="#00f2fe" />
            </div>
            <h3>Sứ Mệnh (Our Mission)</h3>
            <p>
              Bảo vệ sự nghiệp của vận động viên trước nguy cơ chấn thương thể thao không đáng có,
              đồng thời cung cấp dữ liệu số hóa tin cậy để khai phóng tối đa tiềm năng vận động cá nhân
              thông qua công nghệ cảm biến biên (Edge IoT) và Trí tuệ nhân tạo.
            </p>
          </div>

          <div className="mv-card vision-card">
            <div className="mv-card-icon">
              <Brain size={28} color="#00ff87" />
            </div>
            <h3>Tầm Nhìn (Our Vision)</h3>
            <p>
              Trở thành nền tảng phân tích động học thể thao hàng đầu Đông Nam Á, tích hợp liền mạch
              giữa phần cứng Wearable thông minh, Web Bluetooth không cần cài ứng dụng phức tạp,
              và trợ lý huấn luyện số thế hệ mới cho hàng triệu người yêu thể thao.
            </p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="pillars-grid">
          <div className="pillar-item">
            <div className="pillar-number">01</div>
            <h4>Đo Lường Chuẩn Xác Động Học</h4>
            <p>
              Ghi nhận gia tốc (m/s²), vận tốc góc (°/s), độ cao bật nhảy và xung lực va đập khi tiếp đất
              với độ trễ chỉ tính bằng mili-giây.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">02</div>
            <h4>Cảnh Báo Quá Tải & Chấn Thương</h4>
            <p>
              Thuật toán DSP tính toán tích lũy tải cơ học (Mechanical Workload) và phát hiện sớm hiện tượng
              mỏi cơ để ngăn ngừa đứt dây chằng hay tổn thương khớp gối.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">03</div>
            <h4>Huấn Luyện Viên Điều Phối Đội Hình</h4>
            <p>
              Bàn điều khiển chiến thuật Tactical Dashboard cho phép HLV giám sát thể lực của toàn bộ
              vận động viên trên sân, đưa ra quyết định thay người và xoay tua tối ưu.
            </p>
          </div>

          <div className="pillar-item">
            <div className="pillar-number">04</div>
            <h4>Trợ Lý AI Phân Tích Cá Nhân Hóa</h4>
            <p>
              Kết hợp mô hình ngôn ngữ lớn Groq Llama 3.3 cùng động cơ sinh cơ học để cung cấp
              nhận xét khoa học và bài tập phục hồi cá nhân sau mỗi buổi tập.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. HOW IT WORKS (HỆ SINH THÁI 3 BƯỚC)
          ===================================================================== */}
      <section id="features" className="home-section workflow-section">
        <div className="section-header text-center">
          <div className="section-eyebrow">
            <Flame size={14} color="#00f2fe" />
            <span>QUY TRÌNH VẬN HÀNH</span>
          </div>
          <h2 className="section-title">
            Trải Nghiệm Liền Mạch Chỉ Trong <span className="highlight-text">3 Bước Đơn Giản</span>
          </h2>
          <p className="section-subtitle">
            Không cần dây cáp rườm rà hay cài đặt phức tạp, sẵn sàng bước vào sân đấu chỉ trong 30 giây.
          </p>
        </div>

        <div className="steps-workflow-grid">
          <div className="step-card">
            <div className="step-badge">BƯỚC 1</div>
            <div className="step-icon-wrap">
              <Cpu size={32} color="#00f2fe" />
            </div>
            <h4>Đeo Thiết Bị Pod</h4>
            <p>
              Gắn Second Skin Wearable Pod vào băng quấn thể thao hoặc lưng áo thi đấu.
              Trọng lượng 18g hoàn toàn không gây cản trở chuyển động.
            </p>
          </div>

          <div className="step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-badge">BƯỚC 2</div>
            <div className="step-icon-wrap">
              <Radio size={32} color="#00ff87" />
            </div>
            <h4>Kết Nối Web BLE 1 Chạm</h4>
            <p>
              Mở trình duyệt trên máy tính bảng hoặc laptop, bấm kết nối Bluetooth không dây trực tiếp.
              Tự động nhận diện thiết bị ESP32-C3 trong tích tắc.
            </p>
          </div>

          <div className="step-arrow">
            <ChevronRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-badge">BƯỚC 3</div>
            <div className="step-icon-wrap">
              <BarChart3 size={32} color="#38bdf8" />
            </div>
            <h4>Phân Tích & Nâng Tầm</h4>
            <p>
              Theo dõi biểu đồ động học thời gian thực, nhận báo cáo chỉ số sau buổi tập và
              nhận đề xuất phục hồi thông minh từ AI Coach.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. FOOTER CONTACT OF DEVELOPMENT TEAM
          ===================================================================== */}
      <footer id="contact" className="home-footer">
        <div className="footer-top">
          {/* Col 1: Brand & Bio */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <img src={logoImg} alt="Second Skin Sport" className="footer-logo" />
              <span className="footer-brand-title">SECOND SKIN SPORT</span>
            </div>
            <p className="footer-brand-desc">
              Hệ thống giám sát động học thể thao thông minh chuẩn IoT kết hợp Trí tuệ Nhân tạo.
              Phát triển bởi đội ngũ nghiên cứu & kỹ sư công nghệ thể thao Việt Nam.
            </p>
            <div className="footer-slogan-badge">
              <span>"Theo dõi chuyển động, Nâng tầm hiệu suất"</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Hệ Thống</h4>
            <ul className="footer-links-list">
              <li><a href="#hero">Tổng quan sản phẩm</a></li>
              <li><a href="#mission">Mục tiêu & Sứ mệnh</a></li>
              <li><a href="#features">Quy trình vận hành</a></li>
              <li><Link to="/login">Cổng Vận Động Viên</Link></li>
              <li><Link to="/login">Bàn Huấn Luyện Viên</Link></li>
              <li><Link to="/login">Quản Trị Viên (Admin)</Link></li>
            </ul>
          </div>


          {/* Col 4: Contact of Development Team */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">Liên Hệ Đội Ngũ Phát Triển</h4>
            <div className="footer-contact-items">
              <div className="contact-item">
                <Mail size={16} className="contact-icon" />
                <div>
                  <span className="contact-label">Email hỗ trợ & Hợp tác:</span>
                  <a href="mailto:contact@secondskinsport.io" className="contact-link">
                    contact@secondskinsport.io
                  </a>
                </div>
              </div>

              <div className="contact-item">
                <Phone size={16} className="contact-icon" />
                <div>
                  <span className="contact-label">Hotline Kỹ thuật:</span>
                  <a href="tel:+84987654321" className="contact-link">
                    +84 (0) 987 654 321
                  </a>
                </div>
              </div>

              <div className="contact-item">
                <MapPin size={16} className="contact-icon" />
                <div>
                  <span className="contact-label">Phòng Nghiên Cứu & Phát Triển (R&D Lab):</span>
                  <span className="contact-text">
                    Dự án EXE101 — Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh
                  </span>
                </div>
              </div>
            </div>

            <div className="team-social-links">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="social-pill" title="GitHub Source">
                <GitBranch size={15} />
                <span>GitHub Repos</span>
              </a>
              <div className="team-badge">
                <Users size={14} />
                <span>Second Skin Dev Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Copyright */}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <p className="copyright-text">
              © {new Date().getFullYear()} <strong>Second Skin Sport</strong>. All rights reserved. Nghiên cứu & phát triển vì nền thể thao Việt Nam.
            </p>
            <div className="footer-legal-links">
              <span>Bảo mật dữ liệu sinh trắc học</span>
              <span>•</span>
              <span>Điều khoản sử dụng</span>
              <span>•</span>
              <span>Quy chuẩn IoT Thể thao</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
