# -*- coding: utf-8 -*-
"""
Generate 4 Patent Standard Figures (Black & White line art, clean diagrams with reference numerals)
for Second Skin Sport Patent Specification.
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Ensure output directory exists
OUT_DIR = "D:/EXE101/Second_Skin_Sport/docs/figures"
os.makedirs(OUT_DIR, exist_ok=True)

# Common styling for patent figures
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['text.color'] = 'black'
plt.rcParams['axes.edgecolor'] = 'black'

def create_figure_1():
    """Hình 1: Sơ đồ kiến trúc tổng thể hệ thống (101, 102, 103, 104)"""
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Title
    ax.text(50, 97, "HÌNH 1: SƠ ĐỒ BỐ TRÍ KIẾN TRÚC TỔNG THỂ HỆ THỐNG", 
            ha='center', va='center', fontsize=12, fontweight='bold')

    # Box 101: Wearable Device
    ax.add_patch(patches.Rectangle((5, 52), 40, 40, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(25, 89, "MÔ-ĐUN THIẾT BỊ ĐEO (101)\n(Đeo tại vùng vai hoặc bắp đùi VĐV)", 
            ha='center', va='center', fontsize=8.5, fontweight='bold')

    # Sub-boxes in 101
    ax.add_patch(patches.Rectangle((7, 72), 36, 12, fill=False, edgecolor='black', linewidth=1.0, linestyle='--'))
    ax.text(25, 78, "Cảm biến quán tính 6-DOF IMU (101a)\n- Vị trí đùi: Góc nâng đùi, gia tốc tiếp đất, bật nhảy\n- Vị trí vai: Góc chúi vai, độ lắc lư thân trên", 
            ha='center', va='center', fontsize=7.2)

    ax.add_patch(patches.Rectangle((7, 55), 22, 14, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(18, 62, "Vi điều khiển ESP32-C3 (101b)\n- Lấy mẫu 10Hz (100ms)\n- Ước lượng góc Euler 3D\n- FSM: Active / Cooldown", 
            ha='center', va='center', fontsize=7)

    ax.add_patch(patches.Rectangle((31, 62), 12, 7, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(37, 65.5, "Pin LiPo 3.7V\n(101c)", ha='center', va='center', fontsize=7)

    ax.add_patch(patches.Rectangle((31, 54), 12, 6.5, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(37, 57.2, "BLE / Wi-Fi\n(101d)", ha='center', va='center', fontsize=7)

    # Box 102: Preprocessing & RAM Buffer
    ax.add_patch(patches.Rectangle((55, 52), 40, 40, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(75, 89, "MÔ-ĐUN TIỀN XỬ LÝ & ĐỆM RAM (102)\n(Thiết bị đầu cuối / Edge Gateway)", 
            ha='center', va='center', fontsize=9, fontweight='bold')

    ax.add_patch(patches.Rectangle((58, 71), 34, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(75, 77.5, "Bộ đệm RAM Zero-Touch (102a)\n- Không ghi đĩa I/O (chống nghẽn)\n- Lưu trữ chuỗi sóng 10Hz tức thời\n- Gom 60 điểm trajectory tiêu biểu", 
            ha='center', va='center', fontsize=7.5)

    ax.add_patch(patches.Rectangle((58, 55), 34, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(75, 61.5, "Bộ trích xuất sự kiện động học (102b)\n- Vector gia tốc tổng hợp |mag|\n- Phát hiện bật nhảy (Jumps > 17.5 m/s²)\n- Phát hiện đổi hướng (Turns > 120°/s)", 
            ha='center', va='center', fontsize=7.5)

    # Arrow 101 -> 102
    ax.annotate("", xy=(55, 72), xytext=(45, 72),
                arrowprops=dict(arrowstyle="->", lw=1.5, color='black'))
    ax.text(50, 75, "BLE GATT\nWi-Fi Batch", ha='center', va='center', fontsize=7.5, fontweight='bold')

    # Box 103: Dual-Engine AI
    ax.add_patch(patches.Rectangle((5, 6), 42, 38, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(26, 41, "MÔ-ĐUN PHÂN TÍCH AI SONG HÀNH (103)\n(Dual-Engine AI Reasoning Architecture)", 
            ha='center', va='center', fontsize=8.5, fontweight='bold')

    ax.add_patch(patches.Rectangle((7, 24), 38, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(26, 30.5, "Bộ máy cơ sinh học số nội bộ (103a)\n(Local Biomechanical DSP Engine)\n- 100% Offline (Không cần Internet)\n- 5 nhóm chỉ số động học & rủi ro", 
            ha='center', va='center', fontsize=7.5)

    ax.add_patch(patches.Rectangle((7, 9), 38, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(26, 15.5, "Bộ máy mô hình ngôn ngữ lớn (103b)\n(Cloud Sports LLM - Gemini Flash)\n- Structured JSON Output chuyên sâu\n- Lời khuyên tiếng Việt + Bài tập Sets & Reps", 
            ha='center', va='center', fontsize=7.5)

    # Arrow 102 -> 103
    ax.annotate("", xy=(26, 44), xytext=(75, 52),
                arrowprops=dict(arrowstyle="->", lw=1.5, color='black',
                                connectionstyle="angle,angleA=0,angleB=90,rad=10"))
    ax.text(55, 46, "REST API: POST /api/sessions/auto\n(Chuỗi 60 điểm gia tốc & góc tư thế)", 
            ha='center', va='center', fontsize=7.5)

    # Box 104: Role-based Management & Coach
    ax.add_patch(patches.Rectangle((55, 6), 40, 38, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(75, 41, "MÔ-ĐUN PHÂN QUYỀN ĐA VAI TRÒ (104)\n(Multi-tier Role Management)", 
            ha='center', va='center', fontsize=8.5, fontweight='bold')

    ax.add_patch(patches.Rectangle((58, 28), 34, 9, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(75, 32.5, "Giao diện Vận động viên (104a)\n(Biểu đồ Recharts, 5 thanh đo sinh học)", 
            ha='center', va='center', fontsize=7.5)

    ax.add_patch(patches.Rectangle((58, 17), 34, 9, fill=False, edgecolor='black', linewidth=1.0, linestyle='-'))
    ax.text(75, 21.5, "BẢNG ĐIỀU KHIỂN COACH (104b)\n(Giám sát đội nhóm, ma trận chỉ số, cảnh báo)", 
            ha='center', va='center', fontsize=7.5, fontweight='bold')

    ax.add_patch(patches.Rectangle((58, 8), 34, 7, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(75, 11.5, "Cổng Quản trị hệ thống (104c)\n(Quản lý tài khoản, thiết bị IoT)", 
            ha='center', va='center', fontsize=7)

    # Arrow 103 -> 104
    ax.annotate("", xy=(55, 25), xytext=(47, 25),
                arrowprops=dict(arrowstyle="->", lw=1.5, color='black'))
    ax.text(51, 28, "WebSocket\nSTOMP", ha='center', va='center', fontsize=7.5, fontweight='bold')

    plt.tight_layout()
    path = os.path.join(OUT_DIR, "hinh_1_so_do_kien_truc_tong_the.png")
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {path}")

def create_figure_2():
    """Hình 2: Lưu đồ quy trình xử lý dữ liệu khép kín (201 -> 206)"""
    fig, ax = plt.subplots(figsize=(8, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 97, "HÌNH 2: LƯU ĐỒ QUY TRÌNH XỬ LÝ DỮ LIỆU CỦA HỆ THỐNG", 
            ha='center', va='center', fontsize=12, fontweight='bold')

    steps = [
        ("BƯỚC 201: THU NHẬP TÍN HIỆU ĐỘNG HỌC 6-DOF TẠI VAI / BẮP ĐÙI", 
         "Lấy mẫu IMU MPU-6050 tần số 10Hz tại đai vai hoặc đai bắp đùi (ax, ay, az, gx, gy, gz)\nƯớc lượng góc Euler (Pitch, Roll, Yaw) & nhận diện trạng thái FSM", 86),
        ("BƯỚC 202: ĐÓNG GÓI & TRUYỀN PHÁT DỮ LIỆU KHÔNG DÂY", 
         "Đóng gói định dạng JSON chuẩn hóa\nTruyền phát qua Bluetooth Low Energy (BLE GATT) hoặc Wi-Fi Batching", 72),
        ("BƯỚC 203: TIỀN XỬ LÝ & ĐỆM BỘ NHỚ RAM TẦNG BIÊN (ZERO-TOUCH)", 
         "Lưu trữ chuỗi 10Hz trên RAM Buffer (0 độ trễ, không ghi đĩa I/O)\nTính vector gia tốc |mag|, phát hiện Jumps (>17.5m/s²) và Turns (>120°/s)", 58),
        ("BƯỚC 204: ĐỒNG BỘ DỮ LIỆU PHIÊN TẬP LÊN MÁY CHỦ BACKEND", 
         "Gửi gói tóm tắt và 60 điểm dao động quỹ đạo tiêu biểu qua REST API\nLưu trữ thực thể SportSession vào cơ sở dữ liệu quan hệ", 44),
        ("BƯỚC 205: PHÂN TÍCH CƠ SINH HỌC BẰNG TRÍ TUỆ NHÂN TẠO SONG HÀNH", 
         "Có mạng: Cloud LLM (Gemini 1.5 Flash) sinh báo cáo JSON tiếng Việt chuyên sâu\nMất mạng: Local DSP Engine tính điểm phong độ & phân tầng rủi ro (LOW/MED/HIGH)", 30),
        ("BƯỚC 206: PHÁT TÁN KẾT QUẢ & HIỂN THỊ PHÂN TẦNG ĐA VAI TRÒ", 
         "Phát sóng thời gian thực qua WebSocket STOMP tới Dashboard người dùng\nVận động viên: Xem phân tích cơ sinh học & bài tập khắc phục (Sets & Reps)\nHuấn luyện viên (Coach): Cập nhật ma trận chỉ số & cảnh báo nguy cơ toàn đội", 14)
    ]

    for title, desc, y in steps:
        # Step box
        ax.add_patch(patches.FancyBboxPatch((10, y - 4), 80, 9.5, boxstyle="round,pad=0.5",
                                            fill=False, edgecolor='black', linewidth=1.4))
        ax.text(50, y + 3.2, title, ha='center', va='center', fontsize=8.5, fontweight='bold')
        ax.text(50, y - 0.5, desc, ha='center', va='center', fontsize=7.2)

        # Arrow to next step
        if y > 15:
            ax.annotate("", xy=(50, y - 5.5), xytext=(50, y - 4.2),
                        arrowprops=dict(arrowstyle="->", lw=1.5, color='black'))

    plt.tight_layout()
    path = os.path.join(OUT_DIR, "hinh_2_luu_do_quy_trinh_xu_ly.png")
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {path}")

def create_figure_3():
    """Hình 3: Cơ chế thuật toán trích xuất đặc trưng cơ sinh học (301 -> 306)"""
    fig, ax = plt.subplots(figsize=(10, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 97, "HÌNH 3: CƠ CHẾ TRÍCH XUẤT ĐẶC TRƯNG CƠ SINH HỌC & ĐÁNH GIÁ CHẤN THƯƠNG", 
            ha='center', va='center', fontsize=11.5, fontweight='bold')

    # Top: Raw Data Input
    ax.add_patch(patches.Rectangle((20, 85), 60, 8, fill=False, edgecolor='black', linewidth=1.4))
    ax.text(50, 89, "DỮ LIỆU ĐỘNG HỌC ĐẦU VÀO TỪ CẢM BIẾN (Chuỗi mẫu 10Hz)\n[ax, ay, az, gx, gy, gz, Pitch, Roll, Yaw]", 
            ha='center', va='center', fontsize=8.5, fontweight='bold')

    # Connect to 5 Feature Extractors
    ax.annotate("", xy=(15, 78), xytext=(35, 85), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))
    ax.annotate("", xy=(32, 78), xytext=(42, 85), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))
    ax.annotate("", xy=(50, 78), xytext=(50, 85), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))
    ax.annotate("", xy=(68, 78), xytext=(58, 85), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))
    ax.annotate("", xy=(85, 78), xytext=(65, 85), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))

    # 5 feature blocks
    features = [
        ("Bước 301:\nĐộ êm tiếp đất\n(Landing Softness)", 
         "mag = √(ax²+ay²+az²)\nPeakImpactG = max(mag)/g (proxy)\nSoftness = 100 - (G-1.8)*22", 6, 52),
        ("Bước 302:\nXu hướng cân bằng\n(Balance Tendency)", 
         "Dấu Roll & Chiều ay (1 IMU)\nRatio = Left / (Left+Right)\nBalance% = 100 - |Ratio-0.5|*60\n(Dual-IMU: Đo trực tiếp 2 chân)", 24, 52),
        ("Bước 303:\nĐộ vững thân trên\n(Trunk Stability)", 
         "Độ lệch chuẩn σ_Pitch, σ_Roll\nStability = 100 - (σP+σR)*1.8\nGóc chúi Lean Angle = |Pitch|", 42, 52),
        ("Bước 304:\nĐộ bùng nổ & Bay\n(Explosiveness)", 
         "Take-off: mag > 17.5 m/s²\nThời gian bay: Δt_air\nĐộ cao H = (1/8)*g*(Δt)²", 60, 52),
        ("Bước 305:\nChỉ số mỏi cơ\n(Fatigue Index)", 
         "ΔE = (E_đầu - E_cuối)/E_đầu\nFatigue = round(ΔE*100%) + 12\nSụt giảm công suất > 25%", 78, 52)
    ]

    for title, formula, x, y in features:
        ax.add_patch(patches.Rectangle((x, y), 16, 25, fill=False, edgecolor='black', linewidth=1.2))
        ax.text(x + 8, y + 20, title, ha='center', va='center', fontsize=7.5, fontweight='bold')
        ax.text(x + 8, y + 8, formula, ha='center', va='center', fontsize=6.2)
        # Arrow down
        ax.annotate("", xy=(50, 39), xytext=(x + 8, y),
                    arrowprops=dict(arrowstyle="->", lw=1.0, color='black'))

    # Step 306: Injury Risk Fusion
    ax.add_patch(patches.Rectangle((15, 14), 70, 24, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(50, 34, "BƯỚC 306: TỔNG HỢP & PHÂN TẦNG NGUY CƠ CHẤN THƯƠNG (INJURY RISK FUSION)", 
            ha='center', va='center', fontsize=8.5, fontweight='bold')

    ax.add_patch(patches.Rectangle((18, 17), 19, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(27.5, 25.5, "MỨC LOW\n(An toàn / Tối ưu)\n- PeakImpactG < 2.4G\n- Cân bằng > 90%\n- Mỏi cơ < 18%", 
            ha='center', va='center', fontsize=7)

    ax.add_patch(patches.Rectangle((40.5, 17), 19, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(50, 25.5, "MỨC MEDIUM\n(Cần lưu ý quá tải)\n- Tiếp đất 2.5G - 2.9G\n- Lệch tải 12% - 18%\n- Mỏi cơ 18% - 25%", 
            ha='center', va='center', fontsize=7)

    ax.add_patch(patches.Rectangle((63, 17), 19, 13, fill=False, edgecolor='black', linewidth=1.0))
    ax.text(72.5, 25.5, "MỨC HIGH\n(Cảnh báo chấn thương)\n- PeakImpactG > 3.0G\n- Viêm gân gót / Bánh chè\n- Lệch tải >18%, sụt giảm >25%", 
            ha='center', va='center', fontsize=7)

    plt.tight_layout()
    path = os.path.join(OUT_DIR, "hinh_3_co_che_trich_xuat_dac_trung.png")
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {path}")

def create_figure_4():
    """Hình 4: Sơ đồ tương tác phân quyền và bảng điều khiển Huấn luyện viên (401 -> 405)"""
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    ax.text(50, 97, "HÌNH 4: SƠ ĐỒ TƯƠNG TÁC PHÂN QUYỀN & BẢNG ĐIỀU KHIỂN HUẤN LUYỆN VIÊN (COACH)", 
            ha='center', va='center', fontsize=11, fontweight='bold')

    # Block 401: Coach Auth & Access
    ax.add_patch(patches.Rectangle((5, 74), 40, 18, fill=False, edgecolor='black', linewidth=1.3))
    ax.text(25, 88, "BƯỚC 401: XÁC THỰC PHÂN QUYỀN RBAC", ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(25, 80, "- Đăng nhập tài khoản vai trò COACH\n- Xác thực JWT Token & kiểm tra quyền đội nhóm\n- Tải danh sách thành viên trực thuộc (Roster)", ha='center', va='center', fontsize=7)

    # Block 402: Multi-Athlete Stream
    ax.add_patch(patches.Rectangle((55, 74), 40, 18, fill=False, edgecolor='black', linewidth=1.3))
    ax.text(75, 88, "BƯỚC 402: ĐỒNG BỘ LUỒNG DỮ LIỆU ĐỘI", ha='center', va='center', fontsize=8, fontweight='bold')
    ax.text(75, 80, "- Mở kết nối đa kênh WebSocket STOMP\n- Nhận luồng dữ liệu song song từ N thiết bị đeo\n- Cập nhật nhịp tim, tốc độ, gia tốc tức thời", ha='center', va='center', fontsize=7)

    # Connect 401 -> 402
    ax.annotate("", xy=(55, 83), xytext=(45, 83), arrowprops=dict(arrowstyle="->", lw=1.3, color='black'))

    # Main Center: Block 403 (Coach Team Dashboard)
    ax.add_patch(patches.Rectangle((5, 28), 90, 41, fill=False, edgecolor='black', linewidth=1.5))
    ax.text(50, 65, "BƯỚC 403: BẢNG MA TRẬN CHỈ SỐ THỜI GIAN THỰC (COACH TEAM DASHBOARD)", 
            ha='center', va='center', fontsize=9, fontweight='bold')

    # Draw Athlete Cards in Dashboard
    athletes = [
        ("VĐV #01: Alex J.", "Tốc độ: 18.2 km/h\nTiếp đất: 2.2G (Êm)\nCân bằng: 94%\nTrạng thái: [LOW]", 8, 32),
        ("VĐV #02: Sarah J.", "Tốc độ: 14.5 km/h\nTiếp đất: 2.4G (Êm)\nCân bằng: 91%\nTrạng thái: [LOW]", 26, 32),
        ("VĐV #03: Mike T.", "Tốc độ: 16.0 km/h\nTiếp đất: 2.7G (Vừa)\nCân bằng: 85%\nTrạng thái: [MEDIUM]", 44, 32),
        ("VĐV #04: David B.", "Tốc độ: 11.2 km/h (Mỏi)\nTiếp đất: 3.2G (Cứng!)\nCân bằng: 78% (Lệch!)\nTrạng thái: [HIGH RISK]", 62, 32),
        ("VĐV #05: Emma W.", "Tốc độ: 15.1 km/h\nTiếp đất: 2.3G (Êm)\nCân bằng: 93%\nTrạng thái: [LOW]", 80, 32),
    ]

    for name, stats, x, y in athletes:
        is_high = "HIGH" in stats
        lw = 2.0 if is_high else 1.0
        ls = '-' if not is_high else '--'
        ax.add_patch(patches.Rectangle((x, y), 16, 28, fill=False, edgecolor='black', linewidth=lw, linestyle=ls))
        ax.text(x + 8, y + 24.5, name, ha='center', va='center', fontsize=7, fontweight='bold')
        ax.text(x + 8, y + 12, stats, ha='center', va='center', fontsize=6.2)

    # Arrow 402 -> 403
    ax.annotate("", xy=(50, 69), xytext=(75, 74),
                arrowprops=dict(arrowstyle="->", lw=1.3, color='black',
                                connectionstyle="angle,angleA=0,angleB=90,rad=8"))

    # Block 404: Centralized Alert
    ax.add_patch(patches.Rectangle((5, 6), 42, 17, fill=False, edgecolor='black', linewidth=1.3))
    ax.text(26, 19, "BƯỚC 404: CẢNH BÁO TẬP TRUNG TỨC THỜI", ha='center', va='center', fontsize=7.8, fontweight='bold')
    ax.text(26, 12, "- Kích hoạt viền đỏ nhấp nháy trên thẻ VĐV quá tải\n- Phát âm thanh cảnh báo nguy cơ chấn thương\n- Đề xuất thay người hoặc hạ cường độ bài tập", ha='center', va='center', fontsize=6.8)

    # Block 405: Drilldown & Export
    ax.add_patch(patches.Rectangle((53, 6), 42, 17, fill=False, edgecolor='black', linewidth=1.3))
    ax.text(74, 19, "BƯỚC 405: ĐỐI CHIẾU & TRÍCH XUẤT BÁO CÁO", ha='center', va='center', fontsize=7.8, fontweight='bold')
    ax.text(74, 12, "- Mở chi tiết AI Coach Insight Card của từng cá nhân\n- So sánh tương quan phong độ 2 hoặc nhiều VĐV\n- Trích xuất hồ sơ thể lực toàn đội (PDF/CSV)", ha='center', va='center', fontsize=6.8)

    # Arrows from 403 down to 404 and 405
    ax.annotate("", xy=(26, 23), xytext=(35, 28), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))
    ax.annotate("", xy=(74, 23), xytext=(65, 28), arrowprops=dict(arrowstyle="->", lw=1.2, color='black'))

    plt.tight_layout()
    path = os.path.join(OUT_DIR, "hinh_4_so_do_tuong_tac_coach_role.png")
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Generated: {path}")

if __name__ == "__main__":
    create_figure_1()
    create_figure_2()
    create_figure_3()
    create_figure_4()
    print("All 4 figures generated successfully!")
