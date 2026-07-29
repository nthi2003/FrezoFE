// ============================================================
// GoodsReceiptNotesPage — danh sách PNK (GRN) — AppTable + hóa đơn NCC
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, Plus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  AppModal,
  PageGuideButton,
  StatCard,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { GRN_GUIDE } from '../constants/grn-gin.guide'
import { useWarehouses } from '../hooks/useReorderRules'
import { useGrns, useCreateGrn } from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import { GrnGinStatusBadge } from '../components/GrnGinStatusBadge'
import { formatVnd, parseProductLines } from '../utils/grnGinUtils'
import { resolveProductTokens } from '../utils/stockTakeUtils'
import { formatWarehouseLabel } from '../utils/displayUtils'
import type { GrnDto } from '../services/grnApi'

export function GoodsReceiptNotesPage() {
  const nav = useNavigate()
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const listParams = useMemo(
    () => ({
      status: statusFilter || undefined,
      keyword: keyword.trim() || undefined,
    }),
    [statusFilter, keyword],
  )

  const {
    data: list = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGrns(listParams)
  const { data: warehouses = [] } = useWarehouses()
  const { data: productsRaw } = useProducts()
  const create = useCreateGrn()
  const canCreate = usePermission('WAREHOUSE.GRN.CREATE')

  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [note, setNote] = useState('')
  const [linesRaw, setLinesRaw] = useState('')

  const products = useMemo(() => {
    const raw = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    return Array.isArray(raw) ? raw : []
  }, [productsRaw])

  const warehouseOptions = useMemo(
    () => warehouses as { id: string; name?: string }[],
    [warehouses],
  )

  const filteredList = useMemo(() => {
    if (!warehouseFilter) return list
    return list.filter((grn) => grn.warehouseId === warehouseFilter)
  }, [list, warehouseFilter])

  const stats = useMemo(() => {
    const total = list.length
    const draft = list.filter((g) => (g.status || '').toUpperCase() === 'DRAFT').length
    const pending = list.filter((g) => (g.status || '').toUpperCase() === 'PENDING_APPROVAL').length
    const approved = list.filter((g) => (g.status || '').toUpperCase() === 'APPROVED').length
    const confirmed = list.filter((g) => (g.status || '').toUpperCase() === 'CONFIRMED').length
    return { total, draft, pending, approved, confirmed }
  }, [list])

  const columns: AppTableColumn<GrnDto>[] = [
    {
      key: 'code',
      title: 'Mã PNK',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/grn/${row.id}`)}
        >
          {row.grnCode || row.id.slice(0, 8)}
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
      key: 'supplier',
      title: 'NCC / HĐ',
      render: (_, row) => (
        <div className="text-sm">
          <div>{row.supplierName || row.supplierId || '—'}</div>
          {row.invoiceNo && (
            <div className="text-xs text-neutral-500 font-mono">{row.invoiceNo}</div>
          )}
        </div>
      ),
    },
    {
      key: 'po',
      title: 'PO',
      render: (_, row) => (
        <span className="font-mono text-xs">
          {row.purchaseOrderCode || row.purchaseOrderId?.slice(0, 8) || '—'}
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
          onClick={() => nav(`/warehouse/grn/${row.id}`)}
        >
          <Eye size={12} /> Chi tiết
        </Button>
      ),
    },
  ]

  const resetCreateForm = () => {
    setWarehouseId(warehouseFilter || warehouseOptions[0]?.id || '')
    setPurchaseOrderId('')
    setSupplierId('NCC001')
    setInvoiceNo('')
    setInvoiceDate('')
    setNote('')
    setLinesRaw('SP001,100,25000')
  }

  const handleCreate = () => {
    if (!warehouseId || !linesRaw.trim()) return
    const parsed = parseProductLines(linesRaw)
    const tokens = parsed.map((p) => p.productId)
    const { unknown } = resolveProductTokens(tokens.join('\n'), products)
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
      qtyExpected: ln.qty,
      unitCost: ln.unitCost,
    }))
    create.mutate(
      {
        warehouseId,
        purchaseOrderId: purchaseOrderId || undefined,
        supplierId: supplierId || undefined,
        invoiceNo: invoiceNo || undefined,
        invoiceDate: invoiceDate || undefined,
        note: note || undefined,
        items,
      },
      {
        onSuccess: (grn) => {
          setOpen(false)
          if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Phiếu nhập kho (PNK)"
        description="Quy trình T3/AMIS: Nháp → Gửi duyệt → Duyệt → Xác nhận nhập (cộng tồn) + hóa đơn NCC."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={GRN_GUIDE} />
            <Button variant="outline" onClick={() => nav('/warehouse/purchase-orders')}>
              Từ PO
            </Button>
            {canCreate && (
              <Button
                className="gap-1.5"
                onClick={() => {
                  resetCreateForm()
                  setOpen(true)
                }}
              >
                <Plus size={14} /> Tạo PNK
              </Button>
            )}
          </div>
        }
      />

      {!isLoading && !isError && list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Tổng phiếu" value={stats.total} />
          <StatCard label="Nháp" value={stats.draft} />
          <StatCard label="Chờ duyệt" value={stats.pending} />
          <StatCard label="Đã duyệt" value={stats.approved} />
          <StatCard label="Đã nhập" value={stats.confirmed} />
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="h-9 border rounded-md px-3 text-sm bg-white min-w-[140px]"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">Tất cả kho</option>
            {warehouseOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || w.id}
              </option>
            ))}
          </select>
          <select
            className="h-9 border rounded-md px-3 text-sm bg-white min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">Nháp</option>
            <option value="PENDING_APPROVAL">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="CONFIRMED">Đã nhập</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
          <input
            className="h-9 border rounded-md px-3 text-sm bg-white min-w-[160px]"
            placeholder="Tìm mã / HĐ NCC…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {(warehouseFilter || statusFilter || keyword) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWarehouseFilter('')
                setStatusFilter('')
                setKeyword('')
              }}
            >
              Xoá lọc
            </Button>
          )}
          <span className="text-xs text-neutral-500 ml-auto tabular-nums">
            {filteredList.length} phiếu
          </span>
        </div>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được phiếu nhập kho"
            message="Kiểm tra /warehouse/grn và quyền WAREHOUSE.GRN.VIEW."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={PackagePlus}
            title={list.length === 0 ? 'Chưa có phiếu nhập kho' : 'Không có phiếu phù hợp'}
            description="Demo: GRN-DEMO-001 (nháp + PO), GRN-DEMO-003 (đã nhập)."
            action={
              canCreate
                ? {
                    label: 'Tạo PNK',
                    onClick: () => {
                      resetCreateForm()
                      setOpen(true)
                    },
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredList}
          isLoading={isLoading || isFetching}
          loadingRows={6}
          density="compact"
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo phiếu nhập kho" maxWidth="lg">
        <div className="space-y-3 text-sm">
          <p className="text-neutral-500 text-xs">
            Bước 1: Kho, NCC, hóa đơn đầu vào và dòng hàng (mã SP như SP001).
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-600">Kho nhập *</span>
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
              <span className="text-xs font-medium text-neutral-600">Mã NCC</span>
              <input
                className="w-full border rounded-md px-3 py-2 font-mono"
                placeholder="NCC001"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">PO ID (tuỳ chọn)</span>
              <input
                className="w-full border rounded-md px-3 py-2 font-mono text-xs"
                placeholder="Liên kết đơn mua"
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Số hóa đơn NCC</span>
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="HD-2026-0012345"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Ngày hóa đơn</span>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-neutral-600">Dòng hàng *</span>
            <textarea
              rows={4}
              className="w-full border rounded-md px-3 py-2 font-mono text-xs"
              placeholder={'mãSP,sốLượng,đơnGiá\nSP001,100,25000'}
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
    </div>
  )
}
