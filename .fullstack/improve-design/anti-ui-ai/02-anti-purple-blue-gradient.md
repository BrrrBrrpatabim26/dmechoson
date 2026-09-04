---
name: Anti Purple-Blue Slop Gradient & Color Palette Structure
category: anti-ui-ai
priority: 95
tags: [color-palette, anti-gradient, visual-hierarchy, 5-layer-hex]
applies_to: [ui-design, drafting, styling]
---

# 🚫 Anti-Purple-Blue Gradient & Bảng Màu 5 Tầng Chuẩn Mực

## 1. Hội chứng AI Gradient Cliché
Hầu hết các mô hình sinh mã UI mặc định lạm dụng dải màu tím-xanh (`#6366f1` Indigo -> `#8b5cf6` Purple / `#ec4899` Pink) hoặc nền đen tuyền kèm đèn Neon tím rực rỡ (Cyberpunk rẻ tiền). Điều này làm giao diện trông như sản phẩm sao chép vô hồn, thiếu sự chuyên nghiệp và gây mỏi mắt.

## 2. Quy chuẩn Bảng màu 5 Tầng Cấu trúc (Structured 5-Layer Hex Palette)
Thay vì gradient ngẫu nhiên, mọi giao diện chuyên nghiệp phải định nghĩa đúng 5 tầng màu độc lập:

```css
:root {
  /* Tầng 1: Canvas Background (Nền tổng thể) */
  --bg-canvas: #090d16;        /* Dark mode */ /* hoặc #f8fafc cho Light mode */
  
  /* Tầng 2: Surface Background (Mặt phẳng thẻ / Panels) */
  --bg-surface: #111827;       /* Dark mode */ /* hoặc #ffffff cho Light mode */
  --bg-surface-elevated: #1f2937;
  
  /* Tầng 3: Border Hairline (Đường viền tinh tế 1px) */
  --border-hairline: rgba(255, 255, 255, 0.08); /* Dark */ /* rgba(0, 0, 0, 0.08) cho Light */
  --border-subtle: rgba(255, 255, 255, 0.14);
  
  /* Tầng 4: Typography / Ink Hierarchy (Màu chữ có độ sâu) */
  --text-primary: #f9fafb;     /* Tương phản cao nhất */
  --text-secondary: #9ca3af;   /* Phụ trợ / nhãn */
  --text-muted: #6b7280;       /* Ghi chú mờ / timestamps */
  
  /* Tầng 5: Accent Color Duy nhất (Điểm nhấn tương tác) */
  --accent: #3b82f6;           /* Sapphire Blue / Amber / Emerald / Tangerine tuỳ theme */
  --accent-hover: #2563eb;
  --accent-subtle: rgba(59, 130, 246, 0.15);
}
```

## 3. Quy tắc Cấm & Khắc Phục
- ❌ **CẤM**: `background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)` trên toàn bộ hero hoặc button.
- ❌ **CẤM**: Chữ trắng trên nền xám trung tính có độ tương phản < 4.5:1.
- ✅ **CHUẨN**: Dùng nền phẳng có chiều sâu (surface layered), viền hairline sắc nét `1px solid var(--border-hairline)`, đổ bóng nhẹ nhàng và chỉ dùng `--accent` cho các điểm kêu gọi hành động cốt lõi (Primary CTA).
