import type { PageGuideConfig } from '@frezo/ui'

export const LEADS_GUIDE: PageGuideConfig = {
  title: 'Khách tiềm năng',
  subtitle: 'Theo dõi liên hệ mới và chuyển thành cơ hội bán khi đủ điều kiện.',
  sections: [
    {
      type: 'steps',
      heading: 'Lộ trình chuẩn',
      steps: [
        {
          title: 'Thêm khách tiềm năng',
          description: 'Nhập họ tên (bắt buộc), SĐT/email/công ty và nguồn (Facebook, giới thiệu, web…).',
        },
        {
          title: 'Cập nhật trạng thái',
          description: 'Mới → Đã liên hệ → Đủ điều kiện. Loại bỏ nếu không phù hợp.',
        },
        {
          title: 'Chuyển thành cơ hội bán',
          description: 'Bấm «Chuyển đổi» trên dòng còn mở — hệ thống tạo cơ hội và mở phễu bán hàng.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo',
      tips: [
        'Điểm cao (≥80) nên liên hệ sớm; điểm thấp cần bổ sung thông tin.',
        'Dùng bộ lọc trạng thái để tập trung vào nhóm đang nuôi dưỡng.',
      ],
    },
  ],
}
