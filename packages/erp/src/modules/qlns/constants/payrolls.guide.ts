import type { PageGuideConfig } from '@frezo/ui'

export const PAYROLLS_GUIDE: PageGuideConfig = {
  title: 'Bảng lương',
  subtitle:
    'Bước 3–5 luồng Chấm công & Lương: tổng hợp công → tính lương → duyệt & chi trả.',
  docHref: '/docs/guide-hr-payroll',
  sections: [
    {
      type: 'steps',
      heading: 'Luồng lương (bước 3–5)',
      steps: [
        {
          title: 'Tổng hợp công cuối tháng',
          description:
            'Hoàn tất chấm công & duyệt nghỉ ở màn Chấm công — khoá dữ liệu trước khi tính.',
        },
        {
          title: 'Tính lương',
          description:
            'Chọn kỳ → "Tính lương kỳ này" — LCB + phụ cấp − khấu trừ BHXH. Thêm thưởng KPI nếu có.',
        },
        {
          title: 'Duyệt & chi trả lương',
          description:
            'Khoá kỳ · Approval → Chốt lương → Đánh dấu đã thanh toán · gửi phiếu lương.',
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
