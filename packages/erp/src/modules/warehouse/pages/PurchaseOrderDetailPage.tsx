// ============================================================
// PurchaseOrderDetailPage
// Receive CTA ẩn — Chưa sẵn sàng (QA-FE-015)
// ============================================================

import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Package } from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import {
  usePurchaseOrder,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: po, isLoading, isError } = usePurchaseOrder(id)
  const confirm = useConfirmPurchaseOrder()

  if (!id) {
    return (
      <EmptyState
        icon={Package}
        title="Thiếu ID"
        description="/warehouse/purchase-orders/:id"
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

  if (isError || !po) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Package}
          title="Không tải được PO"
          description="BE có thể chưa sẵn /warehouse/purchase-orders/:id"
          action={{
            label: 'Quay lại',
            onClick: () => nav('/warehouse/purchase-orders'),
          }}
        />
      </div>
    )
  }

  const st = (po.status || '').toUpperCase()
  const receivePending = st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'

  return (
    <div className="p-6 space-y-4 animate-fade-in max-w-3xl">
      <PageHeader
        title={po.code || po.id}
        description={`PR ${po.purchaseRequestId || '—'} · ${po.supplierName || po.supplierId || '—'} · ${po.status}`}
        actions={
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => nav('/warehouse/purchase-orders')}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            {st === 'DRAFT' && (
              <Button
                className="gap-1"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate(po.id)}
              >
                <CheckCircle2 size={14} /> Confirm
              </Button>
            )}
            {receivePending && (
              <span className="text-xs text-neutral-500 border border-neutral-200 rounded-md px-2 py-1.5 bg-neutral-50">
                Nhận hàng — Chưa sẵn sàng
              </span>
            )}
          </div>
        }
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
            <tr>
              <th className="p-3">SP</th>
              <th className="p-3 text-right">Đặt</th>
              <th className="p-3 text-right">Đã nhận</th>
              <th className="p-3 text-right">Đơn giá</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(po.lines || []).map((ln, i) => (
              <tr key={ln.id || i}>
                <td className="p-3">
                  <div className="font-medium">
                    {ln.productName || ln.productId}
                  </div>
                  {ln.productCode && (
                    <div className="text-[11px] font-mono text-neutral-400">
                      {ln.productCode}
                    </div>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">{ln.qtyOrdered}</td>
                <td className="p-3 text-right tabular-nums">
                  {ln.qtyReceived ?? 0}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {ln.unitPrice ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
