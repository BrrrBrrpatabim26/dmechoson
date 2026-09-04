# [TÊN_DỰ_ÁN] Constitution
<!-- Ví dụ: Fullstack Design Constitution, TaskFlow Constitution, ... -->

> Governing principles cho dự án fullstack-design này. Sửa file này khi
> working agreement của team thay đổi.

## 1. Purpose

Tài liệu này định nghĩa các nguyên tắc bất biến mà mọi contributor (AI
hay human) phải tôn trọng khi làm việc trong repo. Đây là nguồn sự
thật cho trade-off; khi phân vân, tham chiếu lại đây trước khi quyết
định.

## 2. Core Principles (Năm trụ cột)

### I. Stack & Boundaries

[Nguyên tắc 1: công nghệ dùng, ranh giới cấm]
<!-- Ví dụ: Frontend React + TypeScript + Vite; Backend Node.js + Express
     + TypeScript; Database PostgreSQL + Redis. CẤM gradient tím-xanh,
     fixed width ≥320px trên inner container, horizontal overflow. -->

### II. Development Workflow

[Nguyên tắc 2: workflow Spec → Plan → Design → Tasks → Implement gate]
<!-- Ví dụ: Mọi thay đổi bắt đầu bằng spec trong `.fullstack/specs/<id>/spec.md`.
     Implementation plan đi kèm trong `plan.md`, design trong `design.md`,
     task breakdown trong `tasks.md`. PR phải link bộ ba. -->

### III. Quality Bar

[Nguyên tắc 3: ngưỡng chất lượng — lint / type / coverage / 6 microstate /
4-tier feedback / mobile-first]
<!-- Ví dụ: 0 lint error, 0 type error, 100% code mới có test. Mọi
     control ship với 6 microstate (default / hover / focus / active /
     disabled / loading) + `:focus-visible` ring. 4-tier feedback: Inline
     Alert → In-pane Banner → Bottom Snackbar → Blocking Dialog. -->

### IV. AI Agent Conduct

[Nguyên tắc 4: disclosure, scope, conflict resolution]
<!-- Ví dụ: Disclose AI authorship trong commit message + PR description.
     Không sửa file ngoài scope của spec đang active. Khi spec và code
     mâu thuẫn, spec thắng — cập nhật code và sửa spec trong cùng PR. -->

### V. Governance

[Nguyên tắc 5: risk policy, approval levels, audit log]
<!-- Ví dụ: Risk policy định trước cho mỗi delivery target (Prototype /
     Staging / Production). Approval levels phân cấp theo rủi ro. Audit
     log immutable. -->

## 3. [SECTION_2_NAME]

<!-- Ví dụ: Additional Constraints, Security Requirements, Performance Standards -->

[SECTION_2_CONTENT]
<!-- Ví dụ: Technology stack requirements, compliance standards, deployment
     policies, ... -->

## 4. [SECTION_3_NAME]

<!-- Ví dụ: Development Workflow, Review Process, Quality Gates -->

[SECTION_3_NAME]
<!-- Ví dụ: Code review requirements, testing gates, deployment approval
     process, ... -->

## 5. Governance

<!-- Constitution supersede mọi practice khác; sửa đổi đòi documentation,
     approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Ví dụ: Mọi PR/review phải verify compliance; complexity phải biện
     minh; tham chiếu [GUIDANCE_FILE] cho runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Ví dụ: Version: 1.0.0 | Ratified: 2026-09-02 | Last Amended: 2026-09-02 -->
