#!/usr/bin/env python3
import csv
import math
import random
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def generate_sample_csv(filename="scripts/sample_knee_telemetry.csv"):
    rows = []
    # Header: timestamp_ms,ax,ay,az,gx,gy,gz,a_mag,label,event
    t = 0 # ms
    dt = 10 # 100 Hz = 10ms

    # 1. Đoạn ĐỨNG YÊN (IDLE) - 2 giây (200 mẫu)
    for _ in range(200):
        t += dt
        ax = random.gauss(0.05, 0.02)
        ay = random.gauss(0.10, 0.02)
        az = random.gauss(0.99, 0.02)
        gx = random.gauss(0.5, 0.5)
        gy = random.gauss(-0.2, 0.5)
        gz = random.gauss(0.1, 0.3)
        amag = math.sqrt(ax*ax + ay*ay + az*az)
        rows.append([t, round(ax,2), round(ay,2), round(az,2), round(gx,1), round(gy,1), round(gz,1), round(amag,3), "IDLE", "NONE"])

    # 2. Đoạn ĐI BỘ (WALK) - 4 giây (400 mẫu)
    # Lực va chạm êm (1.1 - 1.5g), không có pha bay < 0.4g
    for i in range(400):
        t += dt
        phase = (i % 60) / 60.0 * 2 * math.pi
        ax = 0.2 * math.sin(phase) + random.gauss(0, 0.02)
        ay = 0.3 * math.cos(phase) + random.gauss(0, 0.02)
        az = 1.0 + 0.35 * math.sin(phase * 2) + random.gauss(0, 0.03)
        gx = 40.0 * math.sin(phase)
        gy = 20.0 * math.cos(phase)
        gz = 15.0 * math.sin(phase)
        amag = math.sqrt(ax*ax + ay*ay + az*az)
        rows.append([t, round(ax,2), round(ay,2), round(az,2), round(gx,1), round(gy,1), round(gz,1), round(amag,3), "WALK", "NONE"])

    # 3. Đoạn CHẠY BỘ (RUN) - 20 bước chạy liên tục (chu kỳ 340ms/bước)
    # Mỗi bước có pha bay 110ms (< 0.35g) và tiếp đất đỉnh 2.4 - 3.2g
    total_steps = 20
    step_duration_ms = 340
    samples_per_step = step_duration_ms // dt # 34 mẫu

    for step in range(total_steps):
        for s in range(samples_per_step):
            t += dt
            # 0 - 130ms: Pha bay (flight) 13 mau
            if s < 13:
                amag = random.uniform(0.18, 0.32)
                az = amag * 0.9
                ax = amag * 0.3
                ay = amag * 0.2
                gx = random.gauss(120, 15)
                gy = random.gauss(-40, 10)
                gz = random.gauss(20, 10)
                evt = "NONE"
            # 130 - 180ms: Chạm đất và đạt đỉnh va chạm (impact)
            elif s < 18:
                peak_factor = math.sin((s - 13) / 5.0 * math.pi)
                amag = 1.0 + random.uniform(1.8, 2.5) * peak_factor # Đỉnh 2.5 - 3.2g
                az = amag * 0.92
                ax = amag * 0.25
                ay = amag * 0.2
                gx = random.gauss(60, 20)
                gy = random.gauss(20, 15)
                gz = random.gauss(-10, 10)
                evt = "RUN_STEP" if s == 15 else "NONE"
            # 180 - 340ms: Pha đỡ chân trên mặt đất
            else:
                amag = random.uniform(0.95, 1.25)
                az = amag * 0.95
                ax = amag * 0.2
                ay = amag * 0.1
                gx = random.gauss(30, 10)
                gy = random.gauss(-10, 10)
                gz = random.gauss(5, 5)
                evt = "NONE"

            rows.append([t, round(ax,2), round(ay,2), round(az,2), round(gx,1), round(gy,1), round(gz,1), round(amag,3), "RUN", evt])

    # 4. Đoạn NGHỈ GIỮA HIỆP (IDLE) - 2 giây
    for _ in range(200):
        t += dt
        ax = random.gauss(0.04, 0.02)
        ay = random.gauss(0.08, 0.02)
        az = random.gauss(0.99, 0.02)
        gx = random.gauss(0, 0.5)
        gy = random.gauss(0, 0.5)
        gz = random.gauss(0, 0.3)
        amag = math.sqrt(ax*ax + ay*ay + az*az)
        rows.append([t, round(ax,2), round(ay,2), round(az,2), round(gx,1), round(gy,1), round(gz,1), round(amag,3), "IDLE", "NONE"])

    # 5. Đoạn BẬT NHẢY (JUMP) - 5 cú nhảy rõ rệt
    # Airtime 280ms (< 0.25g), tiếp đất đỉnh 3.6 - 4.5g
    total_jumps = 5
    for j in range(total_jumps):
        # Nghỉ trước khi nhảy 800ms
        for _ in range(80):
            t += dt
            amag = random.uniform(0.95, 1.05)
            rows.append([t, 0.05, 0.05, round(amag,2), 0.5, 0.5, 0.2, round(amag,3), "JUMP", "NONE"])

        # Takeoff propulsion 120ms
        for _ in range(12):
            t += dt
            amag = random.uniform(1.4, 2.0)
            rows.append([t, 0.2, 0.3, round(amag,2), 50.0, 20.0, 10.0, round(amag,3), "JUMP", "NONE"])

        # Pha bay 280ms (28 mẫu < 0.25g)
        for _ in range(28):
            t += dt
            amag = random.uniform(0.08, 0.28)
            rows.append([t, 0.1, 0.1, round(amag,2), 30.0, -10.0, 5.0, round(amag,3), "JUMP", "NONE"])

        # Tiếp đất va chạm 150ms (Đỉnh 3.6 - 4.5g)
        for idx in range(15):
            t += dt
            factor = math.sin((idx / 15.0) * math.pi)
            amag = 1.0 + random.uniform(2.6, 3.5) * factor
            evt = "JUMP" if idx == 7 else "NONE"
            rows.append([t, 0.4, 0.3, round(amag,2), 80.0, 40.0, -20.0, round(amag,3), "JUMP", evt])

        # Phục hồi sau nhảy 500ms
        for _ in range(50):
            t += dt
            amag = random.uniform(0.90, 1.15)
            rows.append([t, 0.05, 0.05, round(amag,2), 5.0, 2.0, 1.0, round(amag,3), "JUMP", "NONE"])

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp_ms", "ax", "ay", "az", "gx", "gy", "gz", "a_mag", "label", "event"])
        writer.writerows(rows)

    print(f"✅ Đã tạo thành công file mẫu thực nghiệm: {filename} ({len(rows)} mẫu)")

if __name__ == "__main__":
    generate_sample_csv()
