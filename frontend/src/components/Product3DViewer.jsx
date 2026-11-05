import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import './Product3DViewer.css';

// 3D Geometry Constants of the Physical Prototype:
// Compact Chubby Box with 16-vertex rounded fillet rings
// Length (X) ~ 33mm, Width (Y) ~ 25mm, Thickness (Z) ~ 27mm (chunky, deep-walled box matching physical prototype)
const W_CORE = 25;   // X center offset
const H_CORE = 17;   // Y center offset
const R = 8;         // Smooth fillet corner radius (bo 4 góc mượt mà)
const T_TOP = 13.5;  // Top lid plateau height (tăng nhẹ chiều cao nắp)
const T_STEP = 11.2; // Outer lid rim step height
const T_BOT = -13.5; // Bottom case depth (tăng chiều sâu thành hộp)
const SEAM = 5;      // Lid parting seam

/**
 * 3D Interactive Product Showcase Widget for Hero Section
 * Refined 3D Geometry to match the exact physical prototype:
 * - Chubby/compact form factor (không còn bị dài và dẹp)
 * - Generously rounded 4 corners with smooth arc fillets
 * - Raised tiered plateau on the top lid matching the 3D-printed casing
 * - Tactile Black push button on the front wall
 * - Dual strap slots on the bottom edge matching the physical sample
 * - Official Sport "S" Logo from public folder mapped onto the 3D top lid
 */
export default function Product3DViewer() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load official "S" logo from public folder
  const logoImgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, []);

  // High performance refs for 60FPS physics
  const rotationRef = useRef({ x: 22, y: -32, z: 0 });
  const zoomRef = useRef(1);
  const isAutoRotateRef = useRef(true);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pulseRef = useRef(0);

  // UI state
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [, setRerenderTrigger] = useState(0);

  // 3D Geometry of the Physical Prototype:
  // Compact Chubby Box with 16-vertex rounded fillet rings
  // Length (X) = ~35, Width (Y) = ~26, Height (Z) = ~22 (thick and solid, not flat or stretched)
  const geo = useRef((() => {
    // Generate a 16-point smoothly rounded rectangle ring at given Z height
    const makeFilletRing = (z, shrink = 0) => {
      const w = Math.max(2, W_CORE - shrink);
      const h = Math.max(2, H_CORE - shrink);
      const r = Math.max(1, R - shrink * 0.4);
      const pts = [];

      // 4 corners with 4 arc points each = 16 points for smooth roundness
      const corners = [
        { cx: w, cy: -h, startAngle: -Math.PI / 2 }, // Top-Right
        { cx: w, cy: h, startAngle: 0 },             // Bottom-Right
        { cx: -w, cy: h, startAngle: Math.PI / 2 },  // Bottom-Left
        { cx: -w, cy: -h, startAngle: Math.PI }      // Top-Left
      ];

      corners.forEach((c) => {
        for (let i = 0; i < 4; i++) {
          const angle = c.startAngle + (i / 3) * (Math.PI / 2);
          pts.push({
            x: c.cx + Math.cos(angle) * r,
            y: c.cy + Math.sin(angle) * r,
            z
          });
        }
      });

      return pts;
    };

    // 1. Raised Plateau on Top Lid (bậc gờ nhô trên nắp hộp theo ảnh chụp cận cảnh)
    const topPlateau = makeFilletRing(T_TOP, 3.5);
    // 2. Upper Lid Rim Step
    const topRimStep = makeFilletRing(T_STEP, 0.5);
    // 3. Lid Outer Seam
    const topSeam = makeFilletRing(SEAM + 0.6, 0);
    // 4. Bottom Case Seam
    const botSeam = makeFilletRing(SEAM - 0.6, 0);
    // 5. Bottom Case Outer Wall
    const botWall = makeFilletRing(T_BOT + 2.5, 0);
    // 6. Bottom Beveled Base
    const botBase = makeFilletRing(T_BOT, 3);

    // Side Button geometry: Mounted on front wall (Y = +H), centered at X = 0, Z = -1
    const btnRad = 4.8;
    const btnCenter = { x: 0, y: H_CORE + R + 2.2, z: -1 };
    const btnPoints = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      btnPoints.push({
        x: btnCenter.x + Math.cos(angle) * btnRad,
        y: btnCenter.y,
        z: btnCenter.z + Math.sin(angle) * btnRad
      });
    }

    // Dual strap slots on the back/bottom edge (2 khe rãnh luồn dây đeo như trong ảnh 2)
    const slot1 = [
      { x: -16, y: H_CORE + R - 0.5, z: T_BOT + 1.8 },
      { x: -6,  y: H_CORE + R - 0.5, z: T_BOT + 1.8 },
      { x: -6,  y: H_CORE + R - 0.5, z: T_BOT + 4.6 },
      { x: -16, y: H_CORE + R - 0.5, z: T_BOT + 4.6 }
    ];
    const slot2 = [
      { x: 6,  y: H_CORE + R - 0.5, z: T_BOT + 1.8 },
      { x: 16, y: H_CORE + R - 0.5, z: T_BOT + 1.8 },
      { x: 16, y: H_CORE + R - 0.5, z: T_BOT + 4.6 },
      { x: 6,  y: H_CORE + R - 0.5, z: T_BOT + 4.6 }
    ];

    return {
      topPlateau,
      topRimStep,
      topSeam,
      botSeam,
      botWall,
      botBase,
      btnCenter,
      btnPoints,
      slot1,
      slot2
    };
  })());

  // 3D Point Projection Helper
  const projectPoint = useCallback((p, rot, scaleVal, cx, cy) => {
    const radX = (rot.x * Math.PI) / 180;
    const radY = (rot.y * Math.PI) / 180;
    const radZ = (rot.z * Math.PI) / 180;

    let x1 = p.x * Math.cos(radY) + p.z * Math.sin(radY);
    let y1 = p.y;
    let z1 = -p.x * Math.sin(radY) + p.z * Math.cos(radY);

    let x2 = x1;
    let y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    let z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

    let x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
    let y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);
    let z3 = z2;

    const distance = 460;
    const fov = distance / (distance + z3);
    const px = cx + x3 * fov * scaleVal;
    const py = cy + y3 * fov * scaleVal;

    return { x: px, y: py, z: z3, fov };
  }, []);

  // Primary 60FPS Render Loop
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      pulseRef.current = (pulseRef.current + 0.04) % (Math.PI * 2);

      if (isAutoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.y = (rotationRef.current.y + 0.7) % 360;
      }

      const canvas = canvasRef.current;
      if (!canvas || !canvas.getContext) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Background
      ctx.save();
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.55);
      bgGrad.addColorStop(0, 'rgba(0, 242, 254, 0.12)');
      bgGrad.addColorStop(0.5, 'rgba(16, 24, 40, 0.5)');
      bgGrad.addColorStop(1, 'rgba(8, 9, 13, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Floor Holographic Ripple Circles
      const currentZoom = zoomRef.current;
      const pulseRing = Math.sin(pulseRef.current) * 5;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 85 * currentZoom, (115 + pulseRing) * currentZoom, (40 + pulseRing * 0.3) * currentZoom, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 135, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 85 * currentZoom, 160 * currentZoom, 54 * currentZoom, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const scaleVal = 2.85 * currentZoom;
      const rot = rotationRef.current;
      const {
        topPlateau,
        topRimStep,
        topSeam,
        botSeam,
        botWall,
        botBase,
        btnCenter,
        btnPoints,
        slot1,
        slot2
      } = geo.current;

      // Project all fillet rings (16 vertices each)
      const projPlateau = topPlateau.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projRimStep = topRimStep.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projTopSeam = topSeam.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projBotSeam = botSeam.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projBotWall = botWall.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projBotBase = botBase.map((p) => projectPoint(p, rot, scaleVal, cx, cy));

      // Build 3D Faces collection
      const facesToRender = [];

      const addQuad = (pts, baseColor) => {
        const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const v1 = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
        const v2 = { x: pts[2].x - pts[0].x, y: pts[2].y - pts[0].y };
        const crossZ = v1.x * v2.y - v1.y * v2.x;
        facesToRender.push({ pts, avgZ, crossZ, baseColor });
      };

      const N = 16;
      for (let i = 0; i < N; i++) {
        const next = (i + 1) % N;
        // Top Lid Plateau Bevel Slope
        addQuad([projPlateau[i], projPlateau[next], projRimStep[next], projRimStep[i]], '#f8fafc');
        // Top Lid Side Wall to Seam
        addQuad([projRimStep[i], projRimStep[next], projTopSeam[next], projTopSeam[i]], '#edf2f7');
        // Bottom Case Wall from Seam to Wall base
        addQuad([projBotSeam[i], projBotSeam[next], projBotWall[next], projBotWall[i]], '#e2e8f0');
        // Bottom Case Chamfer to Base Plate
        addQuad([projBotWall[i], projBotWall[next], projBotBase[next], projBotBase[i]], '#cbd5e1');
      }

      // 1. Top Lid Plateau Cap (Mặt phẳng trên nắp hộp màu trắng tinh tế)
      const topAvgZ = projPlateau.reduce((s, p) => s + p.z, 0) / N;
      const vTop1 = { x: projPlateau[1].x - projPlateau[0].x, y: projPlateau[1].y - projPlateau[0].y };
      const vTop2 = { x: projPlateau[4].x - projPlateau[0].x, y: projPlateau[4].y - projPlateau[0].y };
      const topCrossZ = vTop1.x * vTop2.y - vTop1.y * vTop2.x;
      facesToRender.push({
        pts: projPlateau,
        avgZ: topAvgZ,
        crossZ: topCrossZ,
        baseColor: '#ffffff',
        isTopCap: true
      });

      // 2. Bottom Base Plate Cap
      const botAvgZ = projBotBase.reduce((s, p) => s + p.z, 0) / N;
      const vBot1 = { x: projBotBase[1].x - projBotBase[0].x, y: projBotBase[1].y - projBotBase[0].y };
      const vBot2 = { x: projBotBase[4].x - projBotBase[0].x, y: projBotBase[4].y - projBotBase[0].y };
      const botCrossZ = vBot1.x * vBot2.y - vBot1.y * vBot2.x;
      facesToRender.push({
        pts: projBotBase,
        avgZ: botAvgZ,
        crossZ: botCrossZ,
        baseColor: '#94a3b8'
      });

      // Sort faces back to front (Painter's algorithm)
      facesToRender.sort((a, b) => a.avgZ - b.avgZ);

      // Render White Box Polyhedron
      facesToRender.forEach((face) => {
        const { pts, crossZ, baseColor } = face;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        const lightFactor = Math.max(0.35, Math.min(1.0, 0.65 + (crossZ / 3800) * 0.35));
        ctx.fillStyle = computeWhiteShading(baseColor, lightFactor);
        ctx.fill();

        ctx.strokeStyle = lightFactor > 0.8 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      });

      // Seam Groove (Rãnh nắp hộp)
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(projTopSeam[0].x, projTopSeam[0].y);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(projTopSeam[i].x, projTopSeam[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Dual strap slots on bottom edge (như trong ảnh 2)
      const projSlot1 = slot1.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      const projSlot2 = slot2.map((p) => projectPoint(p, rot, scaleVal, cx, cy));
      if (projSlot1[0].z > -28) {
        [projSlot1, projSlot2].forEach((slotPts) => {
          ctx.beginPath();
          ctx.moveTo(slotPts[0].x, slotPts[0].y);
          for (let i = 1; i < 4; i++) ctx.lineTo(slotPts[i].x, slotPts[i].y);
          ctx.closePath();
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      // 2. Render Tactical Black Button On Front/Side Wall
      const projBtnCenter = projectPoint(btnCenter, rot, scaleVal, cx, cy);
      const projBtnPoints = btnPoints.map((p) => projectPoint(p, rot, scaleVal, cx, cy));

      if (projBtnCenter.z > -28) {
        ctx.beginPath();
        ctx.moveTo(projBtnPoints[0].x, projBtnPoints[0].y);
        for (let i = 1; i < projBtnPoints.length; i++) {
          ctx.lineTo(projBtnPoints[i].x, projBtnPoints[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(projBtnCenter.x, projBtnCenter.y, 4.3 * currentZoom, 0, Math.PI * 2);
        const btnGrad = ctx.createRadialGradient(
          projBtnCenter.x - 1,
          projBtnCenter.y - 1,
          1,
          projBtnCenter.x,
          projBtnCenter.y,
          4.3 * currentZoom
        );
        btnGrad.addColorStop(0, '#3f3f46');
        btnGrad.addColorStop(0.6, '#18181b');
        btnGrad.addColorStop(1, '#09090b');
        ctx.fillStyle = btnGrad;
        ctx.fill();
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // =====================================================================
      // 3. RENDER OFFICIAL "S" SPORT LOGO ON TOP LID PLATEAU
      // EXACT CALIBRATED CURVE MATCHING USER IMAGES 1 & 2
      // =====================================================================
      if (topCrossZ > 0) {
        const p0 = projectPoint({ x: 0, y: 0, z: T_TOP }, rot, scaleVal, cx, cy);
        const px = projectPoint({ x: 10, y: 0, z: T_TOP }, rot, scaleVal, cx, cy);
        const py = projectPoint({ x: 0, y: 10, z: T_TOP }, rot, scaleVal, cx, cy);

        const ux = (px.x - p0.x) / 10;
        const uy = (px.y - p0.y) / 10;
        const vx = (py.x - p0.x) / 10;
        const vy = (py.y - p0.y) / 10;

        ctx.save();
        ctx.transform(ux, uy, vx, vy, p0.x, p0.y);
        // Rotate logo 90 degrees (-PI / 2) to vertical orientation matching the physical prototype
        if (typeof ctx.rotate === 'function') {
          ctx.rotate(-Math.PI / 2);
        }

        // Ambient Cyan Glow Aura beneath the logo
        const pulse = Math.sin(pulseRef.current) * 2;
        const glowRad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20 + pulse);
        glowRad.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
        glowRad.addColorStop(0.6, 'rgba(0, 242, 254, 0.15)');
        glowRad.addColorStop(1, 'rgba(0, 242, 254, 0)');
        ctx.fillStyle = glowRad;
        ctx.beginPath();
        ctx.arc(0, 0, 20 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 1. Draw from public/logo.png if ready
        if (logoImgRef.current && logoImgRef.current.complete) {
          const logoW = 28;
          const logoH = 25;
          ctx.drawImage(logoImgRef.current, -logoW / 2, -logoH / 2, logoW, logoH);
        } else {
          // 2. High-precision vector sharp "S" geometric glyph matching the official brand logo
          ctx.fillStyle = '#00f2fe';
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 1.2;
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 8;

          ctx.beginPath();
          ctx.moveTo(2, 13);
          ctx.lineTo(-4, 13);
          ctx.lineTo(-11, 4);
          ctx.lineTo(-5, 4);
          ctx.lineTo(-9, -2);
          ctx.lineTo(2, -2);
          ctx.lineTo(-2, 5);
          ctx.lineTo(5, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-2, -13);
          ctx.lineTo(4, -13);
          ctx.lineTo(11, -4);
          ctx.lineTo(5, -4);
          ctx.lineTo(9, 2);
          ctx.lineTo(-2, 2);
          ctx.lineTo(2, -5);
          ctx.lineTo(-5, -5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [projectPoint]);

  // Pointer interaction
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    isAutoRotateRef.current = false;
    setIsAutoRotate(false);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;

    rotationRef.current.x = Math.max(-75, Math.min(75, rotationRef.current.x - deltaY * 0.4));
    rotationRef.current.y = (rotationRef.current.y + deltaX * 0.45) % 360;

    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const snapToAngle = (preset) => {
    isAutoRotateRef.current = false;
    setIsAutoRotate(false);
    if (preset === 'top') rotationRef.current = { x: 82, y: 0, z: 0 };
    if (preset === 'side') rotationRef.current = { x: 6, y: 0, z: 0 };
    if (preset === 'iso') rotationRef.current = { x: 26, y: -45, z: 0 };
    setRerenderTrigger((v) => v + 1);
  };

  const resetView = () => {
    rotationRef.current = { x: 22, y: -32, z: 0 };
    zoomRef.current = 1;
    isAutoRotateRef.current = true;
    setIsAutoRotate(true);
    setRerenderTrigger((v) => v + 1);
  };

  const toggleAutoRotate = () => {
    const next = !isAutoRotate;
    isAutoRotateRef.current = next;
    setIsAutoRotate(next);
  };

  const handleZoom = (delta) => {
    const newZoom = Math.max(0.75, Math.min(1.35, zoomRef.current + delta));
    zoomRef.current = newZoom;
    setRerenderTrigger((v) => v + 1);
  };

  return (
    <div className="hero-3d-container" ref={containerRef}>
      {/* 3D Viewport Card */}
      <div className="hero-3d-viewport">
        {/* Top Floating HUD Header */}
        <div className="hero-3d-hud-header">
          <div className="hero-hud-badge">
            <span className="hero-hud-pulse-dot" />
            <span>MÔ HÌNH 3D XOAY 360°</span>
          </div>

          <div className="hero-hud-controls">
            <button
              className={`hero-hud-btn ${isAutoRotate ? 'active' : ''}`}
              onClick={toggleAutoRotate}
              title={isAutoRotate ? 'Tạm dừng xoay' : 'Tự động xoay 360°'}
            >
              {isAutoRotate ? <Pause size={13} /> : <Play size={13} />}
              <span>{isAutoRotate ? 'Dừng' : 'Xoay'}</span>
            </button>
            <button className="hero-hud-btn" onClick={resetView} title="Khôi phục góc nhìn">
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 3D Canvas Viewport */}
        <div className="hero-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={540}
            height={380}
            className="hero-3d-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <div className="hero-3d-drag-hint">
            <Maximize2 size={12} />
            <span>Kéo chuột hoặc vuốt để xoay 360° mọi góc độ</span>
          </div>
        </div>

        {/* Bottom Floating Angles & Zoom Bar */}
        <div className="hero-3d-bottom-bar">
          <div className="hero-angle-buttons">
              <button className="hero-angle-pill" onClick={() => snapToAngle('top')}>
                Mặt Trên (Logo S)
              </button>
              <button className="hero-angle-pill" onClick={() => snapToAngle('side')}>
                Cạnh Bên (Nút Đen)
              </button>
              <button className="hero-angle-pill" onClick={() => snapToAngle('iso')}>
                Nghiêng 3D
              </button>
            </div>

            <div className="hero-zoom-group">
              <button className="hero-zoom-btn" onClick={() => handleZoom(0.1)} title="Phóng to">
                <ZoomIn size={13} />
              </button>
              <button className="hero-zoom-btn" onClick={() => handleZoom(-0.1)} title="Thu nhỏ">
                <ZoomOut size={13} />
              </button>
            </div>
          </div>
        </div>

      {/* Mini Color Spec Legend below 3D box */}
      <div className="hero-spec-legend">
        <div className="legend-chip">
          <span className="dot dot-white" />
          <span>Vỏ Trắng Bo 4 Góc Mềm Mại</span>
        </div>
        <div className="legend-chip">
          <span className="dot dot-black" />
          <span>Nút Đen Cạnh Bên</span>
        </div>
        <div className="legend-chip">
          <span className="dot dot-cyan" />
          <span>Logo Chữ S Chuẩn Thương Hiệu</span>
        </div>
      </div>
    </div>
  );
}

// Compute white surface shading with smooth diffuse lighting
function computeWhiteShading(baseHex, lightFactor) {
  let r = 255;
  let g = 255;
  let b = 255;

  if (baseHex === '#f8fafc') { r = 248; g = 250; b = 252; }
  else if (baseHex === '#edf2f7') { r = 237; g = 242; b = 247; }
  else if (baseHex === '#e2e8f0') { r = 226; g = 232; b = 240; }
  else if (baseHex === '#cbd5e1') { r = 203; g = 213; b = 225; }
  else if (baseHex === '#94a3b8') { r = 148; g = 163; b = 184; }

  const finalR = Math.min(255, Math.max(80, Math.round(r * lightFactor)));
  const finalG = Math.min(255, Math.max(85, Math.round(g * lightFactor)));
  const finalB = Math.min(255, Math.max(100, Math.round(b * (lightFactor * 0.98 + 0.05))));

  return `rgb(${finalR}, ${finalG}, ${finalB})`;
}
