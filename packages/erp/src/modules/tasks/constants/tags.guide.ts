import type { PageGuideConfig } from '@frezo/ui'

export const TAGS_GUIDE: PageGuideConfig = {
  title: 'Thẻ phân loại',
  subtitle: 'Nhãn màu gắn lên giao việc — lọc nhanh theo mức ưu tiên, phòng ban hoặc kỹ năng.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách dùng',
      steps: [
        {
          title: 'Tạo thẻ mới',
          description: 'Bấm «Thêm thẻ» → đặt tên tiếng Việt, chọn nhóm và màu. Mã hệ thống tự gợi ý từ tên.',
        },
        {
          title: 'Gắn thẻ vào giao việc',
          description: 'Mở form giao việc và chọn thẻ phù hợp. Một việc có thể gắn nhiều thẻ.',
        },
        {
          title: 'Lọc theo nhóm',
          description: 'Dùng thanh lọc trên trang để xem thẻ theo Ưu tiên / Phòng ban / Kỹ năng…',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo',
      tips: [
        'Đặt tên ngắn, dễ nhận diện trên thẻ (VD: Gấp, Theo dõi).',
        'Ẩn hoặc xoá thẻ không dùng để danh sách gọn hơn.',
      ],
    },
  ],
}
