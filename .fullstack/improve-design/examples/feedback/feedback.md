---
name: feedback
anatomy: [container, icon, title, body, action, dismiss]
variants: [inline-alert, in-pane-banner, bottom-snackbar, blocking-dialog]
accessibility:
  - role=alert for blocking, role=status for transient
  - focus moves to dialog on open, returns to trigger on close
anti_patterns:
  - toast that auto-dismisses < 3s (user can't read)
  - blocking dialog for non-critical info
  - inline alert that wraps body text
---

# Feedback (4-tier)

The fullstack-design constitution enforces a **4-tier feedback
hierarchy**. Pick the lowest tier that conveys the severity.

## Tier 1 — Inline Alert

- **Where**: in-pane, adjacent to the field / row that caused the issue.
- **When**: validation error, contextual info.
- **Auto-dismiss**: never.
- **Example**: field-level error message.

## Tier 2 — In-pane Banner

- **Where**: top of the current pane / section.
- **When**: a non-blocking notice that affects the whole pane
  (e.g. "3 items failed to import").
- **Auto-dismiss**: never (user must acknowledge).
- **Example**: warning banner above a list.

## Tier 3 — Bottom Snackbar

- **Where**: bottom of the viewport.
- **When**: a transient success / info (e.g. "Saved"). Optionally
  shows an undo action for 5 seconds.
- **Auto-dismiss**: after 4-5 seconds, OR on user dismissal.
- **Example**: "Changes saved".

## Tier 4 — Blocking Dialog

- **Where**: centered modal.
- **When**: a destructive or irreversible decision.
- **Auto-dismiss**: never.
- **Example**: "Delete account?".

## Anti-patterns

- ❌ Mixing tiers in the same event (e.g. toasting a destructive
  confirmation).
- ❌ Toast that auto-dismisses faster than the user can read.
- ❌ Blocking dialog for informational messages (wastes user
  attention).
- ❌ Inconsistent iconography across tiers (icon must match
  severity).
