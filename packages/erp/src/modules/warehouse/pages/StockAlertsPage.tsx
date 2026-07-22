// ============================================================
// StockAlertsPage — multi-select → Tạo PR (cùng supplier)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BellOff, PackagePlus, Package,
} from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import { toast } from 'sonner'
import {
  useStockAlerts, useDismissStockAlert,
} from '../hooks/useStockAlerts'
import { useWarehouses } from '../hooks/useReorderRules'
import { useCreatePrFromAlerts } from '../hooks/usePurchaseRequest'
import type { StockAlertDto, StockAlertSeverity } from '../types'

const SEVERITY_META: Record<
  StockAlertSeverity,
  { label: string; tone: string; bar: string }
> = {
  CRITICAL: {
    label: 'Hết hàng',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'bg-rose-500',
  },
  WARNING: {
    label: 'Dưới min',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
  },
  INFO: {
    label: 'Theo dõi',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    bar: 'bg-blue-500',
  },
}

export function StockAlertsPage() {
  const nav = useNavigate()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [warehouseId, setWarehouseId] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { data: warehouses = [] } = useWarehouses()
  const { data: rows = [], isLoading } = useStockAlerts(tab)
  const dismiss = useDismissStockAlert()
  const createPr = useCreatePrFromAlerts()

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => r.categoryName && set.add(r.categoryName))
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    let list = rows
    if (warehouseId) list = list.filter((r) => r.warehouseId === warehouseId)
    if (category) list = list.filter((r) => r.categoryName === category)
    return list
  }, [rows, warehouseId, category])

  const openCritical = rows.filter(
    (r) => r.status === 'OPEN' && r.severity === 'CRITICAL',
  ).length

  const selectedAlerts = filtered.filter((a) => selected.has(a.id))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreatePr = () => {
    if (selectedAlerts.length === 0) {
      toast.error('Chọn ít nhất 1 alert')
      return
    }
    const suppliers = new Set(
      selectedAlerts.map((a) => a.supplierId || '').filter(Boolean),
    )
    if (suppliers.size > 1) {
      toast.error('Chỉ chọn alerts cùng một supplier')
      return
    }
    const supplierId = [...suppliers][0] || undefined
    createPr.mutate(
      {
        alertIds: selectedAlerts.map((a) => a.id),
        supplierId,
      },
      {
        onSuccess: (list) => {
          setSelected(new Set())
          const first = list?.[0]
          if (list?.length === 1 && first?.id) {
            nav(`/warehouse/purchase-requests/${first.id}`)
          } else {
            nav('/warehouse/purchase-requests')
          }
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Cảnh báo tồn kho"
        description="Dismiss hoặc chọn nhiều alert (cùng supplier) để tạo Purchase Request."
        actions={
          selected.size > 0 ? (
            <Button
              className="gap-1.5"
              disabled={createPr.isPending}
              onClick={handleCreatePr}
            >
              <PackagePlus size={14} /> Tạo PR ({selected.size})
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => nav('/warehouse/purchase-requests')}
            >
              Danh sách PR
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat
          label="Đang mở"
          value={rows.filter((r) => r.status === 'OPEN').length}
          tone="amber"
        />
        <Stat label="Hết hàng (qty=0)" value={openCritical} tone="rose" />
        <Stat label="Đang xem" value={filtered.length} tone="neutral" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['open', 'resolved'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-8 px-3 rounded-full text-xs font-semibold border ${
              tab === t
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {t === 'open' ? 'Đang mở' : 'Đã xử lý'}
          </button>
        ))}
        <select
          className="h-8 border rounded-md px-2 text-xs bg-white"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value="">Tất cả kho</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          className="h-8 border rounded-md px-2 text-xs bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-400 text-sm">Đang tải…</div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Package}
            title="Không có cảnh báo"
            description="Không có alert theo bộ lọc hiện tại."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              checked={selected.has(alert.id)}
              onToggle={() => toggle(alert.id)}
              dismissing={dismiss.isPending}
              onDismiss={() => dismiss.mutate(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AlertRow({
  alert,
  checked,
  onToggle,
  dismissing,
  onDismiss,
}: {
  alert: StockAlertDto
  checked: boolean
  onToggle: () => void
  dismissing: boolean
  onDismiss: () => void
}) {
  const meta = SEVERITY_META[alert.severity] || SEVERITY_META.INFO
  const isOpen = alert.status === 'OPEN'
  const pct =
    alert.minQty > 0
      ? Math.min(100, Math.round((alert.currentQty / alert.minQty) * 100))
      : 0

  return (
    <div className="bg-white border rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
      {isOpen && (
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={onToggle}
          title={
            alert.supplierId
              ? `Supplier ${alert.supplierId}`
              : 'Chưa có supplierId'
          }
        />
      )}
      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
        <AlertTriangle size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-neutral-900 truncate">
            {alert.productName || alert.productId}
          </span>
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${meta.tone}`}
          >
            {meta.label}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {alert.productCode}
          </span>
          {alert.supplierName || alert.supplierId ? (
            <span className="text-[10px] text-neutral-500">
              NCC: {alert.supplierName || alert.supplierId}
            </span>
          ) : null}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5 flex flex-wrap gap-2">
          <span>{alert.warehouseName}</span>
          {alert.categoryName && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{alert.categoryName}</span>
            </>
          )}
          <span className="text-neutral-300">·</span>
          <span>
            Tồn <b className="tabular-nums text-neutral-800">{alert.currentQty}</b> / min{' '}
            <b className="tabular-nums">{alert.minQty}</b>
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden max-w-xs">
          <div
            className={`h-full ${meta.bar}`}
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
      </div>
      {isOpen && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={dismissing}
            onClick={onDismiss}
          >
            <BellOff size={13} /> Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'rose' | 'neutral'
}) {
  const map = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
    neutral: 'bg-white border-neutral-200 text-neutral-800',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 ${map}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  )
}
