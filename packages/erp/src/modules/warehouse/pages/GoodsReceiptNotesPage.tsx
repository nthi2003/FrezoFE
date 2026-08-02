// ============================================================
// GoodsReceiptNotesPage — danh sách phiếu nhập kho — WarehouseListShell
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PackagePlus, Plus, Eye } from 'lucide-react'
import { Button } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { GRN_GUIDE } from '../constants/grn-gin.guide'
import { DOC_STATUS_FILTER_OPTIONS } from '../constants/warehouseStatus'
import { useGrns, useCreateGrn } from '../hooks/useGrn'
import { usePurchaseOrders } from '../hooks/usePurchaseOrder'
import { useWarehouseFilters } from '../hooks/useWarehouseFilters'
import { usePermission } from '@/lib/hooks/usePermission'
import { GrnGinStatusBadge } from '../components/GrnGinStatusBadge'
import { GrnCreateModal } from '../components/GrnCreateModal'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { formatGrnDate } from '../utils/grnGinUtils'
import {
  formatSupplierLabel,
  formatWarehouseLabel,
  warehouseSelectLabel,
} from '../utils/displayUtils'
import type { GrnDto } from '../services/grnApi'
import type { PurchaseOrderDto } from '../services/purchaseOrderApi'

export function GoodsReceiptNotesPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const filters = useWarehouseFilters()
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) filters.setStatus(status)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const listParams = useMemo(
    () => ({
      status: filters.status || undefined,
      keyword: keyword.trim() || undefined,
    }),
    [filters.status, keyword],
  )

  const {
    data: list = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGrns(listParams)
  const { data: purchaseOrders = [] } = usePurchaseOrders()
  const { data: productsRaw, isError: productsError, isLoading: productsLoading } = useProducts()
  const create = useCreateGrn()
  const canCreate = usePermission('WAREHOUSE.GRN.CREATE')

  const [open, setOpen] = useState(false)

  const products = useMemo(() => {
    const raw = productsRaw as
      | Array<{ id: string; code?: string; name?: string; price?: number | null }>
      | undefined
    return Array.isArray(raw)
      ? raw.filter((p) => Boolean(p?.id)).map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          price: p.price,
        }))
      : []
  }, [productsRaw])

  const warehouseOptions = filters.warehouses

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const grn of list) {
      if (grn.supplierId) {
        map.set(grn.supplierId, grn.supplierName || grn.supplierId)
      }
    }
    for (const po of purchaseOrders) {
      if (po.supplierId) {
        map.set(po.supplierId, po.supplierName || po.supplierId)
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [list, purchaseOrders])

  const receivablePos = useMemo(
    () =>
      (purchaseOrders as PurchaseOrderDto[]).filter((po) => {
        const st = (po.status || '').toUpperCase()
        return st === 'CONFIRMED' || st === 'PARTIAL_RECEIVED'
      }),
    [purchaseOrders],
  )

  const filteredList = useMemo(() => {
    return list.filter((grn) => {
      if (filters.warehouseId && grn.warehouseId !== filters.warehouseId) return false
      if (supplierFilter && grn.supplierId !== supplierFilter) return false
      const docDate = formatGrnDate(grn)
      if (dateFrom && docDate !== '—' && docDate < dateFrom) return false
      if (dateTo && docDate !== '—' && docDate > dateTo) return false
      return true
    })
  }, [list, filters.warehouseId, supplierFilter, dateFrom, dateTo])

  const stats = useMemo(() => {
    const base = filters.warehouseId
      ? list.filter((g) => g.warehouseId === filters.warehouseId)
      : list
    return [
      { label: 'Tổng phiếu', value: base.length },
      { label: 'Nháp', value: base.filter((g) => (g.status || '').toUpperCase() === 'DRAFT').length },
      {
        label: 'Chờ duyệt',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'PENDING_APPROVAL').length,
      },
      {
        label: 'Đã nhập',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'CONFIRMED').length,
      },
      {
        label: 'Huỷ',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'CANCELLED').length,
      },
    ]
  }, [list, filters.warehouseId])

  const columns: AppTableColumn<GrnDto>[] = [
    {
      key: 'code',
      title: 'Mã phiếu nhập',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/grn/${row.id}`)}
        >
          {row.grnCode || '—'}
        </button>
      ),
    },
    {
      key: 'date',
      title: 'Ngày',
      render: (_, row) => (
        <span className="tabular-nums text-sm">{formatGrnDate(row)}</span>
      ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, row) => (
        <span className="text-sm">{formatWarehouseLabel(row)}</span>
      ),
    },
    {
      key: 'supplier',
      title: 'NCC',
      render: (_, row) => (
        <span className="text-sm">{formatSupplierLabel(row)}</span>
      ),
    },
    {
      key: 'po',
      title: 'Mã đơn mua',
      render: (_, row) => (
        <span className="font-mono text-xs">
          {row.purchaseOrderCode || '—'}
        </span>
      ),
    },
    {
      key: 'invoice',
      title: 'Số HĐ NCC',
      render: (_, row) => (
        <span className="font-mono text-xs">{row.invoiceNo || '—'}</span>
      ),
    },
    {
      key: 'lines',
      title: 'SL dòng',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums">{row.items?.length ?? 0}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => <GrnGinStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 100,
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => nav(`/warehouse/grn/${row.id}`)}
        >
          <Eye size={12} /> Chi tiết
        </Button>
      ),
    },
  ]

  const openCreateModal = () => setOpen(true)

  const hasActiveFilters = Boolean(
    filters.warehouseId || filters.status || supplierFilter || dateFrom || dateTo || keyword,
  )

  const clearFilters = () => {
    filters.clearFilters()
    setSupplierFilter('')
    setDateFrom('')
    setDateTo('')
    setKeyword('')
  }

  return (
    <WarehouseListShell
      title="Phiếu nhập kho"
      description="Nháp → Gửi duyệt → Duyệt → Xác nhận nhập kho (+ HĐ NCC khi gắn đơn mua/NCC)."
      guide={GRN_GUIDE}
      headerActions={
        <>
          <Button variant="outline" onClick={() => nav('/warehouse/purchase-orders')}>
            Từ đơn mua hàng
          </Button>
          {canCreate && (
            <Button
              className="gap-2 shadow-sm"
              onClick={openCreateModal}
            >
              <Plus size={16} strokeWidth={2.5} />
              Tạo phiếu nhập kho
            </Button>
          )}
        </>
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
              id: 'supplier',
              label: 'NCC',
              value: supplierFilter,
              onChange: setSupplierFilter,
              options: [
                { value: '', label: 'Tất cả NCC' },
                ...supplierOptions.map((s) => ({ value: s.id, label: s.label })),
              ],
            },
            {
              id: 'status',
              label: 'Trạng thái',
              value: filters.status,
              onChange: filters.setStatus,
              options: DOC_STATUS_FILTER_OPTIONS,
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          countLabel={`${filteredList.length} phiếu${hasActiveFilters ? ' (đã lọc)' : ''}`}
          extra={
            <>
              <input
                type="date"
                className="h-9 border rounded-md px-3 text-sm bg-white"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Từ ngày"
              />
              <input
                type="date"
                className="h-9 border rounded-md px-3 text-sm bg-white"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Đến ngày"
              />
              <input
                className="h-9 border rounded-md px-3 text-sm bg-white min-w-[160px]"
                placeholder="Tìm mã phiếu / đơn mua / HĐ…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Tìm kiếm"
              />
            </>
          }
        />
      }
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={refetch}
      errorTitle="Không tải được phiếu nhập kho"
      totalCount={list.length}
      filteredCount={filteredList.length}
      emptyIcon={PackagePlus}
      emptyTitle="Chưa có phiếu nhập kho"
      emptyDescription="Tạo phiếu mới hoặc nhận hàng từ đơn mua hàng."
      emptyAction={
        canCreate
          ? {
              label: 'Tạo phiếu nhập kho',
              onClick: openCreateModal,
            }
          : undefined
      }
      filteredEmptyTitle="Không có phiếu phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho, NCC, trạng thái hoặc khoảng ngày."
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
      <GrnCreateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        warehouseOptions={warehouseOptions}
        supplierOptions={supplierOptions}
        receivablePos={receivablePos}
        products={products}
        productsError={productsError}
        productsLoading={productsLoading}
        defaultWarehouseId={filters.warehouseId}
        defaultSupplierId={supplierOptions[0]?.id}
        isPending={create.isPending}
        onSubmit={(body) =>
          create.mutate(body, {
            onSuccess: (grn) => {
              setOpen(false)
              if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
            },
          })
        }
      />
    </WarehouseListShell>
  )
}
