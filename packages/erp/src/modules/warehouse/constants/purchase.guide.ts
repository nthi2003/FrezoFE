import type { PageGuideConfig } from '@frezo/ui'



export const PURCHASE_REQUESTS_GUIDE: PageGuideConfig = {

  title: 'Yêu cầu mua hàng',

  subtitle:

    'Tạo từ cảnh báo tồn, duyệt rồi tạo đơn mua hàng.',

  docHref: '/docs/guide-warehouse-reorder-rules',

  sections: [

    {

      type: 'steps',

      heading: '3 bước cho EU',

      steps: [

        {

          title: '1. Tạo yêu cầu mua',

          description:

            'Trên Cảnh báo tồn, chọn các dòng cùng NCC → Tạo yêu cầu mua.',

        },

        {

          title: '2. Gửi duyệt',

          description:

            'Mở yêu cầu nháp → Gửi duyệt → theo dõi / duyệt ở Hộp thư duyệt.',

        },

        {

          title: '3. Tạo đơn mua hàng → Nhận hàng',

          description:

            'Khi trạng thái Đã duyệt → bấm Tạo đơn mua hàng → xác nhận đơn → nhận hàng bằng phiếu nhập kho.',

        },

      ],

    },

    {

      type: 'tips',

      heading: 'Lưu ý',

      tips: [

        'Đơn mua hàng tạo từ yêu cầu đã duyệt — chọn yêu cầu APPROVED → Tạo đơn mua hàng.',

        'Yêu cầu đã duyệt chưa làm tồn tăng — phải nhập kho bằng phiếu nhập mới cộng tồn.',

        'Một yêu cầu chỉ nên gom hàng cùng nhà cung cấp.',

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

  subtitle:

    'Đặt hàng NCC sau yêu cầu mua đã duyệt, nhận hàng bằng phiếu nhập kho.',

  docHref: '/docs/guide-warehouse-grn-gin',

  sections: [

    {

      type: 'steps',

      heading: 'Luồng làm việc',

      steps: [

        {

          title: 'Tạo từ yêu cầu mua',

          description:

            'Mở yêu cầu đã duyệt → Tạo đơn mua hàng.',

        },

        {

          title: 'Xác nhận đơn',

          description: 'Xác nhận đơn khi chốt đặt hàng với NCC.',

        },

        {

          title: 'Nhận hàng',

          description:

            'Khi hàng về → Tạo phiếu nhập từ đơn mua → Xác nhận nhập kho.',

        },

      ],

    },

    {

      type: 'links',

      heading: 'Liên quan',

      links: [

        { label: 'Yêu cầu mua hàng', href: '/warehouse/purchase-requests' },

        { label: 'Phiếu nhập kho', href: '/warehouse/grn' },

      ],

    },

  ],

}

