# Anti-UI Patterns

> Project-confirmed anti-UI patterns. The skill appends a new entry
> only when the **same** issue reproduces across **at least 2 pages**
> in the same session (or when an external code-review explicitly
> confirms a system-level issue).

The seed set in `system_prompts/` is the **default policy**; this
file is the **project-specific amplification** of that policy.

## Format

```markdown
## YYYY-MM-DD — <slug>

**Pattern**: <what the AI did wrong>
**Where it appeared**: <list of page_ids>
**Why it failed**: <root cause>
**Fix**: <what the next draft should do>
```

## How to use

Each entry is loaded into the **Page Context** for every subsequent
page. The skill uses these as **hard rules** — any draft that
re-introduces a confirmed pattern is rejected by the Gate C check
even if `score >= min_score`.

## Promotion rule

A pattern only lands here when it has been confirmed by:

1. **Reproduction** — same pattern in ≥ 2 different pages, OR
2. **External review** — a human reviewer flagged it in the design
   review (gate between AI review and user review).

A one-off misstep goes in `experience.md` instead.
