// ============================================================
// Docs registry — markdown MVP (Vite ?raw)
// FR-DOC-01/02: EU voice. FR-DOC-03/04 (BE CMS Guide store) — agent khác; không đụng API ở đây.
// FR-UX-17: 5 guide top first-screen (Payroll, Leave, Approval, Attendance, Hire).
// ============================================================

import gettingStarted from './getting-started.md?raw'
import menuGuide from './menu-guide.md?raw'
import sprintChangelog from './sprint-changelog.md?raw'
import guideWorkflows from './guide-workflows.md?raw'
import guideApprovalAttach from './guide-approval-attach.md?raw'
import guideQlts from './guide-qlts.md?raw'
import guideAssetAssign from './guide-asset-assign.md?raw'
import guideDepreciation from './guide-depreciation.md?raw'
import guideArticles from './guide-articles.md?raw'
import guideAttendanceSettings from './guide-attendance-settings.md?raw'
import guidePayroll from './guide-payroll.md?raw'
import guideLeave from './guide-leave.md?raw'
import guideApprovalInbox from './guide-approval-inbox.md?raw'
import guideHire from './guide-hire.md?raw'

export type DocAudience = 'eu' | 'it'

export interface DocMeta {
  slug: string
  title: string
  description: string
  order: number
  body: string
  /** eu = hub user; it = Cho IT (ẩn khỏi list EU mặc định) */
  audience?: DocAudience
}

const DOC_ENTRIES: DocMeta[] = [
  {
    slug: 'getting-started',
    title: 'Bắt đầu',
    description: 'Đăng nhập, tìm trang và biết hôm nay làm việc gì trước.',
    order: 1,
    audience: 'eu',
    body: gettingStarted,
  },
  {
    slug: 'menu-guide',
    title: 'Hướng dẫn menu',
    description: 'Menu bên trái nghĩa là gì — mở nhóm, tìm trang, mở Tài liệu.',
    order: 2,
    audience: 'eu',
    body: menuGuide,
  },
  {
    slug: 'guide-payroll',
    title: 'Bảng lương',
    description: 'Tính lương kỳ này, xem người bị bỏ qua, rồi gửi duyệt / chi trả.',
    order: 3,
    audience: 'eu',
    body: guidePayroll,
  },
  {
    slug: 'guide-leave',
    title: 'Xin nghỉ phép',
    description: 'Tạo đơn nghỉ, theo dõi duyệt trên web hoặc app Mobile.',
    order: 4,
    audience: 'eu',
    body: guideLeave,
  },
  {
    slug: 'guide-approval-inbox',
    title: 'Hộp thư duyệt',
    description: 'Duyệt hoặc từ chối đơn đang chờ — từng đơn hoặc hàng loạt.',
    order: 5,
    audience: 'eu',
    body: guideApprovalInbox,
  },
  {
    slug: 'guide-attendance-settings',
    title: 'Chấm công GPS / WiFi',
    description: 'Admin đặt vị trí văn phòng và WiFi để Mobile check-in đúng chỗ.',
    order: 6,
    audience: 'eu',
    body: guideAttendanceSettings,
  },
  {
    slug: 'guide-hire',
    title: 'Tuyển dụng & nhận việc',
    description: 'Từ ứng viên trúng tuyển đến hồ sơ Person và checklist onboarding.',
    order: 7,
    audience: 'eu',
    body: guideHire,
  },
  {
    slug: 'guide-workflows',
    title: 'Quy trình duyệt',
    description: 'Chọn đúng chỗ: Hộp thư duyệt, Cấu hình luồng duyệt, hay Thiết kế quy trình.',
    order: 8,
    audience: 'eu',
    body: guideWorkflows,
  },
  {
    slug: 'guide-approval-attach',
    title: 'Gắn luồng duyệt vào nghỉ phép',
    description: 'Admin kích hoạt luồng Nghỉ phép, xem badge Áp dụng, rồi kiểm chứng ở Hộp thư duyệt.',
    order: 9,
    audience: 'eu',
    body: guideApprovalAttach,
  },
  {
    slug: 'guide-qlts',
    title: 'Quản lý tài sản',
    description: 'Thêm tài sản, cấp phát, duyệt yêu cầu rồi bàn giao cho nhân viên.',
    order: 10,
    audience: 'eu',
    body: guideQlts,
  },
  {
    slug: 'guide-asset-assign',
    title: 'Yêu cầu cấp phát tài sản',
    description: 'Gửi yêu cầu từ tab Tài sản → Cấp phát; duyệt ở tab Yêu cầu hoặc Hộp thư duyệt.',
    order: 11,
    audience: 'eu',
    body: guideAssetAssign,
  },
  {
    slug: 'guide-depreciation',
    title: 'Khấu hao tài sản',
    description: 'Sinh lịch trên tài sản, xem trước tháng và ghi sổ khấu hao.',
    order: 12,
    audience: 'eu',
    body: guideDepreciation,
  },
  {
    slug: 'guide-articles',
    title: 'Bài viết nội bộ',
    description: 'Tạo nháp, gửi duyệt và xuất bản tin nội bộ — mã bài tự cấp.',
    order: 13,
    audience: 'eu',
    body: guideArticles,
  },
  {
    slug: 'sprint-changelog',
    title: 'Changelog (Cho IT)',
    description: 'Ghi chú sprint / ticket nội bộ — không phải hướng dẫn thao tác hàng ngày.',
    order: 99,
    audience: 'it',
    body: sprintChangelog,
  },
]

export const DOCS: DocMeta[] = [...DOC_ENTRIES].sort((a, b) => a.order - b.order)

/** Hub /docs mặc định: chỉ bài cho end user */
export const EU_DOCS: DocMeta[] = DOCS.filter((d) => (d.audience ?? 'eu') === 'eu')

export function getDocBySlug(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug)
}
