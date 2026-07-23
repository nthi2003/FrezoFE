// ============================================================
// PurchaseOrderDetailPage
// Receive → tạo GRN (Epic A)
// ============================================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Loader2, Package, PackagePlus } from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, ConfirmDialog } from '@frezo/ui'
import {
  usePurchaseOrder,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'
import { useCreateGrn } from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import { toast } from 'sonner'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: po, isLoading, isError, refetch, isFetching } = usePurchaseOrder(id)
  const confirm = useConfirmPurchaseOrder()
  const createGrn = useCreateGrn()
  const canCreateGrn = usePermission('WAREHOUSE.GRN.CREATE')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)

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
        <ErrorState
          title="Không tải được PO"
          message="BE có thể chưa sẵn /warehouse/purchase-orders/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center mt-2">
          <Button variant="outline" onClick={() => nav('/warehouse/purchase-orders')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const st = (po.status || '').toUpperCase()
  const receivePending = st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'

  const receiveFromPo = () => {
    if (!po.warehouseId) {
      toast.error('PO thiếu warehouseId — không tạo được PNK')
      return
    }
    const items = (po.lines || [])
      .map((ln) => {
        const remaining = Number(ln.qtyOrdered || 0) - Number(ln.qtyReceived || 0)
        return {
          productId: ln.productId,
          qtyExpected: remaining > 0 ? remaining : 0,
          unitCost: ln.unitPrice,
        }
      })
      .filter((x) => x.productId && x.qtyExpected > 0)

    if (items.length === 0) {
      toast.error('Không còn dòng hàng cần nhận')
      return
    }

    createGrn.mutate(
      {
        purchaseOrderId: po.id,
        warehouseId: po.warehouseId,
        supplierId: po.supplierId,
        items,
      },
      {
        onSuccess: (grn) => {
          setReceiveOpen(false)
          if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
          else nav('/warehouse/grn')
        },
        onSettled: () => setReceiveOpen(false),
      },
    )
  }

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
                onClick={() => setConfirmOpen(true)}
              >
                <CheckCircle2 size={14} /> Confirm
              </Button>
            )}
            {receivePending && canCreateGrn && (
              <Button
                className="gap-1"
                disabled={createGrn.isPending}
                onClick={() => setReceiveOpen(true)}
              >
                <PackagePlus size={14} /> Nhận hàng (PNK)
              </Button>
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

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (!confirm.isPending) setConfirmOpen(false)
        }}
        onConfirm={() => {
          confirm.mutate(po.id, { onSettled: () => setConfirmOpen(false) })
        }}
        title="Xác nhận đơn mua hàng?"
        message={`PO ${po.code || po.id} sẽ chuyển từ DRAFT sang CONFIRMED.`}
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={receiveOpen}
        onClose={() => {
          if (!createGrn.isPending) setReceiveOpen(false)
        }}
        onConfirm={receiveFromPo}
        title="Tạo phiếu nhập kho từ PO?"
        message="Tạo PNK DRAFT từ các dòng còn lại — Confirm PNK để cập nhật tồn."
        confirmText="Tạo PNK"
        cancelText="Huỷ"
        variant="default"
        isLoading={createGrn.isPending}
      />
    </div>
  )
}
