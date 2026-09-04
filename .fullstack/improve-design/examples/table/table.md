---
name: table
anatomy: [table, header, row, cell, footer, pagination, selection]
variants: [static, sortable, paginated, selectable, virtualized]
accessibility:
  - <th scope="col">
  - sortable headers announce sort state
  - selectable rows use aria-selected
anti_patterns:
  - table with no header row
  - sortable column with no visual indicator of sort direction
  - selection state conveyed only by row background color
---

# Table

## When to use

Display rows of comparable data. Use **static** for ≤ 10 rows,
**sortable** when order matters, **paginated** beyond 50 rows, and
**virtualized** for thousands of rows.

## Variants

### static table

- no controls
- used in: read-only reports, summary views

### sortable table

- column header clickable
- ascending / descending / none
- indicator: arrow or chip

### paginated table

- page size selector
- previous / next
- total count

### selectable table

- checkboxes per row
- bulk action bar appears on selection
- shift-click range select

### virtualized table

- windowed rendering
- sticky header
- used in: large datasets, log views

## Anti-patterns

- ❌ Table without a header row.
- ❌ Sortable column with no visual indicator of the current sort.
- ❌ Selection state conveyed only by row background color (no
  border, no checkbox, no `aria-selected`).
- ❌ Putting an action menu inside every cell of a wide table (moves
  the user's attention to the menu, not the data).
