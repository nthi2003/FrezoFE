import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Nghỉ việc / Offboarding (khớp /docs/guide-hr-offboarding) */
export const OFFBOARDING_GUIDE: PageGuideConfig = {
  title: 'Nghỉ việc & offboarding',
  subtitle:
    'Đề xuất nghỉ → duyệt timeline → bàn giao tài sản → chốt lương → thu hồi tài khoản & lưu hồ sơ.',
  docHref: '/docs/guide-hr-offboarding',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 5 bước',
      steps: [
        {
          title: 'Đề xuất nghỉ việc',
          description: 'Nhân viên hoặc công ty khởi tạo — ghi rõ ngày dự kiến nghỉ và lý do.',
        },
        {
          title: 'Duyệt đơn & thời gian bàn giao',
          description: 'QLTT và HR phê duyệt ngày làm việc cuối + checklist bàn giao.',
        },
        {
          title: 'Bàn giao công việc & tài sản',
          description: 'Laptop, thẻ ra vào, tài liệu — xác nhận tại module Tài sản nếu có.',
        },
        {
          title: 'Chốt lương & quyết toán',
          description: 'Lương tháng cuối, phép năm còn lại, trợ cấp thôi việc (nếu áp dụng).',
        },
        {
          title: 'Thu hồi tài khoản & lưu hồ sơ',
          description: 'Vô hiệu hóa user ERP, lưu hồ sơ cựu nhân viên — Person chuyển Không hoạt động.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý',
      tips: [
        'Không xóa Person có lịch sử lương — chỉ deactivate.',
        'Khóa user tại QTHT → Người dùng, không chỉ đổi trạng thái Person.',
        'Chốt bảng lương tháng cuối trước khi archive hồ sơ.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-hr-offboarding' },
        { label: 'Bảng lương', href: '/qlns/payroll?tab=payrolls' },
        { label: 'Quản lý tài khoản', href: '/qtht/users' },
      ],
    },
  ],
}
