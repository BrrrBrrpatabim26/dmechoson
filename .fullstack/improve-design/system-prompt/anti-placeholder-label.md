---
name: anti-placeholder-label
severity: critical
patterns:
  - "input with placeholder='Email' but no <Label>"
  - "input that uses the value as the label after focus"
checks:
  - "is there a programmatic <label htmlFor=...> on every input?"
  - "does the placeholder remain visible while the field is empty AND focused?"
fix: "Add a <Label htmlFor> sibling. Keep the placeholder for hint, not label."
---

# Anti Placeholder as Label

`<input placeholder="Email">` is not a label. The placeholder
disappears on focus, leaving the user with no context.

## Why critical

- WCAG 2.1 SC 3.3.2 (Labels or Instructions) explicitly forbids
  using placeholder as the only label.
- Screen readers don't read placeholders by default.
- Once the user types, the label is gone for the rest of the session.

## Fix

```html
<label for="email">Email</label>
<input id="email" type="email" placeholder="you@example.com" />
```

The placeholder is a **hint** (optional, transient). The label is
the **anchor** (always present, screen-reader announced).
