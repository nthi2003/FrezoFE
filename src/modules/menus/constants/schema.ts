import * as z from 'zod'

export const menuFormSchema = z.object({
  code: z.string().optional(),
  appCode: z.string().min(2, 'Mã ứng dụng bắt buộc'),
  name: z.string().min(2, 'Tên menu bắt buộc'),
  nameEn: z.string().optional(),
  parentCode: z.string().optional(),
  feUrl: z.string().optional(),
  icon: z.string().optional(),
  orderIndex: z.number().int().optional(),
  isPublic: z.boolean().default(false).optional(),
  status: z.boolean().default(true).optional(),
})

export type MenuFormValues = z.infer<typeof menuFormSchema>
