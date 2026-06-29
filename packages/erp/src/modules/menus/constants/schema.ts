import * as z from 'zod'

export const menuFormSchema = z.object({
  code: z.string().optional().nullable(),
  appCode: z.string().min(2, 'Mã ứng dụng bắt buộc'),
  name: z.string().min(2, 'Tên menu bắt buộc'),
  nameEn: z.string().optional().nullable(),
  parentCode: z.string().optional().nullable(),
  feUrl: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
  isPublic: z.boolean().default(false).optional(),
  status: z.boolean().default(true).optional(),
})

export type MenuFormValues = z.infer<typeof menuFormSchema>
