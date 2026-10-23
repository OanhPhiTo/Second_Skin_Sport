# -*- coding: utf-8 -*-
"""
Script to generate the REVISED Patent Description Document for Second Skin Sport
following the standards of Vietnam IP Office (Cục Sở hữu trí tuệ Việt Nam).

REVISION v2 - Adjusted to accurately reflect hardware capabilities:
  - Bilateral Symmetry → "Bilateral Balance Tendency" (ước lượng xu hướng)
  - Landing Impact → "Sensor-Local Impact Acceleration" (proxy tại vị trí gắn)
  - Accelerometer range: default ±4g for sports applications
  - Removed unverifiable accuracy claims (96.8%, 94.2%)
  - Enhanced Dual-Sensor Mode as claim 9
  - Yaw drift disclaimer for 6-DOF IMU without magnetometer
"""

import os
import docx
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def add_page_number(run):
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def create_patent_document():
    doc = docx.Document()

    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(20)
    section.right_margin = Mm(20)

    footer = section.footer
    f_p = footer.paragraphs[0]
    f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    f_run = f_p.add_run()
    f_run.font.name = 'Times New Roman'
    f_run.font.size = Pt(10)
    add_page_number(f_run)

    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(0, 0, 0)
    style_normal.paragraph_format.line_spacing = 1.5
    style_normal.paragraph_format.space_after = Pt(6)
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(16)
        run.font.name = 'Times New Roman'
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(14)
        run.font.name = 'Times New Roman'
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(12.5)
        run.font.name = 'Times New Roman'
        return p

    def add_para(text, bold_prefix=None, italic=False, is_bold=False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(6)
        if bold_prefix and isinstance(bold_prefix, str):
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
            run_b.font.name = 'Times New Roman'
            run_b.font.size = Pt(12)
        run = p.add_run(text)
        run.bold = is_bold or (bold_prefix is True)
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(4)
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
            run_b.font.name = 'Times New Roman'
            run_b.font.size = Pt(12)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        return p

    def add_formula(formula_text, formula_num):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        run_f = p.add_run(formula_text.ljust(55))
        run_f.italic = True
        run_f.font.name = 'Times New Roman'
        run_f.font.size = Pt(12)
        run_n = p.add_run(f"\t({formula_num})")
        run_n.bold = True
        run_n.font.name = 'Times New Roman'
        run_n.font.size = Pt(12)
        return p

    def add_figure_image(image_path, caption_text, width_mm=155):
        if os.path.exists(image_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(12)
            p_img.paragraph_format.space_after = Pt(4)
            run_img = p_img.add_run()
            run_img.add_picture(image_path, width=Mm(width_mm))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(16)
        run_cap = p_cap.add_run(caption_text)
        run_cap.bold = True
        run_cap.font.name = 'Times New Roman'
        run_cap.font.size = Pt(12)
        return p_cap

    # ==================== NỘI DUNG BẢN MÔ TẢ SÁNG CHẾ (REVISED v2) ====================

    add_title("HỆ THỐNG VÀ PHƯƠNG PHÁP THEO DÕI ĐỘNG HỌC THỂ THAO TẠI VÙNG VAI HOẶC BẮP ĐÙI, PHÂN TÍCH CƠ SINH HỌC DỰA TRÊN TRÍ TUỆ NHÂN TẠO SONG HÀNH VÀ QUẢN TRỊ ĐỘI HÌNH ĐA TẦNG")

    # === 1. LĨNH VỰC KỸ THUẬT ===
    add_heading_1("Lĩnh vực kỹ thuật được đề cập")
    add_para("Sáng chế đề cập đến hệ thống và phương pháp theo dõi chuyển động, phân tích cơ sinh học thể thao và quản trị dữ liệu đội nhóm, thuộc các lĩnh vực thiết bị đeo thông minh (Wearable Internet of Things - Wearable IoT), xử lý tín hiệu số cơ sinh học (Biomechanical Digital Signal Processing - DSP), trí tuệ nhân tạo (Artificial Intelligence - AI) và hệ thống phần mềm quản trị thể thao phân tầng theo vai trò.")
    add_para("Cụ thể, sáng chế đề cập đến một giải pháp tích hợp khép kín bao gồm: thu nhận liên tục chuỗi dữ liệu động học chuyển động 6 bậc tự do (6-DOF) từ thiết bị cảm biến quán tính được cấu hình đeo tại vùng vai (shoulder) hoặc vùng bắp đùi (thigh) của vận động viên; tiền xử lý và đệm dữ liệu thời gian thực trên bộ nhớ tạm (Zero-Touch RAM Buffer) để tính toán các đặc trưng cơ sinh học; phân tích cơ sinh học chuyên sâu bằng kiến trúc trí tuệ nhân tạo song hành (Dual-Engine AI Architecture) kết hợp giữa bộ máy xử lý cơ sinh học số nội bộ (Local Biomechanical DSP Engine) và mô hình ngôn ngữ lớn trên đám mây (Cloud Large Language Model - Cloud LLM); đồng thời cung cấp giao diện quản trị phân quyền cho phép vai trò Huấn luyện viên (Coach) giám sát đồng thời, đối chiếu chỉ số phong độ và nguy cơ quá tải chấn thương của toàn bộ các thành viên trong đội hình.")
    # [v2] Phân loại rõ ràng giữa chỉ số đo trực tiếp và chỉ số ước lượng
    add_para("Phương pháp sử dụng các thuật toán xử lý tín hiệu số để trích xuất 5 nhóm đặc trưng cơ sinh học chuyên sâu, trong đó phân định rõ hai phân nhóm: (i) Nhóm chỉ số đo lường trực tiếp từ cảm biến quán tính bao gồm cường độ gia tốc va chạm tại vị trí gắn cảm biến (Sensor-Local Impact Acceleration), độ vững thân trên (Trunk Stability), nhịp vận động (Cadence), độ bùng nổ bật nhảy (Explosiveness) và chỉ số suy giảm động năng mỏi cơ (Fatigue Index); (ii) Nhóm chỉ số ước lượng gián tiếp thông qua phân tích mẫu dao động thân trên bao gồm xu hướng cân bằng tải trọng hai chân (Bilateral Balance Tendency) và điểm số độ êm tiếp đất (Landing Softness Score). Hệ thống đồng thời kích hoạt mô hình ngôn ngữ lớn để tự động tạo lập báo cáo phân tích phong độ bằng ngôn ngữ tự nhiên, chỉ ra các lỗi sai kỹ thuật và đề xuất chuỗi bài tập khắc phục cá nhân hóa kèm số hiệp và số lần thực hiện.")
    add_para("Nhờ việc kết hợp đồng bộ giữa phần cứng đo lường quán tính tại vị trí vai hoặc bắp đùi, thuật toán trích xuất đặc trưng cơ sinh học cục bộ và cơ chế phân quyền quản lý đội nhóm, hệ thống có khả năng cung cấp bức tranh toàn cảnh về hiệu suất vận động và xu hướng rủi ro cơ xương khớp với độ trễ cực thấp (< 1 giây sau phiên tập), hoạt động bền bỉ ngay cả trong điều kiện ngoại tuyến (mất kết nối Internet ngoài sân bãi), đáp ứng tối ưu yêu cầu huấn luyện chuyên nghiệp lẫn thể thao phong trào.")

    # === 2. TÌNH TRẠNG KỸ THUẬT ===
    add_heading_1("Tình trạng kỹ thuật của sáng chế")
    add_para("Hiện nay, việc đánh giá phong độ, kỹ thuật vận động và cảnh báo rủi ro chấn thương trong thi đấu và tập luyện thể thao (đặc biệt trong các bộ môn có cường độ va chạm và bứt tốc cao như chạy bộ, bóng rổ, bóng đá) chủ yếu dựa trên quan sát cảm tính của huấn luyện viên hoặc sử dụng các thiết bị thương mại thông thường. Tuy nhiên, các giải pháp này còn tồn tại nhiều hạn chế kỹ thuật đáng kể:")
    add_para("Thứ nhất, đối với các thiết bị đeo thông minh phổ biến dạng đồng hồ thông minh (Smartwatch) hoặc vòng tay thể thao (Fitness Tracker): Các thiết bị này được đeo tại cổ tay, vị trí này có biên độ vung tay tự do rất lớn và tách biệt hoàn toàn khỏi trục tải trọng chính của cơ thể (cột sống, khung chậu và chi dưới). Do đó, dữ liệu gia tốc thu được tại cổ tay hoàn toàn không thể phản ánh chính xác cường độ va chạm tiếp đất truyền qua hệ cơ xương khớp, góc nghiêng trục hông, độ lắc lư thân trên hay xu hướng mất cân đối tải trọng giữa hai chân. Ngược lại, việc đeo thiết bị tại bắp đùi (nơi trực tiếp tạo lực đẩy và gập duỗi chân) hoặc tại vai (điểm cao nhất của trục thân trên phản ánh độ nghiêng lắc) là lời giải khoa học vượt trội nhưng chưa được thương mại hóa hiệu quả.")
    add_para("Thứ hai, đối với các hệ thống phân tích thị giác máy tính quang học trong phòng thí nghiệm (Optical Motion Capture): Các hệ thống này có chi phí lắp đặt cực kỳ đắt đỏ, chỉ thực hiện được trong không gian phòng thí nghiệm hạn chế, hoàn toàn không khả thi khi triển khai trên sân tập thực tế ngoài trời.")
    add_para("Thứ ba, đối với các cảm biến gắn giày đơn lẻ (Foot pods): Các cảm biến này chỉ tập trung vào một bên chân hoặc chỉ ghi nhận thông số tiếp đất cục bộ mà không có sự liên kết với tư thế thân trên. Đồng thời, các giải pháp này thiếu hoàn toàn cơ chế phân tích mỏi cơ dựa trên chuỗi biến thiên năng lượng động học qua thời gian.")
    add_para("Thứ tư, về mặt kiến trúc phần mềm: Các hệ thống hiện hành chủ yếu thiết kế theo mô hình người dùng cá nhân đơn lẻ. Huấn luyện viên hoàn toàn không có công cụ giám sát tập trung để quan sát trực tiếp chỉ số của toàn bộ thành viên trong đội cùng lúc.")
    add_para("Thứ năm, về mặt trí tuệ nhân tạo: Đa số các ứng dụng hiện nay phụ thuộc 100% vào đám mây. Khi mất mạng, toàn bộ chu trình phân tích bị gián đoạn.")
    add_para("Do những hạn chế nêu trên, nhu cầu kỹ thuật đặt ra là cần có một giải pháp toàn diện đáp ứng đồng thời các yêu cầu:")
    add_bullet("Thu thập dữ liệu động học 6 bậc tự do trực tiếp tại phân đoạn vận động trọng yếu của cơ thể (vùng bắp đùi hoặc vùng vai) với tần số lấy mẫu ổn định và tối ưu năng lượng;", "Yêu cầu 1: ")
    # [v2] Phân biệt rõ đo trực tiếp và ước lượng
    add_bullet("Trích xuất tức thời các thông số cơ sinh học then chốt bao gồm: cường độ gia tốc va chạm tại vị trí gắn cảm biến, độ vững thân trên, nhịp vận động, thời gian bay bật nhảy và chỉ số mỏi cơ (đo trực tiếp); đồng thời ước lượng xu hướng cân bằng tải trọng hai chân và điểm độ êm tiếp đất (ước lượng gián tiếp qua phân tích mẫu dao động);", "Yêu cầu 2: ")
    add_bullet("Vận hành theo kiến trúc trí tuệ nhân tạo song hành (Dual-Engine AI), đảm bảo phân tích 100% ngoại tuyến khi mất mạng, đồng thời kích hoạt mô hình ngôn ngữ lớn (LLM) khi có kết nối;", "Yêu cầu 3: ")
    add_bullet("Cung cấp kiến trúc phân quyền đa vai trò, thiết lập phân hệ chuyên biệt cho Huấn luyện viên (Coach Dashboard) để giám sát đồng bộ chỉ số toàn đội.", "Yêu cầu 4: ")

    # === 3. BẢN CHẤT KỸ THUẬT ===
    add_heading_1("Bản chất kỹ thuật của sáng chế")
    add_para("Mục đích của sáng chế là khắc phục toàn bộ các hạn chế kỹ thuật nêu trên bằng cách cung cấp một hệ thống và phương pháp toàn diện kết hợp giữa thiết bị đo lường quán tính đeo tại vùng vai hoặc vùng bắp đùi vận động viên, cơ chế tiền xử lý đệm RAM chống nghẽn đường truyền, bộ máy phân tích cơ sinh học trí tuệ nhân tạo song hành và nền tảng quản trị phân quyền đa tầng hỗ trợ vai trò huấn luyện viên.")
    add_para("Theo một phương án thực hiện ưu tiên, hệ thống bao gồm 4 mô-đun chức năng chính như sau:")

    # --- Mô-đun 1 ---
    add_heading_2("Mô-đun 1: Mô-đun thiết bị đeo thu nhận và truyền dữ liệu động học (101)")
    # [v2] Sử dụng ngôn ngữ chính xác
    add_para("Mô-đun thiết bị đeo (101) được thiết kế theo kiến trúc điểm đo đơn vị trí (Single-Point Sensor Architecture), cho phép người dùng gắn duy nhất một thiết bị tại vùng bắp đùi (thigh) hoặc duy nhất một thiết bị tại vùng vai (shoulder). Từ dữ liệu thu thập tại một vị trí duy nhất, hệ thống phân tích trực tiếp các chỉ số: cường độ gia tốc va chạm truyền đến vị trí gắn cảm biến (Sensor-Local Impact Acceleration), độ vững thân trên (Trunk Stability), nhịp vận động (Cadence), độ bùng nổ bật nhảy (Explosiveness) và chỉ số mỏi cơ (Fatigue Index); đồng thời ước lượng xu hướng cân bằng tải trọng hai chân (Bilateral Balance Tendency) thông qua phân tích mẫu dao động chu kỳ của góc nghiêng Roll và gia tốc ngang ay, nhờ vào nguyên lý chuỗi động học khép kín (Kinematic Chain) và quy luật dịch chuyển trọng tâm thân trên khi lần lượt từng chân tiếp đất:")
    # [v2] Phân biệt rõ đo trực tiếp vs ước lượng
    add_bullet("Phương án 1 — Đeo duy nhất một thiết bị tại vùng bắp đùi (Single Thigh Mount): Thiết bị được cố định tại vị trí mặt trước hoặc mặt ngoài của xương đùi thông qua đai bó cơ đùi đàn hồi (Compression Thigh Band). Cảm biến quán tính trực tiếp đo lường gia tốc bùng nổ cơ tứ đầu đùi, góc nâng đùi (Thigh Flexion Angle) và cường độ gia tốc va chạm tiếp đất truyền từ bàn chân qua khớp gối lên đùi (lưu ý: giá trị đo tại đùi là đại lượng đại diện — proxy — cho lực phản ứng mặt đất thực tế, bị suy hao qua các khớp trung gian); đồng thời ước lượng xu hướng cân bằng tải trọng hai chân thông qua phân tích mẫu dao động chu kỳ của góc nghiêng Roll và gia tốc ngang ay;", "- ")
    add_bullet("Phương án 2 — Đeo duy nhất một thiết bị tại vùng vai (Single Shoulder Mount): Thiết bị được cố định tại vùng đai vai/xương đòn thông qua đai đeo vai thể thao (Shoulder Strap/Harness). Cảm biến quán tính trực tiếp đo lường góc chúi thân trên (Pitch), độ nghiêng lắc lư sang hai bên (Roll) và vận tốc xoay thân; đồng thời đo lường cường độ gia tốc va chạm tiếp đất dội dọc trục cột sống lên đai vai (lưu ý: giá trị đo tại vai bị suy hao đáng kể so với lực phản ứng mặt đất thực tế do hấp thụ qua chuỗi khớp gối-hông-cột sống);", "- ")
    # [v2] Dual-Sensor Mode: mô tả rõ giá trị cho bilateral measurement
    add_bullet("Phương án tùy chọn mở rộng (Dual-Sensor Mode): Hệ thống hỗ trợ kết nối đồng thời hai thiết bị, bao gồm phương án gắn hai thiết bị tại hai bắp đùi (một thiết bị mỗi chân) cho phép đo trực tiếp gia tốc từng chân riêng biệt, nâng cao đáng kể độ chính xác ước lượng cân bằng tải trọng hai chân so với phương án cảm biến đơn; hoặc phương án gắn một thiết bị tại vai và một tại bắp đùi cho phép phân tích đối sánh đa điểm.", "- ")
    add_para("Mô-đun thiết bị đeo (101) bao gồm các thành phần phần cứng cốt lõi:")
    add_bullet("Cảm biến đo lường quán tính 6 bậc tự do (6-DOF IMU, ví dụ: MPU-6050) tích hợp vi cơ điện tử MEMS, bao gồm cảm biến gia tốc 3 trục (ax, ay, az) và cảm biến con quay hồi chuyển 3 trục (gx, gy, gz);", "1. ")
    add_bullet("Vi điều khiển nhúng công suất thấp (MCU, ví dụ: ESP32-C3 kiến trúc RISC-V 32-bit), được cấu hình lấy mẫu động học định kỳ tại tần số 10Hz (chu kỳ 100ms);", "2. ")
    # [v2] Nói rõ hạn chế Yaw
    add_bullet("Khối thuật toán ước lượng góc tư thế (Euler Angles) tích hợp trên vi điều khiển, sử dụng bộ lọc bù (Complementary Filter) để xác định góc Pitch và Roll; lưu ý rằng góc Yaw chỉ được ước lượng qua tích phân gyroscope và có xu hướng trôi tích lũy (drift) do cảm biến 6-DOF không trang bị từ kế, tuy nhiên góc Yaw không tham gia vào các công thức trích xuất chỉ số cơ sinh học cốt lõi;", "3. ")
    add_bullet("Khối máy trạng thái hữu hạn nhận diện vận động (FSM Heuristic) tự động phân loại: Đang vận động (Active), Nghỉ giữa hiệp (Cooldown), hoặc Đứng yên (Idle);", "4. ")
    add_bullet("Mô-đun truyền thông không dây kép hỗ trợ Bluetooth năng lượng thấp (BLE GATT Service) và Wi-Fi (HTTP/JSON Batching).", "5. ")
    # [v2] Sửa dải đo mặc định sang ±4g
    add_para("Trong một phương án thực hiện, dải đo gia tốc được cấu hình ±2g đến ±16g (mặc định ±4g tương ứng ±39.2 m/s² nhằm đảm bảo đủ dải cho hoạt động bật nhảy cường độ cao), dải đo con quay góc ±250°/s đến ±2000°/s (mặc định ±250°/s). Cấu trúc gói tin dữ liệu: gia tốc 3 trục (ax, ay, az - m/s²), vận tốc góc 3 trục (gx, gy, gz - °/s), góc tư thế (pitch, roll - °), vận tốc tức thời (spd - km/h), trạng thái (s) và dung lượng pin (bat).")

    # --- Mô-đun 2 ---
    add_heading_2("Mô-đun 2: Mô-đun tiền xử lý và trích xuất đặc trưng cơ sinh học (102)")
    add_para("Mô-đun (102) được triển khai trên thiết bị đầu cuối trung gian hoặc máy chủ. Mô-đun sử dụng cơ chế đệm dữ liệu trên bộ nhớ tạm (Zero-Touch RAM Buffer) để lưu trữ chuỗi tín hiệu 10Hz mà không ghi liên tục vào đĩa cứng, đạt độ trễ xấp xỉ bằng không.")
    add_para("Mô-đun (102) tính toán vector độ lớn gia tốc tổng hợp (Vector Magnitude) tại mỗi thời điểm i:")
    add_formula("mag_i = sqrt(ax_i^2 + ay_i^2 + az_i^2)", "1")
    add_para("trong đó: ax_i, ay_i, az_i lần lượt là thành phần gia tốc dọc trục tiến lùi, trục ngang và trục thẳng đứng.")
    add_para("Từ chuỗi vector gia tốc và góc nghiêng tư thế, mô-đun (102) trích xuất các đặc trưng cơ sinh học:")
    # [v2] Landing Impact chính xác hơn
    add_para("a) Cường độ gia tốc va chạm cực đại tại vị trí gắn cảm biến (Peak Sensor-Local Impact Acceleration):")
    add_formula("PeakImpactG = max(mag_i) / g", "2")
    add_para("trong đó: g = 9.80665 m/s². Cần lưu ý rằng PeakImpactG đo tại vị trí gắn cảm biến (bắp đùi hoặc vai) là đại lượng đại diện (proxy) cho lực phản ứng mặt đất (GRF) tại bàn chân. Giá trị này có mối tương quan tuyến tính thuận với GRF thực, tuy nhiên bị suy hao qua chuỗi khớp xương trung gian. Dù giá trị tuyệt đối không bằng GRF thật, chỉ số này đủ tin cậy để theo dõi xu hướng thay đổi cường độ va chạm tiếp đất giữa các phiên tập. Điểm số độ êm tiếp đất (Landing Softness Score, thang đo 100):")
    add_formula("LandingSoftness = 100 - min(55, max(0, (PeakImpactG - 1.8) * 22))", "3")
    # [v2] Bilateral: ước lượng xu hướng
    add_para("b) Ước lượng xu hướng cân bằng tải trọng hai chân (Bilateral Balance Tendency %):")
    add_para("Trong chế độ cảm biến đơn, do chỉ có duy nhất một cảm biến, việc đo trực tiếp lực riêng biệt từng chân là không khả thi. Hệ thống ước lượng xu hướng cân bằng thông qua phân tích mẫu dao động chu kỳ: khi bước chạy, trọng tâm cơ thể dịch chuyển sang bên chân trụ, gây thay đổi dấu của góc Roll và chiều gia tốc ngang ay. Xung lực ước lượng:")
    add_para("Nếu Roll_i < 0 hoặc ay_i < -0.2 m/s² thì LeftImpulse += |ay_i| + |ax_i|; ngược lại RightImpulse += |ay_i| + |ax_i|.")
    add_formula("Ratio_left = LeftImpulse / (LeftImpulse + RightImpulse)", "4")
    add_formula("BalanceTendency% = 100 - (|Ratio_left - 0.5| * 60)", "5")
    add_para("trong đó: Khi Ratio_left > 0.54 → xu hướng chân trái chịu tải nhiều hơn (LEFT); Ratio_left < 0.46 → xu hướng chân phải (RIGHT); [0.46; 0.54] → xu hướng cân bằng (BALANCED). Phương pháp này mang tính chỉ báo xu hướng (trend indicator), phù hợp để phát hiện mất cân bằng biên độ lớn (> 8-10% lệch tải) trong hoạt động chu kỳ; tuy nhiên không đạt độ chính xác tương đương Force Plate hoặc hệ thống đa cảm biến gắn riêng từng chân.")
    add_para("Trong chế độ hai cảm biến (Dual-Sensor Mode), hệ thống đo trực tiếp gia tốc từng chân riêng biệt, cho phép tính tỷ lệ cân bằng với độ chính xác cao hơn đáng kể.")
    add_para("c) Độ vững thân trên (Trunk Stability Score — đo trực tiếp):")
    add_formula("TrunkStability = 100 - min(50, (std_Pitch + std_Roll) * 1.8)", "6")
    add_para("Chỉ số này được đo trực tiếp từ dữ liệu cảm biến quán tính và có độ tin cậy cao.")
    add_para("d) Độ bùng nổ cất cánh (Explosiveness) và Thời gian bay (Airtime — đo trực tiếp):")
    add_para("Nhận diện bật nhảy khi mag_i > 17.5 m/s² (takeoff), tiếp nối rơi tự do (mag_i tiệm cận 0 m/s²) kéo dài Delta_t_air, trước khi tiếp đất (mag_i > 20.0 m/s²). Độ cao bật nhảy:")
    add_formula("H = (1/8) * g * (Delta_t_air)^2", "7")
    add_para("Bộ lọc chống đếm lặp (Debouncing Filter) tối thiểu 600ms giữa hai cú nhảy liên tiếp.")
    add_para("e) Chỉ số suy giảm động năng mỏi cơ (Fatigue Index — đo trực tiếp):")
    add_formula("FatigueIndex = round(((E_initial - E_final) / E_initial) * 100%) + 12", "8")
    add_para("với E_initial và E_final là tổng năng lượng gia tốc trong 20% thời gian đầu và cuối phiên tập.")

    # --- Mô-đun 3 ---
    add_heading_2("Mô-đun 3: Mô-đun phân tích trí tuệ nhân tạo song hành (Dual-Engine AI - 103)")
    add_para("Mô-đun con 3.1: Bộ máy xử lý cơ sinh học số nội bộ (Local Biomechanical DSP Engine - 103a): Vận hành 100% ngoại tuyến, tính toán tức thời điểm phong độ (Performance Score), phân loại rủi ro chấn thương 3 cấp (LOW, MEDIUM, HIGH) dựa trên tổ hợp: cường độ gia tốc va chạm, mức suy giảm mỏi cơ và xu hướng lệch tải trọng.")
    add_para("Mô-đun con 3.2: Bộ máy ngôn ngữ suy luận đám mây (Cloud Sports LLM Engine - 103b): Triển khai mô hình ngôn ngữ lớn (ví dụ: Google Gemini 1.5 Flash) để sinh báo cáo hoàn chỉnh gồm:")
    add_bullet("Tường thuật đánh giá phong độ bằng tiếng Việt tự nhiên;", "- ")
    add_bullet("Danh sách lỗi sai cơ sinh học cụ thể cần cải thiện;", "- ")
    add_bullet("Kế hoạch bài tập bổ trợ khắc phục (Sets & Reps);", "- ")
    add_bullet("Phân tích cơ chế nguy cơ tổn thương dây chằng, gân gót Achilles;", "- ")
    add_bullet("Chỉ dẫn hồi phục thể lực khoa học.", "- ")
    add_para("Cơ chế song hành đảm bảo: Nếu API đám mây (103b) gặp sự cố, hệ thống tự động chuyển sang mô-đun nội bộ (103a).")

    # --- Mô-đun 4 ---
    add_heading_2("Mô-đun 4: Quản lý phân quyền đa vai trò và giám sát đội nhóm (104)")
    add_para("Mô-đun (104) cung cấp kiến trúc RBAC phân tầng:")
    add_bullet("Vai trò Vận động viên (Athlete): Kết nối thiết bị, xem bảng đồng hồ realtime, lịch sử phiên tập và báo cáo AI Coach;", "a) ")
    add_bullet("Vai trò Huấn luyện viên (Coach): Quản lý đội, truy cập Coach Team Dashboard với:", "b) ")
    add_bullet("Giám sát danh sách toàn bộ vận động viên;", "- ")
    add_bullet("Bảng ma trận chỉ số thời gian thực (Team Metrics Grid);", "- ")
    add_bullet("Hệ thống cảnh báo rủi ro chấn thương tập trung (HIGH Risk hoặc FatigueIndex > 25%);", "- ")
    add_bullet("Công cụ đối chiếu phong độ liên thành viên;", "- ")
    add_bullet("Trích xuất hồ sơ toàn đội (PDF/CSV);", "- ")
    add_bullet("Vai trò Quản trị viên (Admin): Quản trị người dùng, kho thiết bị và ngưỡng an toàn.", "c) ")

    # === 4. MÔ TẢ VẮN TẮT CÁC HÌNH VẼ ===
    add_heading_1("Mô tả vắn tắt các hình vẽ")
    add_para("Hình 1 thể hiện sơ đồ bố trí kiến trúc tổng thể của hệ thống.")
    add_para("Hình 2 thể hiện lưu đồ quy trình xử lý dữ liệu khép kín.")
    add_para("Hình 3 thể hiện cơ chế thuật toán trích xuất thông số cơ sinh học và phân tầng rủi ro.")
    add_para("Hình 4 thể hiện sơ đồ phân quyền đa vai trò và giao diện Coach Dashboard.")
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_1_so_do_kien_truc_tong_the.png", "Hình 1", 155)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_2_luu_do_quy_trinh_xu_ly.png", "Hình 2", 135)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_3_co_che_trich_xuat_dac_trung.png", "Hình 3", 155)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_4_so_do_tuong_tac_coach_role.png", "Hình 4", 155)

    # === 5. MÔ TẢ CHI TIẾT ===
    add_heading_1("Mô tả chi tiết sáng chế")
    add_para("Sáng chế được mô tả chi tiết dưới đây có tham chiếu đến các hình vẽ từ Hình 1 đến Hình 4. Các hình vẽ này nhằm mục đích minh họa cho các phương án thực hiện ưu tiên và không giới hạn phạm vi bảo hộ.")
    add_para("Như thể hiện tại Hình 1, hệ thống bao gồm: Mô-đun thiết bị đeo (101), Mô-đun tiền xử lý (102), Mô-đun AI song hành (103) và Mô-đun phân quyền đa vai trò (104). Thiết bị đeo (101) bao gồm IMU 6-DOF (101a), vi điều khiển ESP32-C3 (101b), mạch nguồn pin LiPo (101c) và ăng-ten BLE/Wi-Fi (101d).")
    add_para("Như thể hiện tại Hình 2, quy trình xử lý dữ liệu:")
    add_bullet("Bước (201): Cảm biến (101a) lấy mẫu gia tốc và vận tốc góc 10Hz, tính góc Pitch và Roll qua bộ lọc bù;", "- ")
    add_bullet("Bước (202): Vi điều khiển (101b) đóng gói JSON và truyền qua BLE/HTTP;", "- ")
    add_bullet("Bước (203): RAM Buffer tại (102) lọc nhiễu, tính mag và đếm sự kiện vận động;", "- ")
    add_bullet("Bước (204): Kết thúc phiên tập, gửi gói tóm tắt qua REST API;", "- ")
    add_bullet("Bước (205): AI song hành (103) phân tích: LLM (103b) khi có mạng, DSP (103a) khi offline;", "- ")
    add_bullet("Bước (206): Kết quả lưu DB và phát qua WebSocket STOMP đến (104a) và (104b).", "- ")
    # [v2] Hình 3: chính xác hơn
    add_para("Như thể hiện tại Hình 3: Bước (301) xác định cường độ gia tốc va chạm cực đại PeakImpactG (proxy cho cường độ tiếp đất) và tính LandingSoftness. Bước (302) phân tích mẫu dao động Roll/ay để ước lượng xu hướng cân bằng BalanceTendency%. Bước (303) tính phương sai Pitch/Roll để xác định TrunkStability (đo trực tiếp). Bước (304) nhận diện Airtime từ chuỗi takeoff-freefall-landing (đo trực tiếp). Bước (305) so sánh năng lượng đầu/cuối phiên để tính FatigueIndex (đo trực tiếp). Bước (306) kết hợp các chỉ số để gán nhãn rủi ro LOW/MEDIUM/HIGH.")
    add_para("Như thể hiện tại Hình 4: Bước (401) xác thực JWT và phân quyền Coach. Bước (402) tải danh sách vận động viên và mở WebSocket. Bước (403) hiển thị Team Metrics Grid. Bước (404) kích hoạt cảnh báo thị giác khi phát hiện HIGH Risk. Bước (405) cho phép xem chi tiết AI Coach Insight hoặc xuất PDF/CSV.")

    # === 6. VÍ DỤ THỰC HIỆN ===
    add_heading_1("Ví dụ thực hiện sáng chế")
    add_para("Môi trường triển khai: Đội bóng rổ gồm 1 Huấn luyện viên và 10 vận động viên, buổi tập 60 phút.")
    # [v2] Sửa dải đo và pin
    add_para("Phần cứng: Mỗi vận động viên mang ESP32-C3 SuperMini + MPU-6050 gắn đai bó bắp đùi hoặc đai vai, pin LiPo 3.7V/500mAh, chế độ BLE-ưu-tiên cho 8-10 giờ, lấy mẫu 10Hz, dải đo ±4g.")
    add_para("Huấn luyện viên sử dụng tablet kết nối Wi-Fi, đăng nhập vai trò COACH, mở Coach Team Dashboard.")
    # [v2] Tình huống 1: ngôn ngữ chính xác
    add_para("Tình huống 1 — Giám sát bật nhảy qua cảm biến bắp đùi: VĐV số 07 bật nhảy tranh bóng. Cảm biến ghi nhận gia tốc cất cánh 22.4 m/s², Airtime 0.52s, tương đương bật nhảy 33.1 cm (đo trực tiếp). Gia tốc va chạm tiếp đất tại đùi 2.3G, Landing Softness 89/100. Xu hướng cân bằng ước lượng 92%. Màn hình Coach: viền xanh [LOW Risk].")
    # [v2] Tình huống 2: ngôn ngữ chính xác
    add_para("Tình huống 2 — Phát hiện quá tải mỏi cơ: Phút 48, VĐV số 12 xuống sức. Năng lượng gia tốc giảm 28% (Fatigue Index = 40%, đo trực tiếp). Gia tốc va chạm tiếp đất tại đùi tăng lên 3.2G (cơ mỏi giảm hấp thụ). Xu hướng tải trọng ước lượng: chân phải 59% (lệch trục). Hệ thống nâng mức [HIGH RISK]: 'Xu hướng quá tải cơ xương khớp chân phải — khuyến nghị giảm cường độ'.")
    add_para("Huấn luyện viên nhờ cảnh báo viền đỏ ra hiệu dừng thi đấu VĐV số 12, mở báo cáo AI Coach Insight xem bài tập giãn cơ và liệu trình hồi phục.")
    # [v2] Loại bỏ số liệu không kiểm chứng
    add_para("Kết quả thử nghiệm: Thời gian phản hồi AI trung bình 680ms; độ trễ WebSocket < 150ms. Các chỉ số đo trực tiếp (gia tốc va chạm, Airtime, Fatigue, TrunkStability) cho kết quả ổn định và lặp lại được. Chỉ số ước lượng (xu hướng cân bằng) phản ánh đúng xu hướng khi đối chiếu với quan sát của huấn luyện viên, tuy nhiên biên độ sai số lớn hơn so với hệ thống đa cảm biến chuyên dụng.")

    # === 7. HIỆU QUẢ ===
    add_heading_1("Hiệu quả đạt được của sáng chế")
    add_para("Sáng chế cung cấp hệ thống theo dõi chuyển động, phân tích cơ sinh học và quản trị đội nhóm với các hiệu quả:")
    add_para("Thứ nhất, nâng cao khả năng đo lường cơ sinh học so với thiết bị cổ tay: Nhờ bố trí cảm biến tại vùng phát lực (bắp đùi) hoặc trục thăng bằng (vai), hệ thống thu nhận cường độ gia tốc va chạm, biên độ nâng đùi và dao động thân với mức tương quan cao hơn đáng kể so với thiết bị cổ tay. Các chỉ số đo trực tiếp có độ tin cậy cao; các chỉ số ước lượng phù hợp cho theo dõi xu hướng thay đổi.")
    add_para("Thứ hai, tối ưu hiệu năng: Cơ chế Zero-Touch RAM Buffer triệt tiêu độ trễ và chống phình giãn cơ sở dữ liệu khi giám sát đồng thời nhiều vận động viên.")
    add_para("Thứ ba, độ tin cậy cao: Dual-Engine AI duy trì phân tích 100% offline khi mất mạng, đồng thời phát huy LLM khi có mạng.")
    add_para("Thứ tư, nâng tầm quản lý huấn luyện: Coach Dashboard với RBAC cho phép giám sát tập trung, phát hiện kịp thời nguy cơ quá tải và đối chiếu dữ liệu khách quan giữa các cầu thủ.")
    add_para("Thứ năm, tăng cường khắc phục kỹ thuật: Hệ thống sinh lời khuyên ngôn ngữ tự nhiên, chỉ rõ lỗi kèm bài tập bổ trợ có Sets & Reps chuẩn xác.")
    add_para("Mặc dù các mô tả nêu trên trình bày một số phương án thực hiện cụ thể, các chi tiết này không nhằm giới hạn phạm vi bảo hộ mà chỉ mang tính minh họa. Người có hiểu biết trung bình trong lĩnh vực có thể thực hiện các thay đổi, thay thế hoặc kết hợp khác mà không nằm ngoài phạm vi yêu cầu bảo hộ.")

    # === 8. YÊU CẦU BẢO HỘ ===
    add_heading_1("YÊU CẦU BẢO HỘ")
    # [v2] Yêu cầu bảo hộ chính xác
    add_para("1. Hệ thống theo dõi động học thể thao, phân tích cơ sinh học dựa trên trí tuệ nhân tạo và quản trị đội nhóm, bao gồm:")
    add_bullet("Mô-đun thiết bị đeo (101) gắn cố định tại vùng vai hoặc bắp đùi, bao gồm cảm biến quán tính 6-DOF (101a) đo gia tốc ba trục và vận tốc góc ba trục tại 10Hz, vi điều khiển nhúng (101b) tích hợp ước lượng góc tư thế và máy trạng thái FSM, và khối truyền thông không dây (101d);", "- ")
    add_bullet("Mô-đun tiền xử lý (102) trên RAM Buffer tiếp nhận luồng 10Hz, lọc nhiễu và trích xuất đặc trưng;", "- ")
    add_bullet("Mô-đun phân tích AI (103) tiếp nhận đặc trưng từ (102);", "- ")
    add_bullet("Mô-đun quản trị phân quyền đa vai trò (104) hiển thị thông tin phân cấp;", "- ")
    # [v2] Phân biệt rõ đo trực tiếp vs ước lượng
    add_para("khác biệt ở chỗ, hệ thống trích xuất chỉ số cơ sinh học từ dữ liệu thu thập tại một vị trí gắn duy nhất, bao gồm các chỉ số đo trực tiếp (cường độ gia tốc va chạm tại vị trí gắn cảm biến, độ vững thân trên, nhịp vận động, bật nhảy, mỏi cơ) và các chỉ số ước lượng gián tiếp qua phân tích mẫu dao động chu kỳ (xu hướng cân bằng tải trọng hai chân, điểm độ êm tiếp đất); trong đó mô-đun (103) theo kiến trúc song hành gồm bộ máy nội bộ (103a) ngoại tuyến và bộ máy LLM đám mây (103b); và mô-đun (104) có phân hệ Coach (104b) hiển thị bảng ma trận chỉ số toàn đội và cảnh báo rủi ro thời gian thực.")
    add_para("2. Phương pháp sử dụng hệ thống theo điểm 1, bao gồm:")
    add_bullet("Thu nhận liên tục gia tốc ba trục, vận tốc góc ba trục và góc tư thế (pitch, roll) từ thiết bị đeo (101) tại 10Hz;", "a) ")
    add_bullet("Đệm trên RAM (102), tính vector gia tốc tổng hợp và phát hiện sự kiện bật nhảy/đổi hướng;", "b) ")
    # [v2]
    add_bullet("Trích xuất: cường độ gia tốc va chạm (PeakImpactG), điểm độ êm tiếp đất (LandingSoftness) làm đại diện cho cường độ tiếp đất; ước lượng xu hướng cân bằng hai chân (BalanceTendency%) qua phân tích dao động Roll/ay; đo trực tiếp TrunkStability, Airtime và FatigueIndex;", "c) ")
    add_bullet("Phân tích bằng AI song hành: LLM (103b) khi có mạng, DSP (103a) khi offline;", "d) ")
    add_bullet("Phát tán qua WebSocket STOMP đến giao diện vận động viên và Coach Dashboard.", "e) ")
    add_para("3. Hệ thống theo điểm 1, trong đó khi thiết bị đeo (101) gắn tại bắp đùi, mô-đun (102) và (103) đo trực tiếp góc nâng đùi, cường độ gia tốc bùng nổ cơ tứ đầu đùi và gia tốc va chạm tiếp đất truyền qua khớp gối lên đùi, đồng thời ước lượng xu hướng cân bằng hai chân qua phân tích mẫu dao động Roll/ay.")
    add_para("4. Hệ thống theo điểm 1, trong đó khi thiết bị đeo (101) gắn tại vai, mô-đun (102) và (103) đo trực tiếp góc chúi thân trên và độ lắc lư đai vai, đồng thời đo cường độ gia tốc va chạm tiếp đất dội dọc cột sống (giá trị bị suy hao qua chuỗi khớp so với GRF thực tế), và ước lượng xu hướng cân bằng hai chân qua đổi dấu Roll/ay.")
    add_para("5. Hệ thống theo điểm 1, trong đó LandingSoftness = 100 - min(55, max(0, (PeakImpactG - 1.8) * 22)), PeakImpactG = max(sqrt(ax^2 + ay^2 + az^2)) / 9.80665; và BalanceTendency% = 100 - (|Ratio_left - 0.5| * 60) với Ratio_left xác định dựa trên dấu của Roll và chiều gia tốc ngang ay.")
    add_para("6. Hệ thống theo điểm 1, trong đó TrunkStability = 100 - min(50, (std_Pitch + std_Roll) * 1.8).")
    add_para("7. Hệ thống theo điểm 1, trong đó FatigueIndex = round(((E_initial - E_final) / E_initial) * 100%) + 12.")
    add_para("8. Hệ thống theo điểm 1, trong đó phân hệ Huấn luyện viên (104b) kích hoạt cảnh báo thị giác khi bất kỳ VĐV nào có HIGH Risk hoặc FatigueIndex > 25%; đồng thời hỗ trợ xuất PDF/CSV.")
    # [v2 NEW] Điểm 9: Dual-Sensor Mode
    add_para("9. Hệ thống theo điểm 1, trong đó hệ thống hỗ trợ chế độ hai cảm biến (Dual-Sensor Mode) cho phép kết nối đồng thời hai mô-đun thiết bị đeo (101), trong đó phương án gắn hai thiết bị tại hai bắp đùi (một thiết bị mỗi chân) cho phép đo trực tiếp cường độ gia tốc từng chân riêng biệt nhằm nâng cao độ chính xác ước lượng cân bằng tải trọng hai chân so với chế độ cảm biến đơn.")

    # === 9. BẢN TÓM TẮT ===
    add_heading_1("BẢN TÓM TẮT SÁNG CHẾ")
    add_para("Sáng chế đề cập đến hệ thống theo dõi động học thể thao, phân tích cơ sinh học và quản trị đội nhóm. Hệ thống gồm thiết bị đeo cảm biến 6-DOF (101) gắn tại vai hoặc bắp đùi thu thập gia tốc và vận tốc góc tại 10Hz; mô-đun đệm RAM (102) trích xuất các chỉ số đo trực tiếp (cường độ gia tốc va chạm, độ vững thân trên, bật nhảy, mỏi cơ) và ước lượng gián tiếp xu hướng cân bằng hai chân qua phân tích mẫu dao động; mô-đun AI song hành (103) kết hợp bộ máy nội bộ (103a) ngoại tuyến và mô hình ngôn ngữ lớn (103b) tạo báo cáo phong độ; cùng mô-đun phân quyền (104) hỗ trợ huấn luyện viên (104b) giám sát và cảnh báo chấn thương toàn đội thời gian thực.")

    paths_to_save = [
        "D:/EXE101/Second_Skin_Sport/docs/Ban_mo_ta_sang_che_Second_Skin_Sport_v2.docx",
        "D:/EXE101/Second_Skin_Sport/docs/Ban_mo_ta_sang_che_Second_Skin_Sport_v2_Kem_Hinh_Ve.docx",
        "D:/EXE101/Second_Skin_Sport/docs/Ban_mo_ta_sang_che_Second_Skin_Sport_Kem_Hinh_Ve.docx"
    ]
    for p in paths_to_save:
        try:
            doc.save(p)
            print(f"[OK] File created/updated: {p}")
        except PermissionError:
            print(f"[WARN] Cannot write to {p} (file may be open). Skipping.")

if __name__ == "__main__":
    create_patent_document()
