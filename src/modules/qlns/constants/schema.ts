import * as z from 'zod'

export const personFormSchema = z.object({
  code: z.string().min(1, 'Mã nhân viên không được để trống'),
  name: z.string().min(1, 'Tên nhân viên không được để trống'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
  identityNumber: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  orgId: z.string().optional(),
  departmentId: z.string().optional(),
  jobTitle: z.string().optional(),
  activated: z.boolean().default(true),
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

export const contractFormSchema = z.object({
  code: z.string().min(2, 'Mã hợp đồng bắt buộc'),
  personId: z.string().min(1, 'Vui lòng chọn nhân sự'),
  type: z.string().min(1, 'Vui lòng chọn loại hợp đồng'),
  startDate: z.string().min(1, 'Ngày bắt đầu bắt buộc'),
  endDate: z.string().optional(),
  content: z.string().optional(),
})

