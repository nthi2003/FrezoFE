// ============================================================
// Bảng Sale vàng — vinh danh NV chốt nhiều deal nhất.
// Nguồn: CRM deals WON (pipeline mặc định). "Vàng" = token warning,
// không dùng gradient / glow.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { Crown, Medal, Trophy } from 'lucide-react'
import { EmptyState, Skeleton } from '@frezo/ui'
import { formatCurrencyShort } from '@frezo/utils'
import type { HonorPeriod, SellerRow } from '../hooks/useHomeInsights'

const TOP_N = 5

interface SalesHonorBoardProps {
  rows: SellerRow[]
  period: HonorPeriod
  isLoading?: boolean
}

function initials(username: string): string {
  const clean = username.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-light text-warning-dark">
        <Crown size={14} strokeWidth={2} />
      </span>
    )
  }
  if (rank === 2 || rank === 3) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <Medal size={14} strokeWidth={1.5} />
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold tabular-nums text-neutral-500">
      {rank}
    </span>
  )
}

export function SalesHonorBoard({ rows, period, isLoading = false }: SalesHonorBoardProps) {
  const nav = useNavigate()
  const top = rows.slice(0, TOP_N)
  const maxDeals = top[0]?.wonDeals || 1
  const periodLabel =
    period === 'month'
      ? `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`
      : 'Luỹ kế từ trước đến nay'

  return (
    <section className="flex h-full flex-col rounded-xl border border-neutral-200 bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
          <Trophy size={18} strokeWidth={1.5} className="text-warning-dark" />
          Bảng Sale vàng
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Vinh danh chốt cơ hội · {periodLabel}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Chưa có cơ hội nào được chốt"
          description="Khi đội sale đánh dấu cơ hội đã chốt, bảng vinh danh sẽ cập nhật ngay."
          action={{ label: 'Mở phễu bán hàng', onClick: () => nav('/crm/deals') }}
        />
      ) : (
        <ol className="flex-1 space-y-2">
          {top.map((row, i) => {
            const rank = i + 1
            const pct = Math.max(8, Math.round((row.wonDeals / maxDeals) * 100))
            const isChampion = rank === 1
            return (
              <li key={row.username}>
                <button
                  type="button"
                  onClick={() => nav('/crm/deals')}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    isChampion
                      ? 'border-warning/40 bg-warning-light/50 hover:border-warning'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <RankBadge rank={rank} />

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isChampion
                        ? 'bg-warning-light text-warning-dark'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {initials(row.username)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {row.username}
                    </span>
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                      <span
                        style={{ width: `${pct}%` }}
                        className={`block h-full rounded-full ${
                          isChampion ? 'bg-warning' : 'bg-primary-400'
                        }`}
                      />
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold tabular-nums text-neutral-900">
                      {row.wonDeals}
                      <span className="ml-1 text-xs font-medium text-neutral-400">cơ hội</span>
                    </span>
                    <span className="block text-xs tabular-nums text-neutral-500">
                      {formatCurrencyShort(row.revenue)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
