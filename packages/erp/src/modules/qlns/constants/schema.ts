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

// ============================================================
// LEAVE REQUEST — workflow 2 tầng (Manager → HR)
// ============================================================
// Loại nghỉ phổ biến ở VN (khớp với Bộ Luật Lao Động):
//   ANNUAL: nghỉ phép năm có lương
//   SICK: nghỉ ốm (có giấy bệnh)
//   UNPAID: nghỉ không lương
//   MARRIAGE: cưới hỏi (3 ngày)
//   BEREAVEMENT: hiếu (3 ngày)
//   MATERNITY: thai sản (6 tháng nữ, 5-14 ngày nam)
//   PATERNITY: nghỉ khi vợ sinh
//   OTHER: khác — bắt buộc điền chi tiết ở reason
export const LEAVE_TYPES = [
  { value: 'ANNUAL',      label: 'Phép năm',           paid: true,  color: 'blue' },
  { value: 'SICK',        label: 'Nghỉ ốm',            paid: true,  color: 'amber' },
  { value: 'UNPAID',      label: 'Không lương',        paid: false, color: 'neutral' },
  { value: 'MARRIAGE',    label: 'Kết hôn',            paid: true,  color: 'rose' },
  { value: 'BEREAVEMENT', label: 'Hiếu',               paid: true,  color: 'neutral' },
  { value: 'MATERNITY',   label: 'Thai sản',           paid: true,  color: 'pink' },
  { value: 'PATERNITY',   label: 'Vợ sinh',            paid: true,  color: 'cyan' },
  { value: 'OTHER',       label: 'Khác',               paid: false, color: 'violet' },
] as const

export type LeaveTypeCode = typeof LEAVE_TYPES[number]['value']

/**
 * Schema đầy đủ cho LeavesPage mới — bao gồm personId, contractId, leaveType.
 * Có refinement kiểm tra endDate >= startDate.
 */
export const leaveRequestFullSchema = z
  .object({
    personId: z.string().min(1, 'Vui lòng chọn nhân viên'),
    contractId: z.string().min(1, 'Nhân viên chưa có hợp đồng active'),
    leaveType: z.enum(
      LEAVE_TYPES.map((t) => t.value) as [LeaveTypeCode, ...LeaveTypeCode[]],
      { errorMap: () => ({ message: 'Vui lòng chọn loại nghỉ phép' }) },
    ),
    startDate: z.string().min(1, 'Ngày bắt đầu bắt buộc'),
    endDate: z.string().min(1, 'Ngày kết thúc bắt buộc'),
    durationDays: z.number().positive('Số ngày phải > 0').optional(),
    reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(1000, 'Tối đa 1000 ký tự'),
    attachmentUrl: z.string().url('Link file không hợp lệ').optional().or(z.literal('')),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    message: 'Ngày kết thúc phải >= ngày bắt đầu',
    path: ['endDate'],
  })

/**
 * @deprecated schema legacy đơn giản — vẫn tồn tại cho AttendancePage cũ.
 * Preferred: {@link leaveRequestFullSchema} (dùng ở LeavesPage mới).
 */
export const leaveRequestSchema = z.object({
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự'),
  startDate: z.string(),
  endDate: z.string(),
})

export const leaveRejectSchema = z.object({
  reason: z.string().min(5, 'Lý do từ chối tối thiểu 5 ký tự').max(500, 'Tối đa 500 ký tự'),
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

