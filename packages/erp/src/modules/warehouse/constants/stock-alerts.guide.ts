import type { PageGuideConfig } from '@frezo/ui'

/** Hướng dẫn in-app — Cảnh báo tồn kho */
export const STOCK_ALERTS_GUIDE: PageGuideConfig = {
  title: 'Cảnh báo tồn kho',
  subtitle:
    'Theo dõi tồn dưới min hoặc lô cận hạn — chọn dòng cùng NCC để tạo yêu cầu mua hàng.',
  docHref: '/docs/guide-warehouse-reorder-rules',
  sections: [
    {
      type: 'steps',
      heading: 'Làm việc chính',
      steps: [
        {
          title: '1. Lọc cảnh báo',
          description:
            'Chọn Đang mở / Đã xử lý, loại (dưới min / cận hạn), kho hoặc danh mục.',
        },
        {
          title: '2. Chọn dòng cùng NCC',
          description:
            'Tick các cảnh báo cùng một nhà cung cấp — không gộp nhiều NCC trong một yêu cầu.',
        },
        {
          title: '3. Tạo yêu cầu mua hàng',
          description:
            'Bấm Tạo yêu cầu mua hàng trên thanh chọn → gửi duyệt → tạo đơn mua hàng.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý',
      tips: [
        'Bỏ qua chỉ ẩn cảnh báo — không tạo yêu cầu mua.',
        'Cảnh báo cận hạn theo lô: xem HSD / số ngày còn lại.',
        'Ngưỡng min/max cấu hình ở Quy tắc tái nhập.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Quy tắc tái nhập', href: '/warehouse/reorder-rules' },
        { label: 'Yêu cầu mua hàng', href: '/warehouse/purchase-requests' },
        { label: 'Đơn mua hàng', href: '/warehouse/purchase-orders' },
      ],
    },
  ],
}
