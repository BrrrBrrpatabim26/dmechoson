---
name: motion
principles: [purposeful, short, interruptible]
budget_ms: [enter 150, exit 100, hover 80]
prefers_reduced_motion: required
anti_patterns:
  - transition > 400ms (feels slow)
  - motion without purpose (decorative only)
  - non-cancelable auto-playing motion
---

# Motion

Motion must be **purposeful, short, and interruptible**. Use it to
convey state change, not to decorate.

## Principles

- **Purposeful**: every motion answers "what changed?".
- **Short**: under 400ms total, ideally ≤ 150ms.
- **Interruptible**: user can reverse / cancel mid-animation.

## Budget

| Transition | Budget |
|---|---|
| Enter (fade / slide) | ≤ 150ms |
| Exit (fade / slide) | ≤ 100ms |
| Hover | ≤ 80ms |
| Modal open | ≤ 200ms |
| Page transition | ≤ 250ms |

## Reduced motion

Always respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Anti-patterns

- ❌ Decorative motion (no state change, just "feels nice").
- ❌ Motion longer than 400ms (feels laggy on slow devices).
- ❌ Auto-playing motion that the user can't pause.
- ❌ Two elements animating at once (causes distraction).
