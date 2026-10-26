# Triển khai & Runbook — Authentication Service

Tài liệu vận hành: kiến trúc Docker, biến môi trường production, runbook lệnh, kiểm tra sức khỏe, backup/restore, scale ngang.

## Mục lục
- [Kiến trúc triển khai](#kiến-trúc-triển-khai)
- [Chạy bằng Docker Compose](#chạy-bằng-docker-compose)
- [Bảng cổng](#bảng-cổng)
- [Biến môi trường theo nhóm](#biến-môi-trường-theo-nhóm)
- [Cấu hình production](#cấu-hình-production)
- [Runbook lệnh](#runbook-lệnh)
- [Kiểm tra sức khỏe & smoke](#kiểm-tra-sức-khỏe--smoke)
- [Scale ngang với Redis](#scale-ngang-với-redis)
- [Backup & restore](#backup--restore)
- [Rollback](#rollback)
- [Xử cố nhanh](#xử-cố-nhanh)

## Kiến trúc triển khai
Stack trong `docker-compose.yml`:

| Service | Container | Image | Vai trò | Bật mặc định? |
|---|---|---|---|---|
| `postgres` | `auth-postgres` | postgres:16-alpine | CSDL chính (khởi tạo `uuid-ossp`/`pgcrypto`) | Có |
| `auth-service` | `auth-service` | `agent-cloud/auth-service:${IMAGE_TAG}` (multi-stage, non-root `node`) — **pin tag, không `latest`** | API xác thực | Có |
| `redis` | `auth-redis` | redis:7-alpine | Cache/throttle/challenge chia sẻ | **Không** — sau profile `redis` |

Image build multi-stage: builder (`npm ci || npm install` + `npm run build` + `npm prune`) → runner chỉ chép `dist/` + prod `node_modules` + `config.yaml`.

## Chạy bằng Docker Compose

### A. Không Redis (mặc định)
```bash
docker compose up -d                 # postgres + auth-service (host 3001)
# Nếu 3001 bị service khác chiếm -> chọn cổng host khác:
AUTH_HOST_PORT=3098 docker compose up -d
docker compose logs -f auth-service
```

### B. Có Redis
```bash
ON_REDIS=true docker compose --profile redis up -d
```
`auth-service` nhận `ON_REDIS=true` + `REDIS_URL=redis://redis:6379/0` (tên service trong network). Kiểm chứng: xem [TESTING.md](./TESTING.md).

### Dựng qua build thủ công (không compose)
```bash
# Pin tag version (KHÔNG dùng latest - AGENTS 1.2 #5).
docker build -t agent-cloud/auth-service:0.0.1 .
docker run -d --name auth-service -p 3001:3001 \
  -e PORT=3001 -e DB_HOST=... -e DB_PASSWORD=... -e JWT_SECRET=... \
  agent-cloud/auth-service:0.0.1
```

## Bảng cổng
| Thành phần | Container port | Host port | Biến điều chỉnh |
|---|---|---|---|
| auth-service (app listen) | `3001` (nội bộ, luôn cố định để khớp mapping) | `3001` mặc định | `AUTH_HOST_PORT` |
| Postgres | 5432 | `5432` | `DB_PORT` |
| Redis | 6379 | `6379` | `REDIS_HOST_PORT` (chỉnh nếu host 6379 đã dùng) |

> **Hai tầng cổng**: (1) App **tự tăng** `PORT` khi `EADDRINUSE` (hữu ích khi chạy trên host / network host). (2) Docker **published host port** không tự đổi bởi app — dùng `AUTH_HOST_PORT` (cố định) hoặc bỏ vế host để Docker gán cổng ngẫu nhiên (`ports: "3001"` / `docker run -P`). Container thường có network namespace riêng nên `3001` nội bộ luôn trống → app không cần nhảy cổng.

## Biến môi trường theo nhóm
| Nhóm | Biến | Production khuyến nghị |
|---|---|---|
| App | `NODE_ENV=production`, `PORT`, `PORT_AUTO_INCREMENT`, `PORT_MAX_ATTEMPTS`, `APP_NAME`, `CLIENT_URL` | `CLIENT_URL` đúng domain front-end |
| DB | `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, **`DB_SYNCHRONIZE=false`**, `DB_LOGGING=false`, `DB_SSL` | Prod: `false` cho synchronize + chạy migration |
| JWT | `JWT_SECRET` (>=32), `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS` | Key mạnh, rotation định kỳ |
| Hash | `HASH_DEFAULT_ALGORITHM`, `HASH_ARGON2_*`, `HASH_BCRYPT_ROUNDS` | argon2id |
| Auth methods | `AUTH_ENABLED_METHODS` | Bật đúng phương thức cần |
| Mail | `MAIL_STRATEGY=smtp`, `MAIL_FROM`, `SMTP_*` | SMTP + App Password |
| OAuth | `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_CALLBACK_URL`, `GITHUB_*` | Redirect URI khớp console |
| MFA/Passkey | `MFA_ISSUER`, `MFA_RECOVERY_CODE_COUNT`, `MFA_ENCRYPTION_KEY`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` | `rpId`/`origin` = domain thật, HTTPS |
| Throttle | `THROTTLE_TTL`, `THROTTLE_LIMIT` | Theo mức chịu tải |
| Redis | `ON_REDIS`, `REDIS_URL`/`REDIS_HOST/PORT/PASSWORD/DB` | Bật khi >1 instance |
| Bảo mật/Vận hành | `TRUST_PROXY`, `CORS_ORIGIN`, `OAUTH_STATE`, `SMTP_TLS_INSECURE`, `DB_SSL_REJECT_UNAUTHORIZED`, `SMTP_TIMEOUT_MS`, `DB_POOL_CONNECT_TIMEOUT_MS`, `HTTP_KEEPALIVE_TIMEOUT_MS`, `IMAGE_TAG` | Mặc định an toàn trong code; set đúng khi prod |

Chi tiết từng biến: [API_GUIDE.md §8](./API_GUIDE.md).

## Cấu hình production (checklist)
- [ ] `DB_SYNCHRONIZE=false` + **migration** được kiểm soát (không auto-sync schema prod). Chạy job một lần trước khi bật phiên bản mới: `npm run migrate` (script `scripts/run-migrations.mjs`, đọc env/secret của môi trường deploy). DB trắng sẽ được dựng đầy đủ 21 bảng bởi `InitialSchema`; `DB_RUN_MIGRATIONS=true` khi boot là đường tương đương cho stack nhỏ.
- [ ] `MFA_ENCRYPTION_KEY` là **bắt buộc** khi `NODE_ENV=production` — thiếu thì service từ chối khởi động và nêu tên biến (không fallback JWT_SECRET).
- [ ] Cài extension Postgres `uuid-ossp`, `pgcrypto` (init-db tự chạy lúc khởi tạo volume mới).
- [ ] `JWT_SECRET` & `MFA_ENCRYPTION_KEY` độ dài đủ, lưu trong secret manager (không commit).
- [ ] `MAIL_STRATEGY=smtp` với App Password; `CLIENT_URL` trỏ đúng mặt tiền.
- [ ] OAuth: khai báo **Authorized redirect URI** khớp chính xác callback. Dev local:
      `http://localhost:3001/api/v1/auth/google/callback`; Prod: `https://<domain>/api/v1/auth/google/callback` (và tương tự cho github). Thiếu -> Google trả `redirect_uri_mismatch`.
- [ ] WebAuthn: `WEBAUTHN_RP_ID` + `WEBAUTHN_ORIGIN` khớp domain; **HTTPS bắt buộc**.
- [ ] CORS: allowlist qua `CORS_ORIGIN` (trống -> prod đóng cross-origin; non-prod mới phản ánh mọi origin).
- [ ] Rate limit nghiêm cho `signin`, `otp/*`, `email-verification/send`.
- [ ] Chạy phía sau reverse proxy (Nginx/Cloudflare): bật `trust proxy` để `X-Forwarded-For` đúng IP.
- [ ] Không commit `.env` và `gg-provider.json` (xem [SECURITY.md](./SECURITY.md)).

## Runbook lệnh
```bash
# Trạng thái & log
docker compose ps
docker compose logs -f auth-service
docker inspect -f '{{.State.Health.Status}}' auth-postgres

# Vào DB / Redis
docker exec -it auth-postgres psql -U postgres -d authentication
docker exec -it auth-redis redis-cli ping

# Mở lại / cập nhật
AUTH_HOST_PORT=3098 docker compose up -d --build auth-service
docker compose restart auth-service

# Dừng
docker compose stop auth-service
docker compose --profile redis down
```

## Kiểm tra sức khỏe & smoke
```bash
# Health check chuẩn (Terminus, ping DB) - dùng cho probe Docker/Nginx:
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/v1/health   # 200 {"status":"ok"}

# Sống + config: 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/v1/auth/methods
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/docs          # 200 nếu Swagger bật

# Vòng lặp đăng nhập nhanh
EMAIL="ops-$(date +%s)@example.com"
curl -s -X POST http://localhost:3001/api/v1/auth/signup \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"StrongPassword123@\"}"
```

## Scale ngang với Redis
Mặc định (in-memory) **chỉ chạy đúng 1 instance**. Khi muốn nhiều bản:
1. Bật `ON_REDIS=true` (Redis dùng chung).
2. Đưa `RBAC cache`, `Throttler storage`, `WebAuthn challenge` sang Redis (tự động qua `KeyValueStore`/`ThrottlerStorage` đã chọn Redis).
3. Mỗi instance trỏ cùng `REDIS_URL`. Request rớt node nào cũng tìm thấy challenge/cache/throttle counter.

## Backup & restore
```bash
# Backup
docker exec auth-postgres pg_dump -U postgres -d authentication -Fc -f /tmp/auth.dump
docker cp auth-postgres:/tmp/auth.dump ./backup_$(date +%F).dump
# Restore
docker cp ./backup_YYYY-MM-DD.dump auth-postgres:/tmp/auth.dump
docker exec auth-postgres pg_restore -U postgres -d authentication --clean /tmp/auth.dump
```

## Rollback
- Build image theo **tag version** (không chỉ `latest`); giữ tag cũ.
- Rollback: `docker compose up -d auth-service` với `IMAGE`/tag cũ, hoặc redeploy previous task.
- Schema: nếu có migration, chuẩn bị migration ngược (down) trước khi rollback code.

## Xử cố nhanh
| Triệu chứng | Hướng xử lý |
|---|---|
| `EADDRINUSE` khi dev trên host | Đã tự tăng cổng; hoặc đặt `PORT` khác |
| Port conflict lúc `compose up` | Đặt `AUTH_HOST_PORT` = cổng trống |
| `502`/mất kết nối DB | Kiểm tra `DB_HOST` (`postgres` trong network compose, `localhost` khi chạy host), `auth-postgres` healthy |
| Redis lỗi khi `ON_REDIS=true` | Kiểm tra `REDIS_URL`, `auth-redis` up; trong compose dùng `redis://redis:6379/0` |
| `npm ci` fail lúc build | Đồng bộ lock bằng `npm install` rồi build lại (Dockerfile có fallback `npm install`) |

Xem thêm: [API_GUIDE §22 Troubleshooting](./API_GUIDE.md).
