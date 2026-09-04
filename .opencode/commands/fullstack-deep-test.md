---
description: Deep Testing — Kiểm thử thực chiến đa tầng chuyên sâu (Gọi API thật có timeout, Healthcheck, phối hợp Human-in-the-Loop OTP/OAuth/QR, kiểm thử tải & lỗi mạng, bảo đảm Test Coverage >= 97%).
---


<!-- deep-testing-engine:v1.0.0 -->
<!-- human-in-the-loop-testing:v1.0.0 -->

# 🧪 Deep Testing Engine (Kiểm thử Thực chiến Đa tầng Chuyên sâu)

> **MỤC TIÊU**: Thực thi kiểm định toàn diện trên hệ thống đang chạy thật bằng các công cụ shell/terminal, bảo đảm mọi ngóc ngách logic, API, giao diện và kịch bản tương tác người dùng đều đạt độ ổn định cao nhất trước khi xuất xưởng.

---

## 🛡️ 1. Quy Chuẩn Kiểm Thử Thực Chiến (Realistic Test Protocol)

Mọi bài test do Agent thực hiện BẮT BUỘC tuân thủ:

1. **Gọi API Thật Có Timeout Rõ Ràng**:
   - Tự động nhận diện host & port thật từ config/env (`.env`, `PORT`, `docker-compose.yml`, server startup logs).
   - Tuyệt đối **KHÔNG** hardcode cố định `localhost:8000`.
   - BẮT BUỘC kèm theo cờ `--max-time` hoặc cấu hình `timeout` (tránh treo terminal vô hạn):
     ```bash
     # 1. Healthcheck với timeout 5s:
     curl -s -o /dev/null -w "%{http_code}" http://localhost:<BACKEND_PORT>/health --max-time 5

     # 2. Kiểm thử API endpoint với timeout 10s:
     curl -X POST http://localhost:<BACKEND_PORT>/api/v1/<endpoint> \
          -H "Content-Type: application/json" \
          -d '{"key": "value"}' \
          --max-time 10
     ```

2. **Kiểm Thử Đầy Đủ Các Mã Lỗi HTTP (Edge Cases Simulation)**:
   - Không chỉ test đường màu hồng (`200/201 OK`).
   - BẮT BUỘC test: `400 Bad Request` (dữ liệu sai format), `401 Unauthorized` (token rác/hết hạn), `403 Forbidden` (sai quyền), `404 Not Found` (ID ảo), `422 Unprocessable Entity` (vi phạm business rule), `500 Server Error` (mock DB chết).

3. **Cơ Chế Phối Hợp Human-in-the-Loop Cùng User**:
   - Khi gặp các bước cần tương tác người dùng thực (quét mã QR ngân hàng, OTP SMS gửi về điện thoại cá nhân, đăng nhập Google/GitHub OAuth, thanh toán thẻ Sandbox):
     - AI BẮT BUỘC cung cấp hướng dẫn rõ ràng và dừng lại chờ xác nhận:
       > 🤝 *"Backend đang lắng nghe tại `http://localhost:<BACKEND_PORT>`. Vui lòng mở trình duyệt tại `http://localhost:<FRONTEND_PORT>/checkout`, tiến hành quét mã QR / nhập OTP, sau đó nhắn 'DONE' để AI tiếp tục kiểm tra webhook và dữ liệu cập nhật trong database."*

4. **Điều Phối Tiến Trình Non-Blocking (Background Daemon)**:
   - Nếu terminal của Agent bị chặn khi khởi chạy server:
     - Khởi chạy server dưới dạng background daemon có log (`server.log`).
     - Hoặc đề nghị User mở 1 terminal phụ để chạy server, Agent tập trung curl API và kiểm tra database/log.

5. **Dọn Dẹp Dữ Liệu Sau Kiểm Thử (Data Isolation & Cleanup)**:
   - Toàn bộ dữ liệu seed test phải được xóa sạch hoặc cô lập trong database test riêng để không ảnh hưởng dữ liệu người dùng.

---

## 📊 2. Ma Trận Kiểm Định 7 Tầng Chuyên Sâu

| Tầng Kiểm Thử | Mục Tiêu Xác Thực | Công Cụ / Lệnh Shell | Ngưỡng Đạt |
|---|---|---|---|
| **1. Unit Test** | Logic hàm, thuật toán, validation | `pytest` / `npm test` / `go test` | 100% Pass |
| **2. Integration Test** | Giao tiếp CSDL, Transaction, Cache | `pytest tests/integration/` | 100% Pass |
| **3. API Contract** | Khớp 100% Request/Response Schema | `npm run test:contract` / `dredd` | 100% Pass |
| **4. E2E User Flow** | Luồng người dùng từ UI đến Backend | `npx playwright test` / `cypress` | 100% Pass |
| **5. Security Scan** | Quét lỗ hổng dependencies, secrets | `pip-audit` / `npm audit` / `trivy` | 0 Critical/High |
| **6. Performance** | Độ trễ API theo NFR (Latency P95) | `k6 run` / `autocannon` | P95 < 200ms |
| **7. Resilience** | Chịu lỗi khi mất mạng, DB timeout | `curl --max-time` / chaos testing | Xử lý graceful |

---

## 🎯 3. Tiêu Chuẩn Hoàn Thành (Definition of Done)

- **Test Coverage Tổng Thể**: Đạt tối thiểu **≥ 97%** trên toàn bộ mã nguồn mới.
- **Không Còn TODOs**: 0 placeholder, 0 comment tạm bợ.
- **Báo Cáo Nghiệm Thu**: Xuất file `.fullstack/specs/<branch>/verification-report.md` đầy đủ số liệu và trình bày cho Người dùng phê duyệt trước khi bàn giao.

