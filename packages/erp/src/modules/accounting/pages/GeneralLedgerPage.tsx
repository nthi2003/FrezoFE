import { useMemo, useState } from 'react'
import { BookOpen, Download, HelpCircle, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, EmptyState, ErrorState, PageHeader, AppTooltip } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { downloadCsv } from '@/lib/export/toCsv'
import { useGeneralLedger, useAccounts } from '../hooks/useAccounting'
import type { Account, GLLine } from '../services/accountingApi'

import { pageRootClass } from '../utils/pageEmbed'

function firstOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function lastOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export function GeneralLedgerPage({ embedded }: { embedded?: boolean } = {}) {
  const defaultFrom = firstOfMonth()
  const defaultTo = lastOfMonth()

  const [code, setCode] = useState('')
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [applied, setApplied] = useState<{ code: string; from: string; to: string } | null>(null)

  const { data: accounts } = useAccounts()
  const accList = (accounts as Account[]) ?? []
  const suggestions = accList.filter((a) => a.code.startsWith(code)).slice(0, 8)

  const {
    data: gl,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGeneralLedger(applied?.code, applied?.from, applied?.to)

  const lines = useMemo(
    () => (Array.isArray(gl?.lines) ? (gl!.lines as GLLine[]) : []),
    [gl],
  )

  const hasActiveFilters =
    !!code.trim()
    || from !== defaultFrom
    || to !== defaultTo
    || !!applied

  const clearFilters = () => {
    setCode('')
    setFrom(defaultFrom)
    setTo(defaultTo)
    setApplied(null)
  }

  const applySearch = () => {
    const trimmed = code.trim()
    if (!trimmed) {
      toast.error('Nhập số hiệu tài khoản')
      return
    }
    setApplied({ code: trimmed, from, to })
  }

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (error as Error)?.message
    || 'Không tải được sổ cái.'

  const exportCsv = () => {
    if (!gl) return
    downloadCsv(
      `so-cai-${gl.accountCode}-${gl.from}_${gl.to}`,
      lines,
      [
        {
          header: 'Ngày',
          accessor: 'postingDate',
          format: (v) => (v ? formatDate(v as string) : ''),
        },
        { header: 'Số CT', accessor: 'journalCode' },
        { header: 'Diễn giải', accessor: 'description' },
        { header: 'Nợ', accessor: 'debit' },
        { header: 'Có', accessor: 'credit' },
        { header: 'Luỹ kế Nợ', accessor: 'runningDebit' },
        { header: 'Luỹ kế Có', accessor: 'runningCredit' },
      ],
    )
    toast.success(`Đã xuất ${lines.length} dòng sổ cái ra CSV`)
  }

  const columns: AppTableColumn<GLLine>[] = [
    {
      key: 'postingDate',
      title: 'Ngày',
      render: (_, l) => (
        <span className="text-neutral-600">{formatDate(l.postingDate as string)}</span>
      ),
    },
    {
      key: 'journalCode',
      title: 'Số CT',
      width: 100,
      render: (_, l) => (
        <span className="font-mono text-xs text-primary-700">{l.journalCode}</span>
      ),
    },
    {
      key: 'description',
      title: 'Diễn giải',
      render: (_, l) => (
        <span className="text-neutral-800 line-clamp-2">{l.description || '—'}</span>
      ),
    },
    {
      key: 'debit',
      title: 'Nợ',
      align: 'right',
      render: (_, l) => (
        <span className="font-mono tabular-nums">{l.debit ? formatCurrency(l.debit) : ''}</span>
      ),
    },
    {
      key: 'credit',
      title: 'Có',
      align: 'right',
      render: (_, l) => (
        <span className="font-mono tabular-nums">{l.credit ? formatCurrency(l.credit) : ''}</span>
      ),
    },
    {
      key: 'runningDebit',
      title: 'Luỹ kế Nợ',
      align: 'right',
      render: (_, l) => (
        <span className="font-mono tabular-nums text-neutral-500">
          {l.runningDebit ? formatCurrency(l.runningDebit) : ''}
        </span>
      ),
    },
    {
      key: 'runningCredit',
      title: 'Luỹ kế Có',
      align: 'right',
      render: (_, l) => (
        <span className="font-mono tabular-nums text-neutral-500">
          {l.runningCredit ? formatCurrency(l.runningCredit) : ''}
        </span>
      ),
    },
  ]

  const isFullyEmpty = !!applied && !isLoading && !isError && lines.length === 0

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Sổ cái"
        description="Xem chi tiết phát sinh và số dư của một tài khoản trong kỳ."
        actions={(
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Sổ cái (General Ledger): chi tiết từng dòng Nợ/Có của một TK trong khoảng ngày — khác bảng cân đối thử (tổng hợp nhiều TK)."
              aria-label="Giải thích sổ cái"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
            {gl && (
              <AppTooltip content="Xuất CSV theo kết quả tra cứu">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9"
                  disabled={lines.length === 0}
                  onClick={exportCsv}
                  aria-label="Xuất CSV"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </Button>
              </AppTooltip>
            )}
          </div>
        )}
      />
      )}

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={
          applied
            ? `${lines.length} dòng${hasActiveFilters ? ' (đã lọc)' : ''}`
            : 'Chưa tra cứu'
        }
        extra={applied ? (
          <div className="flex items-center gap-2">
            {gl && lines.length > 0 && (
              <AppTooltip content="Xuất CSV theo kết quả tra cứu">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9"
                  onClick={exportCsv}
                  aria-label="Xuất CSV"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </Button>
              </AppTooltip>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="gap-2 h-9"
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>
        ) : undefined}
      >
        <div className="relative min-w-[200px] max-w-xs">
          <input
            className="w-full h-9 border rounded-md px-3 text-sm font-mono bg-white"
            placeholder="Số hiệu TK (VD: 6421, 334…)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Số hiệu tài khoản"
          />
          {code && suggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
              {suggestions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex justify-between"
                  onClick={() => setCode(a.code)}
                >
                  <span className="font-mono text-primary-700">{a.code}</span>
                  <span className="text-neutral-600 truncate ml-2">{a.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="date"
          className="h-9 border rounded-md px-3 text-sm bg-white"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Từ ngày"
        />
        <input
          type="date"
          className="h-9 border rounded-md px-3 text-sm bg-white"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Đến ngày"
        />
        <Button className="gap-2 h-9" onClick={applySearch}>
          <Search size={14} /> Tra cứu
        </Button>
      </FilterBar>

      {!applied && (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={BookOpen}
            title="Tra cứu sổ cái theo tài khoản"
            description="Nhập số hiệu TK, chọn khoảng ngày và bấm Tra cứu để xem phát sinh chi tiết."
          />
        </div>
      )}

      {applied && isError && (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được sổ cái"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      )}

      {applied && !isError && isFullyEmpty && (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={BookOpen}
            title="Không có phát sinh trong kỳ"
            description={`TK ${applied.code} từ ${formatDate(applied.from)} đến ${formatDate(applied.to)} không có dòng ghi sổ.`}
            action={{ label: 'Đổi bộ lọc', onClick: clearFilters }}
          />
        </div>
      )}

      {applied && !isError && !isFullyEmpty && gl && (
        <>
          <div className="bg-white rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Info label="Tài khoản" value={`${gl.accountCode} — ${gl.accountName}`} />
            <Info label="Kỳ" value={`${formatDate(gl.from)} → ${formatDate(gl.to)}`} />
            <Info label="Số dư đầu Nợ" value={formatCurrency(gl.openingDebit)} />
            <Info label="Số dư đầu Có" value={formatCurrency(gl.openingCredit)} />
            <Info label="Phát sinh Nợ" value={formatCurrency(gl.periodDebit)} />
            <Info label="Phát sinh Có" value={formatCurrency(gl.periodCredit)} />
            <Info label="Số dư cuối Nợ" value={formatCurrency(gl.closingDebit)} />
            <Info label="Số dư cuối Có" value={formatCurrency(gl.closingCredit)} />
          </div>

          <AppTable
            columns={columns}
            data={lines}
            isLoading={isLoading}
            density="compact"
            showSearch={false}
            pageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            onRefresh={() => void refetch()}
          />
        </>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm font-semibold font-mono">{value ?? '—'}</div>
    </div>
  )
}
