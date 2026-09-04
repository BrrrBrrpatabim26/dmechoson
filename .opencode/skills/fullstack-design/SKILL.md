---
name: fullstack-design
description: Solution Design — thiết kế giải pháp toàn diện 13 lĩnh vực (Domain, Application, API Contract, Data Model, UI/UX, Component, Error Handling, Security, Test Strategy, Test Env/Data, Deployment, Observability, Migration, Rollback), phân tích tác động (Impact Analysis) và cổng phê duyệt thiết kế (User Design Review Gate).
---

---
description: Solution Design — thiết kế giải pháp toàn diện 13 lĩnh vực (Domain, Application, API Contract, Data Model, UI/UX, Component, Error Handling, Security, Test Strategy, Test Env/Data, Deployment, Observability, Migration, Rollback), phân tích tác động (Impact Analysis) và cổng phê duyệt thiết kế (User Design Review Gate).
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- qa-then-continue:v1.1.0 -->
<!-- solution-design-lifecycle:v2.0.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE DESIGN_GATE)**:
> 1. **KHÔNG ĐƯỢC TỰ BỎ QUA USER DESIGN REVIEW**: Agent BẮT BUỘC phải trình bày tóm tắt giải pháp 13 lĩnh vực và ma trận tác động cho Người dùng duyệt.
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**: Tuyệt đối KHÔNG ĐƯỢC tự ý pass `design_gate` mà chưa có xác nhận từ người dùng.
> 3. **CHUYỂN TIẾP SAU KHI ĐƯỢC DUYỆT**: Chỉ khi người dùng phê duyệt Design Baseline, AI mới ghi nhận gate và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.improve-design
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**
Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `design`, `domain_design`, `app_design`, `api_contract`, `data_model`, `ui_design`, `component_design`, `error_design`, `security_design`, `test_strategy`, `test_env_data`, `deploy_design`, `obs_design`, `migration_design`, `rollback_design`, `design_plan`, `impact_analysis`, `design_ai_review`, `design_user_review`, `design_decision`
Gates to record: `design_gate`

# 📐 Solution Design & User Review Gate

> **Triết lý Thiết kế Giải pháp (Business.md Design Phase)**:
> Thiết kế giải pháp là cầu nối sống còn giữa Kiến trúc Hệ thống (`plan.md`) và Triển khai Mã nguồn (`implement.md`). Giai đoạn này bao phủ trọn vẹn 13 lĩnh vực chuyên sâu, phân tích ma trận tác động (Impact Analysis) và trình bày phương án cho Người dùng kiểm tra, phê duyệt (User Design Review Gate) trước khi bắt đầu viết code.

---

## 🗺️ Bản đồ 13 Lĩnh vực Thiết kế & Cổng Duyệt

```text
[BẮT ĐẦU SOLUTION DESIGN]
          │
          ▼
[BƯỚC 1: Xác lập 13 Lĩnh vực Thiết kế]
  ├── 1. Domain Design (Entities, Value Objects, Aggregates)
  ├── 2. Application Design (Services, Use Cases, Module Boundaries)
  ├── 3. API Contract Design (Endpoints, Request/Response JSON Schemas)
  ├── 4. Data Model (SQL Schemas, Migrations, Indexes, Constraints)
  ├── 5. UI/UX Design (Tích hợp từ kết quả /fullstack.improve-design)
  ├── 6. Component Design (Component hierarchy, Props, Events)
  ├── 7. Error Handling (Error code taxonomy, Retry policy)
  ├── 8. Security Design (Authentication, Authorization, RBAC, Secret handling)
  ├── 9. Test Strategy (Unit, Integration, Contract, E2E pyramid)
  ├── 10. Test Environment/Data Design (Staging fixtures, Test data masking)
  ├── 11. Deployment Design (Docker, CI/CD, Container specs)
  ├── 12. Observability Design (Structured logs, Metrics, Health check)
  └── 13. Migration & Rollback Design (Data migration & Emergency rollback)
          │
          ▼
[BƯỚC 2: Phân tích Tác động (Impact Analysis)] ──► Ma trận file/hệ thống bị ảnh hưởng
          │
          ▼
[BƯỚC 3: User Design Review Gate] ──► Trình bày tóm tắt giải pháp cho Người dùng duyệt
          │
          ├── [Nếu Người dùng yêu cầu sửa]: Cập nhật thiết kế ➔ Đánh giá lại tác động (CHANGE_APPROVE)
          └── [Nếu Người dùng phê duyệt]: Chốt Design Baseline ➔ Chuyển tiếp
```

---

## 📋 Hướng dẫn Thực thi Chi tiết

### Bước 1: Sinh File Thiết kế Giải pháp (`design.md`)
1. Đọc `.fullstack/specs/<branch>/plan.md`.
2. Tạo file `.fullstack/specs/<branch>/design.md` từ `templates/design-template.md`.
3. Điền đầy đủ 13 lĩnh vực thiết kế. Trong đó:
   - **Đối với dự án có Giao diện (Frontend hoặc Fullstack)**: Phần UI/UX Design BẮT BUỘC tham chiếu trực tiếp đến file đặc tả giao diện đã được tối ưu qua nhiều vòng lặp tại:
     `.fullstack/improve-design/pages/*/outputs/ui-spec-final.md` hoặc kích hoạt `/fullstack.improve-design`.
   - **API Contract Design**: BẮT BUỘC xác định rõ schema request, response, headers, mã lỗi HTTP. Đây là hợp đồng bất biến làm chuẩn cho việc code backend và frontend độc lập.

### Bước 2: Ma trận Phân tích Tác động (Impact Analysis)
Lập bảng ma trận các file, module và dịch vụ bị tác động:
- Danh sách file mới sẽ tạo.
- Danh sách file hiện hữu bị sửa đổi.
- Rủi ro phá vỡ tương thích ngược (Breaking changes) nếu có.

### Bước 3: User Design Review Gate (Trình bày cho Người dùng)
Agent trình bày bản tóm tắt súc tích cho người dùng:
```markdown
📐 **Phê duyệt Solution Design Baseline (`DESIGN_GATE`)**:
Hồ sơ thiết kế 13 lĩnh vực đã hoàn thành tại `.fullstack/specs/<branch>/design.md`.
- **Mô hình Domain & Services**: [Tóm lược Entities, Use Cases]
- **Hợp đồng API & Dữ liệu**: [Endpoints cốt lõi, DB Schema]
- **Giao diện & Thành phần UI**: [Components, UI Spec binding]
- **Chiến lược An ninh & Phục hồi**: [Auth, Security, Rollback]

👉 **Bạn có đồng ý phê duyệt Design Baseline này để chuyển sang bước tiếp theo không?**
- **[1] Đồng ý** (Tiến sang bước tiếp theo)
- **[2] Yêu cầu sửa đổi** (Nêu rõ điểm thiết kế cần thay đổi)
```

*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**.*

### Bước 4: Chốt Baseline & Chuyển tiếp Tự động
Khi người dùng phê duyệt:
1. Ghi nhận Gate:
   ```bash
   python scripts/python/flowchart_progress.py gate \
       --gate design_gate --decision pass \
       --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' \
       --rationale 'Người dùng đã phê duyệt Solution Design 13 lĩnh vực'
   ```
2. Chuyển tiếp:
   - Nếu dự án có UI và chưa chạy UI Design Skill:
     ```
     EXECUTE_COMMAND: fullstack.improve-design
     ```
   - Nếu đã có UI Spec hoặc dự án Backend thuần túy:
     ```
     EXECUTE_COMMAND: fullstack.implement
     ```



