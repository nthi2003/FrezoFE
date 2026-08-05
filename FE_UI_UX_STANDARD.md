# Frezo ERP — UI/UX & Code Standard

> **Bối cảnh:** Frezo ERP là hệ thống enterprise admin (RBAC, HR, Task, CMS, Warehouse, Customer, Product, Contracts...). UI phục vụ user nội bộ làm việc **8 tiếng/ngày** với **dày dữ liệu** — không phải khách vãng lai. Vì vậy chuẩn này **cực đoan** về **nhất quán, tối giản, tốc độ quét mắt, tải nhận thức thấp**.
>
> **File này chỉ áp dụng cho `packages/erp/**`.** Landing (`packages/landing`, `landing-page/`) có brand + triết lý riêng, xem `LANDING_UI_UX_STANDARD.md` (đang chờ tạo).
>
> **Cách dùng:** Cursor rule `.cursor/rules/erp-ui-ux.mdc` sẽ tự động nạp file này mỗi khi AI đụng `packages/erp/**/*.{tsx,jsx,css}`. Trước khi code, AI **PHẢI đọc** section liên quan và ở cuối phiên **PHẢI** tự chạy Checklist section 12.

---

## Mục lục

**Phần A — Foundation**

1. [Design Philosophy — Kim chỉ nam](#1-design-philosophy)
2. [Reference UI — Nguồn cảm hứng chuẩn](#2-reference-ui)
3. [Design Tokens](#3-design-tokens)
4. [Grid System & Layout](#4-grid-system--layout)
5. [Icon Standard](#5-icon-standard)

**Phần B — Components & Screens**

6. [Component Specifications](#6-component-specifications)
7. [Dashboard Layout Structure](#7-dashboard-layout-structure)
8. [Enterprise CRUD Requirements](#8-enterprise-crud-requirements)

**Phần C — Code Quality & Governance**

9. [Coding Standards](#9-coding-standards)
10. [RBAC & Permission Display](#10-rbac--permission-display)
11. [Responsive & Accessibility (WCAG AA)](#11-responsive--accessibility)
12. [Self-Review Checklist](#12-self-review-checklist)
13. [Prompt Templates](#13-prompt-templates)

**Phần D — Enterprise Patterns (SAP Fiori / Ant Pro / Linear inspired)**

14. [Advanced List & Detail Patterns](#14-advanced-list--detail-patterns) — Flexible Column, Object Page, Kanban, Timeline, Multi-tab
15. [Workflow & Approval System](#15-workflow--approval-system) — Status pipeline, 2-tier OP/RV approver, Bulk approve
16. [AI Actions Pattern](#16-ai-actions-pattern) — AI extract/edit/sync với `aiStatus` badge
17. [Data Operations](#17-data-operations) — Bulk selection, Import wizard, Export & Print
18. [Power-user Features](#18-power-user-features) — Command Palette Cmd+K, Notification Center, Sensitive Data Reveal
19. [Vietnamese Localization](#19-vietnamese-localization) — VND, ngày VN, phone/CCCD/MST, địa chỉ hành chính
20. [Domain-Specific Patterns per Module](#20-domain-specific-patterns-per-module) — HR / Task / CMS / Warehouse / Customer / FB Automation

---

## 1. Design Philosophy

> 7 nguyên tắc bất di bất dịch. Nếu 1 quyết định thiết kế vi phạm bất kỳ nguyên tắc nào → **sai**, dù có "đẹp".

| # | Nguyên tắc                       | Ý nghĩa cụ thể                                                                             |
| - | -------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 | **Professional**                 | Không màu mè, không trẻ trâu, không emoji trong UI. Trông như phần mềm kế toán/ngân hàng.  |
| 2 | **Minimal**                      | Mỗi pixel phải phục vụ 1 mục đích. Xóa mọi thứ không cần thiết.                            |
| 3 | **Fast Scanning**                | User quét bằng mắt trong 2 giây phải hiểu screen làm gì. Ưu tiên grid, alignment, hierarchy.|
| 4 | **Low Cognitive Load**           | Không bắt user nhớ, đoán, hay đếm. Label rõ, tooltip cho icon, state rõ.                   |
| 5 | **Consistency > Creativity**     | 1 nút Save trong 100 màn phải giống hệt nhau. Không "sáng tạo lại".                        |
| 6 | **Information First**            | Data là nhân vật chính. Trang trí (icon, avatar, border) chỉ là phụ.                       |
| 7 | **White Space is a Feature**     | Khoảng trắng KHÔNG phải "lãng phí" — nó tạo nhịp thở, tăng tốc quét mắt.                   |

### Nghiêm cấm

| Cấm                              | Vì sao                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| ❌ Gradient background            | Không professional, gây phân tâm khỏi data                                              |
| ❌ Shadow mạnh (`shadow-lg`+)     | Trông như card game, làm rối hierarchy                                                  |
| ❌ Neon, glow, glass, neumorphism | Rẻ tiền, không phù hợp enterprise                                                        |
| ❌ Card lòe loẹt (bg màu, viền dày)| Che khuất data                                                                          |
| ❌ Animation dư thừa (parallax, auto-carousel, confetti, floating icon) | Distracting, tốn CPU, gây nôn nao trong 8h làm việc |
| ❌ Border >1px (trừ focus ring)   | Nặng nề                                                                                  |
| ❌ Border-radius >12px            | Trông như app tiêu dùng, không enterprise                                                |
| ❌ Emoji trong UI text (title, label, button, tooltip) | Không professional. Chỉ dùng trong empty state đặc thù nếu có brand duyệt |
| ❌ Nhiều font                     | Chỉ Be Vietnam Pro. Không mix Roboto/SF Pro/Poppins                                     |
| ❌ Nhiều màu accent (>3 màu status trên 1 screen) | Nhiễu                                                                    |
| ❌ Divider bừa bãi (dọc giữa cột, ngang giữa card…) | Dùng SPACING để tách section, không dùng đường kẻ                       |

---

## 2. Reference UI

> Khi AI phân vân "nên làm thế nào" → **đối chiếu bộ tham chiếu chuẩn** theo 4 nhóm dưới đây. Nếu không có SAP Fiori / Linear / Vercel / Stripe / Ant Pro làm kiểu đó → Frezo cũng không làm.

### 2.1. Style & Interaction — cho design language chung

| Sản phẩm                    | Học điều gì                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **Linear**                  | Minimalism cực đoan, sidebar phẳng, keyboard-first, animation micro (150ms), typography sắc, **Command Palette Cmd+K** |
| **Vercel Dashboard**        | Dark accent hài hòa với light content, form clean, table density tốt                       |
| **Stripe Dashboard**        | Table dày dữ liệu vẫn dễ đọc, filter chip nhỏ gọn, docs quality                            |
| **Notion**                  | Content flexibility (dùng cho CMS module), slash command, multi-tab detail                 |
| **shadcn/ui**               | Component quality bar (accessible, composable, không opinion về style)                     |
| **cmdk** (Paco Coursey)     | Chuẩn command palette React — dùng bởi Linear/Vercel/Raycast                                |

### 2.2. Enterprise Layout Patterns — cho list-detail, dashboard, workflow

| Sản phẩm                    | Học điều gì                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **SAP Fiori Design System** | **Chuẩn vàng ERP**: Flexible Column Layout (1/2/3 cột list-detail), Object Page floorplan, Overview Page cards, Dynamic Page header, Filter Bar chuẩn |
| **Microsoft 365 Admin**     | Dense data grid, audit trail, RBAC UI, breadcrumb sâu, tenant management                   |
| **Microsoft Dynamics 365**  | Business process flow, form editor, quick view, timeline entity, related records            |
| **Atlassian (Jira/Confluence)** | Enterprise depth: workflow, permission scheme, big table, kanban board, approval routing |
| **Ant Design Pro v6**       | Dashboard templates Á Đông (Analysis/Monitor/Workplace), ProTable, ProForm, StepForm, blocks |
| **Odoo Enterprise**         | Master data flow, kanban with grouping, form với chatter (activity feed side panel)         |
| **Zoho One**                | CRM patterns, module switcher, unified search                                               |
| **Salesforce Lightning**    | Related lists, path/stage indicator, quick actions, split view                              |

### 2.3. Vietnamese ERP References — bối cảnh nghiệp vụ VN

| Sản phẩm                    | Học điều gì                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **Base.vn**                 | Task/Project VN-first, workflow linh hoạt, notification VN, UI cân bằng                    |
| **Misa AMIS**               | Accounting + HR flow, form kế toán dày, báo cáo chuẩn Việt Nam                             |
| **1Office**                 | HR + Task + CRM tích hợp, mobile-friendly, module switching                                 |
| **Fast Accounting / Bravo** | Chuẩn form kế toán/công nợ Việt Nam, biểu mẫu in ấn A4 chuẩn thuế/BHXH                     |
| **Haravan / Sapo**          | POS UI, warehouse/inventory VN                                                              |

### 2.4. Component Libraries có thể tham khảo (KHÔNG cài mới nếu chưa PR duyệt)

- **@radix-ui/react-*** — đã dùng (dialog, label, slot, select). Primitive gốc cho shadcn.
- **cmdk** — cần cài khi làm section 18 (Command Palette).
- **@tanstack/react-table** — nếu AppTable cần feature nâng cao (sort/resize/pin cột) sau này.
- **@dnd-kit/*** — cần cài khi làm Kanban drag-drop (section 20 Task module).
- **recharts** — đã dùng cho Dashboard charts.
- **date-fns/locale/vi** — đã có, dùng cho relative time VN.

### 2.5. Anti-pattern — TUYỆT ĐỐI không lấy cảm hứng từ

- Dribbble/Behance "creative dashboard" concept — 90% không production-ready.
- Hero-with-blob animation, glassmorphism, neumorphism.
- 3D card, tilt-on-hover, parallax scroll.
- Bootstrap Admin Templates rẻ tiền (ThemeForest-style) — outdated pattern.
- Dashboard "gamification" (badge XP, confetti, level up) — không phù hợp B2B nội bộ.

---

## 3. Design Tokens

> **Nguồn duy nhất:** `packages/erp/tailwind.config.js` + `packages/erp/src/index.css`. **Cấm** define token mới trong component (`style={{...}}`, `text-[#abc]`, `p-[13px]`).

### 3.1. Color System — mỗi màu 1 ý nghĩa (Color Emotion)

| Nhóm    | Ý nghĩa cảm xúc                          | Class Tailwind                                              |
| ------- | ---------------------------------------- | ----------------------------------------------------------- |
| **primary** (xanh lá `#22c55e`) | Hành động chủ đích, focus, chọn | `bg-primary-600` (hover: `700`), `text-primary-700`, `ring-primary-500` |
| **neutral** (xám) | Nội dung, cấu trúc, im lặng            | `text-neutral-900` (chính), `text-neutral-500` (phụ/muted), `bg-neutral-50` (page), `bg-neutral-100` (hover), `border-neutral-200` |
| **surface** | Bề mặt (card, modal, table row)        | `bg-surface` (= white), `bg-surface-secondary` (= neutral-50) |
| **border**  | Đường viền im lặng                     | `border-border` (mảnh 1px), `border-border-strong` (chỉ dùng khi thật cần nhấn) |
| **success** (xanh) | Thành công, đã duyệt, positive delta | `bg-success-light` + `text-success-dark` cho badge, `bg-success` cho toast |
| **warning** (cam) | Cảnh báo, chờ duyệt, sắp hết hạn     | `bg-warning-light` + `text-warning-dark`                    |
| **danger** (đỏ)   | Lỗi, xóa, đã hủy, quá hạn            | `bg-danger-light` + `text-danger-dark` cho badge, `bg-danger` cho nút destructive |
| **info** (xanh dương) | Trung tính, hint, log             | `bg-info-light` + `text-info-dark`                          |
| **sidebar** (dark green) | Chỉ dùng ở Sidebar/Nav dọc      | `bg-sidebar-bg`, `text-sidebar-text`, `bg-sidebar-active`   |

**Quy tắc:**
- Primary **chỉ** dùng cho action + focus. **Không** dùng làm background lớn (không có `bg-primary-500` trên 200px×200px).
- Danger **chỉ** cho destructive + error. Nút "Đóng modal" **không phải** danger.
- Cấm màu Tailwind raw: `bg-red-500`, `text-blue-600`, `bg-green-500`… → **sai**.
- Cấm hex trong JSX/CSS: `text-[#22c55e]`, `style={{color:'#abc'}}` → **sai**.

### 3.2. Typography Rules

**Font stack (1 font duy nhất):** Be Vietnam Pro — self-host qua `@fontsource/be-vietnam-pro`, nạp trong `packages/erp/src/fonts.ts`, khai báo ở `fontFamily.sans` (`packages/erp/tailwind.config.js`) và biến `--font-sans` (`packages/erp/src/index.css`).

**Scale nghiêm ngặt:**

| Class       | Size | Weight | Line-height  | Dùng cho                                    |
| ----------- | ---- | ------ | ------------ | ------------------------------------------- |
| `text-2xs`  | 10px | 500    | tight (1.2)  | Micro badge (hiếm dùng)                     |
| `text-xs`   | 12px | 500    | tight (1.4)  | Caption, timestamp, table header uppercase, helper text, error message |
| `text-sm`   | 14px | 400    | normal (1.5) | **Body mặc định** (table cell, form input, sidebar item) |
| `text-base` | 16px | 400    | normal (1.5) | Paragraph, đoạn văn dài                     |
| `text-lg`   | 18px | 600    | snug (1.4)   | Card title, section heading nhỏ             |
| `text-xl`   | 20px | 700    | snug (1.3)   | **Page title** (`<h1>`)                     |
| `text-2xl`  | 24px | 700    | tight (1.2)  | KPI number nhỏ                              |
| `text-3xl`  | 30px | 700    | tight (1.2)  | KPI number lớn (dashboard hero)             |

**Weight scale (chỉ 4 mức):** 400 (regular body), 500 (medium/label), 600 (semibold/heading), 700 (bold/title). **Không** dùng 300/800/900.

**Truncation:** Text >200 chars trong table cell → `truncate` + `title={fullText}` để tooltip hiện full. Không tự xuống dòng làm hỏng row height.

**Number alignment:** Cột số trong table dùng `tabular-nums` + `text-right` để số thẳng cột.

### 3.3. Spacing Philosophy — 4px base grid

```
0.5=2px  1=4  2=8  3=12  4=16  5=20  6=24  8=32  10=40  12=48  16=64  20=80  24=96
```

**Cấm** ad-hoc: `p-[13px]`, `mt-[22px]`, `gap-[5px]`. Nếu con số cần **không có trong scale** → **suy nghĩ lại** vì bạn đang "vẽ mắt" chứ không thiết kế.

**Ứng dụng cố định:**

| Trường hợp                       | Class                          |
| -------------------------------- | ------------------------------ |
| Padding trong Card               | `p-6` (24px)                   |
| Padding trong Modal content      | `p-6`                          |
| Padding trong Table cell         | `px-4 py-3` (16/12)            |
| Padding trong Button (default)   | `px-4 py-2`                    |
| Gap giữa các Card trong Section  | `gap-4` (16px) hoặc `gap-6`    |
| Gap giữa các Section trên Page   | `space-y-6` (mobile) → `md:space-y-8` |
| Gap giữa Field trong Form        | `space-y-4` (16px)             |
| Gap Label → Input                | `space-y-1.5` (6px)            |
| Gap Input → Error                | `space-y-1` (4px)              |
| Padding container Page           | `px-4 md:px-6 lg:px-8`         |
| Sidebar item padding             | `px-3 py-2.5`                  |

**Nguyên tắc "White Space is a Feature":**
- KHÔNG co spacing lại để "vừa 1 màn hình". Cho phép scroll dọc.
- Ưu tiên **thêm** spacing nếu không chắc.
- Section tách nhau bằng SPACING, KHÔNG bằng divider line (trừ khi thật cần).

### 3.4. Border, Radius, Shadow

**Border:**
- Mặc định `border border-neutral-200` (1px, im lặng).
- **KHÔNG** dùng `border-2` (trừ focus ring: `focus-visible:ring-2`).
- Divider ngang: `border-t border-neutral-200`. Divider dọc: hạn chế tối đa.

**Radius (đồng nhất):**
- `rounded-md` (6px) — input, button.
- `rounded-lg` (8px) — dropdown, popover, badge lớn.
- `rounded-xl` (12px) — card, modal.
- `rounded-full` — badge pill, avatar.
- **Không** dùng `rounded-2xl`, `rounded-3xl` (quá tròn, không enterprise).

**Shadow (chỉ 2 mức nhẹ):**
- `shadow-sm` — card ở trạng thái nghỉ (mặc định).
- `shadow-card-md` — dropdown, popover, modal (chỉ khi float trên nội dung khác).
- **Cấm** `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- **Cấm** custom shadow màu (`shadow-primary`, `shadow-blue-500`...) trong dashboard (chỉ landing dùng).

### 3.5. Motion Guideline

**Duration:**
- `duration-150` (150ms) — hover state, micro transition (nút, link).
- `duration-200` (200ms) — mặc định (dropdown, popover open).
- `duration-300` (300ms) — chỉ dùng cho layout shift lớn (drawer, modal slide).
- **Cấm** >300ms.

**Easing:** `ease-out` cho enter, `ease-in` cho exit, `ease-in-out` cho state change.

**Được phép:**
- Opacity fade (fade-in/out modal, tooltip).
- Slight scale (0.95 → 1) cho modal open.
- Height auto cho accordion.
- Skeleton pulse (chu kỳ 1.5s).

**Cấm:**
- Parallax scroll.
- Auto-play carousel/marquee.
- Confetti, particle, cursor trail.
- Bounce, elastic easing (`ease-elastic`).
- Icon glow pulse liên tục.
- Hover scale >1.02.
- GSAP timeline dài, ScrollTrigger.

**Nguyên tắc:** User làm việc 8h/ngày. Mỗi animation lặp lại 200 lần/ngày. **Chỉ giữ animation nếu nó THÔNG BÁO một thay đổi trạng thái**, không phải "cho đẹp".

---

## 4. Grid System & Layout

**Container tối đa:** `max-w-[1440px] mx-auto` cho page nội dung. Sidebar + main = full-width.

**Column grid:** 12 columns với `gap-6` (24px). Dùng CSS Grid hoặc Flexbox tùy tình huống.

**Breakpoints (Tailwind default):**

| Prefix | Min width | Dùng cho          |
| ------ | --------- | ----------------- |
| (base) | 0px       | Mobile portrait   |
| `sm:`  | 640px     | Mobile landscape  |
| `md:`  | 768px     | Tablet            |
| `lg:`  | 1024px    | Laptop nhỏ        |
| `xl:`  | 1280px    | Desktop           |
| `2xl:` | 1536px    | Desktop lớn       |

**Layout Frame:**
```
┌──────────────────────────────────────────┐
│ Sidebar (260px)   │ Header (60px sticky) │
│                   ├──────────────────────┤
│                   │                      │
│                   │  Main content        │
│  Nav items        │  max-w-[1440px]      │
│                   │  px-4 md:px-6 lg:px-8│
│                   │                      │
└──────────────────────────────────────────┘
```

**Kích thước cố định (đã có trong `index.css`):**
- `--sidebar-width: 260px`
- `--sidebar-collapsed-width: 72px`
- `--header-height: 60px`

---

## 5. Icon Standard

**Icon library duy nhất: `lucide-react`.** Không mix Heroicons, Material Icons, Font Awesome, Tabler…

**Size (chỉ 4 mức):**

| Size  | Dùng cho                                    |
| ----- | ------------------------------------------- |
| 14px  | Inline trong text nhỏ (chip, badge)         |
| 16px  | Inline trong text mặc định, button size sm  |
| 18px  | Button size default, form icon              |
| 20px  | Sidebar nav, table action                   |
| 24px  | Page header, modal icon                     |

**Stroke width:** `strokeWidth={1.5}` mặc định. `strokeWidth={2}` chỉ cho emphasis (active nav, alert icon trong ErrorState).

**Color:**
- Mặc định: kế thừa từ text (`currentColor`), thường `text-neutral-500`.
- Active/hover: `text-neutral-900` hoặc `text-primary-600`.
- Danger: `text-danger`.
- Icon-only button PHẢI có `title="..."` (tooltip) hoặc `aria-label`.

**Ví dụ:**
```tsx
<Button variant="ghost" size="icon" title="Xóa">
  <Trash2 size={18} className="text-danger" strokeWidth={1.5} />
</Button>
```

---

## 6. Component Specifications

Import từ `@frezo/ui` (đã có sẵn — **KHÔNG viết mới**):

`Button` `Input` `Label` `Switch` `Select` `MultiSelect` `Skeleton` `SkeletonText` `SkeletonCircle` `SkeletonTable` `EmptyState` `ErrorState` `PageHeader` `FormField` `AppModal` `ConfirmDialog` `Table*`

Import từ `@/components/shared`: `AppForm` (RHF + Zod)
Import từ `@/components/ui/AppTable`: `AppTable` (siêu component: pagination + filter + search + empty)
Import từ `@/lib/toast`: `toast` (có `toast.apiError(err, fallback)`)

### 6.1. Card

**Base:**
```tsx
<div className="bg-surface border border-neutral-200 rounded-xl p-6">
  {children}
</div>
```

Hoặc dùng helper `.card` (đã có trong `index.css`).

**Rules:**
- Padding chuẩn: `p-6` (24px). Card nhỏ: `p-4`.
- Border 1px `border-neutral-200`. **Không** border màu.
- **Không** shadow ở trạng thái nghỉ. Chỉ `hover:shadow-sm` nếu card clickable.
- Header trong card: `<h3 className="text-lg font-semibold text-neutral-900 mb-4">Title</h3>` — không cần divider dưới heading (dùng margin thay).
- KPI card: title trên (`text-xs uppercase tracking-wider text-neutral-500`), số dưới (`text-2xl font-bold text-neutral-900`), delta (`text-xs text-success/danger`).

### 6.2. Button

**Chỉ 3 variant chính:**

| variant       | Khi nào dùng                                                          |
| ------------- | --------------------------------------------------------------------- |
| `default`     | **Primary action** — Save, Submit, Create. Mỗi màn hình chỉ 1 nút này |
| `outline`     | Nút phụ — Cancel, Back, Close                                          |
| `destructive` | Xóa, hủy hợp đồng, hành động không hoàn tác                            |
| `ghost`       | Chỉ dùng trong action cell của table (icon + tooltip)                  |
| `link`        | Trong text đoạn văn                                                    |

**Sizes:** `sm` (h-9), `default` (h-10), `lg` (h-11), `icon` (10×10).

**Trạng thái loading (mutation):**
```tsx
<Button disabled={mutation.isPending}>
  {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
  {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
</Button>
```

**KHÔNG:**
- ❌ `className="bg-blue-500"` — luôn dùng `variant`.
- ❌ Nhiều nút Primary trên 1 màn hình.
- ❌ Button text quá dài (>3 từ). Nếu cần dài → thêm tooltip icon `?`.

### 6.3. Input & Form UX

**Layout chuẩn cho 1 field:**

```
Label (text-sm font-medium text-neutral-700)
   ↓ 6px (space-y-1.5)
Input (h-10, border-neutral-200, focus:ring-2 focus:ring-primary-500)
   ↓ 4px (space-y-1)
Helper text (text-xs text-neutral-500) hoặc Error (text-xs text-danger)
```

Dùng `FormField` primitive:
```tsx
<FormField
  label="Tên khách hàng"
  htmlFor="name"
  required
  error={errors.name?.message}
  hint="Tên hiển thị công khai trên hóa đơn"
>
  <Input id="name" {...register('name')} />
</FormField>
```

**Rules:**
- Label **luôn** trên input. **Không** đặt bên trái.
- Required marker: `*` màu `text-danger`, sau label.
- Placeholder **không được** thay thế label.
- Focus ring: `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`. **KHÔNG** tắt outline mặc định.
- Height input mặc định `h-10` (40px). Compact form dùng `h-9`.
- **Validate**: on **blur** (không on change → tránh noisy). Zod schema qua `zodResolver`.
- Error hiển thị dưới field, KHÔNG dùng `alert()`.
- Gap giữa các field: `space-y-4` (16px).
- Gap giữa các form section: `space-y-8` (32px).

**Submit button positioning:**
```
[Cancel — outline]  [Save — default]
        └── canh phải, khoảng cách gap-2
```

**Disable state:** Submit disable khi `isSubmitting || !isDirty || !isValid`.

### 6.4. Table Enterprise Specs

**Dùng `AppTable`** — đã có sẵn 474 dòng lo:
- Header sticky
- Row hover `bg-neutral-50` (không đổi màu chữ)
- Pagination (page size selector + tổng)
- Search + filter động
- Loading skeleton
- Empty state (dùng EmptyState nếu cần custom)

**Column specs khi khai báo:**
```tsx
const columns: AppTableColumn<Contract>[] = [
  { title: 'Mã HĐ',     dataIndex: 'code',      width: 120 },
  { title: 'Khách hàng', dataIndex: 'customer', filterType: 'text' },
  { title: 'Giá trị',    dataIndex: 'value',    align: 'right',
    render: (v) => <span className="tabular-nums">{formatCurrency(v)}</span> },
  { title: 'Trạng thái', dataIndex: 'status',   filterType: 'select',
    filterOptions: STATUS_OPTIONS,
    render: (s) => <StatusBadge status={s} /> },
  { title: 'Thao tác',  key: '__actions', align: 'right', width: 100,
    render: (_, row) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title="Xem" onClick={() => onView(row)}>
          <Eye size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Sửa" onClick={() => onEdit(row)}>
          <Pencil size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="Xóa" onClick={() => onDelete(row)}>
          <Trash2 size={18} className="text-danger" />
        </Button>
      </div>
    ),
  },
]
```

**Rules:**
- Số căn phải, dùng `tabular-nums` để số thẳng cột.
- Action cột luôn ở **cuối cùng**, icon-only + tooltip.
- Sort icon: `ChevronsUpDown` (default), `ChevronUp` (asc), `ChevronDown` (desc).
- Row click mở detail: cursor-pointer + `onClick` trên `<tr>`. Row không click: cursor-default.
- Density option (nếu module nhiều data): compact (h-9), comfortable (h-12 — default), spacious (h-14).
- Column visibility: dropdown gear icon ở top-right của table cho phép ẩn/hiện cột (nếu module >6 cột).
- Bulk action bar: khi có row selected, hiện bar float bottom với action (Xóa hàng loạt, Export chọn...).
- **Export**: dropdown "Xuất" (CSV, Excel) — mọi list quan trọng đều phải có.

**Mobile (<768px):** ẩn cột phụ bằng `hidden md:table-cell`. Nếu bảng >4 cột quan trọng → chuyển sang card list.

### 6.5. Modal / Dialog

**`AppModal`** cho form/nội dung. **`ConfirmDialog`** cho xác nhận đơn giản.

**Rules:**
- **Title rõ hành động**: "Xóa hợp đồng #HD-001?" — không "Xác nhận".
- Description (optional) giải thích hậu quả.
- Max width: `max-w-md` (form nhỏ), `max-w-2xl` (form thường), `max-w-4xl` (form phức tạp).
- Đóng bằng: nút X, click backdrop, phím `Escape` (Radix Dialog tự lo).
- Nút destructive (Xóa) với action không hoàn tác quan trọng → require gõ tên/mã để confirm (Github-style):
```tsx
<Input placeholder='Gõ "XÓA" để xác nhận' />
<Button variant="destructive" disabled={typed !== 'XÓA'}>Xóa vĩnh viễn</Button>
```

### 6.6. Toast & Notifications

**Dùng `sonner` qua wrapper `@/lib/toast`.** Toaster đã setup ở `providers.tsx` (position `top-right`, richColors, font theo `--font-sans`).

```tsx
import { toast } from '@/lib/toast'

toast.success('Đã lưu hợp đồng')
toast.error('Không tìm thấy khách hàng')
toast.apiError(err, 'Lỗi khi tạo hóa đơn') // auto extract err.response.data.message
```

**Rules:**
- Duration: 3s success, 5s error (auto).
- **Không** dùng `alert()`, `confirm()`, `prompt()` (native browser).
- 1 toast tại 1 thời điểm, mới xếp chồng dưới. Không spam.
- Toast có action (Undo) — xem [section 8](#8-enterprise-crud-requirements).

### 6.7. Empty State

Dùng `EmptyState` primitive:
```tsx
<EmptyState
  icon={<FileText size={32} />}
  title="Chưa có hợp đồng nào"
  description="Bắt đầu bằng cách tạo hợp đồng đầu tiên cho khách hàng này."
  action={{ label: 'Tạo hợp đồng', onClick: onCreate }}
/>
```

**Rules:**
- Icon **mono** (không màu), size 32-48px, stroke-1.5, trong hình tròn `bg-neutral-100 text-neutral-400`.
- Title 16px semibold `text-neutral-900`.
- Description 14px `text-neutral-500`, max-width 380px, câu **giải thích hành động** tiếp theo (không chỉ "Không có data").
- CTA button `variant="default"` — 1 hành động rõ ràng nhất.
- **KHÔNG** dùng illustration màu, mascot, animation.

### 6.8. Error State

Dùng `ErrorState`:
```tsx
<ErrorState
  message={extractApiErrorMessage(error, 'Không thể tải danh sách hợp đồng')}
  onRetry={refetch}
  isRetrying={isRefetching}
/>
```

**Rules:**
- Icon `AlertCircle` trong nền `bg-danger-light text-danger-dark`.
- Message: **map từ i18n key của AppException**, không show raw stack trace.
- Luôn có nút "Thử lại" nếu error retry được.

### 6.9. Loading Skeleton

**Rules:**
- Skeleton phải **match layout thật** (khung, số dòng, số cột giống nhau).
- **Không** dùng 1 hình chữ nhật to `<Skeleton className="h-96 w-full" />`.
- Table loading → `<SkeletonTable rows={5} cols={4} />`.
- Text loading → `<SkeletonText width="60%" />`.
- Avatar → `<SkeletonCircle size={40} />`.
- Spinner (`Loader2`) chỉ dùng khi thao tác **<500ms** (button loading, small action). Loading page/section → skeleton.

### 6.10. Navigation

**Sidebar:**
- 260px expand / 72px collapse. Nhớ state qua localStorage.
- Section header: `text-xs uppercase tracking-wider text-neutral-400 px-3 py-2 mt-4`.
- Item: `<Icon 20 />` + label 14px medium, `px-3 py-2.5 rounded-lg`.
- Active state: 1 item duy nhất `bg-sidebar-active text-sidebar-text-active`.
- Hover: `bg-sidebar-hover`. Không animation.
- Nested item indent 12px thêm.

**Breadcrumb:**
- Max 4 levels, cắt giữa bằng `...` nếu quá.
- Level cuối là trang hiện tại, không click, `text-neutral-500`.
- Separator: `<ChevronRight size={14} className="text-neutral-300" />`.

**Tab (trong page):**
- Underline style, không pill/box.
- Active tab: `border-b-2 border-primary-600 text-neutral-900`.
- Hover: `text-neutral-700`.

---

## 7. Dashboard Layout Structure

Mọi dashboard trang chính (Home, Overview, Analytics) đều theo trình tự cố định:

```
┌─────────────────────────────────────────────┐
│ 1. PageHeader                               │
│   title + description + [Primary Action]    │
├─────────────────────────────────────────────┤
│ 2. Quick Actions (3-5 shortcut cards)       │
│   Grid 3 cols mobile / 5 cols desktop       │
├─────────────────────────────────────────────┤
│ 3. Statistics (KPI cards)                   │
│   Grid 2 cols mobile / 4 cols desktop       │
│   Mỗi card: label + số + delta % (so kỳ trước)│
├─────────────────────────────────────────────┤
│ 4. Charts                                   │
│   Grid 1 col mobile / 2 cols desktop        │
│   Recharts với color primary / neutral      │
├─────────────────────────────────────────────┤
│ 5. Recent Activity (feed)                   │
│   List dạng dòng với icon + text + timestamp│
├─────────────────────────────────────────────┤
│ 6. Table (danh sách chính)                  │
│   Dùng AppTable                             │
└─────────────────────────────────────────────┘
```

**Section gap:** `space-y-6` (mobile) → `md:space-y-8` (desktop).

---

## 8. Enterprise CRUD Requirements

**Mọi thao tác CRUD (Create/Read/Update/Delete)** bắt buộc lo đủ **10 khía cạnh**:

| # | Khía cạnh    | Yêu cầu                                                                                  |
| - | ------------ | ---------------------------------------------------------------------------------------- |
| 1 | **Loading**  | Skeleton khi read, spinner trong Button khi mutate                                       |
| 2 | **Empty**    | `EmptyState` khi list rỗng                                                                |
| 3 | **Error**    | `ErrorState` với `onRetry` khi read fail; `toast.apiError()` khi mutate fail            |
| 4 | **Success**  | `toast.success('Đã ...')` sau mutate                                                     |
| 5 | **Confirm**  | `ConfirmDialog` cho destructive (delete). Require typed confirmation nếu không hoàn tác |
| 6 | **Undo**     | Non-destructive action (archive, hide, mark done) → toast với `action: { label: 'Hoàn tác', onClick }` giữ 5s |
| 7 | **Permission** | Check `hasPermission('CONTRACT.DELETE')` trước khi render button. Handle 403 → `toast.error('Bạn không có quyền')` |
| 8 | **Audit**    | **Backend tự log** qua module `qtht/audit-logs` — FE không cần gọi. Chỉ dùng `auditLogApi.getAll()` khi cần **hiển thị** lịch sử audit trong UI (module Audit trail) |
| 9 | **Retry**    | Read fail: nút "Thử lại" trong ErrorState. Mutation fail: giữ form input, cho user retry mà không nhập lại |
| 10 | **Optimistic UI (nếu applicable)** | React Query `optimisticUpdate` cho action nhanh (toggle switch, mark done)      |

**Ví dụ Undo pattern:**
```tsx
const archiveMutation = useMutation({
  mutationFn: (id) => contractApi.archive(id),
  onSuccess: (_, id) => {
    toast.success('Đã lưu trữ hợp đồng', {
      duration: 5000,
      action: {
        label: 'Hoàn tác',
        onClick: () => unarchiveMutation.mutate(id),
      },
    })
  },
  onError: (err) => toast.apiError(err, 'Không thể lưu trữ'),
})
```

---

## 9. Coding Standards

### 9.1. Priorities (khi có xung đột, chọn cái trước)

1. **Readability** — code là để người đọc, không phải máy chạy.
2. **Maintainability** — đổi 1 chỗ, không phải đổi 10 chỗ.
3. **Reusable Component** — dùng lại `@frezo/ui`, `@/components/shared`.
4. **Accessibility (a11y)** — keyboard nav, aria label, contrast AA.
5. **Responsive** — mobile-first, breakpoint chuẩn.
6. **Performance** — memo/callback khi có bằng chứng chậm, không premature.

### 9.2. Forbidden Patterns

**Cấm tuyệt đối trong code mới:**

| ❌ Cấm                                | ✅ Thay bằng                                                          |
| ------------------------------------ | -------------------------------------------------------------------- |
| `any` type                           | `unknown` + type guard, hoặc type cụ thể                            |
| `console.log/warn/error`             | Xóa trước khi commit. Cần debug: dùng React DevTools + Network tab.  |
| `// eslint-disable-...`              | Fix root cause. Chỉ disable khi có comment giải thích rõ và PR review đồng ý |
| `// TODO`, `// FIXME`                | Tạo Github issue, link trong comment nếu buộc phải để lại            |
| Hardcode text tiếng Việt/Anh         | Dùng i18n key (nếu app đa ngôn ngữ) hoặc `const MESSAGES = {...}`    |
| Hardcode số magic (`if (retry > 3)`) | `const MAX_RETRY = 3`                                                |
| Fake data / mock inline              | Data thật từ API, hoặc `msw` mock cho dev                            |
| Code demo / dead code                | Xóa. Nếu cần tham khảo: git history                                  |
| **Nested ternary >2 tầng**           | `if/else` hoặc extract function                                      |
| **`useEffect` lồng nhau** (setState trong useEffect trigger effect khác) | React Query, hoặc `useMemo`, hoặc refactor state       |
| **Prop drilling >3 tầng**            | Context / Zustand store                                              |
| Inline function trong render (list >10 items) | `useCallback`                                              |
| Anonymous component ở render (`{items.map(i => <div>{i}</div>)}`) OK, nhưng logic phức tạp → extract `<ItemRow />` |
| String hardcode lặp lại              | Extract `const`, hoặc enum                                           |
| Duplicated JSX (>10 dòng lặp 2 lần)  | Extract component                                                    |

**Bad example:**
```tsx
// ❌ any + console + nested ternary + magic number
const handleSubmit = async (data: any) => {
  console.log('submitting', data)
  const status = data.type === 'A' ? (data.value > 100 ? 'high' : 'low') : (data.value > 50 ? 'medium' : 'low')
  await axios.post('/api/contract', { ...data, status, retries: 3 })
}
```

**Good example:**
```tsx
const MAX_RETRIES = 3

function computeStatus(type: ContractType, value: number): ContractStatus {
  if (type === 'A') return value > 100 ? 'high' : 'low'
  return value > 50 ? 'medium' : 'low'
}

const handleSubmit = async (data: ContractFormValues) => {
  const status = computeStatus(data.type, data.value)
  await contractApi.create({ ...data, status, retries: MAX_RETRIES })
}
```

### 9.3. File Structure (chuẩn cho mỗi module)

```
packages/erp/src/modules/<domain>/
├── constants/          # Enum, magic values as `const OBJECT = {...} as const`
│   └── index.ts
├── types/              # TypeScript interfaces/types của domain
│   └── contract.ts
├── services/           # API layer (Axios), 1 file / entity
│   └── contractApi.ts
├── hooks/              # useContracts(), useCreateContract() — business logic React Query
│   ├── useContracts.ts
│   └── useCreateContract.ts
├── components/         # Presentational + module-only
│   ├── ContractStatusBadge.tsx
│   ├── ContractForm.tsx
│   └── ContractDetailPanel.tsx
├── pages/              # Route-level components (mounted trong router)
│   ├── ContractListPage.tsx
│   ├── ContractDetailPage.tsx
│   └── ContractCreatePage.tsx
└── index.ts            # Public exports (nếu module cần export ra ngoài)
```

**Rules:**
- Component **route-level** (page) chỉ compose, **không** chứa business logic.
- Business logic vào `hooks/`.
- API call vào `services/`, không gọi axios trong component.
- Không import chéo giữa modules (`modules/contracts` KHÔNG import từ `modules/users` — nếu cần data user, gọi qua `usersApi` chung ở `lib/`).
- Shared cross-module: `packages/erp/src/components/shared/` hoặc `@frezo/ui`.

---

## 10. RBAC & Permission Display

**Nguyên tắc:** UI phản ánh permission của user — user không thấy thứ họ không dùng được.

- Nút / menu / route mà user **không có quyền** → **ẩn hẳn** (`return null`), không hiện rồi disable.
- Với action nhạy cảm (Xóa, Duyệt, Xuất data): check ở FE + handle `403` từ Gateway.

**Hook chuẩn (đã có sẵn tại `@/lib/hooks/usePermission`):**

```tsx
import { usePermission, useAnyPermission, useAllPermissions, hasPermission } from '@/lib/hooks/usePermission'

// 1 quyền
const canDelete = usePermission('CONTRACT.DELETE')
{canDelete && <Button variant="destructive" onClick={onDelete}>Xóa</Button>}

// Bất kỳ 1 trong nhiều quyền (OR)
const canManage = useAnyPermission(['CONTRACT.EDIT', 'CONTRACT.APPROVE'])

// Tất cả các quyền (AND)
const canFullyManage = useAllPermissions(['CONTRACT.EDIT', 'CONTRACT.DELETE'])

// Không phải hook — dùng trong plain function / event handler / axios interceptor
if (hasPermission('REPORT.EXPORT')) { ... }
```

**Convention mã permission:** `<DOMAIN>.<ACTION>` — vd `USER.CREATE`, `CONTRACT.APPROVE`, `REPORT.EXPORT`.
User có `isAdmin=true` **tự động** bypass mọi check.

**403 handler đã có sẵn tại `axiosClient.ts`** — tự động show toast "Bạn không có quyền..." cho mọi request bị 403. Nếu muốn tắt cho request cụ thể (vd probe quyền, không muốn UI noisy):

```ts
axiosClient.get('/api/probe', { skipForbiddenToast: true })
```

---

## 11. Responsive & Accessibility

### 11.1. Responsive

- **Mobile-first**: viết class base (mobile), thêm `md:` `lg:` cho desktop.
- Breakpoint: xem [section 4](#4-grid-system--layout).
- Table >4 cột: ẩn cột phụ `hidden md:table-cell`, hoặc chuyển card list.
- Form >3 field ngang: mobile stack dọc (`grid-cols-1 md:grid-cols-2`).
- Modal: `max-w-full mx-4 md:max-w-md md:mx-auto`.

### 11.2. Accessibility (WCAG AA)

- Mọi input có `<label htmlFor={id}>` (dùng `FormField`).
- Icon-only button có `title` + `aria-label`.
- Contrast tối thiểu: text 4.5:1, UI 3:1 (`text-neutral-500` trên `bg-white` là biên, không dùng `text-neutral-400` cho text quan trọng).
- Focus visible: **không tắt** `outline`. Dùng `focus-visible:ring-2 focus-visible:ring-primary-500`.
- Keyboard nav: mọi action đều `Tab` được, `Enter/Space` kích hoạt, `Escape` đóng modal.
- Semantic HTML: `<button>` cho action, `<a>` cho navigation. Không `<div onClick>`.
- ARIA role cho state: `role="status"` cho EmptyState, `role="alert"` cho ErrorState/toast.

---

## 12. Self-Review Checklist

> Sau khi code xong, AI **PHẢI** tự chạy checklist này và **liệt kê** phần nào chưa đạt (đừng im lặng cho qua). Nếu vi phạm bất kỳ điểm nào → **sửa lại** trước khi trả kết quả.

### 12.1. Design & Visual (mục 1–5)

- [ ] Không gradient, không glass, không shadow >`shadow-card-md`
- [ ] Không animation dư thừa (parallax, auto-carousel, bounce, glow pulse)
- [ ] Chỉ dùng semantic token (`bg-primary-*`, `bg-danger`, `text-neutral-*`), không `bg-red-*`/`bg-blue-*`/hex raw
- [ ] Chỉ font Be Vietnam Pro, không mix
- [ ] Padding/margin theo thang 4px, không `p-[13px]`
- [ ] Border 1px `border-neutral-200`, không `border-2` (trừ focus ring)
- [ ] Icon **chỉ** Lucide, size ∈ {14,16,18,20,24}, strokeWidth 1.5

### 12.2. Component (mục 6)

- [ ] Tái sử dụng `@frezo/ui`, `AppTable`, `AppForm`, `AppModal`, `ConfirmDialog` — không viết mới
- [ ] Card: `p-6`, border 1px, không shadow ở nghỉ
- [ ] 1 nút `variant="default"` duy nhất trên 1 màn hình
- [ ] Form: dùng `FormField`, label trên input, error dưới field bằng `text-danger`
- [ ] Table: dùng `AppTable`, số căn phải + `tabular-nums`, action ở cột cuối icon+tooltip
- [ ] Modal title rõ hành động ("Xóa hợp đồng #HD-001?"), destructive quan trọng có typed confirmation
- [ ] Toast qua `@/lib/toast`, không `alert()`/`confirm()`
- [ ] Skeleton match layout thật, không hình chữ nhật to

### 12.3. Enterprise CRUD (mục 8)

- [ ] Đủ 4 state cho mọi API: loading (Skeleton), empty (EmptyState), error (ErrorState + retry), success (toast)
- [ ] Destructive action có ConfirmDialog
- [ ] Non-destructive (archive, mark done) có Undo trong toast 5s
- [ ] Check permission trước khi render nút bằng `usePermission()` (ẩn hẳn, không disable)
- [ ] Handle 403: đã có auto qua `axiosClient` — nếu cần opt-out dùng `skipForbiddenToast: true`
- [ ] Audit: **BE tự log**, FE không cần code. Chỉ dùng `auditLogApi.getAll()` khi hiển thị lịch sử.

### 12.4. Coding (mục 9)

- [ ] Không `any`, không `console.log`, không `eslint-disable`, không TODO/FIXME
- [ ] Không nested ternary >2 tầng, không useEffect lồng
- [ ] Không prop drilling >3 tầng (dùng context/store)
- [ ] Không magic number, không string hardcode lặp
- [ ] Không duplicated JSX >10 dòng (extract component)
- [ ] File structure module đúng: `pages/`, `components/`, `hooks/`, `services/`, `types/`, `constants/`
- [ ] Không import chéo giữa modules

### 12.5. Responsive & A11y (mục 11)

- [ ] Đã test mental ở breakpoint `<768px` (bảng chuyển card, form 1 cột)
- [ ] Input có `id` + `<label htmlFor>` (qua FormField)
- [ ] Icon-only button có `title`
- [ ] Contrast AA (không `text-neutral-400` cho text quan trọng)
- [ ] `Escape` đóng modal, `Tab` navigate được

---

## 13. Prompt Templates

### 13.1. Cho AI code màn hình mới

```
Code màn hình [TÊN MÀN HÌNH] trong module [TÊN MODULE] cho Frezo ERP.
Tuân thủ nghiêm ngặt FE_UI_UX_STANDARD.md:

- ĐỌC section 1 (Design Philosophy) — nắm 7 nguyên tắc + danh sách cấm.
- Layout theo Dashboard Structure section 7 (nếu là dashboard).
- Dùng lại component @frezo/ui + AppTable + AppForm — KHÔNG viết mới.
- Design token: chỉ semantic Tailwind (bg-primary-*/bg-danger/text-neutral-*),
  không raw color, không hex, không ad-hoc spacing.
- Icon: chỉ Lucide, size ∈ {14,16,18,20,24}, strokeWidth 1.5.
- Đủ Enterprise CRUD (section 8): loading, empty, error+retry, success toast,
  confirm destructive, permission check, undo non-destructive.
- Coding: no any, no console.log, no nested ternary, no magic number,
  no hardcode text lặp. File structure theo section 9.3.
- Sau khi code xong, tự chạy Checklist section 12 và LIỆT KÊ phần nào chưa đạt.
```

### 13.2. Cho AI refactor màn hình cũ

```
Refactor file [PATH] để tuân thủ FE_UI_UX_STANDARD.md.
Ưu tiên fix theo thứ tự:
1. Design token vi phạm (bg-red-*, hex, ad-hoc spacing) → semantic token
2. Component tự chế → dùng lại @frezo/ui
3. Thiếu Enterprise CRUD state (empty/error/undo/confirm) → bổ sung
4. Code smell (any, console, nested ternary) → clean

KHÔNG đổi logic business, KHÔNG rename export public.
Liệt kê rõ các thay đổi vào cuối câu trả lời.
```

### 13.3. Cho AI review PR

```
Review file [PATH] theo Checklist section 12 của FE_UI_UX_STANDARD.md.
Trả lời ở dạng bảng: [Item] | [Pass/Fail] | [Ghi chú fix nếu Fail].
```

---

# Phần D — Enterprise Patterns

> **Bối cảnh:** Frezo có 12 module BE với nghiệp vụ đặc thù (Contract 14 state với luồng OP/RV, GIN batch confirm, Payroll payslip PDF, Customer phone encrypted, AI actions, Article approval flow...). Phần này định nghĩa các **UI pattern chuyên sâu** cho enterprise ERP thật, tham chiếu **SAP Fiori Design System** (chuẩn cao nhất), **Ant Design Pro v6**, **Linear/Vercel** (interaction).

---

## 14. Advanced List & Detail Patterns

### 14.1. Flexible Column Layout (SAP Fiori-inspired)

Cho các module master-detail phức tạp (Contract, Customer, Product, Employee, Ticket), dùng layout **1/2/3 column** thay vì navigate full-page.

**3 chế độ:**

| Mode           | Khi nào                                     | Layout                                      |
| -------------- | ------------------------------------------- | ------------------------------------------- |
| **1-column**   | Mobile / khi user muốn full list            | `[List (full)]`                             |
| **2-column**   | User chọn 1 item để xem detail (mặc định)   | `[List 40%]` `[Detail 60%]`                 |
| **3-column**   | Detail có nested list (VD Contract → Version) | `[List 25%]` `[Detail 40%]` `[Sub-detail 35%]` |

**Rules:**
- Cột phải nhất luôn có nút `Fullscreen` (icon `Maximize2`) — click để expand cột đó chiếm 100%.
- Cột được chọn (focus) có `border-l-2 border-primary-500`.
- Route sync: URL phản ánh selected item — `/contracts?selected=HD-001&tab=versions`.
- Deep-link phải render đúng state ban đầu.
- Mobile (<768px): tự collapse về 1-column, click item → route push detail page.

**Ứng dụng cho Frezo:**
- **Contract** (`/qlns/contract`): list + detail (14 state) + version history sub-panel
- **Customer** (`/customer`): list + detail + payment history sub-panel
- **Employee (Person)** (`/qlns/person`): list + detail + dependents sub-panel
- **Ticket** (`/task/ticket`): list + detail + comments sub-panel

Component wrapper cần tạo (khi module đầu tiên cần): `<FlexibleColumnLayout beginColumn={<List />} midColumn={<Detail />} endColumn={<SubDetail />} />`.

### 14.2. Object Page (Detail Layout Chuẩn)

Mọi trang detail 1 entity (Contract detail, Customer detail...) đều theo cấu trúc SAP Fiori Object Page:

```
┌─────────────────────────────────────────────────────┐
│ 1. Object Header (sticky top khi scroll)            │
│    • Breadcrumb (Contracts / HD-001)                 │
│    • Title (Mã: HD-001) + Subtitle (Tên khách hàng)  │
│    • Status Badge nổi bật (VD: "Đang xử lý")         │
│    • KPI nhỏ: Giá trị, Ngày ký, Người phụ trách       │
│    • Actions bên phải: [Sửa] [Duyệt] [Xóa] [...]     │
├─────────────────────────────────────────────────────┤
│ 2. Content — Tabs / Sections                        │
│    [ Tổng quan | Điều khoản | Version | Attachment |│
│      Hoạt động ]                                     │
│    ─── active tab underline ───                      │
│                                                     │
│    (Nội dung tab)                                    │
├─────────────────────────────────────────────────────┤
│ 3. Footer (optional) — chỉ khi có action floating    │
│    [Hủy]  [Lưu nháp]  [Gửi duyệt]                    │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- **Object Header sticky** khi scroll — user luôn thấy title + actions.
- **Status Badge**: 1 badge lớn (`text-sm px-3 py-1`) gần title, dùng token theo status (xem [15.1](#151-status-badge-system)).
- **KPI nhỏ**: 3-5 field key-value, layout `<dl>` với `dt` (label 12px muted) trên `dd` (value 14px medium).
- **Actions**: Primary bên phải nhất, secondary bên trái, `[...]` dropdown cho action ít dùng (Duplicate, Archive, Export...).
- **Tabs**: underline style, URL sync `?tab=versions`. Content lazy load per tab.

### 14.3. Split View (List + Side Panel)

Khác Flexible Column ở chỗ **detail hiện overlay bên phải, không đẩy list** — nhanh preview mà không mất context.

**Khi dùng:**
- Preview quick 1 record (VD click 1 email inbox → hiện body bên phải).
- Assign action (click 1 task → mở panel assign bên phải).

**Layout:**
```
┌───────────────────────────────┬─────────────────┐
│ List (full width)             │ Side Panel      │
│                               │ (fixed 400px)   │
│  Row 1                        │  Detail content │
│  Row 2 (selected, highlighted)│  ...            │
│  Row 3                        │  [X close]      │
└───────────────────────────────┴─────────────────┘
```

- Panel width `w-96` (384px) mặc định, resizable optional.
- Đóng bằng: nút X, click ngoài panel, phím `Escape`.
- Row selected `bg-primary-50 border-l-2 border-primary-500`.

### 14.4. Kanban / Board View

Cho các module có workflow status rõ (Task, Ticket, Leave Request, Lead pipeline).

**Layout:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ OPEN (5)    │ IN_PROGRESS │ DONE (12)   │ CANCELLED   │
│ + Add       │ (3)         │             │ (2)         │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ [Card]      │ [Card]      │ [Card]      │ [Card]      │
│ [Card]      │ [Card]      │ [Card]      │             │
│ [Card]      │             │ [Card]      │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Card content (đồng nhất mọi module):**
```
┌──────────────────────────────────┐
│ #TSK-123                    HIGH │  ← code + priority badge
│ Sửa lỗi API auth trả về 500       │  ← title (2 dòng max, truncate)
│                                  │
│ 🏷 backend  bug                  │  ← tags
│                                  │
│ 👤 An Nguyễn      📅 12/07       │  ← assignee avatar + due date
└──────────────────────────────────┘
```

**Rules:**
- Column header: title + count `(N)` + nút `+ Add` (nếu có quyền tạo).
- Card: `p-3 border border-neutral-200 rounded-lg bg-surface hover:shadow-sm cursor-grab`.
- Drag-drop dùng `@dnd-kit/*` (cần cài). Drop = update `status` qua PATCH endpoint.
- Empty column: `<EmptyState />` compact bên trong column.
- Toggle giữa Board ↔ Table view ở top-right của page.
- Filter chip ở trên board (My tasks / Assigned to me / Overdue) — dùng chung filter bar.

**Ứng dụng Frezo:**
- **Task** (`/task/task`): OPEN / IN_PROGRESS / DONE / CANCELLED
- **Ticket** (`/task/ticket`): OPEN / IN_PROGRESS / RESOLVED / CLOSED
- **LeaveRequest** (`/qlns/leave-request`): PENDING / APPROVED / REJECTED / CANCELLED
- **FbLead** (`/fb/leads`): NEW / CONTACTED / IMPORTED (kanban tiến trình import)

### 14.5. Timeline / Activity Feed

Cho ContractHistory, ArticleRevision, AuditLog, notification, comment thread.

**Layout:**
```
┌─────────────────────────────────────────────┐
│  ●─── Hôm nay                               │
│  │                                          │
│  ● 10:32  Nguyễn Văn A đã duyệt hợp đồng    │
│  │        "Trạng thái: PENDING → APPROVED"  │
│  │                                          │
│  ● 09:15  Trần Thị B đã upload file         │
│  │        "hop_dong_ban.pdf • 2.3 MB"       │
│  │                                          │
│  ●─── Hôm qua                               │
│  │                                          │
│  ● 14:22  AI đã trích xuất nội dung          │
│           "Xem diff với version cũ →"        │
└─────────────────────────────────────────────┘
```

**Rules:**
- Vertical line + dot + card layout.
- Group by ngày với divider "Hôm nay / Hôm qua / dd/MM".
- Timestamp relative (`formatRelativeTime`) trong dot area, absolute (`formatDateTime`) khi hover.
- Icon dot theo loại action:
  - Create: `Plus` màu `text-success`
  - Update: `Edit` màu `text-primary-600`
  - Approve: `CheckCircle` màu `text-success`
  - Reject: `XCircle` màu `text-danger`
  - Delete: `Trash2` màu `text-danger`
  - Upload: `Paperclip` màu `text-neutral-500`
  - AI action: `Sparkles` màu `text-primary-600`
- Diff view: extract `oldValue → newValue` với `bg-danger-light` cho removed, `bg-success-light` cho added (khi field text dài, render như GitHub diff).

### 14.6. Multi-tab Detail

Cho Object Page phức tạp có nhiều facet (Contract có Điều khoản + Version + Attachment + Activity...).

**Rules:**
- Tabs horizontal, underline style (không pill).
- Active: `border-b-2 border-primary-600 text-neutral-900 font-medium`.
- Inactive: `text-neutral-500 hover:text-neutral-700`.
- URL sync: `?tab=versions`. Deep link phải render tab đúng.
- Content lazy load per tab (dùng React Query key theo tab).
- Nếu >6 tab: dùng dropdown "..." cho tab tràn.
- Tab bar sticky khi scroll Object Page.

---

## 15. Workflow & Approval System

### 15.1. Status Badge System

**Mỗi module có 1 `statusConfig` object** map từ status enum → `{ label, colorClass, icon }`. Không hardcode màu trong render.

```ts
// modules/qlns/constants/contractStatus.ts
export const CONTRACT_STATUS_CONFIG = {
  DRAFT:             { label: 'Nháp',           color: 'neutral',  icon: FileText },
  PENDING_APPROVAL:  { label: 'Chờ duyệt',      color: 'warning',  icon: Clock },
  NEGOTIATING:       { label: 'Đang đàm phán',  color: 'info',     icon: MessageSquare },
  ACTIVE:            { label: 'Đang hiệu lực',  color: 'success',  icon: CheckCircle },
  SUSPENDED:         { label: 'Tạm dừng',       color: 'warning',  icon: PauseCircle },
  COMPLETED:         { label: 'Hoàn thành',     color: 'success',  icon: CheckCircle },
  CANCELLED:         { label: 'Đã hủy',         color: 'danger',   icon: XCircle },
  // ... 14 state
} as const

export type ContractStatus = keyof typeof CONTRACT_STATUS_CONFIG
```

**Component `<StatusBadge status={s} config={CONTRACT_STATUS_CONFIG} />` (dùng chung):**
- Layout: `<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-{color}-light text-{color}-dark"><Icon size={12}/>{label}</span>`
- 5 màu theo `color` prop: `neutral | info | success | warning | danger`.
- Có variant compact (chỉ dot + text): `<StatusBadge compact />`.

### 15.2. Approval Stepper (2-tier OP/RV cho Contract)

Contract có luồng đặc biệt: `WAITING_FOR_OP → OP_PROCESSING → WAITING_FOR_RV → RV_REVIEWING → RV_DONE`. Hiển thị **stepper horizontal** để user biết đang ở bước nào.

```
[✓ Draft]───[✓ OP Processing]───[● Reviewing]───[○ Approved]───[○ Active]
                                    ↑ current
```

**Rules:**
- Step done: `bg-success text-white` + icon `Check`.
- Step current: `bg-primary-600 text-white` + icon số bước hoặc dot pulse.
- Step pending: `bg-neutral-100 text-neutral-400`.
- Connector line: `bg-success` giữa done, `bg-neutral-200` giữa pending.
- Click 1 step (nếu done + có quyền) → mở modal xem chi tiết ai duyệt, khi nào, ghi chú.

### 15.3. Approver Chain (Ai đã sign)

Panel bên detail hiển thị:
```
Người phê duyệt:
  ✓ Nguyễn Văn A (OP)   — 10/07 14:32   [Xem ghi chú]
  ● Trần Thị B (RV)     — đang chờ...
  ○ Lê Văn C (Manager)  — chưa đến lượt
```

- Icon check: `Check` xanh cho đã duyệt, `Loader2` cho đang chờ, `Circle` cho pending.
- Row có ghi chú → hiện link "Xem ghi chú" mở popover.

### 15.4. Rejection Modal (bắt buộc lý do)

Nút "Từ chối" mở modal:
```
Từ chối [đối tượng]?

Lý do từ chối (bắt buộc):
[textarea, min 10 chars]

□ Cho phép người tạo chỉnh sửa và gửi lại

[Hủy]  [Xác nhận từ chối] ← variant destructive
```

- Textarea required, validate `>= 10 ký tự`.
- Submit disable nếu lý do trống.
- Sau submit: toast "Đã từ chối. [Undo]" (5s).

### 15.5. Bulk Approve / Reject

Cho các list có nhiều pending (GIN batch confirm, LeaveRequest hàng loạt).

- Checkbox cột đầu (đã có trong `AppTable` nếu bật).
- Bulk Selection Bar (sticky bottom, xem [17.1](#171-bulk-selection--actions)):
  ```
  Đã chọn 5 mục  [Deselect]  [Duyệt hàng loạt]  [Từ chối hàng loạt]
  ```
- Confirm modal với **count**: "Duyệt 5 hợp đồng nghỉ phép?"
- Kết quả: toast summary "Đã duyệt 4/5 — 1 lỗi. [Xem chi tiết]".

---

## 16. AI Actions Pattern

Nhiều module Frezo có AI action (Contract upload-and-extract + ai-edit, Customer AI sync, FB Lead scrape). Cần pattern nhất quán.

### 16.1. AI Action Button

```tsx
<Button variant="outline" onClick={triggerAI} disabled={aiStatus === 'PROCESSING'}>
  {aiStatus === 'PROCESSING'
    ? <Loader2 size={16} className="mr-2 animate-spin" />
    : <Sparkles size={16} className="mr-2 text-primary-600" />}
  {aiStatus === 'PROCESSING' ? 'AI đang xử lý...' : 'AI trích xuất nội dung'}
</Button>
```

- Icon `Sparkles` (Lucide) — signature AI action.
- Idle: `variant="outline"` với icon primary.
- Processing: disabled + spinner + text "AI đang xử lý...".
- Success: `toast.success('AI đã hoàn tất, xem kết quả bên dưới')`.
- Failed: `toast.apiError(err, 'AI xử lý thất bại')` + hiện lại button để retry.

### 16.2. AI Status Badge

Cho field/entity có content do AI generate:

```tsx
<Badge className="bg-primary-50 text-primary-700 border border-primary-200">
  <Sparkles size={10} className="mr-1" /> AI Generated
</Badge>
```

Đặt cạnh field name khi hiển thị. User biết đây là AI, cần review.

### 16.3. AI Diff Preview

Khi AI edit content (Contract ai-edit), mở modal preview trước khi apply:

```
┌───────────────────────────────────────┐
│ AI đề xuất thay đổi                    │
├───────────────────────────────────────┤
│ [Original]      │  [AI Suggestion]    │
│ text cũ...      │  text mới...        │
│ removed line─── │  ─── added line     │
│                 │  ─── added line     │
├───────────────────────────────────────┤
│                    [Hủy]  [Áp dụng]  │
└───────────────────────────────────────┘
```

- Split view 2 cột (original / AI).
- Diff highlight: `bg-danger-light` removed, `bg-success-light` added.
- Nút "Áp dụng" apply patch. "Hủy" giữ nguyên original.

### 16.4. AI Processing Indicator (long-running)

Cho task chậm (AI extract từ PDF/DOCX). Polling `GET /ai-status` mỗi 2s:

```
┌────────────────────────────────────┐
│ ⏳ AI đang xử lý...                 │
│ ████████░░░░░░░░ 62%               │
│ Bước: Đang trích xuất điều khoản    │
└────────────────────────────────────┘
```

- Card `bg-primary-50 border border-primary-200 p-4`.
- Progress bar dựa vào `aiStatus` (nếu BE trả về progress) hoặc indeterminate.
- Cho phép "Chạy nền" (đóng modal, notification khi xong).

---

## 17. Data Operations

### 17.1. Bulk Selection & Actions

**Bulk Selection Bar** — sticky bottom khi có row selected trong table.

```
┌─────────────────────────────────────────────────────┐
│ ✓ Đã chọn 5 / 47   [Bỏ chọn tất cả]                 │
│                                                     │
│ [Xóa]  [Duyệt]  [Đổi trạng thái ▾]  [Xuất chọn]    │
└─────────────────────────────────────────────────────┘
```

- Position: `fixed bottom-0 left-0 right-0` (desktop có thể offset theo sidebar width).
- `bg-neutral-900 text-white p-3 shadow-card-md z-40`.
- Show/hide bằng `translate-y-full` animation 200ms.
- Actions bên phải, deselect bên trái.
- Confirm destructive kèm count: "Xóa **5 hợp đồng** này?".
- Kết quả: toast summary "Đã xóa 5. [Undo]".

### 17.2. Import Wizard (4 bước)

Cho Customer/Employee/Product/GIN import từ Excel:

**Step 1 — Download template**
```
┌────────────────────────────────────────┐
│ Bước 1/4: Tải template mẫu             │
│                                        │
│ Tải file mẫu, điền dữ liệu theo cột.   │
│                                        │
│ [Tải template Excel (.xlsx)]           │
│                                        │
│              [Tiếp theo →]              │
└────────────────────────────────────────┘
```

**Step 2 — Upload & Preview**
- Drag-drop zone hoặc button upload.
- Sau upload, parse client-side với `xlsx` lib → hiện preview table 10 dòng đầu.
- Detect column mismatch → warning.

**Step 3 — Validate**
- Gọi endpoint `/api/{module}/import/validate` (dry-run).
- Kết quả: `{ valid: 45, invalid: 2, errors: [{ row, field, message }] }`.
- Hiển thị table: valid rows (bg-success-light) + invalid rows (bg-danger-light) với error message.
- Cho phép user fix inline hoặc download error report.

**Step 4 — Import & Result**
- Gọi endpoint `/api/{module}/import`.
- Progress bar (nếu BE hỗ trợ streaming).
- Kết quả: `<Result variant="success" title="Đã import 45 khách hàng" actions={[Xem danh sách, Import thêm]} />`.

**Stepper header** cho toàn wizard:
```
● Tải template ─── ● Upload ─── ● Validate ─── ○ Kết quả
   done              done          current       pending
```

### 17.3. Export Button

Dropdown chuẩn cho mọi list quan trọng:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      <Download size={16} className="mr-2" /> Xuất
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => exportAs('csv')}>
      <FileText size={16} className="mr-2" /> CSV (.csv)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportAs('xlsx')}>
      <FileSpreadsheet size={16} className="mr-2" /> Excel (.xlsx)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportAs('pdf')}>
      <FileType size={16} className="mr-2" /> PDF
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Flow:**
- Click → toast `Đang chuẩn bị file...` (dùng `toast.loading`).
- BE trả file → tự trigger download qua `<a download>`.
- Success: dismiss loading toast + `toast.success('Đã xuất file')`.
- Fail: `toast.apiError(err, 'Không thể xuất file')`.

### 17.4. Print Preview (A4)

Cho GIN print (`GET /gin/{id}/print`), Payslip PDF, StockTransfer print.

**Component `<PrintPreviewModal />`:**
- Layout: modal `max-w-4xl`, header + preview area A4 aspect (`aspect-[210/297]`).
- Preview render HTML/PDF từ BE trong `<iframe srcDoc={html} />`.
- Actions: `[Đóng]  [Tải PDF]  [In ngay]` — `[In ngay]` gọi `window.print()`.

**Print styles** (`@media print`):
- Hide sidebar, header, actions toolbar.
- Chỉ hiện main content.
- Font size `12pt`, line-height `1.4`.
- Page break sau mỗi section lớn: `break-after: page`.
- Logo + tên công ty header cố định (dùng `position: fixed; top: 0`).

### 17.5. Attachment Management

Component `<AttachmentList />` cho GRN/GIN/Contract/PersonDocument.

```
┌───────────────────────────────────────────────────┐
│ Tài liệu đính kèm (3)          [+ Thêm tệp]        │
├───────────────────────────────────────────────────┤
│ 📄 hop_dong_ban.pdf     2.3 MB  10/07  [👁][⬇][🗑] │
│ 📊 phu_luc_gia.xlsx    145 KB  11/07  [👁][⬇][🗑] │
│ 🖼 hinh_ky.jpg         1.1 MB  11/07  [👁][⬇][🗑] │
└───────────────────────────────────────────────────┘

Upload zone (khi trống hoặc bấm Thêm):
┌───────────────────────────────────────────────────┐
│                    ⬆                             │
│      Kéo file vào đây hoặc bấm để chọn            │
│      Hỗ trợ: PDF, Excel, Word, JPG (max 10MB)    │
└───────────────────────────────────────────────────┘
```

**Rules:**
- Icon file theo extension (Lucide `FileText/FileSpreadsheet/FileImage/File`).
- Format size: `formatFileSize` từ `@frezo/utils`.
- Actions icon-only + tooltip: Preview (mở modal xem), Download, Delete.
- Upload: multipart, progress per file, max size + type validation client-side trước khi gửi.
- Nếu file là ảnh → preview inline thumbnail 40×40.

---

## 18. Power-user Features

### 18.1. Command Palette (Cmd+K)

**Library:** `cmdk` (chuẩn Linear/Vercel/Raycast). Cài khi implement:
```bash
npm install cmdk --workspace=@frezo/erp
```

**Mount tại root layout** (không mount lại mỗi page):
```tsx
// components/layout/CommandPalette.tsx
'use client'
import { Command, CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from 'cmdk'
import { useEffect, useState } from 'react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])
  return <CommandDialog open={open} onOpenChange={setOpen}>...</CommandDialog>
}
```

**Groups chuẩn** (theo thứ tự):
1. **Recent** — 10 items user vừa mở (từ localStorage).
2. **Navigation** — jump to module: "Đến Hợp đồng", "Đến Nhân sự", "Cài đặt hệ thống"...
3. **Actions** — quick create: "Tạo hợp đồng mới", "Thêm nhân viên", "Tạo phiếu nhập kho"...
4. **Search Results** — fuzzy search tên khách hàng, mã hợp đồng, tên nhân viên (call `/search` endpoint hoặc client filter recent).

**Item layout:**
```
[Icon]  Đến Hợp đồng                    Ctrl+G C
```
- Icon Lucide 16px trái.
- Label giữa.
- Shortcut hint bên phải (`text-xs text-neutral-400`), monospace.

**Rules:**
- `e.preventDefault()` bắt buộc (tránh browser bắt Cmd+K address bar).
- Cmd+K trên Mac / Ctrl+K trên Win/Linux — detect qua `metaKey || ctrlKey`.
- Focus input tự động khi open.
- Escape đóng, Enter chọn.
- Nếu search rỗng → hiện Recent + Actions default.

### 18.2. Notification Center

Icon `Bell` ở header với badge số chưa đọc.

**Popover khi click bell:**
```
┌─────────────────────────────────────────┐
│ Thông báo                    [Đánh dấu │
│                              tất cả]    │
├─────────────────────────────────────────┤
│ [Tất cả] [Chưa đọc (3)]                 │
├─────────────────────────────────────────┤
│ ● 🟢 Nguyễn Văn A đã duyệt HD-001        │
│    5 phút trước                          │
├─────────────────────────────────────────┤
│ ● 🟡 Hợp đồng HD-002 sắp hết hạn         │
│    2 giờ trước                           │
├─────────────────────────────────────────┤
│   🔵 AI đã hoàn tất extract HD-003       │
│    Hôm qua                               │
├─────────────────────────────────────────┤
│              [Xem tất cả →]              │
└─────────────────────────────────────────┘
```

**Rules:**
- Endpoint: `GET /qtht/notification/my`, `PATCH /qtht/notification/{id}/read`.
- Chưa đọc: dot xanh trước item + font semibold.
- Đã đọc: font normal, không dot.
- Icon theo `type`: success (`CheckCircle` green), warning (`AlertTriangle` orange), info (`Info` blue).
- Click item → mark as read + navigate tới entity liên quan.
- Popover width `w-96`, max-height với scroll.
- Realtime: subscribe WebSocket (BE có `/qtht/websocket-channel`) hoặc polling 30s.

### 18.3. Sensitive Data Reveal (Encrypted Phone)

Customer/NCC/Restaurant có `phoneEncrypted` — hiển thị masked mặc định, cần bấm để reveal.

```tsx
function PhoneField({ customerId, maskedPhone }: { customerId: string, maskedPhone: string }) {
  const [revealed, setRevealed] = useState<string | null>(null)
  const canReveal = usePermission('CUSTOMER.REVEAL_PHONE')

  const handleReveal = async () => {
    const full = await customerApi.revealPhone(customerId) // audit auto-logged BE
    setRevealed(full)
    setTimeout(() => setRevealed(null), 30_000) // tự ẩn sau 30s
  }

  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums">
        {revealed ? formatPhoneVN(revealed) : maskedPhone /* '•••• 5678' */}
      </span>
      {canReveal && !revealed && (
        <Button variant="ghost" size="icon" title="Hiện SĐT (được ghi audit)" onClick={handleReveal}>
          <Eye size={14} />
        </Button>
      )}
      {revealed && (
        <Button variant="ghost" size="icon" title="Ẩn" onClick={() => setRevealed(null)}>
          <EyeOff size={14} />
        </Button>
      )}
    </div>
  )
}
```

**Rules:**
- Mặc định hiển thị `maskPhone(phone)` = `'•••• 1234'` (dùng helper `@frezo/utils`).
- Check quyền `<DOMAIN>.REVEAL_PHONE` — không có quyền → không hiện nút mắt.
- Sau khi reveal, auto hide sau 30s (chống lộ khi rời máy).
- Backend auto log reveal vào audit log (`qtht/audit-logs`).
- Với action quan trọng (VD reveal 100 SĐT để export) — thêm confirm dialog nêu lý do.

### 18.4. Keyboard Shortcuts (Linear-inspired)

Danh sách shortcut chuẩn Frezo (nhất quán mọi module):

| Shortcut          | Hành động                                    |
| ----------------- | -------------------------------------------- |
| `Cmd/Ctrl + K`    | Mở Command Palette                           |
| `Cmd/Ctrl + /`    | Mở Help / Shortcut list                      |
| `Cmd/Ctrl + N`    | Create mới (context-aware theo trang)        |
| `Cmd/Ctrl + S`    | Save form (khi có form đang edit)            |
| `Cmd/Ctrl + F`    | Focus vào search box của trang                |
| `Cmd/Ctrl + B`    | Toggle sidebar collapse                       |
| `Escape`          | Đóng modal / cancel edit / close popover      |
| `?`               | Show help overlay                             |
| `G` then `H/D/T`  | Go to Home / Dashboard / Task (2-key nav)     |

**Rules:**
- Register global shortcuts trong `AppProviders`, không mỗi component tự register.
- Chỉ trigger khi focus không ở input (dùng `useHotkeys` từ `react-hotkeys-hook`).
- Show shortcut hint trong tooltip: `title="Lưu (⌘S)"`.

---

## 19. Vietnamese Localization

### 19.1. Format helpers (đã có trong `@frezo/utils`)

```ts
import {
  formatCurrency,      // 1234567 → "1.234.567 ₫"
  formatCurrencyShort, // 1234567 → "1.2 tr" (dùng cho KPI card)
  formatDate,          // Date → "13/07/2026"
  formatDateTime,      // Date → "13/07/2026 14:32"
  formatDateLong,      // Date → "Thứ Ba, 13/07/2026"
  formatRelativeTime,  // Date → "2 giờ trước" / "3 ngày trước"
  formatNumber,        // 1234567 → "1.234.567"
  formatPercent,       // 12.5 → "12.5%"
  formatPhoneVN,       // "0912345678" → "0912 345 678"
  maskPhone,           // "0912345678" → "•••• 5678"
  formatCCCD,          // "079093012345" → "079 093 012 345"
  formatMST,           // "0106123456789" → "0106123456-789"
  formatFileSize,      // 2456789 → "2.3 MB"
} from '@frezo/utils'
```

### 19.2. Đơn vị hành chính (Tỉnh/Thành phố → Quận/Huyện → Phường/Xã)

Address input chuẩn Việt Nam **luôn** dùng 3-level dropdown cascade:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <FormField label="Tỉnh/Thành phố" required>
    <ProvinceSelect value={provinceId} onChange={setProvinceId} />
  </FormField>
  <FormField label="Quận/Huyện" required>
    <DistrictSelect provinceId={provinceId} value={districtId} onChange={setDistrictId} disabled={!provinceId} />
  </FormField>
  <FormField label="Phường/Xã" required>
    <WardSelect districtId={districtId} value={wardId} onChange={setWardId} disabled={!districtId} />
  </FormField>
</div>
<FormField label="Số nhà, tên đường" required>
  <Input value={street} onChange={...} placeholder="123 Nguyễn Trãi" />
</FormField>
```

- Data source: dùng API BE hoặc bundle file JSON chuẩn `general-statistics-office-of-vietnam.gov.vn` (63 tỉnh, ~700 huyện, ~11k xã).
- Cascade: khi đổi Tỉnh → reset Huyện + Xã. Đổi Huyện → reset Xã.
- Cache data (React Query staleTime `Infinity`) — data này gần như không đổi.

### 19.3. i18n Key Convention

Toàn hệ thống dùng key theo pattern `<domain>.<context>.<key>`:

```
contract.status.DRAFT              → "Nháp"
contract.status.PENDING_APPROVAL   → "Chờ duyệt"
contract.action.approve            → "Duyệt hợp đồng"
common.confirm                     → "Xác nhận"
common.cancel                      → "Hủy"
common.button.save                 → "Lưu"
error.NETWORK_TIMEOUT              → "Kết nối chậm, vui lòng thử lại"
error.PERMISSION_DENIED            → "Bạn không có quyền thực hiện"
```

- BE trả `errorKey` trong `AppException` — FE lookup i18n để show message VN đúng ngữ cảnh.
- **KHÔNG** hardcode text tiếng Việt trong component (trừ label form đơn giản, cân nhắc theo module).
- Khi có multi-language: dùng `react-i18next`, key nested theo namespace module.

### 19.4. Tiền tệ & Số

- Mặc định: **VND**, hiển thị **không phần thập phân** (`maximumFractionDigits: 0`).
- Số âm: dùng dấu `-` trước (không dùng ngoặc kế toán).
- Delta % trong dashboard: `+12.3%` (xanh success) / `-5.1%` (đỏ danger) với icon `TrendingUp/Down`.
- Bảng có cột số: `text-right tabular-nums` để số thẳng cột.

### 19.5. Ngày tháng

- Format short: **dd/MM/yyyy** (VN chuẩn).
- Format datetime: **dd/MM/yyyy HH:mm** (24h).
- Relative time: **"2 giờ trước"**, "**3 ngày trước**", "**1 tuần trước**". Sau 30 ngày → hiện date absolute.
- DatePicker: label thứ đầu tuần là **T2 T3 T4 T5 T6 T7 CN**. Format hiển thị dd/MM/yyyy.

---

## 20. Domain-Specific Patterns per Module

> Áp dụng các Enterprise Patterns (section 14-19) vào từng module cụ thể của Frezo. Đây là **default recommendation** — không phải bắt buộc cứng, module có thể adapt nếu có lý do.

### 20.1. `qlns` — HR (Nhân sự)

| Entity           | Layout               | Đặc thù                                                                             |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------- |
| **Contract**     | Flexible Column 3-col | Master list + Object Page (14 state với Approval Stepper OP/RV) + Version sub-panel (diff) |
| **Employee (Person)** | Flexible Column 2-col | Master list + Object Page với tabs [Info / Contract / Dependents / Attachment]     |
| **Attendance**   | Table + Calendar toggle | Table view mặc định + Calendar month view (dot màu theo status)                    |
| **LeaveRequest** | **Kanban** default   | PENDING / APPROVED / REJECTED / CANCELLED — drag để đổi status (nếu có quyền)       |
| **Payroll**      | Table + Period filter | Filter theo PayrollPeriod. Bulk calculate. Payslip PDF preview modal. Bank export.  |
| **Department**   | **Tree view**         | Org chart với expand/collapse. Drag để đổi parent (nếu có quyền)                    |

**Đặc biệt:**
- Contract có AI extract (upload → AI trích xuất) + AI edit — dùng [16.1](#161-ai-action-button) pattern.
- Contract diff versions — dùng [14.5](#145-timeline--activity-feed) diff view.
- Payroll period lock/unlock — dùng ConfirmDialog với warning message rõ ("Sau khi lock, không thể sửa dữ liệu chấm công của kỳ này").

### 20.2. `task` — Task / Ticket Management

| Entity     | Layout               | Đặc thù                                                             |
| ---------- | -------------------- | ------------------------------------------------------------------- |
| **Task**   | **Kanban** default + Table toggle | OPEN / IN_PROGRESS / DONE / CANCELLED. Card: title + priority + assignee + tags |
| **Ticket** | **Kanban** default   | OPEN / IN_PROGRESS / RESOLVED / CLOSED. Card có category (BUG/FEATURE/SUPPORT)    |
| **Tag**    | Simple list + inline edit | Không cần detail page                                              |

**Đặc biệt:**
- Filter chip trên board: "My tasks" / "Assigned to me" / "Overdue" / "Due this week".
- Assignee avatar overlap trên card (nếu multiple).
- Priority badge: URGENT (red) / HIGH (orange) / MEDIUM (blue) / LOW (gray).

### 20.3. `qtbv` — CMS (Article)

| Entity      | Layout             | Đặc thù                                                             |
| ----------- | ------------------ | ------------------------------------------------------------------- |
| **Article** | Tabs list + Object Page | Top tabs: [Nháp của tôi | Chờ duyệt | Đã xuất bản]. Editor TipTap (đã có). Preview mode. Approval flow. |
| **LandingConfig** | Single-page form | Không cần list                                                     |

**Đặc biệt:**
- Editor TipTap trong Object Page. Có toolbar top (bold/italic/heading/link/image).
- Nút "Preview" mở modal render như bài đăng thật (client-side).
- Submit → status = WAITING_APPROVAL, không thể edit tiếp cho tới khi được duyệt hoặc reject.
- Publish → thêm `publishScope` (INTERNAL / PUBLIC).

### 20.4. `warehouse` — Warehouse Management

| Entity           | Layout             | Đặc thù                                                             |
| ---------------- | ------------------ | ------------------------------------------------------------------- |
| **Warehouse**    | Master-Detail 2-col | List + Detail với Zones/Locations tree                             |
| **GRN / GIN / Transfer / Adjustment** | Table + Object Page | Status: DRAFT/CONFIRMED/CANCELLED. Bulk confirm/cancel (GIN). Print preview. Attachment. |
| **Stock**        | Dashboard + Table  | Alert card (low stock red). Chart tồn kho theo warehouse. Export.  |
| **Location**     | Table + Barcode scan input | Input tìm nhanh bằng barcode                                 |

**Đặc biệt:**
- Item picker trong form GIN/GRN: autocomplete search + hiện tồn kho hiện tại + unit.
- Batch operation: chọn nhiều GIN cùng lúc → confirm hàng loạt (`POST /gin/batch-confirm`).
- Print GIN: `<PrintPreviewModal html={ginHtml} />` (BE trả HTML sẵn A4).
- Low stock alert: badge đỏ trên item + toast notification khi qua ngưỡng.

### 20.5. `customer` — CRM (Customer + NCC + Voucher)

| Entity       | Layout               | Đặc thù                                                             |
| ------------ | -------------------- | ------------------------------------------------------------------- |
| **Customer** | Flexible Column 2-col | List + Object Page với tabs [Info / Payment / Orders / Activity]. Import wizard. Phone reveal. |
| **NCC**      | Master-Detail 2-col   | List + Detail + Certificate tab (upload multipart)                  |
| **Voucher**  | Simple table + Toggle | CRUD nhanh, toggle status inline                                    |

**Đặc biệt:**
- **Phone Reveal** ([18.3](#183-sensitive-data-reveal-encrypted-phone)) — mặc định masked, click mắt để reveal.
- **AI Sync** button — `POST /customer/ai/sync` để crawl customer mới từ Google Maps.
- **Import Wizard** ([17.2](#172-import-wizard-4-bước)) cho customer excel.
- Category dropdown (từ dmdc `qtht/category`) — cascade nếu có parent.

### 20.6. `product` — Product Catalog

| Entity           | Layout                  | Đặc thù                                                       |
| ---------------- | ----------------------- | ------------------------------------------------------------- |
| **Product**      | Flexible Column 2-col   | List (grid card view + table toggle) + Detail với tabs [Info / Units / Batch / Price / Inventory Log] |
| **SaleOrder**    | Table + Object Page     | Filter theo paymentStatus. Timeline order state.              |
| **Cart**         | Không có UI admin       | (Chỉ dùng cho public checkout)                                |

**Đặc biệt:**
- Product card grid view (thay vì table) khi cần preview ảnh — dùng cho catalog.
- Bulk update prices — chọn nhiều → nhập % tăng/giảm → apply.
- 3 dashboard chart (profit / price fluctuation / market comparison) — dùng Recharts, cùng section [7](#7-dashboard-layout-structure).
- Cảnh báo `warningThreshold` (tồn kho thấp), `expiryAlertDays` (sắp hỏng) — badge đỏ trong list.

### 20.7. `qtht` — Quản trị hệ thống

| Entity                | Layout                | Đặc thù                                                    |
| --------------------- | --------------------- | ---------------------------------------------------------- |
| **User** (admin)      | Master-Detail 2-col   | List + Detail với tabs [Info / Roles / Sessions / Login history]. Actions: Lock/Unlock, Reset password, Assign role. |
| **Role**              | Master-Detail 2-col   | List + Detail với **Permission Matrix** (menu ↔ permission checkbox grid) |
| **Menu**              | Tree view + Editor    | Drag-drop reorder. Attach permissions.                     |
| **Setting**           | Single-page form (tabs) | Group setting theo category (General / Email / Security / ...) |
| **AuditLog**          | Table với filter mạnh | Filter theo user / action / date range. Export.            |
| **IP whitelist/blacklist** | Simple table + Add | Actions: ban/unban IP, note reason.                        |
| **Session (active)**  | Table                 | Actions: revoke 1 / revoke all / revoke by user            |

**Đặc biệt:**
- **Permission Matrix** trong Role detail: grid với Menu ở hàng, Permission ở cột — checkbox toggle.
- **Reset password** cho user khác: confirm modal + gửi email tự động.
- **Impersonate** (nếu có): nút "Đăng nhập dưới tên user này" — chỉ cho superadmin, luôn hiện banner cảnh báo khi đang impersonate.

### 20.8. `fb` — Facebook Automation

| Entity       | Layout          | Đặc thù                                                       |
| ------------ | --------------- | ------------------------------------------------------------- |
| **Account**  | **Card grid**   | Mỗi card: avatar + status + postsToday + Actions [Login / Update cookie / Delete] |
| **Group**    | Card list       | Scan groups action. Delete action.                            |
| **Lead**     | Table + Bulk import | Filter theo status (NEW / IMPORTED). Bulk import to Customer. |
| **Automation** | Single-page (buttons) | Actions dashboard: Scan groups, Join group, Login. Summary stats. |

**Đặc biệt:**
- FB Account status có thể là "cookie expired" — badge warning + button "Update cookie".
- Lead import to Customer — flow tương tự Import Wizard ([17.2](#172-import-wizard-4-bước)) nhưng đơn giản hơn (chỉ chọn cột mapping FB Lead → Customer).

### 20.9. `email` — Email Service

| Entity           | Layout                | Đặc thù                                                       |
| ---------------- | --------------------- | ------------------------------------------------------------- |
| **EmailConfig**  | Card grid / Table     | Actions: Test connection, Activate/Deactivate                 |
| **Template**     | List + Editor         | Editor rich text (TipTap). Preview mode. Send test.           |
| **SendEmail (log)** | Table                | Filter theo template/group/date. Recipients count. Status.    |
| **Inbox (IMAP)** | Split View            | Left: mail list, Right: mail body                             |

**Đặc biệt:**
- Send test template: modal nhập email test → gửi ngay.
- Bulk send by group: chọn template + group → confirm count → send.
- Inbox: chuẩn 3-column mail app (folder / list / body) hoặc 2-column (list / body).

---

> **Ghi chú vận hành:**
> - Khi implement 1 pattern lần đầu (VD Flexible Column), tạo component chung ở `packages/ui` hoặc `packages/erp/src/components/shared/` để module khác dùng lại. **Không** copy-paste vào từng module.
> - Nếu 1 module có nghiệp vụ đặc thù chưa nêu ở section 20 → tự đối chiếu section 14-19 + reference SAP Fiori / Ant Pro để đề xuất pattern, đưa lên PR review.

---

> **File song hành:**
> - `AI_CODE_IMPROVEMENT_GUIDE.md` (FrezoBE) — chuẩn code backend / clean architecture.
> - `LANDING_UI_UX_STANDARD.md` (TBD) — chuẩn cho `packages/landing` (brand Farm, Playfair serif, animation richer).
