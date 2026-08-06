import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AppTooltip, PageHeader } from '@frezo/ui'
import { useMenus } from '@/modules/menus/hooks/useMenus'

export type HubTabDef<T extends string> = {
  key: T
  label: string
  icon: LucideIcon
  hint?: string
}

type AccountingHubLayoutProps<T extends string> = {
  title: string
  description: string
  tabs: HubTabDef<T>[]
  tab: T
  visibleTabKeys: T[]
  defaultTab: T
  /** Re-run URL tab normalization when menu gating changes (e.g. menus loaded). */
  syncKey?: unknown
  headerExtra?: ReactNode
  onResolveTab: (raw: string | null) => T
  children: ReactNode
}

export function AccountingHubLayout<T extends string>({
  title,
  description,
  tabs,
  tab,
  visibleTabKeys,
  defaultTab,
  syncKey,
  headerExtra,
  onResolveTab,
  children,
}: AccountingHubLayoutProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const onResolveTabRef = useRef(onResolveTab)
  onResolveTabRef.current = onResolveTab

  const visibleTabs = useMemo(
    () => tabs.filter((t) => visibleTabKeys.includes(t.key)),
    [tabs, visibleTabKeys],
  )

  const setTab = (next: T) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev)
        if (next === defaultTab) sp.delete('tab')
        else sp.set('tab', next)
        return sp
      },
      { replace: true },
    )
  }

  // Normalize invalid/forbidden ?tab= once URL or menu gating changes — avoid unstable callback deps.
  useEffect(() => {
    const raw = searchParams.get('tab')
    const resolved = onResolveTabRef.current(raw)
    const expectedInUrl = resolved === defaultTab ? null : resolved
    const currentInUrl = raw || null
    if (currentInUrl === expectedInUrl) return

    const sp = new URLSearchParams(searchParams)
    if (expectedInUrl === null) sp.delete('tab')
    else sp.set('tab', expectedInUrl)
    setSearchParams(sp, { replace: true })
  }, [searchParams, setSearchParams, defaultTab, syncKey])

  if (visibleTabs.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title={title} description="Bạn chưa được cấp quyền truy cập mục này." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <PageHeader
        title={title}
        description={description}
        actions={headerExtra}
      />

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div
          className="flex flex-wrap gap-1 border-b border-neutral-200 bg-white px-2 pt-1"
          role="tablist"
          aria-label={title}
        >
          {visibleTabs.map(({ key, label, icon: Icon, hint }) => {
            const active = tab === key
            const btn = (
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  active
                    ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/80'
                }`}
              >
                <Icon size={15} aria-hidden />
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

        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}

/** Re-export hook helper for hub pages. */
export function useAccountingMenuUrls() {
  const { flatMenuFeUrls } = useMenus()
  return flatMenuFeUrls
}