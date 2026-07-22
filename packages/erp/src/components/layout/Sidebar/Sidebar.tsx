// ============================================================
// FREZO ERP — Sidebar Component
// Renders dynamic menu tree from BE API
// Supports: collapse, nested menu, active parent highlight, icon map
// ============================================================

import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logoSrc from '@/img/logo.png'
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Users,
  Shield,
  Menu,
  Building2,
  Network,
  FileText,
  CheckSquare,
  Ticket,
  ShoppingCart,
  Package,
  UserCheck,
  FolderOpen,
  Settings,
  Tag,
  Layers,
  Warehouse,
  ClipboardList,
  Calendar,
  DollarSign,
  ChevronLeft,
  LogOut,
  User,
  Bell,
  Mail,
  Bot,
  Newspaper,
  BookOpen,
} from 'lucide-react'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  user: User,
  usercheck: UserCheck,
  shield: Shield,
  menu: Menu,
  building: Building2,
  network: Network,
  filetext: FileText,
  task: CheckSquare,
  listchecks: CheckSquare,
  ticket: Ticket,
  cart: ShoppingCart,
  shoppingcart: ShoppingCart,
  package: Package,
  customer: UserCheck,
  folder: FolderOpen,
  settings: Settings,
  tag: Tag,
  layers: Layers,
  warehouse: Warehouse,
  clipboard: ClipboardList,
  clipboardlist: ClipboardList,
  calendar: Calendar,
  dollar: DollarSign,
  dollarsign: DollarSign,
  bot: Bot,
  // Domain parents (menu_tree_v3) — Lucide PascalCase → lowercase key
  MENU_HRM: Users,
  MENU_CRM: UserCheck,
  MENU_PRODUCT: Package,
  MENU_WAREHOUSE: Warehouse,
  MENU_ACCOUNTING: DollarSign,
  MENU_APPROVAL: ClipboardList,
  MENU_TASK: CheckSquare,
  MENU_GROWTH: Bot,
  MENU_QTHT: Settings,
  // legacy v2 codes (soft-deleted parents may still appear in cache briefly)
  MENU_TOOL: CheckSquare,
  MENU_SALE: ShoppingCart,
  QTHT: Settings,
  QLNS: ClipboardList,
  HRM: Users,
  CRM: UserCheck,
  TOOL: CheckSquare,
  SALE: ShoppingCart,
  PRODUCT: Package,
  GROWTH: Bot,
  APPROVAL: ClipboardList,
  ACCOUNTING: DollarSign,
  DMDC: Layers,
  CUSTOMER: UserCheck,
  PRODUCT: Package,
  EMAIL: Mail,
  QLHT_EMAIL: Mail,
  EMAIL_GROUP: Users,
  TASK: CheckSquare,
  FB: FacebookIcon,
  FACEBOOK: FacebookIcon,
  fb: FacebookIcon,
  automation: Bot,
  layouttemplate: LayoutDashboard,
  newspaper: Newspaper,
  globe: LayoutDashboard,
  book: BookOpen,
  bookopen: BookOpen,
  DEFAULT: FolderOpen,
}

function getIcon(node: MenuTreeNode) {
  const iconKey = node.icon?.toLowerCase() || node.code.split('_')[0]
  return ICON_MAP[iconKey] || ICON_MAP[node.code] || ICON_MAP.DEFAULT
}

/** Normalize path for menu URL matching. */
function normalizePath(p: string): string {
  return p.replace(/\/$/, '') || '/'
}

/** Leaf: exact or nested under feUrl. Parent with children: exact only (child owns active). */
function isSelfRouteActive(
  feUrl: string | null | undefined,
  pathname: string,
  hasChildren: boolean,
): boolean {
  if (!feUrl) return false
  const url = normalizePath(feUrl)
  const path = normalizePath(pathname)
  if (url === '/') return path === '/' || path === '/dashboard'
  if (path === url) return true
  if (hasChildren) return false
  return path.startsWith(url + '/')
}

/** True if this node or any descendant matches the current route (for expand / ancestor open). */
function isNodeOrDescendantActive(node: MenuTreeNode, pathname: string): boolean {
  if (isSelfRouteActive(node.feUrl, pathname, (node.children?.length ?? 0) > 0)) {
    return true
  }
  return (node.children ?? []).some((c) => isNodeOrDescendantActive(c, pathname))
}

interface MenuItemProps {
  node: MenuTreeNode
  depth?: number
  collapsed: boolean
}

function SidebarMenuItem({ node, depth = 0, collapsed }: MenuItemProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hasChildren = (node.children?.length ?? 0) > 0
  const Icon = getIcon(node)

  // Active style ONLY on the route-matching item — not on open ancestors.
  const selfActive = isSelfRouteActive(node.feUrl, pathname, hasChildren)
  const isChildActive =
    hasChildren && node.children.some((c) => isNodeOrDescendantActive(c, pathname))

  const [isOpen, setIsOpen] = useState(isChildActive)

  useEffect(() => {
    if (isChildActive) setIsOpen(true)
  }, [isChildActive])

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (hasChildren) {
      setIsOpen((prev) => !prev)
    } else if (node.feUrl) {
      navigate(node.feUrl)
    }
    // Clear focus so click does not leave a stuck “hover/active” look.
    e.currentTarget.blur()
  }

  const indentStyle = depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : {}

  const itemClass = selfActive
    ? 'bg-sidebar-active text-sidebar-text-active'
    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        title={collapsed ? node.name : undefined}
        className={`
          w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium
          cursor-pointer select-none text-left px-3
          focus:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-text-active/40
          ${itemClass}
        `}
        style={indentStyle}
      >
        <Icon
          size={16}
          className={`shrink-0 ${selfActive ? 'text-sidebar-text-active' : ''}`}
        />

        {!collapsed && (
          <>
            <span className="flex-1 truncate leading-5">{node.name}</span>
            {hasChildren && (
              <span
                className={`shrink-0 ${
                  isOpen || isChildActive ? 'opacity-80' : 'opacity-60'
                }`}
              >
                {isOpen || isChildActive ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
            )}
          </>
        )}

        {collapsed && selfActive && (
          <span className="absolute right-2 w-1.5 h-1.5 bg-sidebar-text-active rounded-full" />
        )}
      </button>

      {hasChildren && (isOpen || isChildActive) && !collapsed && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <SidebarMenuItem
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { menuTree, isLoading } = useMenus()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const docsActive = pathname === '/docs' || pathname.startsWith('/docs/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`
        flex flex-col h-screen bg-sidebar-bg border-r border-sidebar-border
        transition-all duration-200 ease-in-out shrink-0
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      <div
        className={`
        flex items-center justify-center h-[60px] px-4 border-b border-sidebar-border relative
      `}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center justify-center flex-1">
            <img
              src={logoSrc}
              alt="Frezo"
              className="w-[120px] h-[50px] object-contain shrink-0"
            />
          </div>
        )}

        {sidebarCollapsed && (
          <img
            src={logoSrc}
            alt="Frezo"
            className="w-[30px] h-[30px] object-contain"
          />
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          className={`
            w-7 h-7 flex items-center justify-center rounded-md
            text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover
            ${
              sidebarCollapsed
                ? 'absolute left-[58px] top-4 bg-sidebar-hover border border-sidebar-border z-10'
                : ''
            }
          `}
        >
          <ChevronLeft
            size={15}
            className={`transition-transform duration-200 ${
              sidebarCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2 px-2 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 bg-sidebar-hover rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          menuTree.map((node) => (
            <SidebarMenuItem
              key={node.id}
              node={node}
              depth={0}
              collapsed={sidebarCollapsed}
            />
          ))
        )}
      </nav>

      <div className="px-2 pb-1 space-y-0.5">
        <button
          type="button"
          title={sidebarCollapsed ? 'Tài liệu' : undefined}
          onClick={(e) => {
            navigate('/docs')
            e.currentTarget.blur()
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            focus:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-text-active/40
            ${
              docsActive
                ? 'bg-sidebar-active text-sidebar-text-active'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
            }`}
        >
          <BookOpen size={16} className="shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 truncate">Tài liệu</span>}
        </button>
        <button
          type="button"
          title={sidebarCollapsed ? 'Thông báo' : undefined}
          onClick={(e) => {
            navigate('/notifications')
            e.currentTarget.blur()
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active
            focus:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-text-active/40"
        >
          <Bell size={16} className="shrink-0" />
          {!sidebarCollapsed && (
            <span className="flex-1 truncate">Thông báo</span>
          )}
        </button>
      </div>

      <div className="border-t border-sidebar-border p-2">
        <div
          className={`
          flex items-center gap-3 p-2 rounded-lg
          hover:bg-sidebar-hover cursor-pointer
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
        >
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold uppercase">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">
                  {user?.fullName || user?.username || 'User'}
                </div>
                <div className="text-sidebar-text text-[10px] truncate">
                  {user?.email || user?.username}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Đăng xuất"
                className="w-7 h-7 flex items-center justify-center rounded-md
                  text-sidebar-text hover:text-danger hover:bg-danger/10
                  focus:outline-none"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
