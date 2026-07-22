import type { PageGuideConfig } from '@frezo/ui'

export const PAYROLLS_GUIDE: PageGuideConfig = {
  title: 'Bảng lương',
  subtitle:
    'Vận hành lương theo chu kỳ tháng — 3 giai đoạn: Tính → Chốt → Thanh toán. Tracking tiền lương, thưởng, phụ cấp và khấu trừ.',
  sections: [
    {
      type: 'steps',
      heading: 'Chu trình xử lý lương',
      steps: [
        {
          title: 'Tính lương (Draft)',
          description:
            'Chọn kỳ lương → "Tính lương toàn bộ" — hệ thống tự lấy lương cơ bản từ hợp đồng ACTIVE, cộng công chấm được, trừ BHXH/BHYT/BHTN.',
        },
        {
          title: 'Thêm thưởng / phụ cấp',
          description:
            'Với từng bảng lương DRAFT: bấm ➕ để thêm khoản thưởng (KPI, sinh nhật, dự án...) kèm lý do — audit trail giữ nguyên.',
        },
        {
          title: 'Chốt lương (Confirmed)',
          description:
            'Sau khi review & OK: bấm ✅ để chốt. Từ trạng thái này không sửa được nữa — phải huỷ và tính lại nếu sai.',
        },
        {
          title: 'Thanh toán (Paid)',
          description:
            'Bấm 💵 khi đã chuyển khoản cho nhân viên. Bảng lương chuyển PAID, không thao tác được nữa. Xuất phiếu để gửi nhân viên qua email.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'Tính lương vào đầu tháng liền kề (ví dụ: T02 tính vào 01/T03) để có dữ liệu chấm công đầy đủ.',
        'Nếu chấm công thiếu → đơn nghỉ phép → hợp đồng → tính lại bảng. Không sửa số trực tiếp.',
        'Payslip breakdown minh bạch giúp giảm 90% khiếu nại từ nhân viên. Xuất bản PDF cá nhân cho mỗi người.',
      ],
    },
    {
      type: 'notes',
      heading: 'Cấu hình BHXH',
      notes:
        'Tỷ lệ BHXH/BHYT/BHTN của nhân viên: 8% + 1.5% + 1% = 10.5% trên mức lương đóng BH. Nhà nước quy định lương đóng tối thiểu = mức lương tối thiểu vùng (~4.96 triệu VNĐ).',
    },
  ],
}

// Bảng lương status colors
export const PAYROLL_STATUS_CONFIG = {
  DRAFT: {
    label: 'Bản nháp',
    color: 'amber' as const,
    dotColor: 'bg-amber-500',
    description: 'Đang tính toán, có thể chỉnh sửa',
  },
  CONFIRMED: {
    label: 'Đã chốt',
    color: 'blue' as const,
    dotColor: 'bg-blue-500',
    description: 'Đã lock, chờ chuyển khoản',
  },
  PAID: {
    label: 'Đã thanh toán',
    color: 'emerald' as const,
    dotColor: 'bg-emerald-500',
    description: 'Hoàn tất, đã chuyển đến nhân viên',
  },
} as const
