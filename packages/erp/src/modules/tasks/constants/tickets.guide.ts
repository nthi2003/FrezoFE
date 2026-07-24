import type { PageGuideConfig } from '@frezo/ui'

export const TICKETS_GUIDE: PageGuideConfig = {
  title: 'Giao việc (Ticket)',
  subtitle:
    'Kanban board pastel — kéo thả đổi trạng thái, theo dõi tiến độ, assignee và bình luận trên từng card.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Tạo ticket từ nút "Thêm giao việc"',
          description:
            'Chọn danh mục (Lỗi / Tính năng / Hỗ trợ — quản lý tại /task/categories), độ ưu tiên và người thực hiện. Đặt hạn (dueDate) để theo dõi deadline.',
        },
        {
          title: 'Kéo thả để đổi trạng thái',
          description:
            'Từ cột "Mở" → "Đang xử lý" khi bắt đầu làm, → "Đã giải quyết" khi hoàn thành. Backend tự lưu thời điểm chuyển.',
        },
        {
          title: 'Đọc card nhanh',
          description:
            'Tag chip (mã / danh mục / ưu tiên), thanh chấm tiến độ, avatar người được giao, icon bình luận. Menu ⋯ để sửa / bình luận / xoá.',
        },
        {
          title: 'Chuyển sang Calendar view',
          description:
            'Xem lịch tuần/tháng để nhìn workload theo ngày. Kéo card lên ngày mới để đổi dueDate.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng nhanh',
      tips: [
        'Bật filter "Của tôi" để tập trung vào ticket được giao — giảm noise trên board team.',
        'Màu nền card theo danh mục (Lỗi / Tính năng / Hỗ trợ) — soft pastel token, không đổi nghiệp vụ.',
        'Đặt dueDate hợp lý — thiếu dueDate dễ bỏ quên; KPI "Quá hạn" trên đầu trang giúp quét nhanh.',
      ],
    },
    {
      type: 'shortcuts',
      heading: 'Phím tắt',
      shortcuts: [
        { keys: ['N'], label: 'Tạo ticket mới nhanh' },
        { keys: ['M'], label: 'Toggle "Của tôi"' },
        { keys: ['1', '2', '3'], label: 'Filter theo priority (URGENT/HIGH/MEDIUM)' },
        { keys: ['V'], label: 'Chuyển Kanban ↔ Calendar' },
      ],
    },
    {
      type: 'notes',
      heading: 'Tone card & BA gap',
      notes:
        'Nền + viền trái map theo category (Lỗi → danger, Tính năng → info, Hỗ trợ → primary…). Badge priority: URGENT đỏ / HIGH cam / MEDIUM xanh dương / LOW xám. Tiến độ bar map từ status cho đến khi BE có progressPercent / checklist. Attachment count chỉ hiện khi BE trả attachmentCount.',
    },
  ],
}
