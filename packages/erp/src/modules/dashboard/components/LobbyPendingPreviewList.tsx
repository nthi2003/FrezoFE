// Preview list 3–5 việc cần xử lý — compose client-side từ hooks sẵn có

import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import { cn } from '@/lib/utils/cn'
import type { LobbyActionItem } from '../hooks/useLobbyPending'

function ActionRow({ item, onNavigate }: { item: LobbyActionItem; onNavigate: (to: string) => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.to)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors',
        'hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 group-hover:bg-primary-50 group-hover:text-primary-600">
        <Icon size={15} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-neutral-800">{item.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
          {item.badge && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-2xs font-medium text-neutral-500">
              {item.badge}
            </span>
          )}
          {item.meta && <span>{item.meta}</span>}
        </span>
      </span>
      <ChevronRight
        size={14}
        className="shrink-0 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  )
}

interface LobbyPendingPreviewListProps {
  actionItems: LobbyActionItem[]
  previewLoading: boolean
}

export function LobbyPendingPreviewList({ actionItems, previewLoading }: LobbyPendingPreviewListProps) {
  const nav = useNavigate()

  if (previewLoading) {
    return (
      <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (actionItems.length === 0) return null

  return (
    <ul className="mt-2 divide-y divide-neutral-100 border-t border-neutral-100 pt-1" aria-label="Chi tiết việc cần xử lý">
      {actionItems.map((item) => (
        <li key={item.id}>
          <ActionRow item={item} onNavigate={nav} />
        </li>
      ))}
    </ul>
  )
}
