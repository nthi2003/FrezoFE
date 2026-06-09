import * as z from 'zod'

export const roleFormSchema = z.object({
  code: z.string().min(2, 'Mã vai trò tối thiểu 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  appCode: z.string().min(2, 'Mã ứng dụng tối thiểu 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  name: z.string().min(2, 'Tên vai trò tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  description: z.string().max(255, 'Mô tả không quá 255 ký tự').optional(),
})

export type RoleFormValues = z.infer<typeof roleFormSchema>
