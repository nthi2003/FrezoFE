import { useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AppTooltip, PageHeader } from '@frezo/ui'
import { DEFAULT_WORK_TAB, type WorkTab } from '../utils/taskRoutes'

export type WorkHubTabDef = {
  key: WorkTab
  label: string
  icon: LucideIcon
  /** Tooltip ngắn — giúp user biết tab này thay feature cũ nào. */
  hint?: string
}

type WorkHubLayoutProps = {
  tabs: WorkHubTabDef[]
  tab: WorkTab
  visibleTabKeys: WorkTab[]
  onResolveTab: (raw: string | null) => WorkTab
  children: ReactNode
}

export function WorkHubLayout({
  tabs,
  tab,
  visibleTabKeys,
  onResolveTab,
  children,
}: WorkHubLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const visibleTabs = useMemo(
    () => tabs.filter((t) => visibleTabKeys.includes(t.key)),
    [tabs, visibleTabKeys],
  )

  const setTab = (next: WorkTab) => {
    const sp = new URLSearchParams(searchParams)
    if (next === DEFAULT_WORK_TAB) sp.delete('tab')
    else sp.set('tab', next)
    setSearchParams(sp, { replace: true })
  }

  useEffect(() => {
    const raw = searchParams.get('tab')
    const resolved = onResolveTab(raw)
    if (raw === resolved && (raw || resolved === DEFAULT_WORK_TAB)) return
    const sp = new URLSearchParams(searchParams)
    if (resolved === DEFAULT_WORK_TAB) sp.delete('tab')
    else sp.set('tab', resolved)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams, onResolveTab])

  if (visibleTabs.length === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title="Công việc"
          description="Bạn chưa được cấp quyền truy cập module công việc."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <PageHeader
        title="Công việc"
        description="Giao việc, theo dõi tiến độ và quản lý task nội bộ — tất cả tại một nơi."
      />

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-white/80 backdrop-blur rounded-t-xl px-2 pt-1">
        {visibleTabs.map(({ key, label, icon: Icon, hint }) => {
          const active = tab === key
          const btn = (
            <button
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          )
          return hint ? (
            <AppTooltip key={key} content={hint}>
              <span className="inline-flex">{btn}</span>
            </AppTooltip>
          ) : (
            <span key={key} className="inline-flex">{btn}</span>
          )
        })}
      </div>

      <div className="rounded-b-xl">{children}</div>
    </div>
  )
}
