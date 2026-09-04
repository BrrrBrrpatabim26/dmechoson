# Data Visualization Prompt

## Purpose

Hướng dẫn AI agent thiết kế data visualizations (charts, tables, KPIs) sao
cho accurate, accessible, và dễ hiểu.

## Chart Type Selection

| Goal | Chart Type | Use Case |
|---|---|---|
| **Comparison** | Bar chart | Compare categories |
| **Trend over time** | Line chart | Time series, growth |
| **Part-to-whole** | Pie / Donut / Stacked bar | Percentages |
| **Distribution** | Histogram / Box plot | Statistical spread |
| **Relationship** | Scatter / Bubble | Correlation |
| **Composition change** | Stacked area / Stream | Cumulative change |
| **Geographic** | Choropleth / Map | Location-based |
| **Hierarchy** | Treemap / Sunburst | Nested categories |
| **Flow** | Sankey / Chord | Movement between states |
| **Ranking** | Lollipop / Sorted bar | Top N |

## Anti-Patterns

❌ **Pie chart > 5 slices** — hard to read
❌ **3D charts** — distort proportions
❌ **Dual-axis bar chart** — confusing
❌ **Truncated Y-axis** — misleading
❌ **Too many colors** (>7) — rainbow effect
❌ **No zero baseline** for bar charts — exaggerated
❌ **Inconsistent scales** between charts
❌ **Pie vs pie comparison** — humans bad at angular comparison

## Best Practices

### Show Zero Baseline

```css
.axis-y { min: 0; }
```

Bar charts PHẢI start at 0. Line charts có thể truncate nếu labeled.

### Use Color Meaningfully

```css
/* Sequential: ordered data (heat map) */
--scale-1: #f7fbff;  /* light */
--scale-9: #08306b;  /* dark */

/* Diverging: two-pole data (gain/loss) */
--scale-loss:    #d7191c;  /* red */
--scale-neutral: #f7f7f7;  /* white */
--scale-gain:    #1a9641;  /* green */

/* Categorical: no order (regions) */
--color-1: #1b9e77;
--color-2: #d95f02;
--color-3: #7570b3;
--color-4: #e7298a;
```

### Color Blind Safe

```css
/* Okabe-Ito palette (8 colors, color-blind safe) */
--c1: #000000;  /* black */
--c2: #E69F00;  /* orange */
--c3: #56B4E9;  /* sky blue */
--c4: #009E73;  /* bluish green */
--c5: #F0E442;  /* yellow */
--c6: #0072B2;  /* blue */
--c7: #D55E00;  /* vermillion */
--c8: #CC79A7;  /* reddish purple */
```

## Accessibility

- **Text alternatives**: Mỗi chart PHẢI có alt text + long description
- **Pattern fills**: Use stripes/dots cho colorblind users
- **Direct labels**: Avoid relying on color alone
- **Keyboard navigation**: Drill-down interactions
- **Screen reader**: `aria-label` cho data points, table fallback

```html
<figure>
  <img src="chart.png" alt="Bar chart showing 4 categories, total $1.2M" />
  <figcaption>Detailed description for screen readers</figcaption>
  <table><!-- data table fallback --></table>
</figure>
```

## Table Design

### Layout

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-weight: 600;
  background: var(--bg-subtle);
  position: sticky;
  top: 0;  /* Sticky header */
}
```

### Features

- **Sortable columns** với visual indicators (↑↓)
- **Filterable** với search
- **Pagination** cho > 50 rows
- **Row hover** highlight
- **Selection** với checkboxes
- **Bulk actions** cho selected rows
- **Sticky header** for long tables
- **Responsive**: stack trên mobile hoặc horizontal scroll

### Anti-Patterns

❌ **No sorting** — user stuck
❌ **No pagination** — performance issues
❌ **Truncated text** without tooltip
❌ **Fixed width columns** — breaks responsive
❌ **No row hover** — hard to track

## KPI Cards

```html
<div class="kpi-card">
  <span class="kpi-label">Active Users</span>
  <span class="kpi-value">12,345</span>
  <span class="kpi-delta kpi-delta--up">+15.3%</span>
  <svg class="kpi-sparkline"><!-- ... --></svg>
</div>
```

Components:
- **Label**: context (what this metric is)
- **Value**: current number
- **Delta**: change from previous period (with trend indicator)
- **Sparkline**: tiny chart showing recent trend
- **Time period**: "vs last 7 days" / "vs last month"

## Number Formatting

```typescript
formatNumber(1234567)   → "1,234,567"     // commas
formatCurrency(1234.5)  → "$1,234.50"     // money
formatPercent(0.123)    → "12.3%"          // percentage
formatCompact(1234567)  → "1.2M"           // compact
formatDate('2026-09-02')→ "Sep 2, 2026"    // readable date
formatDuration(125)     → "2m 5s"          // duration
```

## Tooltip Best Practices

- Show on hover (desktop) + tap (mobile)
- Use `aria-describedby` for accessibility
- Delay 300ms (avoid flicker)
- Position smart (don't overflow viewport)
- Dismiss on outside click

## AI Agent Checklist

Khi review data viz:

1. [ ] Chart type matches data (no pie > 5 slices)
2. [ ] Color palette accessible (color-blind safe)
3. [ ] Y-axis starts at 0 for bar charts
4. [ ] Text alternative present (alt + longdesc)
5. [ ] Data table fallback for screen readers
6. [ ] No 3D effects
7. [ ] Direct labels for important data
8. [ ] Number formatting consistent
9. [ ] Loading state for async data
10. [ ] Drill-down interactions accessible (keyboard)

## Output Format

```yaml
chart_review:
  type: bar_chart
  data_points: 4
  issues:
    - "Y-axis không start từ 0, exaggerate differences"
    - "Color palette chỉ 2 màu, color-blind users không phân biệt được"
  recommendations:
    - "Start Y-axis từ 0"
    - "Use Okabe-Ito palette"
    - "Add pattern fills (stripes/dots)"
```
