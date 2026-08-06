// ============================================================
// FinancialStatementsPage — BCĐKT / KQKD
// Route: /accounting/financial-statements
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import {
  Download, FileSpreadsheet, HelpCircle, Landmark, Printer, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, EmptyState, ErrorState, PageGuideButton, PageHeader, AppTooltip,
} from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { downloadCsv } from '@/lib/export/toCsv'
import { usePeriods } from '../hooks/useAccounting'
import {
  useBalanceSheet,
  useIncomeStatement,
} from '../hooks/useFinancialReports'
import type { FiscalPeriod } from '../services/accountingApi'
import type { ReportLineDto } from '../services/financialReportsApi'
import { FINANCIAL_STATEMENTS_GUIDE } from '../constants/financial-statements.guide'

import { pageRootClass, embeddedFilterBarProps } from '../utils/pageEmbed'
import { ReportToolbarActions } from '../components/ReportToolbarActions'
import { PeriodFilterControls } from '../components/PeriodFilterControls'

type Tab = 'bs' | 'is'

interface ReportRow extends ReportLineDto {
  _key: string
}

function toDateKey(iso?: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
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

export function FinancialStatementsPage({ embedded }: { embedded?: boolean } = {}) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('bs')
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

  const bs = useBalanceSheet(from, to)
  const is = useIncomeStatement(from, to)
  const active = tab === 'bs' ? bs : is

  const report = active.data
  const list = useMemo<ReportRow[]>(() => {
    const lines = report?.lines ?? []
    return lines.map((ln, i) => ({
      ...ln,
      _key: `${ln.code ?? 'x'}-${i}-${ln.label}`,
    }))
  }, [report?.lines])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (r) =>
        (r.code || '').toLowerCase().includes(q)
        || (r.label || '').toLowerCase().includes(q),
    )
  }, [list, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !active.isLoading && !active.isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !active.isLoading && !active.isError && list.length === 0

  const clearFilters = () => setSearch('')

  const errMsg =
    (active.error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (active.error as Error)?.message
    || 'Không tải được báo cáo tài chính.'

  const tabLabel = tab === 'bs' ? 'Bảng cân đối kế toán' : 'Kết quả kinh doanh'
  const reportTotal = report?.total

  const exportCsv = () => {
    if (filtered.length === 0) return
    downloadCsv(
      `${tab === 'bs' ? 'balance-sheet' : 'income-statement'}-${from ?? 'from'}_${to ?? 'to'}`,
      filtered,
      [
        { header: 'Mã', accessor: 'code' },
        { header: 'Chỉ tiêu', accessor: 'label' },
        { header: 'Cấp', accessor: 'level' },
        { header: 'Số tiền', accessor: 'amount' },
      ],
    )
    toast.success(`Đã xuất ${filtered.length} chỉ tiêu ra CSV`)
  }

  const columns: AppTableColumn<ReportRow>[] = [
    {
      key: 'code',
      title: 'Mã',
      width: 88,
      render: (_, r) => (
        <span className="font-mono text-xs text-neutral-600">{r.code || '—'}</span>
      ),
    },
    {
      key: 'label',
      title: 'Chỉ tiêu',
      render: (_, r) => (
        <span
          className={`text-neutral-800 ${(r.level ?? 0) === 0 ? 'font-semibold' : ''}`}
          style={{ paddingLeft: `${(r.level || 0) * 16}px` }}
          title={r.label}
        >
          {r.label}
        </span>
      ),
    },
    {
      key: 'amount',
      title: 'Số tiền',
      align: 'right',
      width: 160,
      render: (_, r) => (
        <span
          className={`font-mono tabular-nums ${(r.level ?? 0) === 0 ? 'font-semibold' : ''}`}
          title="Số tiền chỉ tiêu trong kỳ"
        >
          {formatCurrency(r.amount)}
        </span>
      ),
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Báo cáo tài chính"
        description="Bảng cân đối kế toán (BCĐKT) và Kết quả kinh doanh (KQKD) theo kỳ kế toán."
        actions={(
          <div className="flex items-center gap-2">
            <HintIcon label="Báo cáo tài chính: BCĐKT phản ánh tài sản/nguồn vốn tại cuối kỳ; KQKD phản ánh lãi/lỗ trong kỳ. Khác bảng cân đối thử (Trial Balance)." />
            <PageGuideButton guide={FINANCIAL_STATEMENTS_GUIDE} />
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
            <AppTooltip content="In báo cáo tài chính">
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

      {!embedded && (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 bg-blue-50 text-blue-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
            <FileSpreadsheet size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
              Loại báo cáo
            </div>
            <div className="text-sm font-bold text-neutral-900 leading-tight truncate">
              {tab === 'bs' ? 'BCĐKT' : 'KQKD'}
            </div>
            <div className="text-[10px] opacity-80 truncate mt-0.5">{tabLabel}</div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 bg-emerald-50 text-emerald-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
            <Landmark size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
              Số chỉ tiêu
            </div>
            <div className="text-lg font-bold tabular-nums text-neutral-900 leading-tight truncate">
              {filtered.length}
            </div>
            <div className="text-[10px] opacity-80 truncate mt-0.5">
              {hasFilter ? 'Sau lọc' : 'Trong kỳ'}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 bg-violet-50 text-violet-700 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-violet-100 text-violet-600">
            <FileSpreadsheet size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate inline-flex items-center gap-1">
              Kỳ báo cáo
              <HintIcon label="Kỳ lấy từ năm + tháng kế toán (startDate → endDate). Đổi Tháng 1–12 trên thanh lọc." />
            </div>
            <div className="text-sm font-bold tabular-nums text-neutral-900 leading-tight truncate">
              {from && to ? `${from} → ${to}` : '—'}
            </div>
            {typeof reportTotal === 'number' && (
              <div className="text-[10px] opacity-80 truncate mt-0.5">
                Tổng: {formatCurrency(reportTotal)}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {!embedded && (
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <HintIcon label="BCĐKT = Bảng cân đối kế toán: tài sản và nguồn vốn tại thời điểm cuối kỳ." />
          BCĐKT = bảng cân đối KT
        </span>
        <span className="inline-flex items-center gap-1">
          <HintIcon label="KQKD = Báo cáo kết quả hoạt động kinh doanh: doanh thu, chi phí, lãi/lỗ trong kỳ." />
          KQKD = kết quả KD
        </span>
        <span className="inline-flex items-center gap-1">
          <HintIcon label="Dòng cấp 0 (in đậm): chỉ tiêu tổng hợp. Dòng thụt lề: chi tiết theo cấp." />
          Cấp chỉ tiêu
        </span>
      </div>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loại báo cáo tài chính">
        {(
          [
            {
              key: 'bs' as const,
              short: 'BCĐKT',
              label: 'Bảng cân đối kế toán',
              hint: 'Bảng cân đối kế toán — tài sản / nguồn vốn cuối kỳ',
            },
            {
              key: 'is' as const,
              short: 'KQKD',
              label: 'Kết quả kinh doanh',
              hint: 'Báo cáo kết quả hoạt động kinh doanh — lãi/lỗ trong kỳ',
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            title={t.hint}
            className={`h-9 px-3 rounded-lg text-sm font-semibold border transition-colors ${
              tab === t.key
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="hidden sm:inline text-xs font-normal opacity-70 ml-1.5">({t.short})</span>
          </button>
        ))}
      </div>

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/60 px-3 py-2">
          <div className="text-sm text-neutral-700">
            <span className="font-semibold">{tabLabel}</span>
            <span className="text-neutral-500 mx-2">·</span>
            <span className="tabular-nums">{from && to ? `${from} → ${to}` : 'Chọn kỳ'}</span>
            {typeof reportTotal === 'number' && (
              <span className="text-neutral-500 ml-2">
                · Tổng {formatCurrency(reportTotal)}
              </span>
            )}
          </div>
        </div>
      )}

      <FilterBar
        {...embeddedFilterBarProps(embedded)}
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} chỉ tiêu${hasFilter ? ' (đã lọc)' : ''}`}
        extra={(
          <ReportToolbarActions
            guide={embedded ? FINANCIAL_STATEMENTS_GUIDE : undefined}
            onExport={embedded ? exportCsv : undefined}
            exportDisabled={filtered.length === 0}
            onPrint={embedded ? () => window.print() : undefined}
          >
            <AppTooltip content="Làm mới dữ liệu kỳ hiện tại">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void active.refetch()}
                className="gap-2 h-9"
                disabled={active.isFetching || !from || !to}
                aria-label="Làm mới"
              >
                <RefreshCw size={14} className={active.isFetching ? 'animate-spin' : ''} />
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
          searchPlaceholder="Tìm mã / chỉ tiêu…"
          compact={embedded}
        />
      </FilterBar>

      {active.isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được báo cáo tài chính"
            message={errMsg}
            onRetry={() => void active.refetch()}
            isRetrying={active.isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Landmark}
            title={isFilteredEmpty ? 'Không có chỉ tiêu khớp bộ lọc' : 'Chưa có dữ liệu kỳ này'}
            description={
              isFilteredEmpty
                ? 'Thử xoá tìm kiếm hoặc đổi từ khoá mã / tên chỉ tiêu.'
                : 'Chọn kỳ khác hoặc đợi nghiệp vụ ghi sổ rồi làm mới.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : { label: 'Làm mới', onClick: () => void active.refetch() }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={active.isLoading}
          density="compact"
          showSearch={false}
          pageSize={50}
          pageSizeOptions={[20, 50, 100]}
          onRefresh={() => void active.refetch()}
          getRowId={(r) => r._key}
          getRowProps={(r) => ({
            className: (r.level ?? 0) === 0 ? 'bg-neutral-50/80' : undefined,
          })}
        />
      )}
    </div>
  )
}
