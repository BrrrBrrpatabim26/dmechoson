# Bảo mật — Authentication Service

Tài liệu bảo mật: biên giới tin cậy, mô hình đe dọa (STRIDE-lite) ánh xạ tới biện pháp, chính sách lưu trữ credential/khóa, quản lý secret, checklist production, và cảnh báo secret đang tồn tại trong repo.

## Mục lục
- [Biên giới tin cậy](#biên-giới-tin-cậy)
- [Chính sách lưu trữ credential & token](#chính-sách-lưu-trữ-credential--token)
- [Mô hình đe dọa → biện pháp (STRIDE-lite)](#mô-hình-đe-dọa--biện-pháp-stride-lite)
- [Token model](#token-model)
- [Quản lý khóa & secret](#quản-lý-khóa--secret)
- [Cấu hình bật/tắt bề mặt tấn công](#cấu-hình-bật/tắt-bề-mặt-tấn-công)
- [Checklist production](#checklist-production)
- [Báo cáo lỗ hổng](#báo-cáo-lỗ-hổng)

## Biên giới tin cậy
```
Internet -> [Reverse proxy] -> [auth-service (Nest)] -> [PostgreSQL]
                                   |            \-> [Redis (khi ON_REDIS)]
                                   |            \-> [SMTP]  (email OTP/link/verify)
                                   \-> [Google/GitHub OAuth]  (bên thứ ba)
```
- **Không tin client**: mọi payload qua `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`); không suy quyền từ client.
- **Khách thể (subject)** chỉ được suy ra từ `accessToken` đã verify (JWT signature) — không từ body/query.
- **Isolation**: mỗi truy vấn danh sách (sessions, audit-logs) gắn `user_id` từ token → chống đọc/ghi chéo.

## Chính sách lưu trữ credential & token
| Dữ liệu | Cách lưu | Thuần thuật | Đọc lại được? |
|---|---|---|---|
| Mật khẩu | `password_credentials.password_hash` | Argon2id (mặc định)/Bcrypt | Không (chỉ verify); `needsRehash` tự nâng cấp |
| OTP / Magic Link / link verify email | `verification_tokens.token_hash` | **SHA-256** + so sánh `timingSafeEqual` | Không; consume sau khi dùng (chống replay) |
| Refresh token (JWT-side) | `refresh_tokens.token_hash` | SHA-256 | Không; lưu **token thô một lần** trả client |
| TOTP secret | `mfa_factors.secret_enc` (bytea) | **AES-256-GCM** (đã xác thực) | Có (cần để verify code) |
| OAuth provider token | `oauth_tokens.access_token_enc` | **AES-256-GCM** | Có |
| Recovery code | `mfa_recovery_codes.code_hash` | SHA-256 | Không; dùng 1 lần |

> Khóa đối xứng AES-GCM dẫn xuất từ `MFA_ENCRYPTION_KEY`; **production bắt buộc khóa riêng này** (thiếu -> dừng khởi động, nêu tên biến; không ngầm fallback JWT_SECRET). Non-production được phép fallback `JWT_SECRET` cho tiện dev/test. Xem `common/utils/crypto.util.ts`.

## Mô hình đe dọa → biện pháp (STRIDE-lite)
| Đe dọa | Bề mặt | Biện pháp đã triển khai |
|---|---|---|
| **S**poofing (giả mạo) | Đăng nhập brute-force | Argon2id; khóa tài khoản 5 lần sai/15'; `@nestjs/throttler` theo IP; JWT verify signature; **TOTP được BẮT BUỘC khi đăng nhập nếu tài khoản đã bật factor** (thiếu -> 401 `AUTH_MFA_REQUIRED`, sai -> 401 `AUTH_MFA_INVALID`) |
| **T**ampering | Data trong transit/at rest | HTTPS (prod bắt buộc); AES-256-GCM authenticated cho secret; DTO whitelist chặn field lạ |
| **R**epudiation | Hành vi xác thực | `login_audit_logs` (FK lỏng, giữ lịch sử sau khi xóa user), event catalog + metadata (không ghi secret) |
| **I**nformation disclosure | Leak secret/token | Không bao giờ log OTP/token thô; response chuẩn hóa không lộ nội bộ; timing-safe compare |
| **D**enial of service | Flood endpoint | `@Throttle` per-endpoint (signup 5, signin 10, otp/send 3...), `@nestjs/throttler` toàn cục; pagination `limit<=100` |
| **E**levation of privilege | Vượt qua guard | `RolesGuard`/`PermissionsGuard` + `@RequireRoles`/`@RequirePermissions`; SUPER_ADMIN rõ ràng; user_id từ token; **guard là `APP_GUARD` toàn cục default-deny — endpoint công khai phải đánh dấu `@Public()` tường minh**; quản trị quyền qua `/api/v1/admin/rbac` (ADMIN/SUPER_ADMIN + `role:manage`/`permission:manage`), có chống lockout (không tự hạ / không gỡ SUPER_ADMIN cuối cùng) |
| Token đánh cắp | Refresh reuse | **Rotation + Reuse Detection**: dùng lại refresh cũ → thu hồi cả chuỗi phiên |
| OAuth account-takeover | Auto-link theo email | Chỉ auto-link khi **provider đã verify email** (`email_verified`); identity unique theo provider |
| Replay OTP/link | Chụp token | `consumedAt` một lần; `expiresAt` ngắn (OTP 5', magic 15', verify_email 24h) |
| Passkey gian lận | Challenge giả | Challenge one-use + TTL 5' qua `KeyValueStore`; `sign_count` chống replay; RP ID/origin kiểm tra |

## Token model
- **Access token (JWT)** ngắn hạn (`JWT_EXPIRES_IN`, mặc định 15m), mang `sub/email/sessionId/roles/permissions`; thuật toán **pin HS256** ở cả ký lẫn verify. Thu hồi ngay sau signout/revoke/đổi mật khẩu nhờ **deny-list phiên** trong `KeyValueStore` (`SessionRevocationService`, TTL = đúng vòng đời access token) — khi chạy >1 instance bật `ON_REDIS=true` để deny-list dùng chung.
- **Refresh token** dài hạn (`REFRESH_TOKEN_EXPIRES_DAYS`, mặc định 7d), lưu **hash**; **rotation**: mỗi lần refresh cấp token mới (`parent_id`), token cũ đánh dấu `used_at`.
- **Thu hồi**: `signout` (1 phiên) / `signout-all` (mọi phiên) revoke session + chain; `DELETE /sessions/:id` thu hồi từ xa; reuse detection tự revoke khi phát hiện token bị đánh cắp; **đổi mật khẩu thu hồi mọi phiên KHÁC** (giữ phiên đang đổi) và ghi số phiên bị thu hồi vào audit log.

## Quản lý khóa & secret
- `JWT_SECRET` và `MFA_ENCRYPTION_KEY`: chuỗi ngẫu nhiên ≥ 32 ký tự, **khác nhau**, lưu trong secret manager (không commit), xoay vòng định kỳ. Xoay `JWT_SECRET` làm mất hiệu lực access token (khách phải refresh/đăng nhập lại).
- App Password SMTP, `GOOGLE_*`/`GITHUB_*` client secret: chỉ qua biến môi trường/secret store.
- **KHÔNG** để secret trong `.env` đã commit, ảnh chụp, hay log.

## Cấu hình bật/tắt bề mặt tấn công
- `AUTH_ENABLED_METHODS`: thu nhỏ bề mặt — chỉ bật phương thức thực dùng (`*` = tất cả). Phương thức tắt trả `AUTH_METHOD_DISABLED`.
- `ON_REDIS`: bật để Throttler/counters/challenge dùng Redis (đúng bản chất phân tán khi nhiều instance).
- `THROTTLE_TTL`/`THROTTLE_LIMIT` + `@Throttle` per-route.
- Rate limit riêng cho `email-verification/send`, `otp/send` để chặn spam mail.

## Hardening đã triển khai (hạ tầng & cấu hình)
- **Security headers:** `helmet()` toàn cục (tắt CSP để Swagger UI chạy; vẫn bật X-Frame-Options, nosniff, HSTS...).
- **Trust proxy / IP:** `app.set('trust proxy', TRUST_PROXY)` (mặc định **false**); IP client lấy qua `req.ip`, **không** tự parse `X-Forwarded-For` (chống giả mạo IP - AGENTS 1.2 #9).
- **CORS:** allowlist qua `CORS_ORIGIN`; mặc định **đóng** cross-origin khi `NODE_ENV=production`.
- **TLS verification:** SMTP + Postgres/MySQL **mặc định xác thực cert**; chỉ tắt qua `SMTP_TLS_INSECURE` / `DB_SSL_REJECT_UNAUTHORIZED` (dev).
- **Timeout:** SMTP (`connection/greeting/socketTimeout`), DB pool (`connectionTimeoutMillis`), HTTP keep-alive (`keepAliveTimeout`). Mọi giao tiếp ngoài đều có timeout (AGENTS 1.2 #10).
- **Graceful shutdown:** `app.enableShutdownHooks()` → hook `onApplicationShutdown` đóng Redis/DB khi SIGTERM.
- **Health check:** `GET /api/v1/health` (Terminus, ping DB) + `HEALTHCHECK` trong compose cho `auth-service`.
- **Không hardcode:** `CLIENT_URL`, `PORT`, `JWT_SECRET`, DB/OAuth/WebAuthn là cấu hình **bắt buộc** (`${VAR:?}` / `Joi.required`), **không** còn default `http://localhost:...` trong code.
- **Chống open-redirect:** `redirectUrl` của magic-link bị buộc **cùng origin** với `CLIENT_URL` (`AuthService.resolveClientBaseUrl`, fail-fast nếu thiếu `CLIENT_URL`).
- **OAuth `state` (CSRF):** **BẬT MẶC ĐỊNH** (`OAUTH_STATE=false` để opt-out). State token lưu `KeyValueStore` (Redis khi ON_REDIS) one-use TTL 10 phút + gắn với trình duyệt khởi phát qua cookie `oauth_state_<provider>` (HttpOnly/SameSite=Lax/Secure-when-HTTPS) — **không cần express-session**. Xem `modules/oauth/oauth-state.store.ts`.
- **Secret trong repo:** `gg-provider.json` đã `.gitignore` + untrack; secret cũ vẫn còn trong **git history đã push** → xem Runbook bên dưới.

## Checklist production
- [ ] HTTPS bắt buộc (HSTS) — cookie `Secure`/`HttpOnly`/`SameSite` cho refresh token.
- [ ] `DB_SYNCHRONIZE=false` + migration; backup + tested restore.
- [ ] `JWT_SECRET`, `MFA_ENCRYPTION_KEY` mạnh, **khác** nhau, từ secret manager; lên lịch rotation. (`MFA_ENCRYPTION_KEY` là **bắt buộc** khi `NODE_ENV=production` — service sẽ không khởi động nếu thiếu.)
- [ ] CORS siết qua `CORS_ORIGIN` (allowlist); đặt `TRUST_PROXY` đúng số hop sau proxy để `req.ip` ra IP thật.
- [ ] `AUTH_ENABLED_METHODS` tối thiểu; OAuth redirect URI chính xác; `WEBAUTHN_RP_ID`/`ORIGIN` = domain thật.
- [ ] Bootstrap admin: dùng `ADMIN_BOOTSTRAP_EMAILS` một lần lúc fresh-deploy (grant SUPER_ADMIN có log), **xóa env ngay sau khi grant**; danh mục permission/role hệ thống tự seed idempotent khi boot.
- [ ] Bật `ON_REDIS=true` khi chạy >1 instance (throttle + cache + challenge nhất quán).
- [ ] Giám sát 401/403/429 + `auth.token.reuse_detected`; cảnh báo bất thường.
- [ ] **Xử lý `gg-provider.json`** (xem mục cuối).

## Cảnh báo secret đang tồn tại trong repo
> ⚠️ **`gg-provider.json` chứa `client_secret` Google THẬT** (`GOCSPX-...`) và file này **KHÔNG** nằm trong `.gitignore` → nếu repo được commit/push, secret đã **lộ**.
> Khuyến nghị: (1) thêm `gg-provider.json` vào `.gitignore`; (2) nếu đã lỡ commit, **revoke & tạo lại** OAuth client secret trên Google Cloud; (3) chuyển secret sang biến môi trường/secret manager, chỉ dùng file này cho test cục bộ (E2E `google-oauth-provider`). `.env` đã được gitignore.

## Runbook xử lý sự cố lộ secret (B1 — cần người vận hành thực hiện)

> Các secret sau đã từng nằm trong **git history** và branch đã **push lên `origin`**, nên sửa ở HEAD là **chưa đủ**. Bắt buộc rotate + (tùy chọn) purge history.

### Bước 1 — VÔ HIỆU HÓA và tạo mới secret (quan trọng nhất)
- **Gmail App Password** (`SMTP_PASS`, dạng `pgtg...`): vào Google Account → Security → 2-Step Verification → App passwords → **revoke** cái cũ, tạo cái mới. Cập nhật vào env deployment (`SMTP_PASS`), **không** commit.
- **Google OAuth client secret** trong `gg-provider.json` (`GOCSPX-...`): Google Cloud Console → Credentials → **regenerate** client secret. Chuyển sang biến môi trường (`GOOGLE_CLIENT_SECRET`), không dùng file này ở prod.
- **`JWT_SECRET`** và **`MFA_ENCRYPTION_KEY`**: sinh giá trị mới đủ mạnh, cấp qua secret manager/env.

### Bước 2 — Ngăn leak tiếp diễn
- Thêm vào `.gitignore`: `gg-provider.json` (nếu vẫn giữ cho test cục bộ).
- Xác nhận working tree sạch: `git grep -nI -e "pgtgglhgfsuizxup" -e "GOCSPX-"` → **không còn** kết quả ở HEAD.

### Bước 3 — (TÙY CHỌN, RỦI RO CAO) Xóa secret khỏi history
> **CẢNH BÁO:** các lệnh dưới rewrite lịch sử và **force-push**, phá vỡ với mọi bản clone khác. Chỉ chạy khi đã thống nhất với team, cân nhắc mirror backup.

```bash
# Dùng git filter-repo (khuyến nghị): pip install git-filter-repo
git filter-repo --invert-paths --path glob:'**/gg-provider.json' --path glob:'**/.env' --force
# Hoặc scrub đúng chuỗi secret (replace bằng text ẩn):
git filter-repo --replace-text <(printf 'pgtgglhgfsuizxup==>***REMOVED***\n') --force
# Sau đó force-push CẨN THẬN (cần người có quyền duyệt):
git push --force --all origin
```

### Bước 4 — Xác nhận
- `git log --all -S "pgtgglhgfsuizxup" --oneline` trả rỗng (nếu đã purge).
- Secret cũ đã revoke (test lại: gửi mail/ OAuth bằng key cũ phải thất bại).
- Trên Git remote (GitHub/GitLab): yêu cầu xóa cached commit/PR nếu secret từng hiển thị ở đó.

## Báo cáo lỗ hổng
Vui lòng gửi báo cáo qua kênh bảo mật nội bộ (không mở public issue cho lỗ hổng đang khai thác được). Cung cấp: mô tả, bước tái hiện, tác động, bản vá đề xuất. Phản hồi dự kiến: xác nhận ≤ 3 ngày, vá tùy mức độ (critical: càng sớm càng tốt).
