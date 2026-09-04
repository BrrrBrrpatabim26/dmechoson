---
name: form
anatomy: [form, fieldset, label, input, helper, error, submit]
variants: [inline, single-step, multi-step, modal]
accessibility:
  - every input has a programmatic label
  - error is announced via aria-describedby
  - submit is reachable by Enter
anti_patterns:
  - placeholder as label
  - error shown only as red border (no text)
  - required field not announced to screen readers
---

# Form

## When to use

Capture user input that must be validated and submitted. Pick **inline**
for ≤ 2 fields, **single-step** for 3-7 fields, **multi-step** for
8+, and **modal** for blocking decisions.

## Variants

### inline form

- 1-2 fields + submit
- used in: search bars, quick filters, newsletter signup

### single-step form

- vertical stack of fields
- 3-7 fields, all visible at once
- used in: login, signup, settings dialogs

### multi-step form

- stepper at the top, one section at a time
- per-step validation, summary at the end
- used in: onboarding, checkout, KYC

### modal form

- dialog with focused-trap
- cancel always available
- used in: confirm destructive actions, quick edits

## Skeleton (React)

```tsx
<Form onSubmit={…} noValidate>
  <Field>
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" required aria-describedby="email-err" />
    <Error id="email-err" role="alert">Email is required</Error>
  </Field>
  <Submit>Sign up</Submit>
</Form>
```

## Anti-patterns

- ❌ Placeholder used as the only label (vanishes on focus).
- ❌ Error only signaled by red border, no error text.
- ❌ Submit button placed off-screen (left as the last item without
  sticky positioning when the form is long).
- ❌ Disabling the submit button without explaining why.
