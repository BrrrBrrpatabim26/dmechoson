---
description: Implementation — thực thi mã nguồn chi tiết từ design, phân rã nhiệm vụ (Task Breakdown), chạy lệnh kiểm thử thực tế trong terminal và kích hoạt vòng lặp Debug Test (Active Debugging Loop) cho đến khi 100% test pass.
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- qa-then-continue:v1.1.0 -->
<!-- real-execution-debug-loop:v2.0.0 -->


# 💻 Implementation & Active Debug Test Loop

> **Quy tắc Kỹ nghệ Thực chiến (Business.md Implementation Phase)**:
> Tuyệt đối KHÔNG giả lập kết quả kiểm thử bằng văn bản. Mọi dòng mã nguồn được sinh ra đều phải được xác thực thông qua **các câu lệnh thực thi trực tiếp trong terminal của môi trường dự án** (Linter, Typecheck, Unit Tests). Khi phát hiện lỗi hoặc bài test thất bại, Agent BẮT BUỘC kích hoạt **Vòng lặp Debug Test thực tế** để sửa mã nguồn và chạy lại test cho đến khi toàn bộ đều xanh (Exit Code = 0).

---

## 🗺️ Luồng Thực thi Kỹ nghệ Thực tế

```text
[BẮT ĐẦU IMPLEMENTATION]
         │
         ▼
[BƯỚC 1: Phân rã nhiệm vụ chi tiết] ──► Sinh tasks.md (T001, T002, ...) theo thứ tự phụ thuộc
         │
         ▼
[BƯỚC 2: Viết mã nguồn sản phẩm] ──► Viết code hoàn chỉnh từng file, tuân thủ Clean Code
         │
         ▼
┌────────────────────────────────────────────────────────────────────────┐
│               BƯỚC 3: VÒNG LẶP DEBUG TEST THỰC TẾ TRONG TERMINAL       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. CHẠY LỆNH STATIC ANALYSIS / LINT:                                   │
│    -> Chạy npm run lint / ruff check . / mypy / tsc --noEmit           │
│                                                                        │
│ 2. CHẠY LỆNH UNIT TEST THẬT:                                           │
│    -> Chạy pytest / npm test / vitest run / cargo test / go test       │
│                                                                        │
│ 3. KIỂM TRA KẾT QUẢ THỰC TẾ:                                           │
│    - NẾU EXIT CODE = 0 (100% PASSED):                                  │
│      ==> Tuyệt vời! Commit task và chuyển sang task tiếp theo.        │
│                                                                        │
│    - NẾU EXIT CODE != 0 HOẶC CÓ BÀI TEST THẤT BẠI:                     │
│      a) BẮT LOG LỖI: Đọc chính xác traceback, thông điệp lỗi, dòng code│
│      b) PHÂN LOẠI LỖI (FAILURE_CLASS):                                 │
│         - Lỗi cú pháp / Type mismatch                                  │
│         - Lỗi logic nghiệp vụ / Sai assertions                         │
│         - Thiếu dependency / Sai đường dẫn import                      │
│      c) SỬA MÃ NGUỒN: Chỉnh sửa trực tiếp file code hoặc file test.    │
│      d) CHẠY LẠI LỆNH TEST: Thực thi lại lệnh test trong terminal.     │
│      e) LẶP LẠI cho đến khi toàn bộ test đều đạt!                      │
└────────────────────────────────────────────────────────────────────────┘
         │
         ▼
[BƯỚC 4: Implementation Gate] ──► Xác thực Build + Scan + Unit Test ➔ Chuyển sang /fullstack.analyze
```

---

## 📋 Hướng dẫn Thực thi Chi tiết

### Bước 1: Kiểm tra Tiên quyết & Phân rã Nhiệm vụ (Task Breakdown)
1. Đọc `.fullstack/specs/<branch>/design.md` (hoặc `ui-spec-final.md`).
2. Sinh file `.fullstack/specs/<branch>/tasks.md` từ `templates/tasks-template.md`:
   - Phân định rõ ràng nhiệm vụ: Backend tasks, Frontend tasks, Integration tasks.
   - Định danh `T001`, `T002`, ... với mục tiêu và tiêu chí hoàn thành độc lập.

### Bước 2: Viết Mã Nguồn Sản Phẩm (Production Code)
- Triển khai mã nguồn đầy đủ, không để lại placeholder hoặc `TODO`.
- Tách biệt rõ ràng các tầng: Controller / Handler, Service / UseCase, Repository / Data Access, UI Component.
- Tự động bổ sung các file kiểm thử tương ứng (Unit test files).

### Bước 3: 🔴 Thực thi Lệnh Debug Test & Kiểm Thử API Thực Tế trong Terminal
Agent BẮT BUỘC thực hiện gọi lệnh shell thực tế:

1. **Chạy Linter / Typecheck**:
   - Đối với Python: `ruff check .` hoặc `flake8` hoặc `mypy .`
   - Đối với Node.js/TypeScript: `npm run lint` hoặc `npx tsc --noEmit`
   - Đối với Go: `golangci-lint run` hoặc `go vet ./...`
   - Đối với Rust: `cargo clippy`

2. **Chạy Unit Tests**:
   - Đối với Python: `pytest -q` hoặc `python -m unittest`
   - Đối với Node.js: `npm test` hoặc `npx vitest run` hoặc `npx jest`
   - Đối với Go: `go test -v ./...`
   - Đối với Rust: `cargo test`

3. **Gọi API Thực Tế & Thiết Lập Timeout (Real API Calls with Timeout)**:
   - **Tự động nhận diện Host & Port**: Agent BẮT BUỘC đọc port từ cấu hình dự án (`.env`, config files, `docker-compose.yml` hoặc log khởi động server). Tuyệt đối KHÔNG hardcode cố định port nếu dự án dùng port khác (vd: 3000, 5000, 8000, 8080).
   - Khi test Backend Service / Endpoints:
     - BẮT BUỘC gọi lệnh HTTP thực tế (`curl`, `httpie`, hoặc test scripts) với cờ **`--max-time`** hoặc **`timeout`** rõ ràng (tránh treo vô hạn):
       ```bash
       # Kiểm tra Healthcheck với dynamic port và timeout 5s:
       curl -s -o /dev/null -w "%{http_code}" http://localhost:<BACKEND_PORT>/health --max-time 5

       # Test POST API có timeout 10s:
       curl -X POST http://localhost:<BACKEND_PORT>/api/v1/<endpoint> \
            -H "Content-Type: application/json" \
            -d '{"name": "test_item"}' \
            --max-time 10
       ```
     - Kiểm thử đầy đủ các mã trạng thái HTTP: `200/201 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Server Error`.

4. **Cơ Chế Phối Hợp Thao Tác Cùng User Song Song (Human-in-the-Loop Co-Testing)**:
   - Nếu gặp các tác vụ AI không thể tự động hóa 100% (như quét mã QR ngân hàng, nhập mã OTP gửi về điện thoại/email, đăng nhập OAuth bên thứ 3 Google/GitHub, cắm thiết bị ngoại vi, xác thực Captcha):
     - AI BẮT BUỘC hướng dẫn User rõ ràng theo thời gian thực và dừng lại chờ xác nhận (sử dụng đúng port thật của app):
       > 🤝 *"Tôi đang chạy backend service tại port `:<BACKEND_PORT>` và frontend tại port `:<FRONTEND_PORT>`. Vui lòng mở trình duyệt truy cập `http://localhost:<FRONTEND_PORT>/login`, thực hiện đăng nhập và nhắn 'DONE' để tôi tiếp tục kiểm tra dữ liệu trong DB."*

5. **Xử Lý Giới Hạn Đơn Luồng & Điều Phối Frontend - Backend**:
   - Khi môi trường Agent không thể chạy song song nhiều lệnh foreground (bị blocking khi chạy dev server):
     - **Giải pháp 1 (Background Process)**: Chạy backend ngầm với file log riêng (`nohup <start_command> > server.log 2>&1 &` trên Linux/macOS hoặc `Start-Process -NoNewWindow ...` trên Windows) rồi curl API.
     - **Giải pháp 2 (Yêu cầu User thao tác UI)**: Khởi chạy Backend và gửi yêu cầu rõ ràng cho User:
       > 💡 *"Backend API đã khởi động tại `http://localhost:<BACKEND_PORT>`. Vui lòng mở 1 terminal phụ chạy frontend (`npm run dev`) và thao tác thử trên UI `http://localhost:<FRONTEND_PORT>`. Sau khi thao tác xong, nhắn 'OK' để tôi curl API kiểm tra và đối chiếu database."*

6. **Xử lý Khi Gặp Lỗi (Debug Loop)**:
   - Khi terminal trả về lỗi, AI BẮT BUỘC phân tích log traceback chi tiết:
     ```text
     [DEBUG LOOP] Phát hiện lỗi kiểm thử tại file: <tên_file>:<dòng>
     Nguyên nhân: <mô tả chi tiết lỗi>
     Hành động sửa: <nội dung sửa đổi>
     Chạy lại: <lệnh test>
     ```
   - Chỉnh sửa mã nguồn và chạy lại lệnh kiểm thử cho đến khi thành công 100%.

### Bước 4: Implementation Gate & Chuyển tiếp Tự động
Khi toàn bộ test thực tế đã pass:
```bash
python scripts/python/flowchart_progress.py gate \
    --gate impl_gate --decision pass \
    --inputs '{}' --threshold '{}' \
    --rationale 'Mã nguồn đã viết hoàn chỉnh, lint và unit test thực tế pass 100%'
```

Tự động chuyển tiếp sang Chặng Kiểm định 10 Lớp:
```
EXECUTE_COMMAND: fullstack.analyze
```

