# HƯỚNG DẪN CHI TIẾT REQUEST & RESPONSE - AUTHENTICATION SERVICE

> **Cấu hình Mặc định của Hệ thống:**
> - **Thuật toán băm mật khẩu:** `Argon2id` (Bảo mật tối đa, chống tấn công GPU/ASIC).
> - **Cơ sở dữ liệu:** `PostgreSQL` (Kèm extensions `uuid-ossp`, `pgcrypto`).
> - **Hỗ trợ Đa hình:** Có thể đổi sang `Bcrypt` hoặc `MySQL` chỉ bằng 1 biến môi trường mà không cần thay đổi mã nguồn.
> - **Tiền tố API:** `/api` với chuẩn **URI Versioning** (`/api/v1/...`, `/api/v2/...`).
> - **Swagger UI:** `http://localhost:3001/docs`.
> - **Port Auto-Increment:** Nếu cổng `PORT` bị chiếm, server **tự động tăng port** cho tới khi tìm được cổng trống (xem [Mục 0](#0-chế-độ-port-tự-động-port-auto-increment)).
> - **Phương thức xác thực:** Password, Email/Phone OTP, Magic Link, **Email Verification**, **OAuth Google/GitHub**, **MFA/TOTP + Recovery Codes**, **Passkey (WebAuthn/FIDO2)**.
> - **Rate Limiting:** Chống brute-force cấp HTTP bằng `@nestjs/throttler` (xem [Mục 10](#10-rate-limiting-chống-brute-force)).

---

## Mục lục

- [0. Chế độ Port Tự động (Port Auto-Increment)](#0-chế-độ-port-tự-động-port-auto-increment)
- [1. Chuẩn Quy ước Phản hồi (Response Standard)](#1-chuẩn-quy-ước-phản-hồi-response-standard)
- [2. Danh mục Chi tiết Endpoints API Phiên bản 1 (V1)](#2-danh-mục-chi-tiết-endpoints-api-phien-ban-1-v1)
- [3. Danh mục Endpoints API Phiên bản 2 (V2 - Mở rộng Đa hình)](#3-danh-mục-endpoints-api-phien-ban-2-v2--mở-rộng-đa-hinh)
- [4. Cẩm nang Toàn diện các Phương thức Query](#4-cẩm-nang-toàn-diện-các-phương-thức-query-được-hỗ-trợ)
- [5. Kiến trúc Đa Phương thức Xác thực & Hợp nhất Tài khoản](#5-kiến-trúc-đa-phương-thức-xác-thực--hợp-nhất-tai-khoản-unified-identity-model)
- [6. Hướng dẫn Cấu hình Bật/Tắt Phương thức Xác thực](#6-hướng-dẫn-cấu-hinh-battat-phương-thức-xác-thực-auth_enabled_methods)
- [7. Thiết kế Đa hình Dịch vụ Gửi Mail & Sinh Token/OTP](#7-thiết-kế-đa-hinh-dịch-vụ-gửi-mail--sinh-tokensopt-polymorphism-architecture)
- [8. Hướng dẫn Cấu hình Biến Môi trường `.env`](#8-hướng-dẫn-cấu-hinh-biến-môi-trường-env-chuẩn-hoàn-chinh)
- [9. Lệnh Kiểm thử, Kiểm tra Mã nguồn và Biên dịch](#9-lệnh-kiểm-thử-kiểm-tra-mã-nguồn-va-bien-dịch)
- [10. Rate Limiting chống Brute-Force](#10-rate-limiting-chống-brute-force-nestjs/throttler)
- [11. Xác minh Email (Email Verification)](#11-xac-minh-email-email-verification)
- [12. OAuth 2.0 - Google & GitHub](#12-oauth-20---google--github-passport-strategies)
- [13. MFA / TOTP + Recovery Codes](#13-mfa--totp--recovery-codes-rfc-6238)
- [14. Passkey - WebAuthn / FIDO2](#14-passkey---webauthn--fido2)
- [15. Ghi chú Tối ưu Hiệu năng](#15-ghi-chu-tối-uu-hiệu-năng)
- [16. Hướng dẫn Tích hợp (Integration Guide)](#16-hướng-dẫn-tich-hop-integration-guide)
- [17. Redis (tùy chọn) — ON_REDIS](#17-redis-tuy-chon--on_redis)
- [18. Danh mục Endpoint đầy đủ](#18-danh-muc-endpoint-day-du)
- [19. Catalog mã lỗi & xử lý client](#19-catalog-ma-loi--xu-ly-client)
- [20. Versioning & tương thích ngược](#20-versioning--tuong-thich-nguoc)
- [21. Sơ đồ tuần tự cho client](#21-so-do-tuan-tu-cho-client)
- [22. Khắc phục sự cố (Troubleshooting)](#22-khac-phuc-su-co-troubleshooting)
- [23. Admin RBAC — Quản trị role & permission](#23-admin-rbac--quan-tri-role--permission)

> **Kiến trúc & hợp đồng bên trong:** xem [`ARCHITECTURE.md`](./ARCHITECTURE.md) (sơ đồ tầng, ER 21 bảng, Strategy/DI, ADR, mở rộng module).
> **Bộ tài liệu:** [README](./README.md) · [ARCHITECTURE](./ARCHITECTURE.md) · API_GUIDE (file này) · [DEPLOYMENT](./DEPLOYMENT.md) · [TESTING](./TESTING.md) · [SECURITY](./SECURITY.md).

---

## B. Bắt đầu nhanh (Quickstart)

Chạy được cú pháp xác thực đầu tiên trong ~5 phút:

```bash
# 1) Cấu hình: sao chép biến môi trường rồi điền DB/JWT
cp .env.example .env

# 2) Khởi động (tự động tăng port nếu 3001 bị chiếm - xem Mục 0)
npm install
npm run start:dev

# 3) Mở Swagger UI để khám phá & thử mọi endpoint
#    http://localhost:3001/docs

# 4) Đăng ký nhanh bằng cURL
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{ "email": "demo@example.com", "password": "StrongPassword123@", "userName": "Demo" }'
```

**Kiểm tra chuỗi "một hơi" (smoke test):**

```bash
# a) Login -> lấy accessToken/refreshToken
 curl -s -X POST http://localhost:3001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{ "email": "demo@example.com", "password": "StrongPassword123@" }'

# b) Gọi endpoint cần bảo vệ (đổi <ACCESS> bằng accessToken ở trên)
curl -s http://localhost:3001/api/v1/auth/me -H "Authorization: Bearer <ACCESS>"

# c) Xem các phương thức đang bật
curl -s http://localhost:3001/api/v1/auth/methods
```

> **Định tuyến & version:** mọi route có tiền tố `/api` và version URI (`/api/v1/...`, `/api/v2/...`).
> **Response luôn bọc:** `{ success, data|error, timestamp }` (xem [Mục 1](#1-chuẩn-quy-ước-phản-hồi-response-standard)).

---

## 1. Chuẩn Quy ước Phản hồi (Response Standard)

Mọi endpoint trong hệ thống đều tuân thủ định dạng phản hồi JSON chuẩn hóa:

### 1.1. Cấu trúc Phản hồi Thành công (`ApiResponse<T>`):
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-14T08:00:00.000Z"
}
```

### 1.2. Cấu trúc Phản hồi Lỗi (`ApiErrorResponse`):
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không chính xác",
    "details": null
  },
  "timestamp": "2026-10-14T08:00:00.000Z"
}
```

---

## 2. Danh mục Chi tiết Endpoints API Phiên bản 1 (V1)

---

### 2.1. Đăng ký tài khoản (`POST /api/v1/auth/signup`)

Tạo tài khoản người dùng mới, tự động khởi tạo Identity nội bộ, băm mật khẩu bằng **Argon2id** (mặc định), gán vai trò `USER` và danh sách quyền hạt nhân `permissions: []` cơ bản, khởi tạo Session và cấp cặp Token.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/signup`
- **Xác thực:** Public (Không yêu cầu Token)
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc validation | Ý nghĩa |
|---|---|:---:|---|---|
| `email` | `string` | **Có** | Định dạng email hợp lệ | Địa chỉ email của người dùng (tự động trim và chuyển chữ thường) |
| `password` | `string` | **Có** | Độ dài 8 - 64 ký tự | Mật khẩu tài khoản (sẽ được băm bằng Argon2id) |
| `userName` | `string` | Không | Tối đa 100 ký tự | Tên hiển thị người dùng (Mặc định: `'User'`) |
| `locale` | `string` | Không | Tối đa 10 ký tự | Ngôn ngữ ưu tiên (Mặc định: `'vi'`) |
| `timezone` | `string` | Không | Tối đa 50 ký tự | Múi giờ làm việc (Mặc định: `'Asia/Ho_Chi_Minh'`) |

#### Request Body Mẫu:
```json
{
  "email": "nguyenvana@example.com",
  "password": "StrongPassword123@",
  "userName": "Nguyễn Văn A",
  "locale": "vi",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

#### Phản hồi Thành công (HTTP 201 Created):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "mVhZDM4YWE2OGYyODQxZDU2N2Y4NGIyYzk0MTZ...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
      "email": "nguyenvana@example.com",
      "userName": "Nguyễn Văn A",
      "avatarUrl": null,
      "status": "active",
      "roles": ["USER"],
      "permissions": [
        "user:profile:read",
        "user:profile:update",
        "auth:change-password",
        "auth:session:revoke"
      ]
    }
  },
  "timestamp": "2026-10-14T08:00:00.000Z"
}
```

#### Các Trường hợp Lỗi (Error Responses):

1. **Email đã được sử dụng (HTTP 409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_EMAIL_ALREADY_EXISTS",
    "message": "Địa chỉ email [nguyenvana@example.com] đã được đăng ký trong hệ thống",
    "details": {
      "email": "nguyenvana@example.com"
    }
  },
  "timestamp": "2026-10-14T08:00:01.000Z"
}
```

2. **Dữ liệu đầu vào sai định dạng (HTTP 400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không đáp ứng yêu cầu",
    "details": [
      {
        "field": "email",
        "constraints": ["Email không đúng định dạng hợp lệ"]
      },
      {
        "field": "password",
        "constraints": ["Password phải có ít nhất 8 ký tự"]
      }
    ]
  },
  "timestamp": "2026-10-14T08:00:02.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@example.com",
    "password": "StrongPassword123@",
    "userName": "Nguyễn Văn A"
  }'
```

---

### 2.2. Đăng nhập hệ thống (`POST /api/v1/auth/signin`)

Xác thực email và mật khẩu bằng thuật toán đa hình (tự động nhận diện Argon2id hoặc Bcrypt). Tự động khóa tạm thời 15 phút nếu nhập sai 5 lần liên tiếp. Cấp Session và cặp Token mới. **Nếu tài khoản đã bật MFA/TOTP, trường `otp` là BẮT BUỘC** — không kèm mã trả 401 `AUTH_MFA_REQUIRED`, sai mã trả 401 `AUTH_MFA_INVALID`, và **không có phiên/token nào được phát hành** cho đến khi OTP hợp lệ.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/signin`
- **Xác thực:** Public
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Ý nghĩa |
|---|---|:---:|---|---|
| `email` | `string` | **Có** | Email hợp lệ | Email tài khoản đã đăng ký |
| `password` | `string` | **Có** | Không rỗng | Mật khẩu tài khoản |
| `deviceName` | `string` | Không | Chuỗi ký tự | Tên thiết bị đăng nhập phục vụ theo dõi phiên (Device Tracking) |
| `otp` | `string` | Khi tài khoản bật MFA | Đúng 6 chữ số | Mã TOTP từ authenticator app (bắt buộc nếu factor TOTP đang bật; bỏ qua nếu chưa bật) |

#### Request Body Mẫu:
```json
{
  "email": "nguyenvana@example.com",
  "password": "StrongPassword123@",
  "deviceName": "Chrome trên Windows 11"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2VuLTIwMjY...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
      "email": "nguyenvana@example.com",
      "userName": "Nguyễn Văn A",
      "avatarUrl": null,
      "status": "active",
      "roles": ["USER"],
      "permissions": [
        "user:profile:read",
        "user:profile:update",
        "auth:change-password",
        "auth:session:revoke"
      ]
    }
  },
  "timestamp": "2026-10-14T08:05:00.000Z"
}
```

#### Các Trường hợp Lỗi (Error Responses):

1. **Sai email hoặc mật khẩu (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không chính xác",
    "details": null
  },
  "timestamp": "2026-10-14T08:05:01.000Z"
}
```

2. **Tài khoản bị khóa do sai quá 5 lần (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_ACCOUNT_LOCKED",
    "message": "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    "details": {
      "minutesRemaining": 15
    }
  },
  "timestamp": "2026-10-14T08:05:02.000Z"
}
```

3. **Tài khoản bị vô hiệu hóa (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_ACCOUNT_DISABLED",
    "message": "Tài khoản của bạn đã bị vô hiệu hóa hoặc bị khóa",
    "details": null
  },
  "timestamp": "2026-10-14T08:05:03.000Z"
}
```

4. **Đã bật MFA nhưng thiếu mã OTP (HTTP 401 Unauthorized):** `"code": "AUTH_MFA_REQUIRED"` — client phải thu mã từ authenticator và gửi lại kèm `otp`.

5. **Mã OTP sai/hết hiệu lực (HTTP 401 Unauthorized):** `"code": "AUTH_MFA_INVALID"` — mật khẩu đúng nhưng yếu tố hai không đạt; sự kiện được ghi audit `auth.signin.mfa_failed`.

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@example.com",
    "password": "StrongPassword123@",
    "deviceName": "Chrome trên Windows 11"
  }'
```

---

### 2.3. Xoay vòng Refresh Token (`POST /api/v1/auth/refresh`)

Cấp lại Access Token và Refresh Token mới theo cơ chế **Token Rotation**. Tự động phát hiện hành vi tái sử dụng token (Token Reuse Detection) và hủy toàn bộ phiên làm việc.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/refresh`
- **Xác thực:** Public
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Ý nghĩa |
|---|---|:---:|---|---|
| `refreshToken` | `string` | **Có** | Chuỗi không rỗng | Chuỗi Refresh Token nhận được từ lần đăng nhập/refresh gần nhất |

#### Request Body Mẫu:
```json
{
  "refreshToken": "dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2VuLTIwMjY..."
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_ACCESS_TOKEN...",
    "refreshToken": "b3F3ZjhhZjI4NGI4M2E4MTZhN2IyOWM0MTY.NEW_REFRESH_TOKEN...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
      "email": "nguyenvana@example.com",
      "userName": "Nguyễn Văn A",
      "avatarUrl": null,
      "status": "active",
      "roles": ["USER"],
      "permissions": [
        "user:profile:read",
        "user:profile:update",
        "auth:change-password",
        "auth:session:revoke"
      ]
    }
  },
  "timestamp": "2026-10-14T08:15:00.000Z"
}
```

#### Các Trường hợp Lỗi:

1. **Phát hiện Token đã từng sử dụng bị dùng lại - Cảnh báo tấn công (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_REUSED",
    "message": "Cảnh báo bảo mật: Refresh token đã từng được sử dụng. Toàn bộ phiên làm việc bị hủy bỏ để phòng chống tấn công.",
    "details": null
  },
  "timestamp": "2026-10-14T08:15:01.000Z"
}
```

2. **Token hết hạn sử dụng (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Refresh token đã hết hạn. Vui lòng đăng nhập lại.",
    "details": null
  },
  "timestamp": "2026-10-14T08:15:02.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "dGhpcy1pcy1hLXNhbXBsZS1yZWZyZXNoLXRva2VuLTIwMjY..."
  }'
```

---

### 2.4. Đăng xuất phiên hiện tại (`POST /api/v1/auth/signout`)

Thu hồi Session hiện tại và vô hiệu hóa toàn bộ chuỗi Refresh Token gắn với phiên này.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/signout`
- **Xác thực:** Bearer Token (`Authorization: Bearer <accessToken>`)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Không có

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Đăng xuất thành công"
  },
  "timestamp": "2026-10-14T08:20:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/signout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.5. Đăng xuất khỏi toàn bộ thiết bị (`POST /api/v1/auth/signout-all`)

Thu hồi toàn bộ các Session và Refresh Token đang hoạt động trên mọi thiết bị của người dùng.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/signout-all`
- **Xác thực:** Bearer Token (`Authorization: Bearer <accessToken>`)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Không có

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Đã đăng xuất khỏi toàn bộ thiết bị"
  },
  "timestamp": "2026-10-14T08:22:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/signout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.6. Lấy thông tin tài khoản hiện tại (`GET /api/v1/auth/me`)

Lấy hồ sơ cá nhân của chủ sở hữu token, bao gồm thông tin chi tiết, danh sách email liên kết, danh sách vai trò (`roles: []`) và quyền hạn nguyên tử (`permissions: []`).

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v1/auth/me`
- **Xác thực:** Bearer Token
- **Quyền yêu cầu:** `user:profile:read`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Không có

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "id": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
    "userName": "Nguyễn Văn A",
    "avatarUrl": null,
    "locale": "vi",
    "timezone": "Asia/Ho_Chi_Minh",
    "status": "active",
    "roles": ["USER"],
    "permissions": [
      "user:profile:read",
      "user:profile:update",
      "auth:change-password",
      "auth:session:revoke"
    ],
    "lastLoginAt": "2026-10-14T08:05:00.000Z",
    "createdAt": "2026-10-14T08:00:00.000Z",
    "emails": [
      {
        "id": "0192e47b-891a-7b3b-9e4a-9b19e2300001",
        "email": "nguyenvana@example.com",
        "isPrimary": true,
        "verifiedAt": null
      }
    ]
  },
  "timestamp": "2026-10-14T08:25:00.000Z"
}
```

#### Trường hợp Lỗi Thiếu Quyền (HTTP 403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_PERMISSION",
    "message": "Bạn không có đủ quyền thực hiện hành động này. Yêu cầu quyền: [user:profile:read]",
    "details": {
      "requiredPermissions": ["user:profile:read"]
    }
  },
  "timestamp": "2026-10-14T08:25:01.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.7. Đổi mật khẩu tài khoản (`POST /api/v1/auth/change-password`)

Xác thực mật khẩu cũ và băm mật khẩu mới bằng thuật toán mặc định (Argon2id).

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/change-password`
- **Xác thực:** Bearer Token
- **Quyền yêu cầu:** `auth:change-password`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ràng buộc | Ý nghĩa |
|---|---|:---:|---|---|
| `currentPassword` | `string` | **Có** | Không rỗng | Mật khẩu hiện tại của người dùng |
| `newPassword` | `string` | **Có** | Độ dài 8 - 64 ký tự | Mật khẩu mới mong muốn |

#### Request Body Mẫu:
```json
{
  "currentPassword": "StrongPassword123@",
  "newPassword": "NewStrongPassword456@"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Đổi mật khẩu thành công"
  },
  "timestamp": "2026-10-14T08:30:00.000Z"
}
```

#### Các Trường hợp Lỗi:

1. **Mật khẩu mới trùng với mật khẩu cũ (HTTP 400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_PASSWORD_SAME_AS_CURRENT",
    "message": "Mật khẩu mới không được trùng với mật khẩu hiện tại",
    "details": null
  },
  "timestamp": "2026-10-14T08:30:01.000Z"
}
```

2. **Mật khẩu cũ không chính xác (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Mật khẩu hiện tại không chính xác",
    "details": null
  },
  "timestamp": "2026-10-14T08:30:02.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "StrongPassword123@",
    "newPassword": "NewStrongPassword456@"
  }'
```

---

### 2.8. Endpoint Quản trị mẫu (`GET /api/v1/auth/admin/dashboard`)

Minh họa kiểm tra đồng thời cả vai trò (`roles: ['ADMIN', 'SUPER_ADMIN']`) và quyền nguyên tử (`permissions: ['user:manage']`).

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v1/auth/admin/dashboard`
- **Xác thực:** Bearer Token
- **Vai trò yêu cầu:** `ADMIN` hoặc `SUPER_ADMIN`
- **Quyền yêu cầu:** `user:manage`
- **Headers:** `Authorization: Bearer <token>`

#### Phản hồi Thành công nếu là Quản trị viên (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "[V1] Chào mừng Quản trị viên! Bạn có toàn quyền quản lý người dùng.",
    "user": {
      "sub": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
      "email": "admin@example.com",
      "roles": ["ADMIN"],
      "permissions": ["user:manage", "user:profile:read"]
    }
  },
  "timestamp": "2026-10-14T08:35:00.000Z"
}
```

#### Phản hồi Lỗi khi Người dùng thường truy cập (HTTP 403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ROLE",
    "message": "Yêu cầu vai trò: [ADMIN, SUPER_ADMIN] để truy cập tài nguyên này",
    "details": {
      "requiredRoles": ["ADMIN", "SUPER_ADMIN"]
    }
  },
  "timestamp": "2026-10-14T08:35:01.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v1/auth/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 2.9. Truy vấn danh sách phiên hoạt động (`GET /api/v1/auth/sessions`)

Truy vấn toàn bộ các phiên đăng nhập đang có hiệu lực của tài khoản hiện tại (chưa hết hạn và chưa bị thu hồi).

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v1/auth/sessions`
- **Xác thực:** Bearer Token
- **Quyền yêu cầu:** `auth:session:revoke`
- **Headers:** `Authorization: Bearer <token>`

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "0192e47b-891a-7b3b-9e4a-9b19e2300001",
      "userId": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      "deviceName": null,
      "createdAt": "2026-10-14T08:00:00.000Z",
      "lastSeenAt": "2026-10-14T08:15:00.000Z",
      "expiresAt": "2026-10-21T08:00:00.000Z",
      "isCurrent": true
    }
  ],
  "timestamp": "2026-10-14T08:20:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.10. Thu hồi một phiên đăng nhập cụ thể (`DELETE /api/v1/auth/sessions/{sessionId}`)

Cho phép người dùng chủ động đóng từ xa một phiên đăng nhập của chính mình trên thiết bị khác. Toàn bộ Refresh Token thuộc phiên đó sẽ bị thu hồi ngay lập tức.

- **HTTP Method:** `DELETE`
- **Đường dẫn:** `/api/v1/auth/sessions/{sessionId}`
- **Xác thực:** Bearer Token
- **Quyền yêu cầu:** `auth:session:revoke`
- **Headers:** `Authorization: Bearer <token>`

#### Tham số Đường dẫn (Path Parameter):
| Tham số | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|---|---|:---:|---|
| `sessionId` | `string (UUID)` | **Có** | ID của phiên đăng nhập cần thu hồi |

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Thu hồi phiên đăng nhập thành công"
  },
  "timestamp": "2026-10-14T08:25:00.000Z"
}
```

#### Các Trường hợp Lỗi:
- **Phiên không tồn tại hoặc không thuộc tài khoản (HTTP 404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy phiên đăng nhập hoặc phiên không thuộc tài khoản của bạn",
    "details": null
  },
  "timestamp": "2026-10-14T08:25:01.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X DELETE http://localhost:3001/api/v1/auth/sessions/0192e47b-891a-7b3b-9e4a-9b19e2300001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.11. Truy vấn nhật ký đăng nhập cá nhân (`GET /api/v1/auth/audit-logs`)

Truy vấn danh sách lịch sử các lần đăng nhập (thành công hoặc thất bại) của người dùng hiện tại kèm theo siêu dữ liệu phân trang.

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v1/auth/audit-logs`
- **Xác thực:** Bearer Token
- **Quyền yêu cầu:** `user:profile:read`
- **Headers:** `Authorization: Bearer <token>`

#### Bảng tham số URL Query Parameters:
| Tham số | Kiểu dữ liệu | Mặc định | Giới hạn / Giá trị hỗ trợ | Ý nghĩa |
|---|---|:---:|---|---|
| `page` | `number` | `1` | Min: 1 | Số thứ tự trang cần lấy |
| `limit` | `number` | `10` | Min: 1, Max: 100 | Số lượng bản ghi trên một trang |
| `status` | `string` | `ALL` | `ALL`, `SUCCESS`, `FAILED` | Bộ lọc theo kết quả đăng nhập |
| `sortBy` | `string` | `createdAt` | `createdAt` | Tên trường cần sắp xếp |
| `sortOrder` | `string` | `DESC` | `ASC`, `DESC` | Thứ tự sắp xếp (mặc định mới nhất trước) |

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "0192e47b-891a-7b3b-9e4a-9b19e2300005",
        "userId": "0192e47b-891a-7b3b-9e4a-9b19e2300000",
        "eventType": "auth.signin.success",
        "success": true,
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "metadata": {},
        "createdAt": "2026-10-14T08:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "timestamp": "2026-10-14T08:30:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET "http://localhost:3001/api/v1/auth/audit-logs?page=1&limit=10&status=SUCCESS&sortOrder=DESC" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.12. Lấy danh sách phương thức xác thực được kích hoạt (`GET /api/v1/auth/methods`)

Cho phép Frontend truy vấn danh sách các phương thức xác thực mà hệ thống đang cho phép sử dụng (dựa theo biến môi trường `AUTH_ENABLED_METHODS`). Giúp UI tự động ẩn/hiện nút đăng nhập Google, GitHub, OTP hay Mật khẩu tương ứng.

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v1/auth/methods`
- **Xác thực:** Public (Không yêu cầu Token)

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "enabledMethods": [
      "password",
      "email_otp",
      "phone_otp",
      "magic_link",
      "google",
      "github",
      "passkey"
    ]
  },
  "timestamp": "2026-10-14T10:10:09.081Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v1/auth/methods
```

---

### 2.13. Gửi mã xác thực OTP (`POST /api/v1/auth/otp/send`)

Sinh mã số ngẫu nhiên 6 chữ số an toàn bảo mật (`crypto.randomInt`), băm SHA-256 lưu trữ trong bảng `verification_tokens` với thời hạn hiệu lực **5 phút**, tự động hủy các mã OTP cũ đang chờ của đích đến này và gửi qua Email hoặc SMS.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/otp/send`
- **Xác thực:** Public (Không yêu cầu Token)
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|:---:|:---:|---|
| `target` | `string` | **Có** | - | Địa chỉ email hoặc số điện thoại nhận mã |
| `channel` | `string` | Không | `'email'` | Kênh gửi: `'email'` hoặc `'sms'` |
| `purpose` | `string` | Không | `'login'` | Mục đích: `'login'`, `'signup'`, `'reset_password'`, `'link'` |

#### Request Body Mẫu:
```json
{
  "target": "nguyenvana@example.com",
  "channel": "email",
  "purpose": "login"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Mã xác thực OTP đã được gửi tới nguyenvana@example.com qua EMAIL"
  },
  "timestamp": "2026-10-14T10:10:15.786Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "target": "nguyenvana@example.com",
    "channel": "email",
    "purpose": "login"
  }'
```

---

### 2.14. Xác thực mã OTP và Đăng nhập / Đăng ký (`POST /api/v1/auth/otp/verify`)

Kiểm tra mã OTP bằng giải thuật đối soát an toàn thời gian (`crypto.timingSafeEqual`).
- Nếu mã chính xác:
  - Nếu tài khoản chưa từng tồn tại: Tự động khởi tạo `users`, `user_emails` (đã verify), tạo identity `email_otp`, cấp vai trò và quyền mặc định, khởi tạo Session và cấp Token JWT.
  - Nếu tài khoản đã tồn tại: Tự động hợp nhất danh tính (Account Linking) vào `user.id` hiện có, cấp phiên và Token JWT.
  - Lập tức vô hiệu hóa mã OTP (`consumedAt = now`) để ngăn chặn tuyệt đối **Replay Attack**.
- Nếu mã sai: Tăng số lần thử sai (`attempts + 1`). Nếu sai quá 5 lần, ném lỗi `AUTH_OTP_MAX_ATTEMPTS_EXCEEDED` và hủy mã ngay lập tức.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/otp/verify`
- **Xác thực:** Public (Không yêu cầu Token)
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|:---:|:---:|---|
| `target` | `string` | **Có** | - | Email hoặc số điện thoại đã nhận mã OTP |
| `otp` | `string` | **Có** | - | Mã OTP 6 chữ số |
| `purpose` | `string` | Không | `'login'` | Mục đích xác thực |
| `displayName` | `string` | Không | - | Tên hiển thị khi tự động tạo tài khoản mới |
| `deviceName` | `string` | Không | - | Tên thiết bị đăng nhập |

#### Request Body Mẫu:
```json
{
  "target": "nguyenvana@example.com",
  "otp": "441675",
  "purpose": "login",
  "displayName": "Nguyễn Văn A"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "nIsKGOk1RJSX7_3AqUy8teDGsGmc70PAmiffNjOq...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "01a139e4-6a78-7166-a128-096772660f58",
      "email": "nguyenvana@example.com",
      "userName": "Nguyễn Văn A",
      "avatarUrl": null,
      "status": "active",
      "roles": ["USER"],
      "permissions": [
        "user:profile:read",
        "user:profile:update",
        "auth:change-password",
        "auth:session:revoke"
      ]
    }
  },
  "timestamp": "2026-10-14T10:10:33.243Z"
}
```

#### Các Trường hợp Lỗi Bảo mật:
1. **Mã OTP sai (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_OTP_INVALID",
    "message": "Mã OTP không chính xác. Bạn còn 4 lần thử.",
    "details": null
  },
  "timestamp": "2026-10-14T10:10:27.243Z"
}
```

2. **Mã OTP hết hạn hoặc bị dùng lại - Replay Attack (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_OTP_EXPIRED",
    "message": "Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã mới.",
    "details": null
  },
  "timestamp": "2026-10-14T10:10:42.844Z"
}
```

3. **Nhập sai quá số lần tối đa (HTTP 429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_OTP_MAX_ATTEMPTS_EXCEEDED",
    "message": "Bạn đã nhập sai mã OTP quá 5 lần. Mã này đã bị vô hiệu hóa vì lý do an toàn.",
    "details": null
  },
  "timestamp": "2026-10-14T10:10:50.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "target": "nguyenvana@example.com",
    "otp": "441675",
    "purpose": "login"
  }'
```

---

### 2.15. Gửi đường dẫn đăng nhập nhanh Magic Link (`POST /api/v1/auth/magic-link/send`)

Sinh chuỗi token ngẫu nhiên 32 bytes có độ entropy cao (Base64URL), băm SHA-256 lưu DB với thời hạn **15 phút**, và gửi email chứa đường dẫn đăng nhập 1-chạm (Passwordless).

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/magic-link/send`
- **Xác thực:** Public (Không yêu cầu Token)
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|---|---|:---:|---|
| `email` | `string` | **Có** | Email nhận liên kết đăng nhập nhanh |
| `redirectUrl` | `string` | Không | URL Frontend chuyển hướng sau khi người dùng bấm vào link |

#### Request Body Mẫu:
```json
{
  "email": "nguyenvana@example.com",
  "redirectUrl": "http://localhost:3000/auth/callback"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Đường dẫn đăng nhập nhanh (Magic Link) đã được gửi tới nguyenvana@example.com"
  },
  "timestamp": "2026-10-14T10:10:48.310Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/magic-link/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@example.com",
    "redirectUrl": "http://localhost:3000/auth/callback"
  }'
```

---

### 2.16. Xác thực Magic Link và Đăng nhập (`POST /api/v1/auth/magic-link/verify`)

Xác thực token nhận được từ Magic Link URL, băm SHA-256 đối soát với cơ sở dữ liệu. Sau khi kiểm tra thành công, vô hiệu hóa token và cấp phiên đăng nhập kèm cặp Token JWT.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/magic-link/verify`
- **Xác thực:** Public (Không yêu cầu Token)
- **Headers:** `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|---|---|:---:|---|
| `token` | `string` | **Có** | Chuỗi token nhận từ tham số query URL của Magic Link |
| `deviceName` | `string` | Không | Tên thiết bị đăng nhập |

#### Request Body Mẫu:
```json
{
  "token": "ZuMvC1EwYNIO74ts_6Pz2pcrU4HfhZZBtxVqK-oZDjQ",
  "deviceName": "Chrome on MacBook"
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "EQ8BXDZY-8xmFmxakuuAX3TTXbs_kq-mtTUGs6o...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "01a139e4-6a78-7166-a128-096772660f58",
      "email": "nguyenvana@example.com",
      "userName": "nguyenvana",
      "avatarUrl": null,
      "status": "active",
      "roles": ["USER"],
      "permissions": ["user:profile:read", "user:profile:update", "auth:change-password", "auth:session:revoke"]
    }
  },
  "timestamp": "2026-10-14T10:10:57.321Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/magic-link/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ZuMvC1EwYNIO74ts_6Pz2pcrU4HfhZZBtxVqK-oZDjQ",
    "deviceName": "Chrome on MacBook"
  }'
```

---

### 2.17. Liên kết phương thức xác thực mới vào tài khoản - Account Linking (`POST /api/v1/auth/identities/link`)

Cho phép một người dùng đã đăng nhập liên kết thêm tài khoản mạng xã hội (Google, GitHub), số điện thoại hoặc Passkey vào **cùng 1 tài khoản (User ID)** duy nhất. Ngăn chặn tuyệt đối việc liên kết identity đã thuộc về người dùng khác.

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v1/auth/identities/link`
- **Xác thực:** Bearer Token (Yêu cầu đã đăng nhập)
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Bảng tham số Request Body:

| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|---|---|:---:|---|
| `provider` | `string` | **Có** | Tên nhà cung cấp: `'google'`, `'github'`, `'phone'`, `'passkey'`, `'apple'`... |
| `providerUserId` | `string` | **Có** | ID duy nhất do nhà cung cấp cấp (Google sub, GitHub ID, Số điện thoại...) |
| `email` | `string` | Không | Email gắn liền với provider nếu có |
| `profile` | `object` | Không | Dữ liệu snapshot profile từ provider (tên, avatar...) |

#### Request Body Mẫu:
```json
{
  "provider": "google",
  "providerUserId": "109823482734918237",
  "email": "nguyenvana@gmail.com",
  "profile": {
    "name": "Nguyễn Văn A (Google)",
    "picture": "https://lh3.googleusercontent.com/avatar"
  }
}
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Liên kết phương thức google vào tài khoản thành công"
  },
  "timestamp": "2026-10-14T10:11:02.370Z"
}
```

#### Các Trường hợp Lỗi:
1. **Phương thức xác thực này đã bị liên kết với tài khoản khác (HTTP 409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_IDENTITY_ALREADY_LINKED",
    "message": "Phương thức xác thực [google] với định danh [109823482734918237] đã được liên kết với một tài khoản khác",
    "details": {
      "provider": "google",
      "providerUserId": "109823482734918237"
    }
  },
  "timestamp": "2026-10-14T10:11:05.000Z"
}
```

2. **Phương thức chưa được kích hoạt trong cấu hình (HTTP 403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_METHOD_DISABLED",
    "message": "Phương thức xác thực [google] hiện đang bị vô hiệu hóa bởi chính sách quản trị",
    "details": null
  },
  "timestamp": "2026-10-14T10:11:06.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/identities/link \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "providerUserId": "109823482734918237",
    "email": "nguyenvana@gmail.com"
  }'
```

---

## 3. Danh mục Endpoints API Phiên bản 2 (V2 - Mở rộng Đa hình)

---

### 3.1. [V2] Đăng nhập mở rộng (`POST /api/v2/auth/signin`)

- **HTTP Method:** `POST`
- **Đường dẫn:** `/api/v2/auth/signin`
- **Mô tả:** Minh họa việc kế thừa đa hình từ `BaseAuthController` và mở rộng logic ghi nhận telemetry IP trên V2 mà không phá vỡ logic client đang dùng V1.

**Request Body:** Tương tự V1.

**cURL Mẫu:**
```bash
curl -X POST http://localhost:3001/api/v2/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@example.com",
    "password": "StrongPassword123@"
  }'
```

---

### 3.2. [V2] Kiểm tra tính năng bảo mật nâng cao (`GET /api/v2/auth/security-capabilities`)

> **Nâng cấp mới:** Endpoint giờ đây truy vấn **trạng thái thực** của tài khoản (không còn hard-code): `mfaEnabled` phản ánh số yếu tố MFA đã bật trong DB, `passkeySupported` phản ánh cấu hình `AUTH_ENABLED_METHODS` + WebAuthn.

Endpoint độc quyền mới chỉ có trên API V2.

- **HTTP Method:** `GET`
- **Đường dẫn:** `/api/v2/auth/security-capabilities`
- **Xác thực:** Bearer Token
- **Headers:** `Authorization: Bearer <token>`

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "mfaEnabled": false,
    "passkeySupported": true,
    "activeSessionId": "0192e47b-891a-7b3b-9e4a-9b19e2300001"
  },
  "timestamp": "2026-10-14T08:40:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v2/auth/security-capabilities \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Cẩm nang Toàn diện các Phương thức Query được Hỗ trợ

Hệ thống Authentication Service được thiết kế để xử lý linh hoạt và an toàn các loại truy vấn (Query Methods) đa dạng từ Client. Dưới đây là đặc tả chi tiết về cách thức client có thể gửi truy vấn:

### 4.1. Truy vấn qua HTTP URL Query String (Phân trang, Lọc & Sắp xếp)

Áp dụng cho các endpoint danh sách như `GET /api/v1/auth/audit-logs`:

| Kiểu truy vấn | Cú pháp Parameter | Ví dụ cụ thể | Ý nghĩa kỹ thuật |
|---|---|---|---|
| **Phân trang (Pagination)** | `?page={n}&limit={m}` | `?page=2&limit=20` | Bỏ qua `(page - 1) * limit` bản ghi và lấy tối đa `limit` bản ghi (tối đa 100) |
| **Lọc trạng thái (Filtering)** | `?status={VALUE}` | `?status=SUCCESS` hoặc `?status=FAILED` | Lọc các bản ghi theo kết quả đăng nhập thành công hay thất bại |
| **Sắp xếp (Sorting)** | `?sortBy={field}&sortOrder={order}` | `?sortBy=createdAt&sortOrder=DESC` | Sắp xếp theo trường chỉ định (tăng dần: `ASC`, giảm dần: `DESC`) |
| **Kết hợp đồng thời (Combined)** | Cú pháp ghép `&` | `?page=1&limit=10&status=FAILED&sortOrder=DESC` | Truy vấn các lần đăng nhập thất bại gần nhất |

**Ví dụ URL Query hoàn chỉnh:**
```http
GET /api/v1/auth/audit-logs?page=1&limit=15&status=SUCCESS&sortBy=createdAt&sortOrder=DESC HTTP/1.1
Host: localhost:3001
Authorization: Bearer <access_token>
```

---

### 4.2. Truy vấn qua Tham số Đường dẫn (Path Parameters)

Áp dụng khi thao tác trên một tài nguyên phiên hoặc thực thể cụ thể theo mã UUID:

| Endpoint | Path Parameter | Ví dụ | Ý nghĩa |
|---|---|---|---|
| `DELETE /api/v1/auth/sessions/{sessionId}` | `sessionId` (UUIDv7) | `/api/v1/auth/sessions/0192e47b-891a-7b3b-9e4a-9b19e2300001` | Định danh chính xác phiên cần thu hồi |

---

### 4.3. Truy vấn & Trích xuất Ngữ cảnh qua HTTP Headers (Context Extraction)

Hệ thống tự động phân tích các Headers gửi lên từ Client và mạng Proxy/Load Balancer để nhận diện thiết bị và lưu vết:

| HTTP Header | Ví dụ | Mục đích sử dụng |
|---|---|---|
| `Authorization` | `Bearer eyJhbGciOiJIUzI1Ni...` | Xác thực danh tính qua JWT Access Token |
| `X-Forwarded-For` | `203.0.113.195, 70.41.3.18` | Trích xuất địa chỉ IP thực tế của client qua các reverse proxy (Nginx, Cloudflare) |
| `User-Agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)` | Nhận diện trình duyệt, hệ điều hành và thiết bị của phiên làm việc |
| `Content-Type` | `application/json` | Định dạng dữ liệu cho các truy vấn `POST`, `PUT`, `DELETE` |

---

### 4.4. Bảo mật Tầng Truy vấn (Database Query Security & Performance)

Mọi truy vấn từ tầng Service xuống Database qua Repositories đều tuân thủ các nguyên tắc bảo mật tối cao:

1. **Chống SQL Injection 100%:** 
   - Tuyệt đối không nối chuỗi thô (No raw string concatenation).
   - 100% câu lệnh dùng Parameterized Queries (`where('log.user_id = :userId', { userId })`).
2. **Cách ly Dữ liệu Đa người dùng (Tenant / User Isolation):**
   - Mọi câu truy vấn danh sách phiên (`sessions`) hay nhật ký (`audit-logs`) bắt buộc phải gắn điều kiện `user_id = :userId` lấy từ token đã xác thực, ngăn chặn triệt để rò rỉ dữ liệu chéo giữa các user.
3. **Tối ưu hóa Index Scan:**
   - Đã đánh index kép (`Index('ix_audit_user_time', ['userId', 'createdAt'])`) và index điều kiện (`Index('ix_sessions_user_active', ['userId'], { where: 'revoked_at IS NULL' })`) giúp câu lệnh truy vấn có độ phức tạp thời gian đạt \(O(\log N)\) ngay cả khi có hàng triệu bản ghi.

---

---

## 5. Kiến trúc Đa Phương thức Xác thực & Hợp nhất Tài khoản (Unified Identity Model)

### 5.1. Bảng phân loại các Phương thức Xác thực được Hỗ trợ

Hệ thống hỗ trợ đầy đủ các kiểu xác thực hiện đại và cho phép bật/tắt linh hoạt:

| Phương thức (Code) | Loại hình (Kind) | Cơ chế xác thực | Mức độ an toàn | Trường hợp sử dụng |
|---|---|---|:---:|---|
| `password` | Local Password | Mật khẩu băm bằng **Argon2id** (hoặc **Bcrypt**) | Cao | Đăng nhập truyền thống bằng Email + Mật khẩu |
| `email_otp` | Passwordless | Mã OTP 6 chữ số gửi qua Email, băm **SHA-256**, hiệu lực 5 phút | Rất cao | Đăng nhập không cần nhớ mật khẩu, chống lộ pass |
| `phone_otp` | Passwordless SMS | Mã OTP 6 chữ số gửi qua SMS số điện thoại | Rất cao | Đăng nhập di động, xác thực định danh qua SIM |
| `magic_link` | Passwordless URL | Token 32 bytes ngẫu nhiên độ entropy 256-bit trong URL, hiệu lực 15 phút | Rất cao | Đăng nhập 1-chạm (One-click) qua Hộp thư điện tử |
| `google` | OAuth 2.0 / OIDC | Xác thực liên kết qua Google Sign-In (OpenID Connect) | Tiêu chuẩn quốc tế | Đăng nhập nhanh bằng tài khoản Google |
| `github` | OAuth 2.0 | Xác thực liên kết qua GitHub Developer OAuth | Tiêu chuẩn quốc tế | Dành cho lập trình viên và hệ sinh thái kỹ thuật |
| `passkey` | FIDO2 / WebAuthn | Xác thực sinh trắc học (Vân tay, Face ID, Windows Hello) | Tối cao | Chống phishing 100%, bảo mật phần cứng |

---

### 5.2. Các Phương thức nào có thể CÙNG TRUY CẬP VÀO 1 TÀI KHOẢN?

> [!IMPORTANT]
> **Toàn bộ các phương thức xác thực trên đều có thể cùng truy cập vào DUY NHẤT 1 tài khoản người dùng (`UserEntity` với ID cố định)!**

#### Sơ đồ Quan hệ Thực thể Đa Danh tính (Unified Identity ERD):

```
                     ┌───────────────────────────────────┐
                     │            UserEntity             │
                     │  - id: UUIDv7 (Định danh duy nhất)│
                     │  - user_name: "Nexus Admin"       │
                     │  - status: "active"               │
                     └─────────────────┬─────────────────┘
                                       │ 1
                                       │
                                       │ N (1-to-Many)
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     UserEmailEntity (Primary) │             │      UserIdentity (Local)     │
│  - email: nexus@agentcloud.io │             │  - provider: "local"          │
│  - verified_at: Timestamp     │             │  - credential: Argon2id Hash  │
└───────────────────────────────┘             └───────────────────────────────┘
            │                                                     │
            │ N (N identities cùng trỏ về 1 userId)               │
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│   UserIdentity (Email OTP)    │             │   UserIdentity (Magic Link)   │
│  - provider: "email_otp"      │             │  - provider: "magic_link"     │
│  - provider_user_id: nexus@...│             │  - provider_user_id: nexus@...│
└───────────────────────────────┘             └───────────────────────────────┘
            │                                                     │
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│    UserIdentity (Google)      │             │    UserIdentity (GitHub)      │
│  - provider: "google"         │             │  - provider: "github"         │
│  - provider_user_id: 109823...│             │  - provider_user_id: 458921...│
└───────────────────────────────┘             └───────────────────────────────┘
```

#### Quy trình Hợp nhất Danh tính (Account Linking Workflow):
1. **Liên kết Tự động bằng Email đã Xác thực (Auto-linking):**
   - Khi người dùng đăng nhập bằng **Email OTP** hoặc **Magic Link**, hệ thống kiểm tra email trong bảng `user_emails`.
   - Nếu email đã tồn tại và đã được kích hoạt, hệ thống tự động gán Identity mới vào chính `user.id` hiện có thay vì tạo ra tài khoản rác (duplicate account).
2. **Liên kết Thủ công Chủ động (Authenticated Linking):**
   - Người dùng đã đăng nhập gọi API `POST /api/v1/auth/identities/link` với token bearer và thông tin provider mới (ví dụ Google OAuth `providerUserId`).
   - Hệ thống lưu bản ghi mới vào bảng `identities` gắn với `user_id` hiện tại.
3. **Chống Xâm chiếm Tài khoản (Account Takeover Protection):**
   - Nếu `providerUserId` gửi lên **đã từng được liên kết với một User ID khác**, hệ thống lập tức từ chối và ném lỗi `AUTH_IDENTITY_ALREADY_LINKED` (HTTP 409 Conflict).
   - Nếu chính người dùng hiện tại đã liên kết phương thức này trước đó, hệ thống phản hồi thành công một cách an toàn (Idempotent).
4. **Nhất quán Quyền hạn & Token (Session Integrity):**
   - Dù đăng nhập bằng Mật khẩu, OTP, Magic Link hay Google, Token JWT cấp ra đều mang `sub: user.id`, cùng danh sách Roles (`roles: []`) và Permissions (`permissions: []`), đảm bảo trải nghiệm người dùng liền mạch 100%.

---

## 6. Hướng dẫn Cấu hình Bật/Tắt Phương thức Xác thực (`AUTH_ENABLED_METHODS`)

Hệ thống cho phép Quản trị viên tùy biến hoàn toàn các phương thức xác thực được phép sử dụng thông qua biến môi trường `AUTH_ENABLED_METHODS` hoặc tệp `config.yaml`.

### 6.1. Các Kịch bản Triển khai Thực tế:

#### Kịch bản 1: Chỉ dùng 1 Phương thức Duy nhất (Password-Only hoặc OTP-Only)
- **Chỉ dùng Mật khẩu truyền thống:**
  ```ini
  AUTH_ENABLED_METHODS=password
  ```
  *(Mọi request gửi OTP hoặc Magic Link sẽ bị hệ thống từ chối ngay với mã lỗi `AUTH_METHOD_DISABLED`)*.

- **Chỉ dùng OTP không cần mật khẩu (Passwordless Pure):**
  ```ini
  AUTH_ENABLED_METHODS=email_otp
  ```
  *(Các endpoint `POST /api/v1/auth/signin` và `POST /api/v1/auth/signup` bằng password sẽ bị chặn hoàn toàn)*.

#### Kịch bản 2: Dùng 2 Phương thức (Passwordless Hiện đại: Email OTP + Magic Link)
```ini
AUTH_ENABLED_METHODS=email_otp,magic_link
```
- Người dùng có thể tùy chọn nhận mã số 6 số (OTP) hoặc bấm vào link trong email để đăng nhập tức thì. Không cần nhớ bất kỳ mật khẩu nào.

#### Kịch bản 3: Tổ hợp Doanh nghiệp (Enterprise Hybrid: Password + SSO)
```ini
AUTH_ENABLED_METHODS=password,google,github
```
- Hỗ trợ nhân viên nội bộ đăng nhập bằng mật khẩu công ty hoặc Đăng nhập 1-chạm thông qua Google Workspace / GitHub Organization.

#### Kịch bản 4: Kích hoạt Toàn bộ các Phương thức (All Methods Enabled)
```ini
# Sử dụng ký tự đại diện '*'
AUTH_ENABLED_METHODS=*

# Hoặc liệt kê chi tiết:
AUTH_ENABLED_METHODS=password,email_otp,phone_otp,magic_link,google,github,passkey
```

### 6.2. Phản hồi Lỗi khi Phương thức Bị Tắt (HTTP 403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "AUTH_METHOD_DISABLED",
    "message": "Phương thức xác thực [password] hiện đang bị vô hiệu hóa bởi chính sách quản trị",
    "details": null
  },
  "timestamp": "2026-10-14T10:15:00.000Z"
}
```

---

## 7. Thiết kế Đa hình Dịch vụ Gửi Mail & Sinh Token/OTP (Polymorphism Architecture)

Hệ thống áp dụng triệt để nguyên lý **Strategy Pattern** và **Dependency Inversion Principle** (SOLID) cho các dịch vụ gửi thông báo và sinh mã xác thực:

### 7.1. Đa hình Dịch vụ Gửi Mail (`IMailSenderStrategy`)

```
               ┌───────────────────────────────┐
               │    <<interface / abstract>>   │
               │      BaseMailSenderStrategy   │
               └───────────────▲───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
┌───────────────────────────┐         ┌───────────────────────────┐
│ ConsoleMailSenderStrategy │         │   SmtpMailSenderStrategy  │
│  - Mặc định Dev & Docker  │         │  - Gửi mail thật qua SMTP │
│  - Không cần cấu hình     │         │  - Tích hợp Nodemailer    │
│  - In mã OTP trực tiếp    │         │  - Hỗ trợ TLS/SSL & Auth  │
│    ra terminal logs       │         │  - Gmail / SES / SendGrid │
└───────────────────────────┘         └───────────────────────────┘
```

- **Chuyển đổi tức thì qua cấu hình:**
  - `MAIL_STRATEGY=console`: Phù hợp chạy Local, CI/CD Test và Docker Compose. Không phụ thuộc mạng Internet bên ngoài.
  - `MAIL_STRATEGY=smtp`: Tự động nạp tài khoản SMTP thật từ `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

---

### 7.2. Đa hình Cơ chế Sinh & Băm Token/OTP (`BaseOtpStrategy`)

```
               ┌───────────────────────────────┐
               │    <<interface / abstract>>   │
               │        BaseOtpStrategy        │
               │  - hashToken(token): SHA-256  │
               │  - verify(raw, hash): Safe    │
               └───────────────▲───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
┌───────────────────────────┐         ┌───────────────────────────┐
│     NumericOtpStrategy    │         │     MagicLinkStrategy     │
│  - 6 chữ số ngẫu nhiên    │         │  - 32 bytes (Base64URL)   │
│  - Hiệu lực: 5 phút       │         │  - Hiệu lực: 15 phút      │
│  - Giới hạn: 5 lần thử    │         │  - Chống Brute Force      │
│  - Băm SHA-256 vào DB     │         │  - URL 1-chạm không pass  │
└───────────────────────────┘         └───────────────────────────┘
```

- **Nguyên tắc An toàn Bảo mật Tuyệt đối (Security Guarantees):**
  1. **Không bao giờ lưu mã thô trong DB:** Mã OTP và Token Magic Link được băm ngay lập tức bằng thuật toán **SHA-256** trước khi ghi vào bảng `verification_tokens`. Dù hacker dump được DB cũng không thể lấy được mã OTP plaintext!
  2. **So sánh An toàn Thời gian (Timing-Safe Equality):** Đối soát băm qua hàm `crypto.timingSafeEqual` để triệt tiêu hoàn toàn tấn công kênh phụ đo độ trễ (Timing Attack).
  3. **Chống Tấn công Tái sử dụng (Replay Attack Prevention):** Ngay khi người dùng xác thực thành công, bản ghi token lập tức được đánh dấu `consumedAt = now()`. Mọi nỗ lực gửi lại cùng mã đều bị từ chối với lỗi `AUTH_OTP_EXPIRED`.
  4. **Giới hạn Thử sai Tối đa (Brute-Force Lockout):** Sau 5 lần nhập sai mã, bản ghi bị khóa vĩnh viễn (`AUTH_OTP_MAX_ATTEMPTS_EXCEEDED`).

---

## 0. Chế độ Port Tự động (Port Auto-Increment)

### 0.1. Mục tiêu

Khi khởi động, nếu cổng cấu hình (`PORT`, mặc định `3001`) **đã bị chiếm** bởi tiến trình khác
(mã lỗi `EADDRINUSE`), hệ thống **không crash** mà tự động tăng port lên 1 đơn vị và thử lại,
**cho đến khi gặp cổng chưa bị chiếm thì bind thành công**. Toàn bộ logic nằm tại
`src/common/utils/port.util.ts` (`listenWithPortFallback`) và được `src/main.ts` gọi lúc bootstrap.

### 0.2. Biến cấu hình

| Biến môi trường | Mặc định | Ý nghĩa |
|---|:---:|---|
| `PORT` | `3001` | Cổng khởi động mong muốn |
| `PORT_AUTO_INCREMENT` | `true` | Bật/tắt cơ chế tự động tăng port khi `EADDRINUSE`. Đặt `false` để crash ngay nếu port bị chiếm (hành vi cũ) |
| `PORT_MAX_ATTEMPTS` | `20` | Số lần thử cổng tối đa. Ví dụ `20` -> quét dải `[PORT, PORT + 19]` |

### 0.3. Thuật toán (pseudocode)

```text
actualPort = PORT
lặp attempt = 1 .. PORT_MAX_ATTEMPTS:
    thử app.listen(actualPort)
        THÀNH CÔNG  -> trả về actualPort (log URL thật theo cổng này)
        LỖI EADDRINUSE && PORT_AUTO_INCREMENT=true:
            attempt < MAX -> cảnh báo "Cổng X đang bị chiếm...", actualPort += 1, thử tiếp
            attempt = MAX -> ném: "Không tìm được cổng trống trong khoảng A - B"
        LỖI KHÁC (EACCES, ...) hoặc PORT_AUTO_INCREMENT=false -> ném thẳng, không thử cổng khác
```

### 0.4. Luồng chi tiết & các trường hợp biên

1. **Port trống ngay lần đầu:** bind đúng `PORT`, chỉ gọi `listen` 1 lần (không phát sinh thêm chi phí).
2. **Port bị chiếm N lần liên tiếp:** thử `3001 -> 3002 -> ...` cho tới cổng trống.Ví dụ `3001, 3002, 3003` bị chiếm -> server lắng nghe tại `3004`.
3. **Cả dải bị chiếm:** sau `PORT_MAX_ATTEMPTS` lần, ném lỗi rõ ràng kèm khoảng cổng đã quét (thay vì crash vô nghĩa kiểu `EADDRINUSE` trần).
4. **Lỗi không phải `EADDRINUSE`:** ví dụ `EACCES` (cổng < 1024 không có quyền) -> ném **ngay lập tức**, không tự tăng port (tăng port cũng không giải quyết được).
5. **Tắt cơ chế (`PORT_AUTO_INCREMENT=false`):** giữ hành vi cổ điển - `EADDRINUSE` là crash.
6. **Swagger & log URL:** được in **sau khi bind thành công** và dùng **cổng thực tế** (`actualPort`), không phải cổng cấu hình gốc - tránh log sai khi port bị dịch.

### 0.5. Ví dụ log thực tế (cổng 3001-3003 bị chiếm)

```text
[Bootstrap] WARN  Cổng 3001 đang bị chiếm. Tự động chuyển sang cổng 3002...
[Bootstrap] WARN  Cổng 3002 đang bị chiếm. Tự động chuyển sang cổng 3003...
[Bootstrap] WARN  Cổng 3003 đang bị chiếm. Tự động chuyển sang cổng 3004...
[Bootstrap] LOG   Tài liệu Swagger UI sẵn sàng tại: http://localhost:3004/docs
[Bootstrap] LOG   Authentication Service đang lắng nghe tại: http://localhost:3004/api
```

### 0.6. Lưu ý triển khai

- **Docker / docker-compose:** auto-increment phù hợp khi chạy **host** (dev cục bộ). Trong container có port mapping cố định, nếu `EADDRINUSE` xảy ra bên trong container thì cổng mới cũng không được map ra host - nên cấp phát cổng qua `-p` của Docker thay vì dựa vào auto-increment.
- Client/Frontend nên đọc cổng thực từ log hoặc từ service discovery; khi cần only định cổng cứng hãy đặt `PORT_AUTO_INCREMENT=false`.
- Tính năng được kiểm chứng tự động bởi `test/port-fallback.spec.ts` (5 kịch bản: port trống, chiếm N lần, cạn dải, tắt cơ chế, lỗi `EACCES`).

---

## 8. Hướng dẫn Cấu hình Biến Môi trường `.env` Chuẩn Hoàn chỉnh

```ini
# ------------------------------------------------------------------------------
# 1. Ứng dụng & Mạng
# ------------------------------------------------------------------------------
NODE_ENV=development
PORT=3001
# Tự động tăng port khi cổng bị chiếm (EADDRINUSE) - xem Mục 0
PORT_AUTO_INCREMENT=true
PORT_MAX_ATTEMPTS=20
APP_NAME=Authentication Service
# BẮT BUỘC: base URL front-end để dựng link magic-link/verify-email (không còn default localhost trong code).
# redirectUrl (magic-link) phải CÙNG ORIGIN với giá trị này.
CLIENT_URL=http://localhost:3000

# ------------------------------------------------------------------------------
# 2. Cơ sở dữ liệu mặc định: PostgreSQL (Hỗ trợ đổi sang MySQL)
# ------------------------------------------------------------------------------
DB_TYPE=postgres
# Khi chạy 'npm run start:dev' trên máy Host: dùng 'localhost'
# Khi chạy trong Docker Compose: dùng 'postgres'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=authentication
DB_SYNCHRONIZE=true
DB_LOGGING=false
DB_SSL=false

# ------------------------------------------------------------------------------
# 3. JSON Web Token & Refresh Token
# ------------------------------------------------------------------------------
JWT_SECRET=<secret-manh-toi-thieu-16-ky-tu-cap-qua-env>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7

# ------------------------------------------------------------------------------
# 4. Thuật toán băm mật khẩu đa hình: Argon2id (OWASP recommended) / Bcrypt
# ------------------------------------------------------------------------------
HASH_DEFAULT_ALGORITHM=argon2id
HASH_ARGON2_MEMORY_COST=65536
HASH_ARGON2_TIME_COST=3
HASH_ARGON2_PARALLELISM=1
HASH_BCRYPT_ROUNDS=12

# ------------------------------------------------------------------------------
# 5. Cấu hình Bật/Tắt Phương thức Xác thực (Auth Methods)
# ------------------------------------------------------------------------------
# Danh sách cách nhau bởi dấu phẩy, hoặc '*' để bật toàn bộ:
# password,email_otp,phone_otp,magic_link,google,github,passkey
AUTH_ENABLED_METHODS=password,email_otp,phone_otp,magic_link,google,github,passkey
AUTH_OTP_LENGTH=6
AUTH_OTP_EXPIRES_IN_SECONDS=300
AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS=900

# ------------------------------------------------------------------------------
# 6. Dịch vụ Gửi Email Đa hình (Console Log vs SMTP Thực tế)
# ------------------------------------------------------------------------------
# 'console' (ghi ra terminal/docker log - mặc định cho Dev) hoặc 'smtp' (gửi qua Mail Server thực tế)
MAIL_STRATEGY=smtp
MAIL_FROM=you@example.com

# Cấu hình SMTP khi MAIL_STRATEGY=smtp:
# - Với Google Gmail: host 'smtp.gmail.com', port 587 (STARTTLS với SMTP_SECURE=false)
# - SMTP_PASS: Mật khẩu ứng dụng (Google App Password). Hệ thống tự động làm sạch khoảng trắng.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=<google-app-password-cap-qua-env>

# ------------------------------------------------------------------------------
# 7. Swagger OpenAPI UI
# ------------------------------------------------------------------------------
SWAGGER_ENABLED=true
SWAGGER_PATH=docs

# ------------------------------------------------------------------------------
# 8. Email Verification & Cache RBAC
# ------------------------------------------------------------------------------
# true = tự động gửi link xác minh email khi đăng ký (best-effort, không chặn login)
AUTH_EMAIL_VERIFICATION_ENABLED=false
# TTL cache quyền RBAC in-memory (ms). Đặt 0 để tắt cache
AUTH_RBAC_CACHE_TTL_MS=60000

# ------------------------------------------------------------------------------
# 9. Rate Limiting chống Brute-Force (@nestjs/throttler)
# ------------------------------------------------------------------------------
# Cửa sổ mặc định: THROTTLE_LIMIT request / THROTTLE_TTL ms (theo IP)
THROTTLE_TTL=60000
THROTTLE_LIMIT=20

# ------------------------------------------------------------------------------
# 10. OAuth 2.0 (Google & GitHub) - CHỈ hoạt động khi có credentials thật
# ------------------------------------------------------------------------------
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback

# ------------------------------------------------------------------------------
# 11. MFA / TOTP & Passkey (WebAuthn)
# ------------------------------------------------------------------------------
MFA_ISSUER=AgentCloud Auth
MFA_RECOVERY_CODE_COUNT=8
# Khóa AES-256-GCM cho TOTP secret & OAuth token. KHUYẾN NGHỊ đặt riêng (khác JWT_SECRET);
# để trống -> fallback JWT_SECRET (vẫn an toàn vì bắt buộc), nhưng nên tách khóa.
MFA_ENCRYPTION_KEY=
WEBAUTHN_RP_NAME=AgentCloud
# rpId/origin KHÔNG còn default localhost trong code -> PHẢI cấp env. Prod: domain thật + https://.
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3001

# ------------------------------------------------------------------------------
# 12. Redis (tuy chon) - BAT/TAT bang ON_REDIS
# ------------------------------------------------------------------------------
# ON_REDIS=true  -> RBAC cache, Throttler storage, WebAuthn challenge dung Redis (scale ngang).
# ON_REDIS=false -> in-memory (mac dinh, chi 1 instance).
# env LUU UU TIEN hon redis: trong config.yaml.
ON_REDIS=false
# REDIS_URL=redis://localhost:6379/0   # neu co thi uu tien cao nhat
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ------------------------------------------------------------------------------
# 13. Cứng hóa Bảo mật / Vận hành (mặc định an toàn trong code; chỉ override khi cần)
# ------------------------------------------------------------------------------
# (compose) Cổng HOST publish + tag image pinned (KHÔNG dùng latest).
AUTH_HOST_PORT=3001
DB_HOST_PORT=5432
REDIS_HOST_PORT=6379
IMAGE_TAG=0.0.1
# Số hop proxy tin cậy sau Nginx (false/0 = KHÔNG tin X-Forwarded-For; req.ip là socket thật).
TRUST_PROXY=
# Allowlist origin CORS, phân tách dấu phẩy. Trống -> non-prod phản ánh mọi origin; prod ĐÓNG cross-origin.
CORS_ORIGIN=
# Chống CSRF cho OAuth (state) - cần express-session. Mặc định false.
OAUTH_STATE=false
# Mặc định XÁC THỰC cert TLS (an toàn). Chỉ tắt khi dev/self-signed:
SMTP_TLS_INSECURE=false
DB_SSL_REJECT_UNAUTHORIZED=true
# Timeout (ms) cho giao tiếp ngoài.
SMTP_TIMEOUT_MS=10000
DB_POOL_CONNECT_TIMEOUT_MS=10000
HTTP_KEEPALIVE_TIMEOUT_MS=65000
```

> [!NOTE]
> **Health check:** `GET /api/v1/health` (Terminus, ping DB) trả `{"status":"ok",...}` — dùng cho liveness/readiness probe của Docker/Nginx. `auth-service` trong `docker-compose.yml` đã có `HEALTHCHECK` probe endpoint này.

> [!TIP]
> **Kết quả Kiểm thử Gửi Email Thật qua Google SMTP (Đã xác minh Live trên Docker):**
> - **Gửi mã OTP (`POST /api/v1/auth/otp/send`):** Đã chuyển thành công tới hòm thư kiểm thử, Google SMTP phản hồi Message ID.
> - **Gửi Magic Link (`POST /api/v1/auth/magic-link/send`):** Đã chuyển thành công tới hòm thư kiểm thử, Google SMTP phản hồi Message ID.
> - **Lưu ý kiểm tra:** Email gửi từ dịch vụ lập trình có thể xuất hiện trong hòm thư đến (Inbox) hoặc mục Thư rác (Spam / Junk) của Gmail. Người dùng có thể bấm "Báo cáo không phải spam" để thư các lần sau vào thẳng Inbox.

---

## 9. Lệnh Kiểm thử, Kiểm tra Mã nguồn và Biên dịch

```bash
# 1. Unit/Integration test (mock): 81 tests / 16 files - KHÔNG cần DB.
npm run test

# 2. E2E test (HTTP thật + PostgreSQL thật) - xem mục 9.1 bên dưới.
npm run test:e2e

# 3. Kiểm tra chất lượng mã nguồn bằng Linter siêu tốc (Oxlint)
npm run lint

# 4. Biên dịch mã nguồn NestJS TypeScript
npm run build

# 5. Khởi chạy trên Docker Compose
docker compose up -d --build

# 6. Khởi chạy môi trường phát triển trên Host (Hot-reload)
npm run start:dev
```

### 9.1. E2E Test (DB thật) - Cách chạy

Bộ `test/e2e/*.e2e-spec.ts` gọi **endpoint HTTP thật** trên **PostgreSQL thật** (routing, validation,
guard, service, repository, DB đều thật). Tự động **skip** toàn bộ nếu không kết nối được DB.

```bash
# B1: Dựng Postgres chuyên dụng cho E2E (host 127.0.0.1:5432)
npm run test:e2e:db:up        # docker compose up -d postgres

# B2: Chạy E2E (nối tiếp từng file, tránh race TRUNCATE)
npm run test:e2e

# (tùy chọn) Dọn
docker exec auth-postgres psql -U postgres -c "DROP DATABASE IF EXISTS authentication_e2e;"
```

> **Cú pháp DB mặc định của harness:** `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USERNAME=postgres`,
> `DB_PASSWORD=your_password`, `DB_DATABASE=authentication_e2e`, `DB_SYNCHRONIZE=true`.
> Harness `TRUNCATE` 21 bảng trước mỗi test để cách ly tuyệt đối, và đã **tắt rate-limit** (override `ThrottlerStorage`)
> nên `@Throttle` không gây 429. Mọi biến `DB_*` có thể override bằng env thật khi chạy CI.

**Phủ sóng E2E theo phương thức:**

| File | Phương thức / Hành vi được kiểm (DB + HTTP thật) |
|---|---|
| `auth-password.e2e-spec.ts` | Signup, signin, sai mk, khóa 5 lần, `/me`, RBAC 403, refresh rotation + reuse detection, signout, change-password, sessions |
| `otp-magiclink.e2e-spec.ts` | Email OTP (signup/login), sai OTP, khóa OTP, Phone OTP, Magic Link verify + chống replay |
| `email-verification-mfa.e2e-spec.ts` | Email Verification (verify + chống replay), MFA/TOTP setup/verify, recovery codes, `/mfa/factors`, V2 `security-capabilities` |
| `passkey.e2e-spec.ts` | Passkey register/authenticate, lưu `passkey_credentials`, challenge single-use |
| `oauth.e2e-spec.ts` | OAuth Google/GitHub: redirect 302 (client_id từ `gg-provider.json`), callback tạo/link user + `oauth_tokens`, 403 khi chưa cấu hình |

**3 boundary được stub (bất khả thi khi test headless, nằm NGOÀI business logic):**
1. **Mail sender** → fake `MailCapture` để bắt OTP/token raw (vì DB chỉ lưu SHA-256, không thể suy ra mã thật).
2. **WebAuthn verify** → stub `verifyRegistrationResponse`/`verifyAuthenticationResponse` (cần authenticator vật lý); `generate*` và chữ ký challenge vẫn thật.
3. **OAuth provider round-trip** → override guard để tiêm `req.user` đã normalize (không gọi được Google/GitHub thật); controller → `OAuthService` → DB vẫn thật.

> Đơn vị `OAuthService`/`MfaService`/`VerificationService` còn được kiểm thêm bằng unit test mock
> (`oauth-callback`, `google-oauth-provider`, `totp-mfa`, `email-verification`) đã có từ trước.

---

## 10. Rate Limiting chống Brute-Force (`@nestjs/throttler`)

Bên cạnh cơ chế **khóa tài khoản sau 5 lần sai mật khẩu** (cấp ứng dụng), hệ thống nay bổ sung **giới hạn tần suất cấp HTTP** theo IP bằng `@nestjs/throttler`, chặn đứng brute-force/DoS ngay tại cửa ngõ.

### 10.1. Cấu hình mặc định toàn cục
- Đăng ký `ThrottlerModule` + `ThrottlerGuard` (APP_GUARD) trong `src/app.module.ts`.
- Mặc định: `THROTTLE_LIMIT` request trong mỗi cửa sổ `THROTTLE_TTL` ms (theo IP), ap dụng cho **mọi** endpoint.

### 10.2. Hạn mức riêng theo endpoint (`@Throttle`)

| Endpoint | TTL | Giới hạn (request/cửa sổ) |
|---|:---:|:---:|
| `POST /auth/signup` | 60s | 5 |
| `POST /auth/signin` (V1 & V2) | 60s | 10 |
| `POST /auth/otp/send` | 60s | 3 |
| `POST /auth/otp/verify` | 60s | 10 |
| `POST /auth/magic-link/send` | 60s | 3 |
| `POST /auth/magic-link/verify` | 60s | 10 |
| `POST /auth/email-verification/send` | 60s | 3 |
| `POST /auth/mfa/totp/setup` | 60s | 5 |
| `POST /auth/mfa/totp/verify` | 60s | 10 |
| `POST /auth/mfa/recovery/verify` | 60s | 5 |
| `POST /auth/mfa/passkey/*` | 60s | 5 - 10 |
| `GET /auth/google` / `/auth/github` (+callback) | 60s | 10 |

### 10.3. Phản hồi khi vượt ngưỡng (HTTP 429 Too Many Requests)
```json
{
  "success": false,
  "error": {
    "code": "THROTTLE_EXCEEDED",
    "message": "Threat detected, Temporarily rate-limited from \"::ffff:127.0.0.1\". Please try again later",
    "details": null
  },
  "timestamp": "2026-10-15T08:00:00.000Z"
}
```

> [!NOTE]
> Bộ đếm throttle lưu **in-memory theo tiến trình node**. Khi scale ngang nhiều instance cần chuyển sang `ThrottlerStorageRedisService` (ngoại phạm vi lần này).

---

## 11. Xác minh Email (Email Verification)

Hệ thống cho phép xác minh quyền sở hữu email bằng link 1-chạm, dùng lại bảng `verification_tokens` (purpose = `verify_email`).

### 11.1. Luồng tổng thể
1. Người dùng đăng ký (hoặc chủ động gọi `/email-verification/send`).
2. Hệ thống sinh token 32 bytes (Base64URL, entropy 256-bit), **băm SHA-256** rồi lưu DB, hiệu lực **24 giờ**.
3. Email gửi tới `CLIENT_URL/auth/email/verify?token=<raw>` qua chiến lược Mail đa hình (`console`/`smtp`).
4. Khi người dùng bấm link, frontend trích `token` và gửi lên `POST /api/v1/auth/email-verification/verify`.
5. Server đối soát hash bằng `crypto.timingSafeEqual`, đánh dấu `user_emails.verifiedAt = now`, **hủy token ngay** (chống Replay Attack).

> Nếu `AUTH_EMAIL_VERIFICATION_ENABLED=true`, bước gửi email được **tự động kích hoạt khi đăng ký** (best-effort, không chặn luồng login nếu gửi mail thất bại).

### 11.2. Gửi email xác minh (`POST /api/v1/auth/email-verification/send`)

- **Xác thực:** Bearer Token (yêu cầu đã đăng nhập). Gửi tới email primary của chính tài khoản.
- **Request Body:** Không có.

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Đã gửi email xác minh tới nguyenvana@example.com"
  },
  "timestamp": "2026-10-15T08:10:00.000Z"
}
```

### 11.3. Xác thực token xác minh (`POST /api/v1/auth/email-verification/verify`)

- **Xác thực:** Public (không cần token - người dùng chưa đăng nhập vẫn xác minh được).

#### Request Body Mẫu:
```json
{ "token": "ZuMvC1EwYNIO74ts_6Pz2pcrU4HfhZZBtxVqK-oZDjQ" }
```

#### Phản hồi Thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Xác minh email thành công",
    "email": "nguyenvana@example.com"
  },
  "timestamp": "2026-10-15T08:12:00.000Z"
}
```

#### Trường hợp Lỗi:
- **Token sai/hết hạn/đã dùng (HTTP 401):** `AUTH_OTP_EXPIRED` - "Link xác minh email không hợp lệ hoặc đã hết hạn."

#### cURL Mẫu:
```bash
curl -X POST http://localhost:3001/api/v1/auth/email-verification/send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

curl -X POST http://localhost:3001/api/v1/auth/email-verification/verify \
  -H "Content-Type: application/json" \
  -d '{ "token": "ZuMvC1EwYNIO74ts_6Pz2pcrU4HfhZZBtxVqK-oZDjQ" }'
```

---

## 12. OAuth 2.0 - Google & GitHub (Passport Strategies)

Mở rộng Unified Identity Model: Google/GitHub trở thành một `UserIdentity` trỏ về cùng `UserEntity` duy nhất.

> [!IMPORTANT]
> Các endpoint OAuth **chỉ hoạt động khi đã cấu hình `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (hoặc GitHub)**. Nếu chưa cấu hình hoặc phương thức bị tắt trong `AUTH_ENABLED_METHODS`, guard sẽ chặn request và trả về `AUTH_METHOD_DISABLED` (HTTP 403) thay vì crash.

### 12.1. Luồng Authorization Code (PKCE do provider quản lý)
1. Client mở `GET /api/v1/auth/google` -> server 302 redirect tới trang consent của Google.
2. Người dùng đồng ý -> Google redirect về `GET /api/v1/auth/google/callback?code=...`.
3. `OAuthService.handleProviderLogin` dùng code đổi lấy profile, chuẩn hóa về `OAuthProfile`.
4. **Hợp nhất tài khoản:**
   - Identity (`provider` + `providerUserId`) đã tồn tại -> đăng nhập trực tiếp.
   - Email provider trả về **đã verified** và trùng email trong `user_emails` -> auto-link identity vào `user.id` hiện có.
   - Ngược lại -> tạo user mới (chống chiếm tài khoản: **không** auto-link nếu provider chưa verify email).
5. Provider access/refresh token được **mã hóa AES-256-GCM** lưu vào bảng `oauth_tokens`.
6. Cấp cặp token JWT (access + refresh) như các phương thức khác.

### 12.2. Danh sách endpoint
| Method | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/api/v1/auth/google` | Redirect tới consent Google |
| `GET` | `/api/v1/auth/google/callback` | Nhận code, cấp cặp token JWT |
| `GET` | `/api/v1/auth/github` | Redirect tới consent GitHub |
| `GET` | `/api/v1/auth/github/callback` | Nhận code, cấp cặp token JWT |

> Mặc định các handler callback trả về **JSON `AuthResponseDto`** (dạng `ApiResponse`) để thuận tiện cho SPA/mobile. Cấu hình `redirectUrl` phía frontend để tự lưu token.

### 12.3. Phản hồi Thành công (callback, HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": { "id": "0192...", "email": "nguyenvana@gmail.com", "roles": ["USER"], "permissions": ["user:profile:read", "..."] }
  },
  "timestamp": "2026-10-15T08:20:00.000Z"
}
```

#### cURL Mẫu:
```bash
curl -X GET http://localhost:3001/api/v1/auth/google -i   # xem Location header để lấy consent URL
```

---

## 13. MFA / TOTP + Recovery Codes (RFC 6238)

Kích hoạt xác thực đa yếu tố bằng ứng dụng (Google Authenticator, Authy...) qua thư viện `otplib`.

### 13.1. Luồng bật MFA
1. `POST /api/v1/auth/mfa/totp/setup` (Bearer) -> trả `otpauthUrl` (vẽ QR) + `factorId`. Secret được **mã hóa AES-256-GCM** trước khi ghi `mfa_factors.secret_enc` (bytea). Factor ở trạng thái **chờ** (chưa bật).
2. Người dùng nhập mã 6 số từ app -> `POST /api/v1/auth/mfa/totp/verify`.
3. Verify thành công **lần đầu**: bật factor (`isEnabled=true`, `verifiedAt=now`) và phát hành **8 recovery codes** (chỉ hiển thị 1 lần, chỉ lưu hash SHA-256).

### 13.2. Danh sách endpoint (tất cả yêu cầu Bearer Token)
| Method | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/api/v1/auth/mfa/totp/setup` | Sinh secret + otpauth URL |
| `POST` | `/api/v1/auth/mfa/totp/verify` | Xác minh mã, bật factor + trả recovery codes |
| `GET` | `/api/v1/auth/mfa/factors` | Liệt kê factor đã bật + số recovery code còn lại |
| `POST` | `/api/v1/auth/mfa/recovery/verify` | Dùng 1 recovery code (dùng một lần) |
| `DELETE` | `/api/v1/auth/mfa/factors/{factorId}` | Tắt factor + thu hồi recovery codes |

#### cURL Mẫu:
```bash
# B1: setup
curl -X POST http://localhost:3001/api/v1/auth/mfa/totp/setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# -> { "otpauthUrl": "otpauth://totp/AgentCloud%20Auth:user@example.com?secret=...&issuer=..." }

# B2: verify mã 6 số
curl -X POST http://localhost:3001/api/v1/auth/mfa/totp/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{ "code": "123456" }'
```

#### Phản hồi verify thành công (HTTP 200 OK):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "recoveryCodes": ["A1B2C3D4-E5F6A7B8", "..."]
  },
  "timestamp": "2026-10-15T08:30:00.000Z"
}
```

> [!WARNING]
> Nếu user **đã bật** MFA/TOTP, `POST /mfa/totp/setup` sẽ từ chối (HTTP 400) để tránh ghi đè secret. Phải `DELETE` factor cũ trước khi cấu hình lại.

---

## 14. Passkey - WebAuthn / FIDO2

Xác thực passwordless bằng khóa công khai (vân tay, Face ID, Windows Hello, security key) qua `@simplewebauthn/server`. **Private key không bao giờ rời thiết bị**; server chỉ lưu public key + sign count chống replay.

### 14.1. Registration (thêm passkey cho tài khoản đã đăng nhập)
1. `POST /api/v1/auth/mfa/passkey/register/options` (Bearer) -> trả `PublicKeyCredentialCreationOptions` + `challengeId` (hiệu lực 5 phút).
2. Trình duyệt gọi `navigator.credentials.create()` -> nhận `RegistrationResponseJSON`.
3. `POST /api/v1/auth/mfa/passkey/register/verify` (Bearer) kèm `challengeId` + `response` -> server lưu `passkey_credentials` (credentialId, publicKey, signCount...).

### 14.2. Authentication (đăng nhập bằng passkey - Public, discover-by-email)
1. `POST /api/v1/auth/mfa/passkey/authenticate/options` (public, body `{ email }`) -> trả `PublicKeyCredentialRequestOptions` + `challengeId`.
2. `navigator.credentials.get()` -> `AuthenticationResponseJSON`.
3. `POST /api/v1/auth/mfa/passkey/authenticate/verify` (public) kèm `challengeId` + `response` -> cấp cặp token JWT.

#### cURL Mẫu (bước lấy options đăng nhập):
```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/passkey/authenticate/options \
  -H "Content-Type: application/json" \
  -d '{ "email": "nguyenvana@example.com" }'
```

> [!NOTE]
> - **Chống dò tài khoản (user enumeration):** với email không tồn tại, bước authenticate/options vẫn trả về options hợp lệ với `allowCredentials` rỗng, không tiết lộ tài khoản có hay không.
> - `WEBAUTHN_RP_ID` và `WEBAUTHN_ORIGIN` phải khớp chính xác với domain trình duyệt đang dùng (production: tên miền thật, không phải `localhost`).
> - Challenge lưu in-memory có TTL; khi scale ngang cần chuyển sang Redis (ngoại phạm vi lần này).

---

## 15. Ghi chú Tối ưu Hiệu năng

- **Giảm lượt truy vấn DB (Promise.all):** `signUp`, `signIn`, `verifyOtp`, `verifyMagicLink` và `issueSessionAndTokens` đã gộp các thao tác đọc/ghi **độc lập** chạy song song (ví dụ: tạo `provider` + `user`, hay `updateLastLogin` + `getUserAccess` + `findOrCreate device`), giữ đúng thứ tự chặt chẽ cho chuỗi phụ thuộc `user -> identity -> session -> token`.
- **Cache quyền RBAC:** `RbacService.getUserAccess` dung `KeyValueStore` co TTL (`AUTH_RBAC_CACHE_TTL_MS`, mặc định 60s) giảm tải truy vấn bảng role/permission. `assignDefaultAccess` và mọi thao tác gán role tự **vô hiệu cache** của user đó. **Bat `ON_REDIS=true`** -> cache chuyen sang Redis (chia se giua nhieu instance).
- **In-memory vs Redis:** Mac dinh (`ON_REDIS=false`) RBAC cache, Throttler storage va WebAuthn challenge nam trong bo nho tien trinh -> chi dung cho 1 instance. Bat **`ON_REDIS=true`** (xem [Muc 17](#17-redis-tuy-chon--on_redis)) de chung sang Redis va scale ngang an toan.
- **Mã hóa secrets:** TOTP secret, OAuth provider token lưu dạng **AES-256-GCM** (đã xác thực); recovery code và OTP/Magic Link lưu **hash SHA-256** - không bao giờ lưu dạng thô trong DB.

---

## 16. Hướng dẫn Tích hợp (Integration Guide)

Mục này hướng dẫn **kết nối client (web/mobile/backend) vào service** một cách chuẩn mực, theo từng phương thức.

### 16.1. Kiến trúc token & quy tắc lưu trữ

| Token | Bản chất | Nơi lưu KHUYẾN NGHỊ | Vòng đời |
|---|---|---|---|
| `accessToken` (JWT) | Ngắn hạn, mang `sub/roles/permissions/sessionId` | Bộ nhớ RAM phía client (không ghi đĩa) | `JWT_EXPIRES_IN` (mặc định 15m) |
| `refreshToken` | Dài hạn, **xoay vòng (rotation)**, phát hiện dùng lại | **httpOnly cookie** hoặc secure storage (Keychain/Keystore). **Tránh `localStorage` ở production** | `REFRESH_TOKEN_EXPIRES_DAYS` (mặc định 7d) |

> Vì refresh token **đổi mới sau mỗi lần refresh**, client **phải ghi lại token mới** từ response của `/auth/refresh`, nếu không sẽ kích hoạt *Reuse Detection* và bị thu hồi toàn bộ phiên.

### 16.2. Wrapper HTTP tự động làm mới token (Axios - mẫu)

```ts
import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

let accessToken: string | null = null;

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// Tự động refresh khi gặp 401 (AUTH_TOKEN_EXPIRED / AUTH_TOKEN_INVALID)
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      accessToken = data.data.accessToken;          // cập nhật token MỚI (rotation)
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    }
    return Promise.reject(err);
  },
);
```

**Quy tắc gọi API chuẩn:**
1. Đọc `response.success` (boolean) trước khi đụng tới `data`.
2. Khi `success === false`, map `error.code` → hành vi UI (xem 16.4), **không** so sánh chuỗi `error.message`.
3. Endpoint công khai (signin/signup/otp/refresh) không cần `Authorization`; endpoint Bearer luôn gửi header `Authorization: Bearer <accessToken>`.

### 16.3. Tích hợp theo từng phương thức xác thực

#### a) Mật khẩu (Password)
`POST /auth/signup` hoặc `POST /auth/signin` → nhận `AuthResponseDto`. Lưu `accessToken` (RAM) + `refreshToken` (httpOnly cookie) → gọi `/auth/me` để tải quyền.

#### b) Email/Phone OTP
1. `POST /auth/otp/send` (target + channel + purpose). 2. Nhập mã → `POST /auth/otp/verify` (tự tạo tài khoản nếu chưa có). Xử lý `AUTH_OTP_INVALID` (còn N lần thử), `AUTH_OTP_MAX_ATTEMPTS_EXCEEDED` (HTTP 429), `AUTH_OTP_EXPIRED` (gửi lại mã).

#### c) Magic Link
`POST /auth/magic-link/send` → user bấm link (`?token=...`) → frontend trích `token` gọi `POST /auth/magic-link/verify`.

#### d) Email Verification
Sau signup, gọi `POST /auth/email-verification/send` (Bearer) để gửi lại link; user bấm link → `POST /auth/email-verification/verify` kèm `token`.

#### e) OAuth Google / GitHub (redirect-based)
```ts
// B1: đẩy user sang trang consent (server trả 302 redirect)
window.location.href = '/api/v1/auth/google';
// B2: Google callback về server, server trả JSON/302 kèm cặp token về frontend:
//     http://localhost:3000/auth/callback?accessToken=...&refreshToken=...
```
> **SPA/Popup:** mở `window.open('/api/v1/auth/google')`, lắng nghe `postMessage` từ trang callback để nhận token mà không tải lại trang.
> **Bắt buộc:** khai báo Redirect URI `http://localhost:3001/api/v1/auth/google/callback` trong Google/GitHub Console.

#### f) MFA / TOTP (luồng client)
```ts
// 1) Lấy otpauth URL -> vẽ QR (thư viện qrcode) cho user quét
const setup = (await api.post('/auth/mfa/totp/setup')).data;
renderQR(setup.data.otpauthUrl);
// 2) User nhập mã 6 số từ app -> bật MFA, lưu recovery codes (CHỈ hiển thị 1 lần)
const res = await api.post('/auth/mfa/totp/verify', { code: '123456' });
promptUserToSave(res.data.recoveryCodes);
```

#### g) Passkey (WebAuthn) - dùng `@simplewebauthn/browser`
```ts
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Đăng ký passkey (đã đăng nhập)
const opts = (await api.post('/auth/mfa/passkey/register/options')).data;
const attResp = await startRegistration(opts.data);        // navigator.credentials.create()
await api.post('/auth/mfa/passkey/register/verify', { challengeId: opts.data.challengeId, response: attResp });

// Đăng nhập bằng passkey (public)
const aopts = (await api.post('/auth/mfa/passkey/authenticate/options', { email })).data;
const asrtResp = await startAuthentication(aopts.data);     // navigator.credentials.get()
const { data } = await api.post('/auth/mfa/passkey/authenticate/verify', { challengeId: aopts.data.challengeId, response: asrtResp });
accessToken = data.accessToken;
```
> WebAuthn yêu cầu **HTTPS** (hoặc `localhost` khi dev) và `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` phải khớp đúng domain.

### 16.4. Xử lý lỗi chuẩn hóa (Error Contract)

Phân phối theo `error.code` (không phụ thuộc message):

| `error.code` | HTTP | Hành vi UI khuyến nghị |
|---|:---:|---|
| `VALIDATION_ERROR` | 400 | Highlight `error.details[].field` + `constraints` lên form |
| `AUTH_INVALID_CREDENTIALS` | 401 | Thông báo sai thông tin (không tiết lộ email có tồn tại hay không) |
| `AUTH_ACCOUNT_LOCKED` | 401 | Hiển thị `details.minutesRemaining`, khóa nhập lại |
| `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` | 401 | Tự động gọi `/auth/refresh`; thất bại → về login |
| `AUTH_TOKEN_REUSED` | 401 | Ép logout toàn bộ, về login (có thể bị đánh cắp) |
| `AUTH_METHOD_DISABLED` | 403 | Ẩn/ vô hiệu nút phương thức đó |
| `FORBIDDEN_ROLE` / `FORBIDDEN_PERMISSION` | 403 | Trang 403 / ẩn menu không đủ quyền |
| `AUTH_OTP_MAX_ATTEMPTS_EXCEEDED` / `THROTTLE_EXCEEDED` | 429 | Disable nút, countdown retry-sau |

### 16.5. Phát hiện & kích hoạt phương thức (capability-driven UI)

```ts
// Gọi 1 lần lúc boot để ẩn/hiện nút Google/GitHub/OTP/Passkey
const { enabledMethods } = (await fetch('/api/v1/auth/methods').then((r) => r.json())).data;
const showGoogle  = enabledMethods.includes('google') || enabledMethods.includes('*');
const showPasskey = enabledMethods.includes('passkey') || enabledMethods.includes('*');

// V2: trạng thái MFA/passkey THỰC của tài khoản hiện tại
const caps = (await api.get('/api/v2/auth/security-capabilities')).data;
if (!caps.mfaEnabled) promptEnableMFA();
```

### 16.6. Phân trang & Query (endpoint danh sách)

`GET /auth/audit-logs?page=1&limit=10&status=SUCCESS&sortOrder=DESC` → `PaginatedResult`:
```ts
type Paged<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };
```
Giới hạn: `limit` 1..100, `page >= 1`. Mọi query nằm ngoài whitelist của DTO sẽ bị `forbidNonWhitelisted` chặn (400).

### 16.7. Postman / cURL collection
- Import OpenAPI JSON từ `http://localhost:3001/docs-json` vào Postman (tự sinh mọi endpoint + schema).
- Environment: `{{baseUrl}}=http://localhost:3001/api/v1`, `{{accessToken}}`, `{{refreshToken}}`.
- Pre-request script đồng bộ `accessToken` từ response `signin`/`refresh` vào environment.

### 16.8. Checklist tích hợp production
- [ ] `refreshToken` đặt trong **httpOnly cookie** (không `localStorage`), kèm `SameSite` + `Secure`.
- [ ] Luôn **ghi lại refreshToken mới** sau `/auth/refresh` (rotation).
- [ ] HTTPS bắt buộc (OAuth callback + WebAuthn).
- [ ] Xử lý 401 → refresh 1 lần → retry → nếu vẫn 401 thì logout.
- [ ] Map UI theo `error.code`, hiển thị `VALIDATION_ERROR.details` theo từng field.
- [ ] CI: chạy `npm run test` (81 tests) và `npm run build` trước khi deploy.

---

## 17. Redis (tuy chon) — `ON_REDIS`

Toan bo thanh phan trang thai in-memory (RBAC cache, Throttler storage, WebAuthn challenge) duoc truu tuong hoa qua hop dong **`KeyValueStore` / `ThrottlerStorage`** va **ty dong chon backend theo co** `ON_REDIS`.

### 17.1. Bat/tat

| Cach bat | Ket qua |
|---|---|
| `ON_REDIS=false` (mac dinh) | In-memory. Chi dung cho **1 instance**. |
| `ON_REDIS=true` + `REDIS_HOST/PORT/DB/PASSWORD` hoac `REDIS_URL` | Ket noi Redis; ca 3 thanh phan tren chuyen sang Redis -> **scale ngang an toan**. |
| `redis: { enabled: true }` trong `config.yaml` | Cung bat duoc (khong can env), nhung **env luon uu tien hon yaml**. |

Do thuat (env > yaml > mac dinh): `REDIS_URL` > (`REDIS_HOST`/`REDIS_PORT`/`REDIS_DB`/`REDIS_PASSWORD`), khong co thi doc `redis.*` trong `config.yaml`.

### 17.2. Ai dung Redis khi bat

| Thanh phan | Key pattern | Tai sao |
|---|---|---|
| RBAC cache | `rbac:access:<userId>` | Nhieu instance dung chung cache quyen, khong lech trong window TTL. |
| WebAuthn challenge | `webauthn:challenge:<challenge>` | Request register/authenticate co the rot sang node khac van tim thay challenge. |
| Throttler storage | `throttle:<throttler>:<ip+route>:hits` (+ `:block`) | Gioi han tan suat dong nhat toan cum, khong tinh rieng tung node. |

### 17.3. chay Redis trong Docker

Redis service nam sau **profile** `redis` (mặc định KHÔNG khởi động để không ảnh hưởng khi không dùng):

```bash
# Bat Redis + auth-service dung Redis:
ON_REDIS=true docker compose --profile redis up -d

# Chi Postgres + auth (khong Redis) - nhu mac dinh:
docker compose up -d

# Thoi khong dung nua:
docker compose --profile redis stop redis
```

> Khi chay trong compose voi `ON_REDIS=true`, `REDIS_URL` mac dinh tro `redis://redis:6379/0` (ten dich vu trong mang noib). Chay tren host thi `REDIS_HOST=localhost`.

### 17.4. Kiem chung
- Unit: `test/redis-infra.spec.ts` (KeyValueStore, RedisThrottlerStorage fixed-window, resolver env>yaml).
- E2E: toan bo `npm run test:e2e` (38 tests) chay duoc voi **`ON_REDIS=true`** tro toi Redis that; challenge WebAuthn ghi/nhan key `webauthn:challenge:*` trong Redis.

---

## 18. Danh mục Endpoint đầy đủ

Tien to co dinh: `/api` + URI versioning (`/api/v1`, `/api/v2`). `Auth`: Public = khong can token; Bearer = can `Authorization: Bearer <accessToken>`. Quyen = yeu cau `@RequirePermissions`.

### 18.1. V1 — `/api/v1/auth`
| Method | Duong dan | Auth | Quyen | Rate (60s) | Muc chi tiet |
|---|---|---|---|:---:|---|
| POST | `/signup` | Public | - | 5 | §2.1 |
| POST | `/signin` | Public | - | 10 | §2.2 |
| POST | `/refresh` | Public | - | mac dinh | §2.3 |
| POST | `/signout` | Bearer | - | mac dinh | §2.4 |
| POST | `/signout-all` | Bearer | - | mac dinh | §2.5 |
| GET | `/me` | Bearer | `user:profile:read` | mac dinh | §2.6 |
| POST | `/change-password` | Bearer | `auth:change-password` | mac dinh | §2.7 |
| GET | `/admin/dashboard` | Bearer | ADMIN/SUPER_ADMIN + `user:manage` | mac dinh | §2.8 |
| GET | `/sessions` | Bearer | `auth:session:revoke` | mac dinh | §2.9 |
| DELETE | `/sessions/:sessionId` | Bearer | `auth:session:revoke` | mac dinh | §2.10 |
| GET | `/audit-logs` | Bearer | `user:profile:read` | mac dinh | §2.11 |
| GET | `/methods` | Public | - | mac dinh | §2.12 |
| POST | `/otp/send` | Public | - | 3 | §2.13 |
| POST | `/otp/verify` | Public | - | 10 | §2.14 |
| POST | `/magic-link/send` | Public | - | 3 | §2.15 |
| POST | `/magic-link/verify` | Public | - | 10 | §2.16 |
| POST | `/identities/link` | Bearer | - | mac dinh | §2.17 |
| POST | `/email-verification/send` | Bearer | - | 3 | §11 |
| POST | `/email-verification/verify` | Public | - | 10 | §11 |
| GET | `/google` · `/google/callback` | Public (OAuth) | - | 10 | §12 |
| GET | `/github` · `/github/callback` | Public (OAuth) | - | 10 | §12 |

### 18.2. V1 — `/api/v1/auth/mfa` (MFA/TOTP + Passkey)
| Method | Duong dan | Auth | Rate (60s) | Muc |
|---|---|---|:---:|---|
| POST | `/totp/setup` | Bearer | 5 | §13 |
| POST | `/totp/verify` | Bearer | 10 | §13 |
| GET | `/factors` | Bearer | mac dinh | §13 |
| POST | `/recovery/verify` | Bearer | 5 | §13 |
| DELETE | `/factors/:factorId` | Bearer | mac dinh | §13 |
| POST | `/passkey/register/options` | Bearer | 5 | §14 |
| POST | `/passkey/register/verify` | Bearer | 5 | §14 |
| POST | `/passkey/authenticate/options` | Public | 10 | §14 |
| POST | `/passkey/authenticate/verify` | Public | 10 | §14 |

### 18.3. V2 — `/api/v2/auth`
| Method | Duong dan | Auth | Muc |
|---|---|---|---|
| POST | `/signin` | Public | §3.1 |
| GET | `/security-capabilities` | Bearer | §3.2 (trang thai MFA/passkey THAT) |

### 18.4. V1 — `/api/v1/admin/rbac` (chỉ ADMIN/SUPER_ADMIN — §23)
| Method | Duong dan | Auth | Quyen | Rate (60s) |
|---|---|---|---|:---:|
| GET | `/roles` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | mac dinh |
| POST | `/roles` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | 10 |
| POST | `/roles/:roleId/permissions` | Bearer | ADMIN/SUPER_ADMIN + `permission:manage` | 10 |
| GET | `/roles/:roleId/permissions` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | mac dinh |
| DELETE | `/roles/:roleId/permissions/:code` | Bearer | ADMIN/SUPER_ADMIN + `permission:manage` | 10 |
| DELETE | `/roles/:roleId` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | 10 |
| POST | `/users/:userId/roles` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | 20 |
| DELETE | `/users/:userId/roles/:roleName` | Bearer | ADMIN/SUPER_ADMIN + `role:manage` | 20 |
| GET | `/users/:userId/access` | Bearer | ADMIN/SUPER_ADMIN + `user:manage` | mac dinh |

---

## 19. Catalog mã lỗi & xử lý client

Nguon chan ly cua danh sach ma: `src/common/constants/error-codes.constant.ts` (ban day du + y nghia: [ARCHITECTURE §20](./ARCHITECTURE.md)). Duoi day la hanh vi xu ly khuyen nghi cho client.

| error.code | HTTP | Hanh vi client khuyen nghi |
|---|:---:|---|
| `VALIDATION_ERROR` | 400 | Hien `error.details[].field` + `constraints` len form; khong thu lai ngay |
| `AUTH_INVALID_CREDENTIALS` | 401 | Bao sai thong tin; khong tiet lo email ton tai hay khong |
| `AUTH_ACCOUNT_LOCKED` | 401 | Hien `details.minutesRemaining`; khoa nhap lai trong thoi gian do |
| `AUTH_ACCOUNT_DISABLED` | 401 | Huong dan lien he quan tri vien |
| `AUTH_TOKEN_EXPIRED` / `AUTH_TOKEN_INVALID` | 401 | Goi `/auth/refresh` 1 lan; that bai -> ve login |
| `AUTH_TOKEN_REUSED` | 401 | EP logout toan bo, ve login (nghi ngo danh cap) |
| `AUTH_EMAIL_ALREADY_EXISTS` | 409 | Bao email da ton tai; goi y dang nhap / khac phuc |
| `AUTH_IDENTITY_ALREADY_LINKED` | 409 | Identity da gan user khac; khong cho lien ket |
| `AUTH_PASSWORD_SAME_AS_CURRENT` | 400 | Bao chon mat khau khac |
| `AUTH_METHOD_DISABLED` | 403 | An/vo hieu nut phuong thuc do |
| `AUTH_OTP_INVALID` | 401 | Bao con `N` lan thu giu lai form OTP |
| `AUTH_OTP_EXPIRED` | 401 | Het han/sai token -> goi lai `/otp/send` |
| `AUTH_OTP_MAX_ATTEMPTS_EXCEEDED` / `THROTTLE_EXCEEDED` | 429 | Disable nut, dem nguoc Retry-After |
| `FORBIDDEN_ROLE` / `FORBIDDEN_PERMISSION` | 403 | Trang 403 / an chuc nang thieu quyen |
| `AUTH_USER_NOT_FOUND` | 404 | Ve form dang ky / kiem tra lai input |
| `INTERNAL_SERVER_ERROR` / `DATABASE_ERROR` | 500 | Thong bao loi chung + thu lai sau (backoff) |

---

## 20. Versioning & tương thích ngược

- Chuan **URI Versioning**: moi controller khai bao `@Controller({ path: 'auth', version: '1' | '2' })`. Duong dan: `/api/v1/...`, `/api/v2/...`.
- **Da hinh hoa khong pha vỡ V1**: `AuthV2Controller extends BaseAuthController` chi `override` endpoint can nang cap (vi du `/signin`), giu het cac handler `super.*`. Them **V3** = tao controller moi ke thua Base, khong sưa V1/V2.
- **Chinh sach nang ban**: them truong response (backward-compatible) -> giu nguyen version; doi hinh/loai truong hoac dao hanh bat buoc -> tang version. Khong dung `PATCH` semantics trong 1 version.
- **Header & body**: `Content-Type: application/json`; endpoint Bearer dung `Authorization: Bearer <accessToken>`.

---

## 21. Sơ đồ tuần tự cho client

### 21.1. Login + tự động refresh khi 401
```mermaid
sequenceDiagram
    participant CL as Client
    participant API as /api/v1/auth
    CL->>API: POST /signin
    API-->>CL: 200 {accessToken, refreshToken}
    CL->>API: GET /me (Bearer accessToken)
    alt 401 token het han
        CL->>API: POST /refresh {refreshToken}
        API-->>CL: 200 {accessToken', refreshToken'} (PHAI luu lai)
        CL->>API: retry GET /me
    end
```

### 21.2. OAuth popup (khong tai lai trang)
```mermaid
sequenceDiagram
    participant U as User
    participant SPA as Front-end
    participant POP as Popup /api/v1/auth/google
    SPA->>U: window.open('/api/v1/auth/google')
    POP->>POP: 302 consent -> callback -> cap token
    POP->>SPA: postMessage({accessToken, refreshToken})
    SPA->>SPA: dong popup, luu token
```

### 21.3. Enroll MFA
```mermaid
sequenceDiagram
    participant C as Client
    participant API as /api/v1/auth/mfa
    C->>API: POST /totp/setup
    API-->>C: 200 {otpauthUrl}
    C->>C: ve QR cho app quet
    C->>API: POST /totp/verify {code}
    API-->>C: 200 {recoveryCodes[8]} (hien thi 1 lan)
```

### 21.4. Login bằng Passkey
```mermaid
sequenceDiagram
    participant C as Browser
    participant API as /api/v1/auth/mfa
    C->>API: POST /passkey/authenticate/options {email}
    API-->>C: 200 {options, challengeId}
    C->>C: navigator.credentials.get()
    C->>API: POST /passkey/authenticate/verify {challengeId, response}
    API-->>C: 200 {accessToken, refreshToken}
```

---

## 22. Khắc phục sự cố (Troubleshooting)

| Trieu chung | Nguyen nhan thuong gap | Cach khac phuc |
|---|---|---|
| `EADDRINUSE :::3001` luc boot (tren host) | Cang 3001 bi chiem | `PORT_AUTO_INCREMENT=true` (mac dinh) tu nhay cang; hoac dat `PORT` khac |
| `docker compose up` bao port conflict | Host port 3001 bi service khac chiem | `AUTH_HOST_PORT=3098 docker compose up -d` (cong host cau hinh duoc) |
| Luon 429 khi test | `@Throttle` theo IP | Tang `THROTTLE_LIMIT`/`THROTTLE_TTL` (e2e override storage = khong chan) |
| `AUTH_OTP_EXPIRED` lien tuc | OTP 5' / magic 15' / verify_email 24h da het han | Goi `/otp/send` / `/magic-link/send` lai |
| `AUTH_TOKEN_REUSED` | Client dung lai refresh token cu (chua luu token moi sau rotation) | Luu `refreshToken` moi tu moi response `/auth/refresh` |
| 401 khi goi endpoint Bearer | Thieu `Authorization: Bearer <token>` hoac token het han | Gui header; thuc hien refresh luong §21.1 |
| 403 `AUTH_METHOD_DISABLED` | Phuong thuc chua bat trong `AUTH_ENABLED_METHODS`, hoac OAuth chua co client id | Bat phuong thuc / dien `GOOGLE_*`,`GITHUB_*` |
| CORS bloque | Origin khong thuoc allowlist | Cau hinh `CORS_ORIGIN` (phan tach dau phay); trong `CORS_ORIGIN` -> non-prod phan anh moi origin, prod DONG cross-origin |
| khong ket noi DB khi boot | Sai `DB_*` / Postgres chua len | `docker compose up -d postgres`; kiem tra `DB_HOST/PORT/PASSWORD` |
| 401 trên MỌI endpoint Bearer dù token hợp lệ | Token thiếu `sessionId` hợp lệ HOẶC phiên bị deny-list (signout/đổi MK/reuse) | Đăng nhập lại lấy token mới; kiểm tra `[SECURITY WARNING]` trong log |
| Chưa có admin mà cần phong SUPER_ADMIN | Circular bootstrap | Đặt `ADMIN_BOOTSTRAP_EMAILS=<email đã signup>` tạm, restart service (grant có log), rồi XÓA env |
| Redis khong ket noi khi `ON_REDIS=true` | Thieu Redis / sai `REDIS_URL` | Khoi dong redis (`--profile redis`); kiem tra `REDIS_URL`; trong compose dung `redis://redis:6379/0` |
| `npm ci` loi khi build Docker | `package-lock.json` lech `package.json` | Chay `npm install` de dong bo lock roi build lai (Dockerfile co fallback `npm install`) |
| E2E bi `skip` toan bo | Khong ket noi duoc PostgreSQL | `npm run test:e2e:db:up`; kiem tra bien `DB_*` shell khong ghi de gia tri mac dinh cua harness |

---

## 23. Admin RBAC — Quản trị role & permission

### 23.1. Mô hình
- **RBAC**: `users → memberships (status='active') → membership_roles → roles → role_permissions → permissions`.
- **PBAC**: permission code dạng `<resource>:<action>[:<sub>]`; wildcard `*` = toàn quyền; `SUPER_ADMIN` bỏ qua mọi check role/permission.
- **Danh mục mặc định được seed lúc boot** (idempotent, log `RbacBootstrapService`): 10 permission codes + 3 role hệ thống `USER/ADMIN/SUPER_ADMIN` (`is_system=true`).
- **Default-deny**: JWT/Role/Permission guard là `APP_GUARD` toàn cục; endpoint công khai phải đánh dấu `@Public()`. Quên `@UseGuards` không còn làm route "vô tình public".

### 23.1b. Role KHÔNG hard-code — điều khiển bằng config + data
- **Tên super role toàn quyền**: `SUPER_ADMIN_ROLES` (csv, mặc định `SUPER_ADMIN`). Guard/lockout-check đọc từ cấu hình — thêm/đổi tên role toàn quyền chỉ cần sửa env + restart (bootstrap tự tồn tại role + gán permission wildcard `*`).
- **Toàn quyền theo data**: role nào được gán permission `*` (tự seed cho các super role) là toàn quyền — không phụ thuộc tên role trong code.
- **Tên role mặc định signup**: `DEFAULT_USER_ROLE` (mặc định `USER`) — role + permission mặc định được bootstrap seed theo đúng tên cấu hình.
- **Role động qua API**: `POST/GET/DELETE /admin/rbac/roles`, `POST/GET/DELETE /admin/rbac/roles/:id/permissions[/:code]` — tạo, liệt kê permission, thu hồi từng code, xóa role (isSystem và role đang bị `SUPER_ADMIN_ROLES` tham chiếu được bảo vệ khỏi xóa).

### 23.2. Bootstrap admin đầu tiên (chặn đường "con gà quả trứng")
1. `POST /auth/signup` tài khoản admin bằng email thật.
2. Đặt tạm `ADMIN_BOOTSTRAP_EMAILS=admin@domain.com` (csv) rồi restart `auth-service` → grant SUPER_ADMIN (log `ADMIN_BOOTSTRAP_EMAILS: đã gán...`).
3. **Xóa env sau khi grant** — đường grant chỉ dành cho khởi tạo.

### 23.3. Vòng đời hiệu lực quyền
- Sau khi phong/gỡ role: cache quyền theo user bị vô hiệu ngay (`invalidateCache`); **claims trong access token cũ giữ nguyên tới khi refresh** (≤15′) — client gọi `/auth/refresh` hoặc đăng nhập lại để nhận roles/permissions mới.
- Gán permission cho role: hiệu lực với user sau TTL `AUTH_RBAC_CACHE_TTL_MS` (mặc định 60s) + token cycle như trên.

### 23.4. Bảo vệ chống lockout
- Không tự gỡ `SUPER_ADMIN` khỏi chính tài khoản đang đăng nhập (400).
- Không gỡ `SUPER_ADMIN` khỏi tài khoản cuối cùng (400) — đơn vị đã kiểm chứng bằng unit test.
- Mọi endpoint admin giới hạn `@RequireRoles('ADMIN','SUPER_ADMIN')` + permission tương ứng (`role:manage`, `permission:manage`, `user:manage`).

