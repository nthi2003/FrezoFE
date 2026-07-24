import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Thiết kế quy trình (giọng EU, khớp /docs/guide-workflows)
 */
export const WORKFLOWS_GUIDE: PageGuideConfig = {
  title: 'Thiết kế quy trình',
  subtitle:
    'Cấu hình các bước duyệt. Đơn hàng ngày vẫn duyệt ở Hộp thư duyệt — không mở trang này chỉ để duyệt.',
  docHref: '/docs/guide-workflows',
  sections: [
    {
      type: 'steps',
      heading: 'Cấu hình nhanh',
      steps: [
        {
          title: 'Ưu tiên Copy quy trình gần giống',
          description:
            'Bấm Copy → đặt tên dễ hiểu → chỉnh từng bước. An toàn hơn tạo từ đầu.',
        },
        {
          title: 'Đặt tên + chọn đúng phần việc',
          description:
            'Ví dụ “Nghỉ phép — quản lý rồi HR”. Chọn đúng loại nghiệp vụ (nghỉ phép, tài sản…).',
        },
        {
          title: 'Thêm ít nhất 1 bước duyệt',
          description:
            'Mỗi bước: tên rõ (ví dụ “Quản lý trực tiếp”) và chọn ai duyệt — theo vai trò hoặc theo người cụ thể.',
        },
        {
          title: 'Lưu template — rồi gắn Leave ở chỗ khác',
          description:
            'Trang này lưu mẫu thiết kế. Đơn nghỉ thật chỉ chạy khi Admin kích hoạt luồng tại Cấu hình luồng duyệt.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Tránh nhầm chỗ',
      tips: [
        'Cần duyệt đơn hôm nay → mở Hộp thư duyệt.',
        'Nghỉ phép / mua hàng / lương: gắn tại Cấu hình luồng duyệt (badge Áp dụng) — không theo gallery ở đây.',
        'Đừng tạo quy trình thứ hai cho cùng loại đơn nếu đã có luồng đang chạy — hỏi BA trước.',
        'Trước khi Lưu: mỗi bước đã chọn đúng người / vai trò tồn tại.',
        'Copy rồi sửa nhẹ thường an toàn hơn tạo mới hoàn toàn.',
      ],
    },
    {
      type: 'links',
      heading: 'Tài liệu & liên quan',
      links: [
        { label: 'Xem hướng dẫn đầy đủ', href: '/docs/guide-workflows' },
        { label: 'Gắn luồng vào nghỉ phép', href: '/docs/guide-approval-attach' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
        { label: 'Cấu hình luồng duyệt', href: '/approval/flows' },
      ],
    },
  ],
}
