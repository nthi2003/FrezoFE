import type { PageGuideConfig } from '@frezo/ui'

export const PURCHASE_REQUESTS_GUIDE: PageGuideConfig = {
  title: 'Yêu cầu mua hàng',
  subtitle: 'Tạo từ cảnh báo tồn — gửi duyệt trước khi đặt mua.',
  docHref: '/docs/guide-warehouse-reorder-rules',
  sections: [
    {
      type: 'steps',
      heading: 'Luồng làm việc',
      steps: [
        {
          title: 'Chọn cảnh báo',
          description: 'Trên Cảnh báo tồn, chọn các dòng cùng NCC → Tạo yêu cầu mua.',
        },
        {
          title: 'Gửi duyệt',
          description: 'Mở PR nháp → Gửi duyệt → theo dõi ở Hộp thư duyệt.',
        },
        {
          title: 'Tạo đơn mua',
          description: 'Sau khi duyệt, tạo PO và nhận hàng bằng phiếu nhập kho.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý',
      tips: [
        'PR duyệt chưa làm tồn tăng — phải nhập kho (PNK) mới cộng tồn.',
        'Một PR chỉ nên gom hàng cùng nhà cung cấp.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Cảnh báo tồn', href: '/warehouse/stock-alerts' },
        { label: 'Đơn mua hàng', href: '/warehouse/purchase-orders' },
        { label: 'Phiếu nhập kho', href: '/warehouse/grn' },
      ],
    },
  ],
}

export const PURCHASE_ORDERS_GUIDE: PageGuideConfig = {
  title: 'Đơn mua hàng',
  subtitle: 'Đặt hàng NCC sau PR duyệt — nhận hàng bằng PNK.',
  docHref: '/docs/guide-warehouse-grn-gin',
  sections: [
    {
      type: 'steps',
      heading: 'Luồng làm việc',
      steps: [
        {
          title: 'Tạo từ PR',
          description: 'Mở PR đã duyệt → Tạo đơn mua (PO).',
        },
        {
          title: 'Xác nhận đơn',
          description: 'Xác nhận PO khi chốt đặt hàng với NCC.',
        },
        {
          title: 'Nhận hàng',
          description: 'Khi hàng về → Tạo PNK từ PO → Xác nhận nhập kho.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Yêu cầu mua', href: '/warehouse/purchase-requests' },
        { label: 'Phiếu nhập kho', href: '/warehouse/grn' },
      ],
    },
  ],
}
