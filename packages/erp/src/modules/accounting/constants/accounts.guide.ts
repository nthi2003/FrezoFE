import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn ngắn — Hệ thống tài khoản (Chart of Accounts) */
export const ACCOUNTS_GUIDE: PageGuideConfig = {
  title: 'Hệ thống tài khoản',
  subtitle:
    'Danh mục tài khoản kế toán (COA): số hiệu, loại, cấp và thuộc tính ghi sổ theo Thông tư 133 hoặc 99.',
  sections: [
    {
      type: 'tips',
      heading: 'Đọc nhanh',
      tips: [
        'Số hiệu: mã tài khoản theo chuẩn (VD: 111, 131, 511).',
        'Ghi sổ được: tài khoản chi tiết — có thể hạch toán trực tiếp.',
        'Tài khoản tổng hợp: chỉ dùng làm cha, không ghi sổ trực tiếp.',
        'Bắt buộc đối tượng: khi hạch toán phải chọn khách hàng / nhà cung cấp.',
        'Xem theo nhóm: gom theo loại 1–9; xem bảng: danh sách phẳng có phân trang.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
        { label: 'Sổ cái', href: '/accounting/ledger' },
        { label: 'Bảng cân đối thử', href: '/accounting/trial-balance' },
      ],
    },
  ],
}
