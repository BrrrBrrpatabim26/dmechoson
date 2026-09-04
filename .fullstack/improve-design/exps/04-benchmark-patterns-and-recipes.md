---
name: Benchmark UI Patterns & Proven Recipes
category: exps
priority: 85
tags: [benchmarks, ui-recipes, design-patterns, visual-benchmarks]
applies_to: [ui-design, drafting, patterns]
---

# 💎 Benchmark UI Patterns & Proven Recipes — Công Thức Thực Chiến Từ Các Sản Phẩm Đỉnh Cao

Học hỏi và áp dụng các công thức thiết kế đã được chứng minh hiệu quả từ các benchmark hàng đầu trong ngành (Linear, Stripe, Raycast, Vercel, Supabase):

---

## 1. Công Thức Dashboard Sáng / Tối Sâu Sắc (Linear / Vercel Style)
- **Nền**: `--bg-canvas: #0a0a0c`, `--bg-surface: #121216`.
- **Viền Hairline**: `1px solid rgba(255, 255, 255, 0.08)`.
- **Đổ bóng Elevation**: `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)`.
- **Typography**: `Geist Sans` hoặc `Inter`, số liệu dùng `JetBrains Mono` căn phải trong bảng.
- **Card Header**: Tiêu đề nhỏ dạng Caps `font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);`.

## 2. Công Thức Bảng Dữ Liệu Chuyên Nghiệp (Stripe / Supabase Style)
- **Header Bảng**: Nền hơi sáng hơn canvas `background: var(--bg-surface-elevated)`, có viền dưới 1px, tiêu đề cột có thể bấm để sắp xếp (Sort indicator).
- **Hàng Dữ Liệu (Rows)**: Chiều cao chuẩn 48px - 56px, hover đổi màu nhẹ `background: rgba(255, 255, 255, 0.02)`.
- **Status Badges**: Pill nhỏ gọn, chữ 12px, nền mờ có màu ngữ cảnh (`rgba(16, 185, 129, 0.15)` chữ `#10b981` cho Success, `rgba(239, 68, 68, 0.15)` chữ `#ef4444` cho Error).
- **Hành động hàng (Row Actions)**: Ẩn nút chi tiết cho đến khi rê chuột vào hàng (Hover-reveal action buttons) để giữ bảng luôn gọn gàng.

## 3. Công Thức Biểu Mẫu & Xác Thực (Typeform / Modern Auth Style)
- **Label nổi bật**: Nhãn trường chữ vừa `13px - 14px`, `font-weight: 500`.
- **Input Field**: Chiều cao 40px - 44px, viền hairline, `:focus` đổi màu viền sang accent và có vòng sáng offset.
- **Inline Validation**: Xuất hiện ngay bên dưới ô nhập khi `blur` hoặc submit thất bại, có icon cảnh báo đỏ và thông điệp giải thích cụ thể.
- **Submit Button**: Kích thước lớn, full width trên mobile, có loading spinner tích hợp khi gửi dữ liệu.
