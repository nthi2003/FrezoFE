import type { PageGuideConfig } from '@frezo/ui'

export const DEALS_GUIDE: PageGuideConfig = {
  title: 'Cơ hội bán',
  subtitle: 'Phễu bán hàng dạng bảng — kéo thẻ đổi giai đoạn, kéo cột để sắp xếp thứ tự.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách dùng',
      steps: [
        {
          title: 'Chọn phễu',
          description: 'Mỗi phễu có các giai đoạn riêng. Chọn phễu phù hợp trước khi thêm cơ hội.',
        },
        {
          title: 'Thêm / kéo thẻ',
          description: 'Thêm cơ hội mới hoặc kéo thẻ sang cột khác để đổi giai đoạn. Có thể bấm mũi tên để chuyển bước kế.',
        },
        {
          title: 'Chốt thắng / thua',
          description: 'Đánh dấu đã chốt hoặc mất cơ hội kèm lý do — không còn hiện trên bảng đang mở.',
        },
      ],
    },
  ],
}
