// ============================================================
// PurchaseOrderDetailPage — WarehouseDetailShell + pipeline + ConfirmDialog
// ============================================================

import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Package, PackagePlus } from 'lucide-react'
import { Button, ConfirmDialog, PageGuideButton } from '@frezo/ui'
import {
  usePurchaseOrder,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'
import { useCreateGrn } from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import { toast } from 'sonner'
import {
  StatusPipelineStepper,
  PO_PIPELINE,
  poStepIndex,
} from '../components/StatusPipelineStepper'
import { WarehouseDetailShell } from '../components/WarehouseDetailShell'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'
import { PURCHASE_ORDERS_GUIDE } from '../constants/purchase.guide'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
} from '../utils/displayUtils'
import type { PurchaseOrderLineDto } from '../services/purchaseOrderApi'

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: po, isLoading, isError, refetch, isFetching } = usePurchaseOrder(id)
  const confirm = useConfirmPurchaseOrder()
  const createGrn = useCreateGrn()
  const canCreateGrn = usePermission('WAREHOUSE.GRN.CREATE')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)

  const st = (po?.status || '').toUpperCase()
  const receivePending = st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'

  const totalOrdered = useMemo(
    () => (po?.lines || []).reduce((sum, ln) => sum + (Number(ln.qtyOrdered) || 0), 0),
    [po?.lines],
  )
  const totalReceived = useMemo(
    () => (po?.lines || []).reduce((sum, ln) => sum + (Number(ln.qtyReceived) || 0), 0),
    [po?.lines],
  )

  const receiveFromPo = () => {
    if (!po) return
    if (!po.warehouseId) {
      toast.error('Đơn mua thiếu thông tin kho — không tạo được phiếu nhập')
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
    <>
      <WarehouseDetailShell
        missingIdTitle={!id ? 'Thiếu ID đơn mua hàng' : undefined}
        missingIdDescription={!id ? '/warehouse/purchase-orders/:id' : undefined}
        missingIcon={!id ? Package : undefined}
        breadcrumb={
          po
            ? [
                { label: 'Kho', onClick: () => nav('/warehouse') },
                {
                  label: 'Đơn mua hàng',
                  onClick: () => nav('/warehouse/purchase-orders'),
                },
                { label: po.code || id! },
              ]
            : undefined
        }
        title={po?.code || id || '—'}
        subtitle={
          po
            ? `${formatWarehouseLabel(po)} · ${formatSupplierLabel(po)}`
            : undefined
        }
        statusBadge={po ? <WarehouseStatusBadge status={po.status} kind="po" /> : undefined}
        kpi={
          po
            ? [
                { label: 'Số dòng', value: po.lines?.length || 0 },
                { label: 'SL đặt', value: totalOrdered },
                { label: 'SL đã nhận', value: totalReceived },
              ]
            : undefined
        }
        actions={
          po ? (
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={PURCHASE_ORDERS_GUIDE} />
              {st === 'DRAFT' && (
                <Button
                  className="gap-1"
                  disabled={confirm.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <CheckCircle2 size={14} /> Xác nhận
                </Button>
              )}
              {receivePending && canCreateGrn && (
                <Button
                  className="gap-1"
                  disabled={createGrn.isPending}
                  onClick={() => setReceiveOpen(true)}
                >
                  <PackagePlus size={14} /> Nhận hàng
                </Button>
              )}
            </div>
          ) : undefined
        }
        pipeline={
          po ? (
            <StatusPipelineStepper
              steps={PO_PIPELINE}
              currentIndex={poStepIndex(st)}
              nextCta={
                st === 'DRAFT'
                  ? {
                      label: 'Bước kế: Xác nhận đơn mua',
                      onClick: () => setConfirmOpen(true),
                      disabled: confirm.isPending,
                      loading: confirm.isPending,
                    }
                  : receivePending && canCreateGrn
                    ? {
                        label: 'Bước kế: Nhận hàng',
                        onClick: () => setReceiveOpen(true),
                        disabled: createGrn.isPending,
                        loading: createGrn.isPending,
                      }
                    : null
              }
            />
          ) : undefined
        }
        alert={
          po && receivePending ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Đơn đã xác nhận — bấm <strong>Nhận hàng</strong> để tạo phiếu nhập kho từ các dòng
              còn lại.
            </div>
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError || (!isLoading && !po && !!id)}
        isFetching={isFetching}
        onRetry={refetch}
        errorTitle="Không tải được đơn mua hàng"
        backHref="/warehouse/purchase-orders"
      >
        {po && (
          <>
            {po.purchaseRequestId && (
              <p className="text-sm text-neutral-600">
                Từ yêu cầu mua hàng:{' '}
                <button
                  type="button"
                  className="font-mono text-xs text-primary-700 hover:underline"
                  onClick={() =>
                    nav(`/warehouse/purchase-requests/${po.purchaseRequestId}`)
                  }
                >
                  {po.purchaseRequestId}
                </button>
              </p>
            )}

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs text-neutral-500 text-left">
                  <tr>
                    <th className="p-3">Sản phẩm</th>
                    <th className="p-3 text-right">Đặt</th>
                    <th className="p-3 text-right">Đã nhận</th>
                    <th className="p-3 text-right">Đơn giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(po.lines || []).map((ln, i) => (
                    <tr key={ln.id || i}>
                      <td className="p-3">
                        <div className="font-medium">{lineProductLabel(ln)}</div>
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
                  {(po.lines || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-neutral-500 text-sm">
                        Chưa có dòng hàng
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {po.note && (
              <p className="text-sm text-neutral-600 bg-neutral-50 border rounded-lg p-3">
                {po.note}
              </p>
            )}
          </>
        )}
      </WarehouseDetailShell>

      {po && (
        <>
          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => {
              if (!confirm.isPending) setConfirmOpen(false)
            }}
            onConfirm={() => {
              confirm.mutate(po.id, { onSettled: () => setConfirmOpen(false) })
            }}
            title="Xác nhận đơn mua hàng?"
            message={`Đơn ${po.code || po.id} sẽ chuyển từ Nháp sang Đã xác nhận.`}
            confirmText="Xác nhận đơn"
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
            title="Tạo phiếu nhập kho từ đơn mua?"
            message="Tạo phiếu nhập Nháp từ các dòng còn lại — Xác nhận nhập để cập nhật tồn."
            confirmText="Tạo phiếu nhập"
            cancelText="Huỷ"
            variant="default"
            isLoading={createGrn.isPending}
          />
        </>
      )}
    </>
  )
}

function lineProductLabel(ln: PurchaseOrderLineDto) {
  if (ln.productName || ln.productCode) return formatProductLabel(ln)
  return ln.productId || '—'
}
