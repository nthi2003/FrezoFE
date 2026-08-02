import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Khấu hao tài sản (giọng EU, khớp /docs/guide-depreciation)
 */
export const DEPRECIATION_GUIDE: PageGuideConfig = {
  title: 'Khấu hao tài sản',
  subtitle:
    'Chọn tháng → xem trước tổng tiền → xác nhận ghi sổ. Chạy lại cùng tháng không ghi đôi.',
  docHref: '/docs/guide-depreciation',
  sections: [
    {
      type: 'steps',
      heading: 'Ba bước ghi sổ tháng',
      steps: [
        {
          title: '1. Sinh lịch trên tài sản',
          description:
            'Vào Danh sách tài sản → mở tài sản có giá mua → tab Khấu hao → Sinh lịch (thường 36 tháng, phương pháp Đường thẳng).',
        },
        {
          title: '2. Chọn kỳ và xem trước',
          description:
            'Trên trang này chọn Năm / Tháng → bấm Xem trước / Tính khấu hao để kiểm tra tổng tiền và số dòng.',
        },
        {
          title: '3. Ghi sổ',
          description:
            'Bấm Ghi sổ → đọc hộp xác nhận → xác nhận. Hệ thống tạo chứng từ kế toán. Kỳ đã ghi sẽ khoá nút.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý nhanh',
      tips: [
        'Kỳ kế toán đã đóng thì không ghi sổ được — chọn tháng khác hoặc nhờ kế toán mở lại kỳ.',
        'Không thấy nút Ghi sổ / Sinh lịch → chưa có quyền — nhờ Admin.',
        'Kỳ đã ghi sổ: chạy lại sẽ báo đã ghi và không tạo chứng từ mới.',
        'Bảng Dòng khấu hao hiển thị mã, tên, nguyên giá, khấu hao kỳ và giá trị còn lại.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-depreciation' },
        { label: 'Danh sách tài sản', href: '/admin/qlts' },
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
      ],
    },
  ],
}
