import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Quy tắc tái nhập kho (giọng EU, khớp /docs/guide-warehouse-reorder-rules)
 */
export const REORDER_RULES_GUIDE: PageGuideConfig = {
  title: 'Quy tắc tái nhập kho',
  subtitle:
    'Đặt ngưỡng Min/Max theo sản phẩm và kho — hệ thống cảnh báo khi tồn dưới Min.',
  docHref: '/docs/guide-warehouse-reorder-rules',
  sections: [
    {
      type: 'steps',
      heading: 'Làm việc chính',
      steps: [
        {
          title: 'Chọn kho',
          description:
            'Dùng ô lọc góc phải: Tất cả kho hoặc Kho Hà Nội / TP.HCM / Đà Lạt.',
        },
        {
          title: 'Thêm quy tắc',
          description:
            'Bấm Thêm quy tắc → chọn kho, mã sản phẩm (vd. SP001), điền Min, Max, SL đặt lại → Thêm.',
        },
        {
          title: 'Sửa nhanh Min/Max',
          description: 'Click vào ô số trên bảng → gõ giá trị mới → click ra ngoài để lưu.',
        },
        {
          title: 'Theo dõi cảnh báo',
          description:
            'Khi tồn < Min, xem Cảnh báo tồn kho và tạo Yêu cầu mua hàng từ đó.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Ba con số',
      tips: [
        'Min — ngưỡng cảnh báo sắp thiếu (phải ≤ Max).',
        'Max — trần tồn mong muốn.',
        'SL đặt lại — gợi ý số lượng khi tạo PR từ cảnh báo.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-warehouse-reorder-rules' },
        { label: 'Cảnh báo tồn kho', href: '/warehouse/stock-alerts' },
        { label: 'Đơn hàng & tồn kho', href: '/docs/guide-warehouse-sales' },
      ],
    },
  ],
}
