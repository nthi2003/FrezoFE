import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Doanh thu (khớp /docs/guide-accounting-revenue) */
export const REVENUE_GUIDE: PageGuideConfig = {
  title: 'Ghi nhận doanh thu',
  subtitle:
    'Từ hoá đơn bán hàng → đối chiếu công nợ → hạch toán kỳ → báo cáo KQKD theo nguyên tắc dồn tích.',
  docHref: '/docs/guide-accounting-revenue',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 5 bước',
      steps: [
        {
          title: 'Ghi nhận đơn hàng & hoá đơn',
          description: 'Từ CRM/Deal, POS hoặc nhập tay — tạo hoá đơn DRAFT rồi phát hành ISSUED.',
        },
        {
          title: 'Đối chiếu công nợ & thanh toán',
          description: 'Thu tiền từng phần hoặc toàn phần — trạng thái PARTIALLY_PAID / PAID.',
        },
        {
          title: 'Ghi nhận doanh thu theo kỳ',
          description: 'Hạch toán vào sổ nhật ký (TK 511, 131…) — nút **Hạch toán** trên hoá đơn.',
        },
        {
          title: 'Phân bổ theo kênh & sản phẩm',
          description: 'Phân tích theo dòng SP trên hoá đơn · báo cáo theo kênh (cửa hàng/online) — P1.',
        },
        {
          title: 'Lập báo cáo doanh thu',
          description: 'KQKD, Dashboard — so sánh ngày/tuần/tháng với kỳ trước.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-accounting-revenue' },
        { label: 'Hoá đơn bán', href: '/crm/invoices' },
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
        { label: 'Bảng cân đối thử', href: '/accounting/trial-balance' },
        { label: 'Báo cáo tài chính', href: '/accounting/financial-statements' },
      ],
    },
  ],
}
