# Authentication Service — AgentCloud

Dịch vụ **xác thực & phân quyền** tập trung cho hệ sinh thái `agent-cloud`, xây trên **NestJS 12 + TypeORM**. Thiết kế theo hướng **Unified Identity**: một người dùng là **một `UserEntity` duy nhất**, mọi phương thức đăng nhập (mật khẩu, OTP, Magic Link, Google, GitHub, Passkey) đều là một `UserIdentity` trỏ về cùng user đó.

## Mục lục
- [Tính năng](#tính-năng)
- [Tech stack](#tech-stack)
- [Chạy nhanh (Quickstart)](#chạy-nhanh-quickstart)
- [Cấu trúc thư mục](#cấu-thư-mục)
- [Scripts](#scripts)
- [Biến môi trường](#biến-môi-trường)
- [Tài liệu liên quan](#tài-liệu-liên-quan)

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| Phương thức đăng nhập/đăng ký | Mật khẩu (Argon2id/Bcrypt), Email OTP, Phone OTP, Magic Link, **Email Verification**, **OAuth 2.0 Google & GitHub**, **MFA/TOTP + Recovery Codes**, **Passkey (WebAuthn/FIDO2)** |
| Phiên & Token | JWT access ngắn hạn; Refresh Token **Rotation** + **Reuse Detection**; quản lý Session + Device tracking; thu hồi phiên |
| Phân quyền | **RBAC** (roles) + **PBAC** (permissions nguyên tử); guard `@RequireRoles`/`@RequirePermissions`; SUPER_ADMIN bypass |
| Bảo mật | Khóa tài khoản sau 5 lần sai; Rate limiting `@nestjs/throttler`; mã hóa at-rest (AES-256-GCM) & hash (SHA-256); audit log; `helmet`, CORS allowlist, `trust proxy`, TLS verify mặc định, health check, graceful shutdown, chống open-redirect |
| Đa hình (Strategy/DI) | DB Postgres/MySQL, Hasher Argon2/Bcrypt, Mail Console/SMTP, OTP Numeric/MagicLink — đổi qua env, không sửa code |
| Hạ tầng | **Port auto-increment** khi `EADDRINUSE`; **Redis tùy chọn** qua `ON_REDIS`; Swagger; API Versioning `/api/v1`, `/api/v2`; `GET /api/v1/health` (Terminus) |
| Kiểm thử | 81 unit/integration + 38 E2E (HTTP + PostgreSQL thật) + smoke live (`scripts/`) + xác minh trong Docker |

## Tech stack
NestJS 12 · TypeORM · PostgreSQL/MySQL · `@nestjs/jwt` + Passport · Argon2/Bcrypt · `@nestjs/swagger` · `@nestjs/throttler` · `@nestjs/terminus` (health) · `helmet` · `otplib` (TOTP) · `@simplewebauthn/server` (WebAuthn) · `ioredis` (tùy chọn) · Joi (validate env) · Vitest + Supertest.

## Chạy nhanh (Quickstart)

### A. Trên host (dev, hot-reload)
```bash
cp .env.example .env      # điền các biến BẮT BUỘC: DB_*, JWT_SECRET, CLIENT_URL, PORT (compose cần thêm IMAGE_TAG, AUTH_HOST_PORT, DB_HOST_PORT...)
npm install
npm run start:dev         # http://localhost:3001/api ; Swagger: http://localhost:3001/docs
```
> Nếu cổng `3001` bị chiếm, server **tự động tăng** sang cổng trống (`PORT_AUTO_INCREMENT=true`). Log sẽ báo cổng thực tế đã bind.

### B. Docker (Postgres + service, không Redis)
```bash
docker compose up -d          # postgres (5432) + auth-service (host 3001)
# Neeu 3001 bi service khac chiem, chon cong host khac:
AUTH_HOST_PORT=3098 docker compose up -d
```

### C. Docker kèm Redis (scale ngang)
```bash
ON_REDIS=true docker compose --profile redis up -d
```
Chi tiết chạy/triển khai: [DEPLOYMENT.md](./DEPLOYMENT.md).

### Smoke test
```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{ "email": "demo@example.com", "password": "StrongPassword123@", "userName": "Demo" }'

curl -X GET http://localhost:3001/api/v1/auth/methods
curl -X GET http://localhost:3001/api/v1/health   # {"status":"ok"} - health check (Terminus)
```

## Cấu trúc thư mục
```
authentication/
├─ src/
│  ├─ app.module.ts / app-config.ts   # root + configureApp()/setupSwagger() (tái dùng cho main.ts + E2E)
│  ├─ main.ts                         # bootstrap + listenWithPortFallback
│  ├─ config/                         # ConfigModule, DatabaseModule (đa hình), IdentityModule, validation
│  ├─ common/                         # constants, decorators, guards, filters, utils (AesGcmCipher, port)
│  ├─ core/                           # abstracts (Base*), interfaces (contracts), tokens (DI symbols)
│  ├─ entities/                       # 21 bảng TypeORM
│  ├─ repositories/                   # 15 repository + token map
│  └─ modules/
│     ├─ auth/                        # AuthService + controllers V1/V2 + DTO
│     ├─ hashing/ token/ rbac/        # Strategy đa hình
│     ├─ notification/ verification/  # Mail + OTP/MagicLink/EmailVerify
│     ├─ oauth/                       # Google/GitHub strategy + guard + OAuthService
│     ├─ mfa/                         # MfaService (TOTP) + PasskeyService (WebAuthn)
│     └─ redis/                       # RedisModule: KeyValueStore (in-memory/Redis) + RedisThrottlerStorage
├─ test/                              # 16 file unit/integration (*.spec.ts)
│  └─ e2e/                            # 5 file E2E (*.e2e-spec.ts) + harness
├─ config.yaml / .env.example         # cấu hình
├─ Dockerfile / docker-compose.yml    # image multi-stage + stack postgres/auth/redis(profile)
└─ API_GUIDE.md / ARCHITECTURE.md     # đặc tả API + kiến trúc
```

## Scripts
| Lệnh | Tác dụng |
|---|---|
| `npm run start:dev` | Chạy dev hot-reload |
| `npm run build` | Biên dịch `nest build` → `dist/` |
| `npm run lint` | `oxlint --type-aware` |
| `npm run test` | Unit/Integration (mock, **không cần DB**) — 81 tests |
| `npm run test:e2e` | E2E HTTP + PostgreSQL **thật** — 38 tests (cần DB) |
| `npm run test:e2e:db:up` / `:db:down` | Bật/tắt Postgres cho E2E |
| `npm run smoke` | Script thao tác thật vào service đang chạy (`scripts/live-smoke.mjs`) |
| `node scripts/live_auth_methods.mjs` | Smoke live OTP/SMS/Magic/GitHub/Passkey (cần `MAIL_STRATEGY=console`) |
| `npm run test:cov` | Coverage |

## Biến môi trường
Bản đầy đủ + chú thích: [API_GUIDE.md §8](./API_GUIDE.md) và [DEPLOYMENT.md](./DEPLOYMENT.md). Nhóm chính: `PORT`/`PORT_AUTO_INCREMENT`, **`CLIENT_URL` (bắt buộc)**, `DB_*`, `JWT_*`, `HASH_*`, `AUTH_ENABLED_METHODS`, `MAIL_*`/`SMTP_*`, `GOOGLE_*`/`GITHUB_*`, `MFA_*`, `WEBAUTHN_*`, `THROTTLE_*`, `ON_REDIS`/`REDIS_*`. Nhóm cứng hóa bảo mật/vận hành: `TRUST_PROXY`, `CORS_ORIGIN`, `OAUTH_STATE`, `SMTP_TLS_INSECURE`, `DB_SSL_REJECT_UNAUTHORIZED`, `*_TIMEOUT_MS`, `IMAGE_TAG`.

## Tài liệu liên quan
- [API_GUIDE.md](./API_GUIDE.md) — đặc tả endpoint, request/response, tích hợp client, troubleshooting.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — kiến trúc tầng, ER 21 bảng, luồng, ADR, từ điển dữ liệu.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — triển khai Docker, môi trường, runbook.
- [TESTING.md](./TESTING.md) — unit / E2E / kiểm chứng Docker, coverage.
- [SECURITY.md](./SECURITY.md) — mô hình đe dọa, quản lý secret, checklist production.
- [TEST_REPORT_LIVE.md](./TEST_REPORT_LIVE.md) — báo cáo kiểm thử thực tế (live) các phương thức xác thực.

> ⚠️ Bảo mật: `gg-provider.json` từng chứa **client_secret Google thật** và đã nằm trong **git history đã push** → đã được `.gitignore` + untrack, nhưng **cần rotate** secret. Xem Runbook trong [SECURITY.md](./SECURITY.md).
