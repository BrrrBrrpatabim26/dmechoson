---
description: Generate requirement quality checklist. Checklists are "unit tests for English" - validate requirements quality, NOT implementation.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE CHECKLIST)**:
> 1. **KIỂM TRA CHỈ TIÊU YÊU CẦU**: Đánh giá tính đầy đủ và các tiêu chí chất lượng của spec.
> 2. **CHUYỂN TIẾP SANG YÊU CẦU**: Sau khi hoàn thành checklist, gọi chuyển tiếp sang:
>
> ```
> EXECUTE_COMMAND: fullstack.requirement
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**


Flowchart: ` business_1_fullstack_sdd `
Gates to record: `req_gate`

Required command sequence on completion:
```bash
python scripts/python/flowchart_progress.py gate \
    --gate req_gate --decision pass \
    --inputs '{}' --threshold '{}' \
    --rationale 'auto-resolved by constitution §4a'
```


## Checklist Purpose: "Unit Tests for English"

**CRITICAL CONCEPT**: Checklists are **UNIT TESTS FOR REQUIREMENTS WRITING** - chúng validate quality, clarity, và completeness của requirements trong một domain nhất định.

**NOT for verification/testing**:

- ❌ NOT "Verify the button clicks correctly"
- ❌ NOT "Test error handling works"
- ❌ NOT "Confirm the API returns 200"
- ❌ NOT checking nếu code/implementation matches the spec

**FOR requirements quality validation**:

- ✅ "Are visual hierarchy requirements defined cho tất cả card types?" (completeness)
- ✅ "Is 'prominent display' quantified với specific sizing/positioning?" (clarity)
- ✅ "Are hover state requirements consistent across all interactive elements?" (consistency)
- ✅ "Are accessibility requirements defined cho keyboard navigation?" (coverage)
- ✅ "Does the spec define what happens khi logo image fails to load?" (edge cases)

**Metaphor**: Nếu spec của bạn là code viết bằng English, checklist là unit test suite của nó. Bạn đang test xem requirements có well-written, complete, unambiguous, và ready for implementation KHÔNG - hay implementation có works.

**Ownership và checkbox lifecycle**:

- Custom checklists generated bởi this command là reviewer-owned requirements-quality review artifacts.
- `[x]` nghĩa là reviewer determined requirements-quality criterion is satisfied.
- `[x]` does NOT mean implementation work is complete.
- This command generates or appends checklist items; nó MUST NOT mark generated items `[x]`.
- An agent có thể assist với evaluating items ONLY khi explicitly asked bởi reviewer.
- `checklists/requirements.md` là separate built-in spec-quality checklist maintained bởi `/fullstack.requirement` và `/fullstack.clarify`.

**Phase Business.md**: REQUIREMENT - REQ_GATE validation (Checklist + Risk + Scope + Governance)

## User Input

```text
$ARGUMENTS
```

## Execution Steps

###1. **Setup**: Run `scripts/powershell/check-prerequisites.ps1 -Json -Template checklist-template` từ repo root và parse JSON cho `FEATURE_DIR`, `AVAILABLE_DOCS` list, và `TEMPLATE_CONTENT`.

###2. **IF EXISTS**: Load `.fullstack/constitution.md` cho project principles.

###3. **Clarify intent (dynamic)**: Derive up to THREE initial contextual clarifying questions. They MUST:
   - Be generated từ user's phrasing + extracted signals từ spec/plan/tasks
   - Only ask about information màly materially changes checklist content
   - Be skipped individually nếu already unambiguous trong `$ARGUMENTS`
   - Prefer precision over breadth

###4. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers:
   - Derive checklist theme (e.g., security, review, deploy, ux)
   - Consolidate explicit must-have items mentioned bởi user
   - Map focus selections to category scaffolding
   - Infer any missing context từ spec/plan/tasks

###5. **Load feature context**: Read từ `FEATURE_DIR`:
   - `spec.md`: Feature requirements và scope
   - `plan.md` (if exists): Technical details, dependencies
   - `tasks.md` (if exists): Implementation tasks

###6. **Generate checklist** - Use `TEMPLATE_CONTENT` as structural template và tạo "Unit Tests for Requirements":
   - Create `FEATURE_DIR/checklists/` directory nếu doesn't exist
   - Generate unique checklist filename: `[domain].md` (e.g., `ux.md`, `api.md`, `security.md`)
   - File handling:
     - If file does NOT exist: Create new file và number items starting từ CHK001
     - If file exists: Append new items, continuing từ last CHK ID
   - Never delete or replace existing content - always preserve và append
   - Leave every newly generated item unchecked (`[ ]`)

**CORE PRINCIPLE - Test the Requirements, Not the Implementation**:

Every checklist item MUST evaluate the REQUIREMENTS THEMSELVES cho:
- **Completeness**: Are all necessary requirements present?
- **Clarity**: Are requirements unambiguous và specific?
- **Consistency**: Do requirements align với mỗi other?
- **Measurability**: Can requirements be objectively verified?
- **Coverage**: Are all scenarios/edge cases addressed?

**Category Structure**:
- **Requirement Completeness**
- **Requirement Clarity**
- **Requirement Consistency**
- **Acceptance Criteria Quality**
- **Scenario Coverage**
- **Edge Case Coverage**
- **Non-Functional Requirements**
- **Dependencies & Assumptions**
- **Ambiguities & Conflicts**

**HOW TO WRITE CHECKLIST ITEMS - "Unit Tests for English"**:

❌ WRONG (Testing implementation):
- "Verify landing page displays 3 episode cards"
- "Test hover states work on desktop"
- "Confirm logo click navigates home"

✅ CORRECT (Testing requirements quality):
- "Are the exact number và layout of featured episodes specified?" [Completeness]
- "Is 'prominent display' quantified với specific sizing/positioning?" [Clarity]
- "Are hover state requirements consistent across all interactive elements?" [Consistency]
- "Are keyboard navigation requirements defined cho all interactive UI?" [Coverage]
- "Is fallback behavior defined khi images fail to load?" [Edge Cases]
- "Are loading states defined cho asynchronous episode data?" [Completeness]

**ITEM STRUCTURE**:

- Question format asking about requirement quality
- Focus on what's WRITTEN (hoặc không written) trong spec/plan
- Include quality dimension in brackets [Completeness/Clarity/Consistency/etc.]
- Reference spec section `[Spec §X.Y]` khi checking existing requirements
- Use `[Gap]` marker khi checking cho missing requirements

**🚫 ABSOLUTELY PROHIBITED** - These make nó implementation test, không requirements test:
- ❌ Any item starting với "Verify", "Test", "Confirm", "Check" + implementation behavior
- ❌ References to code execution, user actions, system behavior
- ❌ "Displays correctly", "works properly", "functions as expected"
- ❌ "Click", "navigate", "render", "load", "execute"
- ❌ Test cases, test plans, QA procedures
- ❌ Implementation details (frameworks, APIs, algorithms)

**✅ REQUIRED PATTERNS** - These test requirements quality:
- ✅ "Are [requirement type] defined/specified/documented cho [scenario]?"
- ✅ "Is [vague term] quantified/clarified với specific criteria?"
- ✅ "Are requirements consistent between [section A] và [section B]?"
- ✅ "Can [requirement] be objectively measured/verified?"
- ✅ "Are [edge cases/scenarios] addressed trong requirements?"
- ✅ "Does the spec define [missing aspect]?"

###7. **Report**: Output full path to checklist file, item count, và summarize:
- Focus areas selected
- Depth level (Standard/Deep/Lightweight)
- Actor/timing (Author/Reviewer/QA/Release)
- Any explicit user-specified must must-have items incorporated
