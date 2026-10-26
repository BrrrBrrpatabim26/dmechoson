# AGENTS.md — Auth Backend (Spring Boot + MySQL ULID + Kafka/RabbitMQ)

> Sản phẩm: User/Auth + Verify. Stack: Java Spring Boot 3.2, MySQL 8 ULID, REST `/api/v1/auth` + JWT, Kafka event-log + RabbitMQ jobs.

## 1. Cấu trúc

| Đường dẫn | Vai trò |
|-----------|---------|
| `backend-auth/src/main/java/com/example/auth/domain/` | Aggregate `User.java`, `DomainException.java` — cấm import Spring/JPA |
| `backend-auth/src/main/java/com/example/auth/application/` | `dto/AuthRequests.java`, `dto/AuthResponses.java`, `usecase/AuthUseCases.java`, `port/` |
| `backend-auth/src/main/java/com/example/auth/infrastructure/` | `persistence/UserEntity.java`, `messaging/kafka/`, `messaging/rabbit/` |
| `backend-auth/src/main/java/com/example/auth/presentation/rest/v1/` | `AuthController.java`, `GlobalExceptionHandler.java` |
| `backend-auth/src/main/resources/` | `application.yml`, `db/migration/V1__users.sql` |
| `.fullstack/specs/main/api-contract.json` | OpenAPI 3.1 — luật cho Frontend |
| `.fullstack/specs/main/asyncapi.json` | AsyncAPI 2.6 — luật cho consumers |
| `docs/AUTH_REQUEST_RESPONSE.md` | Doc người đọc (bảng req/res + flows) |
| `.opencode/agents/` | Agents chuyên trách (xem §3) |

## 2. Quy ước bắt buộc

- Envelope: `{code,message,data,traceId,timestamp}`; lỗi `{code,message,errors[],traceId,path}`. Mã: 201 register, 200 verify/login, 202 forgot, 400 validation, 401 sai pass, 403 locked, 404 not found, 409 email trùng, 410 token hết hạn, 422 chưa verify, 500 internal.
- `X-Trace-Id` xuyên REST → Kafka header → Rabbit header → log (`timestamp,trace_id,user_id,action,duration_ms`).
- ULID CHAR(26), email lowercase unique, BCrypt cost 12, JWT access 15m / refresh 7d rotate, 5 login sai → lock 15p.
- Kafka = broadcast/replay (`user.registered/verified/login_failed`, key=userId, manual ack). Rabbit = task ACK/TTL/DLQ (`user.direct`, `user.mail/sms/audit.queue` + `user.dlq`, retry 3x).
- Đổi REST → sync `api-contract.json`. Đổi event/job → sync `asyncapi.json`. Cả hai → sync `docs/AUTH_REQUEST_RESPONSE.md`.

## 3. Agents (`.opencode/agents/`, gọi bằng `@tên` hoặc Task tool)

| Agent | Mode | Dùng khi |
|-------|------|----------|
| `@auth-lead` | primary | Điều phối: chia việc, gọi song song, bắt review trước khi xong |
| `@auth-backend` | subagent | Code DDD/REST/JPA/JWT |
| `@auth-messaging` | subagent | Topics/queues/payloads/DLQ |
| `@auth-reviewer` | subagent (read-only) | Review blocker trước merge |

Luồng chuẩn: `@auth-lead` → Task(`auth-backend` + `auth-messaging` song song) → Task(`auth-reviewer`) → tổng hợp.

## 4. Lệnh verify nhanh

```powershell
# JSON contracts
python -c "import json;json.load(open('.fullstack/specs/main/api-contract.json',encoding='utf-8'));json.load(open('.fullstack/specs/main/asyncapi.json',encoding='utf-8'));print('contracts OK')"
# Domain compile (không cần Maven)
javac -d $env:TEMP/opencode/auth-verify/out backend-auth/src/main/java/com/example/auth/domain/User.java backend-auth/src/main/java/com/example/auth/domain/DomainException.java
# Local infra + curl (cần Docker)
docker compose -f backend-auth/docker-compose.yml up -d
curl -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"an@example.com","password":"Secret123","fullName":"An Nguyen"}' --max-time 10
```

## 5. Không làm

- Không đổi tên topic/queue/routing-key/eventType nếu chưa sync `asyncapi.json`.
- Không đổi field DTO/endpoint nếu chưa sync `api-contract.json`.
- Không để domain import Spring/JPA. Không bịa kết quả test — phải chạy lệnh thật.
