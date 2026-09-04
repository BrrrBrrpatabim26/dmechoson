---
name: card
anatomy: [container, header, body, actions, divider]
variants: [info, action, data, media]
accessibility:
  - focusable when interactive (link / button)
  - heading + body mapped to landmark roles
anti_patterns:
  - card that always shows hover/focus regardless of pointer
  - card with no focusable target (mouse-only)
  - card with mixed text-density inside one body
---

# Card

## When to use

A self-contained, scannable unit of information that **either presents
content (info / data / media)** or **prompts a single action**.

## Variants

### info card

- title + 2-3 line body + optional CTA
- used in: dashboards, list items, side panels

### action card

- icon + title + subtitle + primary CTA
- used in: empty states, onboarding, marketplace

### data card

- title + KPI value + delta + sparkline
- used in: dashboards, summaries

### media card

- 16:9 image (or 1:1 thumbnail) + title + meta
- used in: feeds, galleries, search results

## Skeleton (React)

```tsx
<Card variant="info" as="section" aria-labelledby="card-title">
  <CardHeader id="card-title">Title</CardHeader>
  <CardBody>Body…</CardBody>
  <CardActions>
    <Button variant="primary">Action</Button>
  </CardActions>
</Card>
```

## Anti-patterns

- ❌ Multiple competing CTAs in a single card.
- ❌ Card that becomes a button when its body contains links
  (use the clickable region pattern instead).
- ❌ Truncating body text without a "view more" affordance.
