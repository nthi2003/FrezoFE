import * as z from 'zod'

export const orgSchema = z.object({
  code: z.string()
    .min(1, 'Mã tổ chức không được để trống')
    .regex(/^[A-Z0-9_]+$/, 'Mã tổ chức chỉ được chứa chữ hoa, số và dấu gạch dưới'),
  name: z.string().min(1, 'Tên tổ chức không được để trống'),
  nameEn: z.string().optional(),
  shortName: z.string().optional(),
  taxCode: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  level: z.coerce.number().min(1, 'Cấp độ không được để trống'),
  type: z.string().min(1, 'Loại tổ chức không được để trống'),
  status: z.boolean(),
  scale: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  orderIndex: z.coerce.number().optional(),
})

export type OrgFormValues = z.infer<typeof orgSchema>

export const depSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban không được để trống'),
  name: z.string().min(1, 'Tên phòng ban không được để trống'),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  organizationId: z.string().optional(),
  parentId: z.string().optional(),
  status: z.boolean().default(true),
})

export type DepFormValues = z.infer<typeof depSchema>
