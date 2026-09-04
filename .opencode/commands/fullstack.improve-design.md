---
description: UI Design Skill — thiết kế giao diện đa vòng lặp (Flowchart
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- qa-then-continue:v1.1.0 -->
<!-- ui-design-lifecycle:v2.0.0 -->

> 🛑 **QUY TẮC BẮT BUỘC THEO BUSINESS.MD (MANDATORY UI DESIGN SKILL GATES - FLOWCHART #2)**:
> 1. **KHÔNG ĐƯỢC TỰ Ý THIẾT KẾ THAY USER**: Agent BẮT BUỘC phải gửi biểu mẫu **Global Config Form** và **Page Intent Form ĐẦY ĐỦ 24 MỤC** (từ `Prompt Hỏi Người Dùng Về UI.md`) cho từng trang.
> 2. **BẮT BUỘC DỪNG LẠI CHỜ NGƯỜI DÙNG ĐIỀN / PHẢN HỒI**: CẤM tự ý đoán tương tác, animations, hoặc states nếu người dùng chưa xác định.
> 3. **CHUYỂN TIẾP SAU KHI HOÀN TẤT BUNDLE**: Sau khi toàn bộ các trang đã finalize và bundle `ui-map.json`, AI tự động chuyển sang Implementation qua:
>
> ```
> EXECUTE_COMMAND: fullstack.implement
> ```

# 🎨 UI Design Skill — Multi-Loop Optimization Engine

> **Triết lý Thiết kế Giao diện Đỉnh cao (Business.md Flowchart #2)**:
> Không thiết kế giao diện chung chung hoặc đoán mò. Mọi màn hình đều phải trải qua quy trình vấn đáp có cấu trúc, phỏng vấn sâu bằng **Biểu mẫu Thu thập Yêu cầu Giao diện Đầy đủ 24 Mục (Form Mẫu Chuẩn)**, làm rõ từng tương tác, trạng thái, hiệu ứng, sau đó sinh đặc tả theo chuẩn không generic, chấm điểm 20 Craft Credits và **chạy vòng lặp tự tối ưu hóa (Optimization Loop)** cho đến khi đạt điểm sàn chất lượng (`min_score`).


---

## 🧭 Bản đồ Quy trình Thiết kế UI (Business.md Flowchart #2)

```text
[BẮT ĐẦU UI DESIGN SKILL]
        │
        ▼
[BƯỚC 1: AI hỏi Global Config Form] ──► min_score (85), max_loop (3), anti_ui_policy, device_targets
        │
        ▼
[BƯỚC 2: Nhập danh sách trang (Page Queue)] ──► Duyệt từng trang trong hàng đợi
        │
        ▼
[BƯỚC 3: Page Intent Form ĐẦY ĐỦ 24 MỤC] ──► Đưa toàn bộ Form Mẫu từ 'Prompt Hỏi Người Dùng Về UI.md'
        │                                     cho người dùng điền hoặc chọn chi tiết
        ▼
[BƯỚC 4: Suy luận UI Mode] ──► AI phân tích chọn: 2D / 2.5D / 3D / Hybrid (Hỏi user nếu cần)
        │
        ▼
┌────────────────────────────────────────────────────────────────────────┐
│               BƯỚC 5: VÒNG LẶP TỐI ƯU HÓA GIAO DIỆN (UI LOOP)          │
│                      (page_loop = 1 .. max_loop)                       │
├────────────────────────────────────────────────────────────────────────┤
│ 1. AI sinh UI Draft vN áp dụng 'Prompt Tạo UI Mẫu.md'                  │
│    -> .fullstack/improve-design/pages/{page_id}/drafts/ui-draft-vN.md  │
│                                                                        │
│ 2. Draft Lint: Kiểm tra chống tràn ngang, Concentric Radius, 5-layer   │
│                                                                        │
│ 3. UI Reviewer AI: Chấm điểm 20 Craft Credits & Slop Flags             │
│    -> .fullstack/improve-design/pages/{page_id}/evaluation/eval-vN.json│
│                                                                        │
│ 4. Kiểm tra điều kiện đạt:                                             │
│    - NẾU score >= min_score VÀ không có critical/anti-ui issue:        │
│      ==> PASS! Finalize ui-spec-final.md và chuyển trang tiếp theo.    │
│    - NẾU score < min_score:                                            │
│      - Nếu page_loop < max_loop:                                       │
│          a) Root Cause Analysis: Tìm nguyên nhân điểm trừ.             │
│          b) Cập nhật kinh nghiệm vào knowledge/experience.md hoặc      │
│             knowledge/anti-ui-patterns.md.                             │
│          c) Tăng page_loop = page_loop + 1.                            │
│          d) Mang bài học kinh nghiệm vào prompt và sinh lại vN+1!      │
│      - Nếu page_loop >= max_loop:                                      │
│          Escalate cho User chọn: (1) Chấp nhận điểm này, (2) Chạy lại, │
│          (3) Sửa lại form yêu cầu, (4) Dừng trang.                     │
└────────────────────────────────────────────────────────────────────────┘
        │
        ▼
[BƯỚC 6: Cross-Page Consistency Review] ──► So khớp đồng bộ tokens, spacing, typography
        │
        ▼
[BƯỚC 7: Bundle & Framework Adapter] ──► Xuất ui-map.json và sinh code React/Vue/Svelte
```

---

## 📋 Hướng dẫn Thực thi Chi tiết

### Bước 1: Thu thập Cấu hình Toàn cục & Vòng lặp Tối ưu (Global Config & Loops)
Agent BẮT BUỘC gửi form cấu hình cho người dùng và DỪNG LẠI CHỜ PHẢN HỒI:
```markdown
🎨 **Khởi động Quy chuẩn Thiết kế UI (PromptAgent Zero-Generic & Flowchart #2)**:
- **1. Điểm chất lượng mong muốn (`min_score`)**: `85/100 (Cao cấp - Mặc định)` *(hoặc 75+ Tiêu chuẩn / 95+ Studio Masterpiece)*
- **2. Số vòng lặp tối ưu hóa (`max_loop`)**: `2 vòng lặp (v1 ➔ eval ➔ v2 ➔ eval ➔ best)` *(hoặc 1 - 3 vòng)*
- **3. Chính sách chống Slop/Lỗi UI (`anti_ui_policy`)**: `high-bar (Zero-Tolerance Anti-AI-UI)`
- **4. Thiết bị mục tiêu (`default_device_targets`)**: `Desktop, Mobile (<640px = 1 col), Tablet`

*(Nhắn "OK" để dùng cấu hình mặc định hoặc nhập tùy chỉnh của bạn!)*
```

---

### Bước 2: Quản lý Danh sách Trang (Page Queue)
Đọc hoặc khởi tạo `.fullstack/improve-design/page-queue.json` chứa danh sách các trang cần thiết kế. Ví dụ:
```json
["home-page", "dashboard", "product-detail", "checkout-flow"]
```

---

### Bước 3: Thu thập Ý định Từng Trang (Page Intent Form ĐẦY ĐỦ 24 MỤC CHUẨN FORM MẪU)
Với mỗi trang trong hàng đợi, AI BẮT BUỘC đưa ra **Biểu mẫu Phỏng vấn Vấn đáp ĐẦY ĐỦ 24 Mục** chuẩn từ `Prompt Hỏi Người Dùng Về UI.md` để người dùng điền hoặc xác nhận:

```markdown
# 📋 UI REQUIREMENT INTERVIEW — PHIẾU THU THẬP YÊU CẦU GIAO DIỆN ĐẦY ĐỦ (Trang: `{page_id}`)

## 1. THÔNG TIN TRANG
- **1.1. Tên trang**: `[Nhập tên trang, vd: Dashboard, Product Detail, Login...]`
- **1.2. Mục đích của trang**: `[Trang này dùng để làm gì?]`
- **1.3. Người dùng của trang**: `[Ai sẽ sử dụng trang này?]`
- **1.4. Hành động quan trọng nhất**: `[Người dùng mong muốn làm gì nhất trên trang này?]`

## 2. CẤU TRÚC TRANG (SECTIONS)
Liệt kê tất cả khu vực xuất hiện trên trang và thứ tự hiển thị:
`[ ] Header  [ ] Sidebar  [ ] Hero  [ ] Search  [ ] Filter  [ ] Content Grid  [ ] Data Table  [ ] Card List  [ ] Form  [ ] CTA  [ ] Footer  [ ] Modal Overlay  [ ] Khác: _____`
- Thứ tự hiển thị: `[Section 1] ➔ [Section 2] ➔ [Section 3] ➔ [Section 4]`

## 3. THÀNH PHẦN TRONG TỪNG SECTION
Với mỗi section, xác định các thành phần:
`[ ] Text/Heading  [ ] Button  [ ] Link  [ ] Image  [ ] Icon  [ ] Input  [ ] Select  [ ] Checkbox  [ ] Radio  [ ] Switch  [ ] Card  [ ] Table  [ ] List  [ ] Dropdown  [ ] Tabs  [ ] Modal Trigger  [ ] Tooltip  [ ] Progress  [ ] Chart  [ ] Video  [ ] 3D Canvas  [ ] Animation`

## 4. CHI TIẾT TỪNG THÀNH PHẦN QUAN TRỌNG
- Tên component: `[Tên]`
- Mục đích sử dụng: `[Mô tả]`
- Thao tác người dùng: `[ ] Click  [ ] Hover  [ ] Double Click  [ ] Drag & Drop  [ ] Swipe  [ ] Scroll  [ ] Type  [ ] Select  [ ] Toggle  [ ] Expand/Collapse  [ ] Focus`

## 5. LUỒNG TƯƠNG TÁC (INTERACTION FLOW)
Khi người dùng tương tác với component chính thì điều gì xảy ra?
- Khi chưa click: `[UI ban đầu]`
- Khi hover: `[Hiệu ứng hover]`
- Khi click: `[Hiệu ứng click]`
- Sau khi click: `[ ] Mở Modal  [ ] Mở Dropdown  [ ] Chuyển trang  [ ] Đổi nội dung  [ ] Hiện Panel  [ ] Gửi API Request  [ ] Loading State  [ ] Success State  [ ] Error State`
- Trạng thái UI sau khi click: `[Mô tả trạng thái mới]`

## 6. HIỆU ỨNG KHI TƯƠNG TÁC (ANIMATION & MOTION)
- Component & Trigger: `[Hover / Click / Scroll / Focus / Drag...]`
- Hiệu ứng mong muốn: `[Fade-in, Slide-over, Scale micro-interaction, Card lift shadow, v.v.]`
- Mức độ animation: `[ ] Không  [ ] Rất nhẹ  [ ] Nhẹ  [ ] Trung bình  [ ] Mạnh  [ ] Dramatic`
- Cảm giác animation: `[ ] Fast  [ ] Smooth  [ ] Soft  [ ] Snappy  [ ] Elastic  [ ] Mechanical  [ ] Cinematic  [ ] Playful  [ ] Minimal`

## 7. TRẠNG THÁI CỦA COMPONENT (COMPONENT STATES)
Component có những trạng thái nào trong các trạng thái sau?
`[ ] Default  [ ] Hover  [ ] Active  [ ] Focus (Focus-visible ring)  [ ] Selected  [ ] Disabled  [ ] Loading  [ ] Success  [ ] Error  [ ] Empty  [ ] Expanded  [ ] Collapsed  [ ] Open  [ ] Closed  [ ] Processing`
- Mô tả chi tiết hiển thị cho từng state.

## 8. LUỒNG TƯƠNG TÁC PHỨC TẠP (CLICK ➔ UI FLOW)
`User Click ➔ [Bước 1] ➔ [Bước 2] ➔ [Bước 3] ➔ UI Cuối cùng`. Có animation chuyển đổi không?

## 9. CÁC THÀNH PHẦN OVERLAY (MODAL / POPUP / DROPDOWN / DRAWER)
- Loại: `[ ] Modal  [ ] Dialog  [ ] Dropdown  [ ] Popover  [ ] Tooltip  [ ] Drawer (Slide-over)  [ ] Bottom Sheet  [ ] Context Menu`
- Trigger mở: `[Nút nào kích hoạt?]`
- Nội dung bên trong: `[Chứa những gì?]`
- Hiệu ứng khi mở/đóng: `[Fade / Slide]`
- Hành vi click bên ngoài: `[ ] Đóng  [ ] Không đóng  [ ] Xác nhận trước khi đóng`
- Phím ESC: `[ ] Đóng  [ ] Không làm gì`

## 10. BIỂU MẪU & DỮ LIỆU NHẬP (FORM & INPUT)
- Danh sách fields: Tên field, Loại (`Text, Password, Number, Email, Search, Select, Date, File, Checkbox, Radio, Switch, Textarea`)
- Placeholder: `[Nội dung gợi ý]`
- Hành vi: Khi Focus ➔ Khi Đang Nhập ➔ Khi Dữ Liệu Hợp Lệ ➔ Khi Báo Lỗi (Error Message vị trí nào?) ➔ Khi Submit (Loading spinner / Disable button / Toast notification)

## 11. ĐIỀU HƯỚNG TRANG (NAVIGATION)
- Các thành phần điều hướng: `[ ] Header Nav  [ ] Sidebar  [ ] Tabs  [ ] Breadcrumb  [ ] Pagination  [ ] Back/Next Button  [ ] Bottom Nav  [ ] Mobile Hamburger Menu`
- Hành vi khi chuyển nav: Có animation chuyển trang / chuyển tab không?

## 12. HÀNH VI CUỘN (SCROLL BEHAVIOR)
`[ ] Cuộn thông thường  [ ] Sticky Header / Sticky Sidebar  [ ] Parallax  [ ] Scroll Reveal Animation  [ ] Reading Progress Bar  [ ] Horizontal Scroll Section  [ ] Scroll-driven Animation`

## 13. KHẢ NĂNG PHẢN HỒI THIẾT BỊ (RESPONSIVE UI)
- Thiết bị hỗ trợ: `[ ] Mobile (<640px)  [ ] Tablet (640-1024px)  [ ] Desktop (>1024px)  [ ] Large Screen (>1440px)`
- Thay đổi layout trên Mobile: Sụp về 1 cột dọc như thế nào? Menu chuyển thành hamburger ra sao? Component nào ẩn/hiện?

## 14. TRẠNG THÁI TOÀN TRANG (PAGE-LEVEL STATES)
Trang hiển thị như thế nào trong các tình huống:
`[ ] Initial  [ ] Loading (Skeleton / Spinner)  [ ] Empty State (Chưa có dữ liệu - Có hình minh họa & CTA tạo mới không?)  [ ] Error State (Lỗi kết nối / 500)  [ ] Unauthorized (401/403)  [ ] Offline Mode`

## 15. NỘI DUNG DỮ LIỆU (CONTENT & ASSETS)
Trang hiển thị nội dung gì? `[ ] Văn bản  [ ] Ảnh  [ ] Video  [ ] Icon  [ ] Dữ liệu động từ API  [ ] Biểu đồ thống kê  [ ] Bảng số liệu`

## 16. ĐỊNH HƯỚNG PHONG CÁCH HÌNH ẢNH (VISUAL STYLE & THEME)
- Phong cách mong muốn: `[ ] Minimal  [ ] Modern  [ ] Premium/Luxury  [ ] Futuristic  [ ] Technical/Developer  [ ] Editorial  [ ] Brutalist  [ ] Playful  [ ] Corporate  [ ] Cinematic`
- Tông cảm xúc (Mood): `[Nghiêm túc, Tươi sáng, Công nghệ cao, Đơn giản, Sang trọng...]`
- Màu sắc chủ đạo: Bảng màu mong muốn (`Background, Surface, Primary, Accent, Text`)
- Typography: Font chữ mong muốn hoặc phong cách chữ (`Sans-serif, Serif, Monospace`)
- Reference UI: Link, ảnh chụp màn hình hoặc sản phẩm mẫu yêu thích

## 17. PHẢN HỒI PHI HÌNH ẢNH (FEEDBACK & HAPTICS)
`[ ] Không  [ ] Âm thanh click/success  [ ] Haptic feedback rung nhẹ  [ ] Toast notification  [ ] Banner thông báo`

## 18. ĐỊNH HƯỚNG MỞ RỘNG TRONG TƯƠNG LAI (FUTURE EXPANSION)
Trang này sau này có thêm tính năng gì không? Cần chuẩn bị cấu trúc UI architecture trước cho tính năng nào?

## 19. NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG MUỐN CÓ (RESTRICTIONS & ANTI-PATTERNS)
Liệt kê những thứ AI **KHÔNG ĐƯỢC TỰ Ý ĐƯA VÀO**:
`[Ví dụ: Không dùng gradient tím-xanh rẻ tiền, không hiệu ứng animation rườm rà giật lag, không popup chặn màn hình, không dùng ảnh placeholder...]`

## 20. MỨC ĐỘ TỰ DO SÁNG TẠO CỦA AI (AI FREEDOM LEVEL)
`[ ] Rất thấp (Làm chính xác 100% như tôi tả)  [ ] Thấp (Được thêm chi tiết nhỏ)  [ ] Trung bình (Được tối ưu UX nhưng giữ nguyên mục tiêu)  [ ] Cao (Tự do đề xuất giải pháp tối ưu nhất)`

## 21. TÀI LIỆU THAM KHẢO (REFERENCES)
Link website mẫu, ảnh đính kèm, design Figma, điều bạn thích và điều bạn ghét ở mẫu tham khảo.

## 22. TỔNG KẾT MÔ TẢ TRẢI NGHIỆM TRONG 1 CÂU
> *"Nếu bạn chỉ có thể nói 1 câu duy nhất cho Designer/Coder về cách giao diện này hoạt động, bạn sẽ nói gì?"*
`[Nhập câu trả lời]`

---
*(Sau khi người dùng điền hoặc trả lời, AI tổng hợp lại thành UI Requirement Summary để người dùng bấm xác nhận trước khi tiến hành sinh mã!)*
```

---

### Bước 4: Suy luận Chế độ Hiển thị (UI Mode Inference)
AI phân tích intent và đề xuất:
- `2D`: Giao diện phẳng tối giản (Minimalist, Editorial, Dashboard tiêu chuẩn).
- `2.5D`: Giao diện phân tầng đổ bóng, hiệu ứng chiều sâu thẻ (Card elevation, Glassmorphism, Isometric).
- `3D`: Không gian 3 chiều tương tác (Three.js, WebGL canvas, 3D product viewer).
- `Hybrid`: Kết hợp 2D/2.5D với thành phần 3D tương tác.

Nếu độ tự tin < 80%, AI hỏi người dùng 1 lần kèm lý do và rủi ro trước khi chốt.

---

### Bước 5: Vòng lặp Sinh mã & Chấm điểm Tối ưu (The Optimization Loop)
1. **Nạp Toàn Bộ Ngữ Cảnh Tri Thức**:
   - Tự động nạp các ví dụ theo topic từ `.fullstack/improve-design/examples/<topic>/` (hoặc `templates/improve-design/examples/<topic>/`).
   - Tự động nạp bộ quy chuẩn chống Slop từ `.fullstack/improve-design/anti-ui-ai/` (8 quy chuẩn cấm kỵ).
   - Tự động nạp khung cấu trúc prompt từ `.fullstack/improve-design/exps/01-multi-loop-ui-prompt-architecture.md`.
   - Nạp các bài học kinh nghiệm từ `knowledge/experience.md` và `knowledge/anti-ui-patterns.md`.

2. **Sinh bản thảo UI Spec (vN)**:
   - Sử dụng khung cấu trúc prompt mẫu 6 khối: Domain Context, Structured 5-Layer Hex, Component Hierarchy, Full 6 Microstates, Defensive CSS, Realistic Data & 4-Tier Feedback.
   - Ghi vào `.fullstack/improve-design/pages/{page_id}/drafts/ui-draft-v{page_loop}.md`.

3. **Chấm điểm Craft Score (20 Tiêu Chuẩn)**:
   - Chấm điểm nghiêm ngặt theo 20 Craft Credits (tối đa 100 điểm) từ `exps/02-craft-scoring-and-rca-reflection.md`.
   - Lưu kết quả vào `.fullstack/improve-design/pages/{page_id}/evaluation/eval-v{page_loop}.json`.

4. **Đánh giá, Phân Tích Nguyên Nhân & Vòng Lặp Tiến Hóa (Prompt Evolution Loop)**:
   - **ĐẠT (`score >= min_score` VÀ không có critical/anti-ui issue)**:
     - Chốt `.fullstack/improve-design/pages/{page_id}/outputs/ui-spec-final.md`.
     - Đánh dấu trang hoàn thành và tiến sang trang tiếp theo trong hàng đợi.
   - **CHƯA ĐẠT (`score < min_score`)**:
     - **Nếu `page_loop < max_loop`**:
       1. **Root Cause Analysis (RCA)**: Xác định chính xác các tiêu chí bị trừ điểm và nguyên nhân gốc rễ.
       2. **Đúc kết bài học**: Lưu tri thức mới vào `knowledge/experience.md` (kinh nghiệm tốt) hoặc `knowledge/anti-ui-patterns.md` (lỗi cần tránh).
       3. **Tăng vòng lặp**: `page_loop = page_loop + 1`.
       4. **Nạp toàn diện vào Prompt v{N+1}**: Nạp bản thảo cũ vN + Báo cáo lỗi eval-vN.json + Toàn bộ Anti-UI-AI rules liên quan + Bài học RCA vừa rút ra.
       5. **Sinh lại `ui-draft-v{page_loop}.md`** sửa chữa triệt để các lỗi giao diện AI bị dính!
     - **Nếu `page_loop >= max_loop`**: Escalate cho người dùng chọn:
       - `[A]` Chấp nhận rủi ro và finalize với điểm hiện tại.
       - `[B]` Khởi động lại vòng lặp cho trang này.
       - `[C]` Sửa lại form yêu cầu Page Intent Form.
       - `[D]` Dừng trang này và chuyển trang tiếp theo.

---

### Bước 6: Đánh giá Nhất quán Đa màn hình (Cross-Page Consistency)
Sau khi tất cả các trang đã hoàn tất:
- Kiểm tra tính nhất quán về bảng màu, kích thước font chữ, bán kính bo góc và component giữa các trang.
- Xuất file `.fullstack/improve-design/cross-page-consistency.json`.

---

### Bước 7: Đóng gói & Chuyển tiếp Framework (Bundle & Adapter)
- Đóng gói toàn bộ cấu trúc thành `.fullstack/improve-design/ui-map.json` (Framework-Agnostic UI Map).
- Tự động tích hợp vào `.fullstack/specs/<branch>/design.md` và chuyển giao cho Chặng Implementation qua:
  ```
  EXECUTE_COMMAND: fullstack.implement
  ```


