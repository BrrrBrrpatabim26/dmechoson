# Responsive Design Prompt

## Purpose

Hướng dẫn AI agent thiết kế UI responsive multi-device với mobile-first
approach, sử dụng breakpoint tokens và modern CSS (Grid, Flexbox,
Container Queries).

## Breakpoints (Mobile-First)

```css
/* Tailwind-style */
--bp-sm:   640px;   /* Small tablets (portrait) */
--bp-md:   768px;   /* Tablets (portrait) */
--bp-lg:   1024px;  /* Tablets (landscape), small laptops */
--bp-xl:   1280px;  /* Laptops, desktops */
--bp-2xl:  1536px;  /* Large desktops */

/* Mobile-first media queries */
@media (min-width: 640px) { /* sm+ */ }
@media (min-width: 768px) { /* md+ */ }
@media (min-width: 1024px) { /* lg+ */ }
```

## Device Targets

| Device | Width | Use Case |
|---|---|---|
| Mobile | 320-639px | Phones (portrait) |
| Small tablet | 640-767px | Phones (landscape), small tablets |
| Tablet | 768-1023px | iPad, tablets (portrait) |
| Desktop | 1024-1279px | Laptops, small desktops |
| Large desktop | 1280px+ | Standard desktops |
| 4K | 1920px+ | Large monitors, TVs |

## Mobile-First Pattern

```css
/* Default = mobile */
.container {
  padding: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .container {
    padding: 1.5rem;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 2rem;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Anti-Patterns

❌ **Desktop-first** (max-width media queries) — backwards
❌ **Fixed pixel widths** — breaks on different screens
❌ **Tiny text trên mobile** (<14px) — accessibility fail
❌ **Hover-only interactions** — mobile users can't hover
❌ **Tiny touch targets** (< 44×44px) — accessibility fail
❌ **Horizontal scroll** trên mobile — broken layout
❌ **Hidden content trên mobile** without toggle — info loss

## Touch Targets

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;  /* visual padding, not extra size */
}
```

**Apple HIG**: 44×44pt minimum
**Material Design**: 48×48dp minimum
**WCAG 2.5.5**: 44×44px minimum (AA)

## Typography Scaling

```css
/* Mobile: smaller base */
html { font-size: 14px; }

/* Desktop: larger */
@media (min-width: 1024px) {
  html { font-size: 16px; }
}
```

## Navigation Patterns

### Mobile

- Hamburger menu → full-screen overlay
- Bottom tab bar (3-5 items)
- Drawer slide from left/right

### Tablet

- Side rail (always visible)
- Top tabs

### Desktop

- Persistent sidebar
- Top nav
- Mega menu

## Touch Gestures

| Gesture | Use |
|---|---|
| Tap | Primary action |
| Long press | Secondary menu |
| Swipe horizontal | Carousel, dismiss |
| Swipe vertical | Pull-to-refresh |
| Pinch | Zoom (images, maps) |
| Two-finger rotate | Rotate (3D, maps) |

## Image Responsive

```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1600.jpg 1600w
  "
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="..."
  loading="lazy"
  decoding="async"
/>
```

## Container Queries (Modern)

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}
```

## Test Matrix

Test trên:

- **Mobile**: iPhone SE (375px), iPhone 14 (390px), Pixel 7 (412px)
- **Tablet**: iPad Mini (768px), iPad Air (820px), iPad Pro (1024px)
- **Desktop**: 1280×720, 1440×900, 1920×1080, 2560×1440

## AI Agent Checklist

Khi review responsive:

1. [ ] Mobile-first CSS (min-width queries)
2. [ ] No horizontal scroll at any breakpoint
3. [ ] Touch targets ≥ 44×44px trên mobile
4. [ ] Text size ≥ 14px trên mobile
5. [ ] Nav pattern adapts (hamburger / sidebar / top)
6. [ ] Images responsive (srcset + sizes)
7. [ ] Grid adapts (1 col → 2 → 3+)
8. [ ] No hover-only interactions
9. [ ] Tested on real devices (Chrome DevTools + actual)
10. [ ] No layout shift on load

## Output Format

```yaml
responsive_review:
  mobile:
    width: 375px
    issues: ["nav collapsed correctly", "touch targets OK"]
  tablet:
    width: 768px
    issues: ["2-col grid renders OK"]
  desktop:
    width: 1440px
    issues: ["3-col grid renders OK"]
issues:
  - issue_id: resp-001
    category: responsive
    severity: HIGH
    description: "Nav uses hover dropdown, no mobile fallback"
    evidence: "Desktop nav has hover dropdown only"
    recommendation: "Add mobile drawer/sheet with tap trigger"
```
