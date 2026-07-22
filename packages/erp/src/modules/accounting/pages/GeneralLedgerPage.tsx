import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button, PageHeader } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { useGeneralLedger, useAccounts } from '../hooks/useAccounting'
import type { Account } from '../services/accountingApi'

function firstOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function lastOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export function GeneralLedgerPage() {
  const [code, setCode] = useState('')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(lastOfMonth())
  const [applied, setApplied] = useState<{ code: string; from: string; to: string } | null>(null)

  const { data: accounts } = useAccounts()
  const accList = (accounts as any[]) ?? []
  const suggestions = accList.filter((a: Account) => a.code.startsWith(code)).slice(0, 8)

  const { data: gl, isFetching } = useGeneralLedger(
    applied?.code,
    applied?.from,
    applied?.to,
  )

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Sổ cái (General Ledger)"
        description="Xem chi tiết phát sinh & số dư của 1 tài khoản trong kỳ."
      />

      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-lg border">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-neutral-500 block mb-1">Số hiệu TK</label>
          <div className="relative">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              placeholder="VD: 6421, 334, 111…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {code && suggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((a: Account) => (
                  <button
                    key={a.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex justify-between"
                    onClick={() => setCode(a.code)}
                  >
                    <span className="font-mono text-blue-700">{a.code}</span>
                    <span className="text-neutral-600 truncate ml-2">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
        <Button className="gap-2" onClick={() => setApplied({ code, from, to })}>
          <Search size={14} /> Tra cứu
        </Button>
      </div>

      {isFetching && <div className="text-sm text-neutral-500">Đang tính sổ cái…</div>}

      {gl && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b bg-neutral-50 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Info label="Tài khoản" value={`${gl.accountCode} — ${gl.accountName}`} />
            <Info label="Kỳ" value={`${formatDate(gl.from)} → ${formatDate(gl.to)}`} />
            <Info label="Số dư đầu Nợ" value={formatCurrency(gl.openingDebit)} />
            <Info label="Số dư đầu Có" value={formatCurrency(gl.openingCredit)} />
            <Info label="Phát sinh Nợ" value={formatCurrency(gl.periodDebit)} />
            <Info label="Phát sinh Có" value={formatCurrency(gl.periodCredit)} />
            <Info label="Số dư cuối Nợ" value={formatCurrency(gl.closingDebit)} />
            <Info label="Số dư cuối Có" value={formatCurrency(gl.closingCredit)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-neutral-600">
                <tr>
                  <th className="p-3 text-left font-medium">Ngày</th>
                  <th className="p-3 text-left font-medium">Số CT</th>
                  <th className="p-3 text-left font-medium">Diễn giải</th>
                  <th className="p-3 text-right font-medium">Nợ</th>
                  <th className="p-3 text-right font-medium">Có</th>
                  <th className="p-3 text-right font-medium">Luỹ kế Nợ</th>
                  <th className="p-3 text-right font-medium">Luỹ kế Có</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {gl.lines?.map((l, i) => (
                  <tr key={`${l.journalEntryId}-${i}`} className="hover:bg-neutral-50">
                    <td className="p-3">{formatDate(l.postingDate as any)}</td>
                    <td className="p-3 font-mono text-xs text-blue-700">{l.journalCode}</td>
                    <td className="p-3">{l.description}</td>
                    <td className="p-3 text-right font-mono">{l.debit ? formatCurrency(l.debit) : ''}</td>
                    <td className="p-3 text-right font-mono">{l.credit ? formatCurrency(l.credit) : ''}</td>
                    <td className="p-3 text-right font-mono text-neutral-500">
                      {l.runningDebit ? formatCurrency(l.runningDebit) : ''}
                    </td>
                    <td className="p-3 text-right font-mono text-neutral-500">
                      {l.runningCredit ? formatCurrency(l.runningCredit) : ''}
                    </td>
                  </tr>
                ))}
                {(!gl.lines || gl.lines.length === 0) && (
                  <tr><td colSpan={7} className="p-6 text-center text-neutral-500">Không có phát sinh</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm font-semibold font-mono">{value ?? '—'}</div>
    </div>
  )
}
