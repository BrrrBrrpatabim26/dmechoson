---
name: fullstack-frontend
description: Frontend Engineering — Phát triển Frontend & UI/UX chuyên sâu theo từng màn hình/component (Atomic Design, Zero-Generic, 6 Microstates, State Management, Mock Service Worker, Responsive, Accessibility, Test Suite >= 97% coverage).
---

---
description: Frontend Engineering — Phát triển Frontend & UI/UX chuyên sâu theo từng màn hình/component (Atomic Design, Zero-Generic, 6 Microstates, State Management, Mock Service Worker, Responsive, Accessibility, Test Suite >= 97% coverage).
---


<!-- frontend-deep-engineering:v1.0.0 -->
<!-- zero-generic-atomic-design:v1.0.0 -->

# 🎨 Frontend Deep Engineering (Phát triển Frontend Chuyên sâu)

> **MỤC TIÊU**: Tập trung 100% sức mạnh kỹ nghệ vào giao diện người dùng (UI), trải nghiệm tương tác (UX), quản lý trạng thái (State Management) và kiến trúc Component sạch sẽ, giúp người dùng xây dựng giao diện hoàn hảo mà không bị ràng buộc bởi tiến độ backend.

---

## 🏛️ 1. Kiến Trúc Chuẩn Mực (Atomic Design & Modular Component)

Tổ chức cấu trúc frontend phân cấp rõ ràng theo mức độ tái sử dụng:

```text
src/frontend/ (hoặc src/)
├── assets/                      # Hình ảnh vector (SVG), icons, fonts chữ tùy biến
├── styles/                      # Hệ thống Design Tokens cốt lõi (5 tầng màu, spacing, radius)
│   ├── tokens.css               # --bg-canvas, --bg-surface, --border-hairline, --text-primary, --accent
│   └── globals.css              # Reset CSS, base typography, concentric radius utilities
│
├── components/                  # THÀNH PHẦN GIAO DIỆN (Atomic Design)
│   ├── atoms/                   # Nút bấm (Button), Ô nhập (Input), Nhãn (Badge), Biểu tượng (Icon)
│   ├── molecules/               # Thanh tìm kiếm (SearchBar), Khung chọn ngày, Nhóm trường form
│   ├── organisms/               # Header, Sidebar, Card sản phẩm, Data Table, Modal Dialog
│   └── templates/               # Layout sườn trang (DashboardLayout, AuthLayout, MasterDetailLayout)
│
├── pages/ (hoặc views/)         # MÀN HÌNH HOÀN CHỈNH
│   ├── dashboard/               # Trang Dashboard tổng quan
│   ├── settings/                # Trang Cấu hình tài khoản
│   └── auth/                    # Trang Đăng nhập / Đăng ký
│
├── hooks/                       # Custom React/Vue Hooks tái sử dụng logic UI
├── services/                    # TẦNG GIAO TIẾP DỮ LIỆU & API
│   ├── api/                     # Axios/Fetch client instance với Interceptors
│   ├── queries/                 # Server State caching (TanStack Query / SWR / RTK Query)
│   └── mocks/                   # MSW (Mock Service Worker) — Giả lập API độc lập
│
└── store/                       # Client State Management (Zustand, Redux Toolkit, Pinia)
```

---

## 🛡️ 2. Tiêu Chuẩn Thiết Kế Bất Biến (Zero-Generic UI Rules)

Mọi component và trang giao diện đều phải tuân thủ nghiêm ngặt 6 quy chuẩn:

1. **Zero Horizontal Overflow**: Tuyệt đối không để xảy ra tràn màn hình ngang (`box-sizing: border-box`, `max-width: 100%`, `min-w-0` trên Flex/Grid children). CẤM dùng `100vw` bên trong container.
2. **Concentric Radius Hierarchy**: Bo góc đồng tâm chuẩn xác: $R_{inner} = \max(0, R_{outer} - padding)$. Không dùng bo góc đồ chơi khổng lồ `2xl/3xl` tùy tiện.
3. **Bảng Màu 5 Tầng Hex (Structured 5-Layer Palette)**:
   - `--bg-canvas`: Nền canvas tổng thể.
   - `--bg-surface`: Bề mặt các card, panel, container.
   - `--border-hairline`: Đường viền tinh tế `1px solid rgba(...)`.
   - `--text-primary`: Màu chữ nội dung chính tương phản cao.
   - `--text-muted`: Màu chữ phụ đề, ghi chú.
   - `--accent`: Một màu nhấn duy nhất có chủ đích (CẤM dùng gradient tím-xanh rẻ tiền).
4. **Đủ 6 Trạng Thái Tương Tác (Full 6 Microstates)**:
   Mọi nút bấm, input, control đều có đủ 6 trạng thái: Default, Hover, Focus (kèm `:focus-visible` ring), Active, Disabled, Loading (kèm spinner/skeleton).
5. **Mobile-First Containment**:
   Màn hình `<640px` tự động sụp về 1 cột dọc, touch target tối thiểu `44x44px`, cấm fixed width `≥320px`.
6. **Hệ Thống Phản Hồi 4 Cấp Độ (4-Tier Contextual Feedback)**:
   Inline Alert (Dưới field nhập) ➔ In-pane Banner (Đầu panel) ➔ Bottom Snackbar/Toast (Thông báo tự ẩn) ➔ Blocking Modal Dialog (Xác nhận nguy hiểm).

---

## 📋 3. Quy Trình 5 Bước Phát Triển Frontend Chuyên Sâu

### Bước 1: Khởi Tạo Design Tokens & Atomic Components
1. Thiết lập CSS Variables cho 5 tầng màu, typography font, spacing và shadow elevation.
2. Xây dựng các Atoms căn bản (Button, Input, Badge, Dropdown) với đủ 6 microstates.

### Bước 2: Tích Hợp Mock API & Caching Layer (MSW / TanStack Query)
1. Cấu hình Mock Service Worker (MSW) hoặc Local Fixtures dựa trên API Contract.
2. Thiết lập Server State caching: Tự động quản lý loading spinner, error boundary, retry tự động và cập nhật lạc quan (Optimistic Updates).
3. Đảm bảo Frontend hoạt động mượt mà 100% ngay cả khi Backend chưa triển khai!

### Bước 3: Ráp Nối Màn Hình Hoàn Chỉnh & Responsive Layout
1. Ghép các Organisms thành trang hoàn chỉnh theo đúng thiết kế (Flowchart #2 UI Design).
2. Kiểm tra hiển thị trên cả 3 dải thiết bị: Mobile (`<640px`), Tablet (`640px - 1024px`), Desktop (`>1024px`).

### Bước 4: Kiểm Thử Component & Luồng Tương Tác (Coverage ≥ 97%)
Agent BẮT BUỘC thực thi câu lệnh test trong terminal:
```bash
# Chạy Unit Test Component & Hook:
npm test -- --coverage # hoặc npx vitest run --coverage

# Kiểm tra Linter & Typecheck:
npm run lint && npx tsc --noEmit
```
Đảm bảo độ bao phủ `Coverage ≥ 97%` (các nhánh trạng thái Loading, Error, Empty, Success đều có test).

### Bước 5: Phối Hợp Trực Tiếp Cùng Người Dùng (Visual Review)
- Hướng dẫn Người dùng mở trình duyệt xem trực tiếp:
  > 🎨 *"Frontend dev server đang chạy tại `http://localhost:<FRONTEND_PORT>`. Vui lòng mở trình duyệt để kiểm tra trực quan giao diện, trải nghiệm hiệu ứng tương tác (hover, click, form validation, responsive) và phản hồi cho tôi nếu cần tinh chỉnh bất kỳ chi tiết nào!"*


