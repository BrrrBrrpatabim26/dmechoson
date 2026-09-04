---
name: Anti Toy Radii & Flat Contrast Hierarchy
category: anti-ui-ai
priority: 85
tags: [border-radius, concentric-radius, contrast-wcag, visual-craft]
applies_to: [ui-design, drafting, styling]
---

# 🚫 Anti-Toy Radii & Phân Tầng Bo Góc Đồng Tâm (Concentric Radius Hierarchy)

## 1. Hội chứng Bo Góc Đồ Chơi (Toy UI)
AI thường áp dụng bo góc cực đại (`rounded-2xl`, `rounded-3xl` hoặc `24px`-`32px`) bừa bãi lên mọi thành phần (nút bấm nhỏ, ô input, dropdown menu, badge, container). Khi các góc quá tròn mà không có tỷ lệ đồng tâm với padding, giao diện trông như đồ chơi trẻ em (toy app) và mất đi độ tinh tế, chuyên nghiệp.

## 2. Công Thức Bo Góc Đồng Tâm (Concentric Radius Formula)

Khi một phần tử nằm bên trong một phần tử khác, bán kính bo góc của phần tử con ($R_{inner}$) BẮT BUỘC phải nhỏ hơn phần tử cha ($R_{outer}$) đúng bằng khoảng cách đệm ($padding$):

$$R_{inner} = \max(0, R_{outer} - padding)$$

### Ví dụ Thực tế:
- **Thẻ Card bao ngoài**: `padding = 16px`, `border-radius = 16px` ($R_{outer}$).
- **Nút bấm hoặc ô ảnh bên trong thẻ**: 
  $$R_{inner} = \max(0, 16px - 16px) = 0px \text{ đến tối đa } 6px-8px$$
  *(Nếu nút bên trong lại có bo góc 24px thì sẽ tạo ra khe hở méo mó kỳ dị ở góc).*

## 3. Thang Đo Bán Kính Bo Góc Tiêu Chuẩn Cho Web & App
| Thành phần | Bán kính Bo góc Chuẩn |
| :--- | :--- |
| **Badges / Tags** | 4px - 6px (hoặc `rounded-full` nếu là pill badge nhỏ) |
| **Buttons / Inputs / Selects** | 6px - 8px |
| **Dropdowns / Tooltips / Popovers** | 8px - 10px |
| **Cards / Panels / Tables** | 10px - 14px |
| **Modals / Large Dialogs** | 14px - 18px |
| **Toàn bộ trang / Window** | 0px (Full viewport) |

## 4. Kiểm Định Độ Tương Phản (WCAG AA Compliance)
- Mọi văn bản chính (`--text-primary`): Đạt tối thiểu **4.5:1** so với nền phía dưới.
- Văn bản phụ (`--text-secondary`): Đạt tối thiểu **3.5:1**.
- Đường viền (`--border-hairline`): Phải đủ nhìn thấy rõ ràng trên màn hình độ sáng 50%, không bị chìm hoàn toàn vào nền.
