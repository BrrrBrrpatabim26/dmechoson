---
name: anti-emoji-misuse
severity: medium
patterns:
  - "emoji used as button label"
  - "emoji used to fake visual hierarchy (e.g. 🎉 as section title)"
  - "3+ emoji in a single short paragraph"
checks:
  - "does any emoji carry semantic meaning a screen reader would miss?"
  - "would the page lose information if all emoji were removed?"
fix: "Replace decorative emoji with a real icon component (lucide, heroicons) or remove it. Reserve emoji for status feedback (✅, ❌, ⚠)."
---

# Anti Emoji Misuse

Emoji is not a UI primitive. It is a status indicator at most.

## Patterns to flag

- Emoji as button label (👈 Click here).
- Emoji faking visual hierarchy (🎉 as a section title).
- 3+ emoji in a single short paragraph.

## Why

- Screen readers read emoji literally ("party popper", "thumbs up").
- Emoji rendering varies wildly across OS (Windows shows colored
  emoji; some Linux distros show black-and-white).
- Emoji as decoration crowds out real content.
