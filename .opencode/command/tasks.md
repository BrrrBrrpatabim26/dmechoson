---
description: Tạo implementation task breakdown từ spec + plan + design. Mỗi task execution-ready cho LLM, dependency-ordered, parallelizable.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY TASK BREAKDOWN)**:
> 1. **PHÂN RÃ NHIỆM VỤ ĐỘC LẬP**: Phân rã `spec.md` và `plan.md` thành các task thực thi rõ ràng `tasks.md`.
> 2. **CHUYỂN TIẾP SANG TRIỂN KHAI**: Sau khi hoàn thành phân rã task, gọi chuyển tiếp sang:
>
> ```
> EXECUTE_COMMAND: fullstack.implement
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**


Flowchart: ` business_1_fullstack_sdd `


## User Input

```text
$ARGUMENTS
```

**Phase Business.md**: IMPLEMENTATION — Task breakdown trước khi code

## Outline

1. **Setup**: Run `scripts/powershell/setup-tasks.ps1 -Json` từ repo root và parse `FEATURE_DIR`, `TASKS_TEMPLATE_CONTENT`, `TASKS_TEMPLATE`, và `AVAILABLE_DOCS` list.

2. **Load design documents**: Read từ `FEATURE_DIR`:
   - **Required**: `plan.md` (tech stack, libraries, structure), `spec.md` (user stories with priorities)
   - **Optional**: `data-model.md` (entities), `contracts/` (interface contracts), `research.md` (decisions), `quickstart.md` (test scenarios)
   - **IF EXISTS**: Load `.fullstack/constitution.md` cho project principles

3. **Execute task generation workflow**:
   - Load `plan.md` và extract tech stack, libraries, project structure
   - Load `spec.md` và extract user stories with priorities (P1, P2, P3...)
   - If `data-model.md` exists: Extract entities và map to user stories
   - If `contracts/` exists: Map interface contracts to user stories
   - Generate tasks organized by user story (see Task Generation Rules)
   - Generate dependency graph showing user story completion order
   - Create parallel execution examples per user story
   - Validate task completeness (each user story has all needed tasks, independently testable)

4. **Generate tasks.md**: Use `TASKS_TEMPLATE_CONTENT` (hoặc `TASKS_TEMPLATE` cho older scripts) as structure. Fill với:
   - Correct feature name from `plan.md`
   - **Phase 1: Setup** tasks (project initialization)
   - **Phase 2: Foundational** tasks (blocking prerequisites cho tất cả user stories)
   - **Phase 3+**: Một phase per user story (in priority order from `spec.md`)
   - Each phase includes: story goal, independent test criteria, tests (nếu requested), implementation tasks
   - **Final Phase: Polish** & cross-cutting concerns
   - All tasks MUST follow strict checklist format
   - Clear file paths cho mỗi task
   - Dependencies section showing story completion order
   - Parallel execution examples per story
   - Implementation strategy section (MVP first, incremental delivery)

## Task Generation Rules (CRITICAL)

**Tasks MUST be organized by user story** để enable independent implementation và testing.

**Tests are OPTIONAL**: Chỉ generate test tasks nếu explicitly requested trong spec hoặc user yêu cầu TDD approach.

### Checklist Format (REQUIRED)

Every task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description với file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY nếu task parallelizable
4. **[Story] label**: REQUIRED cho user story phase tasks only
   - Format: [US1], [US2], [US3], etc.
   - Setup phase: NO story label
   - Foundational phase: NO story label
   - User Story phases: MUST have story label
   - Polish phase: NO story label
5. **Description**: Clear action với exact file path

**Examples**:

- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ CORRECT: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
- ❌ WRONG: `T001 [US1] Create model` (missing checkbox)

### Task Organization

1. **From User Stories (spec.md)** - PRIMARY ORGANIZATION:
   - Mỗi user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Interfaces/UI needed for that story
     - Tests specific to that story (if requested)

3. **From Contracts**: Map each interface contract → to user story it serves
4. **From Data Model**: Map each entity to user story(ies) that need it
5. **From Setup/Infrastructure**: Shared infra → Setup, blocking tasks → Foundational

### Phase Structure

- **Phase 1**: Setup (project initialization)
- **Phase 2**: Foundational (blocking prerequisites - MUST complete trước user stories)
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase = complete, independently testable increment
- **Final Phase**: Polish & Cross-Cutting Concerns

## Implementation Strategy

### MVP First (User Story 1 Only)

Deliver User Story 1 as Minimum Viable Product:

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (User Story 1)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo nếu viable

### Incremental Delivery

Sau MVP, deliver each user story incrementally:

1. Add User Story 2 → Test → Deploy
2. Add User Story 3 → Test → Deploy
3. Continue...

## Completion Report

Output path to generated `tasks.md` and summary:
- Total task count
- Task count per user story
- Parallel opportunities identified
- Independent test criteria for each story
- Suggested MVP scope (typically just User Story 1)
- Format validation: Confirm ALL tasks follow follow the format (checkbox, ID, labels, file paths)

Context cho task generation: $ARGUMENTS

The `tasks.md` should be **immediately executable** - each task must be specific enough đ một LLM có thể complete nó mà không cần additional context.
