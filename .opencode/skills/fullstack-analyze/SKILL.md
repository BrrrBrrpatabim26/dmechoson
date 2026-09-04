---
name: fullstack-analyze
description: Verification — thực thi kiểm thử 10 tầng toàn diện (Unit, Integration, Contract, E2E, Security, Performance, Reliability, Regression, Business Flow, Realistic/Staging) bằng các lệnh thực tế trong terminal, xuất Báo cáo Nghiệm thu (verification-report.md), phân loại nguyên nhân lỗi và đánh giá Definition of Done (DoD).
---

---
description: Verification — thực thi kiểm thử 10 tầng toàn diện (Unit, Integration, Contract, E2E, Security, Performance, Reliability, Regression, Business Flow, Realistic/Staging) bằng các lệnh thực tế trong terminal, xuất Báo cáo Nghiệm thu (verification-report.md), phân loại nguyên nhân lỗi và đánh giá Definition of Done (DoD).
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- qa-then-continue:v1.1.0 -->
<!-- 10-layer-verification-engine:v2.0.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE TEST_GATE)**:
> 1. **KHÔNG ĐƯỢC TỰ BỎ QUA XÁC NHẬN KIỂM ĐỊNH**: Agent BẮT BUỘC phải chạy kiểm thử thật trong shell, xuất báo cáo `verification-report.md` và trình bày cho Người dùng duyệt.
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG XÁC NHẬN**: Tuyệt đối KHÔNG ĐƯỢC tự ý pass `test_gate` mà chưa có xác nhận từ người dùng.
> 3. **CHUYỂN TIẾP SAU KHI ĐƯỢC DUYỆT**: Chỉ khi người dùng xác nhận đạt kết quả kiểm định, AI mới ghi nhận gate và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.release
> ```

# 🛡️ 10-Layer Verification & Real Test Engine

> **Triết lý Kiểm định 10 Lớp Toàn diện (Business.md Verification Phase)**:
> Không một phần mềm nào được phép xuất xưởng nếu chưa trải qua kiểm định độc lập 10 tầng khép kín. Toàn bộ các bài test phải được chạy bằng câu lệnh thực tế trong terminal. Khi phát hiện lỗi ở bất kỳ tầng nào, hệ thống tự động kích hoạt **Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)** và điều phối vá lỗi chính xác theo nguồn gốc phát sinh lỗi (`FAILURE_CLASS`).

---

## 🗺️ Kim tự tháp Kiểm định 10 Tầng & Luồng Xử lý Lỗi

```text
[BẮT ĐẦU VERIFICATION]
         │
         ▼
[BƯỚC 1: Sẵn sàng Môi trường & Dữ liệu Kiểm thử (Test Env Readiness)]
         │
         ▼
[BƯỚC 2: Ma trận Truy vết Yêu cầu (Requirement Traceability Matrix)]
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               BƯỚC 3: THỰC THI 10 LỚP KIỂM THỬ THỰC TẾ                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1.  Unit Test: Xác thực logic hàm, class, component độc lập           │
│ 2.  Integration Test: Kiểm thử kết nối Database, Cache, Message Bus    │
│ 3.  Contract Test: So khớp thực tế với API Contract JSON Schema        │
│ 4.  E2E Test: Luồng nghiệp vụ người dùng từ giao diện đến cơ sở dữ liệu│
│ 5.  Security Test: Quét lỗ hổng SAST/DAST, quét mã độc dependencies   │
│ 6.  Performance Test: Đo lường thời gian phản hồi, tải trọng theo NFR  │
│ 7.  Reliability Test: Kiểm thử khả năng chịu lỗi, timeout, phục hồi   │
│ 8.  Regression Test: Chạy toàn bộ test suite cũ để chống hỏng chéo    │
│ 9.  Business Flow Test: Kiểm thử kịch bản nghiệp vụ phức tạp của domain│
│ 10. Realistic Staging Test: Chạy thử trên dữ liệu sát thực tế nhất     │
└────────────────────────────────────────────────────────────────────────┘
         │
         ├──► [NẾU TẤT CẢ PASS] ──► Xuất verification-report.md ➔ Test Gate Pass ➔ /fullstack.release
         │
         └──► [NẾU CÓ BÀI TEST FAIL] ──► KÍCH HOẠT ROOT CAUSE ANALYSIS:
                   ├── Lỗi Yêu cầu (Requirement)       ──► Quay về /fullstack.requirement
                   ├── Lỗi Kiến trúc (Architecture)    ──► Quay về /fullstack.plan
                   ├── Lỗi Thiết kế (Design)           ──► Quay về /fullstack.design
                   ├── Lỗi Mã nguồn (Implementation)   ──► Kích hoạt Debug Loop sửa code
                   ├── Lỗi Môi trường (Environment)    ──► Sửa cấu hình test env
                   └── Lỗi Dữ liệu (Data/Migration)    ──► Sửa migration / seed data
```

---

## 📋 Hướng dẫn Thực thi Chi tiết

### Bước 1: Kiểm tra Môi trường & Truy vết Yêu cầu
1. Kiểm tra môi trường kiểm thử (database test, biến môi trường `.env.test`).
2. Lập bảng **Requirement Traceability Matrix**: Mỗi `FR-xxx` trong `spec.md` phải có ít nhất một bài kiểm thử tương ứng.

### Bước 2: Chạy Lệnh Thực tế Trong Terminal (10 Lớp Kiểm Định)
Agent thực thi các lệnh kiểm thử thật sự qua terminal của dự án:

1. **Gọi API Thực Tế & Thiết Lập Timeout**:
   - **Tự động nhận diện Host & Port**: Đọc port thật từ config/env (`.env`, `PORT`, `docker-compose.yml`, server output logs). Không hardcode cố định port.
   - Khi chạy Integration / Contract / E2E test hoặc kiểm tra service API thật:
     - Luôn thêm **`--max-time`** hoặc **`timeout`** (ví dụ: `curl --max-time 10 ...`) để không bị treo vĩnh viễn khi có deadlock / network latency.
     - Kiểm tra kết nối trước: `curl -s -o /dev/null -w "%{http_code}" http://localhost:<BACKEND_PORT>/health --max-time 5`.

2. **Cơ Chế Phối Hợp Song Song Cùng User (Human-in-the-Loop Co-Testing)**:
   - Với các bài test cần tương tác người dùng (nhập mã OTP SMS, quét mã QR thanh toán, đăng nhập Google/GitHub OAuth, xác thực 2FA):
     - AI gửi yêu cầu trực tiếp cho User với hướng dẫn từng bước và đúng port thật:
       > 🤝 *"Service đang chạy tại `http://localhost:<BACKEND_PORT>`. Vui lòng thực hiện thao tác [Đăng nhập OAuth / Quét QR] trên trình duyệt `http://localhost:<FRONTEND_PORT>` và phản hồi 'DONE' để AI tiếp tục kiểm định dữ liệu."*

3. **Điều Phối Khi Không Chạy Song Song Được Nhiều Lệnh Foreground**:
   - Nếu môi trường bị blocking khi chạy server backend:
     - Chạy backend dưới dạng background task / daemon có log (`server.log`).
     - Hoặc yêu cầu User chạy server/frontend ở 1 terminal riêng, Agent tập trung curl API và kiểm tra database/logs.

4. **Lệnh Thực Thi Mẫu**:
```bash
# Test Unit & Integration:
pytest tests/ -v --tb=short

# Test API Contract / Schema:
npm run test:contract

# Test E2E / Realistic Flow:
npm run test:e2e

# Test Security Dependencies:
pip-audit # hoặc npm audit
```

### Bước 3: Xuất Báo cáo Nghiệm thu (`verification-report.md`)
Sinh file `.fullstack/specs/<branch>/verification-report.md` từ `templates/verification-report-template.md`:
- Bảng tổng hợp kết quả từng tầng: Tên tầng, Lệnh chạy, Số bài test, Tỉ lệ Pass %, Thời gian chạy.
- Ma trận Functional Requirement coverage.
- Đánh giá NFR thực tế so với mục tiêu đặt ra.
- Kết luận Definition of Done (DoD).

### Bước 4: Xử lý Lỗi & Cổng Phê duyệt Test Gate (`TEST_GATE`)
- Nếu có bài test thất bại: Xác định `FAILURE_CLASS` và kích hoạt luồng sửa tương ứng, sau đó chạy lại test cho đến khi pass.
- Trình bày kết quả kiểm định cho Người dùng duyệt:
  ```markdown
  🛡️ **Phê duyệt Báo Cáo Kiểm Định (`TEST_GATE`)**:
  Báo cáo nghiệm thu đã lập tại `.fullstack/specs/<branch>/verification-report.md`.
  - **Kết quả 10 tầng kiểm thử**: [Tóm tắt số bài pass/fail]
  - **Test Coverage**: [Độ bao phủ đạt %]
  - **Phân tích rủi ro tồn dư**: [Liệt kê nếu có]

  👉 **Bạn có xác nhận kết quả kiểm định để chuyển sang đóng gói Phát hành không?**
  - **[1] Xác nhận đạt** (Tiến hành phát hành sản phẩm)
  - **[2] Yêu cầu bổ sung test / sửa lỗi** (Nêu rõ phần cần kiểm tra lại)
  ```

*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG XÁC NHẬN**.*

Khi người dùng đồng ý:
1. Ghi nhận Gate:
   ```bash
   python scripts/python/flowchart_progress.py gate \
       --gate test_gate --decision pass \
       --inputs '{"user_confirmed": true}' --threshold '{"approval_required": true}' \
       --rationale 'Người dùng đã xác nhận báo cáo kiểm thử 10 tầng'
   ```
2. Gọi chuyển tiếp:
   ```
   EXECUTE_COMMAND: fullstack.release
   ```



