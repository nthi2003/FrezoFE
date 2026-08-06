// ============================================================
// FREZO ERP — CommandPalette (Ctrl+K)
// Linear/Raycast/Notion-style universal search & quick actions
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ArrowUp, ArrowDown, CornerDownLeft, Command as CommandIcon,
  Compass, Zap, Clock, Plus, User, LogOut, LayoutDashboard, type LucideIcon,
  Settings, FolderOpen, X, Database,
} from 'lucide-react'
import { Portal } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { useAuthStore } from '@/stores/authStore'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'
import {
  useEntityCommandItems, ENTITY_SECTION_TITLE,
  type EntitySection,
} from './useEntityCommandItems'
import { recordRecentNav } from '@/lib/utils/recentNavigation'

// ============================================================
// Types
// ============================================================

interface CommandItem {
  id: string
  section: 'nav' | 'action' | 'recent' | 'data'
  /** Chỉ dùng khi section = 'data' — quyết định nhóm hiển thị. */
  entitySection?: EntitySection
  label: string
  hint?: string
  icon: LucideIcon
  keywords?: string[]
  action: () => void
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const RECENT_KEY = 'frezo:command-palette:recent'
const MAX_RECENT = 6

// ============================================================
// Component
// ============================================================

export function CommandPalette({ isOpen, onClose }: Props) {
  const navigate = useNavigate()
  const { menuTree } = useMenus()
  const { logout } = useAuthStore()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent())

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // ---- Build command items ----
  const allCommands = useMemo<CommandItem[]>(() => {
    const nav = flattenMenuAsCommands(menuTree, (path) => {
      recordRecentNav(path)
      setRecentIds(loadRecent())
      navigate(path)
      onClose()
    })

    const actions: CommandItem[] = [
      {
        id: 'action:new-ticket',
        section: 'action',
        label: 'Tạo giao việc (ticket) mới',
        hint: 'Task · New',
        icon: Zap,
        keywords: ['ticket', 'task', 'new', 'create', 'tao'],
        action: () => {
          navigate('/task?tab=board')
          onClose()
        },
      },
      {
        id: 'action:new-product',
        section: 'action',
        label: 'Thêm sản phẩm mới',
        hint: 'Product · New',
        icon: Plus,
        keywords: ['product', 'san pham', 'add', 'them'],
        action: () => {
          navigate('/product')
          onClose()
        },
      },
      {
        id: 'action:new-customer',
        section: 'action',
        label: 'Thêm khách hàng mới',
        hint: 'CRM · New',
        icon: Plus,
        keywords: ['customer', 'khach hang', 'new'],
        action: () => {
          navigate('/customer')
          onClose()
        },
      },
      {
        id: 'action:new-ncc',
        section: 'action',
        label: 'Thêm nhà cung cấp (NCC)',
        hint: 'Suppliers · New',
        icon: Plus,
        keywords: ['ncc', 'nha cung cap', 'supplier', 'new'],
        action: () => {
          navigate('/ncc')
          onClose()
        },
      },
      {
        id: 'action:new-contract',
        section: 'action',
        label: 'Tạo hợp đồng mới',
        hint: 'HR · Contract',
        icon: Plus,
        keywords: ['contract', 'hop dong', 'new'],
        action: () => {
          navigate('/qlns/contract/create')
          onClose()
        },
      },
      {
        id: 'action:new-article',
        section: 'action',
        label: 'Viết bài viết mới',
        hint: 'CMS',
        icon: Plus,
        keywords: ['article', 'bai viet', 'blog'],
        action: () => {
          navigate('/admin/article-management/new')
          onClose()
        },
      },
      {
        id: 'action:goto-profile',
        section: 'action',
        label: 'Hồ sơ cá nhân',
        hint: 'Profile',
        icon: User,
        keywords: ['profile', 'ho so', 'tai khoan', 'account'],
        action: () => {
          navigate('/profile')
          onClose()
        },
      },
      {
        id: 'action:goto-settings',
        section: 'action',
        label: 'Cài đặt hệ thống',
        hint: 'Settings',
        icon: Settings,
        keywords: ['settings', 'cai dat', 'preference'],
        action: () => {
          navigate('/qtht/settings')
          onClose()
        },
      },
      {
        id: 'action:logout',
        section: 'action',
        label: 'Đăng xuất',
        hint: 'Sign out',
        icon: LogOut,
        keywords: ['logout', 'dang xuat', 'signout', 'exit'],
        action: () => {
          logout()
          onClose()
        },
      },
    ]

    return [...nav, ...actions]
  }, [menuTree, navigate, logout, onClose])

  // ---- Entity items từ TanStack cache (chỉ khi query >= 2 ký tự) ----
  const entityItems = useEntityCommandItems(query, onClose)

  // ---- Filter by query ----
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    if (!q) {
      // Show recent + top nav + all actions
      const recentItems = recentIds
        .map((id) => allCommands.find((c) => c.id === id))
        .filter(Boolean) as CommandItem[]
      const recentWithSection = recentItems.map((c) => ({ ...c, section: 'recent' as const }))
      const navTop = allCommands.filter((c) => c.section === 'nav').slice(0, 8)
      const actions = allCommands.filter((c) => c.section === 'action')
      return [...recentWithSection, ...navTop, ...actions]
    }

    // Map entity items sang CommandItem shape để hoà nhập keyboard nav
    const entityAsCommand: CommandItem[] = entityItems.map((e) => ({
      id: e.id,
      section: 'data',
      entitySection: e.section,
      label: e.label,
      hint: e.hint,
      icon: e.icon,
      keywords: e.keywords,
      action: e.action,
    }))

    const nav = allCommands
      .filter((c) => matchScore(c, q) > 0)
      .sort((a, b) => matchScore(b, q) - matchScore(a, q))
      .slice(0, 30)

    // Ưu tiên entity (khớp data user thấy) trước nav/action
    return [...entityAsCommand, ...nav]
  }, [query, allCommands, recentIds, entityItems])

  // ---- Group by section ----
  const grouped = useMemo(() => {
    const groups: {
      recent: CommandItem[]
      data: Partial<Record<EntitySection, CommandItem[]>>
      nav: CommandItem[]
      action: CommandItem[]
    } = { recent: [], data: {}, nav: [], action: [] }
    for (const c of filtered) {
      if (c.section === 'data') {
        const sub = c.entitySection || 'customer'
        if (!groups.data[sub]) groups.data[sub] = []
        groups.data[sub]!.push(c)
      } else {
        groups[c.section].push(c)
      }
    }
    return groups
  }, [filtered])

  // ---- Flat ordered list for keyboard nav ----
  const flatList = useMemo(() => {
    const dataFlat: CommandItem[] = []
    for (const key of Object.keys(grouped.data) as EntitySection[]) {
      dataFlat.push(...(grouped.data[key] || []))
    }
    return [...grouped.recent, ...dataFlat, ...grouped.nav, ...grouped.action]
  }, [grouped])

  // ---- Reset active on filter change ----
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // ---- Focus input on open ----
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
    }
  }, [isOpen])

  // ---- Keyboard nav ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatList.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatList[activeIndex]
        if (item) item.action()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [flatList, activeIndex, onClose],
  )

  // ---- Scroll active into view ----
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-cp-index="${activeIndex}"]`)
    if (activeEl) {
      (activeEl as HTMLElement).scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (!isOpen) return null

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[10030] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm animate-fade-in" />

      {/* Palette */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[70vh]"
        style={{ animation: 'palette-in 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-2 px-4 border-b border-neutral-100">
          <Search size={16} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm trang, hành động, hoặc gõ để lọc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-14 text-base bg-transparent focus:outline-none placeholder:text-neutral-400"
          />
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
            title="Đóng (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-neutral-400">
              <Search size={32} className="opacity-30 mb-3" />
              <p className="text-sm font-medium">Không tìm thấy kết quả</p>
              <p className="text-xs mt-1">Thử gõ từ khoá khác</p>
            </div>
          ) : (
            <>
              <Section
                title="Gần đây"
                icon={Clock}
                items={grouped.recent}
                startIndex={0}
                activeIndex={activeIndex}
              />
              {(Object.keys(grouped.data) as EntitySection[]).map((key, idx, arr) => {
                const prevDataCount = arr
                  .slice(0, idx)
                  .reduce((n, k) => n + (grouped.data[k]?.length || 0), 0)
                return (
                  <Section
                    key={`data-${key}`}
                    title={ENTITY_SECTION_TITLE[key]}
                    icon={Database}
                    items={grouped.data[key] || []}
                    startIndex={grouped.recent.length + prevDataCount}
                    activeIndex={activeIndex}
                  />
                )
              })}
              <Section
                title="Điều hướng"
                icon={Compass}
                items={grouped.nav}
                startIndex={
                  grouped.recent.length +
                  (Object.keys(grouped.data) as EntitySection[]).reduce(
                    (n, k) => n + (grouped.data[k]?.length || 0),
                    0,
                  )
                }
                activeIndex={activeIndex}
              />
              <Section
                title="Hành động nhanh"
                icon={Zap}
                items={grouped.action}
                startIndex={
                  grouped.recent.length +
                  (Object.keys(grouped.data) as EntitySection[]).reduce(
                    (n, k) => n + (grouped.data[k]?.length || 0),
                    0,
                  ) +
                  grouped.nav.length
                }
                activeIndex={activeIndex}
              />
            </>
          )}
        </div>

        {/* Footer hint bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-100 bg-neutral-50/70 text-[11px] text-neutral-500">
          <Hint keys={['↑', '↓']} icon={ArrowDown} label="Chuyển" />
          <Hint keys={['⏎']} icon={CornerDownLeft} label="Chọn" />
          <Hint keys={['Esc']} label="Đóng" />
          <div className="ml-auto flex items-center gap-1">
            <CommandIcon size={11} />
            <span className="font-semibold">Ctrl+K</span> để mở
          </div>
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes palette-in {
          0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
    </Portal>
  )
}

// ============================================================
// Section
// ============================================================

function Section({
  title,
  icon: Icon,
  items,
  startIndex,
  activeIndex,
}: {
  title: string
  icon: LucideIcon
  items: CommandItem[]
  startIndex: number
  activeIndex: number
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-1">
      <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
        <Icon size={10} />
        {title}
      </div>
      {items.map((item, i) => {
        const gi = startIndex + i
        const active = gi === activeIndex
        const ItemIcon = item.icon
        return (
          <button
            key={item.id}
            data-cp-index={gi}
            onClick={item.action}
            className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
              active ? 'bg-primary-50' : 'hover:bg-neutral-50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              <ItemIcon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${active ? 'text-primary-700' : 'text-neutral-800'}`}>
                {item.label}
              </div>
              {item.hint && (
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">{item.hint}</div>
              )}
            </div>
            {active && (
              <span className="text-[10px] text-primary-600 font-semibold flex items-center gap-0.5 shrink-0">
                <CornerDownLeft size={10} /> Enter
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// Hint bar chip
// ============================================================

function Hint({ keys, label, icon: Icon }: { keys: string[]; label: string; icon?: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-white border border-neutral-200 text-[10px] font-mono font-semibold text-neutral-600 shadow-sm"
        >
          {Icon && k === '↓' ? <Icon size={9} /> : k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  )
}

// ============================================================
// Helpers
// ============================================================

function flattenMenuAsCommands(
  nodes: MenuTreeNode[],
  onNavigate: (path: string) => void,
  parentLabel?: string,
): CommandItem[] {
  const result: CommandItem[] = []
  for (const node of nodes) {
    if (node.feUrl) {
      const fullLabel = parentLabel ? `${parentLabel} · ${node.name}` : node.name
      result.push({
        id: `nav:${node.feUrl}`,
        section: 'nav',
        label: node.name,
        hint: parentLabel ? `${parentLabel} · ${node.feUrl}` : node.feUrl,
        icon: (getNavIcon(node.code) as LucideIcon) || FolderOpen,
        keywords: [node.name, node.code || '', node.feUrl, fullLabel].map(deburr),
        action: () => onNavigate(node.feUrl!),
      })
    }
    if (node.children?.length) {
      result.push(...flattenMenuAsCommands(node.children, onNavigate, node.name))
    }
  }
  return result
}

function getNavIcon(code?: string): LucideIcon | undefined {
  if (!code) return undefined
  const map: Record<string, LucideIcon> = {
    QTHT: Settings,
    QLNS: FolderOpen,
    DASHBOARD: LayoutDashboard,
  }
  return map[code]
}

function matchScore(item: CommandItem, q: string): number {
  const haystack = [item.label, ...(item.keywords || []), item.hint || '']
    .map(deburr)
    .join(' ')
    .toLowerCase()
  const nq = deburr(q).toLowerCase()

  // Full substring gets high score
  if (haystack.includes(nq)) return 100 + (haystack.startsWith(nq) ? 50 : 0)

  // All chars must appear in order (fuzzy)
  let idx = 0
  for (const ch of nq) {
    idx = haystack.indexOf(ch, idx) + 1
    if (idx === 0) return 0
  }
  return 10
}

/** Strip Vietnamese diacritics + đ → d */
function deburr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}
