# Error Handling Prompt

## Purpose

Hướng dẫn AI agent thiết kế error states + error messages sao cho helpful,
non-blaming, và dễ recover. Errors are inevitable — design for them.

## Error Philosophy

**Good errors**:
- Specific (what happened)
- Human-readable (no jargon)
- Actionable (what to do)
- Non-blaming ("we" not "you")
- Polite (apology when appropriate)

**Bad errors**:
- Vague ("Error occurred")
- Technical ("500 Internal Server Error")
- Blaming ("You did it wrong")
- Dead-end (no next step)
- Scary (red screaming text)

## Error Categories

| Type | User | Action | Tone |
|---|---|---|---|
| **Validation** | User input | Fix input | Helpful |
| **404 Not Found** | Wrong URL | Go back, search | Informative |
| **500 Server** | System error | Retry, contact support | Apologetic |
| **401 Unauthorized** | Not signed in | Sign in | Neutral |
| **403 Forbidden** | No permission | Request access | Informative |
| **429 Rate limit** | Too many requests | Wait, try later | Polite |
| **Network** | Offline | Check connection, retry | Helpful |
| **Empty** | No data | Add data, change filter | Encouraging |
| **Timeout** | Slow network | Retry, check connection | Patient |

## Error Message Template

```text
[Icon] [Title: What happened (1 short sentence)]
       [Body: Why it happened (optional, 1 sentence)]
       [Action: What user can do (button)]
```

### Example: Form Validation

```text
[⚠] Email format is invalid
    Please use the format: name@example.com
    [ Edit Email ]
```

### Example: Network Error

```text
[🔌] Can't connect to the server
    Check your internet connection and try again.
    [ Retry ]   [ Work Offline ]
```

### Example: 404

```text
[🔍] Page not found
    The page '/foo' doesn't exist or has been moved.
    [ Go to Home ]   [ Search ]
```

## Error Display Locations

### Inline (per-field)

Best cho form validation:

```html
<div class="form-field form-field--error">
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    required
  />
  <p id="email-error" class="form-error" role="alert">
    Please enter a valid email address (e.g., name@example.com)
  </p>
</div>
```

### Toast/Notification

Best cho non-blocking errors:

```html
<div class="toast toast--error" role="alert" aria-live="assertive">
  <span>Failed to save changes</span>
  <button>Retry</button>
  <button>×</button>
</div>
```

### Modal/Alert (use sparingly)

Best cho critical, blocking errors:

```html
<dialog open role="alertdialog" aria-labelledby="error-title">
  <h2 id="error-title">Connection Lost</h2>
  <p>Your unsaved changes will be lost if you continue.</p>
  <button>Retry</button>
  <button>Save Locally</button>
</dialog>
```

### Full-page Error

Best cho critical, page-blocking errors (404, 500):

```text
[Illustration]

404 - Page Not Found

The page you're looking for doesn't exist or has been moved.

[Go Home]  [Search]  [Contact Support]
```

## HTTP Status Code Cheatsheet

| Code | Title | User Message |
|---|---|---|
| 200 | OK | (no message, success) |
| 201 | Created | "Item created successfully" |
| 204 | No Content | (no message) |
| 400 | Bad Request | "Invalid request. Please check your input." |
| 401 | Unauthorized | "Please sign in to continue." |
| 403 | Forbidden | "You don't have permission to access this." |
| 404 | Not Found | "We couldn't find what you're looking for." |
| 408 | Request Timeout | "The request took too long. Please try again." |
| 409 | Conflict | "This conflicts with existing data." |
| 422 | Unprocessable | "We couldn't process your request." |
| 429 | Too Many Requests | "Slow down! Please try again in [N] seconds." |
| 500 | Internal Server Error | "Something went wrong on our end. Please try again." |
| 502 | Bad Gateway | "Service temporarily unavailable." |
| 503 | Service Unavailable | "We're undergoing maintenance. Please try again later." |
| 504 | Gateway Timeout | "Service took too long to respond." |

## Error Logging (Sentry-style)

```python
# GOOD: structured logging
logger.error(
    "Failed to save user preferences",
    extra={
        "user_id": user.id,
        "endpoint": "/api/preferences",
        "error_code": "DB_WRITE_FAILED",
        "retry_count": 3,
    },
    exc_info=True,
)

# BAD: generic logging
logger.error("Error")
```

## Anti-Patterns

❌ **"Error 500"** — no context
❌ **"Something went wrong"** — too vague
❌ **"You broke it"** — blaming user
❌ **Dead-end** — no recovery
❌ **Modal alerts cho validation** — annoying
❌ **Inconsistent error formats** — confusing
❌ **"Sorry" quá nhiều** — fake apology
❌ **Jargon** — "ECONNREFUSED", "TLS handshake failed"

## Recovery Patterns

| Error | Recovery |
|---|---|
| Network offline | Show cached content + offline indicator |
| 401 Unauthorized | Auto-redirect to login + return after auth |
| 500 Server | Retry with exponential backoff (3 attempts) |
| Validation | Highlight field + scroll to it |
| File upload failed | Resume from where it stopped |
| Form submit failed | Preserve user input + show error |
| Session timeout | Save form locally + re-auth |

## AI Agent Checklist

Khi review error handling:

1. [ ] Error messages specific + human-readable
2. [ ] Recovery action provided (button, link)
3. [ ] Non-blaming tone
4. [ ] aria-live region for dynamic errors
5. [ ] aria-invalid on form fields
6. [ ] Color + icon (not color alone)
7. [ ] Preserves user input on failure
8. [ ] No dead-ends
9. [ ] Logging structured
10. [ ] Test error states manually

## Output Format

```yaml
error_review:
  form_validation: "Inline errors với aria-invalid + aria-describedby"
  network_error: "Toast với retry button"
  404: "Full-page với helpful actions"
issues:
  - issue_id: err-001
    category: error
    severity: HIGH
    description: "Error message too technical"
    evidence: "ECONNREFUSED 127.0.0.1:5432"
    recommendation: "Use 'Can't connect to the server. Please try again.'"
```
