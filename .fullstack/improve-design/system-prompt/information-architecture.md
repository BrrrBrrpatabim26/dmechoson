# Information Architecture Prompt

## Purpose

Hướng dẫn AI agent thiết kế information architecture (IA) cho sản phẩm
— cách organize, label, structure content sao cho user tìm thấy thứ họ
cần nhanh chóng.

## IA Principles (Don Norman's Affordances)

1. **Visibility**: Important features phải thấy được
2. **Feedback**: Action results phải rõ ràng
3. **Constraints**: Guide user away from errors
4. **Mapping**: Relationship giữa controls và effects
5. **Consistency**: Same actions = same results
6. **Affordance**: Visual cues suggest how to use

## Navigation Patterns

### Top-level Nav (max 7 items)

```text
[Logo]   Home   Products   Pricing   Docs   Blog   [Sign In]   [Sign Up]
```

7±2 rule (Miller's Law). Trên mobile: collapse to hamburger.

### Hierarchical Tree (Breadcrumb)

```text
Home / Products / Shoes / Running / Nike Air Zoom
```

Breadcrumbs show hierarchy + allow quick jump up.

### Tab Bar (Mobile Bottom)

```text
[ Home ]  [ Search ]  [ Add ]  [ Notifications ]  [ Profile ]
```

3-5 items, max. Active state rõ ràng.

### Sidebar (Desktop)

```text
┌─────────────┐
│  Section 1  │   ← Active
│  Section 2  │
│  Section 3  │
│  ────────    │
│  Section 4  │
│  Section 5  │
└─────────────┘
```

Collapse to icons. Trên mobile: drawer.

## Card Sorting

Khi design IA, dùng card sorting:

1. List tất cả features/content
2. User group thành categories
3. Tìm common groupings → define structure

## Mental Models

User's understanding của product phải align với:

- **Familiar patterns** (GitHub → repos, files, PRs)
- **Domain conventions** (banking → accounts, transactions)
- **Task goals** (search → results, filters, detail)

## Naming Conventions

- **Nouns for objects** (Project, User, Post)
- **Verbs for actions** (Create, Edit, Delete)
- **Clear > Clever** (Delete > "Trashify")
- **Consistent terminology** (pick one, stick with it)

## Hierarchy Patterns

### Visual Hierarchy

1. **Size** — bigger = more important
2. **Color** — accent > neutral
3. **Position** — top-left > bottom-right (F-pattern)
4. **Contrast** — high contrast = more important
5. **Whitespace** — isolated = more important
6. **Motion** — moving = attention

### Information Hierarchy

```text
H1 (Page title)         → 32-48px, bold
H2 (Section title)      → 24-32px, semibold
H3 (Subsection)         → 18-20px, medium
Body                    → 14-16px, regular
Caption                 → 12-14px, regular, gray
```

## Empty Hierarchy = Lost User

```text
BAD:                        GOOD:
[ Settings ]                [ Account Settings ]
[ Profile ]                 ├─ Personal info
[ Preferences ]             ├─ Email
[ Account ]                 ├─ Password
[ Security ]                └─ Two-factor auth
[ Privacy ]                 
[ Notifications ]           [ Preferences ]
                            ├─ Theme
                            ├─ Language
                            └─ Timezone
```

Group related items. Max 3 levels of nesting.

## Search Patterns

- **Faceted search**: filters sidebar
- **Command palette** (⌘K): power users
- **Instant search**: as-you-type với debounce
- **Voice search**: với proper UI feedback

## URL Structure

```text
/                                  → Home
/products                          → Product list
/products/:category                 → Filtered
/products/:id                       → Detail
/products/:id/reviews               → Sub-resource
/blog/2026/september/post-title      → SEO-friendly
```

- **Hyphens**, not underscores
- **Lowercase**
- **No file extensions**
- **Predictable hierarchy**

## Navigation Anti-Patterns

❌ **Hidden nav** (hamburger hides everything) — discovery fail
❌ **Mega menus** (overwhelming) — cognitive load
❌ **Too many levels** (>3) — lost
❌ **Inconsistent labels** (Project/Item/Thing) — confusing
❌ **Icon-only nav** without labels — accessibility fail
❌ **Breadcrumbs that don't match URLs** — broken
❌ **Nav that changes context** unexpectedly — confusing

## Search & Discovery

```yaml
search:
  input: 
    placeholder: "Search projects..."
    autofocus: true
    shortcut: "/"
  results:
    per_page: 20
    facets: [type, language, owner]
    sort: [relevance, recent, popular]
  empty_state:
    title: "No results for 'foo'"
    suggestions: ["Try different keywords", "Check spelling"]
    cta: "Clear search"
```

## Onboarding Flows

```yaml
onboarding:
  steps:
    - title: "Welcome"
      purpose: "Introduce product"
    - title: "Connect data"
      purpose: "Import first data"
    - title: "Customize"
      purpose: "Personalize"
    - title: "Done"
      purpose: "Start using"
  skip_allowed: true
  progress_shown: true
  can_return_to: true
```

## Settings IA

```yaml
settings:
  profile:
    - name
    - avatar
    - email
    - phone
  account:
    - password
    - 2fa
    - sessions
  preferences:
    - theme
    - language
    - notifications
  billing:
    - plan
    - payment
    - invoices
  privacy:
    - data
    - visibility
```

## AI Agent Checklist

Khi review IA:

1. [ ] Top-level nav max 7 items
2. [ ] Clear hierarchy (max 3 levels)
3. [ ] Consistent terminology
4. [ ] Search accessible
5. [ ] Breadcrumbs match URLs
6. [ ] Mobile nav pattern (drawer/tab)
7. [ ] No hidden critical actions
8. [ ] IA tested với real users
9. [ ] URL structure SEO-friendly
10. [ ] Onboarding progressive disclosure

## Output Format

```yaml
ia_review:
  nav: "Top-level: 6 items, well-balanced"
  hierarchy: "Max 2 levels, good"
  terminology: "Consistent 'Project' throughout"
issues:
  - issue_id: ia-001
    category: ia
    severity: HIGH
    description: "Settings buried 3 levels deep"
    evidence: "Settings > Account > Security > 2FA"
    recommendation: "Promote 2FA to top-level Account section"
```
