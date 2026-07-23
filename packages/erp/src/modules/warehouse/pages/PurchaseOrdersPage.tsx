// ============================================================
// PurchaseOrdersPage — danh sách PO
// Receive → tạo GRN (Epic A / đóng vòng PXK-PNK)
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Loader2, CheckCircle2, PackagePlus } from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, ConfirmDialog } from '@frezo/ui'
import {
  usePurchaseOrders,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'
import { useCreateGrn } from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import type { PurchaseOrderDto } from '../services/purchaseOrderApi'
import { toast } from 'sonner'

export function PurchaseOrdersPage() {
  const nav = useNavigate()
  const { data: list = [], isLoading, isError, isFetching, refetch } = usePurchaseOrders()
  const confirm = useConfirmPurchaseOrder()
  const createGrn = useCreateGrn()
  const canConfirm = usePermission('WAREHOUSE.WAREHOUSE.UPDATE')
  const canCreateGrn = usePermission('WAREHOUSE.GRN.CREATE')
  const [confirmTarget, setConfirmTarget] = useState<PurchaseOrderDto | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrderDto | null>(null)

  const receiveFromPo = (po: PurchaseOrderDto) => {
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
          setReceiveTarget(null)
          if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
          else nav('/warehouse/grn')
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Purchase Orders"
        description="PO tạo từ PR đã APPROVED — confirm / nhận hàng (PNK)."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => nav('/warehouse/grn')}
            >
              Phiếu nhập kho
            </Button>
            <Button
              variant="outline"
              onClick={() => nav('/warehouse/purchase-requests')}
            >
              Từ Purchase Requests
            </Button>
          </div>
        }
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được Purchase Orders"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Package}
            title="Chưa có PO"
            description="Mở PR APPROVED và bấm Tạo PO."
            action={{
              label: 'Danh sách PR',
              onClick: () => nav('/warehouse/purchase-requests'),
            }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-left">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">PR</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((po) => {
                const st = (po.status || '').toUpperCase()
                const receivePending =
                  st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'
                return (
                  <tr key={po.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono text-xs">
                      <button
                        type="button"
                        className="text-primary-700 hover:underline"
                        onClick={() =>
                          nav(`/warehouse/purchase-orders/${po.id}`)
                        }
                      >
                        {po.code || po.id}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {po.purchaseRequestId || '—'}
                    </td>
                    <td className="p-3">
                      {po.supplierName || po.supplierId || '—'}
                    </td>
                    <td className="p-3 tabular-nums">{po.lines?.length || 0}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          nav(`/warehouse/purchase-orders/${po.id}`)
                        }
                      >
                        Chi tiết
                      </Button>
                      {st === 'DRAFT' && canConfirm && (
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={confirm.isPending}
                          onClick={() => setConfirmTarget(po)}
                        >
                          <CheckCircle2 size={12} /> Confirm
                        </Button>
                      )}
                      {receivePending && canCreateGrn && (
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={createGrn.isPending}
                          onClick={() => setReceiveTarget(po)}
                        >
                          <PackagePlus size={12} /> Nhận hàng
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return
          confirm.mutate(confirmTarget.id, {
            onSuccess: () => setConfirmTarget(null),
          })
        }}
        title={`Confirm PO ${confirmTarget?.code || confirmTarget?.id || ''}?`}
        message="PO sẽ chuyển sang CONFIRMED và sẵn sàng nhận hàng."
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="default"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={!!receiveTarget}
        onClose={() => setReceiveTarget(null)}
        onConfirm={() => {
          if (!receiveTarget) return
          receiveFromPo(receiveTarget)
        }}
        title={`Tạo PNK từ PO ${receiveTarget?.code || receiveTarget?.id || ''}?`}
        message="Sẽ tạo phiếu nhập kho DRAFT từ các dòng còn lại của PO."
        confirmText="Tạo PNK"
        cancelText="Huỷ"
        variant="default"
        isLoading={createGrn.isPending}
      />
    </div>
  )
}
