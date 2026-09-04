---
name: Multi-Loop UI Prompt Architecture
category: exps
priority: 100
tags: [prompt-template, multi-loop, prompt-architecture, design-tokens]
applies_to: [ui-design, prompting, prompt-generation]
---

# 🏗️ Multi-Loop UI Prompt Architecture — Khung Cấu Trúc Prompt Mẫu Chuẩn

Để AI sinh ra mã nguồn giao diện đạt điểm Craft Score cao (>=85/100) và không dính Slop Flags, prompt gửi tới AI sinh mã BẮT BUỘC tuân thủ cấu trúc 6 khối chuẩn mực sau:

---

## 📋 Cấu Trúc 6 Khối Bắt Buộc Trong Prompt Sinh UI

```markdown
# [TÊN MÀN HÌNH / COMPONENT] — UI SPECIFICATION & CODE GENERATION PROMPT

## 1. BỐI CẢNH & MỤC TIÊU NGHIỆP VỤ (DOMAIN CONTEXT)
- **Tên màn hình**: [Tên màn hình, e.g. E-Commerce Checkout Flow, Analytics Dashboard]
- **Người dùng mục tiêu**: [Đối tượng sử dụng]
- **Mục tiêu tương tác cốt lõi**: [Hành động quan trọng nhất người dùng cần hoàn thành]
- **UI Mode**: [2D / 2.5D Elevation / 3D Canvas / Hybrid]

## 2. BẢNG MÀU 5 TẦNG & DESIGN TOKENS (STRUCTURED 5-LAYER HEX)
- `--bg-canvas`: `[#hex]` (Nền tổng thể)
- `--bg-surface`: `[#hex]` (Mặt phẳng thẻ / panel)
- `--bg-surface-elevated`: `[#hex]` (Mặt phẳng nổi)
- `--border-hairline`: `[rgba / #hex 1px solid]` (Đường viền sắc nét)
- `--text-primary`: `[#hex]` (Chữ chính - contrast >= 4.5:1)
- `--text-secondary`: `[#hex]` (Chữ phụ trợ)
- `--text-muted`: `[#hex]` (Ghi chú mờ)
- `--accent`: `[#hex]` (Màu nhấn tương tác duy nhất - Primary CTA)
- `--accent-hover`: `[#hex]`
- `--radius-base`: `[6px - 8px cho nút/input, 12px cho thẻ]` (Concentric: R_inner = max(0, R_outer - padding))
- **Typography Pairing**: Header: `[Inter / Outfit / Plus Jakarta Sans]`, Body: `[Inter / Roboto]`, Code/Number: `[JetBrains Mono]`

## 3. CẤU TRÚC PHÂN CẤP THÀNH PHẦN (COMPONENT HIERARCHY & LAYOUT)
- **Container**: Max-width `1280px`, căn giữa `margin: 0 auto`, padding ngang `16px - 24px`.
- **Phân chia khu vực**:
  - `Header / Navigation`: Cố định (Sticky), có hairline border phía dưới, menu mobile drawer khi <1024px.
  - `Main Content Area`: Grid layout responsive.
  - `Sidebar / Filter`: Cột cố định trên desktop, modal bottom-sheet trên mobile.

## 4. BẮT BUỘC ĐỦ 6 TRẠNG THÁI TƯƠNG TÁC (FULL 6 MICROSTATES)
Mọi interactive control (Button, Input, Card, Link, Tab) phải có đủ:
1. `Default`: Trạng thái ban đầu sắc nét.
2. `Hover`: Hiệu ứng đổi màu nhẹ nhàng + scale/shadow vi mô (`translateY(-1px)`).
3. `Focus-visible`: Custom outline ring `box-shadow: 0 0 0 2px var(--bg-canvas), 0 0 0 4px var(--accent)`.
4. `Active`: Trạng thái nhấn chuột (`translateY(0)`).
5. `Disabled`: Mờ `opacity: 0.5`, con trỏ `cursor: not-allowed`, chặn sự kiện click.
6. `Loading`: Spinner hoặc skeleton animation khi đang xử lý API.

## 5. BẢO VỆ LAYOUT & PHÒNG THỦ TRÀN NGANG (DEFENSIVE CSS)
- Toàn bộ `*` có `box-sizing: border-box`.
- Mọi Flex child và Grid child đều có `min-width: 0` (`min-w-0`).
- Mọi text dài có `overflow-wrap: break-word`.
- Màn hình `<640px` sụp về **đúng 1 cột dọc**.
- Vùng chạm cảm ứng trên mobile `>= 44px x 44px`.
- Bảng dữ liệu và khối code bọc trong container `overflow-x: auto`.

## 6. PHẢN HỒI NGỮ CẢNH & DỮ LIỆU THỰC TẾ (REALISTIC DATA & 4-TIER FEEDBACK)
- Dữ liệu mẫu sát thực tế ngành nghề (không dùng `Lorem ipsum` hay placeholder rỗng).
- Đầy đủ 4 trạng thái trang: `Initial Loading (Skeleton)`, `Empty State (+ Nút CTA)`, `Success State`, `Error State (Kèm nút Thử lại)`.
- Thông báo phản hồi: Inline error cho form, Toast snackbar cho thao tác thành công.
```
