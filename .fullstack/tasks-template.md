# Tasks Breakdown: [FEATURE NAME]

> Companion to `spec.md` + `plan.md`. Tasks là checklist ** execution-ready** đ cho LLM có thể thực thi ngay.

**Purpose**: Phân chia feature thành các tasks có thể execute được, dependency-ordered, parallelizable. Mỗi task phải đủ cụ thể đ một LLM có thể hoàn thành mà không cần thêm context.

**Created**: YYYY-MM-DD
**Feature**: [Link to spec.md]
**Plan**: [Link to plan.md]
**Phase**: Implementation

## Task Generation Rules (CRITICAL)

**Tasks MUST be organized by user story** để enable independent implementation và testing.

**Tests are OPTIONAL**: Chỉ generate test tasks nếu user explicitly request trong spec hoặc user yêu cầu TDD approach.

### Checklist Format (REQUIRED)

EveryMỗi task MUST strictly follow this format:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components**:

1. **Checkbox**: ALWAYS start with `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential number (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY nếu task parallelizable (different files, no dependencies on incomplete tasks)
4. **[Story] label**: REQUIRED cho user story phase tasks only
   - Format: [US1], [US2], [US3], etc. ( maps to user stories from spec.md)
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
- ❌ WRONG: `- [ ] [US1] Create User model` (missing Task ID)
- ❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)

## Dependencies

- **Setup (Phase 1)** → blocks **all other phases**
- **Foundational (Phase 2)** → blocks **all user stories**
- **User Stories (Phase 3+)** → mostly independent; dependencies noted below
- **Polish (Final)** → depends on **all user stories**

## Parallel Opportunities

- All tasks marked `[P]` can run in parallel within their phase
- Different user stories can be worked on in parallel
- Within a a user story, follow task dependency order

## Implementation Strategy

### MVP First (User Story 1 Only)

Deliver **User Story 1** as Minimum Viable Product:

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (User Story 1)
4. **STOP and VALID**ATE: Test User Story 1 independently
5. Deploy/demo nếu viable

### Incremental Delivery

Sau MVP, deliver each user story incrementally:

1. Add User Story 2 → Test → Deploy
3. Add User Story 3 → Test → Deploy
4. Continue...

## Phases

### Phase 1: Setup (Project Initialization)

**Goal**: Khởi tạo project structure và dev environment.

**Independent Test**: Project builds, dev server runs, basic shell command works.

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [framework] project với [specific config]
- [ ] T003 [P] Configure linting và formatting tools
- [ ] T004 [P] Configure testing framework
- [ ] T005 [P] Setup CI/CD pipeline stubs

### Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Implement core infrastructure mà MỌI user stories phụ thuộc vào.

**Independent Test**: Foundation services hoạt động correctly, có thể tested in isolation.

- [ ] T006 Setup database schema và migrations
- [ ] T007 [P] Implement authentication framework
- [ ] T008 [P] Implement logging và monitoring infrastructure
- [ ] T009 [P] Setup API routing framework
- [ ] T010 [P] Configure error handling middleware

### Phase 3: User Story 1 — [US1 Title]

**Goal**: [US1 goal]

**Independent Test**: [How to verify US1 works alone, without other stories]

- [ ] T011 [P] [US1] Create [Entity] model in src/models/[entity].py
- [ ] T012 [P] [US1] Create [Entity] service in src/services/[entity]_service.py
- [ ] T013 [US1] Implement [Entity] API endpoint in src/api/[entity].py
- [ ] T014 [P] [US1] Write unit tests for [Entity] service
- [ ] T015 [US1] Integrate [Entity] với frontend component

### Phase 4: User Story 2 — [US2 Title]

**Goal**: [US2 goal]

**Independent Test**: [How to verify US2 works alone]

- [ ] T016 [P] [US2] Create [Entity2] model in src/models/[entity2].py
- [ ] T017 [US2] Implement [Entity2] service in src/services/[entity2]_service.py
- [ ] T018 [US2] Add [Entity2] API endpoints
- [ ] T019 [P] [US2] Write tests for [Entity2]
- [ ] T020 [US2] Integrate [Entity2] với UI

### Phase 5: User Story 3 — [US3 Title] (Optional)

**Goal**: [US3 goal]

**Independent Test**: [How to verify US3 works alone]

- [ ] T021 [P] [US3] Create [Entity3] model
- [ ] T022 [US3] Implement [Entity3] service
- [ ] T023 [US3] Add [Entity3] API
- [ ] T024 [P] [US3] Write tests
- [ ] T025 [US3] Integrate UI

### Final Phase: Polish & Cross-Cutting Concerns

**Goal**: Improvements affecting multiple user stories.

- [ ] T026 [P] Documentation updates in docs/
- [ ] T027 [P] Performance optimization pass
- [ ] T028 [P] Security audit fixes
- [ ] T029 [P] Accessibility audit (WCAG 2.1 AA)
- [ ] T030 Code cleanup và refactoring

## Validation Checklist

Trước khi mark tasks.md là complete:

- [ ] All tasks follow checklist format (- [ ], ID, [P?], [Story?], description với file path)
- [ ] All user stories (P1, P2, P3...) có đầy đủ tasks
- [ ] Independent test criteria defined cho each story
- [ ] MVP scope identified (typically just User Story 1)
- [ ] Dependencies noted (Setup → Foundational → Stories → Polish)
- [ ] Parallel opportunities identified
- [ ] Rollback plan exists cho each phase