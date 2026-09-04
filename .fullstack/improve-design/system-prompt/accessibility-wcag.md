# Accessibility (WCAG 2.1 AA) Prompt

## Purpose

Bộ prompt này hướng dẫn AI reviewer khi đánh giá accessibility theo
**WCAG 2.1 Level AA** (Web Content Accessibility Guidelines) — chuẩn
quốc tế cho accessibility web. Áp dụng cho mọi draft UI trước khi
finalize.

## Checklist (POUR Principles)

### Perceivable — Thông tin phải được trình bày sao cho user có thể nhận thức

- **Text alternatives**: Mọi `<img>`, `<svg>`, `<picture>` PHẢI có `alt` text
  (hoặc `alt=""` nếu purely decorative).
- **Color contrast**: Text/background contrast ratio tối thiểu **4.5:1**
  (AA normal text) hoặc **3:1** (AA large text ≥18pt hoặc 14pt bold).
  Tool: WebAIM Contrast Checker.
- **Color is not the only means**: Không dùng màu sắc alone để convey
  information (vd: chỉ báo lỗi = đỏ, cần thêm icon/text).
- **Captions & transcripts**: Video PHẢI có captions; audio PHẢI có transcripts.

### Operable — Interface phải operable

- **Keyboard accessible**: Tất cả interactive elements PHẢI dùng được
  qua keyboard (Tab, Enter, Space, Arrow, Esc).
- **Focus visible**: `:focus-visible` ring PHẢI rõ ràng (contrast ≥3:1
  với background).
- **No keyboard trap**: Không được trap user trong một component.
- **Touch target size**: Minimum **44×44px** (WCAG 2.5.5 AAA) hoặc
  24×24px (AA minimum).
- **Focus order**: Logical và follows visual layout.

### Understandable — Thông tin và operation phải dễ hiểu

- **Language declared**: `<html lang="vi">` hoặc lang khác.
- **Error identification**: Form errors PHẢI identify field + describe
  problem (không chỉ "invalid").
- **Labels & instructions**: Mọi input PHẢI có associated `<label>`.
- **Consistent navigation**: Repeated components giữ nguyên order/position.

### Robust — Content phải robust với assistive technologies

- **Semantic HTML**: Dùng `<button>`, `<nav>`, `<main>`, `<aside>`,
  `<article>`, `<section>`, `<header>`, `<footer>` đúng nghĩa.
- **ARIA only khi cần**: ARIA roles chỉ khi HTML semantic không đủ.
- **Status updates**: Live regions (`aria-live="polite"`) cho async updates.

## Severity Classification

| Level | WCAG Conformance | Action |
|---|---|---|
| CRITICAL | Violates A or AA (level A/AA fail) | Block finalize |
| HIGH | AA fail on critical path (login, form, primary nav) | Block finalize |
| MEDIUM | AA fail on secondary path | Iterate, suggest fix |
| LOW | AAA fail (best practice) | Note trong knowledge |

## Output Format cho Reviewer

```yaml
issues:
  - issue_id: a11y-001
    category: accessibility
    severity: CRITICAL
    description: "Login button missing accessible name"
    evidence: |
      <button class="btn-primary" onclick="login()">→</button>
    recommendation: "Add aria-label='Sign in' or visible text content"
    wcag_ref: "WCAG 2.1 — 4.1.2 Name, Role, Value (Level A)"
```

## Tools Recommended

- **axe DevTools** (browser extension) — auto-detect issues
- **Lighthouse** (Chrome DevTools) — accessibility score
- **WAVE** — visual overlay
- **Screen readers**: NVDA (Windows), VoiceOver (macOS), TalkBack (Android)

## Best Practices

1. Test với real screen readers early, late-stage bug fixes rất tốn kém
2. Keyboard-only navigation test cho mọi flow (Tab, Shift+Tab, Enter, Esc)
3. Touch target 44×44px trên mobile (recommended)
4. Focus ring không được `outline: none` mà không thay thế
5. Form errors PHẢI accessible (aria-invalid, aria-describedby)
