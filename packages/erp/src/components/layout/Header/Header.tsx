// ============================================================
// FREZO ERP — Header Component
// Breadcrumb, page title, user actions
// ============================================================

import { useMemo } from 'react'
import { Search, ChevronRight, Command } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { AppTooltip } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'
import { useCommandPaletteContext } from '@/components/shared/CommandPalette/context'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { UserAccountMenu } from '@/components/shared/UserAvatar'
import { getDocTitleBySlug } from '@/modules/docs/services/docsRegistry'

// Fallback tĩnh cho các route không có trong menu BE
const FALLBACK_LABELS: Record<string, string> = {
  '/':             'Trang chủ',
  '/home':         'Trang chủ',
  '/dashboard':    'Tổng quan',
  '/docs':         'Tài liệu',
  '/bai-viet':     'Tin & bài viết',
  '/qtht':         'Hệ thống',
  '/qtht/users':   'Người dùng',
  '/qtht/roles':   'Vai trò',
  '/qtht/menus':   'Menu',
  '/qtht/organizations': 'Tổ chức',
  '/qtht/departments':   'Phòng ban',
  '/qtht/permissions':   'Quyền hạn',
  '/qtht/security':      'Bảo mật',
  '/qtht/settings':      'Cài đặt',
  '/qtht/tien-ich':      'Tiện ích',
  '/qtht/apilogs':       'Lịch sử API',
  '/qtht/landing-config': 'Landing Config',
  '/admin':        'Quản trị',
  '/admin/article-management': 'Bài viết',
  '/admin/attendance': 'Chấm công & nghỉ phép',
  '/email':        'Email',
  '/email/config': 'Cấu hình Email',
  '/email/template': 'Mẫu Email',
  '/email/group': 'Nhóm Email',
  '/email/compose': 'Soạn Email',
  '/email/inbox': 'Hộp thư đến',

  '/qlns':         'Nhân sự',
  '/qlns/persons': 'Nhân viên',
  '/qlns/people': 'Hồ sơ & tổ chức',
  '/qlns/settings': 'Thiết lập hồ sơ nhân sự',
  '/qlns/time': 'Chấm công & nghỉ phép',
  '/qlns/payroll': 'Lương & đãi ngộ',
  '/qlns/performance': 'Hiệu suất',
  '/qlns/contract': 'Hợp đồng',
  '/qlns/contract/create': 'Tạo hợp đồng',
  '/qlns/payrolls': 'Bảng lương',
  '/qlns/salary-bands': 'Bậc lương',
  '/qlns/leaves':  'Nghỉ phép',
  '/customer':     'Khách hàng',
  '/product':      'Sản phẩm',
  '/task':         'Công việc',
  '/task/categories': 'Danh mục ticket',
  '/profile':      'Hồ sơ',
  '/notifications': 'Thông báo',

  '/accounting': 'Sổ & chứng từ',
  '/accounting/reports': 'Báo cáo kế toán',
  '/accounting/setup': 'Thiết lập kế toán',
  '/accounting/accounts': 'Hệ thống tài khoản',
  '/accounting/journals': 'Sổ nhật ký',
  '/accounting/ledger': 'Sổ cái',
  '/accounting/trial-balance': 'Bảng cân đối thử',
  '/accounting/financial-statements': 'Báo cáo tài chính',
  '/accounting/settings': 'Cài đặt kế toán',
  '/accounting/periods': 'Kỳ kế toán',
  '/accounting/bank-reconciliation': 'Đối chiếu ngân hàng',
  '/accounting/bank-reconciliation/import': 'Import sao kê',
  '/accounting/tax': 'Kê khai thuế',

  '/approval': 'Phê duyệt',
  '/approval/inbox': 'Hộp thư duyệt',
  '/approval/flows': 'Cấu hình luồng duyệt',
  '/qtht/workflows': 'Mẫu / Designer',
  '/qtht/workflows/templates': 'Thư viện mẫu workflow',
}

// Flatten menuTree thành map feUrl → name (tiếng Việt từ BE)
function flattenMenuTree(nodes: MenuTreeNode[], map: Map<string, string> = new Map()) {
  for (const node of nodes) {
    if (node.feUrl) map.set(node.feUrl, node.name)
    if (node.children?.length) flattenMenuTree(node.children, map)
  }
  return map
}

function buildBreadcrumbs(pathname: string, labelMap: Map<string, string>) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; path: string }[] = [
    { label: 'Trang chủ', path: '/' },
  ]

  let cumPath = ''
  parts.forEach((part) => {
    cumPath += '/' + part
    let label = labelMap.get(cumPath) || FALLBACK_LABELS[cumPath]
    if (!label && cumPath.startsWith('/docs/')) {
      label = getDocTitleBySlug(cumPath.slice('/docs/'.length))
    }
    // /bai-viet/:id — tránh hiện raw id trên breadcrumb; tiêu đề bài nằm trong page
    if (!label && cumPath.startsWith('/bai-viet/')) {
      label = 'Bài viết'
    }
    crumbs.push({ label: label || part, path: cumPath })
  })

  return crumbs
}

export function Header() {
  const { pathname } = useLocation()
  const { menuTree } = useMenus()
  const commandPalette = useCommandPaletteContext()

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

  // Build label map từ menuTree (tên tiếng Việt theo feUrl)
  const labelMap = useMemo(() => flattenMenuTree(menuTree), [menuTree])

  const breadcrumbs = buildBreadcrumbs(pathname, labelMap)
  const pageTitle = labelMap.get(pathname) || FALLBACK_LABELS[pathname] || breadcrumbs[breadcrumbs.length - 1]?.label || 'Frezo ERP'

  return (
    <header className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-border shrink-0 gap-4">
      {/* Left: Breadcrumb */}
      <div className="flex flex-col min-w-0">
        <h1 className="text-base font-semibold text-neutral-800 leading-tight truncate">
          {pageTitle}
        </h1>
        <nav className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={10} />}
              <span className={i === breadcrumbs.length - 1 ? 'text-primary-600 font-medium' : ''}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Command palette trigger — Ctrl+K */}
        <AppTooltip content="Mở thanh lệnh (Ctrl+K)">
          <button
            type="button"
            onClick={commandPalette.open}
            className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-2 text-xs bg-neutral-50 border border-border rounded-lg text-neutral-500 hover:bg-white hover:border-primary-300 hover:text-neutral-700 transition-colors group"
          >
            <Search size={13} className="text-neutral-400 group-hover:text-primary-500" />
            <span className="w-32 text-left">Tìm kiếm nhanh...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono font-semibold text-neutral-500 shadow-sm">
              {isMac ? <Command size={9} /> : 'Ctrl'} K
            </kbd>
          </button>
        </AppTooltip>

        {/* Notification Bell */}
        <NotificationBell />

        <UserAccountMenu />
      </div>
    </header>
  )
}
