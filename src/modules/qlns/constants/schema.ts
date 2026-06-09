import * as z from 'zod'

export const personFormSchema = z.object({
  code: z.string().min(2, 'Mã nhân viên bắt buộc'),
  name: z.string().min(2, 'Tên nhân viên bắt buộc'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
  identityNumber: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  departmentId: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.boolean().default(true),
})

export type PersonFormValues = z.infer<typeof personFormSchema>

export const leaveRequestSchema = z.object({
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự'),
  startDate: z.string(),
  endDate: z.string(),
})

export const leaveRejectSchema = z.object({
  reason: z.string().min(5, 'Lý do từ chối tối thiểu 5 ký tự')
})

export const bonusSchema = z.object({
  bonusAmount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
  reason: z.string().min(2, 'Nhập lý do thưởng/phụ cấp')
})

export const contractRejectSchema = z.object({
  reason: z.string().min(5, 'Lý do từ chối tối thiểu 5 ký tự')
})
