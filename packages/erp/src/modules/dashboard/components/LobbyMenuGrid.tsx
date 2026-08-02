// Grid menu cấp 1 — chỉ phân hệ gốc, không hiện submenu + ghim module

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Pin, PinOff } from 'lucide-react'
import { AppTooltip, EmptyState, Skeleton } from '@frezo/ui'
import { toast } from 'sonner'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { getMenuIcon } from '@/modules/menus/utils/menuIcons'
import { resolveMenuEntryUrl } from '@/modules/menus/utils/resolveMenuEntryUrl'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'
import { cn } from '@/lib/utils/cn'
import { recordRecentNav } from '@/lib/utils/recentNavigation'
import { getLobbyMenuAccent } from '../utils/lobbyMenuAccent'
import {
  loadPinnedModuleCodes,
  PINNED_MODULES_CHANGED_EVENT,
  prunePinnedModuleCodes,
  togglePinnedModule,
} from '../utils/pinnedModules'

export interface LobbyMenuItem {
  key: string
  code: string
  label: string
  to: string
  icon: ReturnType<typeof getMenuIcon>
}

function collectTopLevelMenus(roots: MenuTreeNode[]): LobbyMenuItem[] {
  const items: LobbyMenuItem[] = []
  for (const root of roots) {
    const to = resolveMenuEntryUrl(root)
    if (!to) continue
    items.push({
      key: root.code || root.id,
      code: root.code,
      label: root.name,
      to,
      icon: getMenuIcon(root),
    })
  }
  return items
}

function LobbyMenuCard({
  item,
  pinned,
  onNavigate,
  onTogglePin,
}: {
  item: LobbyMenuItem
  pinned?: boolean
  onNavigate: (item: LobbyMenuItem) => void
  onTogglePin: (code: string, e: React.MouseEvent) => void
}) {
  const Icon = item.icon
  const accent = getLobbyMenuAccent(item.code, item.to)

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onNavigate(item)}
        className={cn(
          'group flex w-full flex-col items-start gap-3 rounded-xl border border-neutral-200 bg-surface p-4 text-left shadow-sm',
          'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          accent.hoverBorder,
          accent.hoverBg,
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-200',
            accent.iconBg,
            accent.iconText,
            accent.iconHoverBg,
            accent.iconHoverText,
          )}
        >
          <Icon size={22} strokeWidth={1.5} />
        </span>
        <span className="line-clamp-2 pr-6 text-sm font-semibold leading-snug text-neutral-800 transition-colors duration-200 group-hover:text-neutral-900">
          {item.label}
        </span>
      </button>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <AppTooltip content={pinned ? 'Bỏ ghim' : 'Ghim module'}>
          <button
            type="button"
            aria-label={pinned ? 'Bỏ ghim' : 'Ghim module'}
            onClick={(e) => onTogglePin(item.code, e)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg border bg-surface/95 shadow-sm backdrop-blur-sm transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              pinned
                ? 'border-primary-300 text-primary-600'
                : 'border-neutral-200 text-neutral-400 hover:border-primary-300 hover:text-primary-600',
            )}
          >
            {pinned ? <PinOff size={14} strokeWidth={1.5} /> : <Pin size={14} strokeWidth={1.5} />}
          </button>
        </AppTooltip>
      </div>
    </div>
  )
}

function MenuGrid({ items, pinnedCodes, onNavigate, onTogglePin }: {
  items: LobbyMenuItem[]
  pinnedCodes: Set<string>
  onNavigate: (item: LobbyMenuItem) => void
  onTogglePin: (code: string, e: React.MouseEvent) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <LobbyMenuCard
          key={item.key}
          item={item}
          pinned={pinnedCodes.has(item.code)}
          onNavigate={onNavigate}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  )
}

export function LobbyMenuGrid() {
  const nav = useNavigate()
  const { menuTree, isLoading } = useMenus()
  const menus = useMemo(() => collectTopLevelMenus(menuTree), [menuTree])
  const [pinnedCodes, setPinnedCodes] = useState<string[]>(() => loadPinnedModuleCodes())

  const validCodes = useMemo(() => new Set(menus.map((m) => m.code)), [menus])

  useEffect(() => {
    setPinnedCodes(prunePinnedModuleCodes(validCodes))
  }, [validCodes])

  useEffect(() => {
    const sync = () => setPinnedCodes(loadPinnedModuleCodes())
    window.addEventListener(PINNED_MODULES_CHANGED_EVENT, sync)
    return () => window.removeEventListener(PINNED_MODULES_CHANGED_EVENT, sync)
  }, [])

  const pinnedSet = useMemo(() => new Set(pinnedCodes), [pinnedCodes])
  const pinnedMenus = useMemo(
    () => pinnedCodes.map((code) => menus.find((m) => m.code === code)).filter(Boolean) as LobbyMenuItem[],
    [pinnedCodes, menus],
  )
  const gridMenus = useMemo(
    () => menus.filter((m) => !pinnedSet.has(m.code)),
    [menus, pinnedSet],
  )

  const handleNavigate = useCallback(
    (item: LobbyMenuItem) => {
      recordRecentNav(item.to)
      nav(item.to)
    },
    [nav],
  )

  const handleTogglePin = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const result = togglePinnedModule(code)
    if (!result.ok) {
      if (result.reason === 'max') toast.message('Tối đa 4 module ghim')
      return
    }
    setPinnedCodes(loadPinnedModuleCodes())
  }, [])

  return (
    <section className="space-y-8">
      {pinnedMenus.length > 0 && (
        <div>
          <div className="mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Pin size={16} strokeWidth={1.5} className="text-primary-600" />
              Ghim nhanh
            </h2>
          </div>
          <MenuGrid
            items={pinnedMenus}
            pinnedCodes={pinnedSet}
            onNavigate={handleNavigate}
            onTogglePin={handleTogglePin}
          />
        </div>
      )}

      <div>
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <LayoutGrid size={20} strokeWidth={1.5} className="text-primary-600" />
            Khu vực làm việc
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Chọn phân hệ để vào hệ thống — chỉ hiện module bạn có quyền truy cập
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px] rounded-xl" />
            ))}
          </div>
        ) : menus.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Chưa có phân hệ nào"
            description="Tài khoản chưa được gán menu. Liên hệ Admin để cấp quyền."
          />
        ) : (
          <MenuGrid
            items={gridMenus}
            pinnedCodes={pinnedSet}
            onNavigate={handleNavigate}
            onTogglePin={handleTogglePin}
          />
        )}
      </div>
    </section>
  )
}
