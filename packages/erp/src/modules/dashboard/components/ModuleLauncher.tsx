// Module launcher — full leaf menu grid (permissioned via menu API)

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { EmptyState, Skeleton } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { getMenuIcon } from '@/modules/menus/utils/menuIcons'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

export interface ModuleTile {
  key: string
  label: string
  to: string
  icon: ReturnType<typeof getMenuIcon>
  group?: string
}

function normalizeFeUrl(feUrl: string): string {
  const path = feUrl.startsWith('/') ? feUrl : `/${feUrl}`
  return path.replace(/\/+$/, '') || '/'
}

/** Collect leaf menu items with navigable feUrl (exclude home itself). */
export function collectModuleTiles(nodes: MenuTreeNode[]): ModuleTile[] {
  const tiles: ModuleTile[] = []
  const seen = new Set<string>()

  const walk = (list: MenuTreeNode[], groupName?: string) => {
    for (const n of list) {
      const hasChildren = (n.children?.length ?? 0) > 0
      if (hasChildren) {
        walk(n.children, n.name || groupName)
        continue
      }
      if (!n.feUrl) continue
      const to = normalizeFeUrl(n.feUrl)
      if (to === '/' || to === '/dashboard') continue
      if (seen.has(to)) continue
      seen.add(to)
      tiles.push({
        key: n.code || to,
        label: n.name || to,
        to,
        icon: getMenuIcon(n),
        group: groupName,
      })
    }
  }

  walk(nodes)
  return tiles
}

export function ModuleLauncher() {
  const nav = useNavigate()
  const { menuTree, isLoading } = useMenus()
  const tiles = useMemo(() => collectModuleTiles(menuTree), [menuTree])

  return (
    <section className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <LayoutGrid size={18} className="text-primary-600" />
            Module
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Các chức năng bạn có quyền truy cập — cùng nguồn với menu bên trái
          </p>
        </div>
        {!isLoading && (
          <span className="text-xs text-neutral-400 tabular-nums shrink-0">
            {tiles.length} mục
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : tiles.length === 0 ? (
        <EmptyState
          title="Chưa có module"
          description="Tài khoản chưa được gán menu. Liên hệ Admin để cấp quyền."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {tiles.map((tile) => {
            const Icon = tile.icon
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => nav(tile.to)}
                title={tile.group ? `${tile.group} · ${tile.label}` : tile.label}
                className="group flex flex-col items-start gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50/40 p-3.5 text-left transition hover:border-primary-300 hover:bg-primary-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <span className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-primary-700 group-hover:border-primary-200">
                  <Icon size={18} />
                </span>
                <span className="text-sm font-medium text-neutral-800 leading-snug line-clamp-2">
                  {tile.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
