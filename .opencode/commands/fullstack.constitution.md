---
description: Project Constitution — governing principles every phase is evaluated against. Update whenever principles change.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE GOVERNANCE)**:
> 1. **THIẾT LẬP NGUYÊN TẮC CỐT LÕI**: Đọc và cập nhật nguyên tắc điều lệ dự án `.fullstack/memory/constitution.md`.
> 2. **CHUYỂN TIẾP SANG YÊU CẦU**: Sau khi hoàn thành thiết lập điều lệ, gọi chuyển tiếp sang:
>
> ```
> EXECUTE_COMMAND: fullstack.requirement
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**


Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `constitution`


## User Input

```text
$ARGUMENTS
```

Bạn **PHẢI** cân nhắc user input trước khi tiếp tục (nếu không rỗng).
Input là principles hoặc values cho project constitution (mirror
fullstack-design `/Fullstack.constitution`).

## Phase Reference

**Business.md**: GOVERNANCE (cross-cutting) — thiết lập / cập nhật
nguyên tắc bất biến cho mọi phase. Constitution là nguồn sự thật cho
mọi trade-off; khi phân vân, tham chiếu lại đây trước khi quyết định.
Xem Business.md flowchart #1, GOVERNANCE (cross-phase).

## Pre-Execution Checks

**Check for extension hooks (before constitution update)**:
- Nếu `.fullstack/extensions.yml` tồn tại, đọc và tìm entries dưới
  `hooks.before_constitution`.
- Filter bỏ `enabled: false`, default enabled nếu không có field.
- Output theo `optional` flag (xem pattern trong `/fullstack.requirement`).
- Skip silently nếu file không tồn tại.

## Outline

1. **Identify the project context** — đọc `.fullstack/memory/constitution.md`
   nếu tồn tại; nếu không, tạo từ `templates/constitution-template.md`
   (mirror fullstack-design `templates/constitution-template.md`).
2. **Apply the user input** làm principles mới (hoặc amendment).
3. **Validate** principles chống Five Pillars:
   - **Stack & Boundaries** — tech nào, forbidden patterns nào.
   - **Development Workflow** — Spec → Plan → Tasks → Implement gate.
   - **Quality Bar** — lint / type / coverage thresholds, 6 microstates,
     4-tier feedback, mobile-first containment.
   - **AI Agent Conduct** — disclosure, scope, conflict resolution.
   - **Governance** — risk policy, approval levels, audit log.
4. **Cross-link** dependent templates (vd: spec-template.md,
   plan-template.md) nếu constitution thay đổi section chúng reference.
5. **Bump version** theo semver:
   - **MAJOR** — xóa hoặc reword MUST principle
   - **MINOR** — thêm MUST principle hoặc expand scope
   - **PATCH** — wording, typo, clarifications
6. **Update Sync Impact** section ở cuối constitution: liệt kê
   templates / commands / scripts cần re-validate sau khi đổi.
7. **Report** đường dẫn cuối cùng và one-line summary của mọi thay đổi.

## Guardrails

- File này là source of truth. Mọi thay đổi phải reviewed bởi human
  trước khi commit.
- KHÔNG silently rewrite constitution — show diff trước.
- Constitution được consume bởi Requirement, Architecture, Design,
  Implementation, Verification, và Release gates. Mọi thay đổi nên
  evaluate impact lên cả 6.
- Version bump **BẮT BUỘC** cho mọi thay đổi substantive.
- Ratification date chỉ set khi tạo mới, không update khi amend.

## Context

$ARGUMENTS

