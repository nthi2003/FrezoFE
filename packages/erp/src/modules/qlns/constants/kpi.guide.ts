import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — KPI/OKR (khớp /docs/guide-hr-kpi) */
export const KPI_GUIDE: PageGuideConfig = {
  title: 'KPI & OKR',
  subtitle:
    'Đặt mục tiêu đầu kỳ, check-in giữa kỳ, đánh giá cuối kỳ — xét thưởng hoặc lập kế hoạch đào tạo.',
  docHref: '/docs/guide-hr-kpi',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 4 bước',
      steps: [
        {
          title: 'Đặt mục tiêu KPI/OKR',
          description: 'Đầu kỳ — thống nhất với quản lý: mục tiêu + Key Results có số đo.',
        },
        {
          title: 'Theo dõi tiến độ giữa kỳ',
          description: 'Check-in định kỳ với QLTT — cập nhật % hoàn thành trên từng KR.',
        },
        {
          title: 'Đánh giá cuối kỳ',
          description:
            'Tự đánh giá + QL đánh giá. Đạt/vượt → xét thưởng, thăng tiến · Chưa đạt → kế hoạch đào tạo.',
        },
        {
          title: 'Cập nhật hồ sơ nhân viên',
          description: 'Ghi nhận lộ trình phát triển tiếp theo trên hồ sơ Person.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-hr-kpi' },
        { label: 'Đánh giá hiệu suất', href: '/qlns/performance-reviews' },
        { label: 'Quản lý nhân viên', href: '/qlns/persons' },
      ],
    },
  ],
}
