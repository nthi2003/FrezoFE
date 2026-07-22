// ============================================================
// PurchaseOrdersPage — danh sách PO
// Receive CTA ẩn — Chưa sẵn sàng (QA-FE-015)
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Loader2, CheckCircle2 } from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, ConfirmDialog } from '@frezo/ui'
import {
  usePurchaseOrders,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'
import { usePermission } from '@/lib/hooks/usePermission'
import type { PurchaseOrderDto } from '../services/purchaseOrderApi'

export function PurchaseOrdersPage() {
  const nav = useNavigate()
  const { data: list = [], isLoading, isError, isFetching, refetch } = usePurchaseOrders()
  const confirm = useConfirmPurchaseOrder()
  const canConfirm = usePermission('WAREHOUSE.WAREHOUSE.UPDATE')
  const [confirmTarget, setConfirmTarget] = useState<PurchaseOrderDto | null>(null)

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Purchase Orders"
        description="PO tạo từ PR đã APPROVED — confirm / nhận hàng."
        actions={
          <Button
            variant="outline"
            onClick={() => nav('/warehouse/purchase-requests')}
          >
            Từ Purchase Requests
          </Button>
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
                      {receivePending && (
                        <span className="inline-block text-[11px] text-neutral-500 px-2 py-1">
                          Chưa sẵn sàng
                        </span>
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
    </div>
  )
}
