// ============================================================
// TaxDeclarationPage — Tổng hợp GTGT stub (FR-ACC-TAX-UX)
// Route: /accounting/tax
// ============================================================

import { useState } from 'react'
import { FileSpreadsheet, HelpCircle, Loader2 } from 'lucide-react'
import { Button, PageHeader, PageGuideButton, ErrorState, EmptyState, Select } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { FilterBar } from '@/components/ui/FilterBar'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import { TAX_PIPELINE, taxStepIndex } from '../constants/accountingWorkflow'
import { TAX_GUIDE } from '../constants/tax.guide'
import { useVatReport } from '../hooks/useAccounting'

import { pageRootClass, embeddedFilterBarProps } from '../utils/pageEmbed'
import { ReportToolbarActions } from '../components/ReportToolbarActions'

export function TaxDeclarationPage({ embedded }: { embedded?: boolean } = {}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [applied, setApplied] = useState<{ year: number; month: number } | null>(null)

  const { data, isLoading, isError, error, refetch } = useVatReport(
    applied?.year,
    applied?.month,
  )
  const hasData = !!(data && (data.outputVat != null || data.inputVat != null))
  const pipelineIndex = taxStepIndex(hasData)

  const hasActiveFilters =
    year !== now.getFullYear()
    || month !== now.getMonth() + 1
    || !!applied

  const clearFilters = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
    setApplied(null)
  }

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (error as Error)?.message
    || 'Không tải được tổng hợp GTGT.'

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Tờ khai GTGT"
        description="Tổng hợp hoá đơn đầu vào/ra theo tháng — bước 1–2 trong luồng kê khai thuế."
        actions={(
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Tổng hợp GTGT: cộng thuế đầu ra, đầu vào theo tháng — chưa thay thế nộp tờ khai trên cổng thuế."
              aria-label="Giải thích tờ khai GTGT"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
            <PageGuideButton guide={TAX_GUIDE} />
          </div>
        )}
      />
      )}

      <StatusPipelineStepper steps={TAX_PIPELINE} currentIndex={pipelineIndex} />

      <FilterBar
        {...embeddedFilterBarProps(embedded)}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={
          applied
            ? `Tháng ${String(applied.month).padStart(2, '0')}/${applied.year}`
            : 'Chưa tổng hợp'
        }
        extra={embedded ? (
          <ReportToolbarActions guide={TAX_GUIDE} />
        ) : undefined}
      >
        <div className="min-w-[100px]">
          <Select
            options={[year - 1, year, year + 1].map((y) => ({
              value: String(y),
              label: `Năm ${y}`,
            }))}
            value={String(year)}
            onChange={(v) => setYear(Number(v))}
            showSearch={false}
            aria-label="Năm"
          />
        </div>
        <div className="min-w-[120px]">
          <Select
            options={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
              value: String(m),
              label: `Tháng ${String(m).padStart(2, '0')}`,
            }))}
            value={String(month)}
            onChange={(v) => setMonth(Number(v))}
            showSearch={false}
            aria-label="Tháng"
          />
        </div>
        <Button
          className="h-9"
          onClick={() => setApplied({ year, month })}
        >
          Tổng hợp
        </Button>
      </FilterBar>

      {!applied && (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileSpreadsheet}
            title="Chọn kỳ và bấm Tổng hợp"
            description="Hệ thống sẽ cộng GTGT đầu ra, đầu vào từ hoá đơn đã ghi sổ trong tháng."
          />
        </div>
      )}

      {applied && isLoading && (
        <div className="p-8 text-center text-neutral-500 border rounded-xl bg-white">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tổng hợp GTGT…
        </div>
      )}

      {applied && isError && (
        <div className="border rounded-xl bg-white">
          <ErrorState title="Lỗi tổng hợp" message={errMsg} onRetry={() => refetch()} />
        </div>
      )}

      {applied && !isLoading && !isError && data && (
        <div className="grid md:grid-cols-3 gap-3">
          <VatCard label="GTGT đầu ra" value={data.outputVat} tone="blue" />
          <VatCard label="GTGT đầu vào" value={data.inputVat} tone="violet" />
          <VatCard label="GTGT phải nộp (ròng)" value={data.netVat} tone="emerald" highlight />
        </div>
      )}

      {data?.note && (
        <p className="text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <FileSpreadsheet size={16} className="shrink-0 mt-0.5 text-amber-700" />
          {data.note}
        </p>
      )}

      <p className="text-xs text-neutral-500">
        Bước 3–5 (lập tờ khai, nộp cổng thuế, lưu chứng từ) thực hiện ngoài Frezo hoặc module đính kèm hồ sơ.
      </p>
    </div>
  )
}

function VatCard({
  label,
  value,
  tone,
  highlight,
}: {
  label: string
  value?: number | null
  tone: 'blue' | 'violet' | 'emerald'
  highlight?: boolean
}) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50/50',
    violet: 'border-violet-200 bg-violet-50/50',
    emerald: 'border-emerald-200 bg-emerald-50/50',
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]} ${highlight ? 'ring-1 ring-emerald-300' : ''}`}>
      <div className="text-xs text-neutral-600 mb-1">{label}</div>
      <div className="text-xl font-semibold font-mono tabular-nums">
        {formatCurrency(value ?? 0)}
      </div>
    </div>
  )
}

