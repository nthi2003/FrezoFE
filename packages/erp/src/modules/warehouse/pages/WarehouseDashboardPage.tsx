// ============================================================
// WarehouseDashboardPage — KPI + shortcut luồng kho (AMIS/Odoo hub)
// ============================================================

import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Package,
  PackageMinus,
  PackagePlus,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react'
import { Button, PageHeader, StatCard } from '@frezo/ui'
import { useStockAlerts } from '../hooks/useStockAlerts'
import { useGrns } from '../hooks/useGrn'
import { useGins } from '../hooks/useGin'
import { usePurchaseRequests } from '../hooks/usePurchaseRequest'
import { usePurchaseOrders } from '../hooks/usePurchaseOrder'
import { StatusPipelineStepper, PR_PIPELINE } from '../components/StatusPipelineStepper'

const SHORTCUTS = [
  {
    label: 'Cảnh báo tồn',
    href: '/warehouse/stock-alerts',
    icon: AlertTriangle,
    tone: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  {
    label: 'Yêu cầu mua',
    href: '/warehouse/purchase-requests',
    icon: ClipboardList,
    tone: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  {
    label: 'Đơn mua',
    href: '/warehouse/purchase-orders',
    icon: ShoppingCart,
    tone: 'text-primary-800 bg-primary-50 border-primary-200',
  },
  {
    label: 'Phiếu nhập',
    href: '/warehouse/grn',
    icon: PackagePlus,
    tone: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  },
  {
    label: 'Phiếu xuất',
    href: '/warehouse/gin',
    icon: PackageMinus,
    tone: 'text-violet-800 bg-violet-50 border-violet-200',
  },
  {
    label: 'Kiểm kê',
    href: '/warehouse/stock-takes',
    icon: Package,
    tone: 'text-neutral-700 bg-neutral-50 border-neutral-200',
  },
  {
    label: 'Quy tắc tái nhập',
    href: '/warehouse/reorder-rules',
    icon: TrendingDown,
    tone: 'text-blue-800 bg-blue-50 border-blue-200',
  },
] as const

function countByStatus(
  list: Array<{ status?: string }>,
  statuses: string[],
): number {
  const set = new Set(statuses.map((s) => s.toUpperCase()))
  return list.filter((x) => set.has((x.status || '').toUpperCase())).length
}

export function WarehouseDashboardPage() {
  const nav = useNavigate()
  const { data: alerts = [] } = useStockAlerts('open')
  const { data: grns = [] } = useGrns()
  const { data: gins = [] } = useGins()
  const { data: prs = [] } = usePurchaseRequests()
  const { data: pos = [] } = usePurchaseOrders()

  const kpis = useMemo(() => {
    const openAlerts = alerts.filter((a) => a.status === 'OPEN')
    const critical = openAlerts.filter((a) => a.severity === 'CRITICAL').length
    const grnDraft = countByStatus(grns, ['DRAFT'])
    const grnPending = countByStatus(grns, ['PENDING_APPROVAL'])
    const ginDraft = countByStatus(gins, ['DRAFT'])
    const ginPending = countByStatus(gins, ['PENDING_APPROVAL'])
    const prPending = countByStatus(prs, [
      'PENDING',
      'SUBMITTED',
      'IN_APPROVAL',
      'WAITING_APPROVAL',
    ])
    const poConfirmed = countByStatus(pos, ['CONFIRMED', 'PARTIAL_RECEIVED'])

    return {
      critical,
      openAlerts: openAlerts.length,
      grnDraft,
      grnPending,
      ginDraft,
      ginPending,
      prPending,
      poConfirmed,
    }
  }, [alerts, grns, gins, prs, pos])

  const actionItems = useMemo(() => {
    const items: Array<{ label: string; href: string; tone: string }> = []
    if (kpis.critical > 0) {
      items.push({
        label: `${kpis.critical} sản phẩm hết hàng`,
        href: '/warehouse/stock-alerts',
        tone: 'text-rose-700',
      })
    }
    if (kpis.prPending > 0) {
      items.push({
        label: `${kpis.prPending} PR chờ duyệt`,
        href: '/approval/inbox',
        tone: 'text-amber-800',
      })
    }
    if (kpis.grnPending > 0) {
      items.push({
        label: `${kpis.grnPending} PNK chờ duyệt`,
        href: '/warehouse/grn?status=PENDING_APPROVAL',
        tone: 'text-amber-800',
      })
    }
    if (kpis.grnDraft > 0) {
      items.push({
        label: `${kpis.grnDraft} PNK nháp — cần HĐ NCC & xác nhận`,
        href: '/warehouse/grn?status=DRAFT',
        tone: 'text-emerald-800',
      })
    }
    if (kpis.ginPending > 0) {
      items.push({
        label: `${kpis.ginPending} PXK chờ duyệt`,
        href: '/warehouse/gin?status=PENDING_APPROVAL',
        tone: 'text-violet-800',
      })
    }
    return items
  }, [kpis])

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl">
      <PageHeader
        title="Tổng quan kho"
        description="Luồng mua–nhập–xuất–kiểm kê theo chuẩn AMIS/Odoo — Frezo adapt."
        actions={
          <Link to="/docs/guide-warehouse-grn-gin">
            <Button variant="outline" size="sm">
              Hướng dẫn EU
            </Button>
          </Link>
        }
      />

      <StatusPipelineStepper
        steps={PR_PIPELINE}
        currentIndex={3}
        className="opacity-90"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Cảnh báo mở" value={kpis.openAlerts} />
        <StatCard label="Hết hàng" value={kpis.critical} />
        <StatCard label="PNK nháp / chờ duyệt" value={`${kpis.grnDraft} / ${kpis.grnPending}`} />
        <StatCard label="PXK nháp / chờ duyệt" value={`${kpis.ginDraft} / ${kpis.ginPending}`} />
      </div>

      {actionItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-amber-900">Việc cần làm hôm nay</p>
          <ul className="space-y-1">
            {actionItems.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={`text-sm hover:underline inline-flex items-center gap-1 ${item.tone}`}
                  onClick={() => nav(item.href)}
                >
                  {item.label}
                  <ArrowRight size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-neutral-600 mb-3">Đi nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SHORTCUTS.map(({ label, href, icon: Icon, tone }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition hover:shadow-sm ${tone}`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white px-4 py-3 text-xs text-neutral-500">
        Chuẩn Frezo: <strong>Alert → PR → Duyệt → PO → GRN (+ HĐ NCC) → Confirm</strong>
        {' · '}
        Xuất: <strong>GIN (bán / chuyển kho / nội bộ) → Duyệt → Confirm</strong>
        {' · '}
        Chi tiết benchmark:{' '}
        <code className="text-neutral-600">modules/warehouse/WAREHOUSE_BENCHMARK.md</code>
      </div>
    </div>
  )
}
