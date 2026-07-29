// ============================================================
// Module launcher — leaf menu (đã permission hoá) gom theo nhóm.
// Mỗi nhóm chỉ mở COLLAPSED_PER_GROUP ô; phần dư ẩn sau nút "+N nữa"
// để Home không biến thành bãi link.
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Plus } from 'lucide-react'
import { EmptyState, Skeleton } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectModuleGroups, type ModuleGroup } from '../utils/moduleGroups'

const COLLAPSED_PER_GROUP = 6

function ModuleGroupSection({
  group,
  onNavigate,
}: {
  group: ModuleGroup
  onNavigate: (to: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hidden = group.tiles.length - COLLAPSED_PER_GROUP
  const visible = expanded ? group.tiles : group.tiles.slice(0, COLLAPSED_PER_GROUP)

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {group.name}
        </h3>
        <span className="text-2xs tabular-nums text-neutral-300">{group.tiles.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {visible.map((tile) => {
          const Icon = tile.icon
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => onNavigate(tile.to)}
              title={`${group.name} · ${tile.label}`}
              className="group flex flex-col items-start gap-2.5 rounded-lg border border-neutral-200 bg-surface p-3.5 text-left transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 group-hover:bg-primary-100 group-hover:text-primary-700">
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span className="line-clamp-2 text-sm font-medium leading-snug text-neutral-800">
                {tile.label}
              </span>
            </button>
          )
        })}

        {!expanded && hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex flex-col items-start gap-2.5 rounded-lg border border-dashed border-neutral-300 bg-surface-secondary p-3.5 text-left transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              <Plus size={18} strokeWidth={1.5} />
            </span>
            <span className="text-sm font-medium leading-snug text-neutral-600">
              {hidden} mục nữa
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export function ModuleLauncher() {
  const nav = useNavigate()
  const { menuTree, isLoading } = useMenus()
  const groups = useMemo(() => collectModuleGroups(menuTree), [menuTree])
  const total = useMemo(() => groups.reduce((s, g) => s + g.tiles.length, 0), [groups])

  return (
    <section className="rounded-xl border border-neutral-200 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <LayoutGrid size={18} strokeWidth={1.5} className="text-primary-600" />
            Chức năng
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Cùng nguồn với menu bên trái — chỉ hiện phần bạn có quyền
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-neutral-400">{total} mục</span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px] rounded-lg" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Chưa có chức năng nào"
          description="Tài khoản chưa được gán menu. Liên hệ Admin để cấp quyền."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <ModuleGroupSection key={g.key} group={g} onNavigate={nav} />
          ))}
        </div>
      )}
    </section>
  )
}
