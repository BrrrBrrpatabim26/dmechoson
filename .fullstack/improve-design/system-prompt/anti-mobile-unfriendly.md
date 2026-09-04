---
name: anti-mobile-unfriendly
severity: high
patterns:
  - "touch target < 44x44px"
  - "no media query below 640px"
  - "fixed width >= 320px on a container"
  - "horizontal scroll on a 360px viewport"
checks:
  - "is every tap target at least 44x44px?"
  - "does the layout collapse to 1 column on a 360px viewport?"
fix: "Use min-height: 44px on all controls. Set max-width: 100% on containers. Add a @media (max-width: 640px) { ... } breakpoint."
---

# Anti Mobile Unfriendly

If the page is not usable on a 360px-wide viewport, it is not finished.

## Patterns to flag

- Touch target < 44x44px (Apple HIG, WCAG 2.5.5).
- No mobile breakpoint.
- Fixed width ≥ 320px on a container.
- Horizontal scroll on 360px viewport.
