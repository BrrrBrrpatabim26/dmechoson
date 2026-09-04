---
name: anti-toast-spam
severity: high
patterns:
  - "toast for a blocking decision (delete, sign out)"
  - "auto-dismissing toast < 3000ms"
  - "toast without explicit dismiss control"
  - "toast that does not preserve undo"
checks:
  - "is this a destructive action? use a blocking dialog instead"
  - "is the auto-dismiss timeout long enough to read?"
  - "can the user reverse the action?"
fix: "Use the 4-tier feedback hierarchy. Toasts are Tier 3 only — for transient, reversible, non-destructive feedback."
---

# Anti Toast Spam

Toasts are not a free-for-all. The 4-tier feedback hierarchy limits
toasts to **Tier 3** (transient, non-destructive, optional undo).

## Patterns to flag

- Toast for a destructive action.
- Toast that auto-dismisses in < 3s.
- Toast without a dismiss control.
- Toast that doesn't preserve undo.

## Why

Toasts are by definition transient. Anything that the user needs to
read, decide on, or recover from should not be a toast.
