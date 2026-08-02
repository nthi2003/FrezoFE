// Strip việc cần xử lý — nhẹ, không phải KPI dashboard

import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useLobbyPending } from '../hooks/useLobbyPending'
import { LobbyPendingPreviewList } from './LobbyPendingPreviewList'

function PendingPill({
  item,
  onNavigate,
}: {
  item: ReturnType<typeof useLobbyPending>['pills'][number]
  onNavigate: (to: string) => void
}) {
  const Icon = item.icon
  const hasCount = item.count > 0

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.to)}
      className={cn(
        'inline-flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        hasCount
          ? item.tone === 'warning'
            ? 'border-warning/40 bg-warning-light/40 hover:bg-warning-light/60'
            : 'border-info/30 bg-info-light/30 hover:bg-info-light/50'
          : 'border-neutral-200 bg-surface hover:border-primary-300 hover:bg-primary-50/50',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          hasCount
            ? item.tone === 'warning'
              ? 'bg-warning-light text-warning-dark'
              : 'bg-info-light text-info-dark'
            : 'bg-neutral-100 text-neutral-500',
        )}
      >
        <Icon size={16} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-neutral-900">{item.label}</span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500">
          {hasCount ? `${item.count > 99 ? '99+' : item.count} cần xem` : 'Đã xử lý xong'}
        </span>
      </span>
      {hasCount && (
        <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-2xs font-bold text-white">
          {item.count > 99 ? '99+' : item.count}
        </span>
      )}
    </button>
  )
}

export function LobbyPendingStrip() {
  const nav = useNavigate()
  const { pills, allClear, actionItems, previewLoading } = useLobbyPending()

  return (
    <section aria-label="Việc cần xử lý">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-800">Việc cần xử lý</h2>
        {allClear && (
          <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
            <CheckCircle2 size={13} strokeWidth={1.5} />
            Không còn việc chờ
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {pills.map((item) => (
          <PendingPill key={item.key} item={item} onNavigate={nav} />
        ))}
      </div>
      <LobbyPendingPreviewList actionItems={actionItems} previewLoading={previewLoading} />
    </section>
  )
}
