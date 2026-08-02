// ============================================================
// StockTakePage — danh sách phiếu kiểm kê (list + filter + AppTable)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardCheck, Play, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  PageHeader,
  AppModal,
  EmptyState,
  ErrorState,
  PageGuideButton,
  StatCard,
  Select,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { useWarehouses } from '../hooks/useReorderRules'
import {
  useStockTakes,
  useCreateStockTake,
  useStartStockTake,
} from '../hooks/useStockTake'
import { STOCK_TAKES_GUIDE } from '../constants/stock-takes.guide'
import { StockTakeStatusBadge } from '../components/StockTakeStatusBadge'
import { WarehouseSelect } from '../components/WarehouseSelect'
import {
  countLinesWithVariance,
  resolveProductTokens,
} from '../utils/stockTakeUtils'
import { formatWarehouseLabel } from '../utils/displayUtils'
import type { StockTakeDto } from '../services/stockTakeApi'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function StockTakePage() {
  const nav = useNavigate()
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const {
    data: list = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useStockTakes(warehouseFilter || undefined)
  const { data: warehouses = [] } = useWarehouses()
  const { data: productsRaw } = useProducts()
  const create = useCreateStockTake()
  const start = useStartStockTake()

  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [takeDate, setTakeDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [productIds, setProductIds] = useState('')

  const products = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    return Array.isArray(list) ? list : []
  }, [productsRaw])

  const filteredList = useMemo(() => {
    if (!statusFilter) return list
    const s = statusFilter.toUpperCase()
    return list.filter((st) => (st.status || '').toUpperCase() === s)
  }, [list, statusFilter])

  const stats = useMemo(() => {
    const total = list.length
    const draft = list.filter((st) => (st.status || '').toUpperCase() === 'DRAFT').length
    const counting = list.filter((st) => (st.status || '').toUpperCase() === 'IN_PROGRESS').length
    const submitted = list.filter((st) => (st.status || '').toUpperCase() === 'SUBMITTED').length
    const posted = list.filter((st) => (st.status || '').toUpperCase() === 'POSTED').length
    return { total, draft, counting, submitted, posted }
  }, [list])

  const columns: AppTableColumn<StockTakeDto>[] = [
    {
      key: 'code',
      title: 'Mã phiếu',
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline text-left"
          onClick={() => nav(`/warehouse/stock-takes/${row.id}`)}
        >
          {row.code || row.id.slice(0, 8)}
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
      key: 'takeDate',
      title: 'Ngày KK',
      render: (_, row) => (
        <span className="tabular-nums text-sm">{row.takeDate || '—'}</span>
      ),
    },
    {
      key: 'lines',
      title: 'Dòng',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums">{row.lines?.length ?? 0}</span>
      ),
    },
    {
      key: 'variance',
      title: 'Lệch',
      align: 'right',
      render: (_, row) => {
        const n = countLinesWithVariance(row)
        if (n === 0 && (row.status || '').toUpperCase() !== 'POSTED') {
          return <span className="text-neutral-400">—</span>
        }
        return (
          <span className={n > 0 ? 'text-amber-700 font-medium tabular-nums' : 'text-neutral-400'}>
            {n > 0 ? `${n} dòng` : 'Khớp'}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => <StockTakeStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 160,
      render: (_, row) => {
        const st = (row.status || '').toUpperCase()
        return (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => nav(`/warehouse/stock-takes/${row.id}`)}
            >
              <Eye size={12} /> Chi tiết
            </Button>
            {st === 'DRAFT' && (
              <Button
                size="sm"
                className="gap-1"
                disabled={start.isPending}
                onClick={() => start.mutate(row.id)}
              >
                <Play size={12} /> Start
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const handleCreate = () => {
    if (!warehouseId || !productIds.trim()) return
    const { resolved, unknown } = resolveProductTokens(productIds, products)
    if (unknown.length > 0) {
      toast.error(`Không tìm thấy SP: ${unknown.join(', ')}`)
      return
    }
    if (resolved.length === 0) {
      toast.error('Thêm ít nhất một mã sản phẩm')
      return
    }
    create.mutate(
      {
        warehouseId,
        takeDate: takeDate || undefined,
        note: note || undefined,
        lines: resolved.map((productId) => ({ productId })),
      },
      {
        onSuccess: (created) => {
          setOpen(false)
          setProductIds('')
          setNote('')
          if (created?.id) nav(`/warehouse/stock-takes/${created.id}`)
        },
      },
    )
  }

  const resetCreateForm = () => {
    setWarehouseId(warehouseFilter || warehouses[0]?.id || '')
    setTakeDate(todayIso())
    setNote('')
    setProductIds('')
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Kiểm kê kho"
        description="Đối chiếu tồn hệ thống với số đếm thực tế — điều chỉnh chênh lệch sau duyệt."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={STOCK_TAKES_GUIDE} />
            <Button
              className="gap-1.5"
              onClick={() => {
                resetCreateForm()
                setOpen(true)
              }}
            >
              <Plus size={14} /> Phiếu mới
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      {!isLoading && !isError && list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Tổng phiếu" value={stats.total} />
          <StatCard label="Nháp" value={stats.draft} />
          <StatCard label="Đang đếm" value={stats.counting} />
          <StatCard label="Chờ điều chỉnh" value={stats.submitted} />
          <StatCard label="Hoàn tất" value={stats.posted} />
        </div>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[140px]">
            <WarehouseSelect
              warehouses={warehouses as { id: string; name?: string }[]}
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              emptyOption={{ label: 'Tất cả kho' }}
              placeholder="Tất cả kho"
              showSearch={(warehouses as unknown[]).length > 8}
              aria-label="Lọc theo kho"
            />
          </div>
          <div className="min-w-[140px]">
            <Select
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'DRAFT', label: 'Nháp' },
                { value: 'IN_PROGRESS', label: 'Đang đếm' },
                { value: 'SUBMITTED', label: 'Đã gửi' },
                { value: 'POSTED', label: 'Hoàn tất' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              showSearch={false}
              aria-label="Lọc theo trạng thái"
            />
          </div>
          {(warehouseFilter || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWarehouseFilter('')
                setStatusFilter('')
              }}
            >
              Xoá lọc
            </Button>
          )}
          <span className="text-xs text-neutral-500 ml-auto tabular-nums">
            {filteredList.length} phiếu
            {warehouseFilter || statusFilter ? ' (đã lọc)' : ''}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được phiếu kiểm kê"
            message={(error as Error)?.message || 'Kiểm tra kết nối hoặc thử lại.'}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={ClipboardCheck}
            title={
              list.length === 0
                ? 'Chưa có phiếu kiểm kê'
                : 'Không có phiếu phù hợp bộ lọc'
            }
            description={
              list.length === 0
                ? 'Tạo phiếu mới, chọn kho và danh sách sản phẩm cần đếm.'
                : 'Thử đổi kho hoặc trạng thái, hoặc bấm Phiếu mới.'
            }
            action={{
              label: 'Phiếu mới',
              onClick: () => {
                resetCreateForm()
                setOpen(true)
              },
            }}
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredList}
          isLoading={isLoading}
          loadingRows={6}
          density="compact"
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Tạo phiếu kiểm kê"
        description="Bước 1/4 — Nhập thông tin phiếu. Sau khi tạo, mở chi tiết để bắt đầu đếm."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Kho *">
              <WarehouseSelect
                warehouses={warehouses as { id: string; name?: string }[]}
                value={warehouseId}
                onChange={setWarehouseId}
                placeholder="— Chọn kho —"
                aria-label="Kho kiểm kê"
              />
            </Field>
            <Field label="Ngày kiểm kê">
              <input
                id="st-date"
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={takeDate}
                onChange={(e) => setTakeDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Sản phẩm cần đếm *">
            <textarea
              id="st-products"
              rows={4}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              placeholder={'Mỗi dòng một mã SP, vd:\nSP001\nSP003\nSP006'}
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
            />
            <p className="text-xs text-neutral-500 mt-1">
              Nhập mã SP (SP001…) hoặc ID sản phẩm — phân cách bằng dòng, dấu phẩy.
            </p>
          </Field>

          <Field label="Ghi chú">
            <textarea
              id="st-note"
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Ghi chú nội bộ (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!warehouseId || !productIds.trim() || create.isPending}
              onClick={handleCreate}
            >
              Tạo phiếu
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
