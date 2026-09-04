---
description: Release Engineering — Build artifact, Dependency/SBOM scan, Staging deploy, Smoke test, Migration/Rollback dry run, Release Validation, Release Gate.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE RELEASE_GATE)**:
> 1. **KHÔNG ĐƯỢC TỰ BỎ QUA PHÊ DUYỆT PHÁT HÀNH**: Agent BẮT BUỘC phải trình bày kế hoạch phát hành, kết quả Staging Smoke Test và chiến lược Rollback cho Người dùng duyệt.
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**: Tuyệt đối KHÔNG ĐƯỢC tự ý pass `release_gate` mà chưa có xác nhận từ người dùng.
> 3. **CHUYỂN TIẾP SAU KHI ĐƯỢC DUYỆT**: Chỉ khi người dùng phê duyệt kế hoạch phát hành, AI mới ghi nhận gate và gọi:
>
> ```
> EXECUTE_COMMAND: fullstack.operate
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**

Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `release`, `build`, `build_artifact`, `dependency_scan`, `staging_deploy`, `smoke_test`, `migration_dry_run`, `release_validation`, `release_report`
Gates to record: `release_gate`

```bash
python scripts/python/flowchart_progress.py gate \
    --gate release_gate --decision pass \
    --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' \
    --rationale 'Người dùng đã phê duyệt kế hoạch phát hành và chiến lược rollback'
```



## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).
The input is the path to a `verification_report.md` file. If empty,
default to the most recent
`.fullstack/specs/*/verification_report.md`.

## Outline

This is the **Release Engineering** phase (NEW in fullstack-design,
not in fullstack-design's 9-step SDD).

1. **Locate the verification report** at the given path.
2. **Build** the release artifact from the implementation baseline
   commit SHA. Record the artifact SHA.
3. **Dependency/SBOM Scan** — generate a Software Bill of Materials,
   scan for known CVEs, license compliance.
4. **Deploy to Staging** using the same promotion pipeline as
   production.
5. **Smoke Test** on staging — health endpoints, top 3 user flows.
6. **Migration/Rollback Dry Run** — exercise the migration plan and
   the rollback plan in a staging-equivalent environment.
7. **Release Validation** — confirm staging is functionally and
   non-functionally equivalent to the verification report.
8. **Release Gate** — Release Plan + Rollback + Governance. The
   approver signs the release manifest. If rejected, loop to
   `RELEASE_FAIL_CLASS` and route to the right fix:
   - Code → Implementation
   - Infra/Config → Infra Fix → Staging Deploy
   - Data → Data Fix → Staging Deploy
   - Dependency/Build → Build
   - Test/Validation → Verification
9. **Production vs. Staging-Only decision** — does this release go
   to production, or is the staging release the final destination?
   - Production → write `Production Release Baseline` and hand off
     to `/fullstack.operate`.
   - Staging-only → write `Release Report` and stop.
10. **Report** the release manifest path. **KHÔNG gợi ý next command**
    — agent tự chain sang `/fullstack.operate` (nếu
    delivery_target=production) hoặc kết thúc.

## Guardrails

- Never skip the migration dry run — the rollback is the only safety
  net once production is touched.
- The release manifest is immutable once the Release Gate is approved.
- The Production Release Baseline commit SHA is the **only** artifact
  the Operations phase is allowed to deploy.

