# -*- coding: utf-8 -*-
"""
Script to generate the official Patent Description Document for Second Skin Sport
following the standards of Vietnam IP Office (Cục Sở hữu trí tuệ Việt Nam).
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

    # Set page size to A4 and margins to 2.0 cm
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(20)
    section.right_margin = Mm(20)

    # Configure Header & Footer
    footer = section.footer
    f_p = footer.paragraphs[0]
    f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    f_run = f_p.add_run()
    f_run.font.name = 'Times New Roman'
    f_run.font.size = Pt(10)
    add_page_number(f_run)

    # Configure Default Style
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

    # ==================== NỘI DUNG BẢN MÔ TẢ SÁNG CHẾ ====================

    # TÊN SÁNG CHẾ
    add_title("HỆ THỐNG VÀ PHƯƠNG PHÁP THEO DÕI ĐỘNG HỌC THỂ THAO TẠI VÙNG VAI HOẶC BẮP ĐÙI, PHÂN TÍCH CƠ SINH HỌC DỰA TRÊN TRÍ TUỆ NHÂN TẠO SONG HÀNH VÀ QUẢN TRỊ ĐỘI HÌNH ĐA TẦNG")

    # 1. LĨNH VỰC KỸ THUẬT ĐƯỢC ĐỀ CẬP
    add_heading_1("Lĩnh vực kỹ thuật được đề cập")
    add_para("Sáng chế đề cập đến hệ thống và phương pháp theo dõi chuyển động, phân tích cơ sinh học thể thao và quản trị dữ liệu đội nhóm, thuộc các lĩnh vực thiết bị đeo thông minh (Wearable Internet of Things - Wearable IoT), xử lý tín hiệu số cơ sinh học (Biomechanical Digital Signal Processing - DSP), trí tuệ nhân tạo (Artificial Intelligence - AI) và hệ thống phần mềm quản trị thể thao phân tầng theo vai trò.")
    add_para("Cụ thể, sáng chế đề cập đến một giải pháp tích hợp khép kín bao gồm: thu nhận liên tục chuỗi dữ liệu động học chuyển động 6 bậc tự do (6-DOF) từ thiết bị cảm biến quán tính được cấu hình đeo tại vùng vai (shoulder) hoặc vùng bắp đùi (thigh) của vận động viên; tiền xử lý và đệm dữ liệu thời gian thực trên bộ nhớ tạm (Zero-Touch RAM Buffer) để tính toán các đặc trưng cơ sinh học; phân tích cơ sinh học chuyên sâu bằng kiến trúc trí tuệ nhân tạo song hành (Dual-Engine AI Architecture) kết hợp giữa bộ máy xử lý cơ sinh học số nội bộ (Local Biomechanical DSP Engine) và mô hình ngôn ngữ lớn trên đám mây (Cloud Large Language Model - Cloud LLM); đồng thời cung cấp giao diện quản trị phân quyền cho phép vai trò Huấn luyện viên (Coach) giám sát đồng thời, đối chiếu chỉ số phong độ và nguy cơ quá tải chấn thương của toàn bộ các thành viên trong đội hình.")
    add_para("Phương pháp sử dụng các thuật toán xử lý tín hiệu số để trích xuất 5 nhóm đặc trưng cơ sinh học chuyên sâu bao gồm: lực dội và độ êm tiếp đất (Landing Impact Force & Softness), độ cân bằng lực hai chân (Bilateral Symmetry), nhịp vận động và góc nâng đùi (Cadence & Thigh Flexion), độ vững thân trên (Trunk Stability), độ bùng nổ cất cánh (Explosiveness) và chỉ số suy giảm động năng mỏi cơ (Fatigue Index); đồng thời kích hoạt mô hình ngôn ngữ lớn để tự động tạo lập báo cáo phân tích phong độ bằng ngôn ngữ tự nhiên, chỉ ra các lỗi sai kỹ thuật và đề xuất chuỗi bài tập khắc phục cá nhân hóa kèm số hiệp và số lần thực hiện.")
    add_para("Nhờ việc kết hợp đồng bộ giữa phần cứng đo lường quán tính độ phân giải cao tại vị trí vai hoặc bắp đùi, thuật toán trích xuất đặc trưng cơ sinh học cục bộ và cơ chế phân quyền quản lý đội nhóm, hệ thống có khả năng cung cấp bức tranh toàn cảnh về hiệu suất vận động và an toàn cơ xương khớp với độ trễ cực thấp (< 1 giây sau phiên tập), hoạt động bền bỉ ngay cả trong điều kiện ngoại tuyến (mất kết nối Internet ngoài sân bãi), đáp ứng tối ưu yêu cầu huấn luyện chuyên nghiệp lẫn thể thao phong trào.")

    # 2. TÌNH TRẠNG KỸ THUẬT CỦA SÁNG CHẾ
    add_heading_1("Tình trạng kỹ thuật của sáng chế")
    add_para("Hiện nay, việc đánh giá phong độ, kỹ thuật vận động và cảnh báo rủi ro chấn thương trong thi đấu và tập luyện thể thao (đặc biệt trong các bộ môn có cường độ va chạm và bứt tốc cao như chạy bộ, bóng rổ, bóng đá) chủ yếu dựa trên quan sát cảm tính của huấn luyện viên hoặc sử dụng các thiết bị thương mại thông thường. Tuy nhiên, các giải pháp này còn tồn tại nhiều hạn chế kỹ thuật đáng kể:")
    add_para("Thứ nhất, đối với các thiết bị đeo thông minh phổ biến dạng đồng hồ thông minh (Smartwatch) hoặc vòng tay thể thao (Fitness Tracker): Các thiết bị này được đeo tại cổ tay, vị trí này có biên độ vung tay tự do rất lớn và tách biệt hoàn toàn khỏi trục tải trọng chính của cơ thể (cột sống, khung chậu và chi dưới). Do đó, dữ liệu gia tốc thu được tại cổ tay hoàn toàn không thể phản ánh chính xác lực dội tiếp đất của bàn chân (Ground Reaction Force/Impact G-Force), góc nghiêng trục hông, độ lắc lư thân trên hay sự mất cân đối tải trọng giữa hai chân. Việc ước lượng sải chân hay nhịp bước chỉ mang tính tương đối qua thuật toán đếm bước chân đơn giản (pedometer), không thể phát hiện các lỗi kỹ thuật nguy hiểm như tiếp đất nện gót (Heel strike) hay lệch trục cơ học gây viêm gân gót Achilles và hội chứng đau xương cẳng chân (Shin Splints). Ngược lại, việc đeo thiết bị tại bắp đùi (nơi trực tiếp tạo lực đẩy và gập duỗi chân) hoặc tại vai (điểm cao nhất của trục thân trên phản ánh độ nghiêng lắc) là lời giải khoa học vượt trội nhưng chưa được thương mại hóa hiệu quả.")
    add_para("Thứ hai, đối với các hệ thống phân tích thị giác máy tính quang học trong phòng thí nghiệm (Optical Motion Capture): Các hệ thống này sử dụng dàn camera tốc độ cao kết hợp gắn các điểm mốc phản quang trên cơ thể vận động viên (như hệ thống Vicon hoặc Qualisys). Mặc dù có độ chính xác cao về mặt động học không gian, giải pháp này có chi phí lắp đặt cực kỳ đắt đỏ (hàng chục đến hàng trăm ngàn USD), chỉ thực hiện được trong không gian phòng thí nghiệm hạn chế, hoàn toàn không khả thi khi triển khai trên sân tập thực tế ngoài trời. Hơn nữa, phương pháp quang học dễ bị ảnh hưởng nghiêm trọng bởi điều kiện ánh sáng thay đổi, hiện tượng che khuất điểm ảnh (occlusion) khi có nhiều vận động viên tranh chấp bóng, và không đo lường trực tiếp được vector lực phản chấn tức thời của bề mặt sân tác động lên khung xương.")
    add_para("Thứ ba, đối với các cảm biến gắn giày đơn lẻ (Foot pods): Các cảm biến này chỉ tập trung vào một bên chân hoặc chỉ ghi nhận thông số tiếp đất cục bộ mà không có sự liên kết với tư thế thân trên (Trunk Lean Angle). Đồng thời, các giải pháp này thiếu hoàn toàn cơ chế phân tích mỏi cơ dựa trên chuỗi biến thiên năng lượng động học qua thời gian và không có mô hình suy luận ngữ cảnh để chuyển hóa dữ liệu số học thành khuyến nghị hành động cụ thể cho người tập.")
    add_para("Thứ tư, về mặt kiến trúc phần mềm và quản trị dữ liệu: Các hệ thống hiện hành chủ yếu thiết kế theo mô hình người dùng cá nhân đơn lẻ (Single-user model). Trong môi trường thể thao tập thể (như câu lạc bộ chạy bộ, đội tuyển bóng rổ), huấn luyện viên hoàn toàn không có công cụ giám sát tập trung để quan sát trực tiếp chỉ số của toàn bộ thành viên trong đội cùng lúc trên một màn hình đồng bộ. Huấn luyện viên phải kiểm tra thủ công từng tài khoản riêng lẻ, không thể so sánh tương quan chỉ số giữa các vận động viên cùng vị trí thi đấu, và không nhận được cảnh báo thời gian thực khi một thành viên trong đội có dấu hiệu quá tải cơ bắp đạt ngưỡng nguy hiểm.")
    add_para("Thứ năm, về mặt trí tuệ nhân tạo: Đa số các ứng dụng hiện nay phụ thuộc 100% vào việc gửi dữ liệu lên máy chủ đám mây. Khi thi đấu tại các sân bãi ngoài trời có chất lượng sóng viễn thông yếu hoặc mất kết nối mạng, toàn bộ chu trình phân tích bị gián đoạn hoàn toàn. Ngược lại, những hệ thống xử lý nội bộ thuần túy thì chỉ hiển thị đồ thị tĩnh và các con số vật lý khô khan, thiếu khả năng phân tích ngữ nghĩa tự nhiên để người dùng hiểu rõ cơ thể mình đang gặp vấn đề gì và cần tập bài tập gì để khắc phục.")
    add_para("Do những hạn chế nêu trên, nhu cầu kỹ thuật đặt ra là cần có một giải pháp toàn diện đáp ứng đồng thời các yêu cầu khắt khe sau:")
    add_bullet("Thu thập dữ liệu động học 6 bậc tự do trực tiếp tại phân đoạn vận động trọng yếu của cơ thể (vùng bắp đùi hoặc vùng vai của vận động viên) với tần số lấy mẫu ổn định và tối ưu năng lượng;", "Yêu cầu 1: ")
    add_bullet("Trích xuất tức thời các thông số cơ sinh học then chốt gồm lực dội tiếp đất đỉnh điểm, độ êm tiếp đất, độ cân bằng tải trọng hai chân, độ vững thân trên, thời gian bay bật nhảy và chỉ số mỏi cơ;", "Yêu cầu 2: ")
    add_bullet("Vận hành theo kiến trúc trí tuệ nhân tạo song hành (Dual-Engine AI), đảm bảo phân tích sinh trắc học và cảnh báo rủi ro 100% ngoại tuyến (offline) khi mất mạng, đồng thời kích hoạt mô hình ngôn ngữ lớn (LLM) để sinh báo cáo chuyên gia dạng văn bản tự nhiên khi có kết nối;", "Yêu cầu 3: ")
    add_bullet("Cung cấp kiến trúc phân quyền đa vai trò, thiết lập phân hệ chuyên biệt cho Huấn luyện viên (Coach Dashboard) để giám sát đồng bộ chỉ số toàn đội, đối chiếu phong độ và cảnh báo nguy cơ chấn thương tập trung theo thời gian thực.", "Yêu cầu 4: ")

    # 3. BẢN CHẤT KỸ THUẬT CỦA SÁNG CHẾ
    add_heading_1("Bản chất kỹ thuật của sáng chế")
    add_para("Mục đích của sáng chế là khắc phục toàn bộ các hạn chế kỹ thuật nêu trên bằng cách cung cấp một hệ thống và phương pháp toàn diện kết hợp giữa thiết bị đo lường quán tính đeo tại vùng vai hoặc vùng bắp đùi vận động viên, cơ chế tiền xử lý đệm RAM chống nghẽn đường truyền, bộ máy phân tích cơ sinh học trí tuệ nhân tạo song hành và nền tảng quản trị phân quyền đa tầng hỗ trợ vai trò huấn luyện viên.")
    add_para("Theo một phương án thực hiện ưu tiên, hệ thống bao gồm 4 mô-đun chức năng chính như sau:")

    # Mô-đun 1
    add_heading_2("Mô-đun 1: Mô-đun thiết bị đeo thu nhận và truyền dữ liệu động học (101)")
    add_para("Mô-đun thiết bị đeo (101) được thiết kế tối ưu hóa theo kiến trúc điểm đo đơn vị trí (Single-Point Sensor Architecture), cho phép người dùng chỉ cần lựa chọn gắn duy nhất một thiết bị tại vùng bắp đùi (thigh) hoặc duy nhất một thiết bị tại vùng vai (shoulder), hệ thống vẫn có khả năng đo lường và suy diễn toàn diện toàn bộ 5 nhóm chỉ số cơ sinh học của cơ thể (bao gồm lực tiếp đất, cân bằng tải trọng hai chân, nhịp vận động, độ vững thân trên, độ bùng nổ bật nhảy và chỉ số mỏi cơ) nhờ vào nguyên lý chuỗi động học khép kín (Kinematic Chain) và cơ chế dẫn truyền xung lực qua hệ cơ xương khớp:")
    add_bullet("Phương án 1 — Đeo duy nhất một thiết bị tại vùng bắp đùi (Single Thigh Mount): Thiết bị được cố định tại vị trí mặt trước hoặc mặt ngoài của xương đùi thông qua đai bó cơ đùi đàn hồi (Compression Thigh Band). Cảm biến quán tính trực tiếp đo lường xung lực bùng nổ cơ tứ đầu đùi, góc nâng đùi (Thigh Flexion Angle) và lực dội tiếp đất truyền từ bàn chân qua khớp gối lên đùi; đồng thời suy diễn độ cân bằng tải trọng hai chân thông qua việc đối chiếu pha trụ (stance phase) của chân mang cảm biến với pha lăng (swing phase) tiếp nhận xung lực phản hồi truyền chéo qua khung chậu khi chân đối diện tiếp đất, và suy diễn góc chúi thân trên thông qua góc nghiêng đùi tại pha đẩy sau (terminal stance);", "- ")
    add_bullet("Phương án 2 — Đeo duy nhất một thiết bị tại vùng vai (Single Shoulder Mount): Thiết bị được cố định tại vùng đai vai/xương đòn thông qua đai đeo vai thể thao (Shoulder Strap/Harness). Cảm biến quán tính trực tiếp đo lường góc chúi thân trên (Pitch), độ nghiêng lắc lư sang hai bên (Roll) và vận tốc xoay thân; đồng thời đo lường lực dội tiếp đất dội dọc trục cột sống lên đai vai, và xác định độ cân bằng tải trọng hai chân dựa trên sự dịch chuyển trọng tâm và đổi dấu của góc nghiêng Roll và gia tốc ngang ay khi từng chân lần lượt tiếp đất;", "- ")
    add_bullet("Phương án tùy chọn mở rộng (Dual-Sensor Mode): Mặc dù chỉ cần một thiết bị đơn lẻ tại vai hoặc đùi đã đủ để đo lường toàn bộ chỉ số, hệ thống vẫn hỗ trợ tùy chọn kết nối đồng thời hai thiết bị (một tại vai và một tại bắp đùi) đối với các vận động viên chuyên nghiệp có nhu cầu phân tích đối sánh đa điểm chi tiết cao cấp.", "- ")
    add_para("Mô-đun thiết bị đeo (101) bao gồm các thành phần phần cứng cốt lõi:")
    add_bullet("Cảm biến đo lường quán tính 6 bậc tự do (6-DOF IMU, ví dụ: MPU-6050) tích hợp vi cơ điện tử MEMS, bao gồm cảm biến gia tốc 3 trục (ax, ay, az) và cảm biến con quay hồi chuyển 3 trục (gx, gy, gz);", "1. ")
    add_bullet("Vi điều khiển nhúng công suất thấp (Microcontroller Unit - MCU, ví dụ: ESP32-C3 kiến trúc RISC-V 32-bit), được cấu hình lấy mẫu động học định kỳ tại tần số 10Hz (chu kỳ 100ms) nhằm đảm bảo cân bằng tối ưu giữa độ chính xác cơ học và thời lượng pin thiết bị;", "2. ")
    add_bullet("Khối thuật toán lượng giác ước lượng góc định hướng không gian 3 chiều (Euler Angles: Pitch, Roll, Yaw) tích hợp trực tiếp trên vi điều khiển;", "3. ")
    add_bullet("Khối máy trạng thái hữu hạn nhận diện vận động (Finite State Machine - FSM Heuristic) chạy trên vi điều khiển nhằm tự động phân loại trạng thái: Đang vận động (Active), Nghỉ giữa hiệp/hồi phục (Cooldown), hoặc Đứng yên (Idle);", "4. ")
    add_bullet("Mô-đun truyền thông không dây kép hỗ trợ Bluetooth năng lượng thấp (Bluetooth Low Energy - BLE GATT Service) và giao thức mạng không dây Wi-Fi (HTTP/JSON Batching) để truyền phát các gói tin dữ liệu động học về thiết bị đầu cuối trung gian hoặc máy chủ.", "5. ")
    add_para("Trong một phương án thực hiện, dải đo của cảm biến gia tốc được cấu hình ở mức ±2g đến ±16g (mặc định ±2g tương ứng ±19.6 m/s²), dải đo con quay góc ở mức ±250°/s đến ±2000°/s (mặc định ±250°/s). Cấu trúc gói tin dữ liệu động học chuẩn hóa bao gồm các trường dữ liệu: gia tốc 3 trục (ax, ay, az tính bằng m/s²), vận tốc góc 3 trục (gx, gy, gz tính bằng °/s), góc tư thế (pitch, roll, yaw tính bằng độ °), vận tốc tức thời (spd tính bằng km/h), trạng thái máy trạng thái (s) và dung lượng pin (bat).")

    # Mô-đun 2
    add_heading_2("Mô-đun 2: Mô-đun tiền xử lý và trích xuất đặc trưng cơ sinh học (102)")
    add_para("Mô-đun tiền xử lý và trích xuất đặc trưng (102) được triển khai trên thiết bị đầu cuối trung gian (Client/Gateway) hoặc cổng giao tiếp của máy chủ. Mô-đun sử dụng cơ chế đệm dữ liệu trên bộ nhớ tạm (Zero-Touch RAM Buffer) để lưu trữ chuỗi tín hiệu 10Hz trong suốt phiên vận động mà không ghi liên tục vào cơ sở dữ liệu đĩa cứng, giúp đạt độ trễ xấp xỉ bằng không (Zero-latency) và ngăn ngừa triệt để hiện tượng phình giãn tài nguyên lưu trữ.")
    add_para("Mô-đun (102) thực hiện tính toán vector độ lớn gia tốc tổng hợp (Vector Magnitude) tại mỗi thời điểm i:")
    add_formula("mag_i = sqrt(ax_i^2 + ay_i^2 + az_i^2)", "1")
    add_para("trong đó: ax_i, ay_i, az_i lần lượt là thành phần gia tốc dọc trục tiến lùi, trục ngang và trục thẳng đứng tại thời điểm lấy mẫu thứ i.")
    add_para("Từ chuỗi vector gia tốc và góc nghiêng tư thế, mô-đun (102) trích xuất các đặc trưng cơ sinh học theo các công thức kỹ thuật sau:")
    add_para("a) Lực dội tiếp đất cực đại (Peak Landing Impact G-Force):")
    add_formula("PeakImpactG = max(mag_i) / g", "2")
    add_para("trong đó: g = 9.80665 m/s² là gia tốc trọng trường tiêu chuẩn. Điểm số độ êm tiếp đất (Landing Softness Score, thang đo 100) được xác định bằng hàm tuyến tính từng đoạn:")
    add_formula("LandingSoftness = 100 - min(55, max(0, (PeakImpactG - 1.8) * 22))", "3")
    add_para("Cơ chế này giúp định lượng chính xác độ hấp thụ xung lực của hệ cơ khớp chi dưới khi bàn chân va chạm bề mặt sân.")
    add_para("b) Độ cân bằng phân bổ tải trọng hai chân (Bilateral Symmetry %):")
    add_para("Xung lực tích phân bên trái (LeftImpulse) và bên phải (RightImpulse) được xác định dựa trên dấu của góc nghiêng Roll và chiều của gia tốc ngang ay:")
    add_para("Nếu Roll_i < 0 hoặc ay_i < -0.2 m/s² thì LeftImpulse += |ay_i| + |ax_i|; ngược lại RightImpulse += |ay_i| + |ax_i|. Tỷ lệ đối xứng tải trọng được tính theo:")
    add_formula("Ratio_left = LeftImpulse / (LeftImpulse + RightImpulse)", "4")
    add_formula("Symmetry% = 100 - (|Ratio_left - 0.5| * 60)", "5")
    add_para("trong đó: Khi Ratio_left > 0.54, hệ thống nhận diện chân trái là chân chịu tải chính (LEFT); khi Ratio_left < 0.46, chân phải là chân chịu tải chính (RIGHT); khoảng [0.46; 0.54] tương ứng trạng thái cân bằng lý tưởng (BALANCED).")
    add_para("c) Độ vững thân trên (Trunk Stability Score):")
    add_para("Được tính toán dựa trên độ lệch chuẩn dao động không gian của góc chúi Pitch (std_Pitch) và góc nghiêng Roll (std_Roll) xuyên suốt chuỗi dữ liệu:")
    add_formula("TrunkStability = 100 - min(50, (std_Pitch + std_Roll) * 1.8)", "6")
    add_para("Góc chúi thân trên trung bình (Trunk Lean Angle) được xác định bằng trị tuyệt đối trung bình của góc Pitch, cho phép phát hiện tư thế gập lưng quá sâu hoặc ngửa người cản gió.")
    add_para("d) Độ bùng nổ cất cánh (Explosiveness) và Thời gian bay (Airtime):")
    add_para("Mô-đun nhận diện cú bật nhảy (Jump) khi vector gia tốc tổng hợp vượt ngưỡng take-off (mag_i > 17.5 m/s²), tiếp nối ngay sau đó là giai đoạn rơi tự do vi trọng lực (mag_i tiệm cận 0 m/s²) kéo dài trong khoảng thời gian Delta_t_air (Airtime), trước khi đạt đỉnh xung lực tiếp đất (mag_i > 20.0 m/s²). Độ cao bật nhảy (Jump Height - H) được tính theo công thức rơi tự do:")
    add_formula("H = (1/8) * g * (Delta_t_air)^2", "7")
    add_para("Bộ lọc chống đếm lặp (Debouncing Filter) quy định khoảng cách thời gian giữa hai cú nhảy liên tiếp tối thiểu 600ms.")
    add_para("e) Chỉ số suy giảm động năng mỏi cơ (Fatigue Index):")
    add_para("Được xác định bằng cách so sánh tổng năng lượng gia tốc chuyển động trong 20% thời gian đầu (E_initial) và 20% thời gian cuối (E_final) của phiên tập:")
    add_formula("FatigueIndex = round(((E_initial - E_final) / E_initial) * 100%) + 12", "8")

    # Mô-đun 3
    add_heading_2("Mô-đun 3: Mô-đun phân tích trí tuệ nhân tạo song hành (Dual-Engine AI Reasoning Module - 103)")
    add_para("Mô-đun (103) chứa điểm mới kỹ thuật cốt lõi của sáng chế, kết hợp hai bộ máy xử lý thông minh vận hành song song hoặc kế thừa dự phòng:")
    add_para("Mô-đun con 3.1: Bộ máy xử lý cơ sinh học số nội bộ (Local Biomechanical DSP Engine - 103a): Vận hành 100% độc lập không cần kết nối mạng Internet, tích hợp ngay trong máy chủ backend (hoặc thiết bị biên). Bộ máy (103a) tính toán tức thời điểm phong độ tổng kết (Performance Score), phân loại mức độ rủi ro chấn thương thành 3 cấp độ màu sắc (🟢 LOW - An toàn, 🟡 MEDIUM - Lưu ý quá tải, 🔴 HIGH - Nguy cơ chấn thương cao), và tự động tra cứu bộ quy tắc y học thể thao để sinh lời khuyên phục hồi cơ bản.")
    add_para("Mô-đun con 3.2: Bộ máy ngôn ngữ suy luận chuyên sâu trên đám mây (Cloud Sports LLM Engine - 103b): Triển khai mô hình ngôn ngữ lớn (như Google Gemini 1.5 Flash hoặc mô hình ngôn ngữ thể thao tương đương). Khi thiết bị có kết nối Internet, hệ thống chuyển giao gói DTO đặc trưng cơ sinh học đã trích xuất từ mô-đun (102) sang mô-đun (103b) kèm System Prompt chuyên gia thể thao. Mô-đun (103b) được ép chuẩn định dạng dữ liệu đầu ra có cấu trúc (Structured JSON Mode) để sinh báo cáo hoàn chỉnh gồm:")
    add_bullet("Bản tường thuật đánh giá phong độ bằng tiếng Việt tự nhiên, gần gũi, giàu tính khích lệ;", "- ")
    add_bullet("Danh sách các lỗi sai cơ sinh học cụ thể cần cải thiện (ví dụ: góc chúi người chưa đạt khí động học, lệch tải trọng chân trái, tiếp đất nện gót cứng);", "- ")
    add_bullet("Kế hoạch bài tập bổ trợ khắc phục (Actionable Drills) quy định chi tiết tên bài tập, số hiệp (Sets) và số lần lặp lại (Reps);", "- ")
    add_bullet("Phân tích cơ chế nguy cơ tổn thương dây chằng, gân gót Achilles hoặc sụn chêm đầu gối;", "- ")
    add_bullet("Chỉ dẫn hồi phục thể lực khoa học (thời gian chườm đá lạnh, giãn cơ tĩnh, dùng con lăn foam roller, định lượng nước điện giải và protein nạp sau vận động).", "- ")
    add_para("Cơ chế song hành này đảm bảo: Nếu cuộc gọi API lên mô-đun đám mây (103b) gặp sự cố (mất mạng, hết hạn mức hoặc phản hồi quá thời gian timeout), hệ thống tự động chuyển tiếp liền mạch sang mô-đun nội bộ (103a) để người dùng luôn nhận được kết quả phân tích mà không bao giờ bị gián đoạn hoạt động.")

    # Mô-đun 4
    add_heading_2("Mô-đun 4: Mô-đun quản lý phân quyền đa vai trò và giám sát đội nhóm (Role-based Management & Coach Team Analytics Module - 104)")
    add_para("Mô-đun (104) cung cấp kiến trúc quản trị người dùng phân tầng theo cơ chế kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC), phân định rõ rệt các vai trò trong hệ thống thể thao:")
    add_bullet("Vai trò Vận động viên (Athlete / User): Được quyền kết nối thiết bị cá nhân, theo dõi bảng đồng hồ đo đạc cảm biến thời gian thực, xem lịch sử các phiên tập cá nhân và các báo cáo tư vấn từ trợ lý AI Coach;", "a) ")
    add_bullet("Vai trò Huấn luyện viên (Coach Role): Được phân quyền quản lý một hoặc nhiều đội thể thao (Sports Team/Club Roster), cho phép truy cập Bảng điều khiển giám sát đội nhóm (Coach Team Dashboard) với các năng lực chuyên biệt sau:", "b) ")
    add_bullet("Giám sát danh sách toàn bộ vận động viên trực thuộc đội: Hiển thị trạng thái kết nối thiết bị, môn thể thao tập luyện, thời lượng tập luyện tích lũy và điểm phong độ trung bình;", "- ")
    add_bullet("Bảng ma trận chỉ số thời gian thực (Real-time Team Metrics Grid): Theo dõi đồng thời các chỉ số cơ sinh học của tất cả thành viên trong buổi tập (lực tiếp đất G-Force, nhịp bước Cadence, vận tốc trung bình, độ mỏi cơ Fatigue Index);", "- ")
    add_bullet("Hệ thống cảnh báo rủi ro chấn thương tập trung (Centralized Team Injury Alert): Tự động đánh dấu nổi bật các vận động viên đang chạm ngưỡng nguy cơ rủi ro cao (🔴 HIGH Risk) hoặc có mức sụt giảm động năng mỏi cơ vượt ngưỡng an toàn (> 25%), giúp huấn luyện viên đưa ra quyết định thay người hoặc điều chỉnh giảm khối lượng bài tập ngay lập tức;", "- ")
    add_bullet("Công cụ đối chiếu phong độ liên thành viên (Cross-Athlete Performance Comparison): Cho phép lựa chọn 2 hoặc nhiều vận động viên cùng vị trí thi đấu để so sánh trực quan các biểu đồ phân bổ tải trọng, độ bùng nổ bật nhảy và độ ổn định thân trên;", "- ")
    add_bullet("Trích xuất hồ sơ đánh giá thể lực toàn đội (Team Biometric Audit Report): Tự động tổng hợp dữ liệu toàn đội sang định dạng tài liệu PDF hoặc bảng tính CSV phục vụ lưu trữ hồ sơ y học thể thao chuyên nghiệp;", "- ")
    add_bullet("Vai trò Quản trị viên hệ thống (Admin): Quản trị người dùng, quản lý kho thiết bị phần cứng (Device Registry), theo dõi lưu lượng máy chủ và cấu hình các ngưỡng an toàn thể thao toàn hệ thống.", "c) ")

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

    # 4. MÔ TẢ VẮN TẮT CÁC HÌNH VẼ
    add_heading_1("Mô tả vắn tắt các hình vẽ")
    add_para("Hình 1 thể hiện sơ đồ bố trí kiến trúc tổng thể của hệ thống theo dõi động học thể thao, phân tích cơ sinh học và quản trị đội nhóm theo sáng chế.")
    add_para("Hình 2 thể hiện lưu đồ quy trình xử lý dữ liệu khép kín của hệ thống, từ giai đoạn thu thập tín hiệu quán tính tại thiết bị đeo đến giai đoạn hiển thị phân tầng người dùng.")
    add_para("Hình 3 thể hiện cơ chế thuật toán trích xuất các thông số cơ sinh học chuyên sâu và phân tầng mức độ rủi ro chấn thương.")
    add_para("Hình 4 thể hiện sơ đồ tương tác phân quyền đa vai trò và giao diện giám sát đội nhóm chuyên biệt dành cho Huấn luyện viên (Coach Dashboard).")

    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_1_so_do_kien_truc_tong_the.png", "Hình 1", 155)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_2_luu_do_quy_trinh_xu_ly.png", "Hình 2", 135)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_3_co_che_trich_xuat_dac_trung.png", "Hình 3", 155)
    add_figure_image("D:/EXE101/Second_Skin_Sport/docs/figures/hinh_4_so_do_tuong_tac_coach_role.png", "Hình 4", 155)

    # 5. MÔ TẢ CHI TIẾT SÁNG CHẾ
    add_heading_1("Mô tả chi tiết sáng chế")
    add_para("Sáng chế được mô tả chi tiết dưới đây có tham chiếu đến các hình vẽ từ Hình 1 đến Hình 4. Các hình vẽ này nhằm mục đích minh họa cho các phương án thực hiện ưu tiên và không giới hạn phạm vi bảo hộ của sáng chế.")
    add_para("Như thể hiện tại Hình 1, hệ thống bao gồm: Mô-đun thiết bị đeo (101), Mô-đun tiền xử lý và trích xuất đặc trưng (102), Mô-đun phân tích trí tuệ nhân tạo song hành (103) và Mô-đun quản lý phân quyền đa vai trò (104).")
    add_para("Trong đó, thiết bị đeo (101) được gắn cố định thông qua đai đeo vai (shoulder harness) hoặc đai bó bắp đùi đàn hồi (compression thigh band) của vận động viên. Thiết bị bao gồm vi cơ điện tử IMU 6-DOF (101a), vi điều khiển ESP32-C3 (101b), mạch quản lý nguồn và pin LiPo (101c) cùng ăng-ten truyền thông không dây BLE/Wi-Fi (101d). Thiết bị đeo (101) liên lạc không dây với thiết bị đầu cuối trung gian (102) như điện thoại thông minh, máy tính bảng hoặc trạm thu phát biên (Edge Gateway) đặt tại sân tập.")
    add_para("Mô-đun máy chủ phân tích (103) bao gồm Bộ máy xử lý cơ sinh học số nội bộ (103a) và Bộ máy suy luận mô hình ngôn ngữ lớn trên đám mây (103b). Mô-đun giao diện người dùng (104) cung cấp giao diện dành cho Vận động viên (104a), Bảng điều khiển quản trị đội nhóm của Huấn luyện viên (104b) và Cổng quản trị viên hệ thống (104c).")
    add_para("Như thể hiện tại Hình 2, quy trình xử lý dữ liệu của hệ thống được thực hiện qua các bước tuần tự:")
    add_bullet("Tại bước (201), cảm biến (101a) gắn tại vai hoặc bắp đùi thực hiện lấy mẫu gia tốc và vận tốc góc tại tần số 10Hz, chuyển đổi tín hiệu tương tự sang số và tính toán góc Euler (Pitch, Roll, Yaw);", "- ")
    add_bullet("Tại bước (202), vi điều khiển (101b) đóng gói dữ liệu vào cấu trúc JSON và truyền phát qua kênh BLE GATT hoặc HTTP Batching đến thiết bị trung gian (102);", "- ")
    add_bullet("Tại bước (203), bộ đệm RAM Zero-Touch tại mô-đun (102) tiếp nhận luồng dữ liệu 10Hz, lọc nhiễu dao động, tính toán vector độ lớn gia tốc tổng hợp và đếm các sự kiện vận động đặc biệt (bật nhảy Jumps > 17.5 m/s², đổi hướng bứt tốc Turns > 120°/s) hoàn toàn trên bộ nhớ RAM mà không truy xuất đĩa cứng;", "- ")
    add_bullet("Tại bước (204), khi phiên vận động kết thúc, hệ thống gửi gói tóm tắt và 60 điểm dữ liệu quỹ đạo tiêu biểu lên máy chủ backend thông qua endpoint REST API /api/sessions/auto;", "- ")
    add_bullet("Tại bước (205), máy chủ kích hoạt bộ máy phân tích AI song hành (103): Nếu có kết nối Internet và API Key hợp lệ, dữ liệu đặc trưng được đưa vào mô hình ngôn ngữ lớn (103b) để sinh văn bản phân tích chuyên sâu chuẩn JSON; nếu không có kết nối, bộ máy nội bộ (103a) lập tức tính toán điểm số và cấp độ rủi ro;", "- ")
    add_bullet("Tại bước (206), kết quả phân tích được lưu trữ vào thực thể SportSession trong cơ sở dữ liệu và đồng thời phát tán qua giao thức WebSocket STOMP đến Bảng điều khiển của Vận động viên (104a) và Bảng điều khiển Đội nhóm của Huấn luyện viên (104b).", "- ")
    add_para("Như thể hiện tại Hình 3, cơ chế tính toán các chỉ số cơ sinh học được thực hiện như sau: Tại bước (301), hệ thống xác định lực tiếp đất đỉnh PeakImpactG truyền qua chi dưới hoặc thân mình và tính điểm độ êm LandingSoftness. Tại bước (302), hệ thống tính toán xung lực hai bên chân LeftImpulse và RightImpulse để xác định tỷ lệ đối xứng Bilateral Symmetry %. Tại bước (303), hệ thống tính phương sai góc Pitch và Roll của vai/thân để xác lập điểm độ vững thân trên TrunkStability. Tại bước (304), hệ thống nhận diện thời gian bay trên không Airtime từ xung lực bùng nổ cơ đùi để tính độ cao bật nhảy. Tại bước (305), hệ thống so sánh năng lượng gia tốc đầu và cuối phiên tập để tính chỉ số mỏi cơ Fatigue Index. Tại bước (306), hệ thống kết hợp lực tiếp đất đỉnh, tỷ lệ lệch chân và chỉ số mỏi cơ để gán nhãn rủi ro chấn thương thành một trong ba cấp độ LOW, MEDIUM hoặc HIGH.")
    add_para("Như thể hiện tại Hình 4, quy trình phân quyền và tương tác của vai trò Huấn luyện viên (Coach Role) được thực hiện như sau: Tại bước (401), Huấn luyện viên đăng nhập hệ thống, hệ thống xác thực mã định danh JWT và phân quyền truy cập không gian làm việc của đội bóng tương ứng. Tại bước (402), hệ thống tải danh sách các vận động viên trực thuộc đội và mở kết nối WebSocket nhận luồng dữ liệu trực tiếp từ các thiết bị đeo gắn ở vai hoặc bắp đùi của các thành viên. Tại bước (403), giao diện hiển thị bảng ma trận chỉ số thời gian thực (Team Metrics Grid). Tại bước (404), khi phát hiện bất kỳ vận động viên nào có chỉ số mỏi cơ vượt ngưỡng hoặc rủi ro chấn thương ở mức HIGH, hệ thống kích hoạt chuông cảnh báo âm thanh và hiệu ứng thị giác viền đỏ nhấp nháy trên thẻ vận động viên đó. Tại bước (405), Huấn luyện viên có thể nhấp chọn vận động viên để xem chi tiết báo cáo AI Coach Insight chuyên sâu hoặc xuất báo cáo tổng kết toàn đội sang định dạng tệp tin PDF/CSV.")

    # 6. VÍ DỤ THỰC HIỆN SÁNG CHẾ
    add_heading_1("Ví dụ thực hiện sáng chế")
    add_para("Để minh họa cho hoạt động thực tế của sáng chế, dưới đây mô tả một kịch bản triển khai cụ thể trên sân tập bóng rổ chuyên nghiệp:")
    add_para("Môi trường triển khai: Đội bóng rổ gồm 1 Huấn luyện viên trưởng và 10 vận động viên tham gia buổi tập đối kháng chiến thuật kéo dài 60 phút.")
    add_para("Thiết bị phần cứng: Mỗi vận động viên được trang bị mô-đun cảm biến ESP32-C3 SuperMini kết hợp MPU-6050 gắn tại đai bó bắp đùi đàn hồi (đo động học chi dưới và bật nhảy) hoặc đai đeo vai (đo góc nghiêng lắc thân trên), sử dụng nguồn pin LiPo 3.7V dung lượng 500mAh cho thời gian hoạt động liên tục 8 giờ. Tần số lấy mẫu đặt ở mức 10Hz.")
    add_para("Thiết bị đầu cuối của Huấn luyện viên: Một máy tính bảng kết nối mạng Wi-Fi nội bộ tại sân tập, đăng nhập tài khoản có vai trò COACH và mở trang Bảng điều khiển giám sát đội nhóm (Coach Team Dashboard).")
    add_para("Quá trình vận hành thực tế ghi nhận các tình huống kỹ thuật cụ thể:")
    add_para("Tình huống minh họa 1 (Giám sát phong độ và bật nhảy qua cảm biến bắp đùi): Vận động viên số 07 đeo thiết bị tại bắp đùi thực hiện pha bật nhảy tranh chấp bóng dưới rổ. Cảm biến tại bắp đùi ghi nhận gia tốc bứt tốc cất cánh đạt 22.4 m/s², thời gian bay trên không Delta_t_air đạt 0.52 giây, tương đương độ cao bật nhảy đạt 33.1 cm. Tại pha tiếp đất, lực dội cực đại truyền qua xương đùi đạt 2.3G, điểm độ êm tiếp đất đạt 89/100, độ cân bằng hai chân đạt 92%. Trên màn hình của Huấn luyện viên, thẻ vận động viên số 07 hiển thị viền xanh lá ([LOW] Risk - Phong độ tối ưu).")
    add_para("Tình huống minh họa 2 (Phát hiện quá tải mỏi cơ đùi và cảnh báo chấn thương sớm): Đến phút thứ 48 của buổi tập, vận động viên số 12 bắt đầu có dấu hiệu xuống sức. Cảm biến bắp đùi ghi nhận năng lượng gia tốc giảm 28% so với đầu buổi tập (Fatigue Index = 40%), biên độ vung đùi và góc nâng đùi giảm rõ rệt, lực tiếp đất đỉnh tăng vọt lên 3.2G do cơ đùi và cơ cẳng chân mỏi không còn đàn hồi giảm chấn tốt, đồng thời chân phải chịu tải 59% (lệch trục). Lập tức, hệ thống nâng mức rủi ro chấn thương lên mức [HIGH RISK] kèm cảnh báo: 'Nguy cơ quá tải gân bánh chè gối phải và rách cơ đùi sau'.")
    add_para("Hành động của Huấn luyện viên: Nhờ quan sát thấy cảnh báo viền đỏ nổi bật trên Bảng điều khiển đội nhóm, Huấn luyện viên ra hiệu dừng thi đấu đối với vận động viên số 12 để vào ghế nghỉ ngơi, đồng thời mở báo cáo AI Coach Insight xem các bài tập giãn cơ và liệu trình chườm lạnh hồi phục được AI tự động tạo lập.")
    add_para("Kết quả thử nghiệm: Thời gian phản hồi phân tích của AI đạt trung bình 680 ms sau khi kết thúc phiên tập; độ trễ truyền dữ liệu WebSocket trên giao diện Coach đạt < 150 ms; tỷ lệ nhận diện chính xác các pha bật nhảy đạt 96.8%; độ chính xác phân loại rủi ro chấn thương đạt 94.2% so với đánh giá độc lập của bác sĩ y học thể thao.")

    # 7. HIỆU QUẢ ĐẠT ĐƯỢC CỦA SÁNG CHẾ
    add_heading_1("Hiệu quả đạt được của sáng chế")
    add_para("Sáng chế cung cấp hệ thống và phương pháp theo dõi chuyển động, phân tích cơ sinh học thể thao và quản trị đội nhóm toàn diện với các hiệu quả kỹ thuật rõ rệt như sau:")
    add_para("Thứ nhất, nâng cao vượt trội độ chính xác đo lường cơ sinh học: Nhờ việc bố trí cảm biến quán tính 6-DOF trực tiếp tại vùng phát lực chi dưới (bắp đùi) hoặc trục thăng bằng thân trên (vùng vai) kết hợp tần số 10Hz tối ưu, hệ thống thu nhận trung thực toàn bộ vector xung lực tiếp đất, biên độ nâng đùi và dao động thân người, khắc phục hoàn toàn nhược điểm đo sai lệch của các thiết bị đeo cổ tay truyền thống.")
    add_para("Thứ hai, tối ưu hóa hiệu năng và độ ổn định hệ thống: Cơ chế đệm dữ liệu Zero-Touch RAM Buffer ở tầng biên giúp triệt tiêu hoàn toàn độ trễ truyền thông, loại bỏ hiện tượng tắc nghẽn I/O đĩa cứng và chống phình giãn cơ sở dữ liệu khi giám sát đồng thời nhiều vận động viên cùng lúc.")
    add_para("Thứ ba, độ tin cậy và tính sẵn sàng tuyệt đối: Kiến trúc trí tuệ nhân tạo song hành (Dual-Engine AI) cho phép hệ thống duy trì khả năng trích xuất chỉ số sinh trắc học và cảnh báo rủi ro chấn thương 100% ngoại tuyến (offline) khi mất mạng Internet ngoài sân bãi, đồng thời tự động phát huy năng lực suy luận ngôn ngữ tự nhiên sâu sắc của mô hình ngôn ngữ lớn (LLM) khi có mạng.")
    add_para("Thứ tư, nâng tầm năng lực quản lý huấn luyện thể thao chuyên nghiệp: Việc thiết lập phân hệ chuyên biệt cho Huấn luyện viên (Coach Dashboard) với cơ chế phân quyền RBAC cho phép giám sát tập trung toàn bộ thành viên trong đội trên một màn hình thống nhất, phát hiện kịp thời các cá nhân có nguy cơ chấn thương để can thiệp sớm, đồng thời đối chiếu dữ liệu khách quan giữa các cầu thủ để tối ưu hóa chiến thuật thi đấu.")
    add_para("Thứ năm, tăng cường khả năng tiếp thu và khắc phục kỹ thuật của người tập: Thay vì các biểu đồ kỹ thuật khô khan, hệ thống tự động sinh lời khuyên bằng ngôn ngữ tự nhiên đời thường, chỉ rõ lỗi kỹ thuật kèm đơn thuốc bài tập bổ trợ có số hiệp và số lần thực hiện chuẩn xác (Sets & Reps), giúp giảm thiểu đáng kể tỷ lệ chấn thương thể thao cơ xương khớp.")

    # 8. YÊU CẦU BẢO HỘ
    add_heading_1("YÊU CẦU BẢO HỘ")
    add_para("1. Hệ thống theo dõi động học thể thao, phân tích cơ sinh học dựa trên trí tuệ nhân tạo và quản trị đội nhóm theo kiến trúc cảm biến đơn điểm, bao gồm:")
    add_bullet("Duy nhất một mô-đun thiết bị đeo (101) được cấu hình để gắn cố định tại vùng vai hoặc vùng bắp đùi của vận động viên thông qua đai đeo đàn hồi, bao gồm cảm biến quán tính 6 bậc tự do (101a) đo gia tốc ba trục và vận tốc góc ba trục tại tần số lấy mẫu 10Hz, vi điều khiển nhúng (101b) tích hợp khối ước lượng góc tư thế không gian ba chiều và máy trạng thái hữu hạn nhận diện trạng thái vận động, và khối truyền thông không dây (101d);", "- ")
    add_bullet("Mô-đun tiền xử lý và đệm dữ liệu (102) được cấu hình trên bộ nhớ RAM đệm tạm thời (Zero-Touch RAM Buffer) để tiếp nhận luồng dữ liệu quán tính 10Hz, lọc nhiễu dao động và trích xuất chuỗi đặc trưng động học cơ bản;", "- ")
    add_bullet("Mô-đun phân tích trí tuệ nhân tạo (103) kết nối với mô-đun tiền xử lý (102) để tiếp nhận chuỗi đặc trưng động học;", "- ")
    add_bullet("Mô-đun quản trị phân quyền đa vai trò (104) kết nối với mô-đun phân tích (103) để hiển thị thông tin phân cấp người dùng;", "- ")
    add_para("khác biệt ở chỗ, hệ thống có khả năng đo lường và suy diễn toàn diện toàn bộ các chỉ số cơ sinh học cơ thể chỉ từ dữ liệu thu thập tại một vị trí gắn duy nhất; trong đó mô-đun phân tích trí tuệ nhân tạo (103) được cấu hình theo kiến trúc song hành bao gồm bộ máy xử lý cơ sinh học số nội bộ (103a) vận hành ngoại tuyến để tính toán điểm phong độ và phân tầng rủi ro chấn thương cơ học, kết hợp bộ máy ngôn ngữ suy luận chuyên sâu trên đám mây (103b) vận hành mô hình ngôn ngữ lớn để tự động tạo lập báo cáo phân tích phong độ bằng ngôn ngữ tự nhiên có cấu trúc; và mô-đun quản trị phân quyền (104) được cấu hình phân hệ giám sát đội nhóm dành cho vai trò Huấn luyện viên (104b) cho phép hiển thị đồng thời bảng ma trận chỉ số cơ sinh học của toàn bộ các thành viên trong đội hình và phát cảnh báo rủi ro chấn thương tập trung theo thời gian thực.")
    add_para("2. Phương pháp theo dõi động học thể thao, phân tích cơ sinh học và quản trị đội nhóm sử dụng hệ thống theo điểm 1, trong đó phương pháp bao gồm các bước:")
    add_bullet("Thu nhận liên tục chuỗi dữ liệu động học gia tốc ba trục (ax, ay, az), vận tốc góc ba trục (gx, gy, gz) và góc tư thế (pitch, roll, yaw) từ duy nhất một thiết bị đeo (101) gắn tại vai hoặc bắp đùi tại tần số 10Hz;", "a) ")
    add_bullet("Tiền xử lý và đệm luồng dữ liệu trên bộ nhớ tạm RAM (Zero-Touch RAM Buffer) tại mô-đun (102), tính toán vector độ lớn gia tốc tổng hợp và phát hiện các sự kiện bật nhảy và đổi hướng bứt tốc;", "b) ")
    add_bullet("Trích xuất và suy diễn tập chỉ số cơ sinh học toàn diện bao gồm: lực dội tiếp đất đỉnh điểm (PeakImpactG), điểm độ êm tiếp đất (LandingSoftness), độ cân bằng lực hai chân (Symmetry %), độ vững thân trên (TrunkStability), thời gian bay trên không (Airtime) và chỉ số suy giảm động năng mỏi cơ (FatigueIndex);", "c) ")
    add_bullet("Phân tích cơ sinh học bằng kiến trúc trí tuệ nhân tạo song hành: Tự động kích hoạt bộ máy ngôn ngữ lớn đám mây (103b) để sinh văn bản nhận xét phong độ, chỉ điểm lỗi kỹ thuật và đề xuất bài tập khắc phục khi có kết nối mạng; hoặc tự động kích hoạt bộ máy nội bộ (103a) để tính toán điểm số và cấp độ rủi ro chấn thương khi mất mạng;", "d) ")
    add_bullet("Phát tán dữ liệu và kết quả phân tích theo thời gian thực qua giao thức WebSocket STOMP đến giao diện của vận động viên và bảng điều khiển giám sát đội nhóm của huấn luyện viên.", "e) ")
    add_para("3. Hệ thống theo điểm 1, trong đó khi mô-đun thiết bị đeo (101) được gắn duy nhất tại vùng bắp đùi, mô-đun tiền xử lý (102) và mô-đun phân tích (103) đo lường trực tiếp góc nâng đùi, xung lực bùng nổ cơ tứ đầu đùi và lực dội tiếp đất, đồng thời suy diễn độ cân bằng tải trọng hai chân thông qua đối chiếu pha trụ của chân mang thiết bị với pha lăng tiếp nhận xung lực phản hồi truyền chéo qua khung chậu của chân đối diện, và suy diễn góc chúi thân trên thông qua góc nghiêng đùi tại pha đẩy sau.")
    add_para("4. Hệ thống theo điểm 1, trong đó khi mô-đun thiết bị đeo (101) được gắn duy nhất tại vùng vai, mô-đun tiền xử lý (102) và mô-đun phân tích (103) đo lường trực tiếp góc chúi thân trên và độ lắc lư đai vai, đồng thời đo lường lực dội tiếp đất thông qua sóng xung chấn thẳng đứng truyền dọc trục cột sống, và xác định độ cân bằng tải trọng hai chân dựa trên sự dịch chuyển đổi dấu của góc nghiêng Roll và gia tốc ngang ay khi từng chân tiếp đất.")
    add_para("5. Hệ thống theo điểm 1, trong đó mô-đun tiền xử lý (102) tính toán điểm số độ êm tiếp đất theo công thức LandingSoftness = 100 - min(55, max(0, (PeakImpactG - 1.8) * 22)), trong đó PeakImpactG = max(sqrt(ax^2 + ay^2 + az^2)) / 9.80665; và tính toán độ cân bằng lực hai chân theo công thức Symmetry% = 100 - (|Ratio_left - 0.5| * 60) với Ratio_left là tỷ số giữa xung lực tích phân bên trái và tổng xung lực hai bên.")
    add_para("6. Hệ thống theo điểm 1, trong đó mô-đun tiền xử lý (102) tính toán độ vững thân trên theo công thức TrunkStability = 100 - min(50, (std_Pitch + std_Roll) * 1.8), trong đó std_Pitch và std_Roll lần lượt là độ lệch chuẩn không gian của góc chúi và góc nghiêng thân người.")
    add_para("7. Hệ thống theo điểm 1, trong đó mô-đun phân tích (103) xác định chỉ số mỏi cơ theo công thức FatigueIndex = round(((E_initial - E_final) / E_initial) * 100%) + 12, với E_initial và E_final lần lượt là tổng năng lượng gia tốc chuyển động trong 20% thời gian đầu và 20% thời gian cuối của phiên tập.")
    add_para("8. Hệ thống theo điểm 1, trong đó phân hệ Huấn luyện viên (104b) bao gồm cơ chế lọc và cảnh báo tự động: kích hoạt tín hiệu cảnh báo thị giác và âm thanh trên bảng điều khiển khi bất kỳ vận động viên nào có chỉ số rủi ro chấn thương đạt mức HIGH Risk hoặc chỉ số mỏi cơ FatigueIndex vượt ngưỡng 25%; đồng thời hỗ trợ trích xuất hồ sơ đánh giá thể lực toàn đội sang định dạng tài liệu PDF hoặc bảng tính CSV.")

    # 9. BẢN TÓM TẮT SÁNG CHẾ
    add_heading_1("BẢN TÓM TẮT SÁNG CHẾ")
    add_para("Sáng chế đề cập đến hệ thống theo dõi động học thể thao, phân tích cơ sinh học và quản trị đội nhóm. Hệ thống gồm thiết bị đeo cảm biến 6 bậc tự do (101) gắn tại vùng vai hoặc vùng bắp đùi thu thập gia tốc và vận tốc góc tại tần số 10Hz; mô-đun đệm RAM (102) trích xuất tức thời lực tiếp đất, độ cân bằng hai chân, độ vững thân trên và độ mỏi cơ; mô-đun AI song hành (103) kết hợp bộ máy nội bộ (103a) hoạt động ngoại tuyến và mô hình ngôn ngữ lớn (103b) tạo báo cáo phong độ, đề xuất bài tập khắc phục; cùng mô-đun phân quyền (104) hỗ trợ huấn luyện viên (104b) giám sát tập trung chỉ số và cảnh báo chấn thương toàn đội thời gian thực.")

    output_path = "D:/EXE101/Second_Skin_Sport/docs/Ban_mo_ta_sang_che_Second_Skin_Sport.docx"
    output_path_v2 = "D:/EXE101/Second_Skin_Sport/docs/Ban_mo_ta_sang_che_Second_Skin_Sport_Kem_Hinh_Ve.docx"
    try:
        doc.save(output_path)
        print(f"File created successfully: {output_path}")
    except PermissionError:
        print(f"Notice: {output_path} is currently opened in another app. Saving to {output_path_v2}")
        doc.save(output_path_v2)
        print(f"File created successfully: {output_path_v2}")

if __name__ == "__main__":
    create_patent_document()
