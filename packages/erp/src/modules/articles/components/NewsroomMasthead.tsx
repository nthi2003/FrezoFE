// ============================================================
// Header trang tin nội bộ — tiêu đề, số liệu, tìm kiếm, lọc nhóm.
// ============================================================

import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Input, PageHeader } from '@frezo/ui'
import { cn } from '@frezo/utils'
import { articleToneByKey } from './ArticleArtwork'

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
  isLoading?: boolean
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
    <section className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Tin & bài viết"
        description="Thông báo, sự kiện và bài viết đã xuất bản cho toàn công ty."
        actions={actions}
      />

      {!isLoading && total > 0 && (
        <>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            <div>
              <dt className="sr-only">Tổng bài viết</dt>
              <dd>
                <span className="font-semibold tabular-nums text-neutral-900">{total}</span>{' '}
                bài đã xuất bản
              </dd>
            </div>
            <div>
              <dt className="sr-only">Bài trong tháng</dt>
              <dd>
                <span className="font-semibold tabular-nums text-neutral-900">{monthCount}</span>{' '}
                bài trong tháng này
              </dd>
            </div>
            {latestLabel && (
              <div>
                <dt className="sr-only">Bài mới nhất</dt>
                <dd>
                  Mới nhất{' '}
                  <span className="font-medium text-neutral-700">{latestLabel}</span>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, tác giả…"
                aria-label="Tìm bài viết"
                className="h-10 pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Xoá từ khoá"
                  title="Xoá từ khoá"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {filters.length > 1 && (
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Lọc theo nhóm nội dung"
              >
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
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                        isActive
                          ? cn(tone.chip, 'font-semibold')
                          : 'bg-surface font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50 hover:text-neutral-900',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          f.key === 'all' ? 'bg-primary-500' : tone.dot,
                        )}
                      />
                      {f.label}
                      <span className="tabular-nums text-neutral-400">{f.count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
