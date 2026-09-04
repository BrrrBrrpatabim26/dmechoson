# Loading & Empty States Prompt

## Purpose

Hướng dẫn AI agent thiết kế loading + empty + error states cho UI.
Đây là 3 states QUAN TRỌNG NHẤT mà dev hay quên — chỉ design happy path.

## State Coverage Checklist

Mỗi data-driven view PHẢI handle 5 states:

1. **Initial / Loading** — data chưa fetch xong
2. **Empty** — fetch xong nhưng 0 results
3. **Partial** — data có, một số fields missing
4. **Error** — fetch failed
5. **Success** — data OK

## 1. Loading State

### Strategies (từ nhanh → chậm)

| Strategy | Duration | Use When |
|---|---|---|
| Instant (no indicator) | < 100ms | Data local/cached |
| Skeleton | > 200ms | Layout-known content |
| Spinner | > 500ms | Unknown duration |
| Progress bar | > 2s | File upload, install |
| Pulse animation | Continuous | Real-time data fetching |

### Skeleton Best Practices

```html
<div class="card" aria-busy="true" aria-live="polite">
  <div class="skeleton-line skeleton-line--title"></div>
  <div class="skeleton-line skeleton-line--text"></div>
  <div class="skeleton-line skeleton-line--text skeleton-line--short"></div>
</div>
```

```css
.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg,
    var(--gray-200) 0%,
    var(--gray-100) 50%,
    var(--gray-200) 100%
  );
  background-size: 200% 100%;
  border-radius: 0.25rem;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { background-position: 200% 0; }
  50%      { background-position: -200% 0; }
}
```

### Layout Shift Prevention (CLS)

Skeleton PHẢI match real content dimensions:

```css
/* Match exact final sizes */
.skeleton-card { min-height: 240px; }
.skeleton-line--title { height: 1.5rem; width: 60%; }
.skeleton-line--text  { height: 1rem;   width: 100%; }
.skeleton-line--short { width: 70%; }
```

## 2. Empty State

### Components

```html
<div class="empty-state">
  <svg class="empty-state__icon" aria-hidden="true">...</svg>
  <h2 class="empty-state__title">No projects yet</h2>
  <p class="empty-state__description">
    Get started by creating your first project
  </p>
  <button class="btn btn-primary">Create Project</button>
</div>
```

### Anti-Patterns

❌ **Blank screen** — confusing, looks like a bug
❌ **"No data"** — too technical
❌ **Tiny gray text** — easily missed
❌ **No call-to-action** — user stuck

### Best Practices

- **Helpful title** (what's empty)
- **Friendly description** (why, what to do)
- **Primary CTA** (next action)
- **Icon or illustration** (visual recognition)
- **Skip if obvious** (login form is empty by default, no need)

## 3. Error State

### Network Error

```html
<div class="error-state" role="alert">
  <svg class="error-state__icon" aria-hidden="true">⚠</svg>
  <h2>Unable to load data</h2>
  <p>Check your internet connection and try again.</p>
  <button class="btn btn-primary" onclick="retry()">Retry</button>
</div>
```

### Validation Error (per-field)

- Inline next to field (NOT a summary modal)
- Clear, specific message
- Field marked with `aria-invalid="true"`
- Error associated via `aria-describedby`

## 4. Empty vs Loading Confusion

| State | When to Show |
|---|---|
| Loading | First fetch (no data yet) |
| Empty | Fetch returned 0 items |
| Error | Fetch failed |

**Don't show "empty" while loading** — looks like data is empty when actually fetching.

## 5. Anti-Loading-Patterns

❌ **Spinners cho < 200ms operations** — flash of spinner
❌ **"Loading..." text only** — bland, no context
❌ **Skeleton not matching real layout** — CLS jump
❌ **Loading state without timeout** — infinite spinner
❌ **Spinners on every button click** — distracting

## 6. AI Agent Checklist

Khi review state coverage:

1. [ ] Loading state với skeleton/spinner phù hợp
2. [ ] Skeleton matches real dimensions (no CLS)
3. [ ] Empty state có icon + message + CTA
4. [ ] Error state có retry option
5. [ ] Per-field validation errors inline
6. [ ] Loading state với timeout fallback
7. [ ] aria-live="polite" cho async content
8. [ ] aria-busy="true" on loading containers
9. [ ] No layout shift giữa loading → loaded
10. [ ] Animation respects prefers-reduced-motion

## 7. Common Empty State Copy

| Context | Title | CTA |
|---|---|---|
| Inbox | "No messages yet" | "Compose" |
| Search results | "No results for 'foo'" | "Clear search" |
| Notifications | "You're all caught up" | (no CTA) |
| Files | "No files uploaded" | "Upload files" |
| Projects | "No projects yet" | "Create project" |
| Followers | "No followers yet" | "Share profile" |

## 8. Error Recovery Patterns

| Error | Pattern |
|---|---|
| 404 Not Found | "Page not found" + back button |
| 500 Server | "Something went wrong" + retry |
| 401 Unauthorized | "Please sign in" + login link |
| 403 Forbidden | "You don't have access" + request access |
| 429 Rate limit | "Too many requests" + wait time |
| Network offline | "You're offline" + cached content |
