# Motion & Animation System Prompt

## Purpose

Hướng dẫn AI agent thiết kế motion + animation phù hợp, dựa trên
Material Design 3 Motion, Apple HIG, và web standards (prefers-reduced-motion).

## Easing Curves

```css
:root {
  --ease-standard:  cubic-bezier(0.2, 0, 0, 1);     /* default */
  --ease-decelerate: cubic-bezier(0, 0, 0, 1);     /* enter */
  --ease-accelerate: cubic-bezier(0.3, 0, 1, 1);    /* exit */
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);    /* hero */

  --ease-ios: cubic-bezier(0.4, 0, 0.2, 1);         /* iOS material */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* overshoot */
}
```

## Duration Scale

```css
:root {
  --duration-instant: 0ms;     /* instant feedback */
  --duration-fast:    150ms;   /* hover, focus */
  --duration-base:    250ms;   /* transitions, fade */
  --duration-medium:  400ms;   /* expand, collapse */
  --duration-slow:    600ms;   /* page transitions */
  --duration-extreme: 1000ms;  /* hero animations */
}
```

## When to Use Motion

### ✅ Use Motion For

- **Feedback**: Button press (scale 0.98, 100ms)
- **State change**: Checkbox tick (200ms)
- **Loading**: Spinner, skeleton pulse (1500ms infinite)
- **Transition**: Page navigation (250ms fade)
- **Attention**: Notification slide-in (300ms)
- **Hierarchy**: Modal backdrop fade (200ms)
- **Continuity**: Skeleton → real content (300ms crossfade)

### ❌ Don't Animate

- **Don't use for nothing** — every animation must have purpose
- **Don't make user wait** — animations should be < 500ms (except hero)
- **Don't use loop animations** — distracting (except loading)
- **Don't animate when reduced-motion is set**
- **Don't chain > 3 transitions** — cognitive overload

## prefers-reduced-motion

**MANDATORY**: respect user preference:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Common Patterns

### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--duration-base) var(--ease-decelerate);
}
```

### Slide In (Notification)

```css
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.notification-enter {
  animation: slideInRight var(--duration-medium) var(--ease-emphasized);
}
```

### Modal Fade + Scale

```css
@keyframes modalEnter {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.modal-backdrop { animation: fadeIn 200ms ease-out; }
.modal-content  { animation: modalEnter 250ms cubic-bezier(0.2, 0, 0, 1); }
```

### Skeleton Loading

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

.skeleton {
  animation: pulse 1500ms ease-in-out infinite;
}
```

## Anti-Patterns

❌ **Loading shift** — content jumps as data loads (CLS)
❌ **Animation flash** — 50% opacity keyframe
❌ **Long animations** (>1s) trên critical paths
❌ **Easing curves mạnh** (elastic, back) — feels cheap
❌ **Animations không tắt được** — accessibility fail
❌ **3D rotations** trên UI elements — distracting
❌ **Bouncy motion** trên form validation — unprofessional

## AI Agent Checklist

Khi review motion:

1. [ ] Durations < 600ms cho transitions
2. [ ] prefers-reduced-motion respected
3. [ ] No animations on critical paths (login, form submit)
4. [ ] Loading states don't cause layout shift (CLS)
5. [ ] Easing curves consistent across app
6. [ ] State changes have feedback motion
7. [ ] No infinite animations except loading
8. [ ] Touch/click feedback instant (<150ms)

## Output Format

```yaml
motion_review:
  - animation: "button-press"
    duration: 100ms
    easing: ease-out
    trigger: ":active"
    reduced_motion: "disabled"
  - animation: "modal-fade"
    duration: 250ms
    easing: cubic-bezier(0.2, 0, 0, 1)
    trigger: "mount"
    reduced_motion: "fade-only"
issues:
  - issue_id: motion-001
    category: motion
    severity: MEDIUM
    description: "Loading skeleton causes layout shift"
    evidence: "skeleton height 64px → content height 56px"
    recommendation: "Use aspect-ratio hoặc min-height matching"
```
