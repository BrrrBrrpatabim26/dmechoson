---
name: anti-cliche
severity: high
patterns:
  - "raised card with drop shadow + 12px radius + 16px padding"
  - "hero section with centered headline + 2 buttons + image on the right"
  - "Sign Up CTA without a value proposition"
  - "footer with 4 columns of links + social icons + 'Made with ❤'"
checks:
  - "is the layout copy-paste-able into any product?"
  - "would swapping the brand make the page look the same?"
fix: "Replace the cliché with a product-specific anchor: a real number, a real user quote, a real workflow."
---

# Anti-Cliché

AI drafts default to a small set of "professional-looking" templates.
Detect and reject them.

## Patterns to flag

- Generic Material-style raised card.
- Hero section with 3-column CTA stack.
- "Sign Up" button without a value prop.
- Footer with 4 columns of links + Made-with-❤ line.

## Why

The user remembers the project, not the template. A draft that looks
like every other AI-generated landing page teaches them nothing and
adds nothing to the product's brand.

## How to fix

Replace the cliché with a **product-specific anchor**: a real metric,
a real user quote, a real workflow, a real screenshot.
