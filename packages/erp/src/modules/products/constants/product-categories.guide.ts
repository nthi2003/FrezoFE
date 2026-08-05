import type { PageGuideConfig } from '@frezo/ui'

export const PRODUCT_CATEGORIES_GUIDE: PageGuideConfig = {
  title: 'Loại sản phẩm',
  subtitle:
    'Danh mục loại dùng chung khi tạo sản phẩm, lọc catalog và báo cáo kho / bán hàng.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Thêm loại trước khi tạo sản phẩm',
          description:
            'Tạo nhóm (Rau củ, Trái cây, Hải sản…) tại đây, rồi chọn loại khi thêm sản phẩm ở trang Sản phẩm.',
        },
        {
          title: 'Đặt mã ổn định',
          description:
            'Mã viết HOA, không dấu — tránh đổi sau khi đã gắn vào sản phẩm hoặc phiếu kho.',
        },
        {
          title: 'Tắt thay vì xóa khi đang dùng',
          description:
            'Nếu loại đã có sản phẩm, nên tắt kích hoạt thay vì xóa để giữ lịch sử đơn hàng / tồn kho.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng',
      tips: [
        'Dùng bộ lọc trạng thái để xem nhanh loại đang kích hoạt hoặc đã tắt.',
        'Tên viết tắt ngắn giúp hiển thị gọn trên bảng sản phẩm và POS.',
      ],
    },
  ],
}
