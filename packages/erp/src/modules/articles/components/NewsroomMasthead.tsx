// ============================================================
// Masthead trang tin nội bộ — brand band + số liệu nhanh + tìm kiếm
// + lọc theo nhóm nội dung. Giữ PageHeader chuẩn ở trong để title /
// description / actions đồng bộ với mọi màn khác.
// ============================================================

import type { ReactNode } from 'react'
import { CalendarDays, Clock3, Newspaper, Search, X } from 'lucide-react'
import { Input, PageHeader } from '@frezo/ui'
import { cn } from '@frezo/utils'
import { BotanicalPattern, articleToneByKey } from './ArticleArtwork'

export interface NewsroomFilter {
  key: string
  label: string
  count: number
}

interface NewsroomMastheadProps {
  total: number
  monthCount: number
  latestLabel: string
  query: string
  onQueryChange: (value: string) => void
  filters: NewsroomFilter[]
  activeFilter: string
  onFilterChange: (key: string) => void
  actions?: ReactNode
  /** Ẩn số liệu + bộ lọc khi feed chưa tải xong. */
  isLoading?: boolean
}

function StatPill({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: typeof Newspaper
  value: ReactNode
  label: string
  className: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-xs font-medium',
        className,
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70">
        <Icon size={13} strokeWidth={2} />
      </span>
      <span>
        <span className="font-semibold tabular-nums">{value}</span> {label}
      </span>
    </span>
  )
}

export function NewsroomMasthead({
  total,
  monthCount,
  latestLabel,
  query,
  onQueryChange,
  filters,
  activeFilter,
  onFilterChange,
  actions,
  isLoading = false,
}: NewsroomMastheadProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-white via-primary-50/70 to-emerald-50 shadow-card">
      <div
        aria-hidden="true"
        className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-emerald-400 to-amber-300"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-6 hidden h-64 w-80 text-primary-500/[0.13] sm:block"
      >
        <BotanicalPattern patternId="newsroom-masthead-pattern" rotate={-12} />
      </div>

      <div className="relative p-5 md:p-6">
        <PageHeader
          className="mb-0"
          title={
            <span>
              Tin &amp; <span className="gradient-text">bài viết</span>
            </span>
          }
          description="Bản tin nội bộ Frezo — thông báo, sự kiện và bài viết đã xuất bản cho toàn công ty."
          actions={actions}
        />

        {!isLoading && total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatPill
              icon={Newspaper}
              value={total}
              label="bài đã xuất bản"
              className="bg-primary-100/80 text-primary-800"
            />
            <StatPill
              icon={CalendarDays}
              value={monthCount}
              label="bài trong tháng này"
              className="bg-amber-100/80 text-amber-800"
            />
            {latestLabel && (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 py-1 pl-1.5 pr-3 text-xs font-medium text-sky-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70">
                  <Clock3 size={13} strokeWidth={2} />
                </span>
                <span>
                  Mới nhất <span className="font-semibold">{latestLabel}</span>
                </span>
              </span>
            )}
          </div>
        )}

        {!isLoading && total > 0 && (
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, tác giả…"
                aria-label="Tìm bài viết"
                className="h-10 rounded-full border-primary-100 bg-white/90 pl-9 pr-9 shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Xoá từ khoá"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            {filters.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {filters.map((f) => {
                  const isActive = f.key === activeFilter
                  const tone = articleToneByKey(f.key)
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => onFilterChange(f.key)}
                      aria-pressed={isActive}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                        isActive
                          ? cn(tone.chip, 'font-semibold shadow-sm')
                          : 'bg-white/80 font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-white hover:text-neutral-900 hover:ring-neutral-300',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          f.key === 'all'
                            ? 'bg-gradient-to-r from-primary-500 to-amber-400'
                            : tone.dot,
                        )}
                      />
                      {f.label}
                      <span className="tabular-nums opacity-60">{f.count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
