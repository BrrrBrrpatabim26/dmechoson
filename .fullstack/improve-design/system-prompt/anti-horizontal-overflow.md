---
name: anti-horizontal-overflow
severity: critical
patterns:
  - "width: 100vw on an inner container"
  - "fixed width >= 320px on a mobile container"
  - "min-w- without min-w-0 on a flex/grid child"
checks:
  - "does the page scroll horizontally on a 360px-wide viewport?"
  - "is the max-width: 100% set on every flex/grid child?"
fix: "Use box-sizing: border-box globally. Set max-width: 100% on every flex/grid child. Add min-w-0 to allow shrinking."
---

# Anti Horizontal Overflow

Horizontal scrolling on a page that should be vertical is a critical
bug. The fullstack constitution forbids it explicitly.

## Why critical

- Mobile-first: < 640px = 1 column. Horizontal overflow breaks this.
- Once a page scrolls horizontally, the user is lost.
