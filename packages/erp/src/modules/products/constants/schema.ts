import * as z from 'zod'

/**
 * Product form schema — align với BE `ProductCreateRequest` + `Product` entity.
 * Các field mở rộng cho app nông sản: code, origin (nguồn gốc), season (mùa vụ),
 * warningThreshold (ngưỡng cảnh báo hết hàng), expiryAlertDays (ngày cảnh báo sắp hỏng).
 */
export const productFormSchema = z.object({
  // -- Basic --
  name: z.string().min(1, 'Tên sản phẩm không được để trống').max(200, 'Tên tối đa 200 ký tự'),
  code: z.string().max(30, 'Mã tối đa 30 ký tự').optional().nullable(),
  category: z.string().min(1, 'Danh mục không được để trống'),
  imageUrl: z.string().optional().nullable(),

  // -- Pricing --
  price: z.coerce.number().min(0, 'Giá phải ≥ 0'),

  // -- Origin & Season (nông sản) --
  origin: z.string().max(100, 'Nguồn gốc tối đa 100 ký tự').optional().nullable(),
  season: z.string().max(100, 'Mùa vụ tối đa 100 ký tự').optional().nullable(),

  // -- Stock alerts --
  warningThreshold: z.coerce.number().min(0, 'Ngưỡng phải ≥ 0').optional().nullable(),
  expiryAlertDays: z.coerce.number().int().min(0, 'Số ngày phải ≥ 0').optional().nullable(),

  // -- Marketing --
  rating: z.coerce.number().min(0).max(5, 'Rating tối đa 5').optional().nullable(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional().nullable(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

/** Gợi ý mùa vụ VN — dùng cho combobox / datalist. */
export const SEASON_OPTIONS = [
  { value: 'Đông Xuân', label: 'Đông Xuân (11 → 4)' },
  { value: 'Hè Thu', label: 'Hè Thu (4 → 8)' },
  { value: 'Thu Đông', label: 'Thu Đông (9 → 12)' },
  { value: 'Quanh năm', label: 'Quanh năm' },
]

/** Vùng nguyên liệu nông sản phổ biến — có thể mở rộng qua Category API. */
export const ORIGIN_SUGGESTIONS = [
  'Đà Lạt', 'Mộc Châu', 'Long An', 'Bến Tre', 'Tiền Giang',
  'Vĩnh Long', 'Đắk Lắk', 'Sơn La', 'Lâm Đồng', 'Hưng Yên',
]
