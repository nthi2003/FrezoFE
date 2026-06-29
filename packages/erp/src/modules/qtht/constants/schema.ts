import * as z from 'zod'

export const orgSchema = z.object({
  code: z.string()
    .min(1, 'Mã tổ chức không được để trống')
    .regex(/^[A-Z0-9_]+$/, 'Mã tổ chức chỉ được chứa chữ hoa, số và dấu gạch dưới'),
  name: z.string().min(1, 'Tên tổ chức không được để trống'),
  nameEn: z.string().optional().nullable(),
  shortName: z.string().optional().nullable(),
  taxCode: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  level: z.coerce.number().min(1, 'Cấp độ không được để trống'),
  type: z.string().min(1, 'Loại tổ chức không được để trống'),
  status: z.boolean(),
  scale: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  orderIndex: z.coerce.number().optional(),
})

export type OrgFormValues = z.infer<typeof orgSchema>

export const depSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban không được để trống'),
  name: z.string().min(1, 'Tên phòng ban không được để trống'),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  organizationId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  status: z.boolean().default(true),
})

export type DepFormValues = z.infer<typeof depSchema>
