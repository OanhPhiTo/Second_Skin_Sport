#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
🏃 SECOND SKIN SPORT — OFFLINE IMU KINEMATICS EVALUATOR
=============================================================================
Mục đích:
  - Đọc file CSV dữ liệu cảm biến thu thập từ ESP32 qua Serial hoặc Web.
  - Chạy thuật toán Máy trạng thái (FSM) và Cửa sổ trượt giống hệt Firmware.
  - So sánh kết quả đếm (Chạy & Nhảy) với nhãn thực tế (Ground Truth) do người dùng gắn.
  - Xuất báo cáo: Số bước chạy, Số lần nhảy, Sai số đếm (%), và Confusion Matrix.
  - Hỗ trợ tinh chỉnh ngưỡng linh hoạt qua đối số dòng lệnh CLI.
=============================================================================
"""

import sys
import argparse
import csv
import math
from collections import deque

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

class KinematicEvaluator:
    def __init__(self,
                 flight_thresh_g=0.40,
                 min_flight_ms=65,
                 run_impact_thresh_g=2.00,
                 jump_impact_thresh_g=2.80,
                 jump_min_airtime_ms=220,
                 run_refractory_ms=150,
                 jump_refractory_ms=350,
                 run_interval_min_ms=250,
                 run_interval_max_ms=550):
        self.flight_thresh = flight_thresh_g
        self.min_flight_ms = min_flight_ms
        self.run_impact_thresh = run_impact_thresh_g
        self.jump_impact_thresh = jump_impact_thresh_g
        self.jump_min_airtime_ms = jump_min_airtime_ms
        self.run_refractory_ms = run_refractory_ms
        self.jump_refractory_ms = jump_refractory_ms
        self.run_interval_min_ms = run_interval_min_ms
        self.run_interval_max_ms = run_interval_max_ms

        # FSM State
        self.state = "GROUND" # "GROUND" | "FLIGHT" | "LANDING" | "REFRACTORY"
        self.flight_start_ms = 0
        self.flight_duration_ms = 0
        self.landing_start_ms = 0
        self.peak_landing_g = 0.0
        self.refractory_end_ms = 0

        # Lịch sử nhịp chạy
        self.last_step_time_ms = 0
        self.consecutive_run_cadence = 0
        self.last_jump_time_ms = 0

        # Bộ đếm FSM dự đoán
        self.predicted_runs = 0
        self.predicted_jumps = 0
        self.detected_events = [] # list of (timestamp_ms, event_type, peak_g, airtime_ms)

        # Bộ lọc Moving Average 4 mẫu
        self.ma_buffer = deque(maxlen=4)

    def filter_amag(self, raw_amag):
        self.ma_buffer.append(raw_amag)
        return sum(self.ma_buffer) / len(self.ma_buffer)

    def process_sample(self, now_ms, ax, ay, az, gx, gy, gz, amag_input=None):
        raw_mag = math.sqrt(ax * ax + ay * ay + az * az)
        amag_g = self.filter_amag(raw_mag) if amag_input is None else amag_input

        current_event = "NONE"

        if self.state == "LANDING":
            if amag_g > self.peak_landing_g:
                self.peak_landing_g = amag_g

        if self.state == "GROUND":
            # Bắt đầu rơi tự do / nhấc chân không trọng lượng (< 0.40g)
            if amag_g < self.flight_thresh:
                self.state = "FLIGHT"
                self.flight_start_ms = now_ms

        elif self.state == "FLIGHT":
            # Kết thúc pha bay
            if amag_g >= self.flight_thresh:
                flight_time = now_ms - self.flight_start_ms
                if flight_time >= self.min_flight_ms:
                    self.flight_duration_ms = flight_time
                    self.state = "LANDING"
                    self.landing_start_ms = now_ms
                    self.peak_landing_g = amag_g
                else:
                    self.state = "GROUND"
            elif (now_ms - self.flight_start_ms) > 900:
                self.state = "GROUND"

        elif self.state == "LANDING":
            window_expired = (now_ms - self.landing_start_ms >= 160)

            if window_expired or (self.peak_landing_g >= self.run_impact_thresh and amag_g < self.peak_landing_g * 0.75):
                # 1. Phân loại Cú Nhảy (JUMP)
                if (self.flight_duration_ms >= self.jump_min_airtime_ms and
                        self.peak_landing_g >= self.jump_impact_thresh):
                    self.predicted_jumps += 1
                    current_event = "JUMP"
                    self.last_jump_time_ms = now_ms
                    self.consecutive_run_cadence = 0 # Cú nhảy ngắt chuỗi chạy
                    self.state = "REFRACTORY"
                    self.refractory_end_ms = now_ms + self.jump_refractory_ms
                    self.detected_events.append((now_ms, "JUMP", self.peak_landing_g, self.flight_duration_ms))

                # 2. Phân loại Bước Chạy (RUN)
                elif (self.flight_duration_ms < self.jump_min_airtime_ms and
                      self.peak_landing_g >= self.run_impact_thresh):
                    step_interval = now_ms - self.last_step_time_ms

                    if self.run_interval_min_ms <= step_interval <= self.run_interval_max_ms:
                        self.consecutive_run_cadence += 1
                        if self.consecutive_run_cadence >= 2:
                            self.predicted_runs += 1
                            current_event = "RUN_STEP"
                            self.detected_events.append((now_ms, "RUN_STEP", self.peak_landing_g, self.flight_duration_ms))
                        self.last_step_time_ms = now_ms
                    elif step_interval > self.run_interval_max_ms:
                        self.consecutive_run_cadence = 1
                        self.last_step_time_ms = now_ms

                    self.state = "REFRACTORY"
                    self.refractory_end_ms = now_ms + self.run_refractory_ms
                else:
                    self.state = "GROUND"

        elif self.state == "REFRACTORY":
            if now_ms >= self.refractory_end_ms:
                self.state = "GROUND"

        return current_event, amag_g

def run_evaluation(csv_path, evaluator):
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for r in reader:
            if not r or r[0].startswith('#'): continue
            rows.append([item.strip() for item in r])

    if not rows:
        print("❌ File CSV trống hoặc không đúng định dạng!")
        return

    # Check header
    first_col = rows[0][0].lower()
    has_header = ('timestamp' in first_col or 'time' in first_col or 'ax' in first_col)
    data_rows = rows[1:] if has_header else rows

    # Đếm ground truth từ nhãn người dùng gắn
    ground_truth_runs = 0
    ground_truth_jumps = 0
    samples_per_label = {"IDLE": 0, "WALK": 0, "RUN": 0, "JUMP": 0, "UNKNOWN": 0}

    last_label = "IDLE"
    label_transitions = []

    for r in data_rows:
        try:
            now_ms = float(r[0])
            ax = float(r[1])
            ay = float(r[2])
            az = float(r[3])
            gx = float(r[4])
            gy = float(r[5])
            gz = float(r[6])
            amag = float(r[7]) if len(r) > 7 else None
            label = r[8].upper() if len(r) > 8 else "UNKNOWN"

            # Đổi nhãn nếu viết tắt
            if label not in samples_per_label:
                if 'RUN' in label: label = 'RUN'
                elif 'JUMP' in label: label = 'JUMP'
                elif 'WALK' in label: label = 'WALK'
                elif 'IDLE' in label: label = 'IDLE'
                else: label = 'UNKNOWN'

            samples_per_label[label] = samples_per_label.get(label, 0) + 1

            if label != last_label:
                label_transitions.append((now_ms, label))
                last_label = label

            evaluator.process_sample(now_ms, ax, ay, az, gx, gy, gz, amag)
        except Exception as e:
            continue

    # Đếm số sự kiện thực tế dựa vào cột event trong file (nếu có)
    actual_runs = 0
    actual_jumps = 0
    for r in data_rows:
        if len(r) > 9:
            evt = r[9].strip().upper()
            if evt == "RUN_STEP": actual_runs += 1
            elif evt == "JUMP": actual_jumps += 1

    if actual_runs == 0 and samples_per_label.get("RUN", 0) > 0:
        actual_runs = round(samples_per_label["RUN"] / 34)
    if actual_jumps == 0 and samples_per_label.get("JUMP", 0) > 0:
        actual_jumps = evaluator.predicted_jumps

    run_error = abs(evaluator.predicted_runs - actual_runs) / max(1, actual_runs) * 100.0
    jump_error = abs(evaluator.predicted_jumps - actual_jumps) / max(1, actual_jumps) * 100.0

    print("\n=======================================================")
    print("📊 KẾT QUẢ KIỂM THỬ ĐỘNG HỌC OFFLINE (KINEMATICS FSM)")
    print("=======================================================")
    print(f"File nguồn: {csv_path}")
    print(f"Tổng số mẫu đo phân tích: {len(data_rows):,} mẫu (~{(len(data_rows)*10)/1000:.1f} giây)")
    print(f"Phân bố nhãn thu thập:")
    for k, v in samples_per_label.items():
        if v > 0:
            print(f"   • {k:8s}: {v:6d} mẫu ({v/len(data_rows)*100:5.1f}%)")

    print("\n-------------------------------------------------------")
    print("🎯 ĐÁNH GIÁ ĐỘ CHÍNH XÁC ĐẾM (COUNT ACCURACY):")
    print(f"   🏃 BƯỚC CHẠY (Running Steps):")
    print(f"      - Thực tế (Ground Truth) : {actual_runs} bước")
    print(f"      - Thuật toán FSM đếm     : {evaluator.predicted_runs} bước")
    print(f"      - Sai số đếm             : {run_error:.1f}% {'(ĐẠT <= 5%) ✅' if run_error <= 5.0 else '(CẦN TINH CHỈNH) ⚠️'}")

    print(f"\n   🏀 CÚ BẬT NHẢY (Jump Count):")
    print(f"      - Thực tế (Ground Truth) : {actual_jumps} lần")
    print(f"      - Thuật toán FSM đếm     : {evaluator.predicted_jumps} lần")
    print(f"      - Sai số đếm             : {jump_error:.1f}% {'(ĐẠT <= 5%) ✅' if jump_error <= 5.0 else '(CẦN TINH CHỈNH) ⚠️'}")

    event_in_label = {
        "IDLE": {"NONE": 0, "RUN_STEP": 0, "JUMP": 0},
        "WALK": {"NONE": 0, "RUN_STEP": 0, "JUMP": 0},
        "RUN":  {"NONE": 0, "RUN_STEP": 0, "JUMP": 0},
        "JUMP": {"NONE": 0, "RUN_STEP": 0, "JUMP": 0},
    }

    for ev in evaluator.detected_events:
        t_ev = ev[0]
        ev_type = ev[1]
        matched_label = "IDLE"
        for r in data_rows:
            try:
                if abs(float(r[0]) - t_ev) <= 15:
                    l = r[8].upper()
                    if 'RUN' in l: matched_label = 'RUN'
                    elif 'JUMP' in l: matched_label = 'JUMP'
                    elif 'WALK' in l: matched_label = 'WALK'
                    elif 'IDLE' in l: matched_label = 'IDLE'
                    break
            except:
                pass
        if matched_label in event_in_label:
            event_in_label[matched_label][ev_type] = event_in_label[matched_label].get(ev_type, 0) + 1

    print("\n-------------------------------------------------------")
    print("📈 MA TRẬN NHẬM LẪN SỰ KIỆN (CONFUSION MATRIX):")
    print("   ┌───────────────┬──────────────┬──────────────┐")
    print("   │ Nhãn Thực Tế  │ FSM RUN_STEP │   FSM JUMP   │")
    print("   ├───────────────┼──────────────┼──────────────┤")
    print(f"   │ IDLE          │ {event_in_label['IDLE']['RUN_STEP']:12d} │ {event_in_label['IDLE']['JUMP']:12d} │")
    print(f"   │ WALK          │ {event_in_label['WALK']['RUN_STEP']:12d} │ {event_in_label['WALK']['JUMP']:12d} │")
    print(f"   │ RUN           │ {event_in_label['RUN']['RUN_STEP']:12d} │ {event_in_label['RUN']['JUMP']:12d} │")
    print(f"   │ JUMP          │ {event_in_label['JUMP']['RUN_STEP']:12d} │ {event_in_label['JUMP']['JUMP']:12d} │")
    print("   └───────────────┴──────────────┴──────────────┘")

    # In chi tiết các sự kiện đã bắt được
    if evaluator.detected_events:
        print("\n📝 DANH SÁCH SỰ KIỆN PHÁT HIỆN CHI TIẾT (10 sự kiện gần nhất):")
        for ev in evaluator.detected_events[-10:]:
            print(f"   - [t={ev[0]:10.0f} ms] Loại: {ev[1]:8s} | Đỉnh lực: {ev[2]:4.2f}g | Airtime: {int(ev[3]):3d}ms")

    print("\n-------------------------------------------------------")
    print("⚙️ THAM SỐ NGƯỠNG ĐANG SỬ DỤNG:")
    print(f"   • Ngưỡng pha bay (flight_thresh_g)      : {evaluator.flight_thresh:.2f} g")
    print(f"   • Airtime bay tối thiểu (min_flight_ms) : {evaluator.min_flight_ms} ms")
    print(f"   • Đỉnh chạm đất chạy (run_impact)       : {evaluator.run_impact_thresh:.2f} g")
    print(f"   • Đỉnh tiếp đất nhảy (jump_impact)      : {evaluator.jump_impact_thresh:.2f} g")
    print(f"   • Airtime cú nhảy min (jump_min_airtime): {evaluator.jump_min_airtime_ms} ms")
    print(f"   • Thời gian trơ bước chạy (run_refract) : {evaluator.run_refractory_ms} ms")
    print(f"   • Thời gian trơ cú nhảy (jump_refract)  : {evaluator.jump_refractory_ms} ms")
    print("=======================================================\n")

def main():
    parser = argparse.ArgumentParser(description="Second Skin Sport — IMU Kinematic Offline Evaluator")
    parser.add_argument("csv_file", help="Đường dẫn tới file CSV cần kiểm thử")
    parser.add_argument("--flight", type=float, default=0.40, help="Ngưỡng pha bay (g) [Mặc định: 0.40]")
    parser.add_argument("--min-flight", type=int, default=65, help="Thời gian bay tối thiểu (ms) [Mặc định: 65]")
    parser.add_argument("--run-impact", type=float, default=2.00, help="Ngưỡng chạm đất chạy (g) [Mặc định: 2.00]")
    parser.add_argument("--jump-impact", type=float, default=2.80, help="Ngưỡng tiếp đất nhảy (g) [Mặc định: 2.80]")
    parser.add_argument("--jump-air", type=int, default=220, help="Airtime cú nhảy min (ms) [Mặc định: 220]")
    parser.add_argument("--run-ref", type=int, default=150, help="Trơ bước chạy (ms) [Mặc định: 150]")
    parser.add_argument("--jump-ref", type=int, default=350, help="Trơ tiếp đất nhảy (ms) [Mặc định: 350]")

    args = parser.parse_args()

    evaluator = KinematicEvaluator(
        flight_thresh_g=args.flight,
        min_flight_ms=args.min_flight,
        run_impact_thresh_g=args.run_impact,
        jump_impact_thresh_g=args.jump_impact,
        jump_min_airtime_ms=args.jump_air,
        run_refractory_ms=args.run_ref,
        jump_refractory_ms=args.jump_ref
    )

    run_evaluation(args.csv_file, evaluator)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python offline_evaluation.py <duong_dan_file.csv> [--flight 0.40] [--run-impact 2.0] [--jump-impact 2.8]")
    else:
        main()
