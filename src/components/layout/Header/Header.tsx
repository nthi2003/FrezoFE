// ============================================================
// FREZO ERP — Header Component
// Breadcrumb, page title, user actions
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Bell, ChevronRight, CheckCircle2, AlertCircle, Info, User, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useNotifications } from '@/modules/common/hooks/useNotification'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

// Fallback tĩnh cho các route không có trong menu BE
const FALLBACK_LABELS: Record<string, string> = {
  '/':             'Dashboard',
  '/dashboard':    'Dashboard',
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
  '/email':        'Email',
  '/email/config': 'Cấu hình Email',
  '/email/template': 'Mẫu Email',
  '/email/group': 'Nhóm Email',
  '/email/compose': 'Soạn Email',
  '/email/inbox': 'Hộp thư đến',

  '/qlns':         'Nhân sự',
  '/qlns/persons': 'Nhân viên',
  '/qlns/contract': 'Hợp đồng',
  '/qlns/payrolls': 'Bảng lương',
  '/qlns/leaves':  'Nghỉ phép',
  '/customer':     'Khách hàng',
  '/product':      'Sản phẩm',
  '/task':         'Công việc',
  '/task/tickets': 'Giao việc',
  '/task/tags':    'Thẻ',
  '/profile':      'Hồ sơ',
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
    const label = labelMap.get(cumPath) || FALLBACK_LABELS[cumPath] || part
    crumbs.push({ label, path: cumPath })
  })

  return crumbs
}

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { menuTree } = useMenus()

  // Build label map từ menuTree (tên tiếng Việt theo feUrl)
  const labelMap = useMemo(() => flattenMenuTree(menuTree), [menuTree])

  const breadcrumbs = buildBreadcrumbs(pathname, labelMap)
  const pageTitle = labelMap.get(pathname) || FALLBACK_LABELS[pathname] || breadcrumbs[breadcrumbs.length - 1]?.label || 'Frezo ERP'

  // Notifications
  const { data: notifications } = useNotifications()
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // User dropdown
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false)
      }
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
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-8 pl-8 pr-3 text-xs border border-border rounded-lg bg-neutral-50
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              placeholder:text-neutral-400 w-48 transition-all"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-colors relative"
          >
            <Bell size={16} />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>
          
          {/* Dropdown */}
          {showNotif && (
            <div className="absolute top-10 right-0 w-80 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-neutral-50">
                <span className="font-semibold text-neutral-800">Thông báo</span>
                <span className="text-xs text-primary-600 font-medium cursor-pointer">Đánh dấu đã đọc</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 text-sm">Không có thông báo mới</div>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <div key={idx} className="px-4 py-3 border-b border-border hover:bg-neutral-50 cursor-pointer flex gap-3">
                      <div className="mt-0.5">
                        {n.type === 'SUCCESS' ? <CheckCircle2 size={16} className="text-green-500" /> :
                         n.type === 'ERROR' ? <AlertCircle size={16} className="text-red-500" /> :
                         <Info size={16} className="text-blue-500" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-neutral-800 leading-tight mb-1">{n.title}</div>
                        <div className="text-xs text-neutral-500 leading-tight">{n.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
