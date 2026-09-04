# Color Palette System Prompt

## Purpose

Hướng dẫn AI agent thiết kế color palette hợp lý cho design system,
dựa trên accessibility (WCAG 2.1) và modern design tokens.

## Tonal System (Tailwind-style)

Sử dụng 11-step scale cho mỗi màu chính (50-950):

| Step | Light Theme | Use Case |
|---|---|---|
| 50 | `#fafafa` | Lightest tint (background subtle) |
| 100 | `#f5f5f5` | Hover, light bg |
| 200 | `#e5e5e5` | Borders, dividers |
| 300 | `#d4d4d4` | Disabled, inactive |
| 400 | `#a3a3a3` | Tertiary text, placeholders |
| 500 | `#737373` | Secondary text, icons |
| 600 | `#525252` | Body text alt |
| 700 | `#404040` | Body text |
| 800 | `#262626` | Headings, strong text |
| 900 | `#171717` | High contrast, dark mode bg |
| 950 | `#0a0a0a` | Darkest (dark mode bg) |

## Semantic Tokens (Design System)

Thay vì dùng `gray-700` trực tiếp, dùng semantic tokens:

```css
:root {
  --color-bg-primary:    #ffffff;
  --color-bg-secondary:  #fafafa;  /* gray-50 */
  --color-bg-tertiary:   #f5f5f5;  /* gray-100 */
  --color-fg-primary:    #171717;  /* gray-900 */
  --color-fg-secondary:  #525252;  /* gray-600 */
  --color-fg-tertiary:   #a3a3a3;  /* gray-400 */
  --color-border-default: #e5e5e5; /* gray-200 */
  --color-border-strong:  #d4d4d4; /* gray-300 */

  --color-accent-50:  #eff6ff;
  --color-accent-500: #3b82f6;
  --color-accent-600: #2563eb;  /* primary action */
  --color-accent-700: #1d4ed8;  /* hover */

  --color-success-500: #22c55e;
  --color-warning-500: #f59e0b;
  --color-danger-500:  #ef4444;
  --color-info-500:    #3b82f6;
}
```

## Dark Mode Auto-Switch

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary:   #0a0a0a;
    --color-fg-primary:   #fafafa;
    /* ... */
  }
}
```

## Color Harmony

### 60-30-10 Rule

- **60%** dominant (background, body)
- **30%** secondary (cards, sections)
- **10%** accent (CTAs, highlights, errors)

### Pick 1 Primary + 2-3 Accent

- **Primary**: brand color
- **Secondary accent**: complementary (offset 180° hue)
- **Tertiary**: analogous (offset 30° hue)
- **Neutral**: gray scale (slate, zinc, neutral)

## Anti-Patterns

❌ **Too many colors** (>5 hues) — confusing
❌ **Pure white #FFF on pure black #000** — too harsh
❌ **Rainbow palette** — anti-pattern
❌ **Saturated pastels** — low contrast
❌ **Purple-blue gradients** (`#6366f1` → `#8b5cf6`) — overused, "AI-generated look"

## AI Agent Checklist

Khi review palette, kiểm tra:

1. [ ] Maximum 5 hues total (1 primary + 2-3 accent + 1 neutral)
2. [ ] All foreground/background pairs ≥4.5:1 contrast
3. [ ] Semantic tokens used (not raw `gray-700`)
4. [ ] Dark mode supported (auto-switch hoặc toggle)
5. [ ] 60-30-10 rule applied
6. [ ] No purple-blue gradient cliché
7. [ ] Status colors accessible (success, warning, danger)

## Output Format

```yaml
palette:
  primary: { 50: '#...', 500: '#...', 900: '#...' }
  semantic:
    bg: { primary: '...', secondary: '...', tertiary: '...' }
    fg: { primary: '...', secondary: '...' }
    accent: { 500: '...', 600: '...' }
  contrast_pairs:
    - { fg: 'gray-900', bg: 'white', ratio: 16.1, aa: 'pass' }
  rationale: "Single hue + neutral, WCAG AA compliant"
```
