---
name: Craft Scoring & Root Cause Analysis Reflection
category: exps
priority: 95
tags: [craft-score, 20-criteria, rca, evaluation, self-reflection]
applies_to: [ui-design, evaluation, self-learning]
---

# 🎯 Craft Scoring (20 Tiêu Chuẩn) & Phân Tích Nguyên Nhân Lỗi (RCA)

## 1. Bảng 20 Craft Credits Đánh Giá Chất Lượng UI (Thang Điểm 100)

Mỗi tiêu chí chiếm 5 điểm (Tổng cộng 100 điểm):

| Nhóm | STT | Tiêu Chí Đánh Giá (Craft Credit) | Điểm Tối Đa |
| :--- | :--- | :--- | :--- |
| **I. Typography & Color** | 1 | Typography Hierarchy: Tỷ lệ kích thước rõ ràng (H1 > H2 > H3 > Body > Small), pairing chuẩn | 5 |
| | 2 | 5-Layer Hex Palette: Bảng màu cấu trúc chuẩn, không gradient tím xanh rẻ tiền | 5 |
| | 3 | WCAG AA Contrast: Tương phản chữ >= 4.5:1, không bị chìm xám trên xám | 5 |
| | 4 | Line-height & Spacing: Dãn dòng hợp lý (1.4 - 1.6 cho body, 1.1 - 1.25 cho headings) | 5 |
| **II. Layout & Responsive** | 5 | Zero Horizontal Overflow: Không có thanh cuộn ngang ngoài ý muốn trên mọi kích thước | 5 |
| | 6 | Mobile-First Containment: Màn hình <640px sụp về đúng 1 cột dọc | 5 |
| | 7 | Concentric Radius Hierarchy: Bo góc đồng tâm $R_{inner} = \max(0, R_{outer} - padding)$ | 5 |
| | 8 | Spacing Scale Consistency: Spacing tuân thủ nghiêm ngặt hệ 4px/8px | 5 |
| **III. Components & Microstates** | 9 | Full 6 Microstates: Default, Hover, Focus-visible, Active, Disabled, Loading | 5 |
| | 10 | Custom Focus-visible Ring: Có viền bàn phím rõ nét cho accessibility | 5 |
| | 11 | Touch Target Accessibility: Vùng chạm trên mobile đạt tối thiểu 44x44px | 5 |
| | 12 | Primary vs Secondary Differentiation: Phân biệt rõ ràng nút chính và nút phụ | 5 |
| **IV. Data, Form & Feedback** | 13 | Form Validation Feedback: Lỗi hiển thị rõ ràng ngay tại ô nhập liệu kèm icon | 5 |
| | 14 | 4-Tier Contextual Feedback: Inline alert, banner, snackbar, modal đúng ngữ cảnh | 5 |
| | 15 | Empty State With Action: Có minh họa, mô tả và nút CTA khi chưa có dữ liệu | 5 |
| | 16 | Loading State With Skeleton: Có khung xương mờ thay vì màn hình trắng trơn | 5 |
| **V. Polish & Production-Ready** | 17 | Realistic Domain Copy: Dữ liệu thật sát ngành nghề, không dùng Lorem Ipsum | 5 |
| | 18 | Micro-interactions: Chuyển động nhẹ nhàng (150ms-250ms), không giật lag | 5 |
| | 19 | Responsive Navigation: Header/Sidebar chuyển thành drawer/bottom nav trên mobile | 5 |
| | 20 | Table / Code Overflow Safety: Bảng dữ liệu có container cuộn ngang riêng biệt | 5 |

---

## 2. Quy Trình Phân Tích Nguyên Nhân Lỗi (RCA - Root Cause Analysis)

Khi chấm điểm và phát hiện `score < min_score`:
1. **Liệt kê lỗi cụ thể**: Ghi rõ tiêu chí nào bị trừ điểm (ví dụ: "Tiêu chí 5 trừ 5 điểm: bảng dữ liệu làm bung layout ngang ở 375px").
2. **Xác định nguyên nhân gốc rễ (Root Cause)**:
   - *Lỗi cú pháp / CSS*: Thiếu `box-sizing: border-box`, dùng `100vw`, hoặc thiếu `min-w-0`.
   - *Lỗi thiết kế*: Dùng sai màu, bo góc quá to, thiếu trạng thái loading/empty.
3. **Phân loại tri thức tự học**:
   - Nếu là lỗi anti-pattern hệ thống ➔ Đúc kết vào `knowledge/anti-ui-patterns.md`.
   - Nếu là kinh nghiệm thiết kế hay hoặc giải pháp tối ưu ➔ Ghi nhận vào `knowledge/experience.md`.
4. **Chuẩn bị đầu vào cho vòng lặp kế tiếp**:
   - Đưa toàn bộ danh sách điểm trừ và bài học RCA vào prompt v(N+1) để AI sửa chữa triệt để.
