// ============================================================
// GoodsIssueNotesPage — danh sách PXK (GIN) — AppTable + pipeline UX
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageMinus, Plus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button, AppModal } from '@frezo/ui'
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
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import {
  formatVnd,
  issueTypeLabel,
  parseProductLines,
} from '../utils/grnGinUtils'
import { resolveProductTokens } from '../utils/stockTakeUtils'
import { formatWarehouseLabel } from '../utils/displayUtils'
import type { GinDto } from '../services/ginApi'

export function GoodsIssueNotesPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters()
  const [issueTypeFilter, setIssueTypeFilter] = useState('')
  const [keyword, setKeyword] = useState('')

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
  const { data: productsRaw } = useProducts()
  const create = useCreateGin()
  const canCreate = usePermission('WAREHOUSE.GIN.CREATE')

  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [issueType, setIssueType] = useState('SALES')
  const [documentNo, setDocumentNo] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [transferWarehouseId, setTransferWarehouseId] = useState('')
  const [note, setNote] = useState('')
  const [linesRaw, setLinesRaw] = useState('')

  const products = useMemo(() => {
    const raw = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    return Array.isArray(raw) ? raw : []
  }, [productsRaw])

  const warehouseOptions = filters.warehouses

  const filteredList = useMemo(() => {
    return list.filter((gin) => {
      if (filters.warehouseId && gin.warehouseId !== filters.warehouseId) return false
      if (issueTypeFilter && (gin.issueType || '').toUpperCase() !== issueTypeFilter) return false
      return true
    })
  }, [list, filters.warehouseId, issueTypeFilter])

  const stats = useMemo(() => {
    const base = filters.warehouseId
      ? list.filter((g) => g.warehouseId === filters.warehouseId)
      : list
    return [
      { label: 'Tổng phiếu', value: base.length },
      { label: 'Nháp', value: base.filter((g) => (g.status || '').toUpperCase() === 'DRAFT').length },
      { label: 'Chờ duyệt', value: base.filter((g) => (g.status || '').toUpperCase() === 'PENDING_APPROVAL').length },
      { label: 'Đã duyệt', value: base.filter((g) => (g.status || '').toUpperCase() === 'APPROVED').length },
      { label: 'Đã xuất', value: base.filter((g) => (g.status || '').toUpperCase() === 'CONFIRMED').length },
    ]
  }, [list, filters.warehouseId])

  const columns: AppTableColumn<GinDto>[] = [
    {
      key: 'code',
      title: 'Mã PXK',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/gin/${row.id}`)}
        >
          {row.ginCode || row.id.slice(0, 8)}
        </button>
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
      title: 'Dòng',
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

  const resetCreateForm = () => {
    setWarehouseId(filters.warehouseId || warehouseOptions[0]?.id || '')
    setCustomerId('')
    setIssueType('SALES')
    setDocumentNo('')
    setDocumentDate('')
    setTransferWarehouseId('')
    setNote('')
    setLinesRaw('SP001,10,25000')
  }

  const handleCreate = () => {
    if (!warehouseId || !linesRaw.trim()) return
    const parsed = parseProductLines(linesRaw)
    const tokens = parsed.map((p) => p.productId)
    const { resolved, unknown } = resolveProductTokens(tokens.join('\n'), products)
    if (unknown.length > 0) {
      toast.error(`Không tìm thấy SP: ${unknown.join(', ')}`)
      return
    }
    const tokenToId = new Map<string, string>()
    for (const p of products) {
      if (p.code) tokenToId.set(p.code.toUpperCase(), p.id)
      tokenToId.set(p.id, p.id)
    }
    const items = parsed.map((ln) => ({
      productId: tokenToId.get(ln.productId.toUpperCase()) || ln.productId,
      qtyRequested: ln.qty,
      unitCost: ln.unitCost,
    }))
    create.mutate(
      {
        warehouseId,
        customerId: customerId || undefined,
        issueType: issueType || undefined,
        documentNo: documentNo || undefined,
        documentDate: documentDate || undefined,
        transferWarehouseId:
          issueType === 'INTERNAL_TRANSFER' ? transferWarehouseId || undefined : undefined,
        note: note || undefined,
        items,
      },
      {
        onSuccess: (gin) => {
          setOpen(false)
          if (gin?.id) nav(`/warehouse/gin/${gin.id}`)
        },
      },
    )
  }

  const hasActiveFilters =
    Boolean(filters.warehouseId || filters.status || issueTypeFilter || keyword)

  const clearFilters = () => {
    filters.clearFilters()
    setIssueTypeFilter('')
    setKeyword('')
  }

  return (
    <WarehouseListShell
      title="Phiếu xuất kho (PXK)"
      description="Nháp → Gửi duyệt → Duyệt → Xác nhận xuất (trừ tồn)."
      guide={GIN_GUIDE}
      headerActions={
        canCreate ? (
          <Button
            className="gap-1.5"
            onClick={() => {
              resetCreateForm()
              setOpen(true)
            }}
          >
            <Plus size={14} /> Tạo PXK
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
                  label: w.name || w.id,
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
            <input
              className="h-9 border rounded-md px-3 text-sm bg-white min-w-[160px]"
              placeholder="Tìm mã / chứng từ…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="Tìm kiếm"
            />
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
      emptyDescription="Tạo PXK — chọn kho, loại xuất và danh sách hàng."
      emptyAction={
        canCreate
          ? {
              label: 'Tạo PXK',
              onClick: () => {
                resetCreateForm()
                setOpen(true)
              },
            }
          : undefined
      }
      filteredEmptyTitle="Không có phiếu phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho, loại xuất hoặc trạng thái."
      columns={columns}
      data={filteredList}
      onRefresh={refetch}
    >
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tạo phiếu xuất kho"
        maxWidth="lg"
      >
        <div className="space-y-3 text-sm">
          <p className="text-neutral-500 text-xs">
            Bước 1: Nhập thông tin chứng từ và dòng hàng (mã SP như SP001).
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-600">Kho xuất *</span>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">— Chọn kho —</option>
              {warehouseOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.id}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Loại xuất</span>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option value="SALES">Xuất bán</option>
                <option value="INTERNAL_TRANSFER">Chuyển kho nội bộ</option>
                <option value="DAMAGE_RETURN">Hủy/hoàn hàng</option>
                <option value="ADJUSTMENT">Điều chỉnh</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Mã khách (tuỳ chọn)</span>
              <input
                className="w-full border rounded-md px-3 py-2 font-mono"
                placeholder="KH003"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
            </label>
          </div>
          {issueType === 'INTERNAL_TRANSFER' && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Kho đích</span>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={transferWarehouseId}
                onChange={(e) => setTransferWarehouseId(e.target.value)}
              >
                <option value="">— Kho nhận —</option>
                {warehouseOptions.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Số chứng từ / HĐ xuất</span>
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="PX-2026-001"
                value={documentNo}
                onChange={(e) => setDocumentNo(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Ngày chứng từ</span>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-600">Dòng hàng *</span>
            <textarea
              rows={4}
              className="w-full border rounded-md px-3 py-2 font-mono text-xs"
              placeholder={'Mỗi dòng: mãSP,sốLượng,đơnGiá\nSP001,10,25000'}
              value={linesRaw}
              onChange={(e) => setLinesRaw(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-600">Ghi chú</span>
            <textarea
              rows={2}
              className="w-full border rounded-md px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!warehouseId || !linesRaw.trim() || create.isPending}
              onClick={handleCreate}
            >
              Lưu nháp
            </Button>
          </div>
        </div>
      </AppModal>
    </WarehouseListShell>
  )
}
