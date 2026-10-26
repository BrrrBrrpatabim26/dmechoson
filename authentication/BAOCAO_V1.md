# BÁO CÁO V1 — Kiểm toán mã thừa (Dead / Redundant Code Audit)

**Phạm vi:** toàn bộ dự án [`authentication/`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication) — `src/`, `test/`, `scripts/`, các file cấu hình (`.ts`), `package.json`, `Dockerfile`, `docker-compose.yml`.
**Ngày lập:** 2026-10-16 · **Commit đối chiếu:** `1062fe7` (working tree sạch tại thời điểm audit).
**Giai đoạn này chỉ PHÂN TÍCH + VIẾT BÁO CÁO. Không sửa bất kỳ mã nguồn nào.** Mọi mục "Khuyến nghị" là đề xuất cho giai đoạn sau, chưa thực thi.

---

## 1. Phương pháp & công cụ (đã thực sự chạy)

Kiểm chứng kiểu **kết hợp**: dùng công cụ phân tích tĩnh để *sinh ứng viên*, rồi **grep + đọc mã** để *xác minh từng ứng viên* và **khử dương-tính-giả** do NestJS DI / TypeORM / decorator / entrypoint.

| # | Lệnh (chạy trong `authentication/`) | Kết quả thật |
|---|---|---|
| 1 | `npx tsc --noEmit --noUnusedLocals --noUnusedParameters -p tsconfig.json` (bật cả test) | **2** lỗi `TS6133`: `refreshExpiresDays`, tham số `ip` |
| 2 | `npx depcheck` | Unused **devDependencies**: `@nestjs/schematics`, `source-map-support`. Không có dependency production thừa. |
| 3 | `npx ts-prune` | 12 dòng; phần lớn nhãn `(used in module)` (FP). Ứng viên thật: `AuthMethod`, `SystemProviderType` + `default` (config entrypoint, FP) |
| 4 | `npx knip` (hiểu `test`/`vitest`) | Unused **file**: `scripts/bench.mjs`; Unused **devDeps**: `@types/js-yaml`, `@types/uuid`, `source-map-support`; Unused **export**: `RedisConnectionLifecycle`; Unused **exported types**: `AuthMethod`, `SystemProviderType` |
| 5 | Scan Node tự viết — đếm `INJECTION_TOKENS.<KEY>` trong **167 file `.ts`** (src+test) | `PASSWORD_HASHER_SERVICE` = **0** lần nạp; 23 token còn lại đều ≥3 |
| 6 | Scan Node tự viết — đối chiếu khoá `configuration.ts` với mọi `configService.get('…')` | **4** khoá khai báo nhưng không nơi nào đọc: `app.nodeEnv`, `auth.otpLength`, `auth.otpExpiresInSeconds`, `auth.magicLinkExpiresInSeconds` |

**Cách khử dương-tính-giả:** với mỗi ứng viên, grep tên symbol trong *to bộ* `authentication` (cả `.ts`, `.mjs`, `.json`, `Dockerfile`, `.yml`), loại trừ kết quả chính là dòng khai báo; nếu còn 0 tham chiếu thật → **CONFIRMED thừa**; nếu chỉ dùng trong cùng file/module → **quá thừa (chỉ nên bỏ `export`)**; nếu nạp qua DI token / `getEntities()` / decorator / entrypoint → **FP, giữ lại** (xem §5).

---

## 2. Bảng tổng quan (dashboard)

| Nhóm | Confirmed — Cao | Confirmed — Trung bình | FP / Giữ lại | Tổng phát hiện |
|---|---:|---:|---:|---:|
| A. Mã chết không tham chiếu | 4 | 1 (`export` thừa) | — | 5 |
| B. Dependency thừa | 1 | 2 | 1 (`@nestjs/schematics`) | 4 |
| C. Logic trùng / bất khả reach | 2 | — | — | 2 |
| D. Config / env / DB unused | 4 | — | — | 4 |
| E. Tooling mồ côi (không chết) | — | 1 (`bench.mjs`) | — | 1 |
| **Cộng** | **11** | **4** | **1** | **16** |

> **Điểm sáng:** `tsc` trên **cả src + test** chỉ báo **2** chỗ unused → không có imports/biến chết rãi rác; `depcheck` xác nhận **không có dependency production thừa**. Mã thừa tập trung ở **symbol/loại hình xuất khẩu**, **`@types` chồng lấn** và **khoá cấu hình không nối** — không phải rác lan tràn.

---

## 3. Chi tiết phát hiện

Ký hiệu độ tin cậy: 🟢 Cao (bằng chứng trực tiếp, chắc chắn) · 🟡 Trung bình (chắc chắn có điều kiện / cần quyết định thiết kế).

### A. Mã chết không tham chiếu

#### A1 🟢 `INJECTION_TOKENS.PASSWORD_HASHER_SERVICE` — token DI không ai nạp
- **File:** [`src/core/tokens/injection.tokens.ts:9`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/core/tokens/injection.tokens.ts#L9)
- **Loại:** symbol chết (thừa sau refactor)
- **Bằng chứng:** scan 167 file `.ts` → số lần xuất hiện `INJECTION_TOKENS.PASSWORD_HASHER_SERVICE` = **0** (chỉ có dòng khai báo). Token thật đang dùng là `PASSWORD_HASHER` (=3 lần).
- **Vì sao thừa:** không provider nào `provide`/`inject` token này; đây là di tích khi gộp lớp hasher.
- **Khuyến nghị:** xoá dòng 9. *(Rủi ro: gần như 0 — symbol nội bộ.)*

#### A2 🟢 `type AuthMethod` — kiểu xuất khẩu không dùng
- **File:** [`src/common/constants/auth-methods.constant.ts:14`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/common/constants/auth-methods.constant.ts#L14)
- **Loại:** exported *type* chết · **Bằng chứng:** `tsc/ts-prune/knip` đồng thuận; grep = 1 (chỉ dòng khai báo).
- **Vì sao thừa:** hằng `AUTH_METHODS` (dòng 4–12) **đang được dùng** (vd `auth.service.ts`); chỉ *alias kiểu* `AuthMethod` không nơi nào import.
- **Khuyến nghị:** xoá `export type AuthMethod` (giữ nguyên `AUTH_METHODS`). *(Rủi ro: thấp — type-only, không ảnh hưởng runtime.)*

#### A3 🟢 `type SystemProviderType` — kiểu xuất khẩu không dùng
- **File:** [`src/common/constants/system-provider.constant.ts:18`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/common/constants/system-provider.constant.ts#L18)
- **Loại:** exported *type* chết · **Bằng chứng:** `ts-prune/knip`; grep = 1 (chỉ khai báo). Hằng `SYSTEM_PROVIDER` **đang dùng** (`auth.service.ts:149`).
- **Khuyến nghị:** xoá `export type SystemProviderType` (giữ `SYSTEM_PROVIDER`). *(Rủi ro: thấp.)*

#### A4 🟢 `private refreshExpiresDays` (JwtTokenService) — chỉ ghi, không đọc
- **File:** [`src/modules/token/jwt-token.service.ts:16`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/modules/token/jwt-token.service.ts#L16) (khai báo) và `:27` (gán từ config)
- **Loại:** field chết · **Bằng chứng:** `tsc TS6133` "declared but its value is never read". Giá trị `jwt.refreshExpiresDays` **có** được dùng ở *nơi khác* — chỉ **bản sao trong class này** không bao giờ đọc.
- **Vì sao thừa:** gán để đó nhưng logic ký refresh không dùng (hạn mức token lấy từ nguồn khác).
- **Khuyến nghị:** xoá field dòng 16 + phép gán dòng 27. *(Rủi ro: thấp.)*

#### A5 🟡 `export class RedisConnectionLifecycle` — `export` thừa (lớp vẫn đang dùng)
- **File:** [`src/modules/redis/redis.module.ts:40`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/modules/redis/redis.module.ts#L40)
- **Loại:** quá thừa *visibility* (không phải mã chết) · **Bằng chứng:** `knip` báo unused export; grep = 2 (khai báo + nằm trong `providers` của **chính file này**). Lớp được Nest `use` làm `OnApplicationShutdown` → **đang chạy**.
- **Vì sao:** `export` không cần thiết (không module nào import), nhưng **xoá class sẽ làm mất graceful-disconnect Redis**.
- **Khuyến nghị:** chỉ **bỏ từ khoá `export`**; **KHÔNG** xoá lớp. *(Rủi ro: thấp nếu giữ nguyên logic.)*

### B. Dependency thừa

#### B1 🟢 `@types/uuid` (devDep) — trùng kiểu đã có sẵn
- **File:** [`package.json`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/package.json) (`devDependencies`)
- **Bằng chứng:** `knip` liệt kê; kiểm tra package đã cài: `uuid@14.0.3` có `bundledTypes = true` (tự ship `.d.ts`).
- **Vì sao thừa:** từ `uuid` v7+, kiểu đi kèm package → `@types/uuid@10.0.0` là dư, có thể xung đột phiên bản kiểu.
- **Khuyến nghị:** gỡ `@types/uuid`. *(Rủi ro: thấp; build lại + `tsc --noEmit` để xác nhận.)*

#### B2 🟡 `@types/js-yaml` (devDep) — trùng kiểu đã có sẵn
- **Bằng chứng:** `knip` liệt kê; package đã cài báo `bundledTypes = true`.
- **Lưu ý về bằng chứng:** định danh phiên bản `js-yaml` khi `require('js-yaml/package.json')` trả `5.4.3` (khác chuỗi 3.x/4.x công khai) → có thể do module phân giải tới bản trung gian. Vì vậy xếp **Trung bình**: nên xác nhận bằng `npm ls js-yaml` và `tsc --noEmit` *trước khi* gỡ.
- **Khuyến nghị:** sau khi xác nhận, gỡ `@types/js-yaml`. *(Rủi ro: TB.)*

#### B3 🟡 `source-map-support` (devDep) — không được nối vào đâu
- **File:** `package.json:77` · **Bằng chứng:** `depcheck` + `knip` cùng báo; grep toàn dự án = 1 (chỉ dòng khai báo trong `package.json`). `Dockerfile:55` chạy `CMD ["node","dist/main.js"]` và script `start:prod` = `node dist/main` — **không** có `-r source-map-support/register` hay `import 'source-map-support/register'`.
- **Vì sao thừa:** thư viện chỉ có tác dụng khi được *register* lúc khởi động; hiện không được register → không có hiệu lực.
- **Khuyến nghị (2 lựa chọn, tuỳ quyết định):** hoặc **gỡ** `source-map-support`, hoặc **nối** nó (`node -r source-map-support/register dist/main`) nếu muốn stack-trace ánh xạ về `.ts`. → Đây là **quyết định sản phẩm**, không phải xoá-mặc-định. *(Rủi ro: TB.)*

### C. Logic trùng lặp / bất khả reach

#### C1 🟢 Tham số `ip` bị **nhận rồi vứt** (DeviceRepository)
- **File:** [`src/repositories/device.repository.ts:18`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/repositories/device.repository.ts#L18) (tham số `ip?`), khai báo interface [`repositories.interface.ts:74`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/core/interfaces/repositories.interface.ts#L74)
- **Bằng chứng:** `tsc TS6133` "`ip` is declared but never read". Entity [`device.entity.ts`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/entities/device.entity.ts) **không có cột `ip`** (grep `ip` = 0). Trong khi đó `auth.service.ts:194` và `:346` **gọi** `deviceRepo.findOrCreate(user.id, ua, context?.ip, …)` → IP được truyền vào rồi **bị bỏ**, không lưu.
- **Vì sao:** đây là **mã chết có chủ đích giả** — chữ ký ép phải giữ `ip` (vì interface + call-site truyền theo vị trí), nên *không thể* xoá param đơn lẻ.
- **Khuyến nghị (chọn 1):** (a) **lưu** `ip` (thêm cột `ip` cho `Device` + ghi trong `findOrCreate`) — nếu nghiệp vụ cần vết IP; hoặc (b) **dọn** `ip` khỏi interface + impl + mọi call-site. → **KHÔNG** chỉ xoá tham số ở impl (sẽ lệch vị trí `label`). *(Rủi ro: TB–Cao vì đụng interface.)*

#### C2 🟢 Hạn mức OTP **cứng** trong mã, bỏ qua cấu hình
- **File:** [`src/modules/verification/verification.service.ts:40`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/modules/verification/verification.service.ts#L40) — chú thích "Sinh mã OTP 6 số (thời hạn 5 phút)" rồi gọi `this.numericOtpStrategy.generate(5)`.
- **Bằng chứng:** giá trị độ dài/hạn mức **không** đọc từ config (xem D2–D4); tham số `5` và độ dài `6` được mã hoá cứng.
- **Vì sao trùng/thừa:** tồn tại song song "nguồn sự thật" — config hứa cho cấu hình nhưng bị phớt lờ → **logic gây thừa + dễ sai lệch**.
- **Khuyến nghị:** hoặc **nối** `numericOtpStrategy.generate()` đọc `auth.otpLength`/`auth.otpExpiresInSeconds` (làm config có nghĩa), hoặc **xoá** các khoá config/env tương ứng (xem §D). → Cần quyết định hướng nào. *(Rủi ro: TB.)*

### D. Config / env / DB unused

> Các mục D1–D4: **khoá khai báo trong `configuration.ts` nhưng không một `configService.get()` nào đọc** (đối chiếu tự động mọi lệnh gọi `get` trong `src/`). Kéo theo **biến môi trường tương ứng bị thu thập rồi vô hiệu** — người vận hành tưởng tinh chỉnh được qua `.env` nhưng thực tế mã bỏ qua.

#### D1 🟢 `app.nodeEnv` — khoá chết
- [`src/config/configuration.ts:3`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/config/configuration.ts#L3) · grep `app.nodeEnv` = 0; `nodeEnv` chỉ xuất hiện ở dòng khai báo. (Bản `process.env.NODE_ENV` vẫn được đọc trực tiếp nơi khác — nhưng **khoá config này** thì không.)
- **Khuyến nghị:** xoá `app.nodeEnv` khỏi `configuration.ts`, hoặc thay chỗ đọc `process.env.NODE_ENV` bằng `configService.get('app.nodeEnv')` để dùng. *(Rủi ro: thấp.)*

#### D2 🟢 `auth.otpLength` (+ env `AUTH_OTP_LENGTH`) — khoá chết
- `configuration.ts:53` · chỉ xuất hiện ở dòng khai báo (toàn src+test). OTP dùng số cứng (C2).
- **Khuyến nghị:** nối vào OTP length thật, hoặc xoá khoá + env. *(Rủi ro: TB — dính D.)*

#### D3 🟢 `auth.otpExpiresInSeconds` (+ env `AUTH_OTP_EXPIRES_IN_SECONDS`) — khoá chết
- `configuration.ts:54` · như D2.
- **Khuyến nghị:** như D2. *(Rủi ro: TB.)*

#### D4 🟢 `auth.magicLinkExpiresInSeconds` (+ env `AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS`) — khoá chết
- `configuration.ts:55` · chỉ ở dòng khai báo; magic-link hạn mức lấy nguồn khác.
- **Khuyến nghị:** như D2. *(Rủi ro: TB.)*

> **Liên quan cần kiểm thêm (chưa chốt trong báo cáo này):** nếu xoá D2–D4 thì `validation.schema.ts` / `.env.example` / `config.yaml` cũng nên dọn các biến `AUTH_OTP_*`/`AUTH_MAGIC_LINK_*` tương ứng để nhất quán — *chưa được xác minh hết trong lượt audit này* (xem §7).

### E. Tooling mồ côi (KHÔNG phải mã chết)

#### E1 🟡 `scripts/bench.mjs`
- [`scripts/bench.mjs`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/scripts/bench.mjs) · `knip` gọi là "unused file" vì **không có npm script nào tham chiếu** (`package.json.scripts` có `smoke` → `live-smoke.mjs`, nhưng **không** có `bench`).
- **Bản chất:** công cụ đo độ trễ chạy tay (`node scripts/bench.mjs`) — **còn giá trị**, chỉ là **chưa nối / chưa ghi tài liệu**.
- **Khuyến nghị:** thêm script `npm run bench` hoặc ghi vào `TESTING.md`; **đừng xoá**. *(Rủi ro: thấp.)*

---

## 4. Backlog dọn dẹp (đề xuất thứ tự — chưa thực thi)

| Ưu tiên | Mục | Hành động đề xuất | Rủi ro |
|---|---|---|---|
| 1 | A1 `PASSWORD_HASHER_SERVICE` | Xoá token | Rất thấp |
| 2 | A2/A3 `AuthMethod`, `SystemProviderType` | Xoá 2 `export type` | Thấp |
| 3 | A4 `refreshExpiresDays` | Xoá field + phép gán | Thấp |
| 4 | B1 `@types/uuid` | Gỡ devDep | Thấp |
| 5 | A5 `RedisConnectionLifecycle` | Bỏ `export` (giữ lớp) | Thấp |
| 6 | D1 `app.nodeEnv` | Xoá khoá | Thấp |
| 7 | E1 `bench.mjs` | Nối npm script / ghi docs | Thấp |
| 8 | B2 `@types/js-yaml` | Xác nhận `npm ls js-yaml` rồi gỡ | TB |
| 9 | B3 `source-map-support` | **Quyết định**: gỡ *hoặc* nối `-r …/register` | TB |
| 10 | D2–D4 + C2 OTP config | **Quyết định**: nối config *hoặc* xoá khoá+env | TB |
| 11 | C1 `ip` bị vứt | **Quyết định**: lưu `ip` (thêm cột) *hoặc* gỡ khỏi interface+call-site | TB–Cao |

> Sau **mọi** thay đổi: `npm run build` + `npm run lint` + `npm run test` (81) + `npm run test:e2e` (38) phải xanh. Nhóm C1/D+C2 **cần phê duyệt thiết kế** vì đổi hành vi (lưu IP / hạn mức OTP).

---

## 5. "Framework-referenced — KHÔNG xoá" (dương-tính-giả đã khử)

Những mục công cụ *có thể* gợi ý nhưng **đang thực sự chạy** nhờ reflection/DI/entrypoint — **giữ nguyên**:

- **Toàn bộ provider nạp qua `INJECTION_TOKENS`** (23 token còn lại): class chỉ được tham chiếu bằng **Symbol** lúc runtime → grep "unused" dễ nhầm. Đã xác nhận đều ≥3 lần dùng.
- **21 TypeORM entity** trong [`base-database-strategy.abstract.ts`](file:///c:/Users/Nexus/Documents/0.%20WORKSPACE/agent-cloud/authentication/src/core/abstracts/base-database-strategy.abstract.ts) `getEntities()`: dùng động, không import trực tiếp từng nơi.
- **`default` export** của `vitest.config.ts` / `vitest.config.e2e.ts` (`ts-prune` báo `default`): là **điểm vào** của runner, không phải chết.
- **Hằng số `AUTH_METHODS` / `SYSTEM_PROVIDER`**: bản thân **đang dùng** — chỉ *alias kiểu* đi kèm (A2/A3) là thừa; **đừng xoá nhầm hằng số**.
- **`@nestjs/schematics`** (`depcheck` báo unused): **nên giữ** — là peer của `@nestjs/cli` cho `nest build/generate`; không import trong source nhưng cần cho toolchain.
- **`reflect-metadata`, `@types/express`**: cần cho runtime decorator / kiểu Express — `depcheck`/`knip` **không** báo thừa → giữ.

---

## 6. Phụ lục — snapshot output công cụ (nguyên văn, đã chạy)

```
# [1] tsc (bật cả test): 2 TS6133
src/modules/token/jwt-token.service.ts(16,20): error TS6133: 'refreshExpiresDays' is declared but its value is never read.
src/repositories/device.repository.ts(18,5): error TS6133: 'ip' is declared but its value is never read.

# [2] depcheck
Unused devDependencies
* @nestjs/schematics
* source-map-support

# [3] ts-prune (lọc bỏ các dòng "(used in module)" = FP)
src/common/constants/auth-methods.constant.ts:14 - AuthMethod
src/common/constants/system-provider.constant.ts:18 - SystemProviderType
vitest.config.ts:4 - default          (FP: entrypoint)
vitest.config.e2e.ts:4 - default      (FP: entrypoint)

# [4] knip
Unused files (1): scripts/bench.mjs
Unused devDependencies (3): @types/js-yaml (package.json:65) | @types/uuid (package.json:72) | source-map-support (package.json:77)
Unused exports (1): RedisConnectionLifecycle  class  src/modules/redis/redis.module.ts:40:14
Unused exported types (2): AuthMethod | SystemProviderType

# [5] Scan INJECTION_TOKENS.<KEY> (167 file .ts, src+test)
PASSWORD_HASHER_SERVICE = 0   (23 token còn lại: >=3)

# [6] Scan khoá configuration.ts vs các configService.get()
KHÔNG ĐỌC: app.nodeEnv | auth.otpLength | auth.otpExpiresInSeconds | auth.magicLinkExpiresInSeconds

# Kiềm định danh thư viện
uuid@14.0.3 bundledTypes=true   ->  @types/uuid dư
js-yaml (bundledTypes=true)     ->  @types/js-yaml dư  *caveat phiên bản, cần npm ls xác nhận
source-map-support: chỉ xuất hiện ở package.json; Dockerfile CMD = node dist/main.js (không -r register)
```

---

## 7. Giới hạn & điểm chưa kiểm chứng

- **Cột/khoá DB mức entity:** chưa **liệt kê toàn bộ** cột/relation không query (diện rộng, cần trace từng repository). Đã kiểm trường hợp cụ thể: `Device` thiếu cột `ip` dù tham số `ip` tồn tại (C1). Khuyến nghị lượt sau quét `@Column` vs usage.
- **Nhánh bất khả reach tổng quát:** chưa chạy công cụ coverage-lỗi; mới bắt qua `tsc` + đọc mã. `base` controller/service theo Template Method nên trùng lặp thấp.
- **`@types/js-yaml`:** nghi ngờ dư (bundled types) nhưng **chưa chốt** do số phiên bản bất thường — cần `npm ls js-yaml` trước khi gỡ.
- **Đồng bộ env/schema/yaml (D2–D4):** các biến `AUTH_OTP_*`/`AUTH_MAGIC_LINK_*` trong `validation.schema.ts`, `.env.example`, `config.yaml` **chưa được đối chiếu từng dòng** để liệt kê đầy đủ.
- **Báo cáo không sửa mã:** không file nguồn nào bị biến đổi trong lượt này.

---

## 8. Nghiệm thu

- ✅ Tồn tại `authentication/BAOCAO_V1.md`; phủ **4 loại** (mã chết, dependency, logic trùng/reach, config/env) × phạm vi **toàn bộ `authentication/`**.
- ✅ Mỗi phát hiện có **đường dẫn + khoảng dòng + symbol + bằng chứng + mức tin cậy + khuyến nghị**.
- ✅ Có mục **FP-framework riêng** (§5); **chỉ trích số liệu của tool thực sự chạy** (§1, §6).
- ✅ **Không sửa mã nguồn** — xác minh bằng `git status` (§9).

## 9. Bằng chứng "không sửa mã" (chạy lúc bàn giao)

- `git status --short` → **chỉ** `?? authentication/BAOCAO_V1.md` (file báo cáo mới, chưa track).
- `git diff --stat` → **rỗng** → **không** file nguồn/cấu hình nào bị sửa.
- Đối chiếu gốc: commit `1062fe7`, working tree sạch trước khi audit.

⇒ Giai đoạn này **thuần phân tích**; toàn bộ khuyến nghị ở §3–§4 **chưa** áp dụng vào mã.

---

## 10. CẬP NHẬT SAU KHI FIX (giai đoạn dọn dẹp — đã áp dụng)

> Mục này **thay thế** khẳng định "chưa sửa mã" ở §8–§9: theo yêu cầu tiếp theo, đã **tiến hành sửa** dựa trên báo cáo. Kiểm chứng lại: `tsc noUnused` = **0** TS6133; `knip` = **rỗng** (sạch); `depcheck` chỉ còn `@nestjs/schematics` (cố ý giữ — §5); `build` exit **0**; `lint` **0/0**; **unit 81/81**; **e2e 38/38**; `npm install` gỡ **5 package**.

| Mã mục | Phát hiện | Xử lý | File đã sửa |
|---|---|---|---|
| A1 | Token `PASSWORD_HASHER_SERVICE` | **Đã xoá** | `injection.tokens.ts` |
| A2 | `type AuthMethod` | **Đã xoá** (giữ `AUTH_METHODS`) | `auth-methods.constant.ts` |
| A3 | `type SystemProviderType` | **Đã xoá** (giữ `SYSTEM_PROVIDER`) | `system-provider.constant.ts` |
| A4 | Field `refreshExpiresDays` (chỉ ghi) | **Đã xoá** field + phép gán | `jwt-token.service.ts` |
| A5 | `export` thừa `RedisConnectionLifecycle` | **Đã bỏ `export`** (giữ lớp) | `redis.module.ts` |
| B1 | `@types/uuid` | **Đã gỡ** (uuid v14 tự ship types) | `package.json` + lock |
| B2 | `@types/js-yaml` | **Đã gỡ** — xác nhận `js-yaml@5.4.3` ship `dist/js-yaml.d.ts` (nâng 🟡→🟢) | `package.json` + lock |
| B3 | `source-map-support` | **Đã gỡ** (không nối `-r register`) | `package.json` + lock |
| C1 | Tham số `ip` bị vứt | **Đã gỡ** khỏi interface + impl + **3 call-site** (không lưu IP; Device không có cột) | `repositories.interface.ts`, `device.repository.ts`, `auth.service.ts` (×3) |
| C2 / D2–D4 | Config OTP promise-but-ignored vs mã cứng | **Đã xoá** khoá chết `auth.otpLength`/`auth.otpExpiresInSeconds`/`auth.magicLinkExpiresInSeconds` → xoá nguồn *thứ hai gây nhầm lẫn*; OTP giữ **một** nguồn (hằng số trong `NumericOtpStrategy`). *Lựa chọn an toàn thay vì nối config (không đổi hành vi).* | `configuration.ts` |
| D1 | `app.nodeEnv` | **Đã xoá** khoá (NODE_ENV vẫn đọc trực tiếp nơi khác) | `configuration.ts` |
| E1 | `scripts/bench.mjs` mồ côi | **Đã nối** `npm run bench` (giữ tool, xoá trạng thái mồ côi) | `package.json` |
| — | `@nestjs/schematics` | **GIỮ** — peer của `@nestjs/cli` (FP đã ghi ở §5) | — |

**Không đổi hành vi runtime:** mọi thay đổi là gỡ mã/khoá không được đọc, gỡ `@types` trùng, bỏ `export` thừa, và nối script mới. Bộ test thật (81 đơn vị + 38 e2e DB) **xanh toàn bộ** sau khi sửa.
