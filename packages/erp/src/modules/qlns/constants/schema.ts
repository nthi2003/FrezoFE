import * as z from 'zod'

export const personFormSchema = z.object({
  code: z.string().min(1, 'Mã nhân viên không được để trống'),
  name: z.string().min(1, 'Tên nhân viên không được để trống'),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  identityNumber: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  orgId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
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

export const createPayrollSchema = z.object({
  personId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  month: z.string().min(1, 'Vui lòng chọn tháng'),
  year: z.string().min(1, 'Vui lòng chọn năm'),
})

export const contractRejectSchema = z.object({
  reason: z.string().min(5, 'Lý do từ chối tối thiểu 5 ký tự')
})

export const contractFormSchema = z.object({
  code: z.string().min(2, 'Mã hợp đồng bắt buộc'),
  personId: z.string().min(1, 'Vui lòng chọn nhân sự'),
  type: z.string().min(1, 'Vui lòng chọn loại hợp đồng'),
  startDate: z.string().min(1, 'Ngày bắt đầu bắt buộc'),
  endDate: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
})

