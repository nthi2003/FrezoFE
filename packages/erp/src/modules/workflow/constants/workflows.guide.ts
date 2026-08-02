import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Mẫu / Designer (tab trong /approval/flows)
 */
export const WORKFLOWS_GUIDE: PageGuideConfig = {
  title: 'Mẫu / Designer',
  subtitle:
    'Thiết kế mẫu sơ đồ nâng cao. Đơn hàng ngày duyệt ở Hộp thư duyệt; nghỉ / mua / lương gắn ở tab Luồng đang chạy.',
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
          title: 'Lưu template — rồi gắn Leave ở tab Luồng đang chạy',
          description:
            'Tab này lưu mẫu thiết kế. Đơn nghỉ thật chỉ chạy khi Admin kích hoạt luồng tại tab Luồng đang chạy.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Tránh nhầm chỗ',
      tips: [
        'Cần duyệt đơn hôm nay → mở Hộp thư duyệt.',
        'Nghỉ phép / mua hàng / lương: gắn tại tab Luồng đang chạy (badge Áp dụng) — không theo gallery ở đây.',
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
        { label: 'Cấu hình luồng duyệt (Docs)', href: '/docs/guide-approval-flows' },
        { label: 'Gắn 3 luồng FTECH', href: '/docs/guide-approval-attach' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
        { label: 'Luồng đang chạy', href: '/approval/flows' },
      ],
    },
  ],
}
