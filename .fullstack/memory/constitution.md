# my-awesome-dmesoncho Constitution

> Governing principles cho dự án my-awesome-dmesoncho. Sửa file này khi
> working agreement của team thay đổi. Đây là nguồn sự thật cho mọi
> trade-off; khi phân vân, tham chiếu lại đây trước khi quyết định.

## 1. Purpose

Tài liệu này định nghĩa các nguyên tắc bất biến mà mọi contributor (AI
hay human) phải tôn trọng khi làm việc trong repo `my-awesome-dmesoncho`.
Mọi phase — Requirement, Architecture, Design, Implementation,
Verification, Release — đều được đánh giá tuân thủ (compliance) dựa trên
constitution này. Khi spec, plan, code, hoặc release mâu thuẫn nhau,
constitution thắng.

Trọng tâm của dự án là thiết kế System và Nghiệp vụ. Code chỉ là hệ quả
của nghiệp vụ đã rõ ràng, đã được User phê duyệt. Không đánh đổi
architecture để triển khai nhanh.

Project context hiện tại: repo khởi tạo mới, nền tảng bắt buộc gồm
Docker, PostgreSQL, SuperTokens self-hosted, Flyway. Các công nghệ khác
chỉ bổ sung khi nghiệp vụ thực sự yêu cầu (xem §7).

## 2. Core Principles (Năm trụ cột)

### I. Stack & Boundaries — MUST

1. **Công nghệ nền tảng bắt buộc:** Docker, PostgreSQL, SuperTokens
   self-hosted, Flyway. Mọi spec mới MUST kế thừa nền tảng này trong
   `plan.md` → Architecture Overview. Công nghệ khác (ngôn ngữ, framework,
   cache, broker, observability) chỉ bổ sung theo nhu cầu thực tế (xem §7).
2. **Tuân thủ kiến trúc Microservices và business-driven module:**
   - Mỗi microservice/module MUST có boundary, trách nhiệm và business
     ownership rõ ràng.
   - CẤM service/module import trực tiếp code nội bộ của service/module khác.
   - CẤM truy cập trực tiếp database của service/module khác.
   - CẤM share business logic, domain model, entity, DTO, service,
     repository giữa các module. Nếu hai module cùng nhu cầu, mỗi module
     tự triển khai theo business context của mình, không dùng chung
     business implementation.
   - Các module trong cùng service giao tiếp qua interface/abstraction phù hợp.
   - Các microservice giao tiếp qua REST, gRPC, Event hoặc Message khi thực
     sự cần. CẤM dùng Java interface để giao tiếp trực tiếp giữa các microservice.
3. **Tuân thủ SOLID, Clean Architecture hoặc Hexagonal Architecture, và
   Dependency Inversion:**
   - Domain KHÔNG phụ thuộc Infrastructure hoặc framework.
   - Sử dụng interface và abstraction tại boundary thực sự cần thiết.
   - CẤM tạo abstraction chỉ để tăng số lượng interface.
   - CẤM over-engineering. Ưu tiên giải pháp đơn giản nhất nhưng vẫn đáp ứng
     đúng nghiệp vụ, production và khả năng mở rộng cần thiết.
   - Chia và quản lý module theo nghiệp vụ, ưu tiên business-driven architecture.
4. **Code sạch và production-ready:**
   - Code tường minh, gọn, dễ đọc, dễ bảo trì, dễ mở rộng.
   - CẤM tạo class, method, layer, pattern hoặc infrastructure nếu không có
     nhu cầu thực tế.
   - Sử dụng annotation phù hợp với framework và trách nhiệm của class,
     không lạm dụng annotation.
5. **Forbidden patterns (kế thừa v1.0.0, vẫn hiệu lực):**
   - CẤM hardcode secret/key trong repo (xem thêm §5).
   - CẤM truy cập DB trực tiếp từ frontend; CẤM business logic lõi nằm trong
     UI component.
   - CẤM gradient tím-xanh `#6366f1` → `#8b5cf6` và mọi gradient trang trí
     không có design token.
   - CẤM horizontal overflow: `box-sizing: border-box`, `max-width: 100%`,
     `min-w-0` trên Flex/Grid children; CẤM `100vw` / `w-screen` trên inner container.
   - CẤM fixed width ≥ 320px trên inner container; mobile < 640px MUST sụp
     về 1 cột dọc.
   - CẤM bo góc 2xl/3xl tràn lan — tuân thủ Concentric Radius Hierarchy
     `R_inner = max(0, R_outer - padding)`.
   - CẤM `any` lan tràn (TS) / untyped boundary (Python) tại public API;
     CẤM TODO không có issue link tồn tại quá 1 sprint.

### II. Development Workflow — MUST

1. **Spec → Plan → Design → Tasks → Implement gate:** Mọi thay đổi chức năng
   MUST bắt đầu bằng spec trong `.fullstack/specs/<id>/spec.md` (theo
   `spec-template.md`). Implementation plan đi kèm trong `plan.md` (theo
   `plan-template.md`), design trong `design.md` (theo `design-template.md`),
   task breakdown trong `tasks.md` (theo `tasks-template.md`). PR MUST link
   bộ ba/bộ bốn này.
2. **Cổng Không-Code (No-Code Gate) — bất biến:**
   - KHÔNG code khi chưa được User cho phép.
   - KHÔNG code khi tất cả chưa rõ ràng, chưa đúng luồng nghiệp vụ.
   - KHÔNG code khi User đã cho phép nhưng yêu cầu vẫn mơ hồ → MUST quay lại,
     làm rõ nghiệp vụ, hiểu toàn bộ ý và yêu cầu, làm sáng tỏ với User trước.
   - Trước khi code MUST xác định rõ nghiệp vụ, boundary, dependency và flow.
3. **Thứ tự triển khai bắt buộc trong mỗi feature:**
   Phân tích nghiệp vụ → Xác định business boundary → Xác định Aggregate →
   Xác định Entity và Value Object → Xác định Business Rule và invariant →
   Viết Domain → Viết Domain Unit Test → Xác định Port/Interface cần thiết →
   Viết Use Case/Application → Viết Application Unit Test → Implement
   Infrastructure cần thiết → Viết Integration Test khi có integration →
   Implement Mapper nếu cần → Implement DTO → Implement Controller →
   Viết API/Integration Test → Cập nhật Configuration nếu cần → Cập nhật
   Documentation → Chạy Quality Gate.
4. **Gate phê duyệt:** `arch_gate` (Architecture) và `test_gate`
   (Verification) REQUIRE human approval显式 — agent KHÔNG được tự pass.
   `req_gate` (Requirement checklist) phải xanh trước khi sang Plan.
5. **Small, independently shippable phases:** `plan.md` chia Phase 1
   Foundation → Phase 2 Core → Phase 3 Polish, mỗi phase có Outcome +
   Rollback đo được. Không gộp breaking change + feature mới trong cùng PR.
6. **Traceability:** Mỗi task ID (`T001`…) MUST trace về user story / FR
   trong `spec.md`; mỗi test MUST trace về acceptance criteria
   (Given/When/Then).

### III. Quality Bar — MUST

1. **Static gates (0-tolerance):** 0 lint error, 0 type error
   (`tsc --noEmit` / `mypy` / `ruff check` tùy stack). Build MUST xanh
   trước khi mở PR.
2. **Test coverage và kỷ luật test:**
   - Unit test coverage bắt buộc >= 95%. Không bỏ qua test hoặc sửa test chỉ
     để đạt coverage. Không được giảm coverage của module một cách không có lý do.
   - Code đến đâu phải test đến đó. Sau mỗi thay đổi phải kiểm tra lại business flow.
   - Phải test happy path, validation, business rule, exception và edge case quan trọng.
   - Critical business logic MUST có unit test trực tiếp.
   - Các integration quan trọng MUST có integration test. Database integration
     MUST được test phù hợp. API quan trọng MUST có API/integration test.
   - Verification chạy 10 tầng (Unit, Integration, Contract, E2E, Security,
     Performance, Reliability, Regression, Business Flow, Staging) theo
     `verification-report-template.md`.
   - Build và test MUST pass trước khi hoàn thành.
3. **Quality Gate hoàn thành feature (tất cả MUST đạt):**
   - Craft Score >= 95/100.
   - Không có lỗi Critical/Blocker.
   - Không hard-code configuration.
   - Không vi phạm module boundary.
   - Không vi phạm dependency boundary.
   - Không vi phạm SOLID nghiêm trọng.
   - Không merge/hoàn thành code khi test thất bại.
   - Khi thay đổi business logic MUST cập nhật test.
   - Khi thay đổi API MUST cập nhật API documentation.
   - Khi thay đổi database MUST cập nhật migration và test.
   - Khi thay đổi configuration MUST cập nhật tài liệu cấu hình.
4. **UI microstates (6-state rule):** Mọi control ship với đủ default /
   hover / focus / active / disabled / loading + custom `:focus-visible`
   ring. Touch target ≥ 44×44px.
5. **4-tier contextual feedback:** Inline Alert → In-pane Banner → Bottom
   Snackbar → Blocking Dialog. CẤM toast spam; CẤM chỉ dùng màu sắc để
   truyền trạng thái (phải có icon + text).
6. **Accessibility & responsive:** WCAG 2.2 AA tối thiểu (contrast,
   keyboard nav, focus order, aria). Mobile-first containment như mục I.5.
7. **Ngôn ngữ comment và tài liệu:**
   - Comment chỉ sử dụng tiếng Việt, không comment bằng tiếng Anh.
   - Comment chỉ giải thích logic hoặc lý do cần thiết, không mô tả lại code.
   - Mọi tài liệu Markdown MUST viết bằng tiếng Việt.
   - Code block trong tài liệu nếu có comment thì comment MUST bằng tiếng Việt.

### IV. AI Agent Conduct — MUST

1. **Tập trung System và Nghiệp vụ:** Mọi đề xuất của agent MUST xuất phát từ
   nghiệp vụ và boundary, không tự ý sinh code/infrastructure ngoài phạm vi
   nghiệp vụ đã chốt.
2. **Tuân thủ No-Code Gate (xem II.2):** Agent KHÔNG được code khi chưa có
   phê duyệt显式 của User, khi luồng nghiệp vụ chưa rõ, hoặc khi yêu cầu còn
   mơ hồ dù đã được cho phép. Trường hợp mơ hồ, agent MUST đặt câu hỏi làm rõ
   và cập nhật spec/plan trước.
3. **Disclosure:** AI authorship MUST được disclose trong commit message
   footer (`Co-authored-by: <agent>`) + PR description. Không mạo danh human review.
4. **Scope discipline:** Không sửa file ngoài scope của spec đang active.
   Không rewrite constitution / spec / plan silently — MUST show diff trước
   và chờ human review.
5. **Conflict resolution:** Khi spec và code mâu thuẫn, **spec thắng** — cập
   nhật code và sửa spec trong cùng PR (ghi rõ lý do trong PR). Khi
   constitution và spec mâu thuẫn, **constitution thắng** — MUST amend spec,
   không tự sửa constitution để hợp thức hóa.
6. **Evidence before synthesis:** Mọi claim kỹ thuật MUST dựa trên đọc file /
   chạy lệnh thật, không đoán. Test result KHÔNG được giả lập bằng văn bản —
   phải là output terminal thực tế (exit code 0).
7. **Ngôn ngữ đầu ra:** Mọi tài liệu Markdown do agent tạo MUST bằng tiếng
   Việt; comment trong code MUST bằng tiếng Việt và chỉ giải thích logic/lý do.

### V. Governance — MUST

1. **Risk policy theo delivery target:**
   - `Prototype`: cho phép breaking, không cần migration; vẫn CẤM leak secret.
   - `Staging`: REQUIRE migration khô + rollback dry-run + smoke test.
   - `Production`: REQUIRE full 10-layer verification + release manifest
     (theo `release-manifest-template.md`) + rollback plan đã diễn tập.
2. **Approval levels:** Low-risk (docs, typo, style token): 1 reviewer.
   Medium-risk (feature, schema non-breaking): 1 code owner + QA xanh.
   High-risk (auth, payment, schema breaking, infra): 2 approvers trong đó
   có human owner + audit log immutable.
3. **Audit log:** Mọi gate decision (`req_gate`, `arch_gate`, `test_gate`,
   release) MUST ghi rationale + inputs + timestamp, lưu trong
   `verification-report.md` / release manifest / flowchart progress.
4. **Constitution supremacy:** Constitution supersede mọi practice khác.
   Sửa đổi đòi documentation (diff + lý do), approval (human owner), và
   migration plan nếu ảnh hưởng spec/plan/tasks hiện có.

## 3. Kiến Trúc Chi Tiết Theo Layer — MUST

### 3.1. Domain

- Domain chứa business logic và business rule.
- Sử dụng Entity cho object có identity.
- Sử dụng Value Object cho object được xác định bởi value.
- Sử dụng Aggregate để xác định consistency boundary.
- Sử dụng Aggregate Root làm entry point duy nhất của Aggregate.
- Mọi thao tác với Entity con bên trong Aggregate MUST đi qua Aggregate Root.
- CẤM truy cập hoặc thay đổi trực tiếp Entity con từ bên ngoài Aggregate.
- Business invariant MUST được bảo vệ trong Aggregate.
- Chỉ tạo Domain Service khi business logic thực sự không thuộc về một
  Entity hoặc Aggregate cụ thể.
- CẤM đưa persistence logic, HTTP logic hoặc framework logic vào Domain.

### 3.2. Application

- Application chịu trách nhiệm Use Case và orchestration.
- Application KHÔNG chứa business rule thuộc Domain.
- Application sử dụng Domain để thực thi nghiệp vụ.
- Repository và external service MUST được truy cập thông qua Port/Interface khi cần.
- CẤM truy cập database trực tiếp từ Application nếu architecture yêu cầu
  repository boundary.

### 3.3. Infrastructure

- Infrastructure chịu trách nhiệm triển khai các adapter cần thiết.
- Repository implementation, external API client, database access, cache,
  message broker và các integration adapter nằm trong Infrastructure khi thực
  sự được sử dụng.
- Infrastructure KHÔNG chứa business logic.
- CẤM tạo adapter hoặc infrastructure component nếu feature không cần.

### 3.4. Presentation

- Controller chỉ xử lý HTTP/API concern.
- CẤM đặt business logic trong Controller.
- Request MUST được validate.
- Response MUST có contract rõ ràng.
- CẤM expose trực tiếp persistence entity nếu không phù hợp với API contract.

### 3.5. Mapper

- Mapper chịu trách nhiệm chuyển đổi giữa DTO, application model, domain model
  và persistence model khi cần.
- CẤM đặt business logic vào Mapper.
- CẤM tạo Mapper riêng nếu việc chuyển đổi đơn giản và không cần abstraction.

### 3.6. Exception

- Exception MUST được phân loại rõ ràng.
- Error response MUST thống nhất.
- Error code MUST rõ ràng.
- CẤM nuốt exception.
- CẤM xử lý lỗi mơ hồ.
- CẤM expose thông tin nhạy cảm trong error response.

### 3.7. Resource

- Resource dùng cho configuration, migration, template, static resource và các
  file runtime thực sự cần thiết.
- Database migration MUST sử dụng Flyway.

## 4. Cấu Trúc Module — MUST

- Phân biệt rõ presentation, application, domain, infrastructure, mapper,
  exception, resource.
- Trong từng business module quản lý các thành phần cần thiết như dto, mapper,
  service/usecase, controller, repository, model, config, exception.
- KHÔNG bắt buộc tạo tất cả folder. Chỉ tạo folder/class khi module thực sự cần.
- Ưu tiên tổ chức theo business module kết hợp architecture layer.
- CẤM tổ chức toàn bộ project chỉ theo loại class.

Cấu trúc tham chiếu:

```text
module/
├── presentation/
│   ├── controller/
│   └── dto/
├── application/
│   ├── usecase/
│   ├── service/
│   └── port/
├── domain/
│   ├── model/
│   ├── aggregate/
│   ├── valueobject/
│   ├── service/
│   └── repository/
├── infrastructure/
│   ├── persistence/
│   ├── client/
│   ├── messaging/
│   └── config/
├── mapper/
├── exception/
└── resource/
```

## 5. Cấu Hình Động — MUST

- Cấu hình động: sử dụng `.env`, `application.yml` hoặc `yaml` để quản lý các
  cấu hình có thể thay đổi của app. CẤM hard code, đặc biệt với: API, AI
  provider, AI model, port, database, timeout, retry, feature flag, secret.
- CẤM commit secret, API key, credential vào source code.
- Các cấu hình sau MUST configurable: API URL, AI provider, AI model, AI API key,
  port, database connection, timeout, retry policy, feature flag (khi có nhu cầu),
  environment.
- CẤM hard-code provider, model, port hoặc endpoint.
- Mọi configuration mới MUST được cập nhật tại config file, `.env.example`,
  configuration class và Docker/configuration liên quan nếu có.
- CẤM tạo configuration cho thành phần không được sử dụng.

## 6. Xác Thực — MUST

- Sử dụng SuperTokens self-hosted. CẤM phụ thuộc SuperTokens Cloud.
- Authentication MUST có boundary độc lập với business module.
- Business module CẤM phụ thuộc trực tiếp implementation nội bộ của authentication.

## 7. Công Nghệ, Nền Tảng Và DevOps Có Điều Kiện — MUST

1. **Nguyên tắc chọn công nghệ:**
   - Hệ thống chỉ sử dụng các công nghệ đã được lựa chọn cho project khi chúng
     thực sự cần thiết.
   - CẤM tự ý thêm công nghệ, framework, library, service hoặc infrastructure
     chỉ để làm hệ thống phức tạp hơn.
   - Ưu tiên sử dụng công nghệ hiện có trong project. Nếu yêu cầu mới có thể
     giải quyết bằng công nghệ hiện có thì bắt buộc ưu tiên công nghệ hiện có.
   - Chỉ sử dụng công nghệ mới khi công nghệ hiện có không thể đáp ứng yêu cầu
     hoặc gây hạn chế nghiêm trọng về correctness, security, performance,
     scalability hoặc maintainability.
   - Khi cần công nghệ mới, chỉ áp dụng trong phạm vi thực sự cần thiết.
   - Công nghệ mới MUST phù hợp architecture và không làm tăng coupling không cần thiết.
   - CẤM tạo container, service, adapter, configuration hoặc dependency nếu
     feature không cần.
2. **Công nghệ nền tảng:** Docker, PostgreSQL, SuperTokens self-hosted, Flyway.
   Các công nghệ khác được bổ sung theo nhu cầu thực tế của hệ thống.
3. **DevOps được thiết kế từ đầu nhưng chỉ triển khai những thành phần thực sự cần:**
   - Docker Compose dùng cho local/development khi phù hợp.
   - GitHub Actions dùng cho CI/CD khi project sử dụng GitHub Actions.
   - SonarQube/SonarCloud dùng khi cần static analysis và quality gate.
   - JaCoCo dùng để đo Java test coverage.
   - Trivy dùng khi cần container/image security scanning.
   - OWASP Dependency-Check hoặc công cụ tương đương dùng khi cần dependency
     security scanning.
   - Prometheus/Grafana dùng khi hệ thống cần metrics và monitoring.
   - OpenTelemetry dùng khi hệ thống cần distributed tracing.
   - Loki/ELK dùng khi hệ thống cần centralized logging.
   - Kafka dùng khi nghiệp vụ hoặc kiến trúc yêu cầu event/message-driven communication.
   - Redis dùng khi cần cache, session, rate limit, realtime state hoặc use case phù hợp.
   - Kubernetes dùng khi môi trường production hoặc quy mô hệ thống thực sự yêu
     cầu orchestration. Helm dùng khi Kubernetes được sử dụng.
   - Nginx hoặc API Gateway dùng khi kiến trúc yêu cầu reverse proxy, routing
     hoặc gateway.
   - KHÔNG bắt buộc triển khai toàn bộ các công nghệ DevOps trên.
   - CẤM tạo Kafka, Redis, Kubernetes, monitoring, tracing hoặc centralized
     logging nếu hệ thống chưa có nhu cầu thực tế.

## 8. CI/CD — MUST

- Pipeline MUST tự động hóa các bước phù hợp với project: build → test →
  coverage → quality check → security scan → package/image → deploy.
- Chỉ thêm bước pipeline khi project thực sự cần.
- Development, staging và production MUST có configuration riêng.
- CẤM hard-code environment trong pipeline.
- Infrastructure và deployment configuration MUST được quản lý bằng code khi phù hợp.
- Production deployment MUST có cơ chế kiểm soát, rollback hoặc recovery phù hợp.

## 9. API — MUST

- API MUST có version khi cần.
- Request/Response MUST có schema rõ ràng.
- Request MUST được validation.
- Error response MUST thống nhất.
- Authentication/Authorization MUST rõ ràng.
- API documentation MUST được cập nhật cùng code.
- CẤM expose persistence model trực tiếp nếu không phù hợp với API contract.

## 10. Tài Liệu — MUST

- Mọi tài liệu Markdown MUST viết bằng tiếng Việt.
- Mỗi module MUST có tài liệu về mục đích, business responsibility, architecture,
  folder structure, dependency, API, error code, configuration, database, migration,
  local development, Docker, test và deployment khi các thành phần đó được sử dụng.
- MUST có tài liệu hướng dẫn thêm configuration mới.
- MUST có tài liệu hướng dẫn chạy local.
- MUST có tài liệu hướng dẫn test.
- MUST có tài liệu hướng dẫn build và deploy khi project có deployment.
- Khi thay đổi code, API, database, configuration hoặc architecture MUST cập nhật
  documentation tương ứng.

## 11. Nguyên Tắc Mở Rộng Và Triển Khai — MUST

### 11.1. Nguyên tắc mở rộng

- Code MUST dễ mở rộng nhưng CẤM xây dựng extension point khi chưa có nhu cầu.
- Khi thêm AI provider/model mới, ưu tiên mở rộng thông qua abstraction hiện có
  thay vì sửa business logic.
- Khi thêm external service mới, sử dụng adapter/port phù hợp.
- Khi thêm database, cache, message broker hoặc infrastructure mới, chỉ bổ sung
  layer cần thiết cho phần sử dụng công nghệ đó.
- CẤM thay đổi architecture hiện tại nếu yêu cầu mới có thể giải quyết trong
  boundary hiện có.

### 11.2. Nguyên tắc triển khai

- Trước khi code MUST xác định rõ nghiệp vụ, boundary, dependency và flow.
- Luôn ưu tiên giải pháp đơn giản, đúng nghiệp vụ, production-ready và dễ test.
- CẤM tự ý thêm công nghệ hoặc abstraction khi chưa có lý do.
- CẤM tự ý phá vỡ architecture để triển khai nhanh.
- CẤM tự ý tạo thành phần không được sử dụng.
- Mọi thay đổi MUST đảm bảo không phá vỡ business invariant và module boundary.
- Hoàn thành feature chỉ khi code, test, configuration, documentation và quality
  gate liên quan đều đạt yêu cầu.

## 12. Security & Compliance Requirements (kế thừa v1.0.0, vẫn hiệu lực)

1. Secret quản lý bằng env/secret manager, KHÔNG commit `.env` chứa giá trị
   thật. Dependency/SBOM scan REQUIRE trước staging deploy.
2. Auth: password hashing hiện đại (argon2/bcrypt), session/token expiry +
   rotation; mọi endpoint nhạy cảm REQUIRE authZ check ở backend, không tin frontend.
3. Input validation ở boundary (DTO/schema), output encoding chống XSS; SQL phải
   qua parameterized query/ORM — CẤM string concat.
4. Logging KHÔNG ghi PII/secret; audit log cho hành động nhạy cảm là immutable
   và có retention policy rõ ràng trong `plan.md`.

## 13. Performance & Operability Standards (kế thừa v1.0.0, vẫn hiệu lực)

1. Budget mặc định: API p95 < 300ms (nội bộ), trang tương tác đầu < 2.5s LCP
   trên 4G-mid; bundle frontend có budget trong `plan.md`, vượt budget MUST có
   biện minh + tối ưu (code-split, lazy, cache).
2. Mọi feature có observability tối thiểu: structured log + metric + trace ID
   xuyên suốt request; error có `FAILURE_CLASS` để định tuyến fix đúng tầng
   (spec/plan/code/env).
3. Deployment: artifact bất biến (immutable), migration/rollback script versioned
   và dry-run được; health check + readiness probe REQUIRE cho mọi service.
4. Data: backup + restore được kiểm chứng định kỳ; destructive migration REQUIRE
   dual-write hoặc expand-migrate-contract khi ở Staging/Production.

## 14. Governance

Constitution là source of truth. Mọi PR/review MUST verify compliance với §2–§13;
complexity phải được biện minh; tham chiếu các template trong `.fullstack/` làm
runtime guidance.

- Thay đổi substantive REQUIRE version bump semver (xem footer) và cập nhật Sync
  Impact. Ratification date chỉ set khi tạo mới (v1.0.0), không update khi amend —
  chỉ update Last Amended.
- Human review REQUIRE trước khi commit mọi thay đổi constitution.
- Đánh giá impact lên cả 6 consumer gates khi amend: Requirement, Architecture,
  Design, Implementation, Verification, Release.

**Version**: 1.1.0 | **Ratified**: 2026-09-04 | **Last Amended**: 2026-09-04

## 15. Sync Impact

Phiên v1.1.0 là amend MINOR từ v1.0.0: bổ sung toàn bộ yêu cầu tuân thủ của User
(Microservices boundary, Clean/Hexagonal, Domain/Application/Infrastructure/
Presentation/Mapper/Exception/Resource, thứ tự triển khai, coverage >= 95%,
Craft Score >= 95, cấu hình động, SuperTokens self-hosted, công nghệ có điều kiện,
DevOps có điều kiện, CI/CD, API, tài liệu tiếng Việt, comment tiếng Việt, nguyên
tắc mở rộng/triển khai, No-Code Gate) vào Năm Trụ Cột và các section §3–§11.

- Thay đổi chính so với v1.0.0:
  - §1: làm rõ trọng tâm System/Nghiệp vụ và nền tảng Docker/PostgreSQL/
    SuperTokens/Flyway.
  - §2.I: thay stack-agnostic chung bằng Microservices + SOLID + Clean/Hexagonal
    + DI + cấm share code/DB/logic liên module + cấm Java interface liên service.
  - §2.II: thêm No-Code Gate và thứ tự triển khai 19 bước.
  - §2.III: nâng coverage toàn repo từ ≥ 80% lên >= 95%, thêm Craft Score >= 95,
    kỷ luật test chi tiết, quy tắc comment/tài liệu tiếng Việt.
  - §2.IV: thêm nghĩa vụ làm rõ nghiệp vụ khi mơ hồ, đầu ra tiếng Việt.
  - §3–§5 mới: chi tiết Domain/Application/Infrastructure/Presentation/Mapper/
    Exception/Resource, cấu trúc module tham chiếu, cấu hình động.
  - §6–§11 mới: SuperTokens self-hosted, công nghệ/DevOps/CI/CD có điều kiện,
    API, tài liệu, mở rộng/triển khai.
- Templates cần re-validate tuân thủ từ nay về sau:
  `.fullstack/spec-template.md`, `.fullstack/plan-template.md`,
  `.fullstack/design-template.md`, `.fullstack/tasks-template.md`,
  `.fullstack/checklist-template.md`, `.fullstack/requirement-model-template.md`,
  `.fullstack/verification-report-template.md`, `.fullstack/release-manifest-template.md`
- Commands/skills: `fullstack.requirement`, `fullstack.plan`, `fullstack.design`,
  `fullstack.tasks`, `fullstack.implement`, `fullstack.analyze` (verification),
  `fullstack.release`
- Scripts: `.fullstack/scripts/ps/create-new-feature.ps1`,
  `check-prerequisites.ps1`, `check-task-prerequisites.ps1`, `setup-plan.ps1`,
  `setup-tasks.ps1`, `implement-tasks.ps1`, `resolve-template.ps1`,
  `improve-design.ps1`, `common.ps1`
- Flowchart: `business_1_fullstack_sdd` — node `constitution` được đánh dấu hoàn
  thành khi human phê duyệt file này.
