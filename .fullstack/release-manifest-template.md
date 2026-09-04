# Release Manifest: [FEATURE NAME / RELEASE VERSION]

> Companion to `verification_report.md`. Manifest chứng minh release candidate sẵn sàng cho production.

**Purpose**: Document release engineering artifacts theo Business.md RELEASE phase. Required artifact cho `release` gate.

**Created**: YYYY-MM-DD
**Feature**: [Link to spec.md]
**Verification Report**: [Link to verification_report.md]
**Phase**: Release
**Release Version**: [v1.0.0]
**Target**: [Staging / Production]

## 0. Release Identification

- **Release ID**: REL-YYYY-MM-DD-NNN
- **Git Tag**: v1.0.0
- **Commit SHA**: [abcdef1234567890]
- **Branch**: [main / release/v1.0.0]
- **Author**: [name]
- **Approvers**: [list]
- **Release Date**: YYYY-MM-DD

## 1. Build Artifact

**Status**: [Pass / Fail]

- [ ] Source code builds without errors
- [ ] Build is reproducible (same input → same output)
- [ ] Build artifact signed (cosign / GPG)
- [ ] SBOM (Software Bill of Materials) generated
- [ ] Docker image built and tagged
- [ ] Binary artifacts uploaded to artifact registry

**Artifact Locations**:
- Container image: `registry.example.com/[project]:v1.0.0`
- Binary: `s3://releases/[project]/v1.0.0/[binary]`
- Checksum: `sha256:abc123...`

## 2. Dependency / SBOM Scan

**Tooling**: [Snyk / Trivy / OWASP Dependency-Check]

**Results**:
- Total dependencies: [N]
- Known vulnerabilities: [N]
  - Critical: 0
  - High: 0
  - Medium: [N] (with justification)
  - Low: [N] (accepted)
- License compliance: All compatible với [license]

**SBOM Format**: [SPDX / CycloneDX]
**SBOM Location**: `s3://sbom/[project]/v1.0.0.spdx.json`

**Issues**:
- …

## 3. Deploy Staging

**Status**: [Pass / Fail / Pending]

- [ ] Staging environment provisioned
- [ ] Deployment pipeline tested
- [ ] Configuration management applied (kustomize / helm / terraform)
- [ ] Health checks configured
- [ ] Smoke test plan ready

**Deployment Method**: [Blue-Green / Canary / Rolling Update]
**Rollout Plan**: [10% → 50% → 100% over 2 hours]

**Staging URL**: https://staging.example.com
**Deployed At**: YYYY-MM-DD HH:MM UTC

## 4. Smoke Test Results

**Scope**: Critical paths verified in staging.

- [ ] Health check endpoint returns OK
- [ ] Authentication works (login → token)
- [ ] Primary user journey works end-to-end
- [ ] Database connectivity verified
- [ ] External API integrations functional

**Issues**:
- …

## 5. Migration / Rollback Dry Run

**Status**: [Pass / Fail]

### Migration Plan

- [ ] Database migrations tested in staging
- [ ] Backwards compatibility verified
- [ ] Data backfill plan documented
- [ ] Migration runbook ready

### Rollback Plan

- [ ] Rollback procedure tested
- [ ] Rollback target RTO: [≤15 minutes]
- [ ] Rollback target RPO: [≤5 minutes]
- [ ] Rollback triggers defined:
  - Error rate > [X%]
  - Latency P95 > [Yms]
  - Health check fails
  - Manual trigger

**Issues**:
- …

## 6. Release Validation

**Scope**: Final pre-release checks.

- [ ] All blocking bugs resolved
- [ ] All critical/high security findings resolved
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Release notes drafted
- [ ] Customer-facing changelog updated
- [ ] On-call schedule updated

**Issues**:
- …

## 7. Release Gate Decision

**Required Approvals**:
- [ ] Tech Lead sign-off
- [ ] QA Lead sign-off
- [ ] Product Owner sign-off
- [ ] Security review (if applicable)
- [ ] Compliance review (if applicable)

**Decision**: [✅ APPROVE / ❌ REJECT]

**Justification**:
- All verification_report.md criteria met
- All migration/rollback tests passed
- All stakeholders signed off

## 8. Production Deployment (Conditional)

**Status**: [Pending / In Progress / Complete / Failed]

> Only complete this section if release is approved AND production deployment is required.

### Deployment Plan

- [ ] Production environment validated
- [ ] Change window scheduled: [YYYY-MM-DD HH:MM - HH:MM UTC]
- [ ] Rollback plan rehearsed
- [ ] Monitoring dashboards ready
- [ ] Alerting rules configured

### Deployment Execution

- [ ] Pre-deployment backup completed
- [ ] Database migrations executed
- [ ] Application deployed
- [ ] Health checks pass
- [ ] Smoke tests pass in production

### Post-Deployment Validation

- [ ] Production traffic stable (15 minutes observation)
- [ ] No error rate spike
- [ ] No latency regression
- [ ] Customer-reported issues: 0

## 9. Release Report

**Release Outcomes**:
- Features delivered: [list]
- Issues encountered: [list with resolution]
- Performance vs NFRs: [comparison]
- Customer impact: [summary]

**Lessons Learned**:
- [What went well]
- [What could be improved]

## 10. Release Notes (Customer-facing)

### What's New

- **[Feature 1]**: [User-facing description]
- **[Feature 2]**: [User-facing description]

### Bug Fixes

- **[BUG-XXX]**: [Description]

### Breaking Changes

- [None / List of breaking changes với migration guide]

### Upgrade Instructions

[Step-by-step upgrade guide]

## Sign-off

### Release Manager
- Name: _________________
- Date: YYYY-MM-DD

### Tech Lead
- Name: _________________
- Date: YYYY-MM-DD

### Product Owner
- Name: _________________
- Date: YYYY-MM-DD

### On-call Engineer
- Name: _________________
- Date: YYYY-MM-DD