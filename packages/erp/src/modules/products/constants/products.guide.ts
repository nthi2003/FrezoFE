import type { PageGuideConfig } from '@frezo/ui'

export const PRODUCTS_GUIDE: PageGuideConfig = {
  title: 'Sản phẩm',
  subtitle:
    'Quản lý catalog sản phẩm, giá bán, danh mục và cấu hình cảnh báo tồn kho / hạn sử dụng.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Thêm loại sản phẩm trước',
          description:
            'Vào Danh mục → "Loại sản phẩm" để thêm nhóm (Rau củ, Trái cây, Hải sản...) trước khi thêm sản phẩm.',
        },
        {
          title: 'Tạo sản phẩm với đầy đủ meta',
          description:
            'Bấm "Thêm sản phẩm", chọn danh mục, upload ảnh, đặt giá + ngưỡng cảnh báo tồn/hạn dùng.',
        },
        {
          title: 'Cấu hình cảnh báo tồn kho',
          description:
            'Ngưỡng "warningThreshold" và "expiryAlertDays" giúp Warehouse tự động gửi alert khi hàng sắp hết / sắp hỏng.',
        },
        {
          title: 'Cập nhật giá hàng loạt',
          description:
            'Chọn nhiều sản phẩm bằng checkbox → thao tác "Đổi giá hàng loạt" ở toolbar (dùng khi có biến động thị trường).',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'Xem chế độ Grid (thẻ ảnh lớn) khi cần duyệt catalog nhanh, chế độ Table khi cần so sánh giá / trạng thái theo cột.',
        'Đánh dấu "NEW" cho sản phẩm mới trong 30 ngày để marketing ưu tiên push.',
        'Ảnh sản phẩm nên vuông (1:1), tối thiểu 800×800 để hiển thị sắc nét ở cả Grid và POS.',
      ],
    },
    {
      type: 'notes',
      heading: 'Trạng thái',
      notes:
        'Sản phẩm ngừng kinh doanh vẫn xem được trong lịch sử đơn hàng, chỉ không hiển thị ở POS. Xóa vĩnh viễn chỉ nên dùng cho hàng test — mất dấu vết đơn cũ.',
    },
  ],
}
