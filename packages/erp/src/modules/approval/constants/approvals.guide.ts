import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app cho /approval/inbox
 * Phân biệt với Visual Workflow designer (/qtht/workflows).
 */
export const APPROVAL_INBOX_GUIDE: PageGuideConfig = {
  title: 'Hộp thư duyệt (Approval Inbox)',
  subtitle:
    'Duyệt đơn nghiệp vụ hàng ngày (nghỉ phép, PR, lương…). Không phải trang thiết kế template quy trình.',
  docHref: '/docs/guide-workflows',
  sections: [
    {
      type: 'notes',
      heading: 'Inbox vs Workflow designer',
      notes:
        'Hai lớp khác nhau: (1) Approval Inbox + Flows = duyệt đơn thật / cấu hình subject→flow. (2) /qtht/workflows = template visual (Admin/HR). Đơn hàng ngày vào đây — không mở Designer để “duyệt”.',
    },
    {
      type: 'steps',
      heading: 'Cách duyệt đúng',
      steps: [
        {
          title: 'Mở Hộp duyệt',
          description: 'Vào /approval/inbox — tab Chờ duyệt để xem đơn PENDING của bạn.',
        },
        {
          title: 'Duyệt hoặc từ chối',
          description: 'Approve kèm ghi chú (tuỳ chọn); Reject bắt buộc lý do ≥ 3 ký tự.',
        },
        {
          title: 'Thiếu đơn?',
          description:
            'Kiểm tra flow tại /approval/flows (subject-type đúng). Đừng cấu hình lại trên /qtht/workflows nếu module đã dùng Approval Engine.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Cấu hình Approval Flows', href: '/approval/flows' },
        { label: 'Thiết kế template quy trình (khác Inbox)', href: '/qtht/workflows' },
        { label: 'Tài liệu Workflow vs Inbox', href: '/docs/guide-workflows' },
      ],
    },
  ],
}
