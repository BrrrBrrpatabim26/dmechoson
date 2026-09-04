---
name: anti-color-only-state
severity: high
patterns:
  - "error state shown only as red border"
  - "selected state shown only as blue background"
  - "disabled state shown only as gray text"
checks:
  - "does the state have at least 2 cues (color + icon/label)?"
  - "would a color-blind user notice the state change?"
fix: "Combine color with an icon (× for error, ✓ for selected) and/or a label (off/on, disabled/enabled)."
---

# Anti Color-Only State

Color is not enough. 8% of men and 0.5% of women are color-blind;
even users with full color vision can miss subtle hue changes.

## Patterns to flag

- Error: only red border, no error text.
- Selected: only blue background, no checkbox / radio.
- Disabled: only gray text, no `aria-disabled` and no cursor change.

## Fix

Always pair color with a second cue (icon, label, shape).
