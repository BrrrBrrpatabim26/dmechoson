# Typography System Prompt

## Purpose

Hướng dẫn AI agent thiết kế typography scale (font sizes, line height,
letter spacing, font weights) cho design system, dựa trên modern best
practices (Material Design 3, Tailwind, iOS HIG).

## Modular Type Scale (Ratio 1.125 = "Major Second")

```text
text-xs      → 0.75rem  → 12px   → small captions
text-sm      → 0.875rem → 14px   → body small
text-base    → 1rem     → 16px   → body default (touch target)
text-lg      → 1.125rem → 18px   → body large
text-xl      → 1.25rem  → 20px   → small heading
text-2xl     → 1.5rem   → 24px   → h6
text-3xl     → 1.875rem → 30px   → h5
text-4xl     → 2.25rem  → 36px   → h4
text-5xl     → 3rem     → 48px   → h3
text-6xl     → 3.75rem  → 60px   → h2
text-7xl     → 4.5rem   → 72px   → h1
text-8xl     → 6rem     → 96px   → display
text-9xl     → 8rem     → 128px  → hero
```

## Line Height

| Use Case | Line Height | Tính theo |
|---|---|---|
| Headings (tight) | 1.0–1.2 | font-size × 1.0-1.2 |
| Subheadings | 1.25–1.375 | font-size × 1.25-1.375 |
| Body text | 1.5–1.625 | font-size × 1.5-1.625 |
| Long-form content | 1.625–2.0 | font-size × 1.625-2.0 |
| UI labels | 1.0–1.4 | font-size × 1.0-1.4 |

```css
.text-base    { font-size: 1rem;     line-height: 1.5; }   /* 16/24 */
.text-base-sm { font-size: 0.875rem; line-height: 1.4; }   /* 14/20 */
.text-lg      { font-size: 1.125rem; line-height: 1.4; }   /* 18/25 */
.text-2xl     { font-size: 1.5rem;   line-height: 1.25; }  /* 24/30 */
```

## Letter Spacing (Tracking)

| Use Case | Letter Spacing |
|---|---|
| Body text | `0` (normal) |
| Small caps | `0.05em` |
| All caps | `0.1em` |
| Headings (large) | `-0.025em` (slightly tight) |
| Display (huge) | `-0.04em` (tighter) |
| Letter-spaced labels | `0.1em` |

```css
.tracking-tight    { letter-spacing: -0.025em; }
.tracking-tighter   { letter-spacing: -0.04em; }
.tracking-wide      { letter-spacing: 0.025em; }
.tracking-wider     { letter-spacing: 0.1em; }
```

## Font Weight Scale

| Token | Weight | Use |
|---|---|---|
| thin | 100 | Decorative only |
| extralight | 200 | Decorative only |
| light | 300 | Large headings (≤18pt) |
| normal | 400 | Body text default |
| medium | 500 | Body emphasis, buttons |
| semibold | 600 | Buttons, labels |
| bold | 700 | Strong emphasis, h4-h5 |
| extrabold | 800 | Headings h2-h3 |
| black | 900 | Display only |

## Semantic Type Scale

```css
:root {
  --text-display:    4.5rem;   /* 72px */
  --text-h1:         3rem;     /* 48px */
  --text-h2:         2.25rem;  /* 36px */
  --text-h3:         1.5rem;   /* 24px */
  --text-h4:         1.25rem;  /* 20px */
  --text-h5:         1.125rem; /* 18px */
  --text-h6:         1rem;     /* 16px */
  --text-body:       1rem;     /* 16px */
  --text-body-sm:    0.875rem; /* 14px */
  --text-caption:    0.75rem;  /* 12px */
  --text-button:     0.875rem; /* 14px, semibold */
}
```

## Font Family Stack

```css
:root {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

## Anti-Patterns

❌ **Quá nhiều font sizes** (>7 levels) — typographic chaos
❌ **Line height = 1.0 cho body** — text khó đọc
❌ **Justified text** — rivers of whitespace
❌ **All caps paragraph** — shouting
❌ **Body text < 14px** — accessibility fail
❌ **Line length > 80 chars** — eye tracking fails

## AI Agent Checklist

Khi review typography:

1. [ ] Maximum 7-8 size levels (xs to display)
2. [ ] Body text ≥ 14px, line-height ≥ 1.4
3. [ ] Heading hierarchy (h1 → h6) consistent
4. [ ] No more than 2-3 font families
5. [ ] Tracking appropriate for size (large = tight, small = normal)
6. [ ] Dark mode typography preserved
7. [ ] Touch target ≥ 44×44px (font-size + padding)

## Best Practices

- **Minimum body size 16px** trên mobile (tránh iOS zoom on focus)
- **Use system font stack** cho performance
- **Variable fonts** cho weight flexibility
- **Limit to 2 font families** trên cùng design
- **Test readability** at 200% zoom (WCAG)
