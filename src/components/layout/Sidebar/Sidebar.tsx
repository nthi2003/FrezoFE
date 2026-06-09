// ============================================================
// FREZO ERP — Sidebar Component
// Renders dynamic menu tree from BE API
// Supports: collapse, nested menu, active state, icon map
// ============================================================

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
} from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

import type { LucideIcon } from 'lucide-react'

// ---- Icon Map: code hoặc icon string → Lucide Icon ----
const ICON_MAP: Record<string, LucideIcon> = {
  dashboard:    LayoutDashboard,
  users:        Users,
  user:         User,
  shield:       Shield,
  menu:         Menu,
  building:     Building2,
  network:      Network,
  filetext:     FileText,
  task:         CheckSquare,
  ticket:       Ticket,
  cart:         ShoppingCart,
  package:      Package,
  customer:     UserCheck,
  folder:       FolderOpen,
  settings:     Settings,
  tag:          Tag,
  layers:       Layers,
  warehouse:    Warehouse,
  clipboard:    ClipboardList,
  calendar:     Calendar,
  dollar:       DollarSign,
  // fallback by common code patterns
  QTHT:         Settings,
  QLNS:         ClipboardList,
  DMDC:         Layers,
  CUSTOMER:     UserCheck,
  PRODUCT:      Package,
  TASK:         CheckSquare,
  DEFAULT:      FolderOpen,
}

function getIcon(node: MenuTreeNode) {
  const iconKey = node.icon?.toLowerCase() || node.code.split('_')[0]
  return ICON_MAP[iconKey] || ICON_MAP[node.code] || ICON_MAP.DEFAULT
}

// ============================================================
// MenuItem Component — single item (leaf or group)
// ============================================================
interface MenuItemProps {
  node: MenuTreeNode
  depth?: number
  collapsed: boolean
}

function SidebarMenuItem({ node, depth = 0, collapsed }: MenuItemProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const hasChildren = node.children.length > 0
  const Icon = getIcon(node)

  // Check if this item or any child is active
  const isActive = node.feUrl ? pathname === node.feUrl || pathname.startsWith(node.feUrl + '/') : false
  const isChildActive = hasChildren && node.children.some(
    (child) => child.feUrl && (pathname === child.feUrl || pathname.startsWith(child.feUrl + '/'))
  )

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen((prev) => !prev)
    } else if (node.feUrl) {
      navigate(node.feUrl)
    }
  }

  const paddingLeft = depth === 0 ? 'px-3' : 'px-3'
  const indentStyle = depth > 0 ? { paddingLeft: `${12 + depth * 16}px` } : {}

  return (
    <div>
      {/* Item row */}
      <button
        onClick={handleClick}
        title={collapsed ? node.name : undefined}
        className={`
          w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-150 cursor-pointer select-none text-left
          ${paddingLeft}
          ${isActive || isChildActive
            ? 'bg-[#1e3d26] text-primary-400'
            : 'text-[#a3c4a8] hover:bg-[#1a2e1f] hover:text-[#86efac]'
          }
        `}
        style={indentStyle}
      >
        {/* Icon */}
        <Icon
          size={16}
          className={`shrink-0 ${isActive || isChildActive ? 'text-primary-400' : ''}`}
        />

        {/* Label — hidden when collapsed */}
        {!collapsed && (
          <>
            <span className="flex-1 truncate leading-5">{node.name}</span>

            {/* Expand arrow for groups */}
            {hasChildren && (
              <span className="shrink-0 opacity-60">
                {isOpen || isChildActive
                  ? <ChevronDown size={14} />
                  : <ChevronRight size={14} />
                }
              </span>
            )}
          </>
        )}

        {/* Active dot when collapsed */}
        {collapsed && isActive && (
          <span className="absolute right-2 w-1.5 h-1.5 bg-primary-400 rounded-full" />
        )}
      </button>

      {/* Children — expand/collapse */}
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

// ============================================================
// Sidebar Component — Main
// ============================================================
export function Sidebar() {
  const { menuTree, isLoading } = useMenus()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`
        flex flex-col h-screen bg-[#0f1a14] border-r border-[#1e3a23]
        transition-all duration-200 ease-in-out shrink-0
        ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
    >
      {/* ---- LOGO / BRAND ---- */}
      <div className={`
        flex items-center h-[60px] px-4 border-b border-[#1e3a23]
        ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
      `}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-primary shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Frezo</div>
              <div className="text-[#4ade80] text-[10px] font-medium leading-tight">ERP System</div>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-primary">
            <span className="text-white font-bold text-sm">F</span>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={`
            w-7 h-7 flex items-center justify-center rounded-md
            text-[#a3c4a8] hover:text-white hover:bg-[#1a2e1f]
            transition-colors duration-150
            ${sidebarCollapsed ? 'absolute left-[58px] top-4 bg-[#1a2e1f] border border-[#1e3a23] z-10' : ''}
          `}
        >
          <ChevronLeft
            size={15}
            className={`transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ---- MENU TREE ---- */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {/* Dashboard — always present */}
        <button
          onClick={() => navigate('/')}
          title={sidebarCollapsed ? 'Dashboard' : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-150
            ${location.pathname === '/' || location.pathname === '/dashboard'
              ? 'bg-[#1e3d26] text-primary-400'
              : 'text-[#a3c4a8] hover:bg-[#1a2e1f] hover:text-[#86efac]'
            }
          `}
        >
          <LayoutDashboard size={16} className="shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 truncate">Dashboard</span>}
        </button>

        {/* Divider */}
        <div className="my-2 border-t border-[#1e3a23]" />

        {/* Dynamic menus from BE */}
        {isLoading ? (
          <div className="space-y-2 px-2 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-[#1a2e1f] rounded-lg animate-pulse" />
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

      {/* ---- NOTIFICATIONS ---- */}
      <div className="px-2 pb-2">
        <button
          title={sidebarCollapsed ? 'Thông báo' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-[#a3c4a8] hover:bg-[#1a2e1f] hover:text-[#86efac] transition-all duration-150"
        >
          <Bell size={16} className="shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 truncate">Thông báo</span>}
        </button>
      </div>

      {/* ---- USER PROFILE ---- */}
      <div className="border-t border-[#1e3a23] p-2">
        <div className={`
          flex items-center gap-3 p-2 rounded-lg
          hover:bg-[#1a2e1f] transition-colors duration-150 cursor-pointer
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}>
          {/* Avatar */}
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
                <div className="text-[#a3c4a8] text-[10px] truncate">
                  {user?.email || user?.username}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="w-7 h-7 flex items-center justify-center rounded-md
                  text-[#a3c4a8] hover:text-red-400 hover:bg-red-400/10
                  transition-colors duration-150"
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
