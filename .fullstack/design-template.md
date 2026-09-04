# Design Plan

> Companion to `spec.md` + `plan.md`. One design per feature.

## 0. Metadata

- **Spec**: `spec.md`
- **Plan**: `plan.md`
- **Author**: …
- **Created**: YYYY-MM-DD
- **Version**: 1.0.0
- **API Contract Version**: v1

## 1. Domain Design

- **Entities & Aggregates**: …
- **Bounded Contexts**: …
- **Ubiquitous Language**: …

## 2. Application Design

- **Modules & Layering**: …
- **Dependency Direction**: …

## 3. API Contract Design

| Endpoint | Method | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| `/v1/...` | POST | Bearer | `…` | `…` | `400/401/409/500` |

OpenAPI / GraphQL SDL attached as `api-contract.{yml,graphql}`.

## 4. Data Model

```sql
-- DDL
CREATE TABLE … (…);
```

- **Indexes**: …
- **Constraints**: …
- **Migrations**: numbered, reversible.

## 5. UI/UX Design

- **Screen list**: …
- **Layout principles**: …
- **Accessibility**: WCAG 2.1 AA.
- **UI skill output**: `improve-design/outputs/ui-spec-final.md` (per page).

## 6. Component Design

- **Reusable components**: list, contract, props/state.
- **Composition rules**: …

## 7. Error Handling

- **Error codes**: … (stable across the API)
- **Retry / fallback policy**: …

## 8. Security Design

- **Authn / Authz flow**: …
- **Secret rotation**: …
- **PII handling**: …

## 9. Test Strategy

| Layer | Tooling | Gate |
|---|---|---|
| Unit | … | ≥80% coverage |
| Integration | … | all services exercised |
| Contract | … | provider/consumer match |
| E2E | … | happy + 3 sad |
| Security | … | 0 high CVEs |
| Performance | … | NFR targets met |
| Reliability | … | chaos drill passed |
| Regression | … | full prior suite |
| Business | … | domain flows |
| Realistic/Staging | … | prod-shaped data |

## 10. Test Environment / Data

- **Staging env**: …
- **Fixtures**: …
- **Data masking**: …

## 11. Deployment Design

- **Rollout plan**: canary → 10% → 50% → 100%.
- **Feature flags**: …
- **Promotion path**: dev → staging → prod.

## 12. Observability Design

- **Dashboards**: …
- **Alerts**: …
- **Runbook**: …

## 13. Migration Design

- **Backfill plan**: …
- **Backward compat**: …

## 14. Rollback Design

- **Triggers**: SLO breach, error rate > X%, manual.
- **Procedure**: one command, target RTO ≤ 15 min.

## 15. Impact Analysis

| Change | Touches | Risk | Owner |
|---|---|---|---|
| … | … | M/H | … |

## 16. Design Review

- **AI Review**: …
- **User Review**: …

## 17. Design Gate

- [ ] API contract versioned
- [ ] Cross-references to other specs versioned
- [ ] Constitution re-checked
- [ ] Governance sign-off
