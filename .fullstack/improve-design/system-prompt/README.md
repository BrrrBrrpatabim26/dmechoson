# System Prompts (default anti-UI policy)

This folder ships with fullstack-cli as the **default prompt templates**
the `/fullstack.improve-design` skill uses to detect and reject
low-quality UI drafts. They are loaded into the **Page Context** alongside
`examples/` and `knowledge/`.

> Edit freely — the AI treats these files as authoritative for the
> project's anti-UI policy. Re-running `/fullstack.improve-design` picks
> up changes on the next iteration.

## File index

| File | What it detects |
|---|---|
| `anti-cliche.md` | Generic material-design cliches (raised cards, hero gradients, "Sign up" CTA without context). |
| `anti-emoji-misuse.md` | Emoji used as UI control (button label), emoji as visual hierarchy replacement, or emoji flooding. |
| `anti-purple-blue-gradient.md` | `#6366f1 → #8b5cf6` purple-blue gradient, the canonical AI-default. |
| `anti-placeholder-label.md` | Placeholder text used as the only label. |
| `anti-toast-spam.md` | Toasts for blocking decisions, auto-dismissing critical info, etc. |
| `anti-modal-trap.md` | Modals that trap focus without escape, or that wrap trivial content. |
| `anti-card-button-ambiguity.md` | Card with no focusable target, or card that becomes a button when body contains links. |
| `anti-focus-ring-removed.md` | `:focus { outline: none; }` without a `:focus-visible` replacement. |
| `anti-color-only-state.md` | State conveyed only by color (no icon / no label). |
| `anti-horizontal-overflow.md` | `width: 100vw` on inner containers, `min-w-` without `min-w-0` on flex children. |
| `anti-mobile-unfriendly.md` | Fixed widths ≥ 320px, no mobile breakpoint, touch targets < 44px. |
| `anti-loading-shift.md` | Loading state that hides the label, causes layout shift. |

## Severity

Each anti-pattern is tagged with one of three severities in its
frontmatter:

- `severity: critical` — fails the gate immediately, regardless of
  `min_score`.
- `severity: high` — drops the score by 20 points.
- `severity: medium` — drops the score by 10 points.

The `/fullstack.improve-design` skill reads these severities and
applies them in `evaluation/eval-v{N}.json` under `anti_ui_issues`.
