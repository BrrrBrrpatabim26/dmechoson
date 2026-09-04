---
name: fullstack-fullstack.flowchart-progress
description: Flowchart Progress Tracker — read/write .fullstack/memory/flowchart_progress.json and cross-check workflow state against Business.md flowcharts
---

---
description: Flowchart Progress Tracker — read/write .fullstack/memory/flowchart_progress.json and cross-check workflow state against Business.md flowcharts
---


<!-- end-to-end-automation:v1.1.0 -->

> **Constitution §4a — End-to-End Automation.** This command
> does NOT pause for human approval. Every gate decision is
> auto-resolved by AI evaluation and recorded in
> `.fullstack/memory/flowchart_progress.json` (see
> `templates/commands/fullstack.flowchart-progress.md`).
> User Q&A is information-gathering only; the workflow
> auto-continues after every Q&A.

**Flowchart progress hooks (constitution §4a rule #4):**

Flowchart: ` * `


## Purpose

Maintain `.fullstack/memory/flowchart_progress.json` — the runtime
artifact required by **constitution §4a "End-to-End Automation"**
rule #4. After every workflow step, the agent MUST:

1. Mark the just-completed node as `visited`.
2. Cross-check that the next node is in `pending` (if not, backtrack).
3. Append a `gate_result` for every auto-resolved gate.
4. Append a `waiver` when `max_loop` is exhausted.

This command is the single writer for that file. All other
`fullstack.*` commands call it (or update the file directly using
its schema).

## Sub-commands

### `flowchart-progress init --flowchart <id> [--spec-id <id>]`

Initialise a fresh progress file at `.fullstack/memory/flowchart_progress.json`
for the given flowchart (one of `business_1_fullstack_sdd`,
`business_2_ui_design`). Populates `pending` with the canonical node
order derived from the flowchart.

### `flowchart-progress mark --node <id> --status <ok|waived|auto_fixed|failed> [--evidence <path>] [--note <text>]`

Append a `visited` entry. Triggers re-ordering of `pending`.

### `flowchart-progress gate --gate <id> --decision <pass|fail|waived> --inputs <json> --threshold <json> [--evidence <path>] [--rationale <text>]`

Append a `gate_result` entry. Required for every auto-resolved gate
in the flowchart.

### `flowstack-progress waive --node <id> --reason <text> [--loop-count <n>]`

Record a loop-exhaustion waiver. The agent MUST call this before
proceeding past a node whose loop budget is exhausted.

### `flowchart-progress check`

Cross-check the in-memory `current_node` against the flowchart's
canonical order. If any node in `pending` was skipped, returns a
non-zero exit code and lists the missing nodes — caller MUST
backtrack.

## Behaviour rules (MUST)

- **Never prompts the user.** Q&A is information-gathering; this
  command has no parameters that require user input.
- **Always auto-continues.** No `type: gate` approval step; every
  gate decision is recorded by the AI and the workflow proceeds.
- **Audit-trail only.** No state is kept in memory only; every
  mutation is persisted before the command exits.
- **Idempotent re-init.** If a progress file already exists for the
  same `(flowchart, spec_id)`, re-init preserves `gate_results` and
  `waivers` but rebuilds `visited` and `pending` from the flowchart.

## Output

JSON to stdout:

```json
{
  "ok": true,
  "flowchart": "business_1_fullstack_sdd",
  "current_node": "DESIGN_GATE",
  "pending": ["DESIGN_BASELINE", "IMPLEMENTATION", "..."],
  "missing": [],
  "waivers": 0
}
```

Exit code is `0` when the file is consistent, `1` when flowchart
cross-check finds missing / out-of-order nodes.

