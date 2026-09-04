---
name: Anti-AI-UI Slop Overview
category: anti-ui-ai
priority: 100
tags: [anti-slop, zero-generic, craft-standards, ui-quality]
applies_to: [ui-design, drafting, evaluation, code-generation]
---

# 🛑 Anti-AI-UI Slop Overview — Bộ Nhận Diện & Phòng Thủ 12 Lỗi UI AI Điển Hình

Giao diện do AI sinh ra thường mắc phải các hội chứng "AI Slop" — tạo cảm giác hào nhoáng giả tạo nhưng thiếu công năng, thiếu phân cấp thị giác, vỡ layout trên thiết bị thực và không thể đưa vào production.

Tất cả các bản thiết kế, prompt sinh mã và component frontend BẮT BUỘC tuân thủ tiêu chuẩn Zero-Generic và triệt tiêu 12 lỗi sau:

---

## 🚫 12 Biểu Hiện UI AI Slop Cấm Kỵ

| STT | Triệu Chứng AI Slop | Biểu Hiện Điển Hình | Chuẩn Khắc Phục Chuẩn Mực |
| :--- | :--- | :--- | :--- |
| 1 | **Purple-Blue Slop Gradient** | Dùng dải màu tím-xanh tím `#6366f1` ➔ `#8b5cf6` làm nền/button tràn lan | Dùng bảng màu 5 tầng cấu trúc (`--bg-canvas`, `--bg-surface`, `--border-hairline`, `--text-primary`, `--accent` duy nhất). |
| 2 | **Metric Inflation & Fake Badges** | Đặt hàng loạt thẻ thống kê với badge `+24.8%`, `+12.5%` màu xanh lá không có ngữ cảnh | Chỉ hiển thị số liệu thực tế có ý nghĩa nghiệp vụ, có bộ lọc thời gian và nhãn giải thích rõ ràng. |
| 3 | **Generic Card Duplication** | Lặp lại 4-6 thẻ giống hệt nhau có icon trong vòng tròn mờ, không có phân cấp chính/phụ | Phân cấp thị giác: Thẻ chính (Hero/Primary action) nổi bật, thẻ phụ tinh gọn; cấu trúc linh hoạt theo dữ liệu. |
| 4 | **Missing Microstates** | Nút bấm và thẻ chỉ có 1 trạng thái tĩnh; không có `:focus-visible`, `active`, `loading`, `disabled` | Bắt buộc đủ 6 microstates cho mọi controls tương tác: Default, Hover, Focus-visible ring, Active, Disabled, Loading. |
| 5 | **Horizontal Overflow Fragility** | Vỡ layout khi màn hình nhỏ hoặc dữ liệu dài; xuất hiện thanh cuộn ngang ngoài ý muốn | Quy tắc Zero Horizontal Overflow: `box-sizing: border-box`, `max-width: 100%`, `min-w-0` trên Flex/Grid children; cấm `100vw`/`w-screen` trên inner container. |
| 6 | **Toy Border Radius** | Bo góc quá mức `rounded-2xl` / `rounded-3xl` (24px-32px) cho mọi nút và thẻ con | Bo góc đồng tâm (Concentric Radius Hierarchy): $R_{inner} = \max(0, R_{outer} - padding)$. Bo góc nút tối đa 6-8px, thẻ 10-14px. |
| 7 | **Mobile Breakage (<640px)** | Cố tình giữ 2-3 cột trên màn hình điện thoại khiến chữ đè nhau hoặc cắt bớt | Mobile-First Containment: Màn hình <640px sụp về đúng 1 cột dọc; touch target tối thiểu 44x44px; cấm fixed width >= 320px. |
| 8 | **Lorem Ipsum & Grey Placeholders** | Để văn bản vô nghĩa `Lorem ipsum dolor`, khối xám `Image placeholder` | Dùng dữ liệu mẫu sát thực tế ngành nghề (realistic domain copy & assets), nhãn nút rõ hành động. |
| 9 | **Flat Contrast & Gray-on-Gray** | Chữ xám nhạt `#9ca3af` trên nền xám `#1f2937` không đọc được dưới ánh sáng ban ngày | Đảm bảo tương phản WCAG AA: Tối thiểu 4.5:1 cho body text và 3:1 cho large text/icons. |
| 10 | **Orphaned Actions / Dead Buttons** | Nút bấm "Click here", "Get Started" không có hành vi xác định, không liên kết luồng | Mỗi action phải có luồng rõ ràng: Mở modal, chuyển tab, submit form, hoặc feedback trực quan. |
| 11 | **Form Input Blindness** | Input không có label cố định, chỉ dùng placeholder mờ; không có inline error feedback | Luôn có Label rõ ràng, helper text, error text có icon và màu cảnh báo khi validation fail. |
| 12 | **Chaotic Spacing Scale** | Dùng khoảng cách ngẫu nhiên (13px, 19px, 27px, 33px) không theo hệ thống | Tuân thủ Spacing Scale bội số 4px/8px: `4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px`. |

---

## 🎯 Quy Trình Kiểm Tra Slop Gate (Zero-Tolerance Checklist)

Trước khi chuyển giao bản thiết kế hoặc mã nguồn UI, AI BẮT BUỘC tự kiểm tra:
1. Có bất kỳ dải gradient tím xanh cliché `#6366f1` / `#8b5cf6` nào không? ➔ **NẾU CÓ: FAIL.**
2. Có phần tử nào gây thanh cuộn ngang khi thu nhỏ màn hình xuống 360px không? ➔ **NẾU CÓ: FAIL.**
3. Mọi nút bấm và trường nhập liệu có custom `:focus-visible` ring không? ➔ **NẾU KHÔNG: FAIL.**
4. Bo góc phần tử con có lớn hơn phần tử cha không? ➔ **NẾU CÓ: FAIL.**
5. Màn hình điện thoại <640px có sụp về 1 cột dọc không? ➔ **NẾU KHÔNG: FAIL.**
