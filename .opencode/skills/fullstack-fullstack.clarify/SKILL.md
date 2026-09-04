---
name: fullstack-fullstack.clarify
description: Fullstack fullstack.clarify
---

---
description: Identify underspecified areas trong current feature spec bằng cách hỏi clarification questions liên tục cho đến khi toàn bộ taxonomy được resolved (cap cứng: 500 câu).
handoffs:
  - label: Build Technical Plan
    agent: fullstack.plan
    prompt: Tạo plan cho spec. Tôi đang build với...
---

<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->
<!-- clarify-unlimited-loop:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE CLARIFY Q&A)**:
> 1. **VẤN ĐÁP LÀM RÕ NGHIỆP VỤ**: Agent BẮT BUỘC phải đưa ra các câu hỏi trắc nghiệm `(Pick A/B/C)` để người dùng làm rõ các điểm mơ hồ về nghiệp vụ.
> 2. **DỪNG LẠI CHỜ NGƯỜI DÙNG TRẢ LỜI**: Sau khi gửi câu hỏi, Agent DỪNG LẠI chờ phản hồi từ người dùng trước khi cập nhật spec.
> 3. **CHUYỂN TIẾP SAU KHI LÀM RÕ**: Khi các điểm mơ hồ đã được giải quyết, cập nhật spec và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.requirement
> ```


<!-- clarify-unlimited-loop:start -->

> **🔁 Unlimited Q&A loop (v1.1.0).** Phiên bản này **KHÔNG
> giới hạn 5 câu** như spec-kit gốc. Hỏi **liên tục cho đến khi**
> mọi category trong taxonomy đạt `Status: Resolved` (KHÔNG còn
> `Partial` hoặc `Missing`). Cap cứng an toàn: **tối đa 500 câu**
> (cấu hình qua `$ARGUMENTS --max-questions=N` hoặc env
> `FULLSTACK_CLARIFY_MAX=500`).
>
> Lý do: spec-kit giới hạn 5 câu gây ra hiện tượng **partial-fix**
> — user trả lời 1 câu, AI cập nhật spec, nhưng câu trả lời mới
> lại sinh ra gap mới (vd: user nói "OAuth2" → phát sinh câu hỏi
> mới về token lifetime, refresh flow, ...). Giới hạn 5 câu bỏ qua
> gap mới này và để Plan phase phát hiện sau → rework tốn kém.
>
> Quy tắc vòng lặp mới:
> 1. Hỏi câu tiếp theo từ priority queue.
> 2. Apply answer vào spec (incremental).
> 3. **Re-scan** taxonomy toàn diện: câu trả lời này có tạo
>    gap mới không? Có category nào đã Clear nay thành Partial không?
> 4. Nếu còn **bất kỳ** category nào `Partial` hoặc `Missing`
>    → tiếp tục queue thêm câu mới cho categories đó.
> 5. Lặp cho đến khi taxonomy = 100% Clear/Resolved HOẶC đạt
>    cap `--max-questions` (default 500).
>
> Nếu đạt cap mà vẫn còn Outstanding → tự động record
> `Outstanding` categories vào spec's `## Clarifications` section,
> waive flowchart node `req_validation`, và auto-chain sang
> `fullstack.plan` (Plan phase sẽ tự phát hiện Outstanding trong
> review pass của nó).

<!-- clarify-unlimited-loop:end -->


> **Constitution §4a — End-to-End Automation.** This command
> does NOT pause for human approval. Every gate decision is
> auto-resolved by AI evaluation and recorded in
> `.fullstack/memory/flowchart_progress.json` (see
> `templates/commands/fullstack.flowchart-progress.md`).
> User Q&A is information-gathering only; the workflow
> auto-continues after every Q&A.

**Flowchart progress hooks (constitution §4a rule #4):**

Flowchart: ` business_1_fullstack_sdd `


## User Input

```text
$ARGUMENTS
```

**Phase Business.md**: REQUIREMENT - Structured clarification của underspecified areas

## Outline

Goal: Detect và reduce ambiguity hoặc missing decision points trong active feature specification và record clarifications trực tiếp trong spec file.

Note: This clarification workflow is expected to run (và be completed) BEFORE invoking `/fullstack.plan`. Nếu user explicitly states họ are skipping clarification (e.g., exploratory spike),), bạn có thể proceed, but must warn downstream rework risk increases.

Execution steps:

###1. Run `scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly` từ repo root **once** (combined `--json --paths-only` mode). Parse minimal JSON payload fields:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Optionally capture `IMPL_PLAN`, `TASKS` cho future chained flows.)
   - Nếu JSON parsing fails, abort và instruct user to re-run `/fullstack.requirement` hoặc verify feature branch environment.

###2. **IF EXISTS**: Load `.fullstack/constitution.md` cho project principles.

###3. Load the current spec file. Perform a structured ambiguity & coverage scan sử dụng taxonomy này. Cho mỗi category, mark status: Clear / Partial / Missing. Produce an internal coverage map dùng cho prioritization (không output raw map trừ khi no questions to sẽ be asked).

   **Functional Scope & Behavior**:
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   **Domain & Data Model**:
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   **Interaction & UX Flow**:
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility hoặc localization notes

   **Non-Functional Quality Attributes**:
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   **Integration & External Dependencies**:
   - External services/APIs và failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   **Edge Cases & Failure Handling**:
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   **Constraints & Tradeoffs**:
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs hoặc rejected alternatives

   **Terminology & Consistency**:
   - Canonical glossary terms
   - Avoided synonyms / / deprecated terms

   **Completion Signals**:
   - Acceptance criteria testability
   - Measurable Definition of Done style indicators

   **Misc / Placeholders**:
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

###4. Generate (internally) a prioritized queue of clarification questions. **NO hard cap of 5**. Apply these constraints:
   - Each question must be answerable với EITHER:
     - A short multiple-choice selection (2–5 distinct, mutually exclusive options), OR
     - A one-word / short-phrase answer (explicitly constrain: "Answer in <=5 words").
   - Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, hoặc compliance validation.
   - Ensure category coverage balance: attempt to cover the highest impact unresolved categories first; avoid asking two low-impact questions khi một high-impact area (e.g., security posture) is unresolved.
   - Exclude questions already answered, trivial stylistic preferences, hoặc plan-level execution details (trừ blocking correctness).
   - Favor clarifications mà reduce downstream rework risk hoặc prevent misaligned acceptance tests.
   - The queue is rebuilt incrementally after each accepted answer (see step 5 loop).

###5. **Unlimited sequential questioning loop** (interactive, until taxonomy fully resolved):

   **Termination conditions (whichever happens FIRST):**
   - **A. Taxonomy fully resolved**: Every category in step 3 taxonomy is `Status: Resolved` hoặc `Clear`. No category còn `Partial` hoặc `Missing`. → Stop loop, go to step 6.
   - **B. Hard cap reached**: Total asked questions >= `max_questions` (default **500**, configurable qua `--max-questions=N` argument hoặc env `FULLSTACK_CLARIFY_MAX=500`). → Stop loop, record Outstanding categories, waive flowchart node, auto-chain sang `/fullstack.plan`. KHÔNG prompt user.
   - **C. User early termination**: User signals completion với "done", "good", "no more", "stop", "đủ rồi", or "ok". → Stop, mark Outstanding, auto-chain.

   **Per-iteration behaviour:**
   - Present EXACTLY ONE question at a time.
   - **Question writing quality (applies to mọi question, MC hoặc short-answer):**
     - Lead với `**Question:**` theo sau bởi a full interrogative mà ends với `?`. The question text trước `?` must make sense on its own.
     - NEVER dùng a topic label, section heading, hoặc requirement id as the question itself. Ví dụ: `Acceptance device/runtime matrix (FR-023)` is INVALID — nó is a label, không a question.
     - After the `?`, the only permitted suffix is an optional parenthesized requirement/question id. Exact format: `**Question:** <interrogative>?` hoặc `**Question:** <interrogative>? (FR-023)`. Never put the id trước `?`, và never dùng the id (alone hoặc với a topic label) as the whole prompt.
     - Immediately after the question line, add one plain-language "Why it matters" sentence (the stake cho acceptance hoặc shipping) trước the recommendation/options.
     - Use everyday wording; introduce jargon ONLY nếu defined trong the same sentence. Self-check: a reader who does not know Fullstack CLI must có thể answer từ the Question line alone. Terse is fine; cryptic labels are not.
   - Cho multiple-choice questions:
     - **Analyze all options** và determine the **most suitable option** based on:
       - Best practices cho project type
       - Common patterns trong similar implementations
       - Risk reduction (security, performance, maintainability)
       - Alignment với any explicit project goals hoặc constraints visible trong the spec
     - Present your **recommended option prominently** at the top với clear reasoning (1-2 sentences explaining why this is the best choice).
     - Format as: `**Recommended:** Option [X] - <reasoning>`
     - Then render all options as a Markdown table:

        | Option | Description |
        |--------|-------------|
        | A | <Option A description> |
        | B | <Option B description> |
        | C | <Option C description> (add D/E as needed up to 5) |
        | Short | Provide a different short answer (<=5 words) (Include ONLY nếu free-form alternative is appropriate) |

     - After the table, add: `You can reply với the option letter (e.g., "A"), accept the recommendation bởi saying "yes" hoặc "recommended", hoặc provide your own short answer.`
   - Cho short-answer style (no meaningful discrete options):
     - Provide your **suggested answer** based based on best practices và context.
     - Format as: `**Suggested:** <your proposed answer> - <brief reasoning>`
     - Then output: `Format: Short answer (<=5 words). You can accept the suggestion bởi saying "yes" hoặc "suggested", hoặc provide your own answer.`
   - After user answers:
     - Nếu user replies với "yes", "recommended", hoặc "suggested", dùng your previously stated recommendation/suggestion as the answer.
     - Otherwise, validate the answer maps to one option hoặc fits the <=5 word constraint.
     - Nếu ambiguous, ask cho a quick disambiguation (count still belongs to same question; do not advance).
     - Once satisfactory, record nó trong working memory (do not yet write to disk) và move to next queued question.
   - **Incremental re-scan (key change vs spec-kit):**
     - After EACH accepted answer, re-run step 3 taxonomy scan on the updated spec.
     - **NEW categories** may surface (vd: user mentions OAuth2 → "Auth Token Lifetime" appears).
     - **Resolved categories** may regress (user says "no real-time updates" → "Real-time Notifications" goes Clear → N/A or deferred; but "Polling Interval" becomes Partial).
     - Append newly surfaced questions to the queue. Remove resolved ones.
     - Print progress every 10 questions: `Progress: 12/500 questions asked. Coverage: 7/22 categories Clear, 9 Partial, 6 Missing.`
   - Never reveal future queued questions in advance.
   - Nếu no valid questions exist at start (initial scan = all Clear), immediately report no critical ambiguities và skip to step 6.

###6. Integration after EACH accepted answer (incremental update approach):
   - Maintain in-memory representation of the spec (loaded once at start) plus the raw file contents.
   - Cho the first integrated answer trong this session:
     - Ensure a `## Clarifications` section exists (create nó just after the highest-level contextual/overview section per the spec template nếu missing).
     - Under nó, create (nếu not present) a `### Session YYYY-MM-DD` subheading cho today.
   - Append a bullet line immediately after acceptance: `- Q: <question> → A: <final answer>`.
   - Then immediately apply the clarification to the most appropriate section(s):
     - Functional ambiguity → Update hoặc add a bullet trong Functional Requirements.
     - User interaction / actor distinction → Update User Stories hoặc Actors subsection (nếu present) với clarified role, constraint, hoặc scenario.
     - Data shape / entities → Update Data Model (add fields, types, relationships) preserving ordering; note added constraints succinctly.
     - Non-functional constraint → Add/modify measurable criteria trong Success Criteria > Measurable Outcomes (convert vague adjective to metric hoặc explicit target).
     - Edge case / negative flow → Add a new bullet under Edge Cases / Error Handling (hoặc create such subsection nếu template provides placeholder cho it).
     - Terminology conflict → Normalize term toàn bộ spec; retain original ONLY nếu necessary bằng cách adding `(formerly referred to as "X")` once.
   - Nếu the clarification invalidates an earlier ambiguous statement, replace that statement instead of duplicating; leave no obsolete contradictory text.
   - Save the spec file AFTER each integration to minimize risk of context loss (atomic overwrite).
   - Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
   - Keep mỗi inserted clarification minimal và testable (avoid narrative drift).

###7. Validation (performed after EACH write plus final pass):
   - Clarifications session contains exactly one bullet per accepted answer (no duplicates).
   - Total asked (accepted) questions ≤ `max_questions` (default 500).
   - Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
   - No contradictory earlier statement remains (scan for now-invalid alternative choices removed).
   - Markdown structure valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Terminology consistency: same canonical term used toàn bộ updated sections.

###8. Write the updated spec back to `FEATURE_SPEC`.

###9. **Re-validate Spec Quality Checklist** (nếu exists):
   - Check nếu `FEATURE_DIR/checklists/requirements.md` exists.
   - Nếu nó does NOT exist, skip this this silently.
   - Nếu exists:
     1. Read the checklist file.
     2. Identify tất cả GitHub task-list checkbox lines — lines matching `- [ ]`, `- [x]`, hoặc `- [X]` (case-insensitive, tolerant of leading whitespace cho nested items) outside of code fences. Ignore tất cả other content (headings, notes, non-checkbox bullets, metadata).
     3. Cho mỗi checkbox line, record its current marker state (checked hoặc unchecked) và item text vào a before-snapshot list.
     4. Re-evaluate mỗi checkbox item against the **updated** spec (the version just saved in step 7).
     5. Cho mỗi checkbox item, update ONLY nếu the checked/unchecked state actually changes:
        - Nếu the item now passes và was unchecked: change `[ ]` to `[x]`.
        - Nếu the item now fails và was checked: change `[x]`/`[X]` to `[ ]`.
        - Nếu the state is unchanged: leave the marker as-is (preserve existing case to đ cosmetic diffs).
     6. Save the updated checklist file. **Only toggle the `[ ]`/`[x]` marker portion of checkbox lines whose state changed.** All other file content — headings, metadata, notes, line ordering, whitespace — must remain unchanged to avoid noisy diffs.
     7. Compare the before-snapshot với the current state to compute three lists cho the Completion Report:
        - **Newly passing**: items mà changed from unchecked to checked.
        - **Regressions**: items mà changed from checked to unchecked.
        - **Still unchecked**: items mà remain unchecked.
     8. Record the before/after pass counts as checked/total checkbox items (e.g., "12/16 → 15/16 items passing").

## Completion Report

Report completion (after questioning loop ends or early termination):
- Number of questions asked & answered (e.g., "47/500 — taxonomy 100% resolved" hoặc "500/500 — cap reached, 3 Outstanding").
- Termination reason: A (taxonomy resolved) / B (cap reached) / C (user early-terminated).
- Path to updated spec.
- Sections touched (list names).
- Spec quality checklist status (nếu `FEATURE_DIR/checklists/requirements.md` was re-validated): show before/after pass counts (e.g., "Spec Quality Checklist: 12/16 → 15/16 items passing") và list any items mà changed state — both newly checked (unchecked → checked) và any regressions (checked → unchecked). Nếu any items remain unchecked, list them as areas needing attention.
- Coverage summary table listing mỗi taxonomy category với Status: Resolved (was Partial/Missing và addressed), Deferred (exceeds question quota hoặc better suited cho planning), Clear (already sufficient), Outstanding (still Partial/Missing but low impact).
- Nếu any Outstanding hoặc Deferred remain, auto-proceed to
  `/fullstack.plan` (auto-loop will resolve Outstanding there).
  **KHÔNG gợi ý user chạy command khác.**

Context cho prioritization: $ARGUMENTS
