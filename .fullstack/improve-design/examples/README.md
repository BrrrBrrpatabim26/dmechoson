# UI Component Examples (default)

This folder ships with fullstack-cli as the **default reference set** for
the `/fullstack.improve-design` skill. The skill loads these examples
into the page context alongside `knowledge/experience.md` and
`knowledge/anti-ui-patterns.md` to ground the AI in concrete,
production-tested patterns.

> The user is free to **add, replace, or remove** any file in this
> folder. After the first init, the folder is owned by the project
> (manifest-tracked, not overwritten by re-init).

## What belongs here

* `card.md` — primitive card variants (info / action / data / media).
* `form.md` — input patterns (single / multi-step / inline / modal).
* `table.md` — table patterns (sortable / paginated / selectable).
* `nav.md` — navigation patterns (top nav / sidebar / breadcrumbs).
* `feedback.md` — feedback tiers (Inline Alert / In-pane Banner /
  Bottom Snackbar / Blocking Dialog).
* `state.md` — 6 microstates (default / hover / focus / active /
  disabled / loading).
* `motion.md` — micro-interaction and motion budget.

## File format

Each file is a single Markdown example with:

* **Title** — the component name.
* **Anatomy** — structural breakdown.
* **Variants** — at least 3 production-tested variants.
* **Accessibility** — keyboard, screen-reader, focus order.
* **Anti-patterns** — what NOT to do.
* **Code stub** — pseudo-code or React/HTML skeleton.

## Why this folder exists

The `/fullstack.improve-design` skill runs an iterative loop:

```
draft → evaluate → root-cause → knowledge-classify → next context
                          ↑                              ↓
                          └─── knowledge + examples ──────┘
```

Without concrete examples the AI improvises; with them, the AI has a
narrow target to aim at, and `min_score` becomes achievable in
`max_loop = 2` instead of 5.
