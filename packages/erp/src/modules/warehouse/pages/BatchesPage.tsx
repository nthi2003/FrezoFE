// ============================================================
// BatchesPage — danh sách lô hàng
// ============================================================

import { useState } from 'react'
import { Layers } from 'lucide-react'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseSelect } from '../components/WarehouseSelect'
import { useBatches } from '../hooks/useBatches'
import { useWarehouses } from '../hooks/useReorderRules'
import type { StockBatchDto } from '../services/batchApi'
import type { AppTableColumn } from '@/components/ui/AppTable'

export function BatchesPage() {
  const [warehouseId, setWarehouseId] = useState('')
  const { data: warehouses = [] } = useWarehouses()
  const { data: rows = [], isLoading, isError, refetch, isFetching } =
    useBatches(warehouseId ? { warehouseId } : undefined)

  const columns: AppTableColumn<StockBatchDto>[] = [
    {
      key: 'batchCode',
      header: 'Mã lô',
      render: (r) => (
        <span className="font-mono text-xs text-primary-700">{r.batchCode}</span>
      ),
    },
    {
      key: 'product',
      header: 'Sản phẩm',
      render: (r) => (
        <div>
          <div className="text-xs font-mono">{r.productCode}</div>
          <div className="text-neutral-600 text-xs">{r.productName}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'Kho',
      render: (r) => r.warehouseName || r.warehouseId,
    },
    {
      key: 'expiry',
      header: 'HSD',
      render: (r) => (
        <div className="text-xs">
          <div>{r.expiryDate || '—'}</div>
          {r.expiryWarning && (
            <div className="text-rose-600 font-medium">{r.expiryWarning}</div>
          )}
        </div>
      ),
    },
    {
      key: 'qty',
      header: 'Tồn lô',
      render: (r) => (
        <span className="tabular-nums font-medium">{r.qtyOnHand ?? 0}</span>
      ),
    },
    {
      key: 'location',
      header: 'Vị trí',
      render: (r) => r.locationLabel || '—',
    },
    {
      key: 'status',
      header: 'TT',
      render: (r) => (
        <span className="text-xs text-neutral-600">{r.status || '—'}</span>
      ),
    },
  ]

  return (
    <WarehouseListShell
      title="Quản lý lô hàng"
      description="Lô theo kho + HSD — FEFO khi xuất."
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      totalCount={rows.length}
      emptyIcon={Layers}
      emptyTitle="Chưa có lô"
      emptyDescription="Lô được tạo khi xác nhận nhập kho (GRN Confirm)."
      filterBar={
        <div className="min-w-[180px]">
          <WarehouseSelect
            warehouses={warehouses}
            value={warehouseId}
            onChange={setWarehouseId}
            emptyOption={{ label: 'Tất cả kho' }}
            placeholder="Tất cả kho"
            showSearch={warehouses.length > 8}
            aria-label="Lọc theo kho"
          />
        </div>
      }
      columns={columns}
      data={rows}
      onRefresh={() => void refetch()}
    />
  )
}
