import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Cấu hình luồng duyệt (/approval/flows)
 */
export const APPROVAL_FLOWS_GUIDE: PageGuideConfig = {
  title: 'Cấu hình luồng duyệt',
  subtitle:
    'Gắn draft bước duyệt vào Nghỉ phép / Mua hàng / Lương. Thiết kế quy trình (QTHT) không tự chạy thay trang này.',
  docHref: '/docs/guide-approval-attach',
  sections: [
    {
      type: 'steps',
      heading: 'Gắn vào Nghỉ phép',
      steps: [
        {
          title: 'Mở hoặc tạo luồng',
          description:
            'Bấm Tạo luồng mới (hoặc Sửa thẻ sẵn có). Chọn Loại đối tượng = Nghỉ phép.',
        },
        {
          title: 'Thêm bước duyệt',
          description:
            'Bấm Thêm bước · chọn vai trò (Quản lý trực tiếp, HR…) · dùng ▲▼ đổi thứ tự.',
        },
        {
          title: 'Tick Đang kích hoạt rồi lưu',
          description:
            'Chỉ một luồng Nghỉ phép được kích hoạt. Badge Áp dụng: Nghỉ phép hiện trên thẻ đang chạy.',
        },
        {
          title: 'Kiểm chứng',
          description:
            'Nhân sự → Nghỉ phép → Tạo đơn → Gửi. Mở Hộp thư duyệt: đúng số bước như draft.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Tránh nhầm',
      tips: [
        'Badge “Chưa gắn — không tự chạy” = luồng tắt hoặc không phải bản đang dùng.',
        'Sửa ở Thiết kế quy trình không đổi duyệt nghỉ — phải kích hoạt tại trang này.',
        'Thiếu User mang đúng vai trò bước → hệ thống báo lỗi, không tạo phiếu treo.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn gắn Leave (đầy đủ)', href: '/docs/guide-approval-attach' },
        { label: 'Quy trình duyệt — chọn chỗ', href: '/docs/guide-workflows' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
      ],
    },
  ],
}

/**
 * Hướng dẫn in-app — Hộp thư duyệt (giọng EU, khớp /docs/guide-approval-inbox)
 */
export const APPROVAL_INBOX_GUIDE: PageGuideConfig = {
  title: 'Hộp thư duyệt',
  subtitle: 'Duyệt đơn đang chờ bạn: nghỉ phép, mua hàng, lương…',
  docHref: '/docs/guide-approval-inbox',
  sections: [
    {
      type: 'steps',
      heading: 'Làm việc chính',
      steps: [
        {
          title: 'Mở Hộp thư duyệt',
          description:
            'Vào menu Phê duyệt → Hộp thư duyệt (hoặc lối tắt Duyệt nghỉ trên Trang chủ nếu có).',
        },
        {
          title: 'Xem đơn Chờ duyệt',
          description: 'Mỗi dòng có loại đơn, người gửi, ngày. Mở đơn để đọc chi tiết.',
        },
        {
          title: 'Duyệt hoặc Từ chối',
          description:
            'Bấm Duyệt nếu đồng ý; hoặc Từ chối và nhập lý do (bắt buộc khi từ chối). Có thể duyệt hàng loạt nếu được phép.',
        },
        {
          title: 'Thiếu đơn?',
          description:
            'Kiểm tra bộ lọc trạng thái; hoặc bạn không phải bước duyệt hiện tại. Nếu vừa gửi đơn mà lỗi “không có người duyệt” — admin cần gán Role hoặc sửa /approval/flows. Không cần mở Thiết kế quy trình chỉ để duyệt.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-approval-inbox' },
        { label: 'Cấu hình luồng duyệt', href: '/approval/flows' },
        { label: 'Thiết kế quy trình', href: '/qtht/workflows' },
      ],
    },
  ],
}
