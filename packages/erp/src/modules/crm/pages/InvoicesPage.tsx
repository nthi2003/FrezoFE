import { useMemo, useState } from 'react'
import { Search, Send, Landmark, DollarSign, MessageSquare } from 'lucide-react'
import { Button, PageHeader, AppModal, ConfirmDialog } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import {
  useInvoices, useIssueInvoice, usePostInvoiceToGL, useRecordPayment,
} from '../hooks/useCrm'
import type { Invoice, InvoiceStatus } from '../services/crmApi'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'
import { toast } from 'sonner'

const STATUS_TONE: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  ISSUED: 'bg-blue-50 text-blue-700 border-blue-200',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VOID: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Nháp', ISSUED: 'Đã phát hành', PARTIALLY_PAID: 'Trả một phần',
  PAID: 'Đã thanh toán', VOID: 'Đã huỷ',
}

export function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL')
  const { data: rows, isLoading } = useInvoices(
    statusFilter === 'ALL' ? undefined : statusFilter,
  )
  const issue = useIssueInvoice()
  const post = usePostInvoiceToGL()
  const pay = useRecordPayment()
  const [search, setSearch] = useState('')
  const [commentInv, setCommentInv] = useState<Invoice | null>(null)
  const [payTarget, setPayTarget] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [postTarget, setPostTarget] = useState<Invoice | null>(null)

  const list = (rows as any[]) ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((v: Invoice) =>
      v.code.toLowerCase().includes(q) || (v.customerName || '').toLowerCase().includes(q))
  }, [list, search])

  const totalReceivable = useMemo(
    () => list.filter((i: Invoice) => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID')
      .reduce((s, i: Invoice) => s + (i.total - i.paidAmount), 0),
    [list],
  )

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Hoá đơn"
        description={`Quản lý hoá đơn bán hàng, thanh toán và hạch toán vào sổ cái. Tổng phải thu: ${formatCurrency(totalReceivable)}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            placeholder="Tìm mã HĐ hoặc khách hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white">
          {(['ALL','DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap ${
                statusFilter === s ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_LABEL[s as InvoiceStatus]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="p-3 text-left font-medium">Mã HĐ</th>
              <th className="p-3 text-left font-medium">Khách hàng</th>
              <th className="p-3 text-left font-medium">Phát hành</th>
              <th className="p-3 text-left font-medium">Hạn</th>
              <th className="p-3 text-right font-medium">Tổng</th>
              <th className="p-3 text-right font-medium">Đã trả</th>
              <th className="p-3 text-right font-medium">Còn</th>
              <th className="p-3 text-center font-medium">Trạng thái</th>
              <th className="p-3 text-right font-medium w-56">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading && <tr><td colSpan={9} className="p-6 text-center text-neutral-500">Đang tải…</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-neutral-500">Chưa có hoá đơn nào</td></tr>
            )}
            {filtered.map((inv: Invoice) => {
              const remain = inv.total - (inv.paidAmount || 0)
              const paidPct = inv.total > 0
                ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.total) * 100))
                : 0
              const canIssue = inv.status === 'DRAFT'
              const canPost = (inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'PAID')
                && !inv.glJournalEntryId
              const canPay = inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID'
              return (
                <tr key={inv.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono font-semibold text-blue-700">{inv.code}</td>
                  <td className="p-3">{inv.customerName || '—'}</td>
                  <td className="p-3 text-neutral-600">{inv.issuedDate ? formatDate(inv.issuedDate) : '—'}</td>
                  <td className="p-3 text-neutral-600">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(inv.total)}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">{formatCurrency(inv.paidAmount)}</td>
                  <td className="p-3 text-right font-mono font-semibold text-orange-700">
                    {formatCurrency(remain)}
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            paidPct === 100
                              ? 'bg-emerald-500'
                              : paidPct > 0
                                ? 'bg-amber-500'
                                : 'bg-neutral-300'
                          }`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-neutral-500 shrink-0">
                        {paidPct}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_TONE[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                    {inv.glJournalEntryId && (
                      <div className="text-[10px] text-neutral-500 mt-1">Đã hạch toán</div>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200"
                      onClick={() => setCommentInv(inv)}
                      title="Bình luận"
                    ><MessageSquare size={12} /></button>
                    {canIssue && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        onClick={() => issue.mutate(inv.id)}
                      ><Send size={12} /> Phát hành</button>
                    )}
                    {canPay && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        onClick={() => {
                          setPayTarget(inv)
                          setPayAmount(String(remain))
                        }}
                      ><DollarSign size={12} /> Thu tiền</button>
                    )}
                    {canPost && (
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                        onClick={() => setPostTarget(inv)}
                      ><Landmark size={12} /> Hạch toán</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AppModal
        isOpen={!!payTarget}
        onClose={() => { setPayTarget(null); setPayAmount('') }}
        title="Thu tiền hoá đơn"
        description={
          payTarget
            ? `${payTarget.code} — còn ${formatCurrency((payTarget.total || 0) - (payTarget.paidAmount || 0))}`
            : undefined
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Số tiền thanh toán *</label>
            <input
              type="number"
              min={1}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setPayTarget(null); setPayAmount('') }}>Huỷ</Button>
            <Button
              disabled={pay.isPending}
              onClick={() => {
                if (!payTarget) return
                const remain = (payTarget.total || 0) - (payTarget.paidAmount || 0)
                const amt = Number(payAmount)
                if (!amt || Number.isNaN(amt) || amt <= 0) {
                  toast.error('Nhập số tiền hợp lệ')
                  return
                }
                if (amt > remain) {
                  toast.error(`Số tiền không được vượt quá còn lại (${formatCurrency(remain)})`)
                  return
                }
                pay.mutate(
                  { id: payTarget.id, amount: amt },
                  { onSuccess: () => { setPayTarget(null); setPayAmount('') } },
                )
              }}
            >
              Xác nhận thu tiền
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!postTarget}
        onClose={() => setPostTarget(null)}
        onConfirm={() => {
          if (!postTarget) return
          post.mutate(postTarget.id, { onSuccess: () => setPostTarget(null) })
        }}
        title="Hạch toán vào sổ cái?"
        message={`Hoá đơn ${postTarget?.code || ''} sẽ được post GL. Thao tác idempotent theo BE.`}
        confirmText="Hạch toán"
        variant="warning"
        isLoading={post.isPending}
      />

      <CommentDrawer
        open={!!commentInv}
        onClose={() => setCommentInv(null)}
        subjectType={SubjectType.INVOICE}
        subjectId={commentInv?.id || ''}
        title={commentInv?.code || 'Hoá đơn'}
        subtitle={commentInv?.customerName}
      />
    </div>
  )
}
