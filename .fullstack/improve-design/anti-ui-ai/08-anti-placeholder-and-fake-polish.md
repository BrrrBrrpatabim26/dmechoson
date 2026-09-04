---
name: Anti Placeholder & Fake Polish
category: anti-ui-ai
priority: 85
tags: [placeholder-free, realistic-copy, validation-feedback, production-ready]
applies_to: [ui-design, drafting, copywriting, form-design]
---

# 🚫 Anti-Placeholder & Quy Chuẩn Giao Diện Sẵn Sàng Thực Tế (Production-Ready)

## 1. Hội chứng Fake Polish & Placeholder Lười Biếng
AI hay dùng các kỹ xảo "đánh lừa mắt" để che giấu việc chưa hoàn thiện thiết kế:
- Điền văn bản giả: `Lorem ipsum dolor sit amet...`, `John Doe`, `example@email.com`.
- Dùng hình chữ nhật màu xám ghi chữ `[Image 800x600]`.
- Nút bấm chỉ để cho đẹp, không gắn sự kiện (No click handler, không chuyển hướng, không mở dialog).
- Biểu mẫu (Form) không có thông báo lỗi chi tiết khi người dùng nhập sai.

## 2. Tiêu Chuẩn Thực Tế Bắt Buộc

### A. Nội dung Sát Ngữ Cảnh Nghiệp Vụ (Realistic Domain Copy)
- Nếu làm ứng dụng E-commerce bán giày: Dùng tên sản phẩm thật (`Nike Air Zoom Pegasus 40`), giá tiền thật (`$139.99`), đánh giá thật (`4.8 ★ (1,240 đánh giá)`).
- Nếu làm B2B SaaS Dashboard: Dùng chỉ số thật (`MRR: $42,850`, `Active Seats: 128/150`, `API Latency: 142ms`).

### B. 4 Tầng Phản Hồi Ngữ Cảnh (4-Tier Contextual Feedback System)
Mọi tương tác từ người dùng phải nhận được 1 trong 4 loại phản hồi phù hợp:
1. **Inline Alert / Field Error**: Lỗi trực tiếp tại trường nhập liệu (vd: "Mật khẩu cần tối thiểu 8 ký tự kèm chữ số").
2. **In-Pane Banner**: Thông báo trạng thái của khu vực nội dung (vd: "Tài khoản của bạn đang dùng thử còn 3 ngày").
3. **Bottom Snackbar / Toast**: Thông báo không làm gián đoạn luồng làm việc (vd: "Đã lưu thay đổi vào bản nháp", kèm nút Undo).
4. **Blocking Modal Dialog**: Dành riêng cho hành động nguy hiểm không thể khôi phục (vd: "Bạn có chắc chắn muốn xoá vĩnh viễn dự án này?").

### C. Trạng Thái Rỗng Đầy Đủ (Empty State With Action)
Khi bảng hoặc danh sách chưa có dữ liệu, KHÔNG ĐƯỢC để màn hình trắng trơn. BẮT BUỘC cung cấp:
- Icon minh họa trực quan.
- Tiêu đề thông báo rõ ràng: "Chưa có đơn hàng nào".
- Mô tả hướng dẫn: "Khi có khách đặt hàng mới, đơn hàng sẽ xuất hiện tại đây".
- Nút bấm hành động tạo mới (Primary CTA): "+ Tạo đơn hàng đầu tiên".
