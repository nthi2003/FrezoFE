import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Download, HelpCircle, Printer, RefreshCw, Scale,
  TrendingDown, TrendingUp, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, EmptyState, ErrorState, PageGuideButton, PageHeader, AppTooltip,
} from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { downloadCsv } from '@/lib/export/toCsv'
import { usePeriods, useTrialBalance } from '../hooks/useAccounting'
import type { FiscalPeriod, TrialBalanceRow } from '../services/accountingApi'
import { TRIAL_BALANCE_GUIDE } from '../constants/trial-balance.guide'

import { pageRootClass, embeddedFilterBarProps } from '../utils/pageEmbed'
import { ReportToolbarActions } from '../components/ReportToolbarActions'
import { PeriodFilterControls } from '../components/PeriodFilterControls'

function toDateKey(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function amt(n?: number | null) {
  return n ? formatCurrency(n) : ''
}

/** Icon ? với title/aria — repo chưa có Tooltip component riêng. */
function HintIcon({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help align-middle"
      title={label}
      aria-label={label}
    >
      <HelpCircle size={13} strokeWidth={2} />
    </span>
  )
}

export function TrialBalancePage({ embedded }: { embedded?: boolean } = {}) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: periods } = usePeriods(year)
  const periodList = useMemo(
    () => (Array.isArray(periods) ? (periods as FiscalPeriod[]) : []),
    [periods],
  )

  useEffect(() => {
    if (periodList.length > 0 && !selectedPeriodId) {
      const currentMonth = new Date().getMonth() + 1
      const current = periodList.find((p) => p.month === currentMonth) || periodList[0]
      setSelectedPeriodId(current.id)
    }
  }, [periodList, selectedPeriodId])

  const selectedPeriod = useMemo(
    () => periodList.find((p) => p.id === selectedPeriodId) ?? null,
    [periodList, selectedPeriodId],
  )

  const from = selectedPeriod ? toDateKey(selectedPeriod.startDate) : undefined
  const to = selectedPeriod ? toDateKey(selectedPeriod.endDate) : undefined

  const {
    data: rows,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTrialBalance(from, to)

  const list = useMemo(
    () => (Array.isArray(rows) ? (rows as TrialBalanceRow[]) : []),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (r) =>
        r.accountCode.toLowerCase().includes(q)
        || (r.accountName || '').toLowerCase().includes(q),
    )
  }, [list, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const clearFilters = () => setSearch('')

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.pD += r.periodDebit || 0
        acc.pC += r.periodCredit || 0
        return acc
      },
      { pD: 0, pC: 0 },
    )
  }, [filtered])

  const periodDiff = totals.pD - totals.pC
  const balanced = Math.abs(periodDiff) < 0.01

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (error as Error)?.message
    || 'Không tải được bảng cân đối thử.'

  const exportCsv = () => {
    if (filtered.length === 0) return
    downloadCsv(
      `trial-balance-${from ?? 'from'}_${to ?? 'to'}`,
      filtered,
      [
        { header: 'TK', accessor: 'accountCode' },
        { header: 'Tên tài khoản', accessor: 'accountName' },
        { header: 'Nợ đầu', accessor: 'openingDebit' },
        { header: 'Có đầu', accessor: 'openingCredit' },
        { header: 'PS Nợ', accessor: 'periodDebit' },
        { header: 'PS Có', accessor: 'periodCredit' },
        { header: 'Nợ cuối', accessor: 'closingDebit' },
        { header: 'Có cuối', accessor: 'closingCredit' },
      ],
    )
    toast.success(`Đã xuất ${filtered.length} tài khoản ra CSV`)
  }

  const columns: AppTableColumn<TrialBalanceRow>[] = [
    {
      key: 'accountCode',
      title: 'Mã TK',
      width: 88,
      render: (_, r) => (
        <span className="font-mono font-semibold text-primary-700">{r.accountCode}</span>
      ),
    },
    {
      key: 'accountName',
      title: 'Tên tài khoản',
      render: (_, r) => (
        <span className="text-neutral-800 line-clamp-2">{r.accountName || '—'}</span>
      ),
    },
    {
      key: 'openingDebit',
      title: 'Nợ đầu',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="Số dư Nợ đầu kỳ">{amt(r.openingDebit)}</span>
      ),
    },
    {
      key: 'openingCredit',
      title: 'Có đầu',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="Số dư Có đầu kỳ">{amt(r.openingCredit)}</span>
      ),
    },
    {
      key: 'periodDebit',
      title: 'PS Nợ',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="PS = Phát sinh Nợ trong kỳ">{amt(r.periodDebit)}</span>
      ),
    },
    {
      key: 'periodCredit',
      title: 'PS Có',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="PS = Phát sinh Có trong kỳ">{amt(r.periodCredit)}</span>
      ),
    },
    {
      key: 'closingDebit',
      title: 'Nợ cuối',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="Số dư Nợ cuối kỳ">{amt(r.closingDebit)}</span>
      ),
    },
    {
      key: 'closingCredit',
      title: 'Có cuối',
      align: 'right',
      render: (_, r) => (
        <span className="font-mono tabular-nums" title="Số dư Có cuối kỳ">{amt(r.closingCredit)}</span>
      ),
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Bảng cân đối thử"
        description="Số dư đầu — phát sinh — số dư cuối theo từng TK trong kỳ; kiểm tra tổng Nợ = Có."
        actions={(
          <div className="flex items-center gap-2">
            <HintIcon label="Bảng cân đối thử (Trial Balance): tổng hợp số dư & phát sinh toàn bộ tài khoản trong kỳ để kiểm tra sổ có cân. Khác BCĐKT (Bảng cân đối kế toán)." />
            <PageGuideButton guide={TRIAL_BALANCE_GUIDE} />
            <AppTooltip content="Xuất CSV theo bộ lọc hiện tại">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                disabled={filtered.length === 0}
                onClick={exportCsv}
                aria-label="Xuất CSV"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Xuất CSV</span>
              </Button>
            </AppTooltip>
            <AppTooltip content="In bảng cân đối thử">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => window.print()}
                aria-label="In"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">In</span>
              </Button>
            </AppTooltip>
          </div>
        )}
      />
      )}

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${embedded ? 'md:grid-cols-2 xl:grid-cols-4' : ''}`}>
        <TbKpi
          icon={Wallet}
          label="Số tài khoản"
          value={String(filtered.length)}
          tone="blue"
          hint={hasFilter ? 'Sau lọc' : 'Trong kỳ'}
        />
        <TbKpi
          icon={TrendingUp}
          label="Tổng PS Nợ"
          value={formatCurrency(totals.pD)}
          tone="emerald"
          hint="Phát sinh Nợ"
        />
        <TbKpi
          icon={TrendingDown}
          label="Tổng PS Có"
          value={formatCurrency(totals.pC)}
          tone="violet"
          hint="Phát sinh Có"
        />
        <TbKpi
          icon={balanced ? Scale : AlertTriangle}
          label="Cân đối PS"
          value={balanced ? 'Cân' : formatCurrency(Math.abs(periodDiff))}
          tone={balanced ? 'teal' : 'rose'}
          hint={balanced ? 'PS Nợ = PS Có ✓' : 'Lệch — rà soát nhật ký'}
        />
      </div>

      {!embedded && (
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <HintIcon label="Nợ đầu / Có đầu: số dư đầu kỳ của tài khoản." />
          Nợ/Có đầu
        </span>
        <span className="inline-flex items-center gap-1">
          <HintIcon label="PS = Phát sinh — tổng ghi sổ Nợ hoặc Có trong kỳ đang chọn." />
          PS = phát sinh
        </span>
        <span className="inline-flex items-center gap-1">
          <HintIcon label="Nợ cuối / Có cuối: số dư cuối kỳ sau khi cộng phát sinh." />
          Nợ/Có cuối
        </span>
      </div>
      )}

      <FilterBar
        {...embeddedFilterBarProps(embedded)}
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} tài khoản${hasFilter ? ' (đã lọc)' : ''}`}
        extra={(
          <ReportToolbarActions
            guide={embedded ? TRIAL_BALANCE_GUIDE : undefined}
            onExport={embedded ? exportCsv : undefined}
            exportDisabled={filtered.length === 0}
            onPrint={embedded ? () => window.print() : undefined}
          >
            <AppTooltip content="Làm mới dữ liệu kỳ hiện tại">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="gap-2 h-9"
                disabled={isFetching || !from || !to}
                aria-label="Làm mới"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
            </AppTooltip>
          </ReportToolbarActions>
        )}
      >
        <PeriodFilterControls
          year={year}
          onYearChange={(y) => { setYear(y); setSelectedPeriodId(null) }}
          periodList={periodList}
          selectedPeriodId={selectedPeriodId}
          onPeriodChange={setSelectedPeriodId}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm mã / tên tài khoản…"
          compact={embedded}
        />
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được bảng cân đối thử"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Scale}
            title={isFilteredEmpty ? 'Không có tài khoản khớp bộ lọc' : 'Chưa có phát sinh trong kỳ'}
            description={
              isFilteredEmpty
                ? 'Thử xoá tìm kiếm hoặc đổi từ khoá mã / tên TK.'
                : 'Chọn kỳ khác hoặc đợi nghiệp vụ ghi sổ (nhật ký).'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : { label: 'Làm mới', onClick: () => void refetch() }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}
    </div>
  )
}

interface TbKpiProps {
  icon: LucideIcon
  label: string
  value: string
  tone: 'blue' | 'emerald' | 'violet' | 'rose' | 'teal'
  hint?: string
}

function TbKpi({ icon: Icon, label, value, tone, hint }: TbKpiProps) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    violet: 'bg-violet-50 text-violet-700 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
    rose: 'bg-rose-50 text-rose-700 [&_.ico]:bg-rose-100 [&_.ico]:text-rose-600',
    teal: 'bg-teal-50 text-teal-700 [&_.ico]:bg-teal-100 [&_.ico]:text-teal-600',
  }[tone]
  return (
    <div className={`rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-lg font-bold tabular-nums text-neutral-900 leading-tight truncate">
          {value}
        </div>
        {hint && <div className="text-[10px] opacity-80 truncate mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
