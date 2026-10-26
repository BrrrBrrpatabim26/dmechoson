# Auth Request/Response + Kafka/RabbitMQ — Spring Boot + MySQL ULID + JWT

> Stack chốt: **Java Spring Boot 3.2 / MySQL 8 + ULID / REST /api/v1 + JWT Bearer / Kafka event-log + RabbitMQ jobs**. Code: `backend-auth/`. Contract máy đọc: `.fullstack/specs/main/api-contract.json` (OpenAPI) + `asyncapi.json` (AsyncAPI).

## 1. Quy ước chung

**Envelope thành công:**
```json
{ "code": "USER_REGISTERED", "message": "...", "data": { }, "traceId": "t-123", "timestamp": "2026-10-06T15:00:00Z" }
```

**Envelope lỗi (400/401/403/404/409/422/500):**
```json
{ "code": "BAD_REQUEST", "message": "...", "errors": [{ "field": "email", "message": "must be email", "code": "INVALID" }], "traceId": "t-123", "timestamp": "...", "path": "/api/v1/auth/register" }
```

| Mã | Ý nghĩa | Khi nào |
|----|---------|---------|
| 200 | OK | Verify, Login, Reset |
| 201 | Created | Register |
| 202 | Accepted | Forgot-password (luôn 202 chống enumeration) |
| 400 | Bad Request + `errors[]` | Bean Validation fail |
| 401 | Unauthorized | Sai pass, refresh hết hạn |
| 403 | Forbidden | `USER_LOCKED` (5 sai → khóa 15p) |
| 404 | Not Found | User/token không tồn tại |
| 409 | Conflict | Email trùng |
| 410 | Gone | Verify/reset token hết hạn |
| 422 | Unprocessable | `USER_NOT_VERIFIED`, vi phạm domain |
| 500 | Internal | Ngoài tầm kiểm soát |

Header: `X-Trace-Id` (optional, server tự sinh) → lan qua log + Kafka header + RabbitMQ header. Auth: `Authorization: Bearer <accessToken>` (trừ register/login/refresh/forgot/reset).

## 2. Request/Response chi tiết (5 flows)

### 2.1 POST /api/v1/auth/register → 201
**Request:**
| Field | Type | Ràng buộc | Ghi chú |
|-------|------|-----------|---------|
| email | string(email) ≤255 | required, normalize lowercase | unique |
| password | string 8..72 | required, regex `(?=.*[A-Z])(?=.*[a-z])(?=.*\d)` | BCrypt hash |
| fullName | string 1..100 | required, trim | |
| clientIp | string ≤45 | optional | audit |

```json
{ "email": "an@example.com", "password": "Secret123", "fullName": "An Nguyen", "clientIp": "1.2.3.4" }
```

**Response 201 `USER_REGISTERED`:**
```json
{
  "code": "USER_REGISTERED",
  "message": "Đăng ký thành công, vui lòng kiểm tra email xác thực",
  "data": {
    "user": { "id": "01J9Z8KX7Q2M5N6P8R0T1V3W5Y", "email": "an@example.com", "fullName": "An Nguyen", "status": "PENDING", "emailVerifiedAt": null, "createdAt": "2026-10-06T15:00:00Z" },
    "verificationEmailQueued": true
  },
  "traceId": "t-123", "timestamp": "2026-10-06T15:00:00Z"
}
```
**Side-effect:** JPA transaction `users + verify_tokens` → Kafka `user.registered` (key=userId) → RabbitMQ `user.mail.send {template:verify-email}` + `user.audit.log {action:USER_REGISTER}`.

### 2.2 POST /api/v1/auth/verify-email → 200
```json
{ "token": "opaque-64chars" }
```
→ 200 `USER_VERIFIED`. Hết hạn (24h) → 410, đã verify → 422 `USER_ALREADY_VERIFIED`. Side-effect: Kafka `user.verified`.

### 2.3 POST /api/v1/auth/login → 200
```json
{ "email": "an@example.com", "password": "Secret123", "clientIp": "1.2.3.4", "userAgent": "Mozilla/5.0" }
```
**Response 200 `AUTH_OK`:**
```json
{
  "code": "AUTH_OK", "message": "Đăng nhập thành công",
  "data": { "accessToken": "eyJ...", "refreshToken": "opaque", "tokenType": "Bearer", "expiresIn": 900, "user": { "id": "...", "email": "an@example.com", "fullName": "An Nguyen", "status": "ACTIVE" } },
  "traceId": "t-123", "timestamp": "..."
}
```
Sai pass → 401 `AUTH_BAD_CREDENTIALS` + tăng `failedAttempts`; 5 lần → 403 `USER_LOCKED` 15p; chưa verify → 422. Mỗi fail → Kafka `user.login_failed`.

### 2.4 POST /api/v1/auth/refresh → 200
```json
{ "refreshToken": "opaque" }
```
→ rotate: revoke cũ, cấp cặp mới `{accessToken, refreshToken, expiresIn:900}`. Hết hạn/reuse → 401.

### 2.5 POST /api/v1/auth/forgot-password → 202 + POST /reset-password → 200
```json
// forgot
{ "email": "an@example.com" }
// reset
{ "token": "opaque-64chars", "newPassword": "NewSecret123" }
```
Forgot luôn 202 `RESET_QUEUED` (tồn tại → RabbitMQ mail `reset-password`, TTL 30p). Reset → 200 `PASSWORD_RESET`, đồng thời revoke refresh cũ.

## 3. Kafka — Domain Events (event log, streaming)

| Topic | Key | Partitions / Retention | Producer | Consumers |
|-------|-----|------------------------|----------|-----------|
| `user.registered` | `userId` (giữ order/user) | 6 / 7 ngày, `acks=all`, idempotent, `lz4` | `KafkaEventPublisher` sau commit | `notification-service` (gửi mail), `audit-service` |
| `user.verified` | `userId` | 6 / 7 ngày | sau `verify()` | `notification-service` (welcome), `audit-service` |
| `user.login_failed` | `userId‖email` | 6 / 3 ngày | sau `recordLoginFailure()` | `risk-service` (khóa IP), `audit-service` |

Payload mẫu `user.registered v1`:
```json
{ "eventId": "e-111", "eventType": "user.registered", "version": 1, "occurredAt": "2026-10-06T15:00:00Z", "userId": "01J9Z8KX7Q2M5N6P8R0T1V3W5Y", "email": "an@example.com", "fullName": "An Nguyen", "traceId": "t-123" }
```
Consumer: `ack-mode=manual_immediate`, `concurrency=3`, dedup theo `eventId`, lỗi → seek-to-current retry, quá ngưỡng → DLQ topic.

**Khi nào dùng Kafka (không dùng Rabbit):** audit trail, notify nhiều service, replay, phân tích risk.

## 4. RabbitMQ — Jobs (task queue, command)

Exchange `user.direct` (durable, direct):

| Queue | Routing-key | Concurrency | Payload → Consumer |
|-------|-------------|-------------|--------------------|
| `user.mail.queue` | `user.mail.send` | 2 | `SendMailJob{messageId,to,template:verify-email‖welcome‖reset-password,vars,traceId,retryCount}` → SendGrid/SES |
| `user.sms.queue` | `user.sms.send` | 2 | `SendSmsJob{messageId,phone,text≤160,traceId,retryCount}` → Twilio |
| `user.audit.queue` | `user.audit.log` | 1 | `AuditJob{messageId,action,userId,detail,ip,traceId}` → audit append-only |
| `user.dlq` | `user.dlq` (via DLX) | manual | Pois messages, alert + replay tay |

Retry: `max-attempts=3`, backoff `5s→15s→60s` (`multiplier 3.0`), `x-message-ttl=300000`, `acknowledge-mode=manual`. `messageId` UUID để dedup.

**Khi nào dùng Rabbit (không dùng Kafka):** gửi mail/SMS cần ACK từng job, routing linh hoạt, TTL/delay, DLQ nhanh.

## 5. Luồng tổng hợp (ví dụ Register)

```text
Client → POST /api/v1/auth/register
  → AuthController (validate) → RegisterUseCase
  → MySQL TX: INSERT users + verify_tokens
  → Kafka: user.registered (key=userId, header traceId)
  → RabbitMQ: user.direct [user.mail.send + user.audit.log]
  → 201 USER_REGISTERED
Kafka user.registered → notification-service → (idempotent eventId) → RabbitMQ mail
RabbitMQ mail consumer → SendGrid → ack manual; lỗi 3x → user.dlq
```

## 6. DDL MySQL (Flyway V1) + JWT

`users(id CHAR(26) PK ULID, email UNIQUE, password_hash, full_name, status PENDING/ACTIVE/LOCKED, email_verified_at, failed_attempts, lock_until, created_at, updated_at)` + `verify_tokens / refresh_tokens / password_reset_tokens / outbox`. Index: `ux_users_email`, `ix_users_status`.

JWT: access 15p, refresh 7d (rotate + revoke reuse), secret 256-bit qua `JWT_SECRET`. BCrypt cost 12.

## 7. Test nhanh (timeout 10s)

```bash
docker compose -f backend-auth/docker-compose.yml up -d
# register
curl -X POST http://localhost:8080/api/v1/auth/register \
 -H "Content-Type: application/json" -H "X-Trace-Id: t-123" \
 -d '{"email":"an@example.com","password":"Secret123","fullName":"An Nguyen"}' --max-time 10
# login
curl -X POST http://localhost:8080/api/v1/auth/login \
 -H "Content-Type: application/json" \
 -d '{"email":"an@example.com","password":"Secret123"}' --max-time 10
```

## 8. File map

| File | Vai trò |
|------|---------|
| `backend-auth/pom.xml` | Spring Boot 3.2, Kafka, AMQP, JWT, Flyway, OpenAPI |
| `backend-auth/src/main/resources/application.yml` | DB/Kafka/Rabbit/JWT/timeout |
| `.../domain/User.java` | Aggregate + events + invariants |
| `.../application/dto/AuthRequests.java`, `AuthResponses.java` | Request/Response contracts |
| `.../application/usecase/AuthUseCases.java` | 5 use cases SRP |
| `.../application/port/UserRepository.java`, `EventPublisher.java`, `JobSender.java` | Ports |
| `.../infrastructure/persistence/UserEntity.java`, `db/migration/V1__users.sql` | MySQL ULID |
| `.../infrastructure/messaging/kafka/KafkaConfig.java`, `UserEventConsumers.java` | Topics + consumers |
| `.../infrastructure/messaging/rabbit/RabbitConfig.java` | Exchange/queues/DLQ + publishers |
| `.../presentation/rest/v1/AuthController.java`, `GlobalExceptionHandler.java` | REST + mã lỗi chuẩn |
| `.fullstack/specs/main/api-contract.json` | OpenAPI cho Frontend |
| `.fullstack/specs/main/asyncapi.json` | AsyncAPI cho consumer teams |
