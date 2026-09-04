---
description: Master auto-orchestrator — điều phối toàn bộ vòng đời Spec-Driven Development theo đúng 2 Flowcharts trong Business.md. Thực hiện đầy đủ các vòng lặp (Loops), Vấn đáp & Điền form (Interactive Q&A / Forms), phân loại Backend/Frontend/Fullstack, UI Design 20 tiêu chuẩn và chạy lệnh Debug Test thực tế.
---


<!-- end-to-end-automation:v2.0.0 -->
<!-- business-lifecycle-orchestrator:v2.0.0 -->

# 🎯 Master SDD Orchestrator (`/fullstack.auto`)

> **Triết lý điều phối chuẩn mực theo Business.md**:  
> `/fullstack.auto` là **nhạc trưởng tối cao** dẫn dắt toàn bộ vòng đời phát triển phần mềm: từ ý tưởng ban đầu, phân loại phạm vi kiến trúc, phỏng vấn vấn đáp thu thập yêu cầu có cấu trúc, thiết kế UI đa vòng lặp chấm điểm, phân rã nhiệm vụ, viết code thực tế, và **chạy lệnh Debug Test thực tế trong terminal** cho đến khi bàn giao sản phẩm.
>
> ⚠️ **QUY TẮC BẮT BUỘC CHO AI AGENT KHI THỰC THI LỆNH NÀY (PROMPT CỨNG BUSINESS.MD)**:
> 1. **KHÔNG ĐƯỢC TỰ Ý BỎ QUA VẤN ĐÁP & ĐIỀN FORM**: Agent BẮT BUỘC phải gửi câu hỏi / form phỏng vấn và **DỪNG LẠI (STOP & WAIT) CHỜ NGƯỜI DÙNG PHẢN HỒI** tại các chặng:
>    - **Chặng 1**: Form Scope (`ARCH_SCOPE`) & Delivery Target (`DELIVERY_TARGET`).
>    - **Chặng 2**: Phỏng vấn 3 câu hỏi làm rõ FR/NFR & Gate phê duyệt `spec.md` (`REQ_GATE`).
>    - **Chặng 3**: Tư vấn Architecture ADR, `FUTURE_QUEST` & Gate phê duyệt Kiến trúc (`ARCH_GATE`).
>    - **Chặng 4**: Flowchart #2 UI Design: Global Config Form, Page Intent Form (từ `Prompt Hỏi Người Dùng Về UI.md`), UI Mode confirmation (`ASK_UI_MODE_ONCE`), và Escalation (`HUMAN_PAGE_DECISION`).
>    - **Chặng 5**: Trình bày 13 lĩnh vực thiết kế giải pháp & Gate phê duyệt (`DESIGN_USER_REVIEW` / `CHANGE_APPROVE`).
>    - **Chặng 6-7**: Debug Test thực tế trong shell & Gate phê duyệt kiểm định (`TEST_GATE`).
>    - **Chặng 8**: Phê duyệt phát hành (`RELEASE_GATE`) & hoàn tất (`DOD_CHECK`).
> 2. **CẤM TỰ BỎ QUA GATE BẰNG LÝ DO ẢO**: Tuyệt đối CẤM ghi nhận `auto-resolved by constitution §4a` với inputs rỗng `{}` mà không qua phỏng vấn người dùng.
> 3. **BẮT BUỘC CHẠY VÒNG LẶP (LOOPS) THỰC TẾ**:
>    - **UI Design Loop**: Sinh bản thảo v1 ➔ Chấm điểm theo 20 tiêu chuẩn ➔ Nếu điểm < `min_score` thì phân tích nguyên nhân, đúc kết bài học vào `experience.md` / `anti-ui-patterns.md`, tăng vòng lặp và sinh bản thảo v2, v3!
>    - **Debug Test Loop**: Khi viết code, BẮT BUỘC chạy lệnh kiểm thử thật trong shell (`pytest`, `npm test`, linter, v.v.). Nếu phát hiện lỗi (test fail hoặc lint fail), BẮT BUỘC kích hoạt luồng Debug: đọc log lỗi ➔ định vị nguyên nhân ➔ sửa code ➔ chạy lại lệnh test cho đến khi PASS hoàn toàn!

---

## 🗺️ Bản đồ 8 Chặng Thực thi Theo Business.md

```text
[BẮT ĐẦU]
   │
   ▼
[CHẶNG 0: Khảo sát Mã nguồn] ──(Có code?)──► [Phân tích Codebase & Đánh giá Kiến trúc]
   │ (Không / Dự án mới)
   ▼
[CHẶNG 1: Vấn đáp Phạm vi & Mục tiêu] ──► AI đưa Form: Backend / Frontend / Fullstack / Extended
   │                                       và Delivery Target: Prototype / Staging / Production
   ▼ [DỪNG LẠI CHỜ USER TRẢ LỜI]
[CHẶNG 2: Vấn đáp Yêu cầu & Làm rõ] ──► Phỏng vấn 3 câu hỏi ➔ spec.md ➔ User duyệt Req Gate
   │
   ▼ [DỪNG LẠI CHỜ USER DUYỆT]
[CHẶNG 3: Thiết kế Kiến trúc] ──► Backend/Frontend Arch, ADR, Future Quest ➔ User duyệt Arch Gate
   │
   ▼ [DỪNG LẠI CHỜ USER DUYỆT]
[CHẶNG 4: UI Design Skill (Flowchart #2)] ──► Áp dụng khi Scope có Frontend / UI
   │   ├── Bước 4.1: AI hỏi Global Config Form ➔ [DỪNG LẠI CHỜ USER]
   │   ├── Bước 4.2: Page Queue (Danh sách trang)
   │   ├── Bước 4.3: Page Intent Form (24 mục từ 'Prompt Hỏi Người Dùng Về UI.md') ➔ [DỪNG LẠI CHỜ USER]
   │   ├── Bước 4.4: Suy luận UI Mode (Hỏi user nếu cần ➔ [DỪNG LẠI CHỜ USER])
   │   ├── Bước 4.5: VÒNG LẶP TỐI ƯU (Draft vN ➔ Audit 20 Craft Credits ➔ Root Cause ➔ Learn ➔ Re-generate)
   │   └── Bước 4.6: Cross-Page Consistency Review ➔ ui-map.json
   ▼
[CHẶNG 5: Thiết kế Giải pháp (13 Lĩnh vực)] ──► Domain, App, Contract, Data, UI, Security...
   │                                             ➔ User Design Review & Approval Gate [DỪNG LẠI CHỜ USER]
   ▼
[CHẶNG 6: Triển khai Code & Debug Test Thực tế]
   │   ├── Phân rã nhiệm vụ (Task Breakdown T001, T002, ...)
   │   ├── Sinh mã nguồn hoàn chỉnh (Code thực tế, không dùng placeholder)
   │   └── 🔴 DEBUG TEST LOOP: Chạy lệnh test thật trong terminal (pytest / npm test / lint)
   │         └── Nếu test lỗi: Đọc traceback ➔ Fix code ➔ Chạy lại test đến khi PASS!
   ▼
[CHẶNG 7: Kiểm định 10 Lớp & Báo cáo Nghiệm thu]
   │   ├── Chạy 10 tầng kiểm thử (Unit, Integration, Contract, E2E, Security, Perf, Regression...)
   │   └── Xuất verification-report.md ➔ User duyệt Test Gate [DỪNG LẠI CHỜ USER]
   ▼
[CHẶNG 8: Đóng gói Phát hành & Vận hành (Nếu Target = Staging/Production)]
   │   └── User duyệt Release Gate & DoD Check [DỪNG LẠI CHỜ USER]
   ▼
[HOÀN THÀNH BÀN GIAO]
```

---

## 📋 Chi tiết Từng Chặng Thực thi

### 🏁 Chặng 0 — Khảo sát Mã nguồn Hiện tại (Triage)
1. Kiểm tra xem thư mục hiện tại có mã nguồn sẵn có không:
   - **Nếu có mã nguồn sẵn**: Chạy phân tích kiến trúc hiện tại bằng lệnh:
     ```bash
     python scripts/python/flowchart_progress.py mark --node codebase_analysis --status ok
     ```
     Đánh giá Technical Debt: nếu nợ kỹ thuật nghiêm trọng thì đề xuất Refactor/Redesign, nếu đạt thì chuyển sang tìm hiểu kiến trúc sẵn có (`understand_arch`).
   - **Nếu dự án mới hoàn toàn**: Khởi tạo tiến trình dự án mới (`new_init`).
2. Khởi tạo theo dõi tiến độ flowchart:
   ```bash
   python scripts/python/flowchart_progress.py init --flowchart business_1_fullstack_sdd --spec-id "$ARGUMENTS"
   ```

---

### 💬 Chặng 1 — Vấn đáp Phạm vi & Mục tiêu Bàn giao (Scope & Target Gate)
> 🛑 **PROMPT CỨNG BẮT BUỘC CHO AGENT**: Gửi biểu mẫu sau và **DỪNG LẠI CHỜ PHẢN HỒI CỦA NGƯỜI DÙNG**:

```markdown
📋 **Xác nhận Phạm vi Kiến trúc & Mục tiêu Dự án (Business.md Gate 1)**:
Vui lòng chọn hoặc xác nhận thông tin dự án của bạn:

**1. Phạm vi kiến trúc (`ARCH_SCOPE`):**
- **[A] Backend**: Chỉ làm Backend (API Rest/GraphQL, Database, Business Logic, Worker, Auth).
- **[B] Frontend**: Chỉ làm Giao diện UI/UX (Web Frontend, Mobile App, Components, Client State).
- **[C] Backend + Frontend (Khuyên dùng)**: Toàn diện Fullstack (Cả hệ thống Server, Database và Giao diện người dùng).
- **[D] Extended**: Bao gồm cả Admin Dashboard, Data Pipeline, IoT/Worker, Mobile App, Third-party Integration.

**2. Mục tiêu bàn giao (`DELIVERY_TARGET`):**
- **[1] Prototype**: Làm bản mẫu thử nghiệm nhanh (PoC), kiểm chứng ý tưởng.
- **[2] Staging**: Bản đầy đủ chuẩn bị triển khai môi trường thử nghiệm kiểm thử.
- **[3] Production (Mặc định)**: Sản phẩm thực tế hoàn chỉnh, chuẩn bảo mật, kiểm thử 10 lớp, sẵn sàng vận hành.

*(Bạn có thể phản hồi nhanh ví dụ: "C, 3" hoặc ghi rõ yêu cầu của bạn!)*
```

*🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG TRẢ LỜI**. Sau khi nhận phản hồi, ghi nhận lựa chọn và chuyển sang Chặng 2.*

---

### 📝 Chặng 2 — Vấn đáp Yêu cầu & Xác lập Đặc tả (`spec.md`) — Phase `requirement` (`/fullstack.requirement`)
1. Đọc mô tả tính năng từ input `$ARGUMENTS` kết hợp câu trả lời phạm vi của người dùng.
2. 🛑 **PROMPT CỨNG PHỎNG VẤN**: Đưa ra 3 câu hỏi trắc nghiệm `(Pick A/B/C)` làm rõ nghiệp vụ:
   - **Câu hỏi 1 (Functional & Roles)**: Luồng nghiệp vụ chính và các vai trò người dùng (Roles & Permissions).
   - **Câu hỏi 2 (Business Constraints & Data)**: Các ràng buộc nghiệp vụ, quy tắc xử lý dữ liệu và tích hợp ngoài.
   - **Câu hỏi 3 (NFR & SLA)**: Chỉ số phi chức năng cốt lõi (Tốc độ phản hồi, dung lượng chịu tải, yêu cầu bảo mật).
3. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG TRẢ LỜI**.*
4. Khởi tạo cấu trúc spec bằng script:
   ```bash
   python scripts/python/create_new_feature.py "$ARGUMENTS" --json
   ```
5. Điền đầy đủ `.fullstack/specs/<branch>/spec.md` gồm: Summary, Scope, User Stories, Functional Requirements (FR), NFR, Acceptance Criteria.
6. 🛑 **PROMPT CỨNG REQ_GATE**: Gửi tóm tắt đặc tả và hỏi người dùng phê duyệt:
   ```markdown
   📋 **Phê duyệt Requirement Baseline (`REQ_GATE`)**:
   Đặc tả yêu cầu đã được lập tại `.fullstack/specs/<branch>/spec.md`.
   - **Tóm tắt yêu cầu**: [Mô tả ngắn gọn]
   - **Các tính năng P1**: [Danh sách tính năng chính]
   - **Mục tiêu bàn giao**: [Prototype / Staging / Production]

   👉 **Bạn có đồng ý phê duyệt Requirement Baseline này để chuyển sang thiết kế Kiến trúc không?**
   - **[1] Đồng ý** (Tiến sang thiết kế Kiến trúc)
   - **[2] Cần chỉnh sửa** (Vui lòng nêu rõ điểm cần sửa đổi)
   ```
7. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**. Khi người dùng đồng ý, ghi nhận:*
   ```bash
   python scripts/python/flowchart_progress.py gate --gate req_gate --decision pass --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã phê duyệt Requirement Baseline'
   ```

---

### 🏛️ Chặng 3 — Kỹ nghệ Kiến trúc Hệ thống (`plan.md`)
1. Dựa trên Phạm vi đã chốt:
   - Thiết kế Backend Architecture, Data Schema, Auth/Security Architecture, API Contract.
   - Thiết kế Frontend Architecture, State Management, Routing, Component Layering.
   - Thiết lập **API/Contract Baseline** chặt chẽ.
2. 🛑 **PROMPT CỨNG FUTURE_QUEST**: Phân tích câu hỏi tương lai: Khả năng mở rộng chịu tải, đa người thuê (multi-tenant), sao lưu dữ liệu, chi phí hạ tầng.
3. Sinh file `.fullstack/specs/<branch>/plan.md` và các ADR tương ứng.
4. 🛑 **PROMPT CỨNG ARCH_GATE**: Trình bày đề xuất kiến trúc và hỏi người dùng phê duyệt:
   ```markdown
   🏛️ **Phê duyệt Architecture Baseline & ADR (`ARCH_GATE`)**:
   Kiến trúc hệ thống đã được lập tại `.fullstack/specs/<branch>/plan.md`.
   - **Tech Stack lựa chọn**: [Backend, Frontend, Database, Auth]
   - **Mô hình kiến trúc**: [Monolith / Modular / Microservices / Serverless]
   - **Đánh giá mở rộng (Future Evolution)**: [Scale, Data growth, Cost]

   👉 **Bạn có đồng ý phê duyệt Architecture Baseline này để chuyển sang bước Thiết kế Giải pháp chi tiết không?**
   - **[1] Đồng ý** (Tiến sang bước tiếp theo)
   - **[2] Cần chỉnh sửa** (Vui lòng nêu rõ điểm cần điều chỉnh)
   ```
5. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**. Khi người dùng đồng ý, ghi nhận:*
   ```bash
   python scripts/python/flowchart_progress.py gate --gate arch_gate --decision pass --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã phê duyệt Architecture Baseline và ADR'
   ```


---

### 🎨 Chặng 4 — UI Design Skill Đa Vòng lặp (Flowchart #2 trong Business.md)
> *(Chặng này BẮT BUỘC thực hiện nếu Phạm vi có chứa `Frontend` hoặc `Backend + Frontend`)*

#### Bước 4.1: AI hỏi Global Config Form & Vòng lặp Tối ưu (Loops Gate)
AI gửi form cấu hình UI cho người dùng và DỪNG LẠI CHỜ PHẢN HỒI:
```markdown
🎨 **Cấu hình Quy chuẩn Thiết kế UI (PromptAgent Zero-Generic & Flowchart #2)**:
- **1. Điểm chất lượng mong muốn (`min_score`)**: `85/100 (Cao cấp - Mặc định)` *(hoặc 75+ Tiêu chuẩn / 95+ Studio Masterpiece)*
- **2. Số vòng lặp tối ưu hóa (`max_loop`)**: `2 vòng lặp (v1 ➔ eval ➔ v2 ➔ eval ➔ best)` *(hoặc 1 - 3 vòng)*
- **3. Chính sách chống lỗi giao diện (`anti_ui_policy`)**: `high-bar (Zero-Tolerance Anti-AI-UI)`
- **4. Thiết bị mục tiêu (`device_targets`)**: `Desktop, Mobile (<640px = 1 col), Tablet`

*(Nếu bạn đồng ý với cấu hình chuẩn trên, hãy nhắn "OK" hoặc điều chỉnh theo ý bạn!)*
```

#### Bước 4.2: Page Queue & Page Intent Form (Phỏng vấn ĐẦY ĐỦ 24 MỤC theo 'Prompt Hỏi Người Dùng Về UI.md')
1. Xác định danh sách các trang cần thiết kế (ví dụ: `[Trang Chủ, Dashboard Quản Trị, Chi Tiết Sản Phẩm, Form Đăng Ký]`).
2. Với **từng trang**, AI BẮT BUỘC đưa ra **Biểu mẫu Phỏng vấn Vấn đáp ĐẦY ĐỦ 24 Mục** chuẩn từ `Prompt Hỏi Người Dùng Về UI.md` để người dùng điền hoặc xác nhận:

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
```

3. **Suy luận UI Mode**: AI phân tích intent và đề xuất: `2D` (Tối giản phẳng) / `2.5D` (Đổ bóng phân tầng, Isometric) / `3D` (Không gian 3 chiều Three.js) / `Hybrid`. Hỏi người dùng nếu độ tự tin < 80%.

#### Bước 4.3: Vòng lặp Sinh mã & Chấm điểm Tối ưu (The Optimization Loop)
Thiết lập `page_loop = 1`:
```text
┌────────────────────────────────────────────────────────────────────────┐
│                      VÒNG LẶP TỐI ƯU GIAO DIỆN (UI LOOP)               │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Nạp Toàn Bộ Ngữ Cảnh: Topic Examples + Anti-UI-AI Rules (8 quy chuẩn│
│    cấm kỵ) + Exps (Multi-loop architecture) + Knowledge cũ.            │
│                                                                        │
│ 2. AI sinh UI Draft v{page_loop}.md áp dụng Prompt Architecture chuẩn  │
│    -> improve-design/pages/{page_id}/drafts/ui-draft-v{page_loop}.md   │
│                                                                        │
│ 3. Draft Lint & UI Reviewer AI: Chấm điểm 20 Craft Credits & Slop Flags│
│    -> Xuất eval-v{page_loop}.json: score, critical_issues, anti_ui     │
│                                                                        │
│ 4. Kiểm tra điều kiện đạt:                                             │
│    - Nếu score >= min_score VÀ không có critical/anti-ui issue:        │
│      ==> PASS! Chốt ui-spec-final.md và chuyển sang trang kế tiếp.     │
│    - Nếu score < min_score:                                            │
│      - Nếu page_loop < max_loop:                                       │
│          a) Root Cause Analysis (RCA): Tìm nguyên nhân điểm trừ.       │
│          b) Lưu tri thức mới vào knowledge/experience.md hoặc          │
│             knowledge/anti-ui-patterns.md.                             │
│          c) Tăng page_loop = page_loop + 1.                            │
│          d) NẠP vN CŨ + BÁO CÁO LỖI + ANTI-UI-AI + BÀI HỌC VÀO PROMPT  │
│             v(N+1) VÀ SINH LẠI BẢN THẢO MỚI FIX TRIỆT ĐỂ LỖI UI AI!    │
│      - Nếu page_loop >= max_loop:                                      │
│          Báo cáo Escalate cho Người dùng chọn: (1) Chấp nhận điểm này, │
│          (2) Chạy lại từ đầu, (3) Sửa lại form yêu cầu, (4) Dừng trang.│
└────────────────────────────────────────────────────────────────────────┘
```

#### Bước 4.4: Đánh giá Tính nhất quán Đa màn hình (Cross-Page Consistency)
- So khớp token màu sắc, spacing, typography, component styling giữa các trang đã thiết kế.
- Đóng gói toàn bộ thành `ui-map.json` (Framework-Agnostic UI Map) và chuyển đổi Framework Adapter (React / Vue / Svelte / Tailwind / Vanilla CSS).

---

### 📐 Chặng 5 — Thiết kế Giải pháp Chi tiết (Solution Design)
1. Sinh file `.fullstack/specs/<branch>/design.md` bao phủ trọn vẹn **13 lĩnh vực thiết kế**:
   - Domain Design (Entities, Value Objects, Aggregates).
   - Application Design (Use Cases, Services, Module Boundaries).
   - API Contract Design (Endpoints, Request/Response Schema, Status Codes).
   - Data Model (SQL DDL / NoSQL Schemas, Indexes, Migrations).
   - UI/UX Design (Tích hợp từ kết quả `ui-spec-final.md` của Chặng 4).
   - Component Design (Phân cấp Component, Props, Events).
   - Error Handling (Error Code taxonomy, Retry policy, Fallback UI).
   - Security Design (Authentication, Authorization, RBAC, Secret handling).
   - Test Strategy (Phân bổ kiểm thử theo kim tự tháp).
   - Test Environment & Data Design (Fixtures, Seed data, Mocks).
   - Deployment Design (Docker, CI/CD, Container, Environment configs).
   - Observability Design (Structured Logging, Metrics, Tracing, Health checks).
   - Migration & Rollback Design (Kế hoạch di chuyển dữ liệu & quy trình hoàn tác khẩn cấp).
2. Lập ma trận phân tích tác động (Impact Analysis) các file thêm mới và sửa đổi.
3. 🛑 **PROMPT CỨNG DESIGN_GATE (User Design Review)**: Trình bày tóm tắt và hỏi phê duyệt:
   ```markdown
   📐 **Phê duyệt Solution Design Baseline (`DESIGN_GATE`)**:
   Hồ sơ thiết kế 13 lĩnh vực đã hoàn thành tại `.fullstack/specs/<branch>/design.md`.
   - **Mô hình Domain & Services**: [Tóm lược Entities, Use Cases]
   - **Hợp đồng API & Dữ liệu**: [Endpoints cốt lõi, DB Schema]
   - **Giao diện & Thành phần UI**: [Components, UI Spec binding]
   - **Chiến lược An ninh & Phục hồi**: [Auth, Security, Rollback]

   👉 **Bạn có đồng ý phê duyệt Design Baseline này để chuyển sang Triển khai Mã nguồn không?**
   - **[1] Đồng ý** (Tiến hành phân rã task và viết code)
   - **[2] Yêu cầu sửa đổi** (Nêu rõ điểm thiết kế cần thay đổi)
   ```
4. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**.*
   - Nếu người dùng yêu cầu sửa: cập nhật thiết kế, đánh giá lại tác động và hỏi lại người dùng (`CHANGE_APPROVE`).
   - Khi người dùng đồng ý: ghi nhận:
     ```bash
     python scripts/python/flowchart_progress.py gate --gate design_gate --decision pass --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã duyệt Solution Design 13 lĩnh vực'
     ```

---

### 💻 Chặng 6 — Triển khai Mã nguồn & Debug Test Thực tế (Implementation & Real Debug)
> ⚠️ **ĐÂY LÀ CHẶNG CỐT LÕI VỀ KỸ THUẬT THỰC TẾ**:
> Tuyệt đối KHÔNG viết mã giả lập hoặc output text khẳng định "mọi thứ đã chạy tốt". Agent PHẢI thực hiện đầy đủ quy trình kỹ nghệ thực chiến:

1. **Phân rã nhiệm vụ (Task Breakdown)**:
   - Sinh file `.fullstack/specs/<branch>/tasks.md`.
   - Phân chia nhiệm vụ độc lập: `T001` (Cấu hình & Data Schema), `T002` (Backend API Endpoints), `T003` (Frontend Components), `T004` (Tích hợp API), `T005` (Unit Tests).
2. **Viết mã nguồn chi tiết (Production Code)**:
   - Viết từng file mã nguồn đầy đủ, không cắt xén, không để `// TODO implement later`.
   - Tuân thủ nguyên tắc Zero-Generic, Concentric Radius và chuẩn Clean Code.
3. **🔴 QUY TRÌNH CHẠY LỆNH DEBUG TEST & KIỂM THỬ API THỰC TẾ (Debug Test Loop)**:
   - **Bước 6.1 — Chạy lệnh Static Analysis / Linter**:
     Chạy lệnh thực tế trên hệ thống (ví dụ: `npm run lint`, `ruff check .`, `mypy src`, `tsc --noEmit`).
   - **Bước 6.2 — Chạy lệnh Unit Test thực tế**:
     Thực thi runner kiểm thử tương ứng của dự án (ví dụ: `pytest`, `npm test`, `vitest run`, `cargo test`, `go test ./...`).
   - **Bước 6.3 — Gọi API Thực Tế & Thiết Lập Timeout**:
     - **Tự động nhận diện Host & Port**: Agent BẮT BUỘC đọc port từ cấu hình dự án (`.env`, `PORT`, `docker-compose.yml`, server startup logs). Tuyệt đối KHÔNG hardcode cố định port.
     - Khi test Backend API (FastAPI, Express, Spring, Go...): BẮT BUỘC gọi lệnh HTTP thực tế (`curl`, `httpie`, script test) và **PHẢI có cờ `--max-time` hoặc `timeout`** (ví dụ: `curl --max-time 10 ...`) để chống treo terminal nếu server bị deadlock/vòng lặp vô hạn.
     - Kiểm tra kết nối trước: `curl -s -o /dev/null -w "%{http_code}" http://localhost:<BACKEND_PORT>/health --max-time 5`.
     - Kiểm thử đủ các mã lỗi: `200/201 OK`, `400 Bad Request`, `401/403 Auth/Permission`, `404 Not Found`, `422 Validation Error`, `500 Server Error`.
   - **Bước 6.4 — Phối Hợp Thao Tác Cùng User Khi Cần (Human-in-the-Loop Co-Testing)**:
     - Nếu gặp các tác vụ AI không thể tự động hóa 100% (như quét mã QR ngân hàng, nhập mã OTP SMS/Email, OAuth Google/GitHub, Captcha):
       - AI BẮT BUỘC hướng dẫn User rõ ràng từng bước theo thời gian thực và đúng port thật:
         > 🤝 *"Backend đang chạy tại port `:<BACKEND_PORT>` và frontend tại port `:<FRONTEND_PORT>`. Vui lòng mở trình duyệt tại `http://localhost:<FRONTEND_PORT>/login`, thực hiện đăng nhập và nhắn 'DONE' để AI tiếp tục kiểm tra kết quả ghi nhận trong Database."*
   - **Bước 6.5 — Xử Lý Đơn Luồng & Điều Phối Frontend - Backend**:
     - Nếu môi trường bị chặn (blocking terminal khi chạy server `npm run dev` / `uvicorn`):
       - Chạy backend ngầm / background task có log (`nohup ... > server.log 2>&1 &` hoặc `Start-Process`).
       - Hoặc yêu cầu User mở terminal phụ chạy frontend và thao tác UI thực tế để AI curl API kiểm tra chéo.
   - **Bước 6.6 — Xử lý lỗi trong Vòng lặp Debug (Active Debugging)**:
     Nếu câu lệnh trả về Exit Code khác 0 hoặc có bài test FAILED:
     ```text
     ┌──────────────────────────────────────────────────────────────────┐
     │                     VÒNG LẶP DEBUG TEST THỰC TẾ                  │
     ├──────────────────────────────────────────────────────────────────┤
     │ 1. ĐỌC LOG LỖI THẬT: Trích xuất dòng traceback, mã lỗi, tên file │
     │ 2. PHÂN TÍCH NGUYÊN NHÂN: Xác định lỗi cú pháp, logic, thiếu     │
     │    thư viện, lệch kiểu dữ liệu hoặc sai assertions.              │
     │ 3. SỬA MÃ NGUỒN: Tiến hành chỉnh sửa chính xác file code lỗi.   │
     │ 4. CHẠY LẠI LỆNH TEST: Thực thi lại lệnh test trong terminal.    │
     │ 5. ĐÁNH GIÁ: Nếu vẫn còn lỗi -> Quay lại bước 1.                 │
     │    Chỉ dừng khi 100% CÁC BÀI TEST ĐỀU XANH (PASSED)!             │
     └──────────────────────────────────────────────────────────────────┘
     ```
4. Ghi nhận Gate:
   ```bash
   python scripts/python/flowchart_progress.py gate --gate impl_gate --decision pass --inputs '{"unit_tests_pass": true}' --threshold '{"pass_rate": 1.0}' --rationale 'Build, Lint và Unit Test thực tế pass 100%'
   ```

---

### 🛡️ Chặng 7 — Kiểm định 10 Lớp & Báo cáo Nghiệm thu (Verification) — Phase `analyze` (`/fullstack.analyze`)
1. Thực thi kiểm định đa tầng theo thứ tự Business.md:
   - Lớp 1: Unit Test (Đã vượt qua ở Chặng 6).
   - Lớp 2: Integration Test (Kiểm thử tích hợp các module và database).
   - Lớp 3: Contract Test (So khớp Request/Response thật với API Contract).
   - Lớp 4: E2E Test (Luồng người dùng từ đầu đến cuối).
   - Lớp 5: Security Test (Quét lỗ hổng dependency, secret scan, injection).
   - Lớp 6: Performance Test (Thời gian phản hồi, tải trọng theo NFR).
   - Lớp 7: Reliability & Resilience Test (Xử lý khi mất kết nối, timeout).
   - Lớp 8: Regression Test (Đảm bảo tính năng cũ không bị hỏng).
   - Lớp 9: Business Flow Test (Kiểm thử nghiệp vụ thực tế của domain).
   - Lớp 10: Realistic Staging Test (Chạy thử trên dữ liệu sát thực tế).
2. Xuất báo cáo nghiệm thu `.fullstack/specs/<branch>/verification-report.md`.
3. 🛑 **PROMPT CỨNG TEST_GATE**: Trình bày kết quả kiểm định cho Người dùng:
   ```markdown
   🛡️ **Phê duyệt Báo Cáo Kiểm Định (`TEST_GATE`)**:
   Báo cáo nghiệm thu đã lập tại `.fullstack/specs/<branch>/verification-report.md`.
   - **Kết quả 10 tầng kiểm thử**: [Tóm tắt số bài pass/fail]
   - **Test Coverage**: [Độ bao phủ đạt %]
   - **Phân tích rủi ro tồn dư**: [Liệt kê nếu có]

   👉 **Bạn có xác nhận kết quả kiểm định để chuyển sang đóng gói Phát hành không?**
   - **[1] Xác nhận đạt** (Tiến hành phát hành sản phẩm)
   - **[2] Yêu cầu bổ sung test / sửa lỗi** (Nêu rõ phần cần kiểm tra lại)
   ```
4. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG XÁC NHẬN**. Khi người dùng đồng ý, ghi nhận:*
   ```bash
   python scripts/python/flowchart_progress.py gate --gate test_gate --decision pass --inputs '{"user_confirmed": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã xác nhận báo cáo kiểm thử 10 tầng'
   ```

---

### 🚀 Chặng 8 — Phát hành & Vận hành (Release & Operations) — Phase `operate` (`/fullstack.operate`)
*(Chỉ kích hoạt khi Delivery Target là `staging` hoặc `production`)*
1. Build Artifact đóng gói sản phẩm (Docker container hoặc production bundle).
2. Chạy quét SBOM và kiểm tra bảo mật gói phụ thuộc.
3. Chạy thử nghiệm quy trình di chuyển dữ liệu (Migration Dry Run) và kiểm tra khả năng Rollback.
4. 🛑 **PROMPT CỨNG RELEASE_GATE**: Trình bày kế hoạch phát hành cho Người dùng phê duyệt:
   ```markdown
   🚀 **Phê duyệt Phát Hành Sản Phẩm (`RELEASE_GATE`)**:
   Kế hoạch phát hành đã sẵn sàng:
   - **Build Artifact**: [Tên artifact, hash, dung lượng]
   - **Kế hoạch Rollback khẩn cấp**: [Chiến lược rollback nếu sự cố]
   - **Môi trường triển khai**: [Staging / Production]

   👉 **Bạn có phê duyệt triển khai phát hành phiên bản này không?**
   - **[1] Phê duyệt phát hành** (Tiến hành Deploy)
   - **[2] Tạm dừng / Hủy bỏ**
   ```
5. *🛑 **DỪNG LẠI CHỜ NGƯỜI DÙNG PHÊ DUYỆT**. Khi người dùng đồng ý, ghi nhận:*
   ```bash
   python scripts/python/flowchart_progress.py gate --gate release_gate --decision pass --inputs '{"user_approved": true}' --threshold '{"approval_required": true}' --rationale 'Người dùng đã phê duyệt kế hoạch phát hành và rollback'
   ```
6. Thiết lập Health Check endpoint, Logging, Monitoring và hệ thống cảnh báo (Alerting).
7. 🛑 **PROMPT CỨNG DOD_CHECK**: Đánh giá Definition of Done theo Delivery Target và xin xác nhận hoàn thành dự án (`DONE`).


---

## 📊 Báo cáo Hoàn tất Chu trình (Run Summary)

Khi chu trình kết thúc thành công, AI in ra bảng tóm tắt hoàn chỉnh:

```text
═══════════════════════════════════════════════════════════════════════════════════
🎉 FULLSTACK SDD CYCLE COMPLETED SUCCESSFULLY
═══════════════════════════════════════════════════════════════════════════════════
📌 Dự án:         $ARGUMENTS
🎯 Phạm vi:       [Backend / Frontend / Backend + Frontend]
📦 Target:        [Prototype / Staging / Production]
───────────────────────────────────────────────────────────────────────────────────
✅ Chặng 1 & 2:   Đặc tả spec.md hoàn tất qua phỏng vấn vấn đáp
✅ Chặng 3:       Kiến trúc plan.md & API Contract baseline đã thiết lập
✅ Chặng 4:       UI Design hoàn thành qua {N} vòng lặp (Craft Score: {Score}/100)
✅ Chặng 5:       Solution Design 13 lĩnh vực hoàn thiện
✅ Chặng 6:       Code hoàn chỉnh & Debug Test thật trong shell: 100% PASSED
✅ Chặng 7:       Kiểm định 10 lớp đạt chuẩn Definition of Done (DoD)
───────────────────────────────────────────────────────────────────────────────────
📂 Hồ sơ bàn giao:
  - Spec:         .fullstack/specs/<id>/spec.md
  - Architecture: .fullstack/specs/<id>/plan.md
  - Design:       .fullstack/specs/<id>/design.md
  - UI Specs:     .fullstack/improve-design/pages/*/outputs/ui-spec-final.md
  - Tasks & Code: .fullstack/specs/<id>/tasks.md
  - Verification: .fullstack/specs/<id>/verification-report.md
═══════════════════════════════════════════════════════════════════════════════════
```
