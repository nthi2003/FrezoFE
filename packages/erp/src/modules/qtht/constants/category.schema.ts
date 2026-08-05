import * as z from 'zod'

export const categoryFormSchema = z.object({
  code: z.string().min(1, 'Mã danh mục không được để trống'),
  name: z.string().min(1, 'Tên danh mục không được để trống'),
  nameEn: z.string().optional().nullable(),
  shortName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  orderIndex: z.coerce.number().optional(),
  active: z.boolean().default(true),
  parentCode: z.string().optional().nullable(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

// Các group code dùng cho trang Category management. QLTS đã bị deprecate → gộp vào
// `LoaiTaiSan` (module Asset seeder cũng đã migrate tự động khi khởi động).
export const GROUP_CODE_OPTIONS = [
  { value: 'ChucDanh', label: 'Chức Danh' },
  { value: 'DanhMucSP', label: 'Danh Mục Sản Phẩm' },
  { value: 'DonVi', label: 'Đơn Vị' },
  { value: 'LoaiTaiSan', label: 'Loại Tài Sản' },
  { value: 'UX_POPUP', label: 'Popup UX thành công' },
]

export const GROUP_CODE_LABEL: Record<string, string> = {
  ChucDanh: 'Chức Danh',
  DanhMucSP: 'Danh Mục Sản Phẩm',
  DonVi: 'Đơn Vị',
  LoaiTaiSan: 'Loại Tài Sản',
  UX_POPUP: 'Popup UX thành công',
}

/** Event codes seeded trong category group UX_POPUP */
export const UX_POPUP_EVENTS = {
  ATTENDANCE_FIRST_CHECKIN: 'ATTENDANCE_FIRST_CHECKIN',
  LOGIN_FIRST_OF_DAY: 'LOGIN_FIRST_OF_DAY',
  TASK_COMPLETED: 'TASK_COMPLETED',
} as const

export type UxPopupEventCode = (typeof UX_POPUP_EVENTS)[keyof typeof UX_POPUP_EVENTS]
