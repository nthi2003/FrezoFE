// ============================================================
// FinancialStatementsPage — BCĐKT / KQKD
// Route: /accounting/financial-statements
// Export CTA ẩn khi stub (QA-FE-014) — không invent *.EXPORT
// ============================================================

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button, PageHeader, ErrorState } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import {
  useBalanceSheet,
  useIncomeStatement,
} from '../hooks/useFinancialReports'

function firstOfYear() {
  const d = new Date()
  return new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

type Tab = 'bs' | 'is'

export function FinancialStatementsPage() {
  const [from, setFrom] = useState(firstOfYear())
  const [to, setTo] = useState(today())
  const [applied, setApplied] = useState({ from: firstOfYear(), to: today() })
  const [tab, setTab] = useState<Tab>('bs')

  const bs = useBalanceSheet(applied.from, applied.to)
  const is = useIncomeStatement(applied.from, applied.to)
  const active = tab === 'bs' ? bs : is
  const report = active.data
  const lines = report?.lines ?? []

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Báo cáo tài chính"
        description="Bảng cân đối kế toán (BCĐKT) và Kết quả kinh doanh (KQKD)."
      />

      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border">
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Từ ngày</label>
          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Đến ngày</label>
          <input
            type="date"
            className="border rounded-md px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button onClick={() => setApplied({ from, to })}>Tra cứu</Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            { key: 'bs' as const, label: 'BCĐKT' },
            { key: 'is' as const, label: 'KQKD' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`h-8 px-3 rounded-full text-xs font-semibold border ${
              tab === t.key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {report?.source === 'trial-balance' && (
          <span className="text-[11px] text-amber-700 self-center">
            Stub từ Trial Balance (report API 404) — Export chưa sẵn sàng
          </span>
        )}
      </div>

      {active.isFetching && (
        <div className="text-sm text-neutral-500 flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Đang tải…
        </div>
      )}

      {active.isError && (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được báo cáo"
            message="Không tải được báo cáo tài chính (không nuốt 401/network). Vui lòng thử lại."
            onRetry={() => void active.refetch()}
            isRetrying={active.isFetching}
          />
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600 text-left">
            <tr>
              <th className="p-3 w-24">Mã</th>
              <th className="p-3">Chỉ tiêu</th>
              <th className="p-3 text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lines.map((ln, i) => (
              <tr
                key={i}
                className={ln.level === 0 ? 'bg-neutral-50 font-semibold' : ''}
              >
                <td className="p-3 font-mono text-xs">{ln.code || ''}</td>
                <td
                  className="p-3"
                  style={{ paddingLeft: `${12 + (ln.level || 0) * 16}px` }}
                >
                  {ln.label}
                </td>
                <td className="p-3 text-right tabular-nums font-mono">
                  {formatCurrency(ln.amount)}
                </td>
              </tr>
            ))}
            {lines.length === 0 && !active.isFetching && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-neutral-400">
                  Không có dữ liệu kỳ này
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
