---
name: fullstack-plan
description: Architecture Engineering — generate Backend / Frontend / Extended architecture decisions + 6 cross-cutting (API, Data, Security, Infra, Deploy, Observability) + Future/Evolution analysis.
---

---
description: Architecture Engineering — generate Backend / Frontend / Extended architecture decisions + 6 cross-cutting (API, Data, Security, Infra, Deploy, Observability) + Future/Evolution analysis.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE ARCH_GATE)**:
> 1. **KHÔNG ĐƯỢC TỰ BỎ QUA PHÊ DUYỆT KIẾN TRÚC**: Agent BẮT BUỘC phải trình bày đề xuất Kiến trúc (Tech Stack, ADR) và đánh giá tiến hóa tương lai (`FUTURE_QUEST`).
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**: Tuyệt đối KHÔNG ĐƯỢC tự ý pass `arch_gate` mà chưa có xác nhận từ người dùng.
> 3. **CHUYỂN TIẾP SAU KHI ĐƯỢC DUYỆT**: Chỉ khi người dùng phê duyệt Architecture Baseline, AI mới ghi nhận gate và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.design
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**

Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `architecture`, `arch_scope`, `backend_arch`, `frontend_arch`, `extended_arch`, `arch_integration`, `api_arch`, `data_arch`, `security_arch`, `infra_arch`, `deploy_arch`, `obs_arch`, `arch_draft`, `future`, `arch_review`
Gates to record: `arch_gate`

```bash
python scripts/python/flowchart_progress.py gate \
    --gate arch_gate --decision pass \
    --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' \
    --rationale 'Người dùng đã phê duyệt Architecture Baseline và ADR'
```



## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** cân nhắc user input trước khi tiếp tục (nếu không rỗng).
Input là path đến file `spec.md`. Nếu rỗng, default về
`.fullstack/specs/*/spec.md` (mới nhất).

## Phase Reference

**Business.md**: ARCHITECTURE — chọn stack Backend / Frontend / Extended
+ 6 cross-cutting architecture (API, Data, Security, Infra, Deploy,
Observability) + Future/Evolution analysis. Xem Business.md flowchart #1,
ARCHITECTURE phase. Phase trước là REQUIREMENT (`/fullstack.requirement`),
phase sau là DESIGN (`/fullstack.design`) hoặc TASKS (`/fullstack.tasks`).

## Pre-Execution Checks

**Check for extension hooks (before planning)**:
- Nếu `.fullstack/extensions.yml` tồn tại, đọc và tìm entries dưới
  `hooks.before_plan`.
- Filter bỏ `enabled: false`, default enabled nếu không có field.
- Output theo `optional` flag (xem pattern trong `/fullstack.requirement`).
- Skip silently nếu file không tồn tại.

## Outline

1. **Locate the spec** tại path được cung cấp. Reject với error rõ ràng
   nếu không tồn tại hoặc thiếu Required-5-classes fields (Functional /
   NFR / Constraints / Risk / Scope).
2. **Detect scope** (Backend / Frontend / Backend+Frontend /
   Mobile+Admin+Worker+Data+Integration) từ spec.
3. **Architecture Decision per component** — với mỗi component detect
   được, chọn stack (vd: Backend: Node.js + Express + TypeScript;
   Frontend: React + Vite + TypeScript; Mobile: React Native; Data:
   Postgres + Redis; ...). Document ADR-style.
4. **Architecture Integration** — sáu cross-cutting views:
   - **API/Contract Architecture** — REST/GraphQL/gRPC, OpenAPI spec.
   - **Data Architecture** — schema, migrations, ownership.
   - **Security Architecture** — authn, authz, secrets, threat model.
   - **Infrastructure/Cost Architecture** — cloud, sizing, cost projection.
   - **Deployment Architecture** — CI/CD, envs, promotion.
   - **Observability Architecture** — logs, metrics, traces, alerts.
5. **Future/Evolution Analysis** — explicit pass qua
   Traffic / Scale / Availability / Multi-tenant / Audit / Cost /
   Independent Deployment. Nếu bất kỳ cái nào imply architecture
   change, loop back về step 3.
6. **Architecture Gate** — Baseline + ADR + Governance. AI gửi đề xuất cho Người dùng duyệt:
   ```markdown
   🏛️ **Phê duyệt Architecture Baseline & ADR (`ARCH_GATE`)**:
   Kiến trúc hệ thống đã được lập tại `.fullstack/specs/<id>-<slug>/plan.md`.
   - **Tech Stack lựa chọn**: [Backend, Frontend, Database, Auth]
   - **Mô hình kiến trúc**: [Monolith / Modular / Microservices / Serverless]
   - **Đánh giá mở rộng (Future Evolution)**: [Scale, Data growth, Cost]

   👉 **Bạn có đồng ý phê duyệt Architecture Baseline này để chuyển sang bước Thiết kế Giải pháp chi tiết không?**
   - **[1] Đồng ý** (Tiến sang bước tiếp theo)
   - **[2] Cần chỉnh sửa** (Vui lòng nêu rõ điểm cần điều chỉnh)
   ```
   *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**.*
7. **Transition**: Khi người dùng phê duyệt, ghi nhận `flowchart_progress.py gate` và tự động gọi:
   ```
   EXECUTE_COMMAND: fullstack.design
   ```

## Guardrails

- KHÔNG viết code ở phase này — defer cho `/fullstack.design` và `/fullstack.implement`.
- Multi-component project phải produce 1 ADR per component decision.
- Constitution MUST principles phải pass; nếu có vi phạm, yêu cầu điều chỉnh trước khi chốt ADR.


## Context

$ARGUMENTS


