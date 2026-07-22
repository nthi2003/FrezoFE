import { useMemo, useState } from 'react'
import { AlarmClock, Search, Send, CheckCircle2, XCircle } from 'lucide-react'
import { Button, PageHeader } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { useQuotes, useSetQuoteStatus } from '../hooks/useCrm'
import type { Quote, QuoteStatus } from '../services/crmApi'

// ============================================================
// Badge: số ngày còn lại trước khi báo giá hết hạn
// ============================================================
function ExpiryBadge({ validUntil, status }: { validUntil?: string; status: QuoteStatus }) {
  if (!validUntil) return <span className="text-neutral-400 text-xs">—</span>
  // Không quan trọng nữa nếu đã ACCEPTED / REJECTED
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    return <span className="text-neutral-400 text-xs">{formatDate(validUntil)}</span>
  }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(validUntil)
  exp.setHours(0, 0, 0, 0)
  const days = Math.round((exp.getTime() - now.getTime()) / 86400000)
  const cls =
    days < 0
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : days <= 3
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : days <= 7
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  const label =
    days < 0 ? `Quá hạn ${Math.abs(days)}d` : days === 0 ? 'Hết hôm nay' : `Còn ${days}d`
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
      title={`Hạn: ${formatDate(validUntil)}`}
    >
      <AlarmClock size={11} /> {label}
    </span>
  )
}

const STATUS_TONE: Record<QuoteStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', ACCEPTED: 'Được duyệt', REJECTED: 'Bị từ chối', EXPIRED: 'Hết hạn',
}

export function QuotesPage() {
  const { data: rows, isLoading } = useQuotes()
  const setStatus = useSetQuoteStatus()
  const [search, setSearch] = useState('')

  const list = (rows as any[]) ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((v: Quote) =>
      v.code.toLowerCase().includes(q) || (v.customerName || '').toLowerCase().includes(q))
  }, [list, search])

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Báo giá"
        description="Quản lý báo giá cho khách hàng — theo dõi từ khi gửi đến lúc được duyệt hoặc từ chối."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            placeholder="Tìm mã báo giá hoặc khách hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="p-3 text-left font-medium">Mã BG</th>
              <th className="p-3 text-left font-medium">Khách hàng</th>
              <th className="p-3 text-left font-medium">Ngày phát hành</th>
              <th className="p-3 text-left font-medium">Hạn</th>
              <th className="p-3 text-right font-medium">Giá trị</th>
              <th className="p-3 text-center font-medium">Trạng thái</th>
              <th className="p-3 text-right font-medium w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-neutral-500">Đang tải…</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-neutral-500">Chưa có báo giá nào</td></tr>
            )}
            {filtered.map((q: Quote) => (
              <tr key={q.id} className="hover:bg-neutral-50">
                <td className="p-3 font-mono font-semibold text-blue-700">{q.code}</td>
                <td className="p-3">{q.customerName || '—'}</td>
                <td className="p-3 text-neutral-600">{q.issuedDate ? formatDate(q.issuedDate) : '—'}</td>
                <td className="p-3">
                  <ExpiryBadge validUntil={q.validUntil} status={q.status} />
                </td>
                <td className="p-3 text-right font-mono font-semibold">{formatCurrency(q.total)}</td>
                <td className="p-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_TONE[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {q.status === 'DRAFT' && (
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 mr-1"
                      onClick={() => setStatus.mutate({ id: q.id, status: 'SENT' })}
                    ><Send size={12} /> Gửi</button>
                  )}
                  {q.status === 'SENT' && (
                    <>
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 mr-1"
                        onClick={() => setStatus.mutate({ id: q.id, status: 'ACCEPTED' })}
                      ><CheckCircle2 size={12} /> Duyệt</button>
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        onClick={() => setStatus.mutate({ id: q.id, status: 'REJECTED' })}
                      ><XCircle size={12} /> Từ chối</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
