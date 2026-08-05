import { useMemo, useState } from 'react'
import {
  CalendarRange,
  HelpCircle,
  Lock,
  LockOpen,
  RefreshCw,
  RotateCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatusBadge,
  Select,
  RowActions,
} from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { pageRootClass } from '../utils/pageEmbed'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  usePeriods,
  useEnsureYear,
  useClosePeriod,
  useReopenPeriod,
} from '../hooks/useAccounting'
import type { FiscalPeriod, PeriodStatus } from '../services/accountingApi'

const PERIOD_STATUS: Record<
  PeriodStatus,
  { label: string; color: StatusColor; icon: LucideIcon }
> = {
  OPEN: { label: 'Mở', color: 'success', icon: LockOpen },
  CLOSED: { label: 'Đã khóa', color: 'warning', icon: Lock },
  LOCKED: { label: 'Khóa cứng', color: 'danger', icon: Lock },
}

const MONTH_LABEL = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

type ConfirmAction = {
  type: 'close' | 'reopen'
  period: FiscalPeriod
}

export function FiscalPeriodsPage({
  embedded,
  inDrawer,
}: {
  embedded?: boolean
  inDrawer?: boolean
} = {}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

  const canView = usePermission('ACCOUNTING.PERIODS.VIEW')
  const canCreate = usePermission('ACCOUNTING.PERIODS.CREATE')
  const canUpdate = usePermission('ACCOUNTING.PERIODS.UPDATE')

  const {
    data: periods,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = usePeriods(year)
  const ensureYear = useEnsureYear()
  const closePeriod = useClosePeriod()
  const reopenPeriod = useReopenPeriod()

  const list = useMemo(
    () => ([...(periods ?? [])] as FiscalPeriod[]).sort((a, b) => a.month - b.month),
    [periods],
  )

  const busyId =
    closePeriod.isPending || reopenPeriod.isPending
      ? (closePeriod.variables ?? reopenPeriod.variables)
      : null

  const hasActiveFilters = year !== now.getFullYear()
  const clearFilters = () => setYear(now.getFullYear())

  const columns: AppTableColumn<FiscalPeriod>[] = [
    {
      key: 'month',
      title: 'Kỳ',
      render: (_, p) => (
        <span className="font-medium text-neutral-900">
          {MONTH_LABEL[p.month - 1] ?? `Tháng ${p.month}`}/{p.year}
        </span>
      ),
    },
    {
      key: 'startDate',
      title: 'Từ ngày',
      render: (_, p) => (
        <span className="text-neutral-600 tabular-nums">{p.startDate}</span>
      ),
    },
    {
      key: 'endDate',
      title: 'Đến ngày',
      render: (_, p) => (
        <span className="text-neutral-600 tabular-nums">{p.endDate}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, p) => {
        const cfg = PERIOD_STATUS[p.status] ?? PERIOD_STATUS.OPEN
        return <StatusBadge label={cfg.label} color={cfg.color} icon={cfg.icon} />
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 140,
      render: (_, p) => {
        if (p.status === 'LOCKED') {
          return <span className="text-xs text-neutral-400">Không mở từ UI</span>
        }
        const isBusy = busyId === p.id
        return (
          <RowActions
            align="end"
            actions={[
              {
                key: 'close',
                icon: Lock,
                tooltip: 'Khóa kỳ',
                tone: 'amber',
                hidden: !canUpdate || p.status !== 'OPEN',
                disabled: isBusy,
                onClick: () => setConfirm({ type: 'close', period: p }),
              },
              {
                key: 'reopen',
                icon: LockOpen,
                tooltip: 'Mở lại kỳ',
                tone: 'emerald',
                hidden: !canUpdate || p.status !== 'CLOSED',
                disabled: isBusy,
                onClick: () => setConfirm({ type: 'reopen', period: p }),
              },
            ]}
          />
        )
      },
    },
  ]

  if (!canView) {
    return (
      <div className={pageRootClass(embedded || inDrawer, 'max-w-4xl mx-auto')}>
        {!embedded && !inDrawer && (
        <PageHeader
          title="Kỳ kế toán"
          description="Xem và khóa/mở lại kỳ theo năm tài chính."
        />
        )}
        <div className={`${embedded || inDrawer ? '' : 'mt-4'} border rounded-xl bg-white`}>
          <EmptyState
            icon={CalendarRange}
            title="Bạn không có quyền xem kỳ kế toán"
            description="Liên hệ quản trị để được cấp quyền ACCOUNTING.PERIODS.VIEW."
          />
        </div>
      </div>
    )
  }

  return (
    <div className={pageRootClass(embedded || inDrawer, 'max-w-4xl mx-auto')}>
      {!embedded && !inDrawer && (
      <PageHeader
        title="Kỳ kế toán"
        description="Khóa kỳ để chặn ghi sổ mới; mở lại khi cần điều chỉnh. Kỳ khóa cứng không mở từ giao diện."
        actions={(
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Kỳ kế toán: 12 tháng trong năm tài chính. Khóa kỳ chặn ghi sổ mới; khóa cứng chỉ mở từ hệ thống."
              aria-label="Giải thích kỳ kế toán"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
          </div>
        )}
      />
      )}

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${list.length} kỳ · Năm ${year}`}
        extra={(
          <>
            {canCreate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                disabled={ensureYear.isPending}
                onClick={() => ensureYear.mutate(year)}
              >
                <RotateCw size={14} />
                Tạo năm {year}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </>
        )}
      >
        <div className="min-w-[120px]">
          <Select
            options={[year - 1, year, year + 1].map((y) => ({
              value: String(y),
              label: `Năm ${y}`,
            }))}
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            showSearch={false}
            aria-label="Năm kỳ kế toán"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách kỳ"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra quyền VIEW kỳ kế toán."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={CalendarRange}
            title={`Chưa có kỳ năm ${year}`}
            description={
              canCreate
                ? 'Bấm "Tạo năm" để khởi tạo 12 kỳ, hoặc đảm bảo năm đã được seed từ Cài đặt.'
                : 'Liên hệ kế toán trưởng để khởi tạo năm tài chính.'
            }
            action={
              canCreate
                ? { label: `Tạo năm ${year}`, onClick: () => ensureYear.mutate(year) }
                : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={list}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return
          const { type, period } = confirm
          try {
            if (type === 'close') {
              await closePeriod.mutateAsync(period.id)
            } else {
              await reopenPeriod.mutateAsync(period.id)
            }
            setConfirm(null)
          } catch {
            /* toast từ mutation onError */
          }
        }}
        title={
          confirm?.type === 'close'
            ? `Khóa kỳ ${confirm.period.month}/${confirm.period.year}?`
            : `Mở lại kỳ ${confirm?.period.month}/${confirm?.period.year}?`
        }
        message={
          confirm?.type === 'close'
            ? 'Sau khi khóa, không thể ghi sổ chứng từ vào kỳ này cho đến khi mở lại.'
            : 'Mở lại kỳ cho phép ghi sổ / điều chỉnh. Chỉ dùng khi cần sửa dữ liệu.'
        }
        variant={confirm?.type === 'close' ? 'danger' : 'default'}
        confirmText={confirm?.type === 'close' ? 'Khóa kỳ' : 'Mở lại'}
        cancelText="Huỷ"
        isLoading={closePeriod.isPending || reopenPeriod.isPending}
      />
    </div>
  )
}
