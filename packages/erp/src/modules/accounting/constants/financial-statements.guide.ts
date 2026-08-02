import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn ngắn — Báo cáo tài chính (BCĐKT / KQKD) */
export const FINANCIAL_STATEMENTS_GUIDE: PageGuideConfig = {
  title: 'Báo cáo tài chính',
  subtitle:
    'Bảng cân đối kế toán (BCĐKT) và Báo cáo kết quả hoạt động kinh doanh (KQKD) theo kỳ kế toán đã chọn.',
  sections: [
    {
      type: 'tips',
      heading: 'Đọc báo cáo nhanh',
      tips: [
        'BCĐKT: tài sản = nguồn vốn tại thời điểm cuối kỳ (cấu trúc chỉ tiêu theo cấp).',
        'KQKD: doanh thu — chi phí — lãi/lỗ trong khoảng từ ngày → đến ngày của kỳ.',
        'Chọn năm / kỳ Tháng 1–12 trên thanh lọc — dữ liệu lấy theo startDate / endDate của kỳ.',
        'Dòng in đậm (cấp 0) là chỉ tiêu tổng hợp; dòng thụt lề là chi tiết con.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Bảng cân đối thử', href: '/accounting/trial-balance' },
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
        { label: 'Sổ cái', href: '/accounting/ledger' },
      ],
    },
  ],
}
