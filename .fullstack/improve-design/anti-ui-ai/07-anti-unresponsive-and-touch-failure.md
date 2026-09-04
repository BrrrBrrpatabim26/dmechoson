---
name: Anti Unresponsive Grids & Touch Target Failure
category: anti-ui-ai
priority: 90
tags: [responsive, mobile-first, touch-targets, grid-safety]
applies_to: [ui-design, drafting, layout, responsive]
---

# 🚫 Anti-Unresponsive Grids & Chuẩn Tương Tác Cảm Ứng Di Động

## 1. Hội chứng Không Thích Ứng Di Động (<640px)
Nhiều bản thiết kế của AI cố gắng nhồi nhét 3-4 cột trên màn hình điện thoại khiến:
- Chữ tràn ra khỏi thẻ hoặc bị cắt cụt vô lý.
- Nút bấm quá nhỏ (<30px) khiến người dùng ngón tay không thể chạm chính xác trên điện thoại (Fat Finger Failure).
- Menu điều hướng máy tính vẫn hiển thị trên điện thoại gây che khuất nội dung.

## 2. Quy Chuẩn Mobile-First Containment Bắt Buộc

### A. Quy tắc Sụp Về 1 Cột Dọc (<640px = 1 Col)
Mọi grid layout nhiều cột (Dashboard cards, Feature list, Form rows) trên màn hình `< 640px` BẮT BUỘC phải chuyển thành đúng **1 cột dọc** hoặc chuyển thành **Horizontal Scroll Carousel** với chỉ báo vuốt:

```css
/* Responsive Grid Pattern */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile first: 1 column */
  gap: 16px;
}

@media (min-width: 640px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr); /* Desktop: 4 columns */
    gap: 24px;
  }
}
```

### B. Vùng Chạm Cảm Ứng Tối Thiểu (Touch Targets >= 44x44px)
Mọi nút bấm, icon bấm được, checkbox, radio button trên thiết bị di động phải có diện tích chạm tối thiểu **44px x 44px** (theo chuẩn Apple Human Interface & Google Material):

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### C. Menu Điều Hướng Di Động (Mobile Navigation)
- Trên Desktop (`>= 1024px`): Thanh Header đầy đủ hoặc Sidebar cố định.
- Trên Mobile (`< 1024px`): Menu thu gọn thành Drawer (Slide-over) hoặc Bottom Navigation Bar có biểu tượng rõ ràng.
