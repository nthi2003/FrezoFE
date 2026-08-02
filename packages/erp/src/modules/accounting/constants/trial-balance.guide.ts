import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn ngắn — Bảng cân đối thử (Trial Balance) */
export const TRIAL_BALANCE_GUIDE: PageGuideConfig = {
  title: 'Bảng cân đối thử',
  subtitle:
    'Tổng hợp số dư đầu kỳ — phát sinh trong kỳ — số dư cuối kỳ theo từng tài khoản; dùng để kiểm tra sổ có cân Nợ = Có.',
  sections: [
    {
      type: 'tips',
      heading: 'Đọc bảng nhanh',
      tips: [
        'Nợ đầu / Có đầu: số dư đầu kỳ của tài khoản.',
        'PS Nợ / PS Có: phát sinh (ghi sổ) trong kỳ đang chọn.',
        'Nợ cuối / Có cuối: số dư cuối kỳ sau khi cộng phát sinh.',
        'KPI phía trên: tổng toàn bảng — kỳ cân khi Tổng PS Nợ = Tổng PS Có.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
        { label: 'Sổ cái', href: '/accounting/ledger' },
        { label: 'Báo cáo tài chính', href: '/accounting/financial-statements' },
      ],
    },
  ],
}
