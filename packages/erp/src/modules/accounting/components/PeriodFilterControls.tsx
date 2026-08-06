import { Search } from 'lucide-react'
import { Select } from '@frezo/ui'
import type { FiscalPeriod } from '../services/accountingApi'

function toDateKey(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

type PeriodFilterControlsProps = {
  year: number
  onYearChange: (year: number) => void
  periodList: FiscalPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** Hub embedded — dropdown tháng thay cho 12 nút. */
  compact?: boolean
}

export function PeriodFilterControls({
  year,
  onYearChange,
  periodList,
  selectedPeriodId,
  onPeriodChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm…',
  compact = false,
}: PeriodFilterControlsProps) {
  return (
    <>
      <div className="min-w-[100px]">
        <Select
          options={[year - 1, year, year + 1].map((y) => ({
            value: String(y),
            label: `Năm ${y}`,
          }))}
          value={String(year)}
          onChange={(v) => onYearChange(Number(v))}
          showSearch={false}
          aria-label="Năm kỳ kế toán"
        />
      </div>
      {compact ? (
        <div className="min-w-[130px]">
          <Select
            options={periodList.map((p) => ({
              value: p.id,
              label: `Tháng ${p.month}${p.status === 'CLOSED' || p.status === 'LOCKED' ? ' · đóng' : ''}`,
            }))}
            value={selectedPeriodId ?? ''}
            onChange={onPeriodChange}
            showSearch={false}
            placeholder="Chọn tháng"
            aria-label="Tháng kỳ kế toán"
          />
        </div>
      ) : (
        <div className="flex gap-1 border rounded-md p-0.5 bg-white overflow-x-auto max-w-full">
          {periodList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1.5 text-sm rounded whitespace-nowrap ${
                selectedPeriodId === p.id
                  ? 'bg-neutral-900 text-white'
                  : p.status === 'CLOSED' || p.status === 'LOCKED'
                    ? 'text-neutral-400'
                    : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              title={`Tháng ${p.month}: ${toDateKey(p.startDate)} → ${toDateKey(p.endDate)}`}
              aria-label={`Tháng ${p.month}`}
            >
              Tháng {p.month}
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1 min-w-[180px] max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm kiếm"
        />
      </div>
    </>
  )
}
