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

export const GROUP_CODE_OPTIONS = [
  { value: 'ChucDanh', label: 'Chức Danh' },
  { value: 'DanhMucSP', label: 'Danh Mục Sản Phẩm' },
  { value: 'DonVi', label: 'Đơn Vị' },
  { value: 'LoaiTaiSan', label: 'Loại Tài Sản' },
  { value: 'QLTS', label: 'Quản Lý Tài Sản' },
]

export const GROUP_CODE_LABEL: Record<string, string> = {
  ChucDanh: 'Chức Danh',
  DanhMucSP: 'Danh Mục Sản Phẩm',
  DonVi: 'Đơn Vị',
  LoaiTaiSan: 'Loại Tài Sản',
  QLTS: 'Quản Lý Tài Sản',
}
