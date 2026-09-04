---
name: fullstack-requirement
description: Tạo hoặc cập nhật feature specification từ mô tả ngôn ngữ tự nhiên của user. Thực hiện vấn đáp xác định phạm vi (Backend/Frontend/Fullstack) và làm rõ yêu cầu chức năng (FR/NFR).
---

---
description: Tạo hoặc cập nhật feature specification từ mô tả ngôn ngữ tự nhiên của user. Thực hiện vấn đáp xác định phạm vi (Backend/Frontend/Fullstack) và làm rõ yêu cầu chức năng (FR/NFR).
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE Q&A & REQ GATE)**:
> 1. **KHÔNG ĐƯỢC TỰ Ý BỎ QUA VẤN ĐÁP & ĐIỀN FORM**: Agent BẮT BUỘC phải gửi biểu mẫu / câu hỏi phỏng vấn có cấu trúc cho người dùng tại chặng này.
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG PHẢN HỒI**: Tuyệt đối KHÔNG ĐƯỢC tự suy đoán hoặc tự ý điền thông tin khi chưa có phản hồi từ người dùng.
> 3. **PHÊ DUYỆT REQ_GATE TRƯỚC KHI CHUYỂN TIẾP**: Trình bày tóm tắt Requirement Baseline và chỉ khi người dùng đồng ý phê duyệt, AI mới ghi nhận gate và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.plan
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**
Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `req_discovery`, `func_req`, `nfr`, `constraints`, `risk_cost`, `scope_req`, `req_model`, `req_validation`
Gates to record: `req_gate`

```bash
python scripts/python/flowchart_progress.py gate \
    --gate req_gate --decision pass \
    --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' \
    --rationale 'Người dùng đã phê duyệt Requirement Baseline qua phỏng vấn vấn đáp'
```

## User Input

```text
$ARGUMENTS
```

## Quy trình Thực thi (Outline)

### Bước 1: Vấn đáp Xác định Phạm vi & Mục tiêu (Scope Gate)
Nếu người dùng chưa nêu rõ phạm vi trong `$ARGUMENTS`, AI BẮT BUỘC gửi câu hỏi phỏng vấn:
```markdown
📋 **Xác nhận Phạm vi và Mục tiêu Dự án (Business.md Gate 1)**:
Vui lòng chọn hoặc xác nhận thông tin dự án của bạn:

1. **Phạm vi kiến trúc (`ARCH_SCOPE`)**:
   - [A] **Backend**: Chỉ phát triển Backend (API, Database, Logic, Auth).
   - [B] **Frontend**: Chỉ phát triển Giao diện UI/UX (Web/Mobile, Components).
   - [C] **Backend + Frontend (Khuyên dùng)**: Hệ thống Fullstack hoàn chỉnh.
   - [D] **Extended**: Thêm Admin Dashboard, Worker, Data Pipeline, Mobile App.

2. **Mục tiêu bàn giao (`DELIVERY_TARGET`)**:
   - [1] **Prototype** (PoC) | [2] **Staging** | [3] **Production** (Mặc định)

*(Vui lòng trả lời ví dụ "C, 3" hoặc nêu chi tiết yêu cầu của bạn)*
```
*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHẢN HỒI**.*

### Bước 2: Tạo Short Name & Thư mục Spec
Từ mô tả, trích xuất short name (2-4 từ, định dạng kebab-case như `user-auth`, `order-checkout`) và chạy script:
```bash
python scripts/python/create_new_feature.py "$ARGUMENTS" --json
```

### Bước 3: Phỏng vấn Vấn đáp Làm rõ Yêu cầu (Clarification Interview)
Đưa ra 3 câu hỏi trắc nghiệm `(Pick A/B/C)` làm rõ nghiệp vụ:
- Đối tượng người dùng chính và các phân quyền (Roles & Permissions).
- Luồng dữ liệu chính và các ràng buộc nghiệp vụ (Business Constraints).
- Các chỉ số phi chức năng quan trọng (NFR: Tốc độ phản hồi, lượng người dùng đồng thời, bảo mật dữ liệu).

*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHẢN HỒI**.*

### Bước 4: Hoàn thiện File Đặc tả (`spec.md`)
Ghi vào `.fullstack/specs/<branch>/spec.md` đầy đủ:
- **Summary**: 2-4 câu tóm lược mục đích.
- **Scope & Delivery Target**: Ghi rõ lựa chọn từ Bước 1.
- **Goals / Non-Goals**: Giới hạn phạm vi cụ thể.
- **User Stories**: P1 (Bắt buộc), P2 (Nên có), P3 (Mở rộng).
- **Functional Requirements**: `FR-001`, `FR-002`, ... dạng câu lệnh MUST/SHALL.
- **Non-Functional Requirements**: Hiệu năng, bảo mật, khả năng mở rộng.
- **Acceptance Criteria**: Given/When/Then có thể kiểm chứng độc lập.

### Bước 5: Phê duyệt Requirement Gate (`REQ_GATE`)
Gửi bản tóm tắt Requirement Baseline cho người dùng:
```markdown
📋 **Phê duyệt Requirement Baseline (`REQ_GATE`)**:
Đặc tả yêu cầu đã được lập tại `.fullstack/specs/<branch>/spec.md`.
- **Tóm tắt yêu cầu**: [Mô tả ngắn gọn]
- **Các tính năng P1**: [Danh sách tính năng chính]
- **Mục tiêu bàn giao**: [Prototype / Staging / Production]

👉 **Bạn có đồng ý phê duyệt Requirement Baseline này để chuyển sang thiết kế Kiến trúc không?**
- **[1] Đồng ý** (Tiến sang thiết kế Kiến trúc)
- **[2] Cần chỉnh sửa** (Vui lòng nêu rõ điểm cần sửa đổi)
```

*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**.*
Khi người dùng đồng ý:
1. Ghi nhận Gate:
   ```bash
   python scripts/python/flowchart_progress.py gate --gate req_gate --decision pass --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã phê duyệt Requirement Baseline'
   ```
2. Gọi chuyển tiếp:
   ```
   EXECUTE_COMMAND: fullstack.plan
   ```



