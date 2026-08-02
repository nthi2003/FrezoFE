import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Onboarding / Thử việc (khớp /docs/guide-hr-onboarding) */
export const ONBOARDING_GUIDE: PageGuideConfig = {
  title: 'Onboarding & thử việc',
  subtitle:
    'Cấp tài khoản, đào tạo, bàn giao mentor — đánh giá cuối kỳ thử việc trước khi ký HĐ chính thức.',
  docHref: '/docs/guide-hr-onboarding',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 4 bước',
      steps: [
        {
          title: 'Cấp tài khoản & thiết bị',
          description:
            'Email công ty, máy tính, thẻ ra vào. Tài khoản ERP do QTHT tạo tại Người dùng (policy LNK-06).',
        },
        {
          title: 'Đào tạo hội nhập',
          description: 'Văn hóa, quy trình nội bộ, an toàn lao động — checklist template onboarding.',
        },
        {
          title: 'Bàn giao công việc & mentor',
          description: 'Quản lý trực tiếp gán mentor theo sát công việc thực tế.',
        },
        {
          title: 'Đánh giá kết thúc thử việc',
          description:
            'QLTT đánh giá → Đạt: ký HĐ chính thức · Không đạt: chấm dứt HĐ thử việc.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo vận hành',
      tips: [
        'Tạo template checklist trước kỳ tuyển — gán Person ngay ngày vào làm.',
        'Theo dõi % tiến độ ở bước 3 — HR nhắc mentor nếu quá 7 ngày chưa cập nhật.',
        'Kết thúc thử việc: chuyển sang Hợp đồng lao động kích hoạt trước khi tính lương chính thức.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-hr-onboarding' },
        { label: 'Tuyển dụng & nhận việc', href: '/docs/guide-hire' },
        { label: 'Hợp đồng lao động', href: '/qlns/contract' },
      ],
    },
  ],
}
