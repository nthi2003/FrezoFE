import type { LucideIcon } from 'lucide-react'
import { Calendar, Inbox, Receipt, ShoppingBag } from 'lucide-react'
import { formatDateTime } from '@frezo/utils'

export type FeedItemKind = 'leave' | 'deal' | 'invoice' | 'other'

export interface FeedItem {
  id: string
  kind: FeedItemKind
  title: string
  subtitle?: string
  timestamp: string
}

const ICON_MAP: Record<FeedItemKind, LucideIcon> = {
  leave: Calendar,
  deal: ShoppingBag,
  invoice: Receipt,
  other: Inbox,
}

const TONE_MAP: Record<FeedItemKind, string> = {
  leave: 'bg-amber-100 text-amber-600',
  deal: 'bg-blue-100 text-blue-600',
  invoice: 'bg-emerald-100 text-emerald-600',
  other: 'bg-neutral-100 text-neutral-600',
}

/**
 * Feed hoạt động tổng hợp từ nhiều nguồn (leaves, deals, invoices).
 * Chỉ hiển thị — page tự merge sort by timestamp desc.
 */
export function ActivityFeed({ items, isLoading }: { items: FeedItem[]; isLoading?: boolean }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Hoạt động gần đây</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Tổng hợp từ nhiều module</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2.5 items-center">
              <div className="w-9 h-9 rounded-full bg-neutral-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-neutral-100 rounded w-3/4" />
                <div className="h-2 bg-neutral-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 py-8">
          <Inbox size={36} className="opacity-30 mb-2" />
          <p className="text-sm">Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {items.map((it) => {
            const Icon = ICON_MAP[it.kind]
            const tone = TONE_MAP[it.kind]
            return (
              <div
                key={it.id}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-neutral-50 transition"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-neutral-800 truncate">{it.title}</div>
                  {it.subtitle && (
                    <div className="text-xs text-neutral-500 truncate">{it.subtitle}</div>
                  )}
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {formatDateTime(it.timestamp)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
