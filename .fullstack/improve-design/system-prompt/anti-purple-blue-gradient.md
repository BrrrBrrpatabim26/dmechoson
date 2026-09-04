---
name: anti-purple-blue-gradient
severity: critical
patterns:
  - "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
  - "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  - "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)"
  - "any purple-to-blue gradient as the brand accent"
checks:
  - "is the brand color literally this gradient?"
  - "could the design be from any other AI-generated project?"
fix: "Pick a brand color from a deliberate palette (5-layer hex: canvas / surface / border / ink / accent). Reuse it. Do not gradient-mix across hues."
---

# Anti Purple-Blue Gradient

`#6366f1 → #8b5cf6` is the canonical "AI generated" gradient. If your
draft uses it, the user will know instantly.

## Patterns to flag

- `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`
- `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Any purple-to-blue gradient as the brand accent.

## Why

- Every AI model defaults to it. It is the visual equivalent of
  "Lorem ipsum".
- It carries no product meaning. A medical product, a fintech
  product, and a kids' product would all use the same gradient.

## Fix

Use the 5-layer hex palette:

```
--bg-canvas   #fff
--bg-surface  #fafafa
--border      #e5e5e5
--ink         #0a0a0a
--accent      #2563eb   ← pick ONCE, use everywhere
```

A single accent, used sparingly, looks 100x more professional than
the default gradient.
