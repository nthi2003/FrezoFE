import type { PageGuideConfig } from '@frezo/ui'

export const MEETINGS_GUIDE: PageGuideConfig = {
  title: 'Lịch họp',
  subtitle: 'Cuộc họp gắn với cơ hội bán hoặc khách hàng — theo dõi thời gian và trạng thái.',
  sections: [
    {
      type: 'steps',
      heading: 'Cách dùng',
      steps: [
        {
          title: 'Tạo cuộc họp',
          description: 'Nhập tiêu đề, thời gian bắt đầu/kết thúc, địa điểm. Có thể gắn mã cơ hội bán hoặc khách hàng.',
        },
        {
          title: 'Huỷ cuộc họp',
          description: 'Bấm «Huỷ» trên dòng còn hiệu lực — xác nhận trước khi huỷ.',
        },
      ],
    },
  ],
}
