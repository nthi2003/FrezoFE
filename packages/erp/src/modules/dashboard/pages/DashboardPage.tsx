// ============================================================
// FREZO ERP — Dashboard Page (redesigned)
// Header + greeting theo giờ · 8 KPI cards · 4 charts · Feed · Quick actions.
// Tách các section thành sub-component trong dashboard/components/.
// ============================================================

import { useMemo } from 'react'
import {
  DollarSign, Wallet, ShoppingBag, AlertTriangle, Users,
  UserCheck, CalendarClock, CheckSquare,
} from 'lucide-react'
import { PageHeader } from '@frezo/ui'
import { formatCurrency, formatCurrencyShort } from '@frezo/utils'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardSummary } from '../hooks/useDashboard'
import {
  useInvoices, usePipelines, usePipelineStages, useDealsByPipeline,
} from '../../crm/hooks/useCrm'
import { usePayrolls } from '../../qlns/hooks/usePayroll'
import { useLeaveRequests } from '../../qlns/hooks/useLeave'
import { useTasks } from '../../tasks/hooks/useTask'
import type { Deal, Invoice } from '../../crm/services/crmApi'
import type { LeaveRequestItem } from '../../qlns/services/leaveApi'

import { KpiCard } from '../components/KpiCard'
import { RevenueChart, type RevenueChartPoint } from '../components/RevenueChart'
import { TopCustomersChart, type TopCustomerRow } from '../components/TopCustomersChart'
import { CostBreakdown, type CostSlice } from '../components/CostBreakdown'
import { PipelineFunnel, type FunnelRow } from '../components/PipelineFunnel'
import { ActivityFeed, type FeedItem } from '../components/ActivityFeed'
import { QuickActions } from '../components/QuickActions'

// ============================================================
// Helpers
// ============================================================

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}

// Sum invoices theo tháng (past 12 months, key = "MM/YY")
function buildRevenueSeries(invoices: Invoice[], payrolls: PayrollLike[]): RevenueChartPoint[] {
  const now = new Date()
  const months: RevenueChartPoint[] = []
  const invByMonth = new Map<string, number>()
  const costByMonth = new Map<string, number>()

  invoices.forEach((v) => {
    if (!v.issuedDate) return
    if (v.status !== 'PAID' && v.status !== 'PARTIALLY_PAID' && v.status !== 'ISSUED') return
    const d = new Date(v.issuedDate)
    const key = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`
    invByMonth.set(key, (invByMonth.get(key) || 0) + (v.total || 0))
  })

  payrolls.forEach((p) => {
    const month = p.month ?? p.periodMonth
    const year = p.year ?? p.periodYear
    if (!month || !year) return
    const key = `${month}/${String(year).slice(-2)}`
    costByMonth.set(key, (costByMonth.get(key) || 0) + (p.netAmount ?? p.totalNet ?? p.netSalary ?? 0))
  })

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`
    months.push({
      month: key,
      revenue: invByMonth.get(key) || 0,
      cost: costByMonth.get(key) || 0,
    })
  }
  return months
}

interface PayrollLike {
  month?: number
  year?: number
  periodMonth?: number
  periodYear?: number
  netAmount?: number
  totalNet?: number
  netSalary?: number
}

interface StageLike {
  id: string
  name: string
  orderNo: number
}

// ============================================================
// Main Dashboard
// ============================================================

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(() => startOfMonth(now), [now])
  const yearStart = useMemo(() => startOfYear(now), [now])

  // ---- Data ----
  const { data: summary, isLoading: sumLoading } = useDashboardSummary()
  const { data: invoicesRaw, isLoading: invLoading } = useInvoices()
  const { data: payrollsRaw, isLoading: payLoading } = usePayrolls()
  const { data: leavesRaw, isLoading: leaveLoading } = useLeaveRequests(1, 100)
  const { data: tasksRaw, isLoading: taskLoading } = useTasks()
  const { data: pipelines } = usePipelines()

  const pipelineList = (pipelines as { id: string; isDefault?: boolean }[] | undefined) ?? []
  const defaultPipelineId = pipelineList.find((p) => p.isDefault)?.id ?? pipelineList[0]?.id
  const { data: stagesRaw } = usePipelineStages(defaultPipelineId)
  const { data: dealsRaw, isLoading: dealsLoading } = useDealsByPipeline(defaultPipelineId)

  // ---- Cast ----
  const invoices = (invoicesRaw as Invoice[] | undefined) ?? []
  const payrolls = (payrollsRaw as PayrollLike[] | undefined) ?? []
  const leaves = (leavesRaw as LeaveRequestItem[] | undefined) ?? []
  const tasks = (tasksRaw as { id: string; status?: string; title?: string; createdDate?: string }[] | undefined) ?? []
  const deals = (dealsRaw as Deal[] | undefined) ?? []
  const stages = (stagesRaw as StageLike[] | undefined) ?? []

  // ---- Derived KPIs ----
  const revenueThisMonth = useMemo(
    () =>
      invoices
        .filter((v) => v.issuedDate && new Date(v.issuedDate) >= monthStart)
        .filter((v) => v.status === 'PAID' || v.status === 'PARTIALLY_PAID' || v.status === 'ISSUED')
        .reduce((s, v) => s + (v.total || 0), 0),
    [invoices, monthStart],
  )

  const revenueLastMonth = useMemo(() => {
    const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastEnd = monthStart
    return invoices
      .filter((v) => v.issuedDate && new Date(v.issuedDate) >= lastStart && new Date(v.issuedDate) < lastEnd)
      .reduce((s, v) => s + (v.total || 0), 0)
  }, [invoices, monthStart, now])

  const revenueDeltaPct = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : undefined

  const payrollCostThisMonth = useMemo(() => {
    return payrolls
      .filter((p) => (p.month ?? p.periodMonth) === now.getMonth() + 1
        && (p.year ?? p.periodYear) === now.getFullYear())
      .reduce((s, p) => s + (p.netAmount ?? p.totalNet ?? p.netSalary ?? 0), 0)
  }, [payrolls, now])

  const openDeals = useMemo(
    () => deals.filter((d) => d.status === 'OPEN' || d.status === 'STALLED'),
    [deals],
  )
  const openDealsValue = useMemo(
    () => openDeals.reduce((s, d) => s + (d.amount || 0), 0),
    [openDeals],
  )

  const overdueInvoices = useMemo(() => {
    const nowMs = now.getTime()
    return invoices.filter(
      (v) =>
        (v.status === 'ISSUED' || v.status === 'PARTIALLY_PAID') &&
        v.dueDate && new Date(v.dueDate).getTime() < nowMs,
    )
  }, [invoices, now])

  const pendingLeaves = useMemo(
    () => leaves.filter((l) => l.status === 'PENDING_MANAGER' || l.status === 'PENDING_HR' || l.status === 'PENDING'),
    [leaves],
  )

  const incompleteTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE'),
    [tasks],
  )

  // ---- Charts data ----
  const revenueSeries = useMemo(
    () => buildRevenueSeries(invoices, payrolls),
    [invoices, payrolls],
  )

  const topCustomers: TopCustomerRow[] = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>()
    invoices
      .filter(
        (v) =>
          v.issuedDate && new Date(v.issuedDate) >= yearStart &&
          (v.status === 'PAID' || v.status === 'PARTIALLY_PAID'),
      )
      .forEach((v) => {
        const key = v.customerId || v.customerName || 'unknown'
        const prev = map.get(key)
        const name = v.customerName || 'Khách vãng lai'
        const amt = v.paidAmount || 0
        if (prev) prev.revenue += amt
        else map.set(key, { name, revenue: amt })
      })
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [invoices, yearStart])

  const costBreakdown: CostSlice[] = useMemo(() => {
    const payroll = payrollCostThisMonth
    // Estimate ratio — nếu có BE endpoint chi tiết sẽ thay ở tương lai
    const bhxh = payroll * 0.235
    const opex = payroll * 0.4
    const other = payroll * 0.15
    return [
      { name: 'Lương', value: payroll, color: '#3b82f6' },
      { name: 'BHXH & phúc lợi', value: bhxh, color: '#8b5cf6' },
      { name: 'Vận hành', value: opex, color: '#f59e0b' },
      { name: 'Khác', value: other, color: '#94a3b8' },
    ]
  }, [payrollCostThisMonth])

  const funnel: FunnelRow[] = useMemo(() => {
    if (!stages.length) return []
    const ordered = [...stages].sort((a, b) => a.orderNo - b.orderNo)
    return ordered.map((s) => {
      const inStage = openDeals.filter((d) => d.stageId === s.id)
      return {
        name: s.name,
        count: inStage.length,
        amount: inStage.reduce((sum, d) => sum + (d.amount || 0), 0),
      }
    })
  }, [stages, openDeals])

  // ---- Activity feed (merge 3 sources) ----
  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = []
    leaves.slice(0, 8).forEach((l) => {
      if (!l.createdDate) return
      items.push({
        id: `leave-${l.id}`,
        kind: 'leave',
        title: `${l.personName || 'Nhân sự'} xin nghỉ ${l.leaveType}`,
        subtitle: `${l.durationDays || 1} ngày · ${l.status}`,
        timestamp: l.createdDate,
      })
    })
    deals.slice(0, 8).forEach((d) => {
      if (!d.createdDate) return
      items.push({
        id: `deal-${d.id}`,
        kind: 'deal',
        title: `Deal ${d.title}`,
        subtitle: `${d.customerName || 'Chưa gán KH'} · ${formatCurrencyShort(d.amount)}`,
        timestamp: d.createdDate,
      })
    })
    invoices.slice(0, 8).forEach((v) => {
      const ts = v.issuedDate || undefined
      if (!ts) return
      items.push({
        id: `inv-${v.id}`,
        kind: 'invoice',
        title: `Hoá đơn ${v.code}`,
        subtitle: `${v.customerName || 'KH'} · ${formatCurrencyShort(v.total)}`,
        timestamp: ts,
      })
    })
    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }, [leaves, deals, invoices])

  // ---- Header ----
  const greeting = getGreeting()
  const week = getISOWeek(now)
  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const userLabel = user?.fullName || user?.username || 'bạn'

  const totalEmployees = summary?.totalEmployees ?? 0
  const todayAttendance = summary?.todayAttendance ?? 0
  const attendancePct = totalEmployees > 0
    ? Math.round((todayAttendance / totalEmployees) * 100)
    : 0

  const chartsLoading = invLoading || payLoading || dealsLoading

  return (
    <div className="p-6 space-y-5 animate-fade-in bg-neutral-50/50 min-h-[calc(100vh-64px)]">
      <PageHeader
        title={
          <span>
            {greeting}, <span className="text-primary-700">{userLabel}</span>{' '}
            <span className="text-primary-500">👋</span>
          </span>
        }
        description={`Hôm nay là ${dateStr[0].toUpperCase() + dateStr.slice(1)} · Tuần ${week}`}
      />

      {/* KPI grid 4x2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <KpiCard
          title="Doanh thu tháng"
          value={formatCurrency(revenueThisMonth)}
          icon={DollarSign}
          tone="emerald"
          isLoading={invLoading}
          deltaPercent={revenueDeltaPct}
          hint="Từ hoá đơn phát hành"
        />
        <KpiCard
          title="Chi phí lương tháng"
          value={formatCurrency(payrollCostThisMonth)}
          icon={Wallet}
          tone="blue"
          isLoading={payLoading}
          hint={`${payrolls.filter((p) => (p.month ?? p.periodMonth) === now.getMonth() + 1).length} bảng lương`}
        />
        <KpiCard
          title="Deal đang mở"
          value={String(openDeals.length)}
          icon={ShoppingBag}
          tone="violet"
          isLoading={dealsLoading}
          hint={formatCurrency(openDealsValue)}
        />
        <KpiCard
          title="HĐ quá hạn"
          value={String(overdueInvoices.length)}
          icon={AlertTriangle}
          tone={overdueInvoices.length > 0 ? 'rose' : 'teal'}
          isLoading={invLoading}
          hint={overdueInvoices.length ? 'Cần thu hồi công nợ' : 'Trong hạn'}
        />
        <KpiCard
          title="Nhân sự hoạt động"
          value={String(totalEmployees)}
          icon={Users}
          tone="indigo"
          isLoading={sumLoading}
          hint={summary?.newEmployees ? `+${summary.newEmployees} mới trong tháng` : undefined}
        />
        <KpiCard
          title="Chấm công hôm nay"
          value={`${attendancePct}%`}
          icon={UserCheck}
          tone="teal"
          isLoading={sumLoading}
          hint={`${todayAttendance}/${totalEmployees} người`}
        />
        <KpiCard
          title="Đơn nghỉ chờ duyệt"
          value={String(pendingLeaves.length)}
          icon={CalendarClock}
          tone="amber"
          isLoading={leaveLoading}
          hint={pendingLeaves.length ? 'Cần bạn xử lý' : 'Không có đơn tồn'}
        />
        <KpiCard
          title="Task chưa xong"
          value={String(incompleteTasks.length)}
          icon={CheckSquare}
          tone="orange"
          isLoading={taskLoading}
          hint={`Trong ${tasks.length} task`}
        />
      </div>

      {/* Charts row 1: Revenue (2/3) + Top customers (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueSeries} isLoading={chartsLoading} />
        </div>
        <TopCustomersChart data={topCustomers} isLoading={invLoading} />
      </div>

      {/* Charts row 2: Cost donut + Funnel + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CostBreakdown data={costBreakdown} isLoading={payLoading} />
        <PipelineFunnel data={funnel} isLoading={dealsLoading} />
        <ActivityFeed
          items={feed}
          isLoading={leaveLoading || dealsLoading || invLoading}
        />
      </div>

      {/* Quick actions */}
      <QuickActions />
    </div>
  )
}
