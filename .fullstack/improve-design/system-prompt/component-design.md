# Component Design System Prompt

## Purpose

Hướng dẫn AI agent thiết kế component library theo atomic design
methodology, đảm bảo consistency và reusability.

## Atomic Design Hierarchy

```
Atoms      → Button, Input, Icon, Label
Molecules  → Form Field (Label + Input + Help), Card (Image + Title + Body)
Organisms  → Header, Product Card + Actions, Comment Thread
Templates  → Page layout, Form layout
Pages      → Home, Product Detail, Settings
```

## Component API Design

### Props Pattern

```typescript
interface ButtonProps {
  // Variant (semantic)
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';

  // State
  loading?: boolean;
  disabled?: boolean;

  // Content
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;

  // Events
  onClick?: () => void;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;

  // As-prop pattern (polymorphic)
  as?: 'button' | 'a' | 'div';

  // Pass-through HTML attributes
  type?: 'button' | 'submit';
  name?: string;
  value?: string;
}
```

### Naming Conventions

- **Boolean props**: `isLoading`, `isDisabled`, `hasError` (NOT `loading`, `disabled`)
- **Event handlers**: `onClick`, `onChange`, `onSubmit`
- **Render functions**: `renderItem`, `renderHeader`
- **Slots**: `header`, `footer`, `actions` (NOT `headerElement`)

## Variant System

### Buttons

```text
primary   → main action (Sign in, Submit, Save)
secondary → alternative action (Cancel, Back)
ghost     → low-emphasis (Learn more, Skip)
danger    → destructive (Delete, Remove)
```

### Sizes

```text
sm → 32px height (compact tables, chips)
md → 40px height (default, most buttons)
lg → 48px height (primary CTAs, hero)
```

## States

Mỗi interactive component PHẢI có 5 states:

1. **Default** — normal appearance
2. **Hover** — pointer over (slight bg change)
3. **Focus** — keyboard focus (visible ring)
4. **Active** — being pressed (slight scale)
5. **Disabled** — non-interactive (greyed, no cursor)

```css
.btn {
  background: var(--btn-bg);
  color: var(--btn-fg);
  border: 1px solid transparent;
  transition: background 150ms, transform 100ms;
}

.btn:hover  { background: var(--btn-bg-hover); }
.btn:focus-visible { outline: 2px solid var(--accent-500); outline-offset: 2px; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

## Composition Pattern

```typescript
// Compound components
<Card>
  <Card.Header>
    <Card.Title>Project Name</Card.Title>
    <Card.Menu onEdit={...} onDelete={...} />
  </Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>
```

## Anti-Patterns

❌ **God components** (> 500 lines) — split
❌ **Boolean prop soup** (> 10 booleans) — use variants
❌ **Deep nesting** (> 4 levels) — flatten
❌ **Copy-paste components** — extend base
❌ **Inline styles** — use design tokens
❌ **Magic numbers** — use design tokens
❌ **Hard-coded strings** — i18n
❌ **No loading/error states** — always required

## AI Agent Checklist

Khi review components:

1. [ ] Consistent API với other components
2. [ ] 5 states (default/hover/focus/active/disabled)
3. [ ] Accessibility (aria-*, role, focus management)
4. [ ] No hard-coded values (use tokens)
5. [ ] Loading + error states
6. [ ] Keyboard navigable
7. [ ] Touch target ≥ 44×44px
8. [ ] Dark mode supported
9. [ ] Reduced motion respected
10. [ ] Documented với examples

## Design Token Integration

```typescript
// GOOD: dùng tokens
<button className="bg-accent-500 text-white px-4 py-2 rounded-md">
  Click me
</button>

// BAD: hard-coded
<button style={{ background: '#3b82f6', color: '#ffffff', padding: '8px 16px', borderRadius: '6px' }}>
  Click me
</button>
```

## Composition vs Inheritance

```typescript
// GOOD: composition
function DangerButton({ children, ...rest }) {
  return <Button variant="danger" {...rest}>{children}</Button>;
}

// BAD: inheritance
class DangerButton extends Button {
  // ❌ inheritance chains are fragile
}
```

## Storybook / Documentation

Mỗi component PHẢI có:

1. **Default state** — primary use case
2. **All variants** — visual comparison
3. **All sizes** — size comparison
4. **All states** — hover, focus, active, disabled, loading
5. **Edge cases** — long text, empty, error, success
6. **Accessibility demo** — keyboard navigation

## Output Format cho Component Review

```yaml
component: Button
variants: [primary, secondary, ghost, danger]
sizes: [sm, md, lg]
states_implemented: [default, hover, focus, active, disabled, loading]
issues:
  - issue_id: comp-001
    category: component
    severity: MEDIUM
    description: "Button missing loading state"
    evidence: "No spinner integration when loading=true"
    recommendation: "Add loading prop with spinner overlay"
```
