// ============================================================
// GoodsIssueNoteDetailPage — chi tiết PXK + confirm/cancel/print
// ============================================================

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageMinus,
  Printer,
  XCircle,
  Inbox,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
} from '@frezo/ui'
import {
  useGin,
  useConfirmGin,
  useCancelGin,
  usePrintGin,
} from '../hooks/useGin'
import { usePermission } from '@/lib/hooks/usePermission'

export function GoodsIssueNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: gin, isLoading, isError, refetch, isFetching } = useGin(id)
  const confirm = useConfirmGin()
  const cancel = useCancelGin()
  const print = usePrintGin()
  const canUpdate = usePermission('WAREHOUSE.GIN.UPDATE')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!gin?.items) return
    const init: Record<string, string> = {}
    for (const ln of gin.items) {
      if (!ln.id) continue
      const qty =
        ln.qtyIssued && ln.qtyIssued > 0
          ? ln.qtyIssued
          : ln.qtyRequested ?? 0
      init[ln.id] = String(qty)
    }
    setQtyDrafts(init)
  }, [gin?.id, gin?.items])

  if (!id) {
    return (
      <EmptyState
        icon={PackageMinus}
        title="Thiếu ID"
        description="/warehouse/gin/:id"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (isError || !gin) {
    return (
      <div className="p-6">
        <ErrorState
          title="Không tải được PXK"
          message="BE /warehouse/gin/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center mt-2">
          <Button variant="outline" onClick={() => nav('/warehouse/gin')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const st = (gin.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title={gin.ginCode || gin.id}
        description={`Kho ${gin.warehouseId} · ${gin.status}${
          gin.issueType ? ` · ${gin.issueType}` : ''
        }`}
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => nav('/warehouse/gin')}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              disabled={print.isPending}
              onClick={() => print.mutate(gin.id)}
            >
              <Printer size={14} /> In
            </Button>
            <Link to="/approval/inbox">
              <Button variant="outline" className="gap-1" size="sm">
                <Inbox size={14} /> Approval
              </Button>
            </Link>
            {isDraft && canUpdate && (
              <>
                <Button
                  className="gap-1"
                  disabled={confirm.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <CheckCircle2 size={14} /> Confirm xuất
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 text-rose-700"
                  disabled={cancel.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle size={14} /> Huỷ
                </Button>
              </>
            )}
          </div>
        }
      />

      {isDraft && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          PXK DRAFT. Confirm sẽ trừ tồn. Không gắn approval engine riêng — quyền
          WAREHOUSE.GIN.UPDATE / APPROVE kiểm soát thao tác.
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
            <tr>
              <th className="p-3">SP</th>
              <th className="p-3 text-right">Yêu cầu</th>
              <th className="p-3 text-right">Xuất</th>
              <th className="p-3 text-right">Đơn giá</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(gin.items || []).map((ln, i) => (
              <tr key={ln.id || i}>
                <td className="p-3 font-mono text-xs">{ln.productId}</td>
                <td className="p-3 text-right tabular-nums">
                  {ln.qtyRequested ?? '—'}
                </td>
                <td className="p-3 text-right">
                  {isDraft && ln.id ? (
                    <input
                      type="number"
                      min={0}
                      className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right"
                      value={qtyDrafts[ln.id] ?? ''}
                      onChange={(e) =>
                        setQtyDrafts((d) => ({
                          ...d,
                          [ln.id!]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="tabular-nums">{ln.qtyIssued ?? 0}</span>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {ln.unitCost ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (!confirm.isPending) setConfirmOpen(false)
        }}
        onConfirm={() => {
          const items = (gin.items || [])
            .filter((ln) => ln.id)
            .map((ln) => ({
              itemId: ln.id!,
              qtyIssued: Number(qtyDrafts[ln.id!] ?? ln.qtyRequested ?? 0),
            }))
          confirm.mutate(
            { id: gin.id, body: { items } },
            { onSettled: () => setConfirmOpen(false) },
          )
        }}
        title="Xác nhận xuất kho?"
        message={`PXK ${gin.ginCode || gin.id} sẽ chuyển DRAFT → CONFIRMED và trừ stock.`}
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => {
          if (!cancel.isPending) setCancelOpen(false)
        }}
        onConfirm={() => {
          cancel.mutate(
            { id: gin.id },
            { onSettled: () => setCancelOpen(false) },
          )
        }}
        title="Huỷ phiếu xuất kho?"
        message="Chỉ nên huỷ khi chưa Confirm."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </div>
  )
}
