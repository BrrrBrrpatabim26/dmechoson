# Kiểm thử — Authentication Service

Tài liệu kiểm thử: 3 tầng (Unit/Integration mock · E2E HTTP + PostgreSQL thật · xác minh thủ công trong Docker), cách chạy, cách viết test mới, CI.

## Mục lục
- [Tổng quan 3 tầng](#tổng-quan-3-tầng)
- [Unit / Integration](#unit--integration)
- [E2E (HTTP + DB thật)](#e2e-http--db-thật)
- [Cài DB cho E2E](#cài-db-cho-e2e)
- [Vì sao chạy NỐI TIẾP](#vì-sao-chạy-nối-tiếp)
- [3 boundary được stub](#3-boundary-được-stub)
- [Kiểm chứng Redis & Port auto-increment](#kiểm-chứng-redis--port-auto-increment)
- [Ma trận phủ sóng](#ma-trận-phủ-sóng)
- [Viết test mới](#viết-test-mới)
- [CI](#ci)

## Tổng quan 3 tầng
| Tầng | Lệnh | Phụ thuộc | Số test | Phạm vi |
|---|---|---|---|---|
| Unit/Integration (mock) | `npm run test` | Không cần DB | **81** (16 files) | Service/repo/hash/token/RBAC/OAuth/MFA/port, logic nội bộ |
| E2E (HTTP + PostgreSQL) | `npm run test:e2e` | Cần Postgres (5432) | **38** (5 files) | Endpoint thật qua Supertest + DB Postgres thật |
| Xác minh Docker | thủ công (xem [DEPLOYMENT.md](./DEPLOYMENT.md)) | Docker | — | Image prod chạy, cổng, Redis, auto-increment |

## Smoke script (thao tác thật)

`scripts/live-smoke.mjs` (npm: `npm run smoke`) **gọi HTTP thật** tới một auth-service **đang chạy** và in bảng PASS/FAIL/WARN; thoát code 1 nếu có FAIL.

```bash
npm run smoke
# Chi dinh dich + tuy chon bo kiem chung Redis/DB:
BASE_URL=http://localhost:3001/api/v1 DOCKER_PROOF=0 npm run smoke
```
Lop coverage thao tác: signup → signin → `/me` → `/admin` 403 → **refresh rotation + reuse detection** (`AUTH_TOKEN_REUSED`) → đổi mk (sai/trùng/đúng) → `/sessions` → signout + refresh thất bại → V2 `security-capabilities`; cộng bằng chứng **Redis** (`rbac:access:*` khi `ON_REDIS=true`) và **Postgres** (số dòng `users`). Khống chế phụ thuộc: `execFileSync` argv (không qua shell), bỏ qua bước docker nếu `DOCKER_PROOF=0`.

### Smoke cho các phương thức còn lại (OTP/SMS/Magic/GitHub/Passkey)
`scripts/live_auth_methods.mjs` kiểm tra **thật** `email_otp`, `phone_otp`, `magic_link`, `github`, `passkey(options)` + `GET /api/v1/health`.
```powershell
# BẮT BUỘC chạy với console mail để script trích được mã OTP/token từ docker logs:
$env:MAIL_STRATEGY="console"; docker compose up -d --force-recreate auth-service
node scripts/live_auth_methods.mjs
Remove-Item Env:MAIL_STRATEGY; docker compose up -d --force-recreate auth-service   # revert smtp
```
> **Giới hạn headless:** `passkey verify` cần authenticator vật lý; `google`/`github` trọn vòng cần browser consent / creds. Google cần khai báo **Authorized redirect URI** = `http://localhost:3001/api/v1/auth/google/callback` (khớp `GOOGLE_CALLBACK_URL`) — thiếu thì Google trả `redirect_uri_mismatch`.
> Kết quả chi tiết: [TEST_REPORT_LIVE.md](./TEST_REPORT_LIVE.md).


## Unit / Integration
- Vị trí: `test/*.spec.ts`; config `vitest.config.ts` (include `**/*.spec.ts`).
- Chiến lược: khởi tạo service **trực tiếp** với repository mock (`vi.fn().mockResolvedValue(...)`), **không** boot Nest/DB → nhanh, deterministic.
- Đại diện: `password-hasher`, `token-service`, `security`, `rbac-cache` (dùng `InMemoryKeyValueStore`), `redis-infra` (store + `RedisThrottlerStorage` + resolver `ON_REDIS`), `oauth-callback`, `google-oauth-provider` (nạp `gg-provider.json`), `totp-mfa`, `email-verification`, `multi-method-auth`, `port-fallback`, `performance`.

```bash
npm run test
npm run test -- test/rbac-cache.spec.ts      # 1 file
npm run test:watch                            # watch
npm run test:cov                              # coverage
```

## E2E (HTTP + DB thật)
- Vị trí: `test/e2e/*.e2e-spec.ts`; config `vitest.config.e2e.ts` (include `**/*.e2e-spec.ts`, `fileParallelism: false`, `testTimeout: 30s`).
- Harness `test/e2e/e2e-harness.ts`:
  - Set env mặc định (`DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_DATABASE=authentication_e2e`, `DB_SYNCHRONIZE=true`, `AUTH_ENABLED_METHODS=*`, `ON_REDIS` **không** đặt → in-memory), và **`??=`** (env thật được phép ghi đè).
  - `probeDatabase()` (TCP) → `DB_AVAILABLE`; mỗi file dùng `describe.skipIf(!DB_AVAILABLE)` → **tự skip toàn bộ khi thiếu DB** (không fail CI).
  - `createE2EApp(mutate?)`: boot Nest app **thật** (dynamic import `AppModule` **sau** khi set env) + `configureApp(app, config)` (dùng lại `src/app-config.ts` → cùng pipeline route/versioning/validate/filter như prod). Override provider `MAIL_SENDER` = `MailCapture`; override `ThrottlerStorage` = Noop (tránh 429).
  - `resetDb()` `TRUNCATE` **21 bảng** `RESTART IDENTITY CASCADE` trước mỗi test → cách ly tuyệt đối.

## Cài DB cho E2E
```bash
npm run test:e2e:db:up      # docker compose up -d postgres  (auth-postgres, host 5432)

# Tạo DB e2e + extension (volume compose có thể chưa có database này):
docker exec auth-postgres psql -U postgres -c "CREATE DATABASE authentication_e2e;"
docker exec auth-postgres psql -U postgres -d authentication_e2e -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pgcrypto";'

npm run test:e2e
```
> Không để lọt `DB_*` cũ trong shell (nó ghi đè mặc định harness qua `??=`). Nếu E2E bị `skip`, thường do shell còn `DB_PASSWORD`/`DB_DATABASE` sai → `Remove-Item Env:DB_*` rồi chạy lại.

## Vì sao chạy NỐI TIẾP
Toàn bộ E2E **dùng chung 1 Postgres** và `TRUNCATE` bảng giữa các test. Nếu các file chạy song song, file này TRUNCATE trong lúc file kia đang ghi → race. Vì vậy `vitest.config.e2e.ts` đặt `fileParallelism: false`.

## 3 boundary được stub
Stub **chỉ ở ranh giới** không thể gọi thật trong test tự động; HTTP + service + repository + DB vẫn thật.

| Boundary | Cách stub | Lý do bắt buộc |
|---|---|---|
| Mail sender | `MailCapture` (override `MAIL_SENDER`) bắt OTP/link raw trong `subject`/`text`/`html` | DB chỉ lưu **SHA-256** của OTP/token → không suy ra được mã thật để verify |
| WebAuthn verify | `vi.mock('@simplewebauthn/server')` chỉ thay `verifyRegistrationResponse`/`verifyAuthenticationResponse`; `generate*` vẫn thật | Cần authenticator vật lý, không chạy headless |
| OAuth provider | E2E override guard `GoogleOAuthGuard`/`GitHubOAuthGuard` tiêm `req.user` (profile đã normalize) | Không hoàn tất round-trip Google/GitHub thật được |

## Kiểm chứng Redis & Port auto-increment
```bash
# Redis qua E2E: bật ON_REDIS trỏ Redis local (6379)
$env:ON_REDIS='true'; $env:REDIS_HOST='localhost'; $env:REDIS_PORT='6379'
npm run test:e2e            # 38 pass; WebAuthn challenge ghi Redis
docker exec <redis> redis-cli --scan --pattern 'webauthn:challenge:*'   # co key that
Remove-Item Env:ON_REDIS,Env:REDIS_HOST,Env:REDIS_PORT

# Port auto-increment trong Docker: chay lenh thu 2 trong container (3001 bi PID1 chiem)
docker exec auth-service sh -c "node dist/main.js > /tmp/p2.log 2>&1 & P=\$!; sleep 7; grep -aE '3001|3002' /tmp/p2.log | tail; kill \$P"
# -> WARN 'Cổng 3001 đang bị chiếm. Tự động chuyển sang cổng 3002' + 'lắng nghe ... :3002'
```

## Ma trận phủ sóng
| Phương thức | Unit | E2E (HTTP+DB) | Ghi chú |
|---|:---:|:---:|---|
| Password signup/signin/lock | `security`,`multi-method-auth` | `auth-password` | refresh rotation + reuse detection |
| Email OTP / Phone OTP | `otp-verification` | `otp-magiclink` | verify + max-attempts (mail capture OTP) |
| Magic Link | `otp-verification` | `otp-magiclink` | verify + chống replay |
| Email Verification | `email-verification` | `email-verification-mfa` | verify + chống replay |
| OAuth Google/GitHub | `oauth-callback`,`google-oauth-provider` | `oauth` | redirect 302 (creds thật từ `gg-provider.json`) + callback→DB |
| MFA/TOTP + recovery | `totp-mfa` | `email-verification-mfa` | enroll/verify/recovery + V2 capabilities |
| Passkey WebAuthn | (boundary mock ở e2e) | `passkey` | register/authenticate + challenge single-use |
| RBAC cache | `rbac-cache`,`redis-infra` | (qua `/me`) | in-memory + Redis resolver |
| Port auto-increment | `port-fallback` | (thủ công/Docker) | 5 kịch bản + chứng minh trong container |
| Rate limiting | (vô hiệu trong e2e) | — | xác minh thủ công qua header/429 |

## Viết test mới
- **Unit mock**: tạo service trực tiếp, truyền repo mock theo đúng thứ tự constructor; assert bằng `toHaveBeenCalledWith` + trạng thái trả về.
- **E2E**: `import { createE2EApp, resetDb, DB_AVAILABLE, ... } from './e2e-harness.js'`; `const describeDb = DB_AVAILABLE ? describe : describe.skip;`; `beforeAll` tạo app, `beforeEach` `resetDb`, `afterAll` `app.close()`; gọi `ctx.http().post('/api/v1/auth/...')`.
- Đặt tên file `test/e2e/<feature>.e2e-spec.ts` để được `test:e2e` quét.

## CI
- Mỗi push/PR: chạy `npm run lint` + `npm run build` + `npm run test` (unit, không cần DB) → chắn chắn refactor/DI còn đúng.
- Khi có dịch vụ DB: thêm job `npm run test:e2e` (provision Postgres `authentication_e2e`, `DB_SYNCHRONIZE=true`). Thiếu DB suite sẽ **tự skip** (không đỏ).
- Optional: job smoke `docker compose up` rồi probe `/api/v1/auth/methods`.
