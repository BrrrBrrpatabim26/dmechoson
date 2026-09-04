---
description: Quy ước Design & Flowchart chuyên sâu — Phân tích nghiệp vụ chi tiết, vẽ flowchart vuông vức có đánh số luồng, vấn đáp vòng lặp triệt để và kiến trúc theo 12 mẫu thiết kế chuẩn mực (SOLID, DDD, Hexagonal).
---


<!-- flowchart-deep-design:v1.0.0 -->
<!-- interactive-domain-qa-loop:v1.0.0 -->

# 📐 Quy ước Design & Flowchart Nghiệp vụ Chuyên sâu

> **TÔN CHỈ THIẾT KẾ & PHÂN TÍCH NGHIỆP VỤ**:
> - **SOLID & Clean Architecture**: Tách bạch trách nhiệm, độc lập tầng và dễ bảo trì mở rộng.
> - **Context rõ ràng**: Xác định tường minh ranh giới nghiệp vụ (Bounded Context), Input, Output và State.
> - **100% Chú thích bằng Tiếng Việt**: Toàn bộ nhãn nút, luồng chuyển đổi, chú thích flowchart và tài liệu phân tích BẮT BUỘC viết bằng tiếng Việt trong sáng, dễ hiểu, không dùng chú thích tiếng Anh.
> - **Trọng tâm 4 Trụ Cột**:
>   1. **Phân tích yêu cầu**: Bóc tách logic, quy tắc nghiệp vụ (Business Rules) và ràng buộc.
>   2. **Thiết kế nghiệp vụ**: Mô hình hóa quy trình, trạng thái, luồng dữ liệu và ranh giới hệ thống.
>   3. **Design Backend**: Kiến trúc Service, Domain Entities, Data Model, API Contract, Transaction Boundary.
>   4. **Design UI/UX**: Kiến trúc Component, Luồng tương tác (Interaction Flow), 6 Microstates và 4-Tier Feedback.

---

## 📁 1. Cấu Trúc Thư Mục & Phân Cấp File

Khi bắt đầu một nghiệp vụ thiết kế, Agent BẮT BUỘC khởi tạo cấu trúc thư mục `./flowchart/`:

```text
./flowchart/
└── <[STT].[Tên_nghiệp_vụ]>/             # Ví dụ: ./flowchart/01.Xac_thuc_nguoi_dung/
    ├── 0.Hieu_yeu_cau.md                # Bắt buộc: Làm rõ mục tiêu, phạm vi, bối cảnh
    ├── 1.Phan_tich_chuyen_sau.md        # Bắt buộc: Phân rã quy tắc nghiệp vụ, ca sử dụng, edge cases
    ├── 2.<Ten_nghiep_vu_con_1>.md       # Thiết kế chi tiết thành phần con 1
    ├── 3.<Ten_nghiep_vu_con_2>.md       # Thiết kế chi tiết thành phần con 2
    ├── ....
    └── <[STT]>.Tong_hop_flowchart.md    # Bắt buộc: Toàn bộ context, flowchart tổng thể & kết luận
```

### Nội dung chuẩn cho từng file:

1. **`0.Hieu_yeu_cau.md`**:
   - Mục tiêu cốt lõi của nghiệp vụ (Business Objective).
   - Đối tượng thụ hưởng & tác nhân tham gia (Actors & Stakeholders).
   - Ranh giới nghiệp vụ (In-Scope & Out-of-Scope).
   - Điều kiện tiên quyết (Pre-conditions) và Kết quả mong đợi (Post-conditions).

2. **`1.Phan_tich_chuyen_sau.md`**:
   - Bảng quy tắc nghiệp vụ chi tiết (Business Invariants & Rules).
   - Phân tích các luồng rẽ nhánh: Luồng chuẩn (Happy Path), Luồng ngoại lệ (Alternative Paths), Luồng lỗi (Error Paths).
   - Ràng buộc về dữ liệu, bảo mật, thời gian thực và tính nhất quán (Consistency).

3. **`[STT].[Tên_nghiệp_vụ_con].md`**:
   - Đi sâu vào từng phần: Data Schema, API Contract, Service Use Case, UI Component tương tác.

4. **`[STT].Tong_hop_flowchart.md`**:
   - Chứa toàn bộ Context tổng hợp của nghiệp vụ.
   - Sơ đồ Flowchart tổng thể đạt chuẩn quy cách.
   - Bảng tra cứu luồng đánh số và giải thích ý nghĩa chi tiết từng bước.

---

## 📊 2. Quy Chuẩn Vẽ Flowchart

Agent BẮT BUỘC tuân thủ các quy tắc trực quan sau khi tạo Flowchart trong file Markdown:

1. **Kích thước to, bao quát**: Sơ đồ phải bao trùm trọn vẹn từ lúc bắt đầu (Start) đến tất cả các trạng thái kết thúc (Success/Failure/Cancel).
2. **Vẽ cạnh cứng, vuông vức**: Sử dụng cú pháp Mermaid dạng cấu trúc phân cấp, không vẽ đường cong mềm, bo góc đồ chơi:
   ```mermaid
   graph TD
   ```
3. **Đánh số thứ tự trên từng Edge (Luồng thực hiện)**: Mọi kết nối chuyển trạng thái đều phải có số thứ tự chỉ rõ trình tự thực hiện:
   `-->|1. Người dùng nhấn Đăng nhập|`
   `-->|2. Gửi yêu cầu xác thực|`
   `-->|3. Kiểm tra tính hợp lệ|`
4. **Giải thích chi tiết dưới mỗi sơ đồ**:
   Ngay bên dưới khối mã Mermaid, Agent BẮT BUỘC cung cấp:
   - **Bảng mô tả chi tiết từng bước**:
     | Bước | Tác nhân | Hành động | Dữ liệu truyền | Kết quả mong đợi |
     |---|---|---|---|---|
     | 1 | Người dùng | Nhập form | Email, Password | Dữ liệu được validate tại client |
     | 2 | Frontend | Gửi API | JSON Payload | Nhận mã phản hồi HTTP |
   - **Ý nghĩa & Ràng buộc cốt lõi**: Giải thích lý do thiết kế luồng như vậy, cơ chế bảo vệ, phòng ngừa lỗi và cách xử lý timeout.

---

## 🎯 3. Tiêu Chuẩn Chất Lượng Kỹ Nghệ (Quality Standards)

Mọi giải pháp thiết kế từ flowchart này khi bước vào lập trình BẮT BUỘC tuân thủ:

1. **Test Coverage ≥ 97%**: Toàn bộ mã nguồn mới phải có unit tests, integration tests và contract tests đạt tối thiểu 97% độ bao phủ (lines & branches).
2. **Tuyệt đối không có TODO**: Không merge vào nhánh chính bất kỳ dòng code nào chứa `// TODO`, `// FIXME` hay placeholder giả lập.
3. **Tài liệu hóa 100% Public APIs**: Mọi hàm, module, endpoints công khai đều phải có docstring / OpenAPI schema đầy đủ mô tả tham số, kiểu trả về và các mã lỗi phát sinh.

---

## 🔄 4. Vòng Lặp Vấn Đáp & Chỉnh Sửa Nghiệp Vụ (The Interactive Q&A Loop)

Agent BẮT BUỘC kích hoạt cơ chế vấn đáp tương tác từng câu một với Người dùng để gỡ bỏ mọi mập mờ trước khi chốt thiết kế:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VÒNG LẶP VẤN ĐÁP & CHỈNH SỬA NGHIỆP VỤ                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. AI đặt câu hỏi nghiệp vụ cụ thể [Trắc nghiệm A/B/C/D hoặc Tự luận]  │
│ 2. DỪNG LẠI CHỜ NGƯỜI DÙNG TRẢ LỜI                                     │
│ 3. Phân tích kết quả câu trả lời nhận được ngay lập tức:               │
│                                                                        │
│    A. NẾU CÂU TRẢ LỜI HỢP LÝ & RÕ RÀNG:                                │
│       - Phân tích những điểm sẽ bổ sung/sửa đổi trên flowchart.        │
│       - Luồng dữ liệu và trạng thái hệ thống sẽ thay đổi ra sao.       │
│       - Đánh giá nghiệp vụ có bám sát bài toán ban đầu hay không.      │
│       - Trình bày cho Người dùng duyệt:                                │
│         + Nếu Người dùng ĐỒNG Ý ➔ Cập nhật file markdown & flowchart.  │
│         + Nếu Người dùng KHÔNG ĐỒNG Ý ➔ Hỏi hướng mong muốn khác và lặp│
│                                                                        │
│    B. NẾU CÂU TRẢ LỜI CÓ ĐIỂM CHƯA HỢP LÝ HOẶC XUNG ĐỘT KIẾN TRÚC:     │
│       - Giải thích nguyên nhân xung đột hoặc rủi ro tiềm ẩn.           │
│       - Gợi ý các phương án định hướng tối ưu cho Người dùng.          │
│       - Đặt lại câu hỏi và tiếp tục vòng lặp.                          │
│                                                                        │
│ 4. LƯU Ý BẤT BIẾN:                                                     │
│    - Loops cho đến khi GIẢI QUYẾT TRIỆT ĐỂ câu hỏi đó rồi mới chuyển  │
│      sang câu hỏi kế tiếp!                                             │
│    - Chỉ dừng lại khi toàn bộ góc khuất nghiệp vụ đã sáng tỏ 100%.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 5. Nguyên Tắc Lập Trình Đối Chiếu (Coding Compliance)

Khi chuyển từ Flowchart sang viết mã nguồn:
1. **Đối chiếu So khớp 1-1**:
   - Từng bước trên flowchart phải tương ứng với một hàm, một use case hoặc một state machine chuyển đổi trong code.
   - Tên biến, trạng thái (Status/Enum) trong code phải khớp 100% với tên gọi trong file `Tổng_hợp_flowchart.md`.
2. **Tuân thủ 12 Mẫu Kiến Trúc Phổ Biến**:
   - **SOLID Principles** (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion).
   - **Domain-Driven Design (DDD)**: Phân định Bounded Context, Ubiquitous Language, Aggregates, Entities, Value Objects.
   - **Hexagonal Architecture (Ports & Adapters)**: Tách lõi Domain ra khỏi Framework, Database và Giao diện.
   - **Multi-Module / Clean Architecture**: Tổ chức thư mục rõ ràng theo tầng nghiệp vụ, không tạo dependency vòng (Circular Dependency).
   - **CQRS & Event-Driven**: Tách biệt luồng đọc (Query) và ghi (Command) khi hệ thống có tải trọng phức tạp.
   - **SOLID + Bounded Context + DDD + Hexagonal + Multi Module**: Hỗ trợ dự án muốn tách thành microservices trong tương lai

