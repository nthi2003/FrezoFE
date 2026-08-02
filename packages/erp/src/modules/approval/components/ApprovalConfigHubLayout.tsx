import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AppTooltip, PageHeader } from '@frezo/ui'
import {
  DEFAULT_APPROVAL_CONFIG_TAB,
  type ApprovalConfigTab,
} from '../utils/approvalRoutes'

export type ApprovalConfigHubTabDef = {
  key: ApprovalConfigTab
  label: string
  icon: LucideIcon
  hint?: string
}

type ApprovalConfigHubLayoutProps = {
  tabs: ApprovalConfigHubTabDef[]
  tab: ApprovalConfigTab
  visibleTabKeys: ApprovalConfigTab[]
  syncKey?: unknown
  headerExtra?: ReactNode
  onResolveTab: (raw: string | null) => ApprovalConfigTab
  children: ReactNode
}

export function ApprovalConfigHubLayout({
  tabs,
  tab,
  visibleTabKeys,
  syncKey,
  headerExtra,
  onResolveTab,
  children,
}: ApprovalConfigHubLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const onResolveTabRef = useRef(onResolveTab)
  onResolveTabRef.current = onResolveTab

  const visibleTabs = useMemo(
    () => tabs.filter((t) => visibleTabKeys.includes(t.key)),
    [tabs, visibleTabKeys],
  )

  const setTab = (next: ApprovalConfigTab) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev)
        if (next === DEFAULT_APPROVAL_CONFIG_TAB) sp.delete('tab')
        else sp.set('tab', next)
        return sp
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const raw = searchParams.get('tab')
    const resolved = onResolveTabRef.current(raw)
    const expectedInUrl = resolved === DEFAULT_APPROVAL_CONFIG_TAB ? null : resolved
    const currentInUrl = raw || null
    if (currentInUrl === expectedInUrl) return

    const sp = new URLSearchParams(searchParams)
    if (expectedInUrl === null) sp.delete('tab')
    else sp.set('tab', expectedInUrl)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams, syncKey])

  if (visibleTabs.length === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title="Cấu hình luồng duyệt"
          description="Bạn chưa được cấp quyền truy cập mục này."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <PageHeader
        title="Cấu hình luồng duyệt"
        description="Một chỗ duy nhất: gắn luồng đang chạy theo loại đơn, và thiết kế mẫu nâng cao khi cần."
        actions={headerExtra}
      />

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-white/80 backdrop-blur rounded-t-xl px-2 pt-1 overflow-x-auto">
        {visibleTabs.map(({ key, label, icon: Icon, hint }) => {
          const active = tab === key
          const btn = (
            <button
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
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
