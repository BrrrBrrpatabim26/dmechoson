---
name: Anti Card Clutter & Fake Metrics
category: anti-ui-ai
priority: 90
tags: [card-design, metrics, visual-hierarchy, content-strategy]
applies_to: [ui-design, drafting, component-design]
---

# 🚫 Anti-Card Clutter & Chỉ Số Số Liệu Giả Tạo (Fake Metrics)

## 1. Hội chứng Lặp Thẻ Vô Nghĩa
AI thường sinh ra một hàng 4 thẻ thống kê (Stats Grid) giống hệt nhau:
- Một icon nằm trong vòng tròn bán trong suốt (e.g. icon người dùng, icon giỏ hàng, icon doanh thu, icon biểu đồ).
- Một con số lớn (e.g. `$45,231.89`).
- Một chiếc badge xanh lá nhỏ `+20.1% from last month`.

Kiểu thiết kế này hoàn toàn lặp lại, không cung cấp phân cấp thị giác và biến dashboard thành một bãi rác thị giác (card soup).

## 2. Quy chuẩn Thiết kế Card & Metrics Chuyên nghiệp
1. **Phân cấp Thẻ (Primary vs Secondary Card)**:
   - Thẻ quan trọng nhất (North Star Metric hoặc Primary Action) có kích thước lớn hơn hoặc đặt ở vị trí thị giác ưu tiên.
   - Các thẻ phụ có độ đậm nhạt và kích thước nhỏ gọn hơn, không tranh chấp sự chú ý.
2. **Ngữ cảnh Số liệu Thực tế**:
   - Số liệu phải có nhãn thời gian rõ ràng (e.g. `Hôm nay (so với 7 ngày trước)`, `Tháng này`).
   - Cung cấp hành động tương tác (Click vào thẻ để xem biểu đồ chi tiết hoặc lọc bảng dữ liệu phía dưới).
3. **Cấu trúc Dữ liệu Đa dạng**:
   - Kết hợp giữa thẻ tóm tắt số liệu, danh sách hoạt động gần đây (Activity Feed), biểu đồ xu hướng (Sparklines) và bảng dữ liệu có thể sắp xếp.
