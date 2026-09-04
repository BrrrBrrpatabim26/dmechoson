---
name: Anti Horizontal Overflow & Layout Fragility
category: anti-ui-ai
priority: 100
tags: [overflow-bugs, layout-safety, zero-overflow, defensive-css]
applies_to: [ui-design, drafting, layout, code-generation]
---

# 🚫 Anti-Horizontal Overflow & Quy Chuẩn Phòng Thủ Tràn Màn Hình

## 1. Hội chứng Tràn Ngang (Horizontal Scroll Bug)
Lỗi phổ biến nhất khi AI sinh mã là màn hình bị thanh cuộn ngang không kiểm soát được, đặc biệt trên điện thoại di động (iPhone SE 375px hoặc Android 360px). Nguyên nhân do:
- Dùng `width: 100vw` hoặc `w-screen` trên các container bên trong làm cộng thêm bề rộng của scrollbar.
- Phần tử con trong Flexbox/Grid không có `min-width: 0` (`min-w-0`), khiến chuỗi văn bản dài hoặc bảng dữ liệu đẩy bung container cha.
- Đặt độ rộng cố định `width: 500px` hoặc `min-width: 400px` trên container.
- Padding và Border không có `box-sizing: border-box`.

## 2. 6 Quy Tắc Vàng Phòng Thủ Tràn Màn Hình (Defensive CSS)

```css
/* 1. Global Box Sizing Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 2. Root Container Containment */
html, body {
  max-width: 100%;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

/* 3. Media & Assets Containment */
img, svg, video, canvas, audio, iframe {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 4. Flex & Grid Child Containment (CỰC KỲ QUAN TRỌNG) */
.flex-child, .grid-child {
  min-width: 0; /* Ngăn text/child làm bung flex container */
}

/* 5. Typography Word Breaking */
p, h1, h2, h3, h4, h5, h6, span {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 6. Data Tables & Code Blocks */
.table-wrapper, .code-wrapper {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

## 3. Cấm Kỵ Tuyệt Đối
- ❌ **CẤM**: `width: 100vw` trên bất kỳ thẻ con nào ngoài `<html>` hoặc `<body>`.
- ❌ **CẤM**: Đặt `fixed width` lớn hơn 300px mà không có `max-width: 100%`.
- ❌ **CẤM**: Để bảng `<table>` trần trụi mà không bọc trong thẻ `div` có `overflow-x: auto`.
