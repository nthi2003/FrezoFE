import type { PageGuideConfig } from '@frezo/ui'

export const TICKETS_GUIDE: PageGuideConfig = {
  title: 'Giao việc',
  subtitle:
    'Bảng trạng thái — kéo thả đổi tiến độ, theo dõi hạn và người thực hiện trên từng thẻ.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Tạo từ nút «Thêm giao việc»',
          description:
            'Chọn danh mục (Lỗi / Tính năng / Hỗ trợ — quản lý tại Danh mục giao việc), mức ưu tiên và người thực hiện. Đặt hạn để theo dõi deadline.',
        },
        {
          title: 'Kéo thả để đổi trạng thái',
          description:
            'Từ cột «Mở» → «Đang xử lý» khi bắt đầu làm, → «Đã giải quyết» khi hoàn thành.',
        },
        {
          title: 'Đọc thẻ nhanh',
          description:
            'Mã / danh mục / ưu tiên, thanh tiến độ, người được giao, bình luận. Menu ⋯ để sửa / bình luận / xoá.',
        },
        {
          title: 'Chuyển sang xem Lịch',
          description:
            'Xem lịch tuần/tháng theo ngày hạn. Kéo thẻ sang ngày mới để đổi hạn hoàn thành.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng nhanh',
      tips: [
        'Bật lọc «Của tôi» để tập trung vào việc được giao.',
        'Đặt hạn hợp lý — thiếu hạn dễ bỏ quên; chỉ số «Quá hạn» trên đầu trang giúp quét nhanh.',
        'Dùng thẻ phân loại để lọc theo nhóm (ưu tiên, phòng ban…).',
      ],
    },
  ],
}
