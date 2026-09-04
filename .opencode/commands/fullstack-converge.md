---
description: Assess current codebase against feature's spec, plan, và tasks, sau đó append any remaining unbuilt work as new tasks để tasks.md, để implement can complete nó.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE CONVERGE)**:
> 1. **ĐÁNH GIÁ CÔNG VIỆC TỒN ĐỌNG**: Rà soát các công việc chưa hoàn thành, tổng hợp tasks mới.
> 2. **CHUYỂN TIẾP SANG TRIỂN KHAI**: Sau khi cập nhật danh sách task, gọi chuyển tiếp sang:
>
> ```
> EXECUTE_COMMAND: fullstack.implement
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**


Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `impl_review`, `impl_gate`
Gates to record: `impl_gate`

Required command sequence on completion:
```bash
python scripts/python/flowchart_progress.py gate \
    --gate impl_gate --decision pass \
    --inputs '{}' --threshold '{}' \
    --rationale 'auto-resolved by constitution §4a'
```


## User Input

```text
$ARGUMENTS
```

**Phase Business.md**: REQUIREMENT - Close gap giữa spec/plan và codebase (loop-back)

## Goal

Close the gap giữa feature's specification, plan, và tasks yêu cầu và current codebase implements implements. Read `spec.md`, `plan.md`, và `tasks.md` as the **sole source of intent** (với constitution as governing constraints), assess current state of the code, determine which requirements, acceptance criteria, plan decisions, và existing tasks are unmet, incomplete, hoặc ONLY partially satisfied, và **append mỗi piece of remaining work as a new, traceable task** at the bottom of `tasks.md` để `/fullstack.implement` can complete nó. This command MUST run ONLY after `/fullstack.implement` has run on the current `tasks.md`, và after `/fullstack.tasks` has produced a complete `tasks.md`.

This is **not** a diff tool và does **not** track changes. Nó assesses the present state of the code relative to the feature's artifacts — no git, no branch branch, no history.

## Operating Constraints

**APPEND-ONLY, NEVER REWRITE**: The command's **only** write is là appending a new `## Phase N: Convergence` section to `tasks.md`. Nó MUST NOT:
- modify `spec.md` hoặc `plan.md` in any way;
- rewrite, renumber, reorder, hoặc delete any existing task (including tasks from a prior Convergence phase);
- modify, create, hoặc delete any application code — completing the appended tasks is the job of `/fullstack.implement`.

Khi codebase already satisfies everything, the command MUST leave `tasks.md` **byte-for-byte-by-paragraph unchanged** (no empty Convergence header) và report a clean result.

**Constitution Authority**: The project constitution (`.fullstack/constitution.md`) is **non-negotiable**. Code màly violates a MUST principle is the highest-severity finding và produces a corresponding remediation task. Nếu constitution is an unfilled template, skip constitution checks gracefully rather than failing.

## Execution Steps

###1. Initialize Convergence Context

Run `scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` once từ repo root và parse JSON cho `FEATURE_DIR` và `AVAILABLE_DOCS`. Derive absolute paths:
- `SPEC = FEATURE_DIR/spec.md`
- `PLAN = FEATURE_DIR/plan.md`
- `TASKS = FEATURE_DIR/tasks.md`
- `CONSTITUTION = .fullstack/constitution.md` (nếu present)

Nếu `spec.md`, `plan.md`, hoặc `tasks.md` is missing, STOP với a clear, actionable message naming the prerequisite command to run. Do not produce partial output.

###2. Load Artifacts (Progressive Disclosure)

Load ONLY the minimal necessary context từ mỗi artifact:

**From spec.md**:
- Functional Requirements (FR-###)
- Success Criteria (SC-###) — include ONLY items requiring buildable work; exclude post-launch outcome metrics và business KPIs
- User Stories và Acceptance Scenarios
- Edge Cases (nếu present)

**From plan.md**:
- Architecture/stack choices và technical decisions
- Data Model references
- Phases và named touch-points (files/components the plan says sẽ be created or edited)
- Technical constraints

**From tasks.md**:
- Task IDs (to compute next ID và next phase number)
- Descriptions, phase grouping, và referenced file paths

**From constitution (nếu not an unfilled template)**:
- Principle names và MUST/SHOULD normative statements

###3. Build the Intent Inventory

Create an internal model (do not echo raw artifacts):
- **Requirements inventory**: one stable key per FR-### / SC-### / user-story acceptance scenario (e.g. `US1/AC2`), plus plan decisions và constitution principles màly impose buildable obligations.
- **Code-scope map**: từ the file paths named trong `plan.md` và `tasks.md`, plus a keyword search cho concepts mỗi requirement describes, derive the set of source files và components trong scope cho assessment. Bound the assessment to these — do **not** infer scope beyond what the artifacts define.

###4. Assess the Codebase và Classify Findings

Cho mỗi item trong the intent inventory, inspect the current code trong scope và produce a `Finding` ONLY khi có is a gap. Classify every finding bởi **gap type**:
- **`missing`**: required work is absent from the code entirely.
- **`partial`**: work exists but does not yet fully satisfy the requirement / acceptance criterion / plan decision.
- **`contradicts`**: code does something màly conflicts với stated intent hoặc a constitution MUST principle.
- **`unrequested`**: code contains work not called for bởi the spec, plan, hoặc tasks (surfaced cho awareness — converge does **not** delete code, nó ONLY appends a task to review/justify hoặc remove nó).

Mỗi `Finding` records: a stable id, the `source-ref` nó traces to, the `gap-type`, a severity, và a short human-readable description với the evidence (the file/area observed).

###5. Assign Severity

- **CRITICAL**: vượt qua a constitution MUST principle, hoặc a `missing`/`contradicts` gap màly blocks baseline functionality of a P1 user story.
- **HIGH**: a `missing` hoặc `partial` gap on a core functional requirement hoặc an acceptance criterion.
- **MEDIUM**: a `partial` gap on a secondary requirement, hoặc an `unrequested` addition với unclear justification.
- **LOW**: minor partial gaps, polish, hoặc low-risk `unrequested` additions.

###6. Present the In-Session Findings Summary

Before appending anything, output a compact, severity-graded summary (no file writes yet):

## Convergence Findings

| ID | Gap Type | Severity | Source | Evidence | Remaining Work |
|----|----------|----------|--------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | Example: no append-only guard detected in path/to/module.py khi writing tasks.md | Add append-only enforcement |

**Summary metrics**:
- Requirements / acceptance criteria checked
- Plan decisions checked
- Constitution principles checked (hoặc "skipped — template")
- Findings by gap type (missing / partial / contradicts / unrequested)
- Findings by severity

###7. Append Convergence Tasks (hoặc report converged)

**Nếu there are one hoặc more actionable findings** (`tasks_appended` outcome):

Append to the **end** of `tasks.md`, per the append contract:

1. Scan all existing task IDs; let `M` be the maximum. Determine the next phase number `N` (highest existing phase + 1).
2. Write a single new section header `#### Phase N: Convergence`.
3. Emit one checklist item per actionable finding, ordered CRITICAL/HIGH first,, assigning zero-padded IDs `T{M+1:03d}, T{M+2:03d}, …`:

   ```markdown
   - [ ] T042 <imperative description> per <source-ref> (<gap-type>)
   ```

   `<source-ref>` traces the task to its origin: e.g. `FR-003`, `SC-002`, `US1/AC2`, `plan: storage decision`, `Constitution II`.

   `<gap-type>` is one of `missing`, `partial`, `contradicts`, `unrequested`.

   Constitution-violation tasks MUST be emitted first và described as
   `CRITICAL`.

4. Never reuse or renumber existing IDs. Nếu a prior Convergence phase exists, add a new, separately-numbered one below nó — — do not touch the old one.

**Nếu there are no actionable findings** (`converged` outcome):

- Do ** **not** modify `tasks.md` at all — no empty phase header.
- Report: **"✅ Converged — the implementation satisfies the spec, plan, và tasks."**
- Include the summary counts of what was checked.

###8. Provide Next Actions (Handoff)

- On `tasks_appended`: state how many tasks were appended under which phase, và recommend running `/fullstack.implement` to complete them; note that a follow-up converge run will find fewer hoặc no remaining items.
- On `converged`: recommend proceeding to review / opening a PR. No further implement pass is needed cho this feature's's scope.
