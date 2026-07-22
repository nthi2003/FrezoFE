import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, PageHeader } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { useTrialBalance } from '../hooks/useAccounting'
import type { TrialBalanceRow } from '../services/accountingApi'

function firstOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function lastOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export function TrialBalancePage() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(lastOfMonth())
  const [applied, setApplied] = useState<{ from: string; to: string } | null>({
    from: firstOfMonth(), to: lastOfMonth(),
  })

  const { data: rows, isFetching } = useTrialBalance(applied?.from, applied?.to)
  const list = (rows as any[] as TrialBalanceRow[]) ?? []

  const totals = useMemo(() => {
    return list.reduce((acc, r) => {
      acc.oD += r.openingDebit || 0
      acc.oC += r.openingCredit || 0
      acc.pD += r.periodDebit || 0
      acc.pC += r.periodCredit || 0
      acc.cD += r.closingDebit || 0
      acc.cC += r.closingCredit || 0
      return acc
    }, { oD: 0, oC: 0, pD: 0, pC: 0, cD: 0, cC: 0 })
  }, [list])

  const balanced = totals.pD === totals.pC

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Bảng cân đối tài khoản (Trial Balance)"
        description="Tổng hợp số dư đầu — phát sinh — số dư cuối của toàn bộ TK trong kỳ."
      />

      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border">
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Từ ngày</label>
          <input type="date" className="border rounded-md px-3 py-2 text-sm"
            value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Đến ngày</label>
          <input type="date" className="border rounded-md px-3 py-2 text-sm"
            value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button className="gap-2" onClick={() => setApplied({ from, to })}>
          <Search size={14} /> Tra cứu
        </Button>
        <div className="flex-1" />
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          In
        </Button>
      </div>

      {isFetching && <div className="text-sm text-neutral-500">Đang tính…</div>}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="p-3 text-left font-medium w-24">TK</th>
                <th className="p-3 text-left font-medium">Tên tài khoản</th>
                <th className="p-3 text-right font-medium">Đầu Nợ</th>
                <th className="p-3 text-right font-medium">Đầu Có</th>
                <th className="p-3 text-right font-medium">PS Nợ</th>
                <th className="p-3 text-right font-medium">PS Có</th>
                <th className="p-3 text-right font-medium">Cuối Nợ</th>
                <th className="p-3 text-right font-medium">Cuối Có</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.length === 0 && !isFetching && (
                <tr><td colSpan={8} className="p-6 text-center text-neutral-500">Chưa có phát sinh trong kỳ</td></tr>
              )}
              {list.map((r) => (
                <tr key={r.accountId} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono text-blue-700">{r.accountCode}</td>
                  <td className="p-3">{r.accountName}</td>
                  <td className="p-3 text-right font-mono">{r.openingDebit ? formatCurrency(r.openingDebit) : ''}</td>
                  <td className="p-3 text-right font-mono">{r.openingCredit ? formatCurrency(r.openingCredit) : ''}</td>
                  <td className="p-3 text-right font-mono">{r.periodDebit ? formatCurrency(r.periodDebit) : ''}</td>
                  <td className="p-3 text-right font-mono">{r.periodCredit ? formatCurrency(r.periodCredit) : ''}</td>
                  <td className="p-3 text-right font-mono">{r.closingDebit ? formatCurrency(r.closingDebit) : ''}</td>
                  <td className="p-3 text-right font-mono">{r.closingCredit ? formatCurrency(r.closingCredit) : ''}</td>
                </tr>
              ))}
            </tbody>
            {list.length > 0 && (
              <tfoot className="bg-neutral-900 text-white font-semibold">
                <tr>
                  <td className="p-3" colSpan={2}>Tổng cộng</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.oD)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.oC)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.pD)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.pC)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.cD)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(totals.cC)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {list.length > 0 && (
        <div className={`p-4 rounded-lg border text-sm ${
          balanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                   : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {balanced
            ? '✓ Sổ CÂN — Tổng phát sinh Nợ = Tổng phát sinh Có'
            : '⚠ Sổ LỆCH — Tổng Nợ ≠ Tổng Có. Cần rà soát chứng từ ngay.'}
        </div>
      )}
    </div>
  )
}
