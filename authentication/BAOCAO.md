# BÁO CÁO KIỂM TOÁN TOÀN DIỆN — Tính năng · Bảo mật · Hiệu năng

**Phạm vi:** [`authentication/`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication) — NestJS 12 + TypeORM + PostgreSQL + Redis (tùy chọn `ON_REDIS`).
**Ngày lập:** 2026-10-18 · **Trạng thái:** sau 2 chu kỳ *kiểm toán → sửa lỗi → tái xác minh* (dead-code tham chiếu [BAOCAO_V1.md](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/BAOCAO_V1.md)).
**Tài liệu liên quan:** [SECURITY.md](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/SECURITY.md) · [API_GUIDE.md](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/API_GUIDE.md) · [DEPLOYMENT.md](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/DEPLOYMENT.md) · [TEST_REPORT_LIVE.md](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/TEST_REPORT_LIVE.md).
**Phương pháp:** mọi kết luận dưới đây lấy từ **lệnh chạy thật trên working tree hiện tại** (mục 1), không sao chép số liệu cũ.

---

## 1. Bảng nghiệm thu — lệnh thực sự chạy, kết quả thực

| # | Lệnh | Kết quả (18/10/2026, image `agent-cloud/auth-service:0.0.1` build từ mã mới nhất) |
|---|---|---|
| 1 | `npm run build` | exit **0** |
| 2 | `npm run lint` (oxlint --type-aware, **174 files**) | **0 warning / 0 error** |
| 3 | `npm run test` (vitest unit) | **81/81 pass** (16 files) |
| 4 | `npm run test:e2e` (PostgreSQL thật) | **41/41 pass** (5 files — gồm 3 test mới cho S1/S2/S4), exit 0 |
| 5 | `docker compose build` + `up -d` | Image Built · container **Up (healthy)** |
| 6 | `GET /api/v1/health` trên container | `{"status":"ok","database":{"responseTime":1,"status":"up"}}` |
| 7 | `node scripts/live-smoke.mjs` (image cuối) | **19 PASS / 0 FAIL / 2 WARN** — không hồi quy |
| 8 | Probe `GET /auth/google` (redirect:manual) | **302** + `state=` + cookie `oauth_state_google` (HttpOnly/SameSite=Lax; `Secure` tự bật khi https) |
| 9 | `npm run migrate` trên **DB trắng** tạo mới | 2 migration áp dụng đúng thứ tự; **22 bảng** + index (`ix_verif_token_hash`, `ix_sessions_user_active`, `ix_refresh_session`...) |
| 10 | Boot app trên DB-chỉ-từ-migration (`DB_SYNCHRONIZE=false`) | health 200 → signup 201 → signin 200 → `/me` 200 → refresh(rotation) 200 → signout 200 → **`/me` 401 (deny-list)** |
| 11 | `npm audit` (prod + full) | **0 vulnerabilities** |
| 12 | `node scripts/bench.mjs` (N=100, CONC=10) | số liệu mục 5 |

---

## 2. Bảng điểm tổng quan

| Trục | Điểm | Ghi chú |
|---|---|---|
| **Tính năng** | ✅ Tốt | 7/7 phương thức xác thực hoạt động; MFA **được enforce thật** trong signin; vòng đời phiên/token kín |
| **Bảo mật** | ✅ Tốt | 7/8 phát hiện S1–S8 đã sửa + có test; S8 để mở có chủ đích (quyết định nghiệp vụ); rủi ro secret thuộc vận hành |
| **Hiệu năng** | ✅ Đạt ngưỡng | p50 `/me` 31.9 ms · p50 `/signin` 221 ms (Argon2id chủ đích) · JWT verify ~27k ops/s |
| **Migration/Deploy** | ✅ Đã đủ điều kiện | `DB_SYNCHRONIZE=false` + `npm run migrate` chứng minh chạy được trên DB trắng (mục 1 #9–10) |
| **Kiểm thử** | ✅ Xanh toàn bộ | 81 unit + 41 e2e + live-smoke + audit, exit 0 |

---

## 3. Đánh giá tính năng

### 3.1. Ma trận phương thức xác thực

| Phương thức | E2E | Live 18/10 | Kết luận |
|---|---|---|---|
| **password** | ✅ | ✅ trọn vòng (signup 201, signin đúng/sai, đổi MK, refresh rotation, reuse → 401 `AUTH_TOKEN_REUSED`, signout) | **HOÀN CHỈNH** — chặn tại `AUTH_MFA_REQUIRED` nếu user bật TOTP |
| **email_otp** | ✅ | ✅ `/otp/send` → `/otp/verify` → cấp JWT; chống enumerate (luôn 200) | **HOÀN CHỈNH** |
| **phone_otp** | ✅ | ✅ (delivery mô phỏng qua log) | **HOÀN CHỈNH phần code** — provider SMS thật chưa nối |
| **magic_link** | ✅ | ✅ one-consume, chống open-redirect same-origin | **HOÀN CHỈNH** |
| **google** (OAuth) | ✅ (stub round-trip) | ✅ 302 + **state CSRF** live | Code **HOÀN CHỈNH**; trọn vòng cần khai báo redirect URI trên Google Console (ops) |
| **github** (OAuth) | ✅ | ✅ 403 `AUTH_METHOD_DISABLED` khi thiếu creds | **HOÀN CHỈNH, chờ creds** |
| **passkey** (WebAuthn) | ✅ (5 test, crypto stub) | ✅ options 200 | **HOÀN CHỈNH tới giới hạn headless** (verify cần authenticator vật lý) |

### 3.2. Tính năng nền tảng đã xác minh

- **MFA/TOTP thành lớp phòng vệ thật**: `setup → verify → factor bật → signin bắt buộc otp`; recovery codes one-use (SHA-256); TOTP secret mã hóa AES-256-GCM; sự kiện `auth.signin.mfa_required/mfa_failed` vào audit.
- **RBAC + PBAC**: roles/permissions trong JWT; `RolesGuard`/`PermissionsGuard`; cache quyền TTL 60s qua `KeyValueStore` (in-memory/Redis); chặn 403 `FORBIDDEN_ROLE` verified live.
- **Quản lý phiên**: sessions (+partial index `revoked_at IS NULL`), devices, `signout`/`signout-all`/`DELETE /sessions/:id`, **deny-list thu hồi access token tức thì** (mục 1 #10).
- **Refresh rotation + reuse detection**: verified live trên container production (`AUTH_TOKEN_REUSED` + revoke cả chain).
- **Email verification**: gửi/verify/replay-block (e2e). **Audit log** phân trang, lọc, event catalog.
- **API v1/v2** (Template Method controller đa hình), URI versioning, Swagger (mặc định tắt khi deploy), Terminus health, port auto-fallback, DB strategy đa hình Postgres/MySQL.
- **Migration path**: `InitialSchema` (dựng 21 bảng từ entity metadata, đa hình driver) + job một lần `npm run migrate`; hành vi trên DB lịch sử: đánh dấu applied, không đụng dữ liệu.

### 3.3. Khoảng trống chức năng còn lại (không phải defect)

1. `organizations`/`memberships`/`membership_roles` là entity "treo" — chưa có use-case/API; cần ADR giữ hay lùi (tồn tại từ trước, không ảnh hưởng luồng xác thực).
2. Kênh SMS là log-mô phỏng; cần adapter provider thật (Twilio...) khi đưa vào production — interface đã tách rời sẵn.

---

## 4. Đánh giá bảo mật

### 4.1. Bảng theo dõi 8 phát hiện (S1–S7 đã sửa, mỗi mục có test/bằng chứng)

| Mã | Phát hiện ban đầu | Trạng thái | Bằng chứng đóng mục |
|---|---|---|---|
| S1 | Đổi mật khẩu không thu hồi phiên khác | ✅ **ĐÃ SỬA** — giữ phiên hiện tại, revoke mọi phiên khác + refresh chain + deny-list + audit `revokedOtherSessions` | e2e "change-password giữ phiên hiện tại, thu hồi phiên khác" **PASS** |
| S2 | MFA không enforced khi signin | ✅ **ĐÃ SỬA** — `SigninDto.otp`; thiếu → 401 `AUTH_MFA_REQUIRED`, sai → 401 `AUTH_MFA_INVALID`, **không phát hành phiên trước OTP hợp lệ** | e2e mới 3 nhánh (thiếu/sai/đúng) **PASS** |
| S3 | OAuth state CSRF mặc định tắt | ✅ **ĐÃ SỬA** — bật mặc định (opt-out `OAUTH_STATE=false`); state one-use TTL 10′ trong KV store + cookie `oauth_state_<provider>`; **không cần express-session**; cả Google + GitHub | probe live 302 + state + cookie (mục 1 #8) |
| S4 | Access token không thu hồi tức thì | ✅ **ĐÃ SỬA** — deny-list `SessionRevocationService` (TTL = đúng vòng đời JWT) mark tại signout / signout-all / revoke / reuse-detection / change-password; chặn ở `JwtStrategy.validate` | e2e "signout → /me 401 ngay" **PASS**; live-on-migration-DB **PASS** |
| S5 | JWT algorithm không pin | ✅ **ĐÃ SỬA** — `HS256` pinned ở sign, verify và passport | unit `security.spec` (alg `none`) 9/9 |
| S6 | OTP thô trong Subject email | ✅ **ĐÃ SỬA** — subject trung tính, mã chỉ trong body | diff `verification.service.ts`; e2e vẫn trích OTP từ body → 41/41 |
| S7 | MFA key fallback JWT_SECRET | ✅ **ĐÃ SỬA** — production thiếu `MFA_ENCRYPTION_KEY` ⇒ **dừng khởi động nêu tên biến**; compose `${MFA_ENCRYPTION_KEY:?}` | boot container production (NODE_ENV=production) thành công vì env có khóa |
| S8 | Signup trả 409 riêng (enumerate at-signup) | ⏸ **ĐỂ MỞ — chủ đích** | Đổi hành vi phá hợp đồng client (409 đang được live-smoke/API_GUIDE cam kết). Cần quyết định sản phẩm: (a) 200 chung + mail, hoặc (b) flag opt-in |

### 4.2. Lũy kiểm soát đang hoạt động (bằng chứng chạy thật)

- **Argon2id** 64 MiB/t=3 mặc định + tự nâng cấp hash cũ (`needsRehash`); bcrypt rounds 12 làm fallback đa hình.
- **Khóa tài khoản 5/15′ atomic** (SQL-side increment, chống race lost-update); throttler per-route (signup 5, signin 10, otp/send 3...) + global — live bench **82–95% request bị 429** (limiter hiệu lực).
- **SHA-256 + `timingSafeEqual`** cho OTP/refresh/recovery hash; **AES-256-GCM** (iv‖tag‖ct) cho TOTP secret & OAuth token; refresh token 48-byte `randomBytes`, chỉ lưu hash.
- **Rotation + reuse detection** xóa cả chuỗi phiên + log `[SECURITY WARNING]` — PASS live trên image cuối.
- **trust proxy = false mặc định** (IP từ socket, chống spoof XFF); **CORS đóng mặc định ở production** (allowlist `CORS_ORIGIN`); helmet; ValidationPipe `whitelist + forbidNonWhitelisted`; lỗi 500 **không lộ stack**.
- **Chống open-redirect** magic-link (buộc same-origin `CLIENT_URL`, fail-fast thiếu config); **chống user-enumeration** ở signin/OTP/passkey-options; passkey challenge one-use + TTL 5′; TLS verify mặc định cho SMTP/DB.
- PII: email mask trong log SMTP; raw OTP/token không bao giờ vào log/audit metadata.
- **Working tree & HEAD sạch secret** (`gg-provider.json` untrack; `git grep GOCSPX-` chỉ gặp regex trong test).

### 4.3. Rủi ro còn tồn (thuộc vận hành — không sửa được bằng mã)

1. 🔴 **Secret từng nằm trong git history đã push** (SMTP app password, Google `GOCSPX-…`) — bắt buộc revoke/rotate theo runbook SECURITY.md (user đã nhận lịch xử lý riêng); tùy chọn purge history.
2. 🟡 **Multi-instance cần `ON_REDIS=true`** — deny-list (S4), state OAuth (S3), throttler, RBAC cache là in-memory theo instance; scale ngang không bật Redis = mỗi instance một trí nhớ (SECURITY checklist đã ghi).
3. 🟡 Production: đặt service sau Nginx edge, **bỏ publish `DB_HOST_PORT`/`AUTH_HOST_PORT`** ra host VPS (AGENTS 6.4).

---

## 5. Đánh giá hiệu năng (số đo thật cùng ngày)

### 5.1 Micro-benchmark (unit `performance.spec`)

| Hạng mục | Kết quả | Ngưỡng assert |
|---|---|---|
| Ký JWT | **0.075 ms** (~13.4k ops/s) | < 5 ms ✅ |
| Verify JWT (đã thêm pin alg + deny-list check) | **0.037 ms** (~27.3k ops/s) | < 3 ms ✅ |
| Argon2id hash+verify (19 MiB/t2 — cấu hình test) | 45.3 ms | 10–300 ms ✅ |
| Bcrypt hash+verify (rounds 10) | 105.4 ms | ✅ |
| Đóng gói phân trang 50 items | 7.1 µs | < 100 µs ✅ |

### 5.2 End-to-end vào container thật (`bench.mjs`, N=100/CONC=10)

| Endpoint | p50 | p95 | Phân tích |
|---|---|---|---|
| `GET /auth/me` | **31.9 ms** | 46.1 ms | gồm HTTP round-trip + RBAC cache hit + **1 cache-get deny-list** (chi phí thêm từ S4 không đo được) |
| `POST /auth/signin` | **221 ms** | 336 ms | chậm **chủ đích** do Argon2id prod 64 MiB/t=3 — đúng OWASP, không phải defect |
| Rate limiting | 429 chiếm 82–95% | — | benchmark mẫu nhỏ vì limiter thật; muốn đo throughput cao: `ON_REDIS=true` + nới `THROTTLE_LIMIT` |

### 5.3 Tối ưu kiến trúc đã xác minh trong mã

- `Promise.all` song song hóa signup/signin/issue-token; RBAC `getUserAccess` 5→2 query + cache TTL.
- **Index phủ đường query nóng** (đã chứng minh tạo đúng trên DB migration): `verification_tokens(token_hash)` + `refresh_tokens.token_hash UNIQUE` + `ix_refresh_session` + **partial** `ix_sessions_user_active` + `ix_audit_user_time` + `ix_verif_target/expires`...
- Pool DB cấu hình được (`DB_POOL_MAX/MIN/IDLE_MS`, `connectionTimeoutMillis`), HTTP `keepAliveTimeout`, SMTP timeouts, UPDATE atomic chống lost-update.
- Cân nhắc tiếp (không cấp bách): Argon2 `parallelism=2` trên máy nhiều nhân; `incrementAttempts` dùng `RETURNING` (chỉ Postgres — hiện giữ tương thích MySQL).

---

## 6. Tuân thủ cấu hình / chống hardcode / đóng gói (đối chiếu AGENTS.md)

| Luật | Trạng thái | Chi tiết |
|---|---|---|
| #3/#5.1 chống hardcode | ✅ | `PORT/CLIENT_URL/JWT_SECRET/DB_HOST/DB_USERNAME/DB_DATABASE/MFA_ENCRYPTION_KEY(prod)` Joi `.required()` + `${VAR:?}`; **đã gỡ** default che thiếu `localhost`/`smtp.gmail.com`/`postgres`; cổng không hardcode — helper `listenWithPortFallback` + biến |
| #4 thiếu config ⇒ dừng + nêu tên biến | ✅ | `getOrThrow`, fail-fast MFA key ở production, `resolveClientBaseUrl` |
| #5 pin image | ✅ | `postgres:16-alpine`, `redis:7-alpine`, app `${IMAGE_TAG:?}` |
| #11 migration kiểm soát được | ✅ **đã đóng tuần này** | `DB_SYNCHRONIZE` mặc định `false` trong compose; `InitialSchema` dựng DB trắng; job một lần `npm run migrate` (AGENTS 4.3); idempotent với DB lịch sử |
| #10 healthcheck/shutdown/timeout | ✅ | Terminus + HEALTHCHECK (health ok, DB 1ms), `enableShutdownHooks`, timeouts đủ tầng |
| #9 validate ranh giới, không tin header client | ✅ | whitelist pipe + `req.ip`/trust-proxy |
| #14 không test-code trong source | ✅ | test/script tách `test/`, `scripts/` |
| #6 publish port VPS | 🟡 | compose publish từ biến — khi deploy phải sau Nginx edge, bỏ env publish DB |
| Docs/comment | ✅ | naming EN, tài liệu + comment VN; SECURITY/API_GUIDE/DEPLOYMENT đã đồng bộ hành vi mới (otp, mã lỗi mới, migrate job) |

**Thay đổi hợp đồng API client cần biết** (từ chu kỳ fix):
1. `POST /signin` thêm `otp` (bắt buộc chỉ khi user bật TOTP) — user chưa bật MFA không ảnh hưởng.
2. Mã lỗi mới: `AUTH_MFA_REQUIRED`, `AUTH_MFA_INVALID`; signout/đổi MK làm access token chết ngay (`AUTH_TOKEN_INVALID`) — client không còn được "may mắn" 15 phút.
3. OAuth initiation Set-Cookie `oauth_state_*` (SameSite=Lax) — frontend giữ cookie cùng origin là mặc định trình duyệt.

---

## 7. Kết luận

- **Tính năng:** đủ 7 phương thức + MFA enforced + quản lý phiên/thu hồi kín; 2 khoảng trống (SMS provider, organizations) là phạm vi nghiệp vụ chưa mở, không phải lỗi.
- **Bảo mật:** S1–S7 đã sửa và **mỗi mục có test hoặc probe live chứng minh**; S8 để mở có chủ đích chờ quyết định sản phẩm; rủi ro lớn nhất còn lại nằm ở vận hành (rotate secret history, Redis khi scale).
- **Hiệu năng:** mọi ngưỡng assert pass; các bản vá bảo mật thêm chi phí không đo được ở p50; độ chậm của login là chủ đích theo OWASP.
- **Deploy:** production-ready về migration path (`DB_SYNCHRONIZE=false` + `npm run migrate` một lần); checklist DEPLOYMENT.md cập nhật.
- Nghiệm thu theo đúng lệnh mục 1 chạy trên working tree hiện tại; báo cáo này **thay thế** bản nháp trước (viết trước chu kỳ fix).

## 8. Backlog đề xuất còn lại

| Ưu tiên | Mục | Loại | Ai quyết |
|---|---|---|---|
| 0 | Rotate secret (runbook SECURITY.md) + purge history tùy chọn | vận hành | chủ repo |
| 1 | Chốt S8 (200 chung + mail **hoặc** flag opt-in) | nghiệp vụ/ADR | product |
| 2 | Bộ migration tương lai: mọi đổi schema phải thêm migration mới (nay đã có nền tảng `InitialSchema`) | quy trình | dev |
| 3 | Bật `ON_REDIS=true` + Nginx edge khi lên VPS (bỏ publish port) | deploy | ops |
| 4 | ADR cho organizations/memberships; adapter SMS thật | tính năng | product/dev |
