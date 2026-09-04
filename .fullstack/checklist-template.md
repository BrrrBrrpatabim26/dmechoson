# Quality Checklist: [FEATURE NAME]

> Companion to `spec.md` + `plan.md` + `tasks.md`. Quality checklist validate chất lượng của requirements.

**Purpose**: Unit tests for English. Validate requirements quality, clarity, completeness — NOT implementation.

**Created**: YYYY-MM-DD
**Feature**: [Link to spec.md]
**Phase**: Requirement

## Requirement Completeness

- [ ] Are all functional requirements present with measurable criteria?
- [ ] Are edge cases documented (empty states, error states, boundary conditions)?
- [ ] Are negative scenarios specified (what the system must NOT do)?
- [ ] Are performance targets quantified (P95 latency, throughput)?
- [ ] Are availability targets defined (uptime %, MTTR)?
- [ ] Are security requirements explicit (authN, authZ, data protection)?
- [ ] Are observability requirements specified (logging, metrics, tracing)?

## Requirement Clarity

- [ ] Are requirements technology-agnostic (no implementation details)?
- [ ] Are vague terms quantified (e.g. "fast" → "<200ms P95")?
- [ ] Are acceptance criteria testable (pass/fail, measurable)?
- [ ] Is scope clearly bounded (in-scope vs out-of-scope)?
- [ ] Are assumptions documented?

## Requirement Consistency

- [ ] Are requirements aligned với constitution principles?
- [ ] Are requirements consistent với mỗi other (no contradictions)?
- [ ] Are terminology và glossary used consistently?
- [ ] Are same terms used for same concepts toàn bộ spec?

## Scenario Coverage

- [ ] Are all user journeys documented (happy path)?
- [ ] Are error scenarios covered (validation, auth, network failures)?
- [ ] Are edge cases addressed (empty data, large data, concurrent)?
- [ ] Are accessibility requirements defined (keyboard, screen reader, WCAG)?
- [ ] Are localization/i18n requirements specified (if applicable)?

## Non-Functional Requirements

- [ ] Performance: latency P95, throughput, resource usage
- [ ] Scale: concurrent users, data volume, growth projections
- [ ] Reliability: uptime SLA, RTO, RPO
- [ ] Security: OWASP Top 10, threat model, compliance
- [ ] Observability: logging, metrics, tracing, alerting
- [ ] Backup: frequency, retention, restore RTO
- [ ] Compliance: GDPR, HIPAA, SOC2 (as applicable)
- [ ] Deployment: zero-downtime, rollback plan

## Dependencies & Assumptions

- [ ] Are external dependencies documented (3rd-party APIs, libraries)?
- [ ] Are failure modes of external dependencies addressed?
- [ ] Are assumptions explicit (network availability, hardware specs)?
- [ ] Are constraints documented (budget, timeline, team size)?

## Ambiguities & Conflicts

- [ ] Are ambiguous terms replaced với specific values?
- [ ] Are conflicting requirements resolved (documented trade-offs)?
- [ ] Are open questions tracked (NEEDS CLARIFICATION)?

## Acceptance Criteria Quality

- [ ] Are acceptance criteria testable independently?
- [ ] Are Given/When/Then scenarios used for complex behaviors?
- [ ] Are happy path + error paths both specified?
- [ ] Are edge cases covered trong acceptance scenarios?

## Sign-off

### Requirement Owner
- Name: _________________
- Date: YYYY-MM-DD

### Tech Lead
- Name: _________________
- Date: YYYY-MM-DD

### Product Owner
- Name: _________________
- Date: YYYY-MM-DD
