import * as z from 'zod'

export const userFormSchema = z.object({
  username: z.string().min(4, 'Tên đăng nhập tối thiểu 4 ký tự').max(50, 'Tối đa 50 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ'),
  fullname: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự'),
  dataAction: z.number().int(), // 1=Nội bộ, 2=Cha con, 3=Toàn quyền
  personId: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
  orgId: z.string().optional(),
})

export type UserFormValues = z.infer<typeof userFormSchema>
