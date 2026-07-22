// ============================================================
// AssetDepreciationPanel — Sinh lịch + list schedule (drawer tab)
// ============================================================

import { useState } from 'react'
import { Calculator, Loader2, CheckCircle2, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, EmptyState, ErrorState, StatusBadge } from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useDepreciationSchedules,
  useGenerateDepreciationSchedule,
} from '../hooks/useDepreciation'
import { fmtMoneyFull } from '../constants/assetMeta'

interface Props {
  assetId: string
}

const SCHEDULE_STATUS: Record<
  string,
  { label: string; color: StatusColor; icon: LucideIcon }
> = {
  ACTIVE: { label: 'Đang hiệu lực', color: 'success', icon: CheckCircle2 },
  DONE: { label: 'Hoàn tất', color: 'neutral', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'danger', icon: Clock },
}

export function AssetDepreciationPanel({ assetId }: Props) {
  const canCreate = usePermission('ASSET.DEPRECIATION.CREATE')
  const {
    data: schedules = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useDepreciationSchedules(assetId)
  const generate = useGenerateDepreciationSchedule(assetId)
  const [months, setMonths] = useState(36)
  // BA Q3: ẩn DECLINING — chỉ Đường thẳng trong cycle này
  const method = 'STRAIGHT_LINE'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
          Khấu hao
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 px-2 h-8 inline-flex items-center border rounded-md bg-neutral-50">
              Đường thẳng
            </span>
            <input
              type="number"
              min={1}
              max={120}
              className="w-16 h-8 border rounded-md px-2 text-xs tabular-nums"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value) || 36)}
              title="Số tháng"
              aria-label="Số tháng khấu hao"
            />
            <Button
              size="sm"
              className="gap-1"
              disabled={generate.isPending}
              onClick={() => generate.mutate({ method, months })}
            >
              {generate.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Calculator size={12} />
              )}
              Sinh lịch
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-neutral-400">
          <Loader2 size={16} className="animate-spin mx-auto" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được lịch khấu hao"
          message="Vui lòng thử lại."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Chưa có lịch khấu hao"
          description="Sinh lịch trước khi ghi sổ định kỳ."
        />
      ) : (
        <ul className="space-y-2">
          {schedules.map((s) => {
            const st = SCHEDULE_STATUS[(s.status || '').toUpperCase()] ?? {
              label: s.status || '—',
              color: 'neutral' as StatusColor,
              icon: Clock,
            }
            return (
              <li
                key={s.id}
                className="border rounded-lg px-3 py-2 text-xs bg-neutral-50"
              >
                <div className="flex justify-between gap-2 items-center">
                  <span className="font-semibold text-neutral-800">
                    Đường thẳng · {s.months ?? '—'} tháng
                  </span>
                  <StatusBadge
                    label={st.label}
                    color={st.color}
                    icon={st.icon}
                  />
                </div>
                <div className="text-neutral-500 mt-0.5">
                  {s.startDate || '—'} · tháng{' '}
                  <b className="tabular-nums text-neutral-800">
                    {fmtMoneyFull(s.monthlyAmount)}
                  </b>
                  {s.remainingValue != null && (
                    <> · còn {fmtMoneyFull(s.remainingValue)}</>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
