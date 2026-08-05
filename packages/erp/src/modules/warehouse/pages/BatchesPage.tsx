// ============================================================
// BatchesPage — danh sách lô hàng — WarehouseListShell
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layers, PackagePlus } from 'lucide-react'
import { Button, RowActions } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { BATCH_STATUS_FILTER_OPTIONS } from '../constants/warehouseStatus'
import { useBatches } from '../hooks/useBatches'
import { useWarehouseFilters } from '../hooks/useWarehouseFilters'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { WarehouseStatusBadge } from '../components/WarehouseStatusBadge'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
  warehouseSelectLabel,
} from '../utils/displayUtils'
import type { StockBatchDto } from '../services/batchApi'

export function BatchesPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const filters = useWarehouseFilters()
  const [productId, setProductId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [expiryFrom, setExpiryFrom] = useState('')
  const [expiryTo, setExpiryTo] = useState('')

  useEffect(() => {
    const fromUrl = searchParams.get('productId')
    if (fromUrl) setProductId(fromUrl)
    const status = searchParams.get('status')
    if (status) filters.setStatus(status)
    const wh = searchParams.get('warehouseId')
    if (wh) filters.setWarehouseId(wh)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const listParams = useMemo(
    () => ({
      warehouseId: filters.warehouseId || undefined,
      productId: productId || undefined,
      status: filters.status || undefined,
      keyword: keyword.trim() || undefined,
      expiryFrom: expiryFrom || undefined,
      expiryTo: expiryTo || undefined,
    }),
    [filters.warehouseId, filters.status, productId, keyword, expiryFrom, expiryTo],
  )

  const {
    data: rows = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useBatches(listParams)

  const { data: productsRaw } = useProducts()
  const products = useMemo(() => {
    const raw = productsRaw as
      | Array<{ id: string; code?: string; name?: string }>
      | undefined
    return Array.isArray(raw) ? raw.filter((p) => Boolean(p?.id)) : []
  }, [productsRaw])

  const batchRows = Array.isArray(rows) ? rows : []
  const warehouseOptions = Array.isArray(filters.warehouses) ? filters.warehouses : []

  const productOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      map.set(p.id, formatProductLabel(p))
    }
    for (const b of batchRows) {
      if (b.productId && !map.has(b.productId)) {
        map.set(b.productId, formatProductLabel(b))
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  }, [products, batchRows])

  const stats = useMemo(() => {
    return [
      { label: 'Tổng lô', value: batchRows.length },
      {
        label: 'Còn hàng',
        value: batchRows.filter((b) => (b.status || '').toUpperCase() === 'ACTIVE').length,
      },
      {
        label: 'Cận / hết hạn',
        value: batchRows.filter(
          (b) =>
            (b.status || '').toUpperCase() === 'EXPIRED' ||
            Boolean(b.expiryWarning) ||
            (b.daysToExpiry != null && b.daysToExpiry <= 3),
        ).length,
      },
      {
        label: 'Đã hết',
        value: batchRows.filter((b) => (b.status || '').toUpperCase() === 'DEPLETED').length,
      },
    ]
  }, [batchRows])

  const hasActiveFilters = Boolean(
    filters.warehouseId ||
      filters.status ||
      productId ||
      keyword.trim() ||
      expiryFrom ||
      expiryTo,
  )

  const clearFilters = () => {
    filters.clearFilters()
    setProductId('')
    setKeyword('')
    setExpiryFrom('')
    setExpiryTo('')
  }

  const columns: AppTableColumn<StockBatchDto>[] = [
    {
      key: 'batchCode',
      title: 'Mã lô',
      render: (_, row) => (
        <span className="font-mono text-xs text-primary-700">
          {row?.batchCode || '—'}
        </span>
      ),
    },
    {
      key: 'product',
      title: 'Sản phẩm',
      render: (_, row) => (
        <div className="min-w-0">
          <div className="text-xs font-mono">{row?.productCode || '—'}</div>
          <div className="text-neutral-600 text-xs truncate">
            {row?.productName || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, row) => (
        <span className="text-sm">{formatWarehouseLabel(row ?? {})}</span>
      ),
    },
    {
      key: 'supplier',
      title: 'NCC',
      render: (_, row) => (
        <span className="text-sm">{formatSupplierLabel(row ?? {})}</span>
      ),
    },
    {
      key: 'received',
      title: 'Ngày nhập',
      render: (_, row) => (
        <span className="tabular-nums text-sm">{row?.receivedDate || '—'}</span>
      ),
    },
    {
      key: 'expiry',
      title: 'HSD',
      render: (_, row) => (
        <div className="text-xs">
          <div className="tabular-nums">{row?.expiryDate || '—'}</div>
          {row?.expiryWarning && (
            <div className="text-rose-600 font-medium">{row.expiryWarning}</div>
          )}
          {!row?.expiryWarning && row?.daysToExpiry != null && row.daysToExpiry > 3 && (
            <div className="text-neutral-500">còn {row.daysToExpiry} ngày</div>
          )}
        </div>
      ),
    },
    {
      key: 'qty',
      title: 'Tồn lô',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums font-medium">{row?.qtyOnHand ?? 0}</span>
      ),
    },
    {
      key: 'location',
      title: 'Vị trí',
      render: (_, row) => (
        <span className="font-mono text-xs">{row?.locationLabel || '—'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => (
        <WarehouseStatusBadge status={row?.status} kind="batch" />
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 56,
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'view',
              tooltip: 'Phiếu nhập kho',
              hidden: !row?.grnId,
              onClick: () => nav(`/warehouse/grn/${row?.grnId}`),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <WarehouseListShell
      title="Quản lý lô hàng"
      description="Lô theo kho + HSD — FEFO khi xuất. Lô tạo khi xác nhận nhập kho (GRN Confirm)."
      headerActions={
        <Button variant="outline" className="gap-2" onClick={() => nav('/warehouse/grn')}>
          <PackagePlus size={16} />
          Phiếu nhập kho
        </Button>
      }
      stats={stats}
      filterBar={
        <WarehouseFilterBar
          selects={[
            {
              id: 'warehouse',
              label: 'Lọc kho',
              value: filters.warehouseId,
              onChange: filters.setWarehouseId,
              options: [
                { value: '', label: 'Tất cả kho' },
                ...warehouseOptions.map((w) => ({
                  value: w.id,
                  label: warehouseSelectLabel(w),
                })),
              ],
            },
            {
              id: 'product',
              label: 'Sản phẩm',
              value: productId,
              onChange: setProductId,
              minWidth: '200px',
              options: [
                { value: '', label: 'Tất cả sản phẩm' },
                ...productOptions.map((p) => ({ value: p.id, label: p.label })),
              ],
            },
            {
              id: 'status',
              label: 'Trạng thái',
              value: filters.status,
              onChange: filters.setStatus,
              options: BATCH_STATUS_FILTER_OPTIONS,
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          countLabel={`${batchRows.length} lô${hasActiveFilters ? ' (đã lọc)' : ''}`}
          extra={
            <>
              <input
                type="date"
                className="h-9 border rounded-md px-3 text-sm bg-white"
                value={expiryFrom}
                onChange={(e) => setExpiryFrom(e.target.value)}
                aria-label="HSD từ ngày"
              />
              <input
                type="date"
                className="h-9 border rounded-md px-3 text-sm bg-white"
                value={expiryTo}
                onChange={(e) => setExpiryTo(e.target.value)}
                aria-label="HSD đến ngày"
              />
              <input
                className="h-9 border rounded-md px-3 text-sm bg-white min-w-[180px]"
                placeholder="Tìm mã lô / SP / NCC…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Tìm kiếm lô"
              />
            </>
          }
        />
      }
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={() => void refetch()}
      errorTitle="Không tải được danh sách lô"
      totalCount={hasActiveFilters && batchRows.length === 0 ? 1 : batchRows.length}
      filteredCount={batchRows.length}
      emptyIcon={Layers}
      emptyTitle="Chưa có lô"
      emptyDescription="Lô được tạo khi xác nhận nhập kho (GRN Confirm)."
      emptyAction={{
        label: 'Xem phiếu nhập kho',
        onClick: () => nav('/warehouse/grn'),
      }}
      filteredEmptyTitle="Không có lô phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho, sản phẩm, trạng thái hoặc khoảng HSD."
      columns={columns}
      data={batchRows}
      onRefresh={() => void refetch()}
    />
  )
}
