---
name: Anti Missing Microstates & Focus Accessibility
category: anti-ui-ai
priority: 95
tags: [microstates, focus-ring, accessibility, interactive-states]
applies_to: [ui-design, drafting, component-design, css-rules]
---

# 🚫 Anti-Missing Microstates & Quy Chuẩn Đủ 6 Trạng Thái Tương Tác

## 1. Hội chứng Giao diện Tĩnh Không Phản Hồi
AI thường chỉ sinh CSS cho trạng thái mặc định (Default State). Khi người dùng rê chuột (Hover), nhấn phím Tab (Focus), click chuột (Active), hoặc khi dữ liệu đang nạp (Loading), giao diện không có bất kỳ phản hồi trực quan nào hoặc bị mất đường viền nét bàn phím (xóa `outline: none` vô tội vạ).

## 2. Tiêu chuẩn 6 Microstates Bắt Buộc Cho Mọi Control

Mọi nút bấm (Button), ô nhập liệu (Input/Select/Textarea), thẻ tương tác (Clickable Card), hoặc liên kết (Link) BẮT BUỘC có đủ 6 trạng thái:

```css
/* 1. Default State */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  background-color: var(--accent);
  color: #ffffff;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 2. Hover State */
.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* 3. Focus-Visible State (Accessibility ring - CẤM xóa outline!) */
.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-canvas), 0 0 0 4px var(--accent);
}

/* 4. Active / Pressed State */
.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}

/* 5. Disabled State */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 6. Loading State */
.btn-primary.is-loading {
  position: relative;
  pointer-events: none;
  color: transparent !important;
}
.btn-primary.is-loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

## 3. Checklist Phòng Thủ
- [x] Có custom `:focus-visible` ring với độ lệch tương phản (offset ring).
- [x] Input có trạng thái `:focus` đổi màu viền và đổ bóng viền mờ (`box-shadow: 0 0 0 3px rgba(...)`).
- [x] Disabled control có con trỏ `cursor: not-allowed` và không nhận sự kiện click.
- [x] Có hiệu ứng loading skeleton hoặc spinner khi gọi API.
