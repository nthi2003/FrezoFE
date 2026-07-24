import * as z from 'zod'

/** Schema chung create/edit — password trống hợp lệ khi edit; create bắt buộc password qua onSubmit. */
export const userFormSchema = z.object({
  username: z.string().min(4, 'Tên đăng nhập tối thiểu 4 ký tự').max(50, 'Tối đa 50 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  /** Create: không nhập trên form — lấy từ person (nếu có) hoặc bỏ trống. Edit: cho phép sửa. */
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  fullname: z.string().min(2, 'Vui lòng chọn nhân sự').max(100, 'Tối đa 100 ký tự'),
  dataAction: z.number().int(), // 1=Nội bộ, 2=Cha con, 3=Toàn quyền
  personId: z.string().optional().nullable(),
  roleIds: z.array(z.string()).min(1, 'Chọn ít nhất 1 vai trò — không lưu user không role'),
  orgId: z.string().optional().nullable(),
})

export type UserFormValues = z.infer<typeof userFormSchema>
