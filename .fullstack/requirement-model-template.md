# Requirement Model: [FEATURE NAME]

> Companion to `spec.md`. Consolidation of all requirement inputs trước khi validation.

**Purpose**: Consolidated model đ all inputs từ requirement discovery: FR + NFR + Constraints + Risk + Scope. Required cho REQ_VALIDATION step.

**Created**: YYYY-MM-DD
**Feature**: [Link to spec.md]
**Phase**: Requirement
**Delivery Target**: [Prototype / Staging / Production]

## 1. Functional Requirements (FR)

Reference: `spec.md §Functional Requirements`

| ID | Requirement | Priority | Test Coverage |
|---|---|---|---|
| FR-001 | [The system MUST …] | P1 | TC-FR-001 |
| FR-002 | [The system MUST …] | P1 | TC-FR-002 |
| FR-003 | [The system SHOULD …] | P2 | TC-FR-003 |

**Total FRs**: [N]

## 2. Non-Functional Requirements (NFR)

### Performance

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-PERF-001 | API latency P95 < [Xms] | Production APM | P1 |
| NFR-PERF-002 | Page load < [X seconds] | RUM | P2 |

### Scale

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-SCALE-001 | Support [X] concurrent users | Load test | P1 |
| NFR-SCALE-002 | Handle [X] requests/sec | Load test | P1 |

### Availability

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-AVAIL-001 | Uptime ≥ [99.X%] | Uptime monitor | P1 |
| NFR-AVAIL-002 | MTTR < [X minutes] | Incident logs | P2 |

### Security

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-SEC-001 | OWASP Top 10 compliance | Security audit | P1 |
| NFR-SEC-002 | All data encrypted at rest + transit | Config audit | P1 |
| NFR-SEC-003 | PII access logged | Audit log review | P1 |

### Observability

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-OBS-001 | All requests logged structured | Log audit | P1 |
| NFR-OBS-002 | Distributed tracing enabled | APM check | P2 |
| NFR-OBS-003 | Metrics dashboard exists | Dashboard review | P2 |

### Backup

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-BACKUP-001 | Daily automated backups | Backup logs | P1 |
| NFR-BACKUP-002 | RPO ≤ [X hours] | DR drill | P1 |

### Compliance

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-COMPL-001 | [GDPR / HIPAA / SOC2] compliance | Audit | P1 |

### Deployment

| ID | Target | Measurement | Priority |
|---|---|---|---|
| NFR-DEPLOY-001 | Deployment time < [X minutes] | CI/CD metrics | P2 |
| NFR-DEPLOY-002 | Zero-downtime deploys | Production monitoring | P1 |

**Total NFRs**: [N]

## 3. Business / Technical / Operational Constraints

### Business Constraints

- [Constraint 1: e.g. budget limit, regulatory requirement]
- [Constraint 2: e.g. launch date, market priority]

### Technical Constraints

- [Constraint 1: e.g. must use specific tech stack per constitution]
- [Constraint 2: e.g. integration with legacy system]

### Operational Constraints

- [Constraint 1: e.g. team size, skill set]
- [Constraint 2: e.g. on-call rotation, SLA]

## 4. Risk / Cost / Capacity Assessment

### Risks

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | [Risk description] | M | H | [Mitigation] |
| RISK-002 | [Risk description] | L | M | [Mitigation] |

### Cost Estimate

- Development effort: [X person-weeks]
- Infrastructure cost: [Y USD/month]
- Ongoing maintenance: [Z hours/month]

### Capacity Planning

- Expected traffic: [X req/day]
- Peak traffic: [Y req/hour]
- Storage growth: [Z GB/month]

## 5. Scope & Delivery Target

### In Scope

- [Feature/functionality 1]
- [Feature/functionality 2]

### Out of Scope

- [Explicit non-goal 1]
- [Explicit non-goal 2]

### Delivery Target

**Selected Target**: [Prototype / Staging / Production]

**Implications**:
- **Prototype**: Quick demo, no SLAs, may have known issues
- **Staging**: Pre-production validation, full feature set, no real users
- **Production**: Customer-facing, full SLAs, all gates enforced

### Success Criteria (User-Focused)

1. [Measurable outcome 1 — e.g., "Users can complete checkout in under 3 minutes"]
2. [Measurable outcome 2 — e.g., "System supports 10K concurrent users"]
3. [Business outcome 1 — e.g., "Reduce support tickets by 40%"]

## 6. Validation Checklist (REQ_GATE)

> Business.md REQ_GATE = Checklist + Risk + Scope + Governance

### Requirements Completeness

- [ ] All FRs testable và unambiguous
- [ ] All NFRs quantified with metrics
- [ ] Constraints documented
- [ ] Risks identified with mitigations
- [ ] Scope clearly bounded

### Requirement Quality

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are technology-agnostic (no implementation details)
- [ ] Success criteria are measurable
- [ ] Acceptance scenarios defined

### Governance

- [ ] Constitution principles re-checked
- [ ] Risk policy compliance verified
- [ ] Approval levels defined
- [ ] Audit log entries created

## 7. Sign-off

### Requirement Owner
- Name: _________________
- Date: YYYY-MM-DD

### Tech Lead
- Name: _________________
- Date: YYYY-MM-DD

### Product Owner
- Name: _________________
- Date: YYYY-MM-DD

---

**After sign-off**: Move to `requirement_baseline` and proceed to ARCHITECTURE phase.