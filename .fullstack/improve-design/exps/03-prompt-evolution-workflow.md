---
name: Prompt Evolution Workflow
category: exps
priority: 90
tags: [prompt-evolution, multi-loop, feedback-loop, self-correction]
applies_to: [ui-design, drafting, multi-loop, iteration]
---

# 🔄 Prompt Evolution Workflow — Vòng Lặp Tiến Hóa Prompt Tự Động Fix Lỗi UI AI

Quy trình tiến hóa prompt qua từng vòng lặp (Generation Loops) đảm bảo phiên bản sau khắc phục triệt để các nhược điểm của phiên bản trước mà không bị mất đi ngữ cảnh ban đầu.

---

## 🧭 Bản Đồ Vòng Lặp Tiến Hóa Prompt

```text
[VÒNG LẶP 1: v1]
  ├── 1. Load Intent Form (24 mục) + Examples Topic + Anti-UI-AI Rules
  ├── 2. Sinh ui-draft-v1.md (theo form cấu trúc prompt mẫu chuẩn)
  ├── 3. Chấm điểm 20 Craft Credits ➔ eval-v1.json (Score: e.g. 72/100)
  │
  ├── [Score < Target Score (85) VÀ loop < max_loop]
  │      ▼
  ├── 4. Chạy RCA (Root Cause Analysis): Xác định các lỗi UI bị dính
  ├── 5. Cập nhật bài học mới vào knowledge/experience.md & anti-ui-patterns.md
  │      ▼
[VÒNG LẶP 2: v2]
  ├── 6. NẠP TOÀN DIỆN VÀO PROMPT v2:
  │      ├── a) Nội dung bản thảo v1 cũ (ui-draft-v1.md)
  │      ├── b) Báo cáo đánh giá eval-v1.json (những tiêu chí bị trừ điểm)
  │      ├── c) Toàn bộ Anti-UI-AI Rules tương ứng với lỗi đã dính
  │      └── d) Các bài học kinh nghiệm vừa đúc kết từ RCA
  ├── 7. Sinh bản thảo nâng cấp ui-draft-v2.md
  ├── 8. Chấm điểm 20 Craft Credits ➔ eval-v2.json (Score: e.g. 88/100)
  │
  ├── [Score >= Target Score (85)] ➔ PASS!
  └── 9. Xuất bản ui-spec-final.md và chuyển giao sang Implementation.
```

---

## 📝 Mẫu Prompt Nạp Ngữ Cảnh Khi Chạy Vòng Lặp V(N+1)

Khi chuyển sang vòng lặp $N+1$, AI BẮT BUỘC tạo prompt theo cấu trúc sau:

```markdown
# YÊU CẦU TIẾN HÓA GIAO DIỆN (UI REFACTOR & EVOLUTION — LOOP {N+1})

Bạn là UI/UX Craft Master. Ở vòng lặp trước ({N}), giao diện của trang `{page_id}` đạt điểm {score_vN}/100 và chưa đạt chuẩn sàn ({min_score}/100).

## 1. BẢN THẢO VÒNG TRƯỚC (V{N} DRAFT)
[Trích dẫn hoặc tham chiếu .fullstack/improve-design/pages/{page_id}/drafts/ui-draft-v{N}.md]

## 2. CÁC ĐIỂM TRỪ & LỖI UI AI ĐÃ BỊ PHÁT HIỆN (EVALUATION REPORT)
- [Liệt kê các tiêu chí bị trừ điểm từ eval-v{N}.json]
- [Lỗi 1: e.g. Thiếu custom :focus-visible ring trên các nút lọc]
- [Lỗi 2: e.g. Bảng dữ liệu gây vỡ layout tràn ngang trên màn hình 375px]
- [Lỗi 3: e.g. Bo góc 24px trên các thẻ con không đồng tâm với card cha 16px]

## 3. CÁC QUY CHUẨN ANTI-UI-AI BẮT BUỘC PHẢI FIX (RULES TO ENFORCE)
- [Đọc và áp dụng quy tắc từ templates/improve-design/anti-ui-ai/]
- Bắt buộc sửa lại bo góc theo công thức: R_inner = max(0, R_outer - padding).
- Bắt buộc bọc bảng trong container `overflow-x: auto` và thêm `min-w-0` cho grid child.
- Bắt buộc bổ sung đầy đủ 6 microstates cho mọi control.

## 4. KINH NGHIỆM ĐÚC KẾT (LESSONS LEARNED FROM RCA)
- [Trích xuất bài học từ knowledge/experience.md]

👉 **Nhiệm vụ của bạn**: Sinh bản thảo hoàn chỉnh mới `ui-draft-v{N+1}.md` giải quyết triệt để 100% các điểm trừ trên, giữ vững cấu trúc nghiệp vụ và nâng điểm Craft Score lên >= {min_score}/100!
```
