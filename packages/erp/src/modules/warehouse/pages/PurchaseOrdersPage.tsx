// ============================================================
// PurchaseOrdersPage — danh sách đơn mua hàng
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, CheckCircle2, PackagePlus, Eye } from 'lucide-react'
import { Button, ConfirmDialog } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { PURCHASE_ORDERS_GUIDE } from '../constants/purchase.guide'
import { PO_STATUS_FILTER_OPTIONS } from '../constants/warehouseStatus'
import {
  usePurchaseOrders,
  useConfirmPurchaseOrder,
} from '../hooks/usePurchaseOrder'
import { useCreateGrn } from '../hooks/useGrn'
import {
  applyWarehouseListFilters,
  useWarehouseFilters,
} from '../hooks/useWarehouseFilters'
import { usePermission } from '@/lib/hooks/usePermission'
import type { PurchaseOrderDto } from '../services/purchaseOrderApi'
import { toast } from 'sonner'
import { formatSupplierLabel, formatWarehouseLabel } from '../utils/displayUtils'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'

export function PurchaseOrdersPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters({ statusOptions: PO_STATUS_FILTER_OPTIONS })
  const { data: list = [], isLoading, isError, isFetching, refetch } = usePurchaseOrders()
  const confirm = useConfirmPurchaseOrder()
  const createGrn = useCreateGrn()
  const canConfirm = usePermission('WAREHOUSE.WAREHOUSE.UPDATE')
  const canCreateGrn = usePermission('WAREHOUSE.GRN.CREATE')
  const [confirmTarget, setConfirmTarget] = useState<PurchaseOrderDto | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrderDto | null>(null)

  const filteredList = useMemo(
    () => applyWarehouseListFilters(list, filters.warehouseId, filters.status),
    [list, filters.warehouseId, filters.status],
  )

  const receiveFromPo = (po: PurchaseOrderDto) => {
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
          setReceiveTarget(null)
          if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
          else nav('/warehouse/grn')
        },
      },
    )
  }

  const columns: AppTableColumn<PurchaseOrderDto>[] = [
    {
      key: 'code',
      title: 'Mã đơn',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/purchase-orders/${row.id}`)}
        >
          {row.code || row.id}
        </button>
      ),
    },
    {
      key: 'pr',
      title: 'Yêu cầu mua',
      render: (_, row) =>
        row.purchaseRequestId ? (
          <button
            type="button"
            className="font-mono text-xs text-primary-700 hover:underline"
            onClick={() => nav(`/warehouse/purchase-requests/${row.purchaseRequestId}`)}
          >
            {row.purchaseRequestId}
          </button>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, row) => formatWarehouseLabel(row),
    },
    {
      key: 'supplier',
      title: 'NCC',
      render: (_, row) => formatSupplierLabel(row),
    },
    {
      key: 'lines',
      title: 'Dòng',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums">{row.lines?.length || 0}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => <WarehouseStatusBadge status={row.status} kind="po" />,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 200,
      render: (_, po) => {
        const st = (po.status || '').toUpperCase()
        const receivePending = st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'
        return (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => nav(`/warehouse/purchase-orders/${po.id}`)}
            >
              <Eye size={12} /> Chi tiết
            </Button>
            {st === 'DRAFT' && canConfirm && (
              <Button
                size="sm"
                className="gap-1"
                disabled={confirm.isPending}
                onClick={() => setConfirmTarget(po)}
              >
                <CheckCircle2 size={12} /> Xác nhận
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
          </div>
        )
      },
    },
  ]

  return (
    <WarehouseListShell
      title="Đơn mua hàng (PO)"
      description="Đặt hàng NCC sau yêu cầu mua duyệt — nhận hàng bằng phiếu nhập kho."
      guide={PURCHASE_ORDERS_GUIDE}
      headerActions={
        <>
          <Button variant="outline" onClick={() => nav('/warehouse/grn')}>
            Phiếu nhập kho
          </Button>
          <Button variant="outline" onClick={() => nav('/warehouse/purchase-requests')}>
            Yêu cầu mua
          </Button>
        </>
      }
      filterBar={
        <WarehouseFilterBar
          selects={[
            {
              id: 'warehouse',
              label: 'Lọc theo kho',
              value: filters.warehouseId,
              onChange: filters.setWarehouseId,
              options: [
                { value: '', label: 'Tất cả kho' },
                ...filters.warehouses.map((w) => ({
                  value: w.id,
                  label: w.name || w.id,
                })),
              ],
            },
            {
              id: 'status',
              label: 'Lọc theo trạng thái',
              value: filters.status,
              onChange: filters.setStatus,
              options: PO_STATUS_FILTER_OPTIONS,
            },
          ]}
          hasActiveFilters={filters.hasActiveFilters}
          onClear={filters.clearFilters}
          countLabel={`${filteredList.length} đơn${filters.hasActiveFilters ? ' (đã lọc)' : ''}`}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={refetch}
      errorTitle="Không tải được đơn mua hàng"
      totalCount={list.length}
      filteredCount={filteredList.length}
      emptyIcon={Package}
      emptyTitle="Chưa có đơn mua hàng"
      emptyDescription="Tạo đơn mua từ yêu cầu mua đã duyệt."
      emptyAction={{
        label: 'Danh sách yêu cầu mua',
        onClick: () => nav('/warehouse/purchase-requests'),
      }}
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return
          confirm.mutate(confirmTarget.id, {
            onSuccess: () => setConfirmTarget(null),
          })
        }}
        title={`Xác nhận đơn mua ${confirmTarget?.code || confirmTarget?.id || ''}?`}
        message="Đơn sẽ chuyển sang Đã xác nhận và sẵn sàng nhận hàng."
        confirmText="Xác nhận đơn"
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
        title={`Tạo phiếu nhập từ đơn ${receiveTarget?.code || receiveTarget?.id || ''}?`}
        message="Hệ thống tạo phiếu nhập kho Nháp từ các dòng hàng còn lại của đơn mua."
        confirmText="Tạo PNK"
        cancelText="Huỷ"
        variant="default"
        isLoading={createGrn.isPending}
      />
    </WarehouseListShell>
  )
}
