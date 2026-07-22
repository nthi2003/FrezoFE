// ============================================================
// FREZO ERP — Header Component
// Breadcrumb, page title, user actions
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronRight, User, LogOut, Command } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'
import { useCommandPaletteContext } from '@/components/shared/CommandPalette/context'
import { NotificationBell } from '@/components/shared/NotificationBell'
import { DOCS, getDocBySlug } from '@/docs'

// Fallback tĩnh cho các route không có trong menu BE
const FALLBACK_LABELS: Record<string, string> = {
  '/':             'Dashboard',
  '/dashboard':    'Dashboard',
  '/docs':         'Tài liệu',
  '/qtht':         'Hệ thống',
  '/qtht/users':   'Người dùng',
  '/qtht/roles':   'Vai trò',
  '/qtht/menus':   'Menu',
  '/qtht/organizations': 'Tổ chức',
  '/qtht/departments':   'Phòng ban',
  '/qtht/permissions':   'Quyền hạn',
  '/qtht/security':      'Bảo mật',
  '/qtht/settings':      'Cài đặt',
  '/qtht/apilogs':       'Lịch sử API',
  '/qtht/landing-config': 'Landing Config',
  '/admin':        'Quản trị',
  '/admin/article-management': 'Bài viết',
  '/admin/attendance': 'Chấm công',
  '/email':        'Email',
  '/email/config': 'Cấu hình Email',
  '/email/template': 'Mẫu Email',
  '/email/group': 'Nhóm Email',
  '/email/compose': 'Soạn Email',
  '/email/inbox': 'Hộp thư đến',

  '/qlns':         'Nhân sự',
  '/qlns/persons': 'Nhân viên',
  '/qlns/contract': 'Hợp đồng',
  '/qlns/contract/create': 'Tạo hợp đồng',
  '/qlns/payrolls': 'Bảng lương',
  '/qlns/leaves':  'Nghỉ phép',
  '/customer':     'Khách hàng',
  '/product':      'Sản phẩm',
  '/task':         'Công việc',
  '/task/tickets': 'Giao việc',
  '/task/tags':    'Thẻ',
  '/profile':      'Hồ sơ',
  '/notifications': 'Thông báo',
}

// Preload slug titles from docs registry (DOC-04)
for (const d of DOCS) {
  FALLBACK_LABELS[`/docs/${d.slug}`] = d.title
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
      const doc = getDocBySlug(cumPath.slice('/docs/'.length))
      label = doc?.title
    }
    crumbs.push({ label: label || part, path: cumPath })
  })

  return crumbs
}

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { menuTree } = useMenus()
  const commandPalette = useCommandPaletteContext()

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

  // Build label map từ menuTree (tên tiếng Việt theo feUrl)
  const labelMap = useMemo(() => flattenMenuTree(menuTree), [menuTree])

  const breadcrumbs = buildBreadcrumbs(pathname, labelMap)
  const pageTitle = labelMap.get(pathname) || FALLBACK_LABELS[pathname] || breadcrumbs[breadcrumbs.length - 1]?.label || 'Frezo ERP'

  // User dropdown
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <button
          type="button"
          onClick={commandPalette.open}
          className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-2 text-xs bg-neutral-50 border border-border rounded-lg text-neutral-500 hover:bg-white hover:border-primary-300 hover:text-neutral-700 transition-colors group"
          title="Mở thanh lệnh (Ctrl+K)"
        >
          <Search size={13} className="text-neutral-400 group-hover:text-primary-500" />
          <span className="w-32 text-left">Tìm kiếm nhanh...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono font-semibold text-neutral-500 shadow-sm">
            {isMac ? <Command size={9} /> : 'Ctrl'} K
          </kbd>
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User avatar dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 border-l border-border cursor-pointer"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center
                hover:bg-primary-700 transition-colors">
                <span className="text-white text-xs font-bold uppercase">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-neutral-700 leading-tight">
                {user?.fullName || user?.username}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                {user?.isAdmin ? 'Admin' : user?.roles?.[0] || 'User'}
              </div>
            </div>
          </div>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute top-10 right-0 w-48 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-border bg-neutral-50">
                <div className="text-sm font-semibold text-neutral-800 truncate">
                  {user?.fullName || user?.username}
                </div>
                <div className="text-xs text-neutral-500 truncate mt-0.5">
                  {user?.email || user?.username}
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <User size={15} className="text-neutral-400" />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); logout() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
