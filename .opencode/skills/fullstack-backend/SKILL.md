---
name: fullstack-backend
description: Backend Engineering — Phát triển Backend chuyên sâu theo từng module/use case (DDD, Hexagonal, Clean Architecture, Database Schema, API Contract, Business Service, Auth, Caching, Test Suite >= 97% coverage).
---

---
description: Backend Engineering — Phát triển Backend chuyên sâu theo từng module/use case (DDD, Hexagonal, Clean Architecture, Database Schema, API Contract, Business Service, Auth, Caching, Test Suite >= 97% coverage).
---


<!-- backend-deep-engineering:v1.0.0 -->
<!-- clean-architecture-ddd:v1.0.0 -->

# ⚙️ Backend Deep Engineering (Phát triển Backend Chuyên sâu)

> **MỤC TIÊU**: Tập trung 100% sức mạnh kỹ nghệ vào tầng máy chủ, cơ sở dữ liệu, nghiệp vụ lõi (Domain Logic) và giao diện lập trình ứng dụng (API), giúp người dùng xây dựng hệ thống vững chắc mà không bị phân tán bởi frontend.

---

## 🏛️ 1. Kiến Trúc Chuẩn Mực (DDD + Hexagonal / Clean Architecture)

Tổ chức cấu trúc backend theo nguyên lý phân tầng độc lập (Inversion of Control):

```text
src/backend/ (hoặc app/)
├── domain/                      # LÕI NGHIỆP VỤ BẤT BIẾN (Không phụ thuộc framework/DB)
│   ├── entities/                # Thực thể có định danh duy nhất (Identity)
│   ├── value_objects/           # Đối tượng giá trị bất biến (Email, Money, Slug)
│   ├── aggregates/              # Cụm thực thể quản lý tính nhất quán (Transaction Boundary)
│   ├── events/                  # Domain Events phát sinh khi trạng thái thay đổi
│   └── exceptions/              # Biểu mẫu lỗi nghiệp vụ riêng của domain
│
├── application/                 # TẦNG CA SỬ DỤNG (Use Cases / Services)
│   ├── use_cases/               # Mỗi file là 1 use case (vd: CreateOrderUseCase, VerifyUserUseCase)
│   ├── dto/                     # Data Transfer Objects (Input/Output data contracts)
│   └── ports/                   # Interfaces / Abstract classes
│       ├── repositories/        # Port giao tiếp lưu trữ dữ liệu (IUserRepository)
│       ├── services/            # Port giao tiếp dịch vụ ngoài (IPaymentGateway, IMailer)
│       └── message_bus/         # Port phát sinh sự kiện (IEventPublisher)
│
├── infrastructure/              # TẦNG HẠ TẦNG & THỰC THI CHI TIẾT (Adapters)
│   ├── database/                # ORM / DDL / Migrations (PostgreSQL, MySQL, MongoDB)
│   │   ├── models/              # Bảng CSDL (SQLAlchemy, Prisma, TypeORM, GORM)
│   │   └── migrations/          # Lịch sử nâng cấp cấu trúc dữ liệu
│   ├── repositories/            # Cài đặt cụ thể các Repo Ports (UserRepositoryImpl)
│   ├── external_services/       # Cài đặt dịch vụ bên ngoài (Stripe, Sendgrid, S3)
│   └── security/                # JWT Token, Bcrypt Hashing, OAuth2 Provider
│
└── presentation/ (hoặc api/)    # TẦNG ĐẦU VÀO GIAO TIẾP
    ├── rest/                    # HTTP Controllers / Routers (FastAPI, Express, Spring, Gin)
    │   ├── v1/                  # Versioned API routes
    │   └── middlewares/         # AuthGuard, RateLimiter, RequestLogger, CORS
    └── serializers/             # Schema validation (Pydantic, Zod, DTO validation)
```

---

## 📋 2. Quy Trình 5 Bước Phát Triển Backend Từng Phần

Khi nhận một nhiệm vụ Backend, Agent thực hiện tuần tự:

### Bước 1: Mô hình hóa Dữ liệu & Migrations
1. Thiết kế DDL / Schema: Khóa chính UUID/ULID, quan hệ 1-1, 1-N, N-N, ràng buộc Foreign Key và Index đánh giá hiệu năng truy vấn.
2. Viết Migration script có khả năng Rollback (Up & Down).
3. Viết Seed Data phục vụ môi trường thử nghiệm độc lập.

### Bước 2: Thiết kế API Contract Chuẩn Mực
1. Định nghĩa chuẩn RESTful hoặc GraphQL/gRPC.
2. Bảng mã trạng thái HTTP rõ ràng:
   - `200 OK` (Lấy dữ liệu thành công), `201 Created` (Tạo tài nguyên mới thành công).
   - `400 Bad Request` (Dữ liệu đầu vào không hợp lệ, kèm danh sách field lỗi).
   - `401 Unauthorized` (Chưa đăng nhập / Token hết hạn).
   - `403 Forbidden` (Không đủ quyền hạn / Role-Based Access Control).
   - `404 Not Found` (Không tìm thấy tài nguyên theo ID).
   - `409 Conflict` (Dữ liệu trùng lặp / Unique constraint).
   - `422 Unprocessable Entity` (Vi phạm quy tắc nghiệp vụ domain).
   - `500 Internal Server Error` (Lỗi hệ thống ngoài tầm kiểm soát).
3. Đảm bảo 100% Endpoints có tài liệu OpenAPI / Swagger tự động cập nhật.

### Bước 3: Lập trình Lõi Nghiệp vụ (Use Cases & Domain Rules)
1. Viết Use Case tập trung: Mỗi Use Case chỉ làm đúng 1 việc (Single Responsibility Principle).
2. Kiểm soát giao dịch (Transaction Management): Mọi thao tác ghi dữ liệu nhiều bảng phải nằm trong Transaction (`commit` khi thành công, `rollback` khi lỗi).
3. Ghi log có cấu trúc (Structured Logging): Log rõ `timestamp`, `trace_id`, `user_id`, `action`, `duration_ms`.

### Bước 4: Kiểm Thử Thực Tế Có Timeout & Coverage ≥ 97%
Agent BẮT BUỘC chạy kiểm thử thực tế trong terminal:
1. **Unit Test tầng Domain & Use Case**: Mock Repositories để test 100% các nhánh rẽ logic.
2. **Integration Test tầng Database**: Dùng Test Database (SQLite memory hoặc Postgres test container) để kiểm tra câu lệnh truy vấn thật và migrations.
3. **Contract Test API có Timeout**:
   ```bash
   # Kiểm tra endpoint thực tế kèm timeout bảo vệ:
   curl -X POST http://localhost:<BACKEND_PORT>/api/v1/<endpoint> \
        -H "Content-Type: application/json" \
        -d '{"data": "sample"}' \
        --max-time 10
   ```
4. Đo lường Coverage: Đảm bảo độ bao phủ `pytest --cov` hoặc `npm run test:coverage` đạt **≥ 97%**.

### Bước 5: Cung Cấp API Mock & Hướng Dẫn Tích Hợp Frontend
Sau khi hoàn tất backend:
- Xuất file `.fullstack/specs/<branch>/api-contract.json` (OpenAPI Spec).
- Cung cấp dữ liệu mẫu (Mock Response) để đội ngũ / chặng Frontend có thể kết nối ngay lập tức mà không gặp bất kỳ xung đột nào.


