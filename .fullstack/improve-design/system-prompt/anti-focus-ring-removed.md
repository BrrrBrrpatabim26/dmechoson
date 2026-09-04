---
name: anti-focus-ring-removed
severity: critical
patterns:
  - ":focus { outline: none; } without a :focus-visible replacement"
  - "focus visible only on pointer interaction"
  - "focus ring with insufficient contrast (< 3:1)"
checks:
  - "is the focus ring visible to keyboard users?"
  - "is the contrast ≥ 3:1 against the background?"
fix: "Use :focus-visible with a 2-3px ring. Never remove focus without replacing it."
---

# Anti Focus Ring Removed

`:focus { outline: none }` without a `:focus-visible` replacement
is the single most common accessibility bug in AI-generated UI.

## Why

- Keyboard-only users navigate by focus ring. Remove it and the site
  becomes unusable.
- The focus ring is **the only** signal for keyboard users. Color
  is irrelevant; position is everything.
