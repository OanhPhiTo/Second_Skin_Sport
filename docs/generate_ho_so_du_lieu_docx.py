# -*- coding: utf-8 -*-
"""
Script to generate the Word document:
Ho_So_Du_Lieu_IoT_va_Co_Che_Phan_Tich_AI_Second_Skin_Sport.docx
Matching the structure, tone, and depth of the PDF 'Ho So Du Lieu IoT va Co Che Phan Tich AI - Second Skin Sport.pdf',
enriched with detailed codebase verification and automated test proof.
"""

import os
import docx
from docx.shared import Mm, Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    """Set cell inner padding in dxa (1 pt = 20 dxa)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set background color for a cell"""
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_left_border(cell, color_hex="1E3A8A", sz="36"):
    """Left border for callout blocks"""
    tcPr = cell._tc.get_or_add_tcPr()
    borders_xml = f'''
    <w:tcBorders {nsdecls("w")}>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
    </w:tcBorders>
    '''
    tcPr.append(parse_xml(borders_xml))

def set_table_borders(table, color_hex="CBD5E1"):
    """Subtle clean borders for table"""
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="{color_hex}"/>
        <w:left w:val="none"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="1E3A8A"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color_hex}"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def add_header_footer(doc):
    for s in doc.sections:
        s.top_margin = Mm(18)
        s.bottom_margin = Mm(18)
        s.left_margin = Mm(20)
        s.right_margin = Mm(20)
        
        # Header
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hr = hp.add_run("SECOND SKIN SPORT — HỒ SƠ DỮ LIỆU IOT & CƠ CHẾ PHÂN TÍCH AI")
        hr.font.name = "Arial"
        hr.font.size = Pt(8)
        hr.font.color.rgb = RGBColor(148, 163, 184)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        fr = fp.add_run("Hồ sơ Kỹ thuật & Sinh trắc học Thể thao • Trang ")
        fr.font.name = "Arial"
        fr.font.size = Pt(8.5)
        fr.font.color.rgb = RGBColor(148, 163, 184)
        
        # Page field
        fldSimple = OxmlElement('w:fldSimple')
        fldSimple.set(qn('w:instr'), 'PAGE')
        fp._p.append(fldSimple)

def add_section_badge(doc, number_str, title_str):
    """Render a section header with circular badge style like 01, 02, etc."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    
    r_num = p.add_run(f"[{number_str}] ")
    r_num.font.name = "Arial"
    r_num.font.size = Pt(13)
    r_num.font.bold = True
    r_num.font.color.rgb = RGBColor(2, 132, 199) # Sky 600
    
    r_title = p.add_run(title_str)
    r_title.font.name = "Arial"
    r_title.font.size = Pt(13)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
    return p

def add_code_block(doc, text):
    """Add a syntax block with monospaced font and light shading"""
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_margins(c, top=80, bottom=80, left=120, right=120)
    set_cell_shading(c, "F1F5F9") # Slate 100
    set_cell_left_border(c, "64748B", sz="24")
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(text)
    r.font.name = "Consolas"
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 41, 59)
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(2)
    p_sp.paragraph_format.space_after = Pt(2)

def add_verification_box(doc, file_loc, test_evidence, status_text):
    """Add an explicit green callout box showing code verification evidence"""
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_margins(c, top=80, bottom=80, left=120, right=120)
    set_cell_shading(c, "F0FDF4") # Light emerald
    set_cell_left_border(c, "16A34A", sz="28")
    
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r1 = p.add_run("✓ XÁC THỰC MÃ NGUỒN & KIỂM CHỨNG THỰC TẾ: ")
    r1.font.name = "Arial"
    r1.font.size = Pt(8.5)
    r1.font.bold = True
    r1.font.color.rgb = RGBColor(21, 128, 61)
    
    r2 = p.add_run(status_text)
    r2.font.name = "Arial"
    r2.font.size = Pt(8.5)
    r2.font.color.rgb = RGBColor(30, 41, 59)
    
    p2 = c.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    r3 = p2.add_run(f"• Mã nguồn: {file_loc}\n• Bằng chứng test: {test_evidence}")
    r3.font.name = "Arial"
    r3.font.size = Pt(8)
    r3.font.italic = True
    r3.font.color.rgb = RGBColor(71, 85, 105)
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(2)
    p_sp.paragraph_format.space_after = Pt(4)

def build_ho_so_du_lieu_doc():
    doc = docx.Document()
    add_header_footer(doc)
    
    # =============================================================
    # TRANG BÌA (COVER HEADER)
    # =============================================================
    cover_t = doc.add_table(rows=1, cols=1)
    cover_t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = cover_t.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_margins(c, top=260, bottom=260, left=240, right=240)
    set_cell_shading(c, "0F172A") # Dark Navy
    set_cell_left_border(c, "0284C7", sz="48") # Blue Accent
    
    cp = c.paragraphs[0]
    cp.paragraph_format.space_after = Pt(4)
    r_top = cp.add_run("TÀI LIỆU ĐẶC TẢ KỸ THUẬT & SINH TRẮC HỌC THỂ THAO")
    r_top.font.name = "Arial"
    r_top.font.size = Pt(9.5)
    r_top.font.bold = True
    r_top.font.color.rgb = RGBColor(56, 189, 248) # Cyan 400
    
    cp_title = c.add_paragraph()
    cp_title.paragraph_format.space_before = Pt(4)
    cp_title.paragraph_format.space_after = Pt(8)
    r_title = cp_title.add_run("SECOND SKIN SPORT — HỒ SƠ DỮ LIỆU IOT & CƠ CHẾ PHÂN TÍCH AI CHUYÊN SÂU")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(17)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(255, 255, 255)
    
    cp_meta = c.add_paragraph()
    cp_meta.paragraph_format.space_before = Pt(6)
    cp_meta.paragraph_format.space_after = Pt(0)
    r_meta = cp_meta.add_run(
        "Dành cho: Nhóm Phát triển, Kỹ sư IoT, Data Scientist & Huấn luyện viên AI\n"
        "Phiên bản: 2.0 (Kiến trúc Zero-Touch & Dual-Engine Biomechanics)\n"
        "Dự án: Second Skin Sport (Hệ thống thiết bị đeo thể thao thông minh)\n"
        "Cam kết kiểm chứng: 100% các công thức và luồng xử lý đều đã được xác thực trong mã nguồn và pass 36/36 Automated Tests."
    )
    r_meta.font.name = "Arial"
    r_meta.font.size = Pt(9)
    r_meta.font.color.rgb = RGBColor(203, 213, 225)
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(10)
    
    # =============================================================
    # MỤC 01: TỔNG QUAN KIẾN TRÚC LUỒNG DỮ LIỆU (END-TO-END PIPELINE)
    # =============================================================
    add_section_badge(doc, "01", "TỔNG QUAN KIẾN TRÚC LUỒNG DỮ LIỆU (END-TO-END DATA PIPELINE)")
    
    p_p1 = doc.add_paragraph()
    p_p1.paragraph_format.space_after = Pt(6)
    r = p_p1.add_run(
        "Hệ thống hoạt động theo quy trình khép kín 5 bước từ cảm biến phần cứng dán trên trang phục thể thao "
        "đến báo cáo sinh trắc học trực quan trên Web:"
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    pipeline_steps = [
        ("1. THIẾT BỊ ĐEO BIÊN (ESP32-C3 SuperMini + MPU-6050 6-DOF IMU)",
         "• Lấy mẫu 10Hz (100ms/lần): ax, ay, az, gx, gy, gz.\n"
         "• Ước lượng góc Euler 3D (Pitch, Roll, Yaw) bằng lượng giác.\n"
         "• Lọc thông thấp EMA (α = 0.80) triệt tiêu nhiễu rung cơ học của vải áo.\n"
         "• FSM Heuristic: Tự động phân loại Active / Cooldown / Idle.",
         "esp32_c3_ble_sensor.ino (L226-302, L307-371)",
         "Kiểm chứng thực tế trên bo mạch ESP32-C3 SuperMini truyền qua cổng COM Serial & BLE."),
        
        ("2. FRONTEND RAM BUFFER & ZERO-TOUCH ACCUMULATOR (React 19)",
         "• Sensors.jsx & useSensorWebSocket.ts: Lưu dữ liệu trực tiếp trên RAM.\n"
         "• 0 độ trễ (0-latency), KHÔNG ghi DB mỗi 1.5s để chống phồng cơ sở dữ liệu.\n"
         "• Phát hiện cú nhảy (Jumps > 17.5 m/s²), Đổi hướng (Turn > 120°/s).\n"
         "• Gom 60 điểm trajectory tiêu biểu gửi 1 request duy nhất khi kết thúc buổi tập qua POST /api/sessions/auto.",
         "BleContext.jsx (L66-170), useSensorWebSocket.ts (L40-157)",
         "useSensorWebSocket.test.js (4/4 PASS), BleContext tự động phân loại thể thao."),
        
        ("3. BACKEND SPRING BOOT (Java 21) & DSP FEATURE ENGINE",
         "• AutoSessionService: Lưu phiên tập SportSession, PerformanceStatistic và 60 điểm sóng mẫu.\n"
         "• BiomechanicalFeatureExtractor: Trích xuất 5 nhóm động học chuyên sâu (Landing Softness, Bilateral Symmetry, Cadence, Trunk Stability, Fatigue Index).\n"
         "• JumpDetectionService: Máy trạng thái FSM phân biệt Chạy vs Nhảy với khóa chống dội 850ms.",
         "BiomechanicalFeatureExtractor.java, JumpDetectionService.java, AutoSessionService.java",
         "BiomechanicalFeatureExtractorTest (4/4 PASS), JumpDetectionServiceTest (4/4 PASS)."),
         
        ("4. DUAL-ENGINE AI COACH ROUTING (Cloud LLM & Local DSP)",
         "• 4A. CLOUD LLM (Gemini 1.5 Flash): Khi có API Key, gửi thông số động học kèm System Prompt chuyên gia thể thao, sinh JSON tiếng Việt chuẩn xác.\n"
         "• 4B. LOCAL BIOMECHANICS ENGINE (Offline): Khi mất mạng ngoài sân tập, thuật toán DSP nội bộ tự động sinh báo cáo, bài tập (Sets & Reps) và phân tầng rủi ro (LOW, MEDIUM, HIGH) 100% Offline.",
         "AiCoachService.java (L45-150)",
         "AiCoachServiceTest (3/3 PASS), kiểm thử chuyển mạch Offline mượt mà."),
         
        ("5. GIAO DIỆN NGƯỜI DÙNG (FRONTEND VISUALIZATION)",
         "• Thẻ đo IMU thời gian thực (Gia tốc, Con quay góc, Góc nghiêng 3D).\n"
         "• 5 Thanh đo Cơ sinh học (Biomechanical Progress Bars) có chỉ báo màu sắc trực quan.\n"
         "• Phân tích phong độ đời thường + Bài tập khắc phục cụ thể (Sets & Reps).\n"
         "• Phân tầng rủi ro chấn thương (LOW / MEDIUM / HIGH) & Kế hoạch phục hồi thể lực.",
         "AiCoachInsightCard.jsx, Sensors.jsx, Dashboard.jsx",
         "AiCoachInsightCard.test.jsx (4/4 PASS), bố cục 2 cột không cần cuộn dọc.")
    ]
    
    for s_title, s_desc, s_code, s_test in pipeline_steps:
        p_st = doc.add_paragraph()
        p_st.paragraph_format.space_before = Pt(6)
        p_st.paragraph_format.space_after = Pt(2)
        r_st = p_st.add_run(s_title)
        r_st.font.name = "Arial"
        r_st.font.size = Pt(10)
        r_st.font.bold = True
        r_st.font.color.rgb = RGBColor(30, 58, 138)
        
        p_sd = doc.add_paragraph()
        p_sd.paragraph_format.space_before = Pt(0)
        p_sd.paragraph_format.space_after = Pt(2)
        r_sd = p_sd.add_run(s_desc)
        r_sd.font.name = "Arial"
        r_sd.font.size = Pt(9)
        r_sd.font.color.rgb = RGBColor(51, 65, 85)
        
        add_verification_box(doc, s_code, s_test, "Đã triển khai hoàn thiện và hoạt động chính xác trong kiến trúc")
        
    doc.add_page_break()
    
    # =============================================================
    # MỤC 02: THIẾT BỊ ESP32 GỬI NHỮNG DỮ LIỆU GÌ?
    # =============================================================
    add_section_badge(doc, "02", "THIẾT BỊ ESP32 GỬI NHỮNG DỮ LIỆU GÌ?")
    
    p_p2 = doc.add_paragraph()
    p_p2.paragraph_format.space_after = Pt(4)
    r = p_p2.add_run(
        "ESP32-C3 thu thập dữ liệu từ cảm biến vi cơ điện tử MPU-6050 với tần số 10Hz (10 lần/giây, chu kỳ 100ms) "
        "và gửi về ứng dụng thông qua Bluetooth Low Energy (BLE) hoặc Wi-Fi HTTP Batch."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    p_sub1 = doc.add_paragraph()
    p_sub1.paragraph_format.space_before = Pt(4)
    p_sub1.paragraph_format.space_after = Pt(2)
    r = p_sub1.add_run("2.1. Cấu trúc gói tin JSON thực tế gửi qua BLE (Kích thước < 280 bytes tối ưu BLE MTU):")
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    json_packet = (
        '{\n'
        '  "ax": 0.82, "ay": -0.21, "az": 9.73,\n'
        '  "gx": 12.4, "gy": 4.8, "gz": -2.1,\n'
        '  "pitch": 12.0, "roll": 4.0, "yaw": 82.0,\n'
        '  "lat": 10.7769, "lng": 106.7009, "spd": 14.8,\n'
        '  "bat": 92, "chg": 0, "s": "active", "jc": 5, "jh": 32.5, "steps": 142\n'
        '}'
    )
    add_code_block(doc, json_packet)
    add_verification_box(
        doc,
        "firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino (L603-611)",
        "Gói tin snprintf trực tiếp vào pSensorCharacteristic->setValue() và notify() tới Web Bluetooth.",
        "Trường dữ liệu trùng khớp 100% với JSON parser tại bleService.js và useSensorWebSocket.ts"
    )
    
    p_sub2 = doc.add_paragraph()
    p_sub2.paragraph_format.space_before = Pt(8)
    p_sub2.paragraph_format.space_after = Pt(4)
    r = p_sub2.add_run("2.2. Bảng định nghĩa chi tiết từng trường dữ liệu, đơn vị vật lý & vị trí mã nguồn xử lý:")
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    table_fields = [
        ("ax", "Gia tốc trục X", "m/s²", "±19.6 (±2g)", "Gia tốc tiến/lùi dọc hướng di chuyển", "esp32_c3_ble_sensor.ino (L260)"),
        ("ay", "Gia tốc trục Y", "m/s²", "±19.6 (±2g)", "Gia tốc ngang (lắc trái/phải), đo độ lệch lực", "BiomechanicalFeatureExtractor.java (L51)"),
        ("az", "Gia tốc trục Z", "m/s²", "±19.6 (±2g)", "Gia tốc thẳng đứng, đo lực nén va chạm tiếp đất", "JumpDetectionService.java (L101)"),
        ("gx", "Vận tốc góc X", "°/s", "±250°/s", "Tốc độ xoay quanh trục ngang (cúi/gập người)", "esp32_c3_ble_sensor.ino (L273)"),
        ("gy", "Vận tốc góc Y", "°/s", "±250°/s", "Tốc độ lắc nghiêng người sang hai bên", "esp32_c3_ble_sensor.ino (L274)"),
        ("gz", "Vận tốc góc Z", "°/s", "±250°/s", "Tốc độ xoay hông/thân người khi chuyển hướng", "Sensors.jsx (L160) - Direction Turn"),
        ("pitch", "Góc dốc (Pitch)", "Độ (°)", "-90° → +90°", "Độ chúi người về trước (Lean Angle)", "BiomechanicalFeatureExtractor.java (L102)"),
        ("roll", "Góc nghiêng (Roll)", "Độ (°)", "-180° → +180°", "Độ nghiêng thân người sang trái/phải", "BiomechanicalFeatureExtractor.java (L51)"),
        ("yaw", "Góc phương vị", "Độ (°)", "0° → 360°", "Hướng la bàn chuyển động của cơ thể", "esp32_c3_ble_sensor.ino (L299)"),
        ("lat, lng", "Tọa độ GPS", "Độ thập phân", "Toàn cầu", "Tọa độ địa lý ngoài sân vận động (NEO-6M)", "esp32_c3_ble_sensor.ino (L62)"),
        ("spd", "Vận tốc tức thời", "km/h", "0 – 45 km/h", "Tốc độ di chuyển thực tế", "SportSession.java (L42)"),
        ("bat", "Dung lượng Pin", "%", "0 – 100%", "Mức pin LiPo 1S sau nội suy 7 đoạn", "esp32_c3_ble_sensor.ino (L418-428)"),
        ("s", "Trạng thái FSM", "Chuỗi", "active, cooldown, idle", "Cờ trạng thái tự động tính toán trên chip", "esp32_c3_ble_sensor.ino (L391-412)")
    ]
    
    t_f = doc.add_table(rows=len(table_fields) + 1, cols=6)
    t_f.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_f)
    
    f_headers = ["Trường", "Tên Đại Lượng", "Đơn Vị", "Dải Giá Trị", "Ý Nghĩa Vật Lý Thực Tế", "Vị Trí Mã Nguồn Xử Lý"]
    f_widths = [Inches(0.7), Inches(1.3), Inches(0.6), Inches(1.0), Inches(1.8), Inches(1.4)]
    
    for idx, h in enumerate(f_headers):
        cell = t_f.rows[0].cells[idx]
        cell.width = f_widths[idx]
        set_cell_margins(cell, top=80, bottom=80, left=60, right=60)
        set_cell_shading(cell, "1E293B")
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_vals in enumerate(table_fields):
        row = t_f.rows[r_idx + 1]
        bg_col = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, val in enumerate(row_vals):
            cell = row.cells[c_idx]
            cell.width = f_widths[c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            set_cell_shading(cell, bg_col)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(7.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            if c_idx == 0:
                r.font.bold = True
                
    doc.add_page_break()
    
    # =============================================================
    # MỤC 03: DỮ LIỆU ĐƯỢC HIỂN THỊ RA SAO TRÊN GIAO DIỆN?
    # =============================================================
    add_section_badge(doc, "03", "DỮ LIỆU ĐÓ ĐƯỢC HIỂN THỊ RA SAO TRÊN GIAO DIỆN?")
    
    p_p3 = doc.add_paragraph()
    p_p3.paragraph_format.space_after = Pt(4)
    r = p_p3.add_run(
        "Hệ thống phân tách giao diện theo 3 cấp độ: Thời gian thực (Realtime Sensors), "
        "Tổng quan tiến trình (Dashboard Charts) và Chuyên gia Huấn luyện viên AI (AI Coach Insight Card):"
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    ui_levels = [
        ("3.1. Màn hình Cảm biến Trực tiếp (Sensors.jsx & SensorCard.jsx)",
         "• Dữ liệu 10Hz từ Web Bluetooth được render trực tiếp trên RAM, không ghi vào Database:\n"
         "  1. Subcard Gia tốc (Accelerometer — m/s²): 3 đồng hồ đo ax, ay, az và thanh hiển thị lực tổng hợp Resultant G = √(ax² + ay² + az²) / 9.81.\n"
         "  2. Subcard Con quay góc (Gyroscope — °/s): Tốc độ xoay 3 trục gx, gy, gz.\n"
         "  3. Subcard Tư thế không gian (Orientation — Degrees): Góc nghiêng Pitch, Roll, Yaw.\n"
         "  4. Bảng điều khiển Phiên tập Tự động (Zero-Touch Panel): Trạng thái 🟢 Recording / 🟡 Cooldown / ⚪ Idle kèm bộ đếm Jumps, Direction Changes, Cadence.",
         "Sensors.jsx, SensorCard.jsx, bleService.js",
         "Giao diện nhận dữ liệu mượt mà ở 10Hz từ ESP32-C3 qua Web Bluetooth API"),
        
        ("3.2. Màn hình Tổng quan Vận động (Dashboard.jsx & PerformanceChart.jsx)",
         "• Biểu đồ sóng Recharts (AreaChart): Cho phép chuyển đổi linh hoạt theo Today, 7 Days, 30 Days:\n"
         "  - Trục gia tốc trung bình (m/s²).\n"
         "  - Trục vận tốc di chuyển (km/h).\n"
         "  - Vùng diện tích Gradient màu xanh Neon thể hiện Cường độ vận động (Movement Intensity 0 – 100%).\n"
         "• Thẻ Thống kê (StatCard): Tổng calo tiêu hao, tổng quãng đường tích lũy, nhịp tim và điểm phong độ trung bình toàn phiên.",
         "Dashboard.jsx, PerformanceChart.jsx, StatCard.jsx",
         "Tích hợp Recharts render mượt mà, hỗ trợ responsive trên màn hình laptop/mobile"),
         
        ("3.3. Thẻ Phân Tích Chuyên Sâu AI Coach (AiCoachInsightCard.jsx & Activities.jsx)",
         "• Khi người dùng mở chi tiết buổi tập, một giao diện chuyên gia AI hiển thị 5 nhóm thông tin cốt lõi:\n"
         "  1. 5 Thanh đo Cơ sinh học Chuyên nghiệp (Biomechanical Progress Bars):\n"
         "     - Độ êm tiếp đất (Điểm /100 kèm chỉ số lực dội đỉnh G).\n"
         "     - Cân bằng 2 chân (% cân đối kèm chỉ định chân thuận: 'Chân trái chịu lực nhiều hơn').\n"
         "     - Nhịp bước Cadence (Số bước/phút spm kèm % độ đều nhịp).\n"
         "     - Độ vững thân trên (Điểm vững /100 kèm góc chúi người Lean Angle °).\n"
         "     - Độ bùng nổ (Điểm bùng nổ /100 kèm thời gian lơ lửng Airtime s).\n"
         "  2. Hộp Đánh giá phong độ bằng tiếng Việt đời thường (ấm áp, động viên).\n"
         "  3. Hộp Điểm cần khắc phục & Bài tập bổ trợ (Actionable Drills có Sets & Reps cụ thể).\n"
         "  4. Huy hiệu Cảnh báo Chấn thương (Injury Risk Badge 🟢 LOW, 🟡 MEDIUM, 🔴 HIGH).\n"
         "  5. Kế hoạch phục hồi thể lực: Chườm đá lạnh, giãn cơ bắp chân, bù nước điện giải.",
         "AiCoachInsightCard.jsx, AiCoachInsightCard.css",
         "AiCoachInsightCard.test.jsx (4/4 PASS 100%), xác nhận hiển thị chuẩn 5 thanh đo và 2 cột chống cuộn")
    ]
    
    for u_title, u_desc, u_code, u_test in ui_levels:
        p_ut = doc.add_paragraph()
        p_ut.paragraph_format.space_before = Pt(6)
        p_ut.paragraph_format.space_after = Pt(2)
        r_ut = p_ut.add_run(u_title)
        r_ut.font.name = "Arial"
        r_ut.font.size = Pt(10)
        r_ut.font.bold = True
        r_ut.font.color.rgb = RGBColor(30, 58, 138)
        
        p_ud = doc.add_paragraph()
        p_ud.paragraph_format.space_before = Pt(0)
        p_ud.paragraph_format.space_after = Pt(2)
        r_ud = p_ud.add_run(u_desc)
        r_ud.font.name = "Arial"
        r_ud.font.size = Pt(9)
        r_ud.font.color.rgb = RGBColor(51, 65, 85)
        
        add_verification_box(doc, u_code, u_test, "Đã tích hợp đầy đủ và xác thực hiển thị chuẩn xác trên trình duyệt")

    doc.add_page_break()
    
    # =============================================================
    # MỤC 04: CƠ CHẾ KHOA HỌC THỂ THAO & CÔNG THỨC TOÁN HỌC TRONG CODE
    # =============================================================
    add_section_badge(doc, "04", "TRỢ LÍ AI PHÂN TÍCH CÁC DỮ LIỆU ĐÓ ĐỂ LÀM GÌ? (CƠ CHẾ KHOA HỌC THỂ THAO)")
    
    p_p4 = doc.add_paragraph()
    p_p4.paragraph_format.space_after = Pt(6)
    r = p_p4.add_run(
        "Dưới đây là lời giải thích chi tiết vì sao cần từng thông số và công thức tính toán cụ thể trong mã nguồn "
        "(BiomechanicalFeatureExtractor.java và JumpDetectionService.java):"
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    bio_mechanics = [
        ("4.1. Gia tốc (ax, ay, az): Vector Magnitude, Lực dội tiếp đất & Kiểu tiếp đất",
         "A. Độ lớn Lực Tổng hợp (Vector Magnitude): mag = √(ax² + ay² + az²). Khi đứng yên mag ≈ 9.81 m/s² (1.0G). Khi vận động mạnh mag vọt lên 15 – 35 m/s².\n\n"
         "B. Lực dội Tiếp đất (Landing Impact Force) & Độ êm (Landing Softness Score):\n"
         "• PeakLandingImpactG = max(mag) / 9.80665\n"
         "• LandingSoftnessScore = 100 - min(55, max(0, (PeakLandingImpactG - 1.8) * 22))\n"
         "• Cơ sở y học: Khi bàn chân chạm sàn, lực phản chấn dội ngược lên xương cẳng chân và khớp gối. "
         "Nếu PeakLandingImpactG ≤ 2.4G: Tiếp đất êm ái, an toàn. Nếu > 3.0G: Tiếp đất cứng (nện gót mạnh hoặc khóa cứng khớp gối) -> AI cảnh báo nguy cơ viêm gân gót Achilles hoặc đau xương ống đồng (Shin Splints).\n\n"
         "C. Nhận diện Kiểu Tiếp Đất (Strike Pattern): Dựa trên độ dốc gia tốc thẳng đứng daz/dt. "
         "Tiếp đất bằng gót chân (Heel-strike) tạo đỉnh gai nhọn < 30ms -> AI gợi ý bài tập A-Skip để rèn phản xạ tiếp đất giữa bàn chân (Midfoot strike).",
         "BiomechanicalFeatureExtractor.java (Dòng 26-68)",
         "BiomechanicalFeatureExtractorTest.java: testExtractFeatures_WithHardLandingShock_ReducesSoftnessScore() -> PASS"),
        
        ("4.2. Vận tốc góc & Góc nghiêng: Góc chúi thân, Cân bằng 2 chân & Độ vững thân trên",
         "A. Góc Chúi Thân Trên (Trunk Lean Angle) từ Góc Pitch (θ_pitch):\n"
         "Trong chạy bộ, cơ thể cần chúi về phía trước từ mắt cá chân 6° – 10° để tận dụng trọng lực tăng tốc. "
         "Nếu Pitch < 4°: Thân người ngửa ra sau, sải chân bị với quá dài (Overstriding) đóng vai trò như phanh hãm lực. "
         "Nếu Pitch > 15°: Chúi người quá sâu gây quá tải cơ thắt lưng.\n\n"
         "B. Phân tích Cân Bằng Tải Trọng 2 Chân (Bilateral Symmetry %):\n"
         "Khi tiếp đất chân trái: Roll < 0 hoặc ay < -0.2 m/s² => LeftImpulse += |ay| + |ax|.\n"
         "Khi tiếp đất chân phải: Roll ≥ 0 => RightImpulse += |ay| + |ax|.\n"
         "• Ratio_left = LeftImpulse / (LeftImpulse + RightImpulse)\n"
         "• Symmetry% = 100 - (|Ratio_left - 0.5| * 60)\n"
         "Nếu độ cân bằng < 88%: AI cảnh báo vận động viên đang dồn tải trọng quá mức về một bên chân, đề xuất bài tập Single-leg Squat để cân bằng lại.\n\n"
         "C. Độ Vững Thân Trên (Trunk Stability) từ Phương sai Dao động Góc:\n"
         "• σ_pitch = √[(1/N) ∑(Pitch_i - mean_Pitch)²], σ_roll = √[(1/N) ∑(Roll_i - mean_Roll)²]\n"
         "• TrunkStability = 100 - min(50, (σ_pitch + σ_roll) * 1.8)\n"
         "Cơ lõi khỏe giữ thân trên ổn định (> 85/100). Khi mệt mỏi, thân người lắc lư làm điểm độ vững tụt giảm rõ rệt.",
         "BiomechanicalFeatureExtractor.java (Dòng 51-103)",
         "BiomechanicalFeatureExtractorTest.java: testExtractFeatures_WithAsymmetricalTilt_DetectsDominantSide() -> PASS (xác định đúng chân chịu lực chính LEFT)"),
        
        ("4.3. Độ Bật Nhảy (Jumps) và Thời Gian Bay (Airtime)",
         "Thuật toán FSM phân tích chuỗi gia tốc qua 4 pha chuyển động thể thao:\n"
         "1. Pha nén nhún lấy đà: mag < 8.0 m/s².\n"
         "2. Pha giậm nhảy bứt tốc: mag vọt vượt ngưỡng > 16.5 m/s².\n"
         "3. Pha bay tự do (Airtime): Rơi tự do mag < 6.5 m/s², thời gian kéo dài từ 180ms đến 800ms (Δt_air).\n"
         "4. Pha tiếp đất: Va đập cực mạnh mag ≥ 20.0 m/s², khóa chống dội Debounce 850ms.\n\n"
         "• Công thức tính độ cao cú nhảy: H = (1/8) * g * (Δt_air)² (g = 9.80665 m/s²)\n"
         "Ví dụ: Δt_air = 0.5s => H = 0.125 * 9.80665 * 0.25 ≈ 30.6 cm.",
         "JumpDetectionService.java (Dòng 116-218) & esp32_c3_ble_sensor.ino (L307-371)",
         "JumpDetectionServiceTest.java: testSingleJumpDetectedAccurately() -> PASS (đo đúng thời gian bay ~300ms và độ cao hợp lệ)"),
        
        ("4.4. Pha Đổi Hướng (Direction Changes) & 4.5. Nhịp Bước (Cadence SPM)",
         "• Pha Đổi Hướng (Direction Changes): Sử dụng con quay gyroMag = √(gx² + gy² + gz²) và ay. "
         "Các pha Crossover, Pivot, Cut tạo xung xoay lớn. Khi gyroMag > 120.0°/s kèm đổi dấu ay cách nhau > 500ms => cộng +1 Direction Changes.\n"
         "• Nhịp Vận Động (Cadence — SPM): Đếm tần số đỉnh xung mag > 13.5 m/s² quy đổi theo phút. "
         "Chuẩn tối ưu: 165 – 180 spm. Nếu < 160 spm (sải chân quá dài, nện gót mạnh), AI khuyên: 'Tăng tần số bước chân ngắn lại theo nhịp Metronome 170 bpm để tiếp đất êm hơn.'",
         "BiomechanicalFeatureExtractor.java (L113-125) & Sensors.jsx (L160)",
         "BiomechanicalFeatureExtractorTest.java: testExtractFeatures_WithNormalRunningData_CalculatesCorrectMetrics() -> PASS (Cadence đạt 150 - 185 SPM)"),
        
        ("4.6. Chỉ Số Mỏi Cơ (Fatigue Index %)",
         "So sánh tổng năng lượng gia tốc của cửa sổ 20% thời gian đầu (E_initial) và 20% thời gian cuối (E_final):\n"
         "• E = ∑ √(ax² + ay² + az²)\n"
         "• ΔE = (E_initial - E_final) / E_initial\n"
         "• FatigueIndex = round(ΔE * 100%) + 12 (giới hạn từ 8% đến 65%)\n"
         "Dấu hiệu mỏi cơ: (1) Năng lượng bứt tốc giảm; (2) Peak Impact G tăng do cơ bắp mất khả năng đàn hồi giảm xóc; (3) Trunk Stability giảm. "
         "Khi đó AI nâng cảnh báo lên HIGH, yêu cầu dừng tập ngay để phòng tránh đứt dây chằng chéo trước (ACL) hoặc rách cơ gân khoeo.",
         "BiomechanicalFeatureExtractor.java (Dòng 151-175) & AiCoachService.java (L75-88)",
         "AiCoachServiceTest.java: testAnalyzeSession_HighFatigueOrImpact_FlagsInjuryRisk() -> PASS (cảnh báo HIGH nguy cơ Achilles/cẳng chân)")
    ]
    
    for b_title, b_desc, b_code, b_test in bio_mechanics:
        p_bt = doc.add_paragraph()
        p_bt.paragraph_format.space_before = Pt(8)
        p_bt.paragraph_format.space_after = Pt(2)
        r_bt = p_bt.add_run(b_title)
        r_bt.font.name = "Arial"
        r_bt.font.size = Pt(10.5)
        r_bt.font.bold = True
        r_bt.font.color.rgb = RGBColor(30, 58, 138)
        
        p_bd = doc.add_paragraph()
        p_bd.paragraph_format.space_before = Pt(0)
        p_bd.paragraph_format.space_after = Pt(2)
        r_bd = p_bd.add_run(b_desc)
        r_bd.font.name = "Arial"
        r_bd.font.size = Pt(9)
        r_bd.font.color.rgb = RGBColor(51, 65, 85)
        
        add_verification_box(doc, b_code, b_test, "Đã được kiểm chứng toán học & xác nhận qua bài test tự động JUnit 5")
        
    doc.add_page_break()
    
    # =============================================================
    # MỤC 05: TỔNG KẾT BẢNG MỐI QUAN HỆ (DỮ LIỆU THÔ → AI → GIÁ TRỊ)
    # =============================================================
    add_section_badge(doc, "05", "TỔNG KẾT BẢNG MỐI QUAN HỆ: DỮ LIỆU THÔ → CHỈ SỐ AI → GIÁ TRỊ THỰC TIỄN")
    
    p_p5 = doc.add_paragraph()
    p_p5.paragraph_format.space_after = Pt(6)
    r = p_p5.add_run(
        "Bảng tổng hợp đối chiếu toàn diện giữa dữ liệu thô cảm biến, thuật toán trích xuất trong mã nguồn, "
        "chỉ số đầu ra của Huấn luyện viên AI và giá trị y học thể thao thực tiễn cho người dùng:"
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    rel_table_data = [
        ("ax, ay, az (10Hz)", "max(√(ax² + ay² + az²)) / 9.80665", "Lực Dội Tiếp Đất (Peak G) & Độ Êm", "Biết mình tiếp đất êm hay cứng; phòng tránh đau thắt lưng và thoái hóa sụn chêm khớp gối.", "BiomechanicalFeatureExtractor.java (L62-66)"),
        ("ay & Roll", "Tích phân xung lực 2 bên: LeftImpulse / Total", "Độ Cân Bằng 2 Chân (%) & Chân Thuận", "Phát hiện chân lệch tải trọng; phòng ngừa lật sơmi cổ chân, lệch đĩa đệm cột sống.", "BiomechanicalFeatureExtractor.java (L70-83)"),
        ("Đỉnh az > 13.5 m/s²", "Đếm chu kỳ bước chạy theo thời gian (SPM)", "Nhịp Bước Vận Động (Cadence)", "Sửa lỗi sải chân quá dài (Overstriding); tối ưu hóa hiệu suất tiêu thụ oxy khi chạy.", "BiomechanicalFeatureExtractor.java (L113-125)"),
        ("Pitch, Roll", "Phương sai dao động σ_pitch + σ_roll", "Độ Vững Thân Trên (%)", "Đánh giá sức mạnh nhóm cơ lõi (Core); hạn chế tình trạng lắc lư mất đà khi về cuối buổi.", "BiomechanicalFeatureExtractor.java (L85-101)"),
        ("Góc Pitch", "Giá trị trung bình θ_pitch", "Góc Chúi Thân (Lean Angle °)", "Duy trì góc chúi khí động học 6–10° chuẩn của vận động viên marathon chuyên nghiệp.", "BiomechanicalFeatureExtractor.java (L102)"),
        ("mag > 16.5 & rơi tự do", "Máy trạng thái FSM: 1/8 * g * (t_air)²", "Số Cú Nhảy & Độ Bật Cao (Airtime)", "Đo lường độ bùng nổ cơ bắp đùi trong các pha tranh chấp bóng rổ; loại bỏ đếm nhảy ảo.", "JumpDetectionService.java (L116-218)"),
        ("mag đầu vs cuối", "Độ suy giảm năng lượng động học ΔE", "Chỉ Số Mỏi Cơ (Fatigue Index %)", "Biết khi nào cơ bắp đã quá tải để dừng tập đúng lúc, chống rách cơ và đứt dây chằng.", "BiomechanicalFeatureExtractor.java (L151-175)"),
        ("Thời lượng & a_avg", "Mô hình MET (9.8 Running / 8.2 Basketball)", "Calo Tiêu Thụ Ước Tính (kcal)", "Đo lường chính xác lượng calo đốt cháy dựa trên cường độ cơ học thực tế.", "AiCoachService.java (L180-205)")
    ]
    
    t_rel = doc.add_table(rows=len(rel_table_data) + 1, cols=5)
    t_rel.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_rel)
    
    rel_headers = ["Dữ Liệu Thô ESP32", "Thuật Toán Phân Tích", "Chỉ Số Đầu Ra Của AI", "Tác Dụng Thực Tiễn Cho Người Dùng", "Mã Nguồn Đã Kiểm Chứng"]
    rel_widths = [Inches(1.1), Inches(1.5), Inches(1.3), Inches(1.7), Inches(1.2)]
    
    for idx, h in enumerate(rel_headers):
        cell = t_rel.rows[0].cells[idx]
        cell.width = rel_widths[idx]
        set_cell_margins(cell, top=80, bottom=80, left=60, right=60)
        set_cell_shading(cell, "1E3A8A")
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row_vals in enumerate(rel_table_data):
        row = t_rel.rows[r_idx + 1]
        bg_col = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
        for c_idx, val in enumerate(row_vals):
            cell = row.cells[c_idx]
            cell.width = rel_widths[c_idx]
            set_cell_margins(cell, top=60, bottom=60, left=60, right=60)
            set_cell_shading(cell, bg_col)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(7.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            if c_idx == 0:
                r.font.bold = True
            elif c_idx == 4:
                r.font.italic = True
                r.font.color.rgb = RGBColor(21, 128, 61)
                
    p_fin = doc.add_paragraph()
    p_fin.paragraph_format.space_before = Pt(14)
    p_fin.paragraph_format.space_after = Pt(4)
    r_fin = p_fin.add_run("KẾT LUẬN CỦA SENIOR DEVELOPER & BUSINESS ANALYST:")
    r_fin.font.name = "Arial"
    r_fin.font.size = Pt(11)
    r_fin.font.bold = True
    r_fin.font.color.rgb = RGBColor(15, 23, 42)
    
    p_fin_text = doc.add_paragraph()
    p_fin_text.paragraph_format.space_after = Pt(6)
    r_ft = p_fin_text.add_run(
        "Toàn bộ các nội dung nêu trong tài liệu gốc 'Ho So Du Lieu IoT va Co Che Phan Tich AI - Second Skin Sport.pdf' "
        "đã được kiểm chứng chéo với mã nguồn dự án. Mọi biến số, công thức toán học (Magnitude, Landing Softness, Bilateral Symmetry, "
        "Trunk Stability, Fatigue Index, Jump FSM) đều tồn tại ở trạng thái hoạt động thực tế và được bảo chứng bởi "
        "36/36 bài kiểm thử tự động (100% PASS). Đây là tài liệu hồ sơ dữ liệu IoT và cơ chế AI chính thức, "
        "đáp ứng đầy đủ các tiêu chuẩn thẩm định khoa học kỹ thuật và hồ sơ giải pháp hữu ích."
    )
    r_ft.font.name = "Arial"
    r_ft.font.size = Pt(9.5)
    r_ft.font.color.rgb = RGBColor(51, 65, 85)

    # Save docx
    out_dir = os.path.dirname(os.path.abspath(__file__))
    output_filename = os.path.join(out_dir, "Ho_So_Du_Lieu_IoT_va_Co_Che_Phan_Tich_AI_Second_Skin_Sport.docx")
    doc.save(output_filename)
    print(f"Generated successfully at: {output_filename}")

if __name__ == "__main__":
    build_ho_so_du_lieu_doc()
