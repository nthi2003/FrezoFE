import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarRange,
  Lock,
  LockOpen,
  RotateCw,
  Unlock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatusBadge,
} from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
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
  OPEN: { label: 'Mở', color: 'success', icon: Unlock },
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

export function FiscalPeriodsPage() {
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

  if (!canView) {
    return (
      <div className="p-6 animate-fade-in max-w-4xl mx-auto">
        <PageHeader
          title="Kỳ kế toán"
          description="Xem và khóa/mở lại kỳ theo năm tài chính."
        />
        <div className="mt-4 border rounded-xl bg-white">
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
    <div className="p-6 space-y-4 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Kỳ kế toán"
        description="Khóa kỳ để chặn ghi sổ mới; mở lại khi cần điều chỉnh. Kỳ khóa cứng (LOCKED) không mở từ UI."
        actions={
          <Link to="/accounting/settings">
            <Button variant="outline">Cài đặt kế toán</Button>
          </Link>
        }
      />

      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-neutral-500 space-y-1">
          Năm
          <input
            type="number"
            className="block w-28 border rounded-md px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
          />
        </label>
        {canCreate && (
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={ensureYear.isPending}
            onClick={() => ensureYear.mutate(year)}
          >
            <RotateCw size={14} />
            Tạo năm {year} + 12 kỳ
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-1.5"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Làm mới
        </Button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        {isError ? (
          <ErrorState
            title="Không tải được danh sách kỳ"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra quyền VIEW kỳ kế toán."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-md bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title={`Chưa có kỳ năm ${year}`}
            description={
              canCreate
                ? 'Bấm “Tạo năm + 12 kỳ” để khởi tạo, hoặc đảm bảo năm đã được seed từ Cài đặt.'
                : 'Liên hệ kế toán trưởng để khởi tạo năm tài chính.'
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Kỳ</th>
                <th className="px-4 py-2.5 font-medium">Từ ngày</th>
                <th className="px-4 py-2.5 font-medium">Đến ngày</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const cfg = PERIOD_STATUS[p.status] ?? PERIOD_STATUS.OPEN
                const isBusy = busyId === p.id
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {MONTH_LABEL[p.month - 1] ?? `Tháng ${p.month}`}/{p.year}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{p.startDate}</td>
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{p.endDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={cfg.label} color={cfg.color} icon={cfg.icon} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canUpdate && p.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isBusy}
                          onClick={() => setConfirm({ type: 'close', period: p })}
                        >
                          <Lock size={14} />
                          Khóa kỳ
                        </Button>
                      )}
                      {canUpdate && p.status === 'CLOSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={isBusy}
                          onClick={() => setConfirm({ type: 'reopen', period: p })}
                        >
                          <LockOpen size={14} />
                          Mở lại
                        </Button>
                      )}
                      {p.status === 'LOCKED' && (
                        <span className="text-xs text-neutral-400">Không mở từ UI</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

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
