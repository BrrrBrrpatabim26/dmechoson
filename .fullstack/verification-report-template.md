# Verification Report: [FEATURE NAME]

> Companion to `spec.md` + `plan.md` + `tasks.md`. Verification chứng minh feature đáp ứng requirements.

**Purpose**: Document verification results cho tất cả 10 test layers theo Business.md VERIFICATION phase. Required artifact cho `verification` gate.

**Created**: YYYY-MM-DD
**Feature**: [Link to spec.md]
**Plan**: [Link to plan.md]
**Tasks**: [Link to tasks.md]
**Phase**: Verification

## 0. Test Environment & Data Readiness

**Status**: [Pass / Fail / Partial]

- [ ] Test environment provisioned (URLs, credentials)
- [ ] Test data seeded (fixtures, factories, snapshots)
- [ ] CI/CD pipeline green on main branch
- [ ] Staging environment matches production topology
- [ ] Secrets management configured

**Issues**:
- …

## 1. Requirement Traceability

| Requirement ID | Test Case | Status | Evidence |
|---|---|---|---|
| FR-001 | TC-FR-001 | ✅ Pass | test/test_requirement_fr001.py |
| FR-002 | TC-FR-002 | ✅ Pass | test/test_requirement_fr002.py |
| NFR-PERF-001 | TC-NFR-PERF-001 | ⚠️ Partial | reports/perf-001.html |

**Coverage**: [X / Y requirements traced] = [Z%]

## 2. Architecture Verification

**Status**: [Pass / Fail / Partial]

- [ ] Architecture conforms to `plan.md` decisions
- [ ] ADR-XXX (decision 1) implemented
- [ ] ADR-XXX (decision 2) implemented
- [ ] Layering rules respected (no upward dependencies)
- [ ] Dependency direction matches design

**Issues**:
- …

## 3. Unit Test Results

**Tooling**: [pytest / jest / go test / ...]

**Coverage**: [X%] (target: ≥80% for new code)

| Module | Lines | Covered | % |
|---|---|---|---|
| src/services/ | 1234 | 1100 | 89% |
| src/models/ | 567 | 530 | 93% |

**Failures**: 0

**Issues**:
- …

## 4. Integration Test Results

**Tooling**: [testcontainers / docker-compose / ...]

**Scope**: All services exercised end-to-end in test environment.

- [ ] Service A ↔ Service B contract test
- [ ] Database transactions tested
- [ ] External API mocks verified
- [ ] Message queue flows tested

**Failures**: 0

## 5. Contract Test Results

**Tooling**: [Pact / Spring Cloud Contract / OpenAPI validator]

**Provider Verification**:
- [ ] Provider `/v1/users` matches consumer expectations
- [ ] Provider `/v1/orders` matches consumer expectations

**Consumer Verification**:
- [ ] Consumer A contract holds
- [ ] Consumer B contract holds

## 6. E2E Test Results

**Tooling**: [Playwright / Cypress / Selenium / ...]

**Scenarios**:
- ✅ Happy path: User can complete primary journey in [X] steps
- ✅ Sad path 1: Validation errors handled correctly
- ✅ Sad path 2: Auth failure returns 401
- ✅ Sad path 3: Database connection failure handled

**Issues**:
- …

## 7. Security Test Results

**Tooling**: [OWASP ZAP / Snyk / Trivy / npm audit / ...]

**Findings**:
- [ ] 0 High CVEs in dependencies (current: 0)
- [ ] 0 Critical CVEs (current: 0)
- [ ] SAST scan clean
- [ ] Secrets scan clean (no hardcoded credentials)
- [ ] OWASP Top 10 review passed

**Issues**:
- …

## 8. Performance Test Results

**NFR Targets from spec.md**:
- API latency P95 < [Xms] (measured: [Yms]) ✅
- Throughput ≥ [X req/s] (measured: [Y req/s]) ✅
- Memory usage < [XGB] (measured: [YGB]) ✅
- CPU usage under load < [X%] (measured: [Y%]) ✅

**Issues**:
- …

## 9. Reliability/Resilience Test Results

**Scenarios**:
- [ ] Database failover: Service recovers in [X seconds]
- [ ] Network partition: Circuit breaker activates correctly
- [ ] External API outage: Graceful degradation works
- [ ] Load shedding: Priority requests served

**Chaos Engineering Drills**:
- [ ] Killed random pod: Service recovers
- [ ] Injected latency: Service degrades gracefully

## 10. Regression Test Results

**Full Prior Suite**: PASSED (X / Y tests)

**Critical Paths Verified**:
- [ ] Authentication flow
- [ ] Authorization flow
- [ ] Payment flow (if applicable)
- [ ] Data integrity checks

## 11. Business Flow Test Results

**Domain Scenarios**:
- [ ] User can sign up → log in → complete primary action
- [ ] Admin can manage users → see audit log
- [ ] Data export/import flows work correctly

## 12. Realistic/Staging Test Results

**Environment**: Staging với production-shaped data.

- [ ] Load test: 10k concurrent users for 1 hour — PASSED
- [ ] Soak test: 24-hour sustained load — PASSED
- [ ] Data volume: 1M records processed correctly — PASSED

## 13. Design/Requirement Verification

**Design Conformance**:
- [ ] All 12 design outputs from `design.md` implemented as specified
- [ ] API contract matches `design.md §3` table
- [ ] Data model matches `design.md §4` schema
- [ ] UI matches `design.md §5` wireframes
- [ ] Error codes match `design.md §7`

**Issues**:
- …

## Summary

### Test Gate Decision

**Coverage**: [X%]
**Critical Issues**: [Count]
**Security**: [0 high CVEs / N high CVEs]
**Performance**: [All NFRs met / N NFRs missed]

**Decision**: [✅ PASS / ❌ FAIL / ⚠️ CONDITIONAL]

### Risks Accepted

- [List any risks that were accepted với justification]

### Follow-up Actions

- [ ] [Action 1 - owner - due date]
- [ ] [Action 2 - owner - due date]

### Sign-off

- **Tech Lead**: _________________
- **QA Lead**: _________________
- **Product Owner**: _________________

**Date**: YYYY-MM-DD
**Version**: v1.0.0