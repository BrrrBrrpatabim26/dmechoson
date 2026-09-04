---
name: anti-loading-shift
severity: high
patterns:
  - "loading state that hides the button label"
  - "loading state with no min-width/height preservation"
  - "spinner added to a button that shrinks the label area"
checks:
  - "does the button keep its width during loading?"
  - "does the label stay visible (or replaced by a spinner of equal size)?"
fix: "Reserve the spinner area: render a fixed-size placeholder, or use opacity to dim the label rather than removing it."
---

# Anti Loading Shift

When a button transitions to "loading", it should not resize, hide
its label, or cause the surrounding layout to jump.
