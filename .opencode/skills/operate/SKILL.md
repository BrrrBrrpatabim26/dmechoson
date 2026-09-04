---
name: fullstack-operate
description: Production Operations — Health Check, Monitoring, Alerting, Production Validation, Rollback on failure, Change Request intake, Definition of Done check.
---

---
description: Production Operations — Health Check, Monitoring, Alerting, Production Validation, Rollback on failure, Change Request intake, Definition of Done check.
---


<!-- end-to-end-automation:v1.1.0 -->
<!-- qa-then-continue:v1.1.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY INTERACTIVE OPERATIONS & DOD CHECK)**:
> 1. **VẬN HÀNH & KIỂM TRA ĐỊNH NGHĨA HOÀN THÀNH (DOD)**: Theo dõi hoạt động, ghi nhận feedback và đối chiếu Definition of Done (DoD) với Người dùng.
> 2. **KẾT THÚC CHU TRÌNH**: Sau khi xác nhận hoàn thành, kết thúc quy trình:
>
> ```
> EXECUTE_COMMAND: (end-of-workflow)
> ```

**Flowchart progress hooks (Business.md Flowchart #1):**

Flowchart: ` business_1_fullstack_sdd `
Nodes to mark on success: `deployment`, `deploy_plan_check`, `prod_deploy`, `health_check`, `monitoring`, `alerting`, `prod_validation`, `operations`, `feedback`, `change_request`, `change_impact_analysis`, `change_class`, `dod_check`
Gates to record: `dod_check`

```bash
python scripts/python/flowchart_progress.py gate \
    --gate dod_check --decision pass \
    --inputs '{"user_confirmed": true}' --threshold '{"dod_met": true}' \
    --rationale 'Người dùng đã xác nhận đạt tiêu chuẩn Definition of Done'
```



## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).
The input is the path to a `release_manifest.md` file (or empty to
operate the most recent production baseline).

## Outline

This is the **Production Operations** phase (NEW in fullstack-design).

1. **Deployment Plan & Rollback Approved** — verify both are
   signed-off before any production action.
2. **Deploy Production** using the artifact from the Production
   Release Baseline.
3. **Health Check** — synthetic probes, error rate, latency p99.
4. **Monitoring** — dashboards wired; baseline metrics recorded.
5. **Alerting** — on-call rotation notified; alert thresholds match
   the NFR table from `/fullstack.requirement`.
6. **Production Validation** — synthetic user flow + a small
   canary cohort of real users.
7. **Production ổn định?** decision:
   - **No** → **Rollback** (one-command) → **Incident Analysis** →
     **Root Cause** → route to the right fix phase.
   - **Yes** → continue.
8. **Feedback / New Change intake** — for every signal:
   - **Bug** → `/fullstack.analyze` for triage (then root cause).
   - **Feature / Technical Debt / Architecture / Security /
     Performance / Data / Ops-Infra** → re-enter the cycle at the
     appropriate phase (see CHANGE_CLASS routing in Business.md).
9. **Definition of Done check** — does the release meet the DoD for
   the chosen Delivery Target (Prototype / Staging / Production)?
   - No → loop back to feedback.
   - Yes → mark the spec as `DONE`.
10. **Report** the operations log path. **KHÔNG gợi ý next command**
    — flow kết thúc; final summary đã được print bởi `/fullstack.auto`.

## Guardrails

- Rollback is the default for **any** production instability within
  the first 60 minutes. Do not investigate in production first.
- The Change Request intake must classify every signal — silent
  changes are forbidden.
- The DoD check is mandatory for the project to be marked `DONE`.


