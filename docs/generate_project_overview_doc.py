# -*- coding: utf-8 -*-
"""
Script to generate the Professional Project Overview Document (BA Style)
for Second Skin Sport in Microsoft Word (.docx) format.
Target: Boardroom, Stakeholders, Investors, University Mentors (EXE101).
"""

import os
import docx
from docx.shared import Mm, Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for a table cell in dxa (1 pt = 20 dxa)"""
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

def set_cell_border_left_only(cell, color_hex="1E3A8A", sz="36"):
    """Set a thick border on the left and none on other sides (for Callout box)"""
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
    """Set clean subtle borders for standard tables"""
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="{color_hex}"/>
        <w:left w:val="none"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{color_hex}"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color_hex}"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def add_page_number(run):
    """Insert dynamic page number field in Word"""
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def build_document():
    doc = docx.Document()

    # Page Setup: A4, 20mm margins
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(20)
    section.right_margin = Mm(20)

    # Header & Footer
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun = hp.add_run("SECOND SKIN SPORT — TÀI LIỆU TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)")
    hrun.font.name = 'Times New Roman'
    hrun.font.size = Pt(8.5)
    hrun.font.color.rgb = RGBColor(148, 163, 184) # Slate-400

    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    frun_left = fp.add_run("Bảo mật & Nội bộ | Second Skin Sport Team       Trang ")
    frun_left.font.name = 'Times New Roman'
    frun_left.font.size = Pt(9)
    frun_left.font.color.rgb = RGBColor(100, 116, 139)
    frun_page = fp.add_run()
    frun_page.font.name = 'Times New Roman'
    frun_page.font.size = Pt(9)
    frun_page.bold = True
    frun_page.font.color.rgb = RGBColor(30, 58, 138)
    add_page_number(frun_page)

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = RGBColor(30, 41, 59) # Slate-800
    normal_style.paragraph_format.line_spacing = 1.3
    normal_style.paragraph_format.space_after = Pt(4)

    # Color definitions
    COLOR_PRIMARY = RGBColor(30, 58, 138)    # Deep Navy Blue (#1E3A8A)
    COLOR_SECONDARY = RGBColor(13, 148, 136) # Teal (#0D9488)
    COLOR_DARK = RGBColor(15, 23, 42)        # Slate-900 (#0F172A)
    COLOR_MUTED = RGBColor(100, 116, 139)    # Slate-500 (#64748B)

    # Helper text formatting functions
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(22)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(text)
        run.italic = True
        run.font.size = Pt(13)
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_meta_info(data_dict):
        table = doc.add_table(rows=len(data_dict), cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, "E2E8F0")
        col_widths = [Mm(45), Mm(125)]
        for i, (k, v) in enumerate(data_dict.items()):
            row = table.rows[i]
            cell_k = row.cells[0]
            cell_v = row.cells[1]
            cell_k.width = col_widths[0]
            cell_v.width = col_widths[1]
            set_cell_margins(cell_k, top=60, bottom=60, left=100, right=100)
            set_cell_margins(cell_v, top=60, bottom=60, left=100, right=100)
            set_cell_shading(cell_k, "F8FAFC")
            
            pk = cell_k.paragraphs[0]
            pk.paragraph_format.space_after = Pt(0)
            rk = pk.add_run(k)
            rk.bold = True
            rk.font.size = Pt(10)
            rk.font.color.rgb = COLOR_DARK

            pv = cell_v.paragraphs[0]
            pv.paragraph_format.space_after = Pt(0)
            rv = pv.add_run(v)
            rv.font.size = Pt(10)
            rv.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(15)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(13)
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_p(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_after = Pt(5)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.color.rgb = COLOR_PRIMARY
        r = p.add_run(text)
        r.italic = italic
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_callout(text, title="ĐIỂM NHẤN CHIẾN LƯỢC TỪ SENIOR BA", color_hex="1E3A8A", bg_hex="EFF6FF"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Mm(170)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=140)
        set_cell_shading(cell, bg_hex)
        set_cell_border_left_only(cell, color_hex, sz="36")
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(4)
        run_t = p.add_run(f"📌 {title}\n")
        run_t.bold = True
        run_t.font.size = Pt(10.5)
        run_t.font.color.rgb = RGBColor(30, 58, 138)
        
        run_b = p.add_run(text)
        run_b.font.size = Pt(10.5)
        run_b.font.color.rgb = RGBColor(15, 23, 42)
        run_b.italic = True
        
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_custom_table(headers, rows_data, col_widths_mm=None):
        tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, "CBD5E1")
        
        # Header Row
        hdr_row = tbl.rows[0]
        tblPr = tbl._tbl.tblPr
        tblHeader = parse_xml(f'<w:tblHeader {nsdecls("w")}/>')
        hdr_row._tr.get_or_add_trPr().append(tblHeader)
        
        for idx, title in enumerate(headers):
            c = hdr_row.cells[idx]
            if col_widths_mm:
                c.width = Mm(col_widths_mm[idx])
            set_cell_margins(c, top=120, bottom=120, left=100, right=100)
            set_cell_shading(c, "1E3A8A") # Dark Navy
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(title)
            r.bold = True
            r.font.size = Pt(10)
            r.font.color.rgb = RGBColor(255, 255, 255)
            
        # Data Rows
        for r_idx, row_values in enumerate(rows_data):
            row = tbl.rows[r_idx + 1]
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                c = row.cells[c_idx]
                if col_widths_mm:
                    c.width = Mm(col_widths_mm[c_idx])
                set_cell_margins(c, top=80, bottom=80, left=100, right=100)
                set_cell_shading(c, bg_color)
                p = c.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.2
                if c_idx == 0:
                    r = p.add_run(val)
                    r.bold = True
                    r.font.size = Pt(9.5)
                else:
                    r = p.add_run(val)
                    r.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    def add_image_figure(path, caption, width_mm=150):
        if os.path.exists(path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(10)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.paragraph_format.keep_with_next = True
            r = p_img.add_run()
            r.add_picture(path, width=Mm(width_mm))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(12)
            rcap = p_cap.add_run(caption)
            rcap.bold = True
            rcap.italic = True
            rcap.font.size = Pt(10)
            rcap.font.color.rgb = COLOR_MUTED

    # ==========================================
    # DOCUMENT CONTENT GENERATION
    # ==========================================

    add_title("TỔNG QUAN DỰ ÁN: SECOND SKIN SPORT")
    add_subtitle("Hệ thống Thiết bị đeo Thông minh Giám sát Cơ sinh học & Trợ lý Huấn luyện AI Song hành")

    # Document Metadata Block
    meta = {
        "Tên Dự Án:": "SECOND SKIN SPORT (Smart Wearable Biomechanical Monitoring Platform)",
        "Mã Dự Án / Môn:": "EXE101 — Dự Án Khởi Nghiệp Đổi Mới Sáng Tạo (Đại Học FPT)",
        "Vai Trò Tài Liệu:": "Tài Liệu Tổng Quan Dự Án & Hồ Sơ Yêu Cầu Nghiệp Vụ (Project Overview & Business Requirements Document - POD/BRD)",
        "Tác Giả & Phê Duyệt:": "Senior Business Analyst Lead & Nhóm Phát Triển Second Skin Sport",
        "Phiên Bản & Trạng Thái:": "Phiên bản 2.0 — Chính thức (Production & Patent Aligned)",
        "Đối Tượng Tiếp Nhận:": "Ban Giám Khảo EXE101, Nhà Đầu Tư, Huấn Luyện Viên Thể Thao, Đội Ngũ Kỹ Thuật"
    }
    add_meta_info(meta)

    add_callout(
        "Tài liệu này được thiết lập dưới góc nhìn của một Senior Business Analyst (BA Lead), tổng hợp toàn diện từ "
        "bài toán kinh doanh, chân dung khách hàng mục tiêu, phân tích khoảng trống thị trường (Market Gap), "
        "kiến trúc giải pháp công nghệ (Edge IoT + Dual-Engine AI + RBAC Dashboard) đến mô hình tạo doanh thu khả thi "
        "và lộ trình triển khai chi tiết cho dự án Second Skin Sport.",
        title="LỜI NÓI ĐẦU TỪ SENIOR BUSINESS ANALYST"
    )

    # -------------------------------------------------------------
    # CHƯƠNG 1: TỔNG QUAN DỰ ÁN & TÓM TẮT ĐIỀU HÀNH
    # -------------------------------------------------------------
    add_h1("1. TỔNG QUAN DỰ ÁN & TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)")
    
    add_p(
        "Second Skin Sport là giải pháp công nghệ thể thao tiên phong (SportsTech) kết hợp giữa thiết bị phần cứng "
        "đo lường quán tính 6 bậc tự do (6-DOF IMU) gắn trực tiếp trên trang phục tại các vị trí phân đoạn vận động then chốt "
        "(vùng bắp đùi hoặc vùng vai) với hệ thống xử lý tín hiệu số cơ sinh học cục bộ (Local DSP) và trí tuệ nhân tạo thế hệ mới (Cloud Sports LLM). "
        "Mục tiêu cốt lõi của dự án là biến dữ liệu chuyển động thô thành những chỉ dẫn khoa học dễ hiểu, giúp người tập luyện thể thao "
        "từ phong trào đến chuyên nghiệp phòng ngừa chấn thương cơ xương khớp, tối ưu hóa kỹ thuật động tác và hỗ trợ huấn luyện viên "
        "quản trị đội nhóm tập trung theo thời gian thực."
    )

    add_h2("1.1. Sứ Mệnh & Tầm Nhìn Chiến Lược")
    add_bullet("Dân chủ hóa khoa học thể thao đỉnh cao (Democratizing Sports Science): Mang các công nghệ phân tích cơ sinh học trước đây vốn chỉ có trong các phòng Lab đắt đỏ đến với mọi vận động viên, người yêu thể thao và các đội thể thao học đường/phong trào với chi phí hợp lý.", "Sứ mệnh (Mission): ")
    add_bullet("Trở thành nền tảng dữ liệu cơ sinh học và huấn luyện thể thao thông minh hàng đầu tại Việt Nam và Đông Nam Á, tạo lập chuẩn mực mới về trang phục thể thao thông minh 'Second Skin' — lớp da thứ hai thấu hiểu từng chuyển động của cơ thể.", "Tầm nhìn (Vision): ")

    add_h2("1.2. Tuyên Ngôn Giá Trị Cốt Lõi (Core Value Propositions)")
    add_bullet("Phòng ngừa chấn thương trước khi xảy ra (Proactive Injury Prevention): Cảnh báo sớm hiện tượng tiếp đất quá cứng, lệch tải trọng hai chân và suy giảm động năng do mỏi cơ — những nguyên nhân hàng đầu dẫn đến rách dây chằng chéo (ACL), viêm gân bánh chè và chấn thương cột sống.", "1. An toàn vượt trội: ")
    add_bullet("Trợ lý Huấn luyện viên AI 24/7 (Actionable AI Coaching): Không dừng lại ở các con số thống kê khô khan, AI tự động dịch thuật dữ liệu sang ngôn ngữ tự nhiên và đề xuất ngay chuỗi bài tập khắc phục (Corrective Drills) có số hiệp và số lần (Sets & Reps) chuẩn xác.", "2. Tối ưu hiệu suất: ")
    add_bullet("Bảng điều khiển Huấn luyện viên chuyên nghiệp (Team Overload Grid): Cho phép một huấn luyện viên giám sát cùng lúc hàng chục vận động viên trên sân, phát hiện ngay cầu thủ đang quá tải hoặc lệch trục để ra quyết định thay người hay điều chỉnh giáo án kịp thời.", "3. Quản trị chuyên nghiệp: ")
    add_bullet("Vận hành bền bỉ 100% Offline (Dual-Engine Resilience): Cơ chế AI song hành bảo đảm toàn bộ thuật toán đánh giá rủi ro và trích xuất chỉ số vận hành trơn tru ngay cả khi thi đấu ở các sân bãi ngoài trời không có kết nối Internet.", "4. Độ tin cậy thực chiến: ")

    # -------------------------------------------------------------
    # CHƯƠNG 2: BÀI TOÁN THỊ TRƯỜNG & KHOẢNG TRỐNG GIẢI PHÁP
    # -------------------------------------------------------------
    add_h1("2. BÀI TOÁN THỊ TRƯỜNG & PHÂN TÍCH KHOẢNG TRỐNG (PROBLEM STATEMENT & MARKET GAP)")

    add_p(
        "Trong bối cảnh phong trào rèn luyện thể thao (đặc biệt là chạy bộ marathon, bóng rổ, bóng đá) bùng nổ mạnh mẽ tại Việt Nam, "
        "tỷ lệ người tập gặp chấn thương do sai tư thế hoặc quá tải đang ở mức báo động (> 65% người chạy bộ từng gặp chấn thương chi dưới mỗi năm). "
        "Tuy nhiên, các công cụ hỗ trợ hiện nay trên thị trường đều bộc lộ những khoảng trống kỹ thuật và trải nghiệm vô cùng lớn."
    )

    add_h2("2.1. Bốn Nỗi Đau Lớn Của Người Dùng & Huấn Luyện Viên")
    add_bullet("Người tập chạy bộ tiếp đất bằng gót chân quá mạnh (Heel Strike), khóa cứng khớp gối khi tiếp đất bật nhảy trong bóng rổ, hoặc dồn tải trọng lệch sang một bên chân do thói quen mà không hề hay biết cho đến khi phát sinh cơn đau mãn tính.", "Nỗi đau 1 — Chấn thương âm thầm do sai cơ sinh học: ")
    add_bullet("Đồng hồ thông minh chỉ đo được nhịp tim, quãng đường, tốc độ và số bước chân. Dữ liệu này không trả lời được câu hỏi cốt tử: 'Tôi chạy có đúng dáng không?', 'Khớp gối của tôi có đang gánh lực quá tải không?'.", "Nỗi đau 2 — Thiết bị đeo hiện hữu 'mù' về động học cơ thể: ")
    add_bullet("Các hệ thống đo lực sàn (Force Plate) và camera quang học 3D (Vicon, Qualisys) có giá từ vài trăm triệu đến hàng tỷ đồng, cồng kềnh, chỉ thực hiện trong phòng thí nghiệm khép kín, hoàn toàn bất khả thi cho các buổi tập ngoài sân cỏ hay đường chạy.", "Nỗi đau 3 — Hệ thống phân tích chuyên sâu quá đắt đỏ và xa vời: ")
    add_bullet("Huấn luyện viên tại các trường học, câu lạc bộ bán chuyên phải quan sát bằng mắt thường. Khi quản lý một đội 10–20 người, huấn luyện viên không thể bao quát được cầu thủ nào đang xuống sức, cầu thủ nào có nguy cơ chấn thương để hạ tải bài tập.", "Nỗi đau 4 — Huấn luyện viên thiếu công cụ giám sát tập trung: ")

    add_h2("2.2. Ma Trận So Sánh Đối Thủ Cạnh Tranh (Competitive Landscape)")
    
    comp_headers = ["Tiêu Chí So Sánh", "Đồng Hồ Thông Minh (Smartwatch)", "Cảm Biến Gắn Giày (Foot Pod)", "Phòng Lab Quang Học (MoCap)", "SECOND SKIN SPORT"]
    comp_data = [
        ["Vị trí gắn thiết bị", "Cổ tay (Wrist)", "Mũi giày / Dây giày", "Dán phản quang toàn thân", "Bắp đùi hoặc Đai vai"],
        ["Độ tin cậy trục tải trọng", "Rất thấp (Biên độ vung tay tự do)", "Trung bình (Chỉ cục bộ bàn chân)", "Rất cao (Phòng thí nghiệm)", "Rất cao (Trực tiếp trên trục tải)"],
        ["Độ êm tiếp đất (Landing G)", "Không hỗ trợ", "Ước lượng tiếp đất", "Đo lực GRF bàn chân", "Đo trực tiếp gia tốc va chạm (Proxy)"],
        ["Cân bằng 2 chân & Thân trên", "Không hỗ trợ", "Hỗ trợ nếu mua 2 pods", "Hỗ trợ đầy đủ", "Ước lượng xu hướng / Dual mode"],
        ["Khả năng ra sân thực tế", "Tuyệt vời (Gọn nhẹ)", "Tốt", "Không thể (Chỉ trong Lab)", "Tuyệt vời (Trang phục thể thao)"],
        ["Trợ lý AI đề xuất bài tập", "Không (Chỉ có đồ thị tĩnh)", "Gợi ý cơ bản", "Bác sĩ đọc kết quả", "AI đề xuất Sets & Reps cụ thể"],
        ["Giám sát toàn đội (Coach)", "Không hỗ trợ", "Không hỗ trợ", "Không hỗ trợ", "Coach Dashboard thời gian thực"],
        ["Chi phí ước tính", "3.000.000 - 15.000.000 VNĐ", "2.500.000 - 5.000.000 VNĐ", "> 500.000.000 VNĐ", "500.000 - 1.200.000 VNĐ"]
    ]
    add_custom_table(comp_headers, comp_data, [Mm(30), Mm(35), Mm(35), Mm(35), Mm(35)])

    add_callout(
        "Khoảng trống thị trường vàng: Một thiết bị có chi phí tiếp cận bình dân như thiết bị đeo cá nhân, "
        "nhưng cung cấp năng lực phân tích cơ sinh học tiệm cận thiết bị Lab chuyên nghiệp, "
        "đồng thời tích hợp nền tảng quản trị đội nhóm tập trung cho Huấn luyện viên. Đó chính là định vị độc tôn của Second Skin Sport.",
        title="NHẬN ĐỊNH CỦA BA VỀ THỊ TRƯỜNG"
    )

    # -------------------------------------------------------------
    # CHƯƠNG 3: CHÂN DUNG NGƯỜI DÙNG & PHÂN KHÚC MỤC TIÊU
    # -------------------------------------------------------------
    add_h1("3. CHÂN DUNG NGƯỜI DÙNG & PHÂN KHÚC MỤC TIÊU (USER PERSONAS)")

    add_p(
        "Hệ thống Second Skin Sport được kiến trúc phục vụ 3 nhóm người dùng cốt lõi, "
        "đảm bảo giải quyết trọn vẹn chuỗi giá trị từ vận động viên cá nhân đến nhà quản lý đội thể thao:"
    )

    # Persona Table
    persona_headers = ["Đặc Điểm", "Persona 1: Runner Phong Trào", "Persona 2: Cầu Thủ Bóng Rổ", "Persona 3: Huấn Luyện Viên (Coach)"]
    persona_data = [
        ["Đại diện tiêu biểu", "Anh Minh (29 tuổi, Nhân viên văn phòng, chạy bộ 3 buổi/tuần)", "Tuấn (21 tuổi, Sinh viên, thi đấu giải bóng rổ sinh viên)", "Thầy Hoàng (42 tuổi, HLV trưởng đội bóng rổ học viện thể thao)"],
        ["Mục tiêu chính", "Chạy hoàn thành cự ly Half-Marathon mà không bị đau khớp gối hay viêm gân gót.", "Tăng sức bật nhảy, bứt tốc nhanh hơn, tránh chấn thương lật cổ chân và dây chằng khi tiếp đất.", "Bao quát thể lực 15 cầu thủ, tránh tình trạng quá tải cơ bắp, cá nhân hóa giáo án tập luyện."],
        ["Rào cản lớn nhất", "Không biết kỹ thuật tiếp đất của mình đúng hay sai; xem đồ thị đồng hồ không hiểu.", "Tiếp đất sau khi tranh chấp bóng trên không rất mạnh, hay bị ê buốt khớp gối sau trận.", "Không có trợ lý ghi chép số liệu; đánh giá phong độ cầu thủ hoàn toàn dựa trên cảm tính mắt nhìn."],
        ["Tính năng yêu thích", "Điểm độ êm tiếp đất (Landing Softness) & Lời khuyên bài tập giãn cơ từ AI Coach.", "Đo độ bùng nổ (Explosiveness), thời gian bay bật cao (Airtime) & Nhận diện lỗi lệch chân.", "Bảng ma trận chỉ số đội (Team Metrics Grid), cảnh báo viền đỏ HIGH Risk & Xuất báo cáo PDF."]
    ]
    add_custom_table(persona_headers, persona_data, [Mm(25), Mm(48), Mm(48), Mm(49)])

    # -------------------------------------------------------------
    # CHƯƠNG 4: GIẢI PHÁP SẢN PHẨM & CÁC TÍNH NĂNG CỐT LÕI
    # -------------------------------------------------------------
    add_h1("4. GIẢI PHÁP SẢN PHẨM & PHÂN RÃ TÍNH NĂNG (PRODUCT SOLUTION & FEATURES)")

    add_p(
        "Second Skin Sport là một giải pháp tích hợp khép kín gồm 4 khối thành phần chính: "
        "Phần cứng cảm biến thông minh, Bộ đệm xử lý biên Zero-Touch, Động cơ AI song hành và Hệ thống phân quyền hiển thị đa tầng."
    )

    # Add Figure 1
    add_image_figure(
        "D:/EXE101/Second_Skin_Sport/docs/figures/hinh_1_so_do_kien_truc_tong_the.png",
        "Hình 1: Sơ đồ kiến trúc tổng thể 4 khối chức năng của hệ thống Second Skin Sport",
        155
    )

    add_h2("4.1. Phần Cứng Đo Lường Quán Tính 6-DOF & Vị Trí Đeo Chiến Lược")
    add_p(
        "Thiết bị đeo Second Skin Sport sử dụng vi điều khiển nhúng ESP32-C3 kiến trúc RISC-V 32-bit kết hợp với cảm biến quán tính MEMS 6-DOF MPU-6050 "
        "(gồm gia tốc 3 trục ax, ay, az và con quay hồi chuyển 3 trục gx, gy, gz) lấy mẫu ổn định tại tần số 10Hz (chu kỳ 100ms). "
        "Khác với việc đeo ở cổ tay, thiết bị được thiết kế gắn tại hai vị trí trọng yếu trên cơ thể:"
    )
    add_bullet("Vị trí Đai Bắp Đùi (Thigh Mount): Đeo trực tiếp tại mặt trước/ngoài xương đùi. Cho phép đo trực tiếp góc nâng đùi, lực bùng nổ cơ tứ đầu đùi và gia tốc va chạm tiếp đất dội từ bàn chân qua khớp gối lên đùi; đồng thời ước lượng xu hướng cân bằng tải trọng qua dao động lắc hông.", "Phương án 1 — ")
    add_bullet("Vị trí Đai Vai (Shoulder Mount): Đeo tại vùng đai vai/xương đòn. Cho phép đo trực tiếp góc chúi thân trên (Pitch), độ lắc lư thân trên (Roll) và gia tốc va chạm dội dọc cột sống.", "Phương án 2 — ")
    add_bullet("Chế độ Hai Cảm Biến (Dual-Sensor Mode): Cho phép kết nối đồng thời hai cảm biến tại hai bắp đùi để đo trực tiếp gia tốc từng chân riêng biệt, mang lại độ chính xác tuyệt đối cho chỉ số cân bằng tải trọng.", "Phương án mở rộng — ")

    add_h2("4.2. Cơ Chế Đệm Dữ Liệu Tầng Biên Zero-Touch RAM Buffer")
    add_p(
        "Một thách thức kỹ thuật lớn trong các hệ thống IoT thể thao là nguy cơ nghẽn mạng và phình cơ sở dữ liệu nếu liên tục ghi mọi mẫu 10Hz vào ổ đĩa. "
        "Second Skin Sport áp dụng kiến trúc Zero-Touch RAM Buffer độc quyền:"
    )
    add_bullet("Toàn bộ chuỗi sóng động học 10Hz được tích lũy trực tiếp trên bộ nhớ RAM của thiết bị đầu cuối với độ trễ xấp xỉ bằng không (0-latency).", "Xử lý tức thời: ")
    add_bullet("Thuật toán heuristic nhận diện ngay các sự kiện đột biến như cú bật nhảy (Jumps > 17.5 m/s²) và pha đổi hướng gấp (Turns > 120°/s) trên RAM.", "Phát hiện sự kiện biên: ")
    add_bullet("Khi kết thúc buổi tập, hệ thống chọn lọc thông minh 60 điểm trajectory tiêu biểu mô tả toàn bộ diễn biến phiên tập và gửi một request duy nhất (POST /api/sessions/auto) lên máy chủ, triệt tiêu 100% nguy cơ nghẽn I/O cơ sở dữ liệu.", "Tối ưu đường truyền: ")

    # Add Figure 2
    add_image_figure(
        "D:/EXE101/Second_Skin_Sport/docs/figures/hinh_2_luu_do_quy_trinh_xu_ly.png",
        "Hình 2: Lưu đồ quy trình xử lý dữ liệu khép kín từ cảm biến đến bảng điều khiển",
        135
    )

    add_h2("4.3. Bộ 5 Chỉ Số Cơ Sinh Học Độc Quyền (5 Core Biomechanical Metrics)")
    add_p(
        "Hệ thống tính toán và cung cấp cho người dùng 5 chỉ số cơ sinh học chuẩn y học thể thao, "
        "phân định minh bạch giữa các chỉ số đo trực tiếp và chỉ số ước lượng xu hướng:"
    )

    metric_headers = ["Chỉ Số Cơ Sinh Học", "Phương Thức Đo", "Công Thức Kỹ Thuật", "Ý Nghĩa Thực Tế & Cảnh Báo"]
    metric_data = [
        [
            "1. Độ êm tiếp đất\n(Landing Softness)",
            "Đo trực tiếp gia tốc tại vị trí gắn cảm biến (Proxy cho lực GRF)",
            "PeakImpactG = max(|mag|) / g\nSoftness = 100 - (G - 1.8) * 22",
            "Đo mức độ chấn động dội ngược khi tiếp đất. > 80/100 là tiếp đất êm an toàn. Dưới 60 điểm (> 3.0G) cảnh báo nguy cơ chấn động khớp gối và gân gót."
        ],
        [
            "2. Xu hướng cân bằng\n(Balance Tendency)",
            "Ước lượng qua dao động Roll & ay (1 cảm biến) / Đo trực tiếp (Dual)",
            "Ratio = LeftImpulse / (Left + Right)\nBalance% = 100 - |Ratio - 0.5| * 60",
            "Đánh giá độ đều lực giữa hai chân. Mức > 90% là cân đối. Lệch tải > 18% cảnh báo xu hướng dồn lực bất thường do đau một bên chân hoặc tật vận động."
        ],
        [
            "3. Độ vững thân trên\n(Trunk Stability)",
            "Đo lường trực tiếp từ góc Euler (Pitch, Roll)",
            "TrunkStability = 100 - (σ_Pitch + σ_Roll) * 1.8\nLeanAngle = |Pitch|",
            "Đo độ ổn định của cột sống và thân trên. Độ lắc lư lớn chứng tỏ cơ lõi (Core) yếu, dẫn đến tiêu hao năng lượng vô ích và đau mỏi lưng dưới."
        ],
        [
            "4. Bật cao & Bùng nổ\n(Explosiveness & Airtime)",
            "Đo lường trực tiếp chuỗi cất cánh và rơi tự do",
            "Cất cánh: mag > 17.5 m/s²\nThời gian bay: Δt_air\nH = (1/8) * g * (Δt_air)²",
            "Đặc biệt quan trọng cho vận động viên bóng rổ, bóng chuyền. Đo lường sức mạnh cơ đùi và độ cao bật nhảy thực tế mà không cần thảm đo."
        ],
        [
            "5. Chỉ số mỏi cơ\n(Fatigue Index)",
            "Đo lường trực tiếp suy giảm năng lượng động học",
            "ΔE = (E_đầu - E_cuối) / E_đầu\nFatigue = round(ΔE * 100%) + 12",
            "Đo mức độ suy giảm năng lượng vận động về cuối buổi tập. Khi mỏi cơ vượt 25%, nguy cơ chấn thương tăng gấp 3 lần do cơ bắp mất khả năng hấp thụ lực va chạm."
        ]
    ]
    add_custom_table(metric_headers, metric_data, [Mm(30), Mm(35), Mm(48), Mm(57)])

    # Add Figure 3
    add_image_figure(
        "D:/EXE101/Second_Skin_Sport/docs/figures/hinh_3_co_che_trich_xuat_dac_trung.png",
        "Hình 3: Cơ chế thuật toán trích xuất đặc trưng cơ sinh học và phân tầng rủi ro chấn thương",
        155
    )

    add_h2("4.4. Trợ Lý Huấn Luyện AI Song Hành (Dual-Engine AI Coach)")
    add_p(
        "Điểm đột phá của Second Skin Sport là kiến trúc AI kết hợp giữa hai bộ máy trí tuệ:"
    )
    add_bullet("Bộ máy Ngoại tuyến (Local Biomechanical DSP Engine): Được lập trình bằng Java trong lõi Spring Boot, vận hành 100% offline. Sử dụng các mô hình cơ sinh học toán học để phân tầng rủi ro chấn thương thành 3 cấp (LOW, MEDIUM, HIGH) ngay cả khi không có kết nối đám mây.", "Engine 1 — ")
    add_bullet("Bộ máy Đám mây (Cloud Sports LLM Engine - Google Gemini 1.5 Flash): Khi có kết nối mạng, dữ liệu đặc trưng được gửi tới mô hình Gemini 1.5 Flash thông qua Structured JSON prompt. Mô hình sinh báo cáo nhận xét tiếng Việt tự nhiên, chỉ rõ lỗi kỹ thuật và đề xuất bài tập khắc phục cụ thể theo cấu trúc Sets & Reps.", "Engine 2 — ")

    add_callout(
        "Ví dụ phản hồi thực tế từ AI Coach:\n"
        "'Chào Minh! Hôm nay bạn hoàn thành buổi chạy 35 phút với tốc độ trung bình 14.5 km/h rất tốt. "
        "Tuy nhiên, ở 10 phút cuối, lực tiếp đất của bạn tăng lên 3.1G (tiếp đất cứng do mỏi cơ tứ đầu đùi) "
        "và xu hướng dồn lực sang chân phải chiếm tới 58%. "
        "Để khắc phục, tuần này bạn hãy bổ sung bài tập: (1) Depth Drop từ bục 30cm: 3 hiệp x 8 lần để rèn phản xạ tiếp đất êm; "
        "(2) Single-Leg Glute Bridge: 3 hiệp x 12 lần cho chân trái để cân bằng lại sức mạnh hai bên.'",
        title="MINH HỌA TRẢI NGHIỆM AI COACH ĐỜI THƯỜNG"
    )

    add_h2("4.5. Phân Hệ Quản Trị Đội Nhóm Dành Riêng Cho Huấn Luyện Viên (Coach Dashboard)")
    add_p(
        "Khác với các ứng dụng cá nhân đơn thuần, Second Skin Sport thiết kế hệ thống phân quyền đa vai trò (Role-Based Access Control - RBAC) "
        "với giao diện chuyên biệt cho Huấn luyện viên:"
    )
    add_bullet("Ma trận chỉ số toàn đội thời gian thực (Team Metrics Grid): Hiển thị đồng bộ thẻ trạng thái của tất cả vận động viên trên sân qua WebSocket STOMP.", "1. Giám sát tập trung: ")
    add_bullet("Cảnh báo thị giác nguy cơ quá tải (Centralized Alert): Kích hoạt viền đỏ nhấp nháy ngay lập tức khi phát hiện vận động viên có mức rủi ro HIGH hoặc chỉ số mỏi cơ FatigueIndex > 25%, giúp HLV ra quyết định thay người bảo vệ cầu thủ.", "2. Báo động chấn thương: ")
    add_bullet("Đối chiếu phong độ & Xuất báo cáo: Cho phép so sánh biểu đồ hiệu suất giữa các cầu thủ và xuất hồ sơ thể lực toàn đội ra định dạng PDF/CSV chuẩn y tế thể thao.", "3. Phân tích & Lưu trữ: ")

    # Add Figure 4
    add_image_figure(
        "D:/EXE101/Second_Skin_Sport/docs/figures/hinh_4_so_do_tuong_tac_coach_role.png",
        "Hình 4: Sơ đồ tương tác phân quyền và giao diện bảng điều khiển Huấn luyện viên (Coach Dashboard)",
        155
    )

    # -------------------------------------------------------------
    # CHƯƠNG 5: KIẾN TRÚC KỸ THUẬT & STACK CÔNG NGHỆ
    # -------------------------------------------------------------
    add_h1("5. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ SỬ DỤNG (TECHNICAL ARCHITECTURE)")

    add_p(
        "Hệ thống Second Skin Sport được xây dựng theo chuẩn kiến trúc doanh nghiệp phân lớp, "
        "đảm bảo khả năng mở rộng (Scalability), độ trễ cực thấp và tính bảo mật cao:"
    )

    tech_headers = ["Tầng Kiến Trúc", "Công Nghệ / Framework", "Chức Năng Chính"]
    tech_data = [
        ["1. Tầng Thiết Bị Biên (Edge IoT)", "ESP32-C3 SuperMini (RISC-V) + MPU-6050", "Thu nhận tín hiệu 6-DOF 10Hz, ước lượng góc nghiêng 3D Euler, máy trạng thái FSM, truyền phát BLE GATT/Wi-Fi."],
        ["2. Tầng Đệm Dữ Liệu (Edge Buffer)", "React 19 RAM Buffer + Web Bluetooth API", "Đệm sóng động học trên RAM với 0 độ trễ, nhận diện cú nhảy/đổi hướng, gom 60 điểm trajectory phiên tập."],
        ["3. Tầng Máy Chủ (Backend API)", "Spring Boot 3.2 (Java 21) + Spring Security + JWT", "REST API, Ingestion Service, xác thực phân quyền RBAC, quản lý thiết bị IoT, đồng bộ thực thể SportSession."],
        ["4. Động Cơ Xử Lý Cơ Sinh Học", "Local DSP Engine (Java Math) + Gemini 1.5 Flash", "Tính toán 5 nhóm đặc trưng cơ sinh học, phân tầng rủi ro ngoại tuyến và sinh báo cáo tiếng Việt qua Cloud LLM."],
        ["5. Tầng Giao Tiếp Realtime", "WebSocket STOMP + SockJS", "Phát tán dữ liệu thời gian thực giữa máy chủ và giao diện người dùng với độ trễ < 150ms."],
        ["6. Tầng Giao Diện Người Dùng", "React 19 + Vite + Recharts + Vanilla CSS", "Giao diện Dashboard VĐV, Biểu đồ động học, Bảng điều khiển Coach Team Grid, Cổng quản trị Admin."],
        ["7. Tầng Cơ Sở Dữ Liệu", "Microsoft SQL Server / H2 Database", "Lưu trữ cấu trúc thông tin người dùng, thiết bị, phiên tập thể thao và hồ sơ chấn thương."]
    ]
    add_custom_table(tech_headers, tech_data, [Mm(35), Mm(45), Mm(90)])

    # -------------------------------------------------------------
    # CHƯƠNG 6: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
    # -------------------------------------------------------------
    add_h1("6. TIÊU CHUẨN KỸ THUẬT & YÊU CẦU PHI CHỨC NĂNG (NFR)")

    add_p("Nhằm bảo đảm sản phẩm hoạt động ổn định trong môi trường thể thao thực chiến, hệ thống đáp ứng các chỉ tiêu phi chức năng nghiêm ngặt:")
    add_bullet("Độ trễ truyền nhận WebSocket STOMP < 150ms; thời gian phản hồi sinh báo cáo AI phân tích < 1.0 giây.", "Hiệu năng & Độ trễ (Performance): ")
    add_bullet("Dung lượng pin thiết bị đạt 8–10 giờ hoạt động liên tục ở chế độ BLE; thuật toán Zero-Touch triệt tiêu 100% tình trạng đầy bộ nhớ.", "Thời lượng pin & Lưu trữ (Battery & Storage): ")
    add_bullet("Hệ thống duy trì 100% tính năng phân tích cơ bản khi mất kết nối mạng nhờ Local DSP Engine nội bộ.", "Tính sẵn sàng (High Availability): ")
    add_bullet("Mã hóa mật khẩu bằng BCrypt, xác thực phiên qua JWT Token không lưu trạng thái (Stateless), kiểm soát phân quyền RBAC chặt chẽ, tuyệt đối không hardcode bí mật hệ thống.", "Bảo mật & Phân quyền (Security): ")

    # -------------------------------------------------------------
    # CHƯƠNG 7: MÔ HÌNH KINH DOANH & KẾ HOẠCH TÀI CHÍNH
    # -------------------------------------------------------------
    add_h1("7. MÔ HÌNH KINH DOANH & TIẾP CẬN THỊ TRƯỜNG (BUSINESS MODEL & GTM)")

    add_p(
        "Second Skin Sport áp dụng mô hình kinh doanh lai (Hybrid Business Model) kết hợp giữa bán phần cứng và dịch vụ phần mềm định kỳ (SaaS), "
        "giúp tối ưu hóa dòng tiền ban đầu và duy trì doanh thu định kỳ trọn đời (ARR):"
    )

    add_h2("7.1. Ba Nguồn Thu Chính (Revenue Streams)")
    add_bullet("Bán thiết bị đeo ESP32-C3 + MPU-6050 kèm đai bó cơ đùi/đai vai cao cấp. Giá bán dự kiến: 650.000 – 950.000 VNĐ/bộ (Biên lợi nhuận gộp ~45%).", "1. Doanh thu Phần cứng (Hardware Sales): ")
    add_bullet("Gói Freemium miễn phí trọn đời cho các chỉ số cơ bản; Gói Premium AI Coach (59.000 VNĐ/tháng hoặc 599.000 VNĐ/năm) mở khóa phân tích chuyên sâu của Gemini LLM, phân tích video và kho bài tập cá nhân hóa.", "2. Thuê bao Cá nhân B2C (Freemium Subscription): ")
    add_bullet("Bán giải pháp quản lý toàn đội cho các Học viện thể thao, CLB bóng rổ, trường học và phòng tập chuyên nghiệp. Gói dịch vụ từ 1.500.000 – 3.500.000 VNĐ/tháng/đội (bao gồm phần cứng, Coach Dashboard và hỗ trợ kỹ thuật).", "3. Thuê bao Đội nhóm B2B (B2B Team SaaS): ")

    add_h2("7.2. Chiến Lược Tiếp Cận Thị Trường (Go-To-Market Strategy)")
    add_bullet("Giai đoạn 1 (Validation): Triển khai thử nghiệm tại các câu lạc bộ chạy bộ (Running Clubs) và giải bóng rổ sinh viên tại TP.HCM/Hà Nội để thu thập dữ liệu và hoàn thiện thuật toán.", "Tháng 1 - 3: ")
    add_bullet("Giai đoạn 2 (Early Adopters): Hợp tác với các Huấn luyện viên thể thao cá nhân (Personal Trainers) và KOLs thể thao uy tín làm đại sứ thương hiệu, chứng thực tính hiệu quả trong việc phòng ngừa chấn thương.", "Tháng 4 - 6: ")
    add_bullet("Giai đoạn 3 (Scale): Mở rộng phân phối qua các chuỗi bán lẻ đồ thể thao và ký hợp đồng cung cấp giải pháp cho các trường liên cấp quốc tế và học viện thể thao trẻ.", "Tháng 7 - 12: ")

    # -------------------------------------------------------------
    # CHƯƠNG 8: LỘ TRÌNH PHÁT TRIỂN & CHỈ SỐ THÀNH CÔNG (KPIS)
    # -------------------------------------------------------------
    add_h1("8. LỘ TRÌNH PHÁT TRIỂN & CHỈ SỐ THÀNH CÔNG (ROADMAP & KPIS)")

    add_p("Kế hoạch triển khai dự án được phân bổ khoa học qua 5 giai đoạn phát triển:")

    phase_headers = ["Giai Đoạn", "Hạng Mục Trọng Tâm", "Mục Tiêu Đạt Được", "Trạng Thái"]
    phase_data = [
        ["Phase 0\n(Foundation)", "Thiết lập cấu trúc Monorepo, CI/CD, DB Schema, chuẩn giao tiếp API.", "Môi trường phát triển chuẩn hóa, sẵn sàng tích hợp.", "✅ Hoàn thành"],
        ["Phase 1\n(Firmware)", "Lập trình ESP32-C3, đọc MPU-6050 10Hz, FSM Heuristic, truyền phát BLE.", "Thiết bị phần cứng gửi dữ liệu ổn định và chính xác.", "✅ Hoàn thành"],
        ["Phase 2\n(Backend API)", "Spring Boot REST API, Ingestion, Zero-Touch Accumulator, SQL Server.", "Xử lý phiên tập SportSession, lưu trữ dữ liệu an toàn.", "✅ Hoàn thành"],
        ["Phase 3\n(AI Engines)", "Tích hợp Local DSP Engine và Cloud Sports LLM Gemini 1.5 Flash.", "Sinh báo cáo phong độ tiếng Việt & bài tập Sets & Reps.", "✅ Hoàn thành"],
        ["Phase 4\n(Frontend)", "Phát triển React Dashboard, Recharts, WebSocket và Coach Dashboard.", "Giao diện VĐV & Huấn luyện viên trực quan, đa vai trò.", "✅ Hoàn thành"],
        ["Phase 5\n(Testing & Pilot)", "Thử nghiệm thực địa với 50 vận động viên và 3 câu lạc bộ bóng rổ.", "Tinh chỉnh ngưỡng thuật toán, chuẩn bị thương mại hóa.", "🚀 Đang triển khai"]
    ]
    add_custom_table(phase_headers, phase_data, [Mm(25), Mm(55), Mm(60), Mm(30)])

    add_h2("8.2. Chỉ Số Đo Lường Hiệu Quả (Key Performance Indicators - KPIs)")
    add_bullet("Đạt 1.000 thiết bị kích hoạt trong 6 tháng đầu; Tỷ lệ người dùng hoạt động hàng tháng (MAU) > 65%; Tỷ lệ giữ chân người dùng (Retention Rate sau 30 ngày) > 50%.", "Chỉ số Người dùng (Product KPIs): ")
    add_bullet("Độ tin cậy lặp lại của thuật toán phát hiện bật nhảy > 92%; Tỷ lệ hài lòng của vận động viên đối với bài tập AI Coach đề xuất > 85%.", "Chỉ số Kỹ thuật (Technical KPIs): ")
    add_bullet("Đạt điểm hòa vốn (Break-even point) sau 12 tháng thương mại hóa; Ký kết hợp đồng B2B với tối thiểu 10 câu lạc bộ/học viện thể thao.", "Chỉ số Kinh doanh (Financial KPIs): ")

    # -------------------------------------------------------------
    # CHƯƠNG 9: KẾT LUẬN & ĐỀ XUẤT TỪ SENIOR BUSINESS ANALYST
    # -------------------------------------------------------------
    add_h1("9. KẾT LUẬN & ĐỀ XUẤT CỦA SENIOR BUSINESS ANALYST")

    add_p(
        "Dự án Second Skin Sport sở hữu sự kết hợp hài hòa và hiếm có giữa tính sáng tạo công nghệ (Innovative Tech), "
        "tính khả thi phần cứng (Feasible Hardware) và giá trị thực tiễn sâu sắc đối với cộng đồng rèn luyện thể thao. "
        "Bằng việc giải quyết triệt để bài toán mù dữ liệu cơ sinh học của thiết bị đeo cổ tay và sự đắt đỏ của các phòng Lab, "
        "Second Skin Sport có đầy đủ tiềm năng để trở thành một sản phẩm công nghệ thể thao Make in Vietnam tạo ra bước đột phá lớn trên thị trường."
    )

    add_callout(
        "Đề xuất tiếp theo dành cho Nhóm Dự Án:\n"
        "1. Tiếp tục triển khai thử nghiệm thực địa (Phase 5) trên các vận động viên bóng rổ và chạy bộ để thu thập thêm dữ liệu thực tế.\n"
        "2. Đăng ký bảo hộ sở hữu trí tuệ giải pháp sáng chế dựa trên bản mô tả đã hoàn thiện nhằm xác lập hàng rào bảo vệ công nghệ độc quyền.\n"
        "3. Chuẩn bị Pitch Deck chuyên nghiệp dựa trên tài liệu tổng quan này để tiếp cận các nhà đầu tư thiên thần và vườn ươm khởi nghiệp.",
        title="KHUYẾN NGHỊ HÀNH ĐỘNG CHIẾN LƯỢC"
    )

    output_path = "D:/EXE101/Second_Skin_Sport/docs/Tong_quan_du_an_Second_Skin_Sport.docx"
    doc.save(output_path)
    print(f"[OK] Document generated successfully at: {output_path}")

if __name__ == "__main__":
    build_document()
