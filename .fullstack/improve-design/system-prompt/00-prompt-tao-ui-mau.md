# UI GENERATION PROMPT — ĐẶC TẢ THIẾT KẾ GIAO DIỆN NGHIÊM NGẶT

# 0. Vai trò

- Đóng vai vào: Tester + Người thiết kế UI chuyên nghiệp + <Người dùng cuối>

- Độ tuổi <Người dùng cuối>

- Thiết bị sử dụng: Mobile, Web Desktop, Desktop, Tablet

---


# 1. TÓM TẮT

Cung cấp mô tả ngắn gọn về:

* Sản phẩm
* Trang / màn hình
* Mục đích chính
* Người dùng mục tiêu
* Hành động chính của người dùng
* Trải nghiệm tổng thể

---

# 2. GIAO DIỆN LÀ GÌ

Mô tả chính xác giao diện đại diện cho điều gì.

Phải giải thích:

* Người dùng nhìn thấy gì
* Giao diện truyền tải điều gì
* Người dùng có thể làm gì
* Thành phần visual quan trọng nhất là gì
* Giao diện cần tạo cảm giác như thế nào

Không sử dụng những mô tả chung chung như:

> "Một website hiện đại và đẹp."

Phải mô tả **giao diện và trải nghiệm thực tế**.

---

# 3. ĐỊNH HƯỚNG THIẾT KẾ

Xác định visual language của giao diện.

## Phong cách thiết kế

Ví dụ:

* Digital Minimalism
* Editorial
* Swiss
* Brutalist
* Luxury
* Gen-Z
* Cinematic
* Futuristic
* Technical
* Experimental

## Mood

Xác định:

* Emotional tone
* Visual atmosphere
* Density
* Contrast
* Energy
* Brand personality

## Nguyên tắc thị giác

Xác định các nguyên tắc cốt lõi phải được duy trì xuyên suốt giao diện.

Ví dụ:

* [Nguyên tắc]
* [Nguyên tắc]
* [Nguyên tắc]
* [Nguyên tắc]

---

# 4. ĐẶC TẢ THIẾT KẾ

Xác định toàn bộ visual system.

## Màu sắc

Ưu tiên giá trị chính xác khi đã được cung cấp.

```text
Background:
Surface:
Primary:
Secondary:
Text:
Muted Text:
Border:
Accent:
Success:
Warning:
Error:
```

## Typography

Xác định:

* Font family
* Font source
* Font size
* Font weight
* Line height
* Letter spacing
* Text hierarchy

Ví dụ:

```text
Display:
Heading:
Subheading:
Body:
Caption:
Label:
Mono:
```

## Spacing

Xác định:

* Page padding
* Section spacing
* Component spacing
* Grid gaps
* Card padding
* Element spacing

## Shape

Xác định:

* Border radius
* Border thickness
* Border style
* Button shape
* Card shape
* Input shape

## Effects

Xác định:

* Shadow
* Blur
* Glow
* Gradient
* Noise
* Grain
* Glass
* Transparency
* Lighting
* Depth

---

# 5. CẤU TRÚC TRANG

Xác định toàn bộ page hierarchy.

Ví dụ:

```text
Page
├── Loader
├── Header
├── Main
│   ├── Hero
│   ├── Section
│   ├── Section
│   ├── Section
│   └── CTA
├── Footer
├── Navigation Overlay
└── Modal
```

Thứ tự của các section phải được xác định rõ ràng.

Với mỗi section phải xác định:

```text
Tên:
Mục đích:
Layout:
Content:
Components:
Visual treatment:
Interaction:
Animation:
Responsive behavior:
```

---

# 6. NAVIGATION

Xác định navigation system.

Bao gồm:

* Logo
* Navigation items
* CTA
* Menu
* Active state
* Mobile navigation
* Sticky / fixed behavior
* Scroll behavior
* Open / close behavior

Nếu navigation có animation, phải mô tả animation một cách chính xác.

---

# 7. HERO

Đặc tả Hero section chi tiết.

## Content

Sử dụng exact content nếu đã được cung cấp.

```text
Eyebrow:
Headline:
Description:
Primary CTA:
Secondary CTA:
```

## Layout

Xác định:

* Container
* Width
* Height
* Alignment
* Grid
* Columns
* Positioning
* Spacing
* Media placement

## Visual

Xác định:

* Background
* Images
* SVG
* Video
* 3D
* Gradient
* Glow
* Noise
* Decorative elements

## Animation

```text
Trigger:
Initial state:
Final state:
Duration:
Delay:
Easing:
Stagger:
Transform:
Opacity:
Scale:
Rotation:
```

---

# 8. CÁC SECTION

Mỗi section phải được đặc tả riêng.

## Section: [Tên]

### Mục đích

[Mục đích]

### Content

Sử dụng exact copy khi đã được cung cấp.

### Layout

Mô tả layout chính xác.

### Components

Liệt kê tất cả components.

### Visual

Xác định:

* Colors
* Typography
* Images
* Background
* Borders
* Effects
* Spacing

### Interaction

Xác định:

* Hover
* Click
* Scroll
* Drag
* Swipe
* Expand
* Collapse
* Modal
* Navigation

### Animation

Xác định chính xác các animation parameters.

### Responsive

```text
Mobile:
Tablet:
Desktop:
```

---

# 9. COMPONENTS

Mỗi reusable component quan trọng phải được mô tả.

## Component: [Tên]

```text
Purpose:
Structure:
Content:
Layout:
Visual:
Interaction:
Animation:
Responsive:
```

Phải xác định các state quan trọng:

```text
Default
Hover
Active
Focus
Disabled
Loading
Success
Error
Open
Closed
Selected
```

Không để component state quan trọng ở dạng ngầm định.

---

# 10. ASSETS

Xác định toàn bộ assets cần thiết.

| Asset  | Type  | Source   | Usage   | Constraints   |
| ------ | ----- | -------- | ------- | ------------- |
| [name] | Image | [source] | [usage] | [constraints] |
| [name] | SVG   | [source] | [usage] | [constraints] |
| [name] | Video | [source] | [usage] | [constraints] |
| [name] | 3D    | [source] | [usage] | [constraints] |

Quy tắc:

* Sử dụng assets được cung cấp một cách chính xác.
* Không tự ý thay thế assets đã được chỉ định.
* Không tự phát minh asset URL.
* Giữ nguyên aspect ratio.
* Xác định loading behavior.
* Xác định fallback behavior khi cần thiết.

---

# 11. TYPOGRAPHY

Đặc tả typography ở mức implementation.

Với mỗi text element quan trọng phải xác định:

```text
Font:
Weight:
Size:
Line-height:
Letter-spacing:
Case:
Alignment:
Color:
```

Nếu typography thay đổi theo responsive breakpoint, phải mô tả rõ.

---

# 12. COLOR SYSTEM & DESIGN TOKENS

Tạo centralized token system.

```text
--color-background:
--color-surface:
--color-primary:
--color-secondary:
--color-text:
--color-muted:
--color-border:
--color-accent:

--spacing-xs:
--spacing-sm:
--spacing-md:
--spacing-lg:
--spacing-xl:

--radius-sm:
--radius-md:
--radius-lg:
--radius-xl:

--shadow-sm:
--shadow-md:
--shadow-lg:

--blur-sm:
--blur-md:
--blur-lg:
```

Nếu exact values đã được cung cấp, phải giữ nguyên.

---

# 13. RESPONSIVE BEHAVIOR

Không đơn giản scale desktop xuống mobile.

Xác định behavior cho:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Với mỗi breakpoint phải xác định:

* Layout
* Grid
* Typography
* Spacing
* Navigation
* Components
* Images
* Media
* Interaction
* Animation

Mobile experience phải được thiết kế có chủ đích và phải usable.

---

# 14. INTERACTION & ANIMATION

Xác định tất cả interaction có ý nghĩa.

## Hover

```text
Element:
Initial:
Hover:
Transition:
Duration:
Easing:
```

## Click

```text
Element:
Action:
State change:
Animation:
```

## Scroll

```text
Element:
Trigger:
Start:
End:
Progress mapping:
Movement:
Opacity:
Scale:
Rotation:
Smoothing:
```

## Drag / Swipe

```text
Element:
Direction:
Constraint:
Momentum:
Snap:
```

---

# 15. ANIMATION SYSTEM

Animation phải có behavior xác định rõ ràng.

Với mỗi animation quan trọng:

```text
Animation:
Trigger:
Initial state:
Final state:
Duration:
Delay:
Easing:
Stagger:
Transform:
Opacity:
Scale:
Rotation:
```

Với spring animation:

```text
Mass:
Stiffness:
Damping:
Velocity:
```

Với scroll-driven animation:

```text
Scroll start:
Scroll end:
Progress:
Interpolation:
Smoothing:
```

Nếu reference specification cung cấp animation values chính xác, các giá trị đó là **authoritative**.

Không thay thế bằng animation values chung chung.

---

# 16. ADVANCED VISUAL EFFECTS

Nếu có sử dụng, phải đặc tả implementation behavior cho:

* Grain
* Noise
* Blur
* Glassmorphism
* Glow
* Gradient
* Parallax
* Masking
* WebGL
* Shader
* Particles
* 3D
* Custom cursor
* Magnetic interaction
* Text splitting
* Image reveal
* Video effects

Mỗi effect quan trọng phải có các parameters tương ứng.

---

# 17. TEXT ANIMATION

Nếu có text animation, xác định:

```text
Split by:
Character / Word / Line

Initial:
opacity:
translateX:
translateY:
scale:
rotate:
blur:

Final:
opacity:
translateX:
translateY:
scale:
rotate:
blur:

Duration:
Delay:
Stagger:
Easing:
```

---

# 18. ACCESSIBILITY

Implementation phải đảm bảo:

* Semantic HTML
* Keyboard navigation
* Focus states
* Screen readers
* ARIA
* Color contrast
* Reduced motion
* Alt text
* Accessible forms
* Accessible dialogs
* Accessible navigation

Accessibility không được phá vỡ visual design đã định nghĩa.

---

# 19. TECHNICAL IMPLEMENTATION CONTEXT

UI specification phải có khả năng thích ứng với frontend stack của project.

**AI phải xác định frontend framework hiện tại mà project đang sử dụng. Nếu project đã có frontend framework, phải tuân thủ framework đó, version, architecture, conventions, dependencies và project structure hiện tại. Không được tự ý chuyển sang hoặc đưa thêm một frontend framework khác nếu người dùng không yêu cầu. Nếu project chưa có frontend framework, sử dụng tuân thủ Flowchart 1 trong Business.md của hệ thống làm recommendation để xác định frontend framework phù hợp.**

Implementation agent phải tôn trọng:

* Frontend framework hiện tại
* Framework version
* Programming language
* Build system
* Styling system
* Component library
* Animation libraries
* Routing
* Project structure
* Coding conventions hiện tại

Nếu project đã có library/dependency phù hợp, ưu tiên sử dụng dependency hiện có thay vì tạo thêm một giải pháp trùng lặp.

---

# 20. DATA & CONTENT

Xác định toàn bộ content cần thiết cho UI.

Bao gồm:

* Text
* Labels
* Buttons
* Navigation
* Cards
* Lists
* Testimonials
* Statistics
* Forms
* Error messages
* Empty states
* Loading states

Khi exact content đã được cung cấp:

**Exact content > generated content**

Không tự ý tạo replacement copy.

---

# 21. UI STATES

Xác định rõ các state quan trọng.

```text
Loading
Empty
Success
Error
Disabled
Active
Selected
Expanded
Collapsed
Authenticated
Unauthenticated
Permission denied
Network error
```

Với mỗi state xác định:

* Người dùng nhìn thấy gì
* Có thể thực hiện action nào
* Visual treatment
* Transition
* Recovery behavior

---

# 22. FIXED PARAMETERS

Section này có tính **authoritative**.

Mọi giá trị được chỉ định rõ phải được xem là cố định.

Ví dụ:

```text
PAGE_HEIGHT:
CONTAINER_WIDTH:
HEADER_HEIGHT:

FONT_SIZE:
LINE_HEIGHT:
LETTER_SPACING:

BORDER_RADIUS:
BORDER_WIDTH:

ANIMATION_DURATION:
ANIMATION_DELAY:
STAGGER:

SPRING_MASS:
SPRING_STIFFNESS:
SPRING_DAMPING:

SCROLL_SMOOTHING:

BREAKPOINT_MOBILE:
BREAKPOINT_TABLET:
BREAKPOINT_DESKTOP:
```

Không được thay đổi các giá trị đã được chỉ định rõ nếu người dùng không yêu cầu.

---

# 23. IMPLEMENTATION RULES

Implementation agent phải:

1. Tuân thủ chính xác specification.
2. Giữ nguyên visual hierarchy.
3. Giữ nguyên exact content.
4. Giữ nguyên exact assets.
5. Giữ nguyên fixed parameters.
6. Giữ nguyên animation behavior đã chỉ định.
7. Giữ nguyên responsive behavior.
8. Giữ nguyên interaction behavior.
9. Tuân thủ frontend framework hiện tại nếu project đã có.
10. Không tự ý thêm frontend framework khác.
11. Không thêm library trùng lặp không cần thiết.
12. Không tự phát minh feature.
13. Không tự phát minh content.
14. Không sử dụng placeholder implementation.
15. Không để TODO implementation.
16. Implementation phải production-ready.
17. Components phải có khả năng tái sử dụng.
18. Duy trì accessibility.
19. Duy trì responsive behavior.
20. Không đơn giản hóa interaction đã được specification mô tả nếu không có yêu cầu rõ ràng.

---

# 24. OUTPUT REQUIREMENTS

Sinh ra một **UI Design Specification hoàn chỉnh**.

Specification phải đủ chi tiết để implementation agent có thể xây dựng giao diện mà không phải tự tái tạo các quyết định thiết kế quan trọng.

Output phải bao gồm:

* Complete page structure
* Complete sections
* Complete component definitions
* Complete visual system
* Complete typography
* Complete color system
* Complete asset definitions
* Complete responsive behavior
* Complete interaction behavior
* Complete animation behavior
* Complete UI states
* Accessibility requirements
* Technical implementation constraints
* Fixed parameters
* Acceptance criteria

**Không sinh application code**, trừ khi người dùng yêu cầu rõ ràng.

---

# 25. ACCEPTANCE CRITERIA

UI Design Specification chỉ được xem là hoàn chỉnh khi:

## Design

* [ ] Visual direction được xác định
* [ ] Color system được xác định
* [ ] Typography được xác định
* [ ] Spacing được xác định
* [ ] Components được xác định
* [ ] Assets được xác định

## Layout

* [ ] Page hierarchy được xác định
* [ ] Mọi section được xác định
* [ ] Responsive behavior được xác định

## Interaction

* [ ] Interactive elements được xác định
* [ ] UI states được xác định
* [ ] Hover behavior được xác định
* [ ] Click behavior được xác định
* [ ] Scroll behavior được xác định nếu cần

## Animation

* [ ] Entrance animations được xác định
* [ ] Interaction animations được xác định
* [ ] Scroll animations được xác định
* [ ] Timing / easing được xác định
* [ ] Spring parameters được xác định nếu có

## Engineering

* [ ] Framework context được xác định / tuân thủ
* [ ] Existing project architecture được tôn trọng
* [ ] Không tự ý migration framework
* [ ] Không thiếu implementation requirements quan trọng
* [ ] Không có critical behavior chưa được định nghĩa

---

# 26. CORE GENERATION PRINCIPLE

Hãy xem specification này như một **implementation contract**, không phải một mô tả thiết kế chung chung.

Khi thông tin đã được chỉ định rõ:

```text
EXACT SPECIFICATION
        >
INTERPRETATION
        >
DEFAULT ASSUMPTION
```

Khi thông tin chưa được chỉ định:

```text
MINIMAL VALID DECISION
        >
INVENTED FEATURE
```

Specification cuối cùng phải kết nối:

```text
Product Requirements
        ↓
User Requirements
        ↓
Business Requirements
        ↓
UX Structure
        ↓
Visual Design
        ↓
Design System
        ↓
Components
        ↓
Interaction
        ↓
Animation
        ↓
Responsive Behavior
        ↓
Frontend Implementation Context
```

Mục tiêu không chỉ là mô tả UI trông như thế nào.

Mục tiêu là tạo ra một **UI Implementation Specification chính xác, nhất quán và đủ chi tiết để AI Coding Agent có thể triển khai giao diện mà không phải tự suy đoán các quyết định quan trọng.**
