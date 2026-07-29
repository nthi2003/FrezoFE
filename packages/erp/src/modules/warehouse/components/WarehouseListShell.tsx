import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  PageHeader,
  EmptyState,
  ErrorState,
  PageGuideButton,
  StatCard,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'

interface StatItem {
  label: string
  value: number | string
}

export interface WarehouseListShellProps<T> {
  title: string
  description?: string
  guide?: PageGuideConfig
  headerActions?: ReactNode
  stats?: StatItem[]
  filterBar?: ReactNode
  isLoading?: boolean
  isError?: boolean
  error?: unknown
  isFetching?: boolean
  onRetry?: () => void
  errorTitle?: string
  /** Total rows before client filter (for empty vs filtered-empty) */
  totalCount?: number
  filteredCount?: number
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  emptyAction?: { label: string; onClick: () => void }
  filteredEmptyTitle?: string
  filteredEmptyDescription?: string
  columns: AppTableColumn<T>[]
  data: T[]
  onRefresh?: () => void
  children?: ReactNode
}

export function WarehouseListShell<T>({
  title,
  description,
  guide,
  headerActions,
  stats,
  filterBar,
  isLoading,
  isError,
  error,
  isFetching,
  onRetry,
  errorTitle = 'Không tải được dữ liệu',
  totalCount = 0,
  filteredCount,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  filteredEmptyTitle = 'Không có bản ghi phù hợp bộ lọc',
  filteredEmptyDescription = 'Thử đổi bộ lọc hoặc xoá lọc.',
  columns,
  data,
  onRefresh,
  children,
}: WarehouseListShellProps<T>) {
  const displayCount = filteredCount ?? data.length
  const isFilteredEmpty = !isLoading && !isError && totalCount > 0 && data.length === 0
  const isFullyEmpty = !isLoading && !isError && totalCount === 0

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            {guide && <PageGuideButton guide={guide} />}
            {headerActions}
          </div>
        }
      />

      {!isLoading && !isError && stats && stats.length > 0 && totalCount > 0 && (
        <div
          className={`grid gap-3 ${
            stats.length >= 5
              ? 'grid-cols-2 md:grid-cols-5'
              : stats.length >= 3
                ? 'grid-cols-2 md:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3'
          }`}
        >
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      {filterBar}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title={errorTitle}
            message={(error as Error)?.message || 'Kiểm tra kết nối hoặc thử lại.'}
            onRetry={onRetry ? () => void onRetry() : undefined}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={emptyIcon}
            title={isFilteredEmpty ? filteredEmptyTitle : emptyTitle}
            description={isFilteredEmpty ? filteredEmptyDescription : emptyDescription}
            action={isFilteredEmpty ? undefined : emptyAction}
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          loadingRows={6}
          density="compact"
          onRefresh={onRefresh ? () => void onRefresh() : undefined}
        />
      )}

      {!isLoading && !isError && data.length > 0 && displayCount > 0 && !filterBar && (
        <p className="text-xs text-neutral-500 tabular-nums">{displayCount} bản ghi</p>
      )}

      {children}
    </div>
  )
}
