---
name: anti-modal-trap
severity: critical
patterns:
  - "modal without ESC-to-close"
  - "modal without focus trap"
  - "modal that wraps a non-critical info message"
  - "modal stacked on top of another modal"
checks:
  - "does ESC close the modal?"
  - "is focus trapped inside the modal?"
  - "is this content critical enough to block the rest of the page?"
fix: "Modals are Tier 4 (blocking). Use a bottom snackbar (Tier 3) or in-pane banner (Tier 2) for non-critical content."
---

# Anti Modal Trap

Modals are blocking UI. They should be reserved for destructive or
irreversible decisions. Every other case has a non-blocking
alternative.

## Patterns to flag

- Modal without ESC-to-close.
- Modal without focus trap.
- Modal that wraps a non-critical info message.
- Modal stacked on top of another modal.

## Fix

Use the 4-tier feedback hierarchy. Modals are Tier 4 only.
