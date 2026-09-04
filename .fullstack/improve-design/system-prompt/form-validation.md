# Form Validation Prompt

## Purpose

Hướng dẫn AI agent thiết kế form validation + error handling đúng chuẩn
UX + accessibility. Forms là điểm failure phổ biến nhất của UI.

## Validation Timing

| Type | When | Use Case |
|---|---|---|
| **onBlur** | After user leaves field | Real-time feedback without annoying |
| **onChange** (after first blur) | After error, fix immediately | Quick recovery |
| **onSubmit** | Form submit | Final check |
| **onInput** (debounced) | Live search/autocomplete | Search boxes |

**Recommended**: blur → change (after first error) → submit

## Inline Validation Rules

### ✅ Do

- Show errors **next to field** (not just summary)
- Use **specific error text** ("Email is required" > "Invalid")
- Mark field as `aria-invalid="true"` khi error
- Use `aria-describedby` to link error message
- Keep error visible until corrected
- Use **green check** for valid (optional, can be noisy)
- Disable submit button during submission

### ❌ Don't

- Don't validate before user has typed anything
- Don't use vague errors ("Invalid input")
- Don't use red color alone (color blind users)
- Don't clear field on error
- Don't disable submit (user needs feedback why)
- Don't use modal alerts for validation
- Don't auto-correct (frustrating)

## Error Message Templates

```text
[Field name] is required.
[Field name] must be at least [N] characters.
[Field name] must be a valid [format].
[Field name] already exists.
[Field name] cannot contain special characters.
Please enter a valid [type] (e.g., example@domain.com).
```

**Avoid**:
- ❌ "Error" (no info)
- ❌ "Invalid" (no info)
- ❌ "Something went wrong" (no info)

## Required Field Indicators

### Option 1: Asterisk

```html
<label for="email">Email <span aria-label="required">*</span></label>
```

- Visual: `Email *`
- Screen reader: "Email required"

### Option 2: Text

```html
<label for="email">Email (required)</label>
```

- Visual + explicit text

**Don't**: only use color (red text) — fails WCAG

## Password Requirements

Show rules upfront, validate live:

```html
<label for="password">Password</label>
<input
  type="password"
  id="password"
  aria-describedby="password-rules"
  required
/>
<small id="password-rules">
  At least 8 characters, including 1 number and 1 special character
</small>
```

## Submission Flow

```
[ User clicks Submit ]
         ↓
[ Disable submit button ]
         ↓
[ Show loading spinner on button ]
         ↓
[ Send request ]
         ↓
   ┌─────┴─────┐
[ Success ]  [ Error ]
   ↓           ↓
[ Show toast ]  [ Focus first error field ]
[ Redirect ]    [ Scroll to error ]
                [ Re-enable button ]
```

## Error States Hierarchy

| State | Visual | Accessibility |
|---|---|---|
| Default | Neutral border | Normal |
| Focus | Accent border + ring | `:focus-visible` |
| Valid (optional) | Green check | `aria-valid="true"` |
| Error | Red border + icon | `aria-invalid="true"` + `aria-describedby` |
| Disabled | Grey, no cursor | `disabled` attribute |

## Anti-Patterns

❌ **Validation on keystroke** (while user typing) — too noisy
❌ **Submit form via Enter** without explicit button
❌ **Reset form on error** — user loses data
❌ **Generic "Invalid input"** — no help
❌ **Modal alerts** for inline validation
❌ **Trim whitespace silently** without telling user
❌ **Force specific format** (e.g., "must include dashes in phone")
❌ **Double validation** (HTML5 + JS) without sync

## AI Agent Checklist

Khi review form:

1. [ ] Labels associated (for/id match)
2. [ ] Required fields marked (aria-required + visual)
3. [ ] Error messages specific (not "Invalid")
4. [ ] aria-invalid on error fields
5. [ ] aria-describedby links to error/help text
6. [ ] Submit button shows loading state
7. [ ] Errors clear on input (after first error)
8. [ ] Form preserves user data on error
9. [ ] No auto-correct or auto-format
10. [ ] Submit can be done via Enter key (with proper form submission)

## Best Practices

- Use **HTML5 validation** first (type=email, required, pattern, min/max)
- Layer **JS validation** for complex rules
- Test với **screen reader** (NVDA, VoiceOver)
- **Mobile keyboard** type (type="email" → email keyboard, type="tel" → number pad)
- **Tab order** matches visual order
- **autocomplete** attributes for common fields
- **No CAPTCHAs** unless necessary (alternatives exist)
