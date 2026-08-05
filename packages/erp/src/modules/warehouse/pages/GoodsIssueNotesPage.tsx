// ============================================================
// GoodsIssueNotesPage — danh sách phiếu xuất kho — WarehouseListShell
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PackageMinus, Plus, Eye } from 'lucide-react'
import { Button } from '@frezo/ui'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { GIN_GUIDE } from '../constants/grn-gin.guide'
import {
  DOC_STATUS_FILTER_OPTIONS,
  GIN_ISSUE_TYPE_FILTER_OPTIONS,
} from '../constants/warehouseStatus'
import { useGins, useCreateGin } from '../hooks/useGin'
import { useWarehouseFilters } from '../hooks/useWarehouseFilters'
import { usePermission } from '@/lib/hooks/usePermission'
import { GrnGinStatusBadge } from '../components/GrnGinStatusBadge'
import { GinCreateModal } from '../components/GinCreateModal'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { formatGinDate, formatVnd, issueTypeLabel } from '../utils/grnGinUtils'
import {
  formatWarehouseLabel,
  warehouseSelectLabel,
} from '../utils/displayUtils'
import type { GinDto } from '../services/ginApi'

export function GoodsIssueNotesPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const filters = useWarehouseFilters()
  const [issueTypeFilter, setIssueTypeFilter] = useState('')
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
  } = useGins(listParams)
  const { data: productsRaw, isError: productsError, isLoading: productsLoading } = useProducts()
  const create = useCreateGin()
  const canCreate = usePermission('WAREHOUSE.GIN.CREATE')

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

  const warehouseOptions = Array.isArray(filters.warehouses) ? filters.warehouses : []

  const filteredList = useMemo(() => {
    const source = Array.isArray(list) ? list : []
    return source.filter((gin) => {
      if (filters.warehouseId && gin.warehouseId !== filters.warehouseId) return false
      if (issueTypeFilter && (gin.issueType || '').toUpperCase() !== issueTypeFilter)
        return false
      const docDate = formatGinDate(gin)
      if (dateFrom && docDate !== '—' && docDate < dateFrom) return false
      if (dateTo && docDate !== '—' && docDate > dateTo) return false
      return true
    })
  }, [list, filters.warehouseId, issueTypeFilter, dateFrom, dateTo])

  const stats = useMemo(() => {
    const source = Array.isArray(list) ? list : []
    const base = filters.warehouseId
      ? source.filter((g) => g.warehouseId === filters.warehouseId)
      : source
    return [
      { label: 'Tổng phiếu', value: base.length },
      { label: 'Nháp', value: base.filter((g) => (g.status || '').toUpperCase() === 'DRAFT').length },
      {
        label: 'Chờ duyệt',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'PENDING_APPROVAL').length,
      },
      {
        label: 'Đã xuất',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'CONFIRMED').length,
      },
      {
        label: 'Huỷ',
        value: base.filter((g) => (g.status || '').toUpperCase() === 'CANCELLED').length,
      },
    ]
  }, [list, filters.warehouseId])

  const columns: AppTableColumn<GinDto>[] = [
    {
      key: 'code',
      title: 'Mã phiếu xuất',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/gin/${row.id}`)}
        >
          {row.ginCode || '—'}
        </button>
      ),
    },
    {
      key: 'date',
      title: 'Ngày',
      render: (_, row) => (
        <span className="tabular-nums text-sm">{formatGinDate(row)}</span>
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
      key: 'issueType',
      title: 'Loại xuất',
      render: (_, row) => (
        <span className="text-sm">{issueTypeLabel(row.issueType)}</span>
      ),
    },
    {
      key: 'customer',
      title: 'Khách / đích',
      render: (_, row) => (
        <span className="text-sm truncate max-w-[140px] inline-block">
          {row.customerName ||
            row.transferWarehouseName ||
            row.customerId ||
            '—'}
        </span>
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
      key: 'value',
      title: 'Giá trị',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums text-sm">{formatVnd(row.totalValue)}</span>
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
          onClick={() => nav(`/warehouse/gin/${row.id}`)}
        >
          <Eye size={12} /> Chi tiết
        </Button>
      ),
    },
  ]

  const openCreateModal = () => setOpen(true)

  const hasActiveFilters = Boolean(
    filters.warehouseId ||
      filters.status ||
      issueTypeFilter ||
      dateFrom ||
      dateTo ||
      keyword,
  )

  const clearFilters = () => {
    filters.clearFilters()
    setIssueTypeFilter('')
    setDateFrom('')
    setDateTo('')
    setKeyword('')
  }

  return (
    <WarehouseListShell
      title="Phiếu xuất kho"
      description="Nháp → Gửi duyệt → Duyệt → Xác nhận xuất kho (trừ tồn)."
      guide={GIN_GUIDE}
      headerActions={
        canCreate ? (
          <Button className="gap-2 shadow-sm" onClick={openCreateModal}>
            <Plus size={16} strokeWidth={2.5} />
            Tạo phiếu xuất kho
          </Button>
        ) : undefined
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
              id: 'issueType',
              label: 'Loại xuất',
              value: issueTypeFilter,
              onChange: setIssueTypeFilter,
              options: GIN_ISSUE_TYPE_FILTER_OPTIONS,
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
                placeholder="Tìm mã phiếu / chứng từ…"
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
      errorTitle="Không tải được phiếu xuất kho"
      totalCount={list.length}
      filteredCount={filteredList.length}
      emptyIcon={PackageMinus}
      emptyTitle="Chưa có phiếu xuất kho"
      emptyDescription="Tạo phiếu mới — chọn kho, loại xuất và danh sách hàng."
      emptyAction={
        canCreate
          ? {
              label: 'Tạo phiếu xuất kho',
              onClick: openCreateModal,
            }
          : undefined
      }
      filteredEmptyTitle="Không có phiếu phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho, loại xuất, trạng thái hoặc khoảng ngày."
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
      <GinCreateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        warehouseOptions={warehouseOptions}
        products={products}
        productsError={productsError}
        productsLoading={productsLoading}
        defaultWarehouseId={filters.warehouseId}
        isPending={create.isPending}
        onSubmit={(body) =>
          create.mutate(body, {
            onSuccess: (gin) => {
              setOpen(false)
              if (gin?.id) nav(`/warehouse/gin/${gin.id}`)
            },
          })
        }
      />
    </WarehouseListShell>
  )
}
