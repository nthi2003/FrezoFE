// ============================================================
// StockAlertsPage — cảnh báo tồn → tạo yêu cầu mua hàng (WarehouseListShell)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellOff, PackagePlus } from 'lucide-react'
import { Button, ConfirmDialog, RowActions } from '@frezo/ui'
import { toast } from 'sonner'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import {
  useStockAlerts,
  useDismissStockAlert,
} from '../hooks/useStockAlerts'
import { useCreatePrFromAlerts } from '../hooks/usePurchaseRequest'
import { useWarehouseFilters } from '../hooks/useWarehouseFilters'
import { STOCK_ALERTS_GUIDE } from '../constants/stock-alerts.guide'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
  warehouseSelectLabel,
} from '../utils/displayUtils'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import type { StockAlertDto, StockAlertSeverity } from '../types'

const SEVERITY_META: Record<
  StockAlertSeverity,
  { label: string; tone: string }
> = {
  CRITICAL: {
    label: 'Hết hàng',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  WARNING: {
    label: 'Dưới min',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  INFO: {
    label: 'Theo dõi',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

export function StockAlertsPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [alertTypeTab, setAlertTypeTab] = useState<'all' | 'LOW_STOCK' | 'EXPIRY_SOON'>('all')
  const [category, setCategory] = useState('')
  const [dismissTarget, setDismissTarget] = useState<StockAlertDto | null>(null)
  const [createPrRows, setCreatePrRows] = useState<StockAlertDto[] | null>(null)

  const {
    data: rows = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useStockAlerts(tab, alertTypeTab === 'all' ? '' : alertTypeTab)
  const dismiss = useDismissStockAlert()
  const createPr = useCreatePrFromAlerts()

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => r.categoryName && set.add(r.categoryName))
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let list = rows
    if (filters.warehouseId) {
      list = list.filter((r) => r.warehouseId === filters.warehouseId)
    }
    if (category) list = list.filter((r) => r.categoryName === category)
    return list
  }, [rows, filters.warehouseId, category])

  const openCritical = rows.filter(
    (r) => r.status === 'OPEN' && r.severity === 'CRITICAL',
  ).length
  const expiryOpen = rows.filter(
    (r) => r.status === 'OPEN' && r.alertType === 'EXPIRY_SOON',
  ).length

  const stats = useMemo(
    () => [
      {
        label: 'Đang mở',
        value: rows.filter((r) => r.status === 'OPEN').length,
      },
      { label: 'Hết hàng', value: openCritical },
      { label: 'Cận hạn (lô)', value: expiryOpen },
    ],
    [rows, openCritical, expiryOpen],
  )

  const hasActiveFilters = Boolean(
    filters.warehouseId || category || alertTypeTab !== 'all' || tab !== 'open',
  )

  const clearFilters = () => {
    filters.clearFilters()
    setCategory('')
    setAlertTypeTab('all')
    setTab('open')
  }

  const requestCreatePr = (selectedAlerts: StockAlertDto[]) => {
    if (selectedAlerts.length === 0) {
      toast.error('Chọn ít nhất 1 cảnh báo')
      return
    }
    const suppliers = new Set(
      selectedAlerts.map((a) => a.supplierId || '').filter(Boolean),
    )
    if (suppliers.size > 1) {
      toast.error('Chỉ chọn cảnh báo cùng một nhà cung cấp')
      return
    }
    setCreatePrRows(selectedAlerts)
  }

  const columns: AppTableColumn<StockAlertDto>[] = [
    {
      key: 'product',
      title: 'Sản phẩm',
      render: (_, row) => (
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">
            {formatProductLabel(row)}
          </div>
          {row.categoryName && (
            <div className="text-[11px] text-neutral-500">{row.categoryName}</div>
          )}
        </div>
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
      key: 'qty',
      title: 'Tồn / Min',
      align: 'right',
      render: (_, row) =>
        row.alertType === 'EXPIRY_SOON' ? (
          <div className="text-sm tabular-nums">
            <div>{row.currentQty}</div>
            <div className="text-[11px] text-neutral-500">
              HSD {row.expiryDate || '—'}
              {row.daysToExpiry != null ? ` · còn ${row.daysToExpiry} ngày` : ''}
            </div>
          </div>
        ) : (
          <span className="tabular-nums text-sm">
            {row.currentQty} / {row.minQty}
          </span>
        ),
    },
    {
      key: 'severity',
      title: 'Mức',
      render: (_, row) => {
        const meta = SEVERITY_META[row.severity] || SEVERITY_META.INFO
        const label =
          row.alertType === 'EXPIRY_SOON' ? 'Cận hạn' : meta.label
        return (
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${meta.tone}`}
          >
            {label}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 120,
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'dismiss',
              icon: BellOff,
              tooltip: 'Bỏ qua',
              disabled: dismiss.isPending,
              hidden: row.status !== 'OPEN',
              onClick: () => setDismissTarget(row),
            },
          ]}
        />
      ),
    },
  ]

  const bulkActions: BulkAction<StockAlertDto>[] =
    tab === 'open'
      ? [
          {
            key: 'create-pr',
            label: 'Tạo yêu cầu mua hàng',
            icon: PackagePlus,
            onClick: (selected) => requestCreatePr(selected),
          },
        ]
      : []

  return (
    <WarehouseListShell
      title="Cảnh báo tồn kho"
      description="Bỏ qua hoặc chọn nhiều cảnh báo (cùng NCC) để tạo yêu cầu mua hàng."
      guide={STOCK_ALERTS_GUIDE}
      headerActions={
        <Button variant="outline" onClick={() => nav('/warehouse/purchase-requests')}>
          Yêu cầu mua hàng
        </Button>
      }
      stats={stats}
      filterBar={
        <WarehouseFilterBar
          selects={[
            {
              id: 'status',
              label: 'Trạng thái cảnh báo',
              value: tab,
              onChange: (v) => setTab(v as 'open' | 'resolved'),
              options: [
                { value: 'open', label: 'Đang mở' },
                { value: 'resolved', label: 'Đã xử lý' },
              ],
            },
            {
              id: 'alertType',
              label: 'Loại cảnh báo',
              value: alertTypeTab,
              onChange: (v) =>
                setAlertTypeTab(v as 'all' | 'LOW_STOCK' | 'EXPIRY_SOON'),
              options: [
                { value: 'all', label: 'Tất cả loại' },
                { value: 'LOW_STOCK', label: 'Dưới min' },
                { value: 'EXPIRY_SOON', label: 'Cận hạn' },
              ],
            },
            {
              id: 'warehouse',
              label: 'Lọc theo kho',
              value: filters.warehouseId,
              onChange: filters.setWarehouseId,
              options: [
                { value: '', label: 'Tất cả kho' },
                ...filters.warehouses.map((w) => ({
                  value: w.id,
                  label: warehouseSelectLabel(w),
                })),
              ],
            },
            ...(categories.length > 0
              ? [
                  {
                    id: 'category',
                    label: 'Danh mục',
                    value: category,
                    onChange: setCategory,
                    options: [
                      { value: '', label: 'Tất cả danh mục' },
                      ...categories.map((c) => ({ value: c, label: c })),
                    ],
                  },
                ]
              : []),
          ]}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          countLabel={`${filtered.length} cảnh báo${hasActiveFilters ? ' (đã lọc)' : ''}`}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isFetching={isFetching}
      onRetry={refetch}
      errorTitle="Không tải được cảnh báo tồn kho"
      totalCount={rows.length}
      filteredCount={filtered.length}
      emptyIcon={AlertTriangle}
      emptyTitle="Không có cảnh báo"
      emptyDescription="Không có cảnh báo theo bộ lọc — kiểm tra quy tắc tái nhập hoặc đổi lọc."
      emptyAction={{
        label: 'Quy tắc tái nhập',
        onClick: () => nav('/warehouse/reorder-rules'),
      }}
      filteredEmptyTitle="Không có cảnh báo phù hợp bộ lọc"
      filteredEmptyDescription="Thử đổi kho, loại hoặc trạng thái."
      columns={columns}
      data={filtered}
      onRefresh={refetch}
      selectable={tab === 'open'}
      getRowId={(r) => r.id}
      bulkActions={bulkActions}
    >
      <ConfirmDialog
        isOpen={!!dismissTarget}
        onClose={() => setDismissTarget(null)}
        onConfirm={() => {
          if (!dismissTarget) return
          dismiss.mutate(dismissTarget.id, {
            onSuccess: () => setDismissTarget(null),
          })
        }}
        title="Bỏ qua cảnh báo?"
        message={`Ẩn cảnh báo cho ${dismissTarget ? formatProductLabel(dismissTarget) : 'sản phẩm'} — không tạo yêu cầu mua.`}
        confirmText="Bỏ qua"
        cancelText="Huỷ"
        variant="default"
        isLoading={dismiss.isPending}
      />

      <ConfirmDialog
        isOpen={!!createPrRows}
        onClose={() => setCreatePrRows(null)}
        onConfirm={() => {
          if (!createPrRows?.length) return
          const suppliers = new Set(
            createPrRows.map((a) => a.supplierId || '').filter(Boolean),
          )
          const supplierId = [...suppliers][0] || undefined
          createPr.mutate(
            {
              alertIds: createPrRows.map((a) => a.id),
              supplierId,
            },
            {
              onSuccess: (list) => {
                setCreatePrRows(null)
                const first = list?.[0]
                if (list?.length === 1 && first?.id) {
                  nav(`/warehouse/purchase-requests/${first.id}`)
                } else {
                  nav('/warehouse/purchase-requests')
                }
              },
            },
          )
        }}
        title={`Tạo yêu cầu mua hàng từ ${createPrRows?.length ?? 0} cảnh báo?`}
        message="Hệ thống tạo yêu cầu mua hàng nháp từ các dòng đã chọn (cùng NCC)."
        confirmText="Tạo yêu cầu mua hàng"
        cancelText="Huỷ"
        variant="default"
        isLoading={createPr.isPending}
      />
    </WarehouseListShell>
  )
}
