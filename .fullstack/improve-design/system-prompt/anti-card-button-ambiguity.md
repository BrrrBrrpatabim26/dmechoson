---
name: anti-card-button-ambiguity
severity: high
patterns:
  - "card with no focusable target"
  - "card with onClick but no role='button' or nested link"
  - "click handler on a div, not on a button or link"
checks:
  - "if the card is clickable, is there exactly one focusable target?"
  - "does the keyboard reach the same action?"
fix: "Make the card itself a <button> or wrap the title in an <a>. Never put onClick on a div."
---

# Anti Card-Button Ambiguity

A card that looks clickable but has no focusable target is broken
for keyboard users. A div with `onClick` is **not** a button.

## Why

- Screen readers don't announce divs as interactive.
- Keyboard users can't reach the action.
- Mobile users who long-press get no context menu.

## Fix

```html
<article>
  <a href="/details">Title</a>
  <p>Body…</p>
</article>
```

Or, for an action card, use a button as the only focusable target.
