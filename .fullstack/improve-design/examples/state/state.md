---
name: state
states: [default, hover, focus, active, disabled, loading]
accessibility:
  - focus must be visible (focus-visible ring)
  - disabled must NOT remove from tab order silently
  - loading must announce "loading" to screen readers
anti_patterns:
  - removing focus ring "for aesthetics"
  - changing color as the only state cue
  - using opacity alone for disabled
---

# State (6 microstates)

Every interactive control must have all **6 microstates** in
`default / hover / focus / active / disabled / loading`. Pick a
single visual treatment per state, and **never use color alone** as
the cue.

## default

- the resting state
- meets WCAG contrast (≥ 4.5:1 for text)

## hover

- pointer is over the element
- only applies on pointer-fine devices (use `@media (hover: hover)`)

## focus

- keyboard focus
- visible ring (`:focus-visible` ring, ≥ 2px, contrast ≥ 3:1)
- distinct from hover

## active

- element is being pressed (mouse down) / activated (Enter pressed)

## disabled

- non-interactive
- `aria-disabled="true"` preferred over `disabled` attribute (keeps
  the element in the tab order, allowing explanation tooltips)
- visual: reduced contrast, cursor: not-allowed, no hover treatment

## loading

- async work in progress
- replace the label with a spinner + announce to screen readers
  (`aria-live="polite"` + `aria-busy="true"`)

## Anti-patterns

- ❌ Removing the focus ring (use `:focus-visible`).
- ❌ Color-only state cues (combine with icon / label).
- ❌ Disabling with `disabled` attribute (loses context for
  screen-reader users).
- ❌ Loading state that hides the label (causes layout shift and
  confuses screen readers).
