# Báo cáo kiểm thử thực tế (LIVE) — Các phương thức xác thực

> Tài liệu tổng hợp kết quả kiểm thử **thao tác thật** vào `auth-service` đang chạy, kèm danh mục việc còn lại cho vận hành/production. Tiếng Việt theo chuẩn tài liệu dự án.

## 1. Phạm vi & môi trường
- **Service:** `authentication` (NestJS 12 + TypeORM + PostgreSQL + Redis tùy chọn).
- **Chạy:** Docker Compose — `auth-service` @ `http://localhost:3001`, `auth-postgres` healthy.
- **Mail lúc test OTP/Magic:** `MAIL_STRATEGY=console` (để in mã/token ra `docker logs` trích tự động). Sau test đã **revert về `smtp`** (đúng `.env`).
- **Công cụ:** `scripts/live-smoke.mjs` (password + OAuth initiation) và `scripts/live_auth_methods.mjs` (otp/sms/magic/github/passkey).

## 2. Kết quả tổng quan
| Script | Kiểm tra | PASS | FAIL | WARN | Exit code |
|---|---|---|---|---|---|
| live-smoke.mjs | 21 | 19 | 0 | 2 | 0 |
| live_auth_methods.mjs | 13 | 12 | 0 | 1 | 0 |

**0 FAIL.** WARN đều là giới hạn khách quan (không phải lỗi): Google tự-follow redirect khi probe, bỏ qua Redis/DB proof (`DOCKER_PROOF=0`), passkey verify cần authenticator vật lý.

## 3. Chi tiết theo phương thức
### password — trọn vòng ✅
`signup` 201+token · trùng email 409 · sai định dạng 400 · `signin` đúng 200 / sai 401 · `me` Bearer 200 / không token 401 · `admin/dashboard` 403 `FORBIDDEN_ROLE` · `refresh` 200 **rotation** · dùng lại refresh cũ 401 `AUTH_TOKEN_REUSED` · `change-password` 401/400/200 · `sessions` 200 · `signout` 200 + refresh sau đó 401 · `v2/security-capabilities` 200.

### email_otp — trọn vòng ✅
`/otp/send` (email) → `/otp/verify` → **200 + accessToken JWT** (tạo user). OTP sai → 401 `AUTH_OTP_INVALID`.

### phone_otp (SMS) — trọn vòng ✅
`/otp/send` (channel `sms`) → `/otp/verify` → **200 + accessToken** (delivery mô phỏng qua log).

### magic_link — trọn vòng ✅
`/magic-link/send` → trích token từ URL log → `/magic-link/verify` → **200 + accessToken**.

### google (OAuth) — initiation ✅, trọn vòng ⛔ (cần Google Cloud)
`GET /api/v1/auth/google` → **302** tới `accounts.google.com` với `client_id`, `redirect_uri=http://localhost:3001/api/v1/auth/google/callback`, `response_type=code`, `scope=openid profile email` (chuẩn).
- Kiểm qua trình duyệt thật: Google trả **Error 400 `redirect_uri_mismatch`** → **backend đúng**, nhưng URI callback **chưa được khai báo** trong *Authorized redirect URIs* của Google Cloud Console.

### github (OAuth) — hành vi cấm đúng ✅
`GET /api/v1/auth/github` → **403 `AUTH_METHOD_DISABLED`** (chưa cấu hình `GITHUB_CLIENT_ID/SECRET`). Muốn trọn vòng: cần creds.

### passkey (WebAuthn) — options ✅, verify ⛔ (cần authenticator)
`signup` → `/mfa/passkey/register/options` **200** (creation options: `rp.id`, `challenge`) · `/mfa/passkey/authenticate/options` **200** (request options).
- `.../verify` (attestation/assertion) cần **authenticator/vault vật lý** (`navigator.credentials`) → ngoài khả năng headless.

## 4. Ghi nhận an toàn qua live
- **Refresh token reuse detection** hoạt động thật: phát hiện tái sử dụng → **thu hồi toàn bộ phiên** (log `[SECURITY WARNING]`).
- **Rotation** cấp refresh token mới mỗi lần; token cũ dùng lại bị từ chối.
- **RBAC/Permission** chặn đúng (403 `FORBIDDEN_ROLE`).
- **Chống user-enumeration** ở OTP (luôn trả 200 chung khi gửi).
- **Validate input** + `@Throttle` tại các endpoint.

## 5. Việc còn lại (BẮT BUỘC — thuộc quyền vận hành, không nằm trong mã nguồn)
1. **Rotate Gmail App Password** (`SMTP_PASS`) — đã lộ trong git history đã push.
2. **Rotate Google OAuth `client_secret`** (`GOCSPX…`, trong `gg-provider.json`) — đã lộ trong git history đã push.
3. **Khai báo Authorized redirect URI** trên Google Cloud Console (mở khóa Google login):
   ```
   http://localhost:3001/api/v1/auth/google/callback
   ```
   (prod: thêm bản `https://<domain>/api/v1/auth/google/callback`).
4. **(Tùy chọn) Purge secret khỏi git history** bằng `git filter-repo` + force-push — thao tác **không thể đảo ngược**, cần chủ ý và phối hợp team. Xem runbook trong [SECURITY.md](./SECURITY.md).
5. **Production**: `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` = domain thật (HTTPS), `CORS_ORIGIN`, `TRUST_PROXY`, `MFA_ENCRYPTION_KEY` riêng, `DB_SYNCHRONIZE=false` + migration, `IMAGE_TAG` pin (không `latest`). Chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md).

## 6. Cách tái hiện test
```bash
# Bật console để trích được mã OTP/Magic từ log
MAIL_STRATEGY=console docker compose up -d --force-recreate auth-service
BASE_URL=http://localhost:3001/api/v1 DOCKER_PROOF=0 node scripts/live-smoke.mjs
node scripts/live_auth_methods.mjs
# Khôi phục cấu hình bền vững (smtp) sau khi test
docker compose up -d --force-recreate auth-service
```

## 7. Trạng thái nghiệm thu
- **4/7 phương thức test trọn vòng end-to-end** (password, email_otp, phone_otp, magic_link): tạo user thật + cấp JWT trong PostgreSQL.
- **3/7 (google, github, passkey)** đã kiểm chứng tới giới hạn headless; phần còn lại bị chặn bởi **yếu tố ngoài mã nguồn** (cấu hình Google Cloud, GitHub creds, phần cứng authenticator).
- Build / lint / unit (81) / e2e (38) / docker health: **XANH** (xem mục 8 dưới).

## 8. Verify kỹ thuật (chạy thật, exit code 0)
| Bước | Kết quả |
|---|---|
| `nest build` | exit 0 |
| `oxlint --type-aware` (170 files) | 0 warnings / 0 errors |
| `vitest` unit | 16 files / 81 pass |
| `vitest` e2e (Docker Postgres) | 5 files / 38 pass |
| `docker compose` | container Up (healthy), `GET /api/v1/health` 200 |
