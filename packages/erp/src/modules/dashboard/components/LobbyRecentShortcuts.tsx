// Truy cập gần đây — tái dùng lịch sử Ctrl+K + click grid module

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { getMenuIcon } from '@/modules/menus/utils/menuIcons'
import { collectFeUrls, pathAllowed } from '@/modules/menus/utils/menuUrls'
import { loadRecentNavPaths, recordRecentNav } from '@/lib/utils/recentNavigation'
import { resolveMenuByPath } from '../utils/resolveMenuLabel'

const ALWAYS_ALLOWED = new Set(['/profile', '/docs', '/notifications', '/bai-viet', '/approval/inbox'])
const RECENT_CHANGED = 'frezo:recent-nav-changed'

export function LobbyRecentShortcuts() {
  const nav = useNavigate()
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const sync = () => setTick((t) => t + 1)
    window.addEventListener(RECENT_CHANGED, sync)
    return () => window.removeEventListener(RECENT_CHANGED, sync)
  }, [])

  const items = useMemo(() => {
    const paths = loadRecentNavPaths(4)
    return paths
      .filter((path) => ALWAYS_ALLOWED.has(path) || pathAllowed(menuUrls, path))
      .map((path) => {
        const match = resolveMenuByPath(menuTree, path)
        const label =
          match?.label ?? path.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') ?? path
        const icon = getMenuIcon({ icon: match?.icon, code: match?.code ?? 'DEFAULT' })
        return { path, label, icon }
      })
  }, [menuTree, menuUrls, tick])

  if (items.length === 0) return null

  const handleNavigate = (path: string) => {
    recordRecentNav(path)
    nav(path)
  }

  return (
    <section aria-label="Truy cập gần đây">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        <Clock size={15} strokeWidth={1.5} className="text-neutral-400" />
        Truy cập gần đây
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            type="button"
            onClick={() => handleNavigate(path)}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-surface px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Icon size={14} strokeWidth={1.5} className="shrink-0 text-neutral-400" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
