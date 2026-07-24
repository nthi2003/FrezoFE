// ============================================================
// Docs registry — markdown MVP (Vite ?raw)
// ============================================================

import gettingStarted from './getting-started.md?raw'
import menuGuide from './menu-guide.md?raw'
import sprintChangelog from './sprint-changelog.md?raw'
import guideWorkflows from './guide-workflows.md?raw'
import guideQlts from './guide-qlts.md?raw'
import guideDepreciation from './guide-depreciation.md?raw'
import guideArticles from './guide-articles.md?raw'
import guideAttendanceSettings from './guide-attendance-settings.md?raw'

export interface DocMeta {
  slug: string
  title: string
  description: string
  order: number
  body: string
}

export const DOCS: DocMeta[] = [
  {
    slug: 'getting-started',
    title: 'Bắt đầu',
    description: 'Đăng nhập, điều hướng và tổng quan module Frezo ERP.',
    order: 1,
    body: gettingStarted,
  },
  {
    slug: 'menu-guide',
    title: 'Hướng dẫn menu',
    description: 'Cấu trúc sidebar, nhóm theo path và tài liệu in-app.',
    order: 2,
    body: menuGuide,
  },
  {
    slug: 'guide-workflows',
    title: 'Quy trình duyệt',
    description: 'Cấu hình Workflow Definition an toàn — khác Approval Inbox.',
    order: 3,
    body: guideWorkflows,
  },
  {
    slug: 'guide-qlts',
    title: 'Quản lý tài sản',
    description: 'Cấp phát qua workflow ASSET / ASSET_TRANSFER — PageGuide /admin/qlts.',
    order: 4,
    body: guideQlts,
  },
  {
    slug: 'guide-depreciation',
    title: 'Khấu hao tài sản',
    description: 'Sinh lịch trên tài sản, xem trước kỳ và ghi sổ khấu hao định kỳ.',
    order: 5,
    body: guideDepreciation,
  },
  {
    slug: 'guide-articles',
    title: 'Bài viết (CMS)',
    description: 'Tạo nháp, mã tự sinh, gửi duyệt và xuất bản — /admin/article-management.',
    order: 6,
    body: guideArticles,
  },
  {
    slug: 'guide-attendance-settings',
    title: 'Chấm công GPS / WiFi',
    description: 'Admin-only: bán kính, SSID và preview rule — giảm Mobile check-in fail.',
    order: 7,
    body: guideAttendanceSettings,
  },
  {
    slug: 'sprint-changelog',
    title: 'Sprint changelog',
    description: 'Tính năng mới theo sprint và next steps.',
    order: 8,
    body: sprintChangelog,
  },
].sort((a, b) => a.order - b.order)

export function getDocBySlug(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug)
}
