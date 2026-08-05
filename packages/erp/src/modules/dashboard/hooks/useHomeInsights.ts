// ============================================================
// Nguồn số liệu cho Home: gom hook sẵn có, gate theo menu + permission
// để user thường không bắn request 403 vào CRM/HR.
// ============================================================

import { useMemo } from 'react'
import { useAnyPermission, usePermission } from '@/lib/hooks/usePermission'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, hasMenuUnder } from '@/modules/menus/utils/menuUrls'
import { usePendingApprovalCount } from '@/modules/approval/hooks/useApprovals'
import { useNotifications } from '@/modules/common/hooks/useNotification'
import { useTasks } from '@/modules/tasks/hooks/useTask'
import { useLeaveRequests } from '@/modules/qlns/hooks/useLeave'
import { useDealsByPipeline, usePipelines } from '@/modules/crm/hooks/useCrm'
import type { Deal } from '@/modules/crm/services/crmApi'
import { useDashboardSummary } from './useDashboard'

export interface SellerRow {
  username: string
  wonDeals: number
  revenue: number
}

export type HonorPeriod = 'month' | 'all'

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function dealClosedAt(d: Deal): number {
  const raw = d.closedDate || d.createdDate
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isNaN(t) ? 0 : t
}

function buildLeaderboard(deals: Deal[]): SellerRow[] {
  const byOwner = new Map<string, SellerRow>()
  for (const d of deals) {
    const username = d.ownerUsername?.trim() || 'Chưa gán'
    const row = byOwner.get(username) ?? { username, wonDeals: 0, revenue: 0 }
    row.wonDeals += 1
    row.revenue += d.amount || 0
    byOwner.set(username, row)
  }
  return [...byOwner.values()].sort(
    (a, b) => b.wonDeals - a.wonDeals || b.revenue - a.revenue,
  )
}

export function useHomeInsights() {
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])

  const leaveByPermission = useAnyPermission([
    'LEAVE.APPROVE',
    'LEAVE.VIEW',
    'QLNS_LEAVE_VIEW',
  ])

  // KPI tổng quan công ty — cùng quyền /dashboard (QTHT.DASHBOARD.VIEW | isAdmin).
  // Không dùng CRM.VIEW/menu: sale thường không được thấy headcount / pipeline totals.
  const canSeeOverview = usePermission('QTHT.DASHBOARD.VIEW')
  const canSeeCrm = canSeeOverview
  const canSeeHrSummary = canSeeOverview
  const canSeeLeaves = leaveByPermission || hasMenuUnder(menuUrls, '/qlns/leaves')
  const canSeeTasks = hasMenuUnder(menuUrls, '/task')

  const approvals = usePendingApprovalCount()
  const { data: notifications, isLoading: notifLoading } = useNotifications()
  const { data: tasksRaw, isLoading: tasksLoading } = useTasks(undefined, {
    enabled: canSeeTasks,
  })
  const { data: leavesRaw, isLoading: leavesLoading } = useLeaveRequests(1, 100, {
    enabled: canSeeLeaves,
  })

  const { data: hrSummary, isLoading: hrLoading } = useDashboardSummary({
    enabled: canSeeOverview,
  })

  const { data: pipelinesRaw } = usePipelines({ enabled: canSeeOverview })
  const pipelines = (pipelinesRaw as { id: string; isDefault?: boolean }[] | undefined) ?? []
  const defaultPipelineId = pipelines.find((p) => p.isDefault)?.id ?? pipelines[0]?.id
  const { data: dealsRaw, isLoading: dealsLoading } = useDealsByPipeline(
    canSeeOverview ? defaultPipelineId : undefined,
  )

  const unreadNotifications = useMemo(() => {
    const list = Array.isArray(notifications) ? notifications : []
    return list.filter(
      (n: { isRead?: boolean; read?: boolean }) => !(n?.isRead === true || n?.read === true),
    ).length
  }, [notifications])

  const openTasks = useMemo(() => {
    const list = (tasksRaw as { status?: string }[] | undefined) ?? []
    return list.filter((t) => t.status !== 'DONE' && t.status !== 'CLOSED' && t.status !== 'CANCELLED').length
  }, [tasksRaw])

  const pendingLeaves = useMemo(() => {
    const list = (leavesRaw as { status?: string }[] | undefined) ?? []
    return list.filter(
      (l) =>
        l.status === 'PENDING' ||
        l.status === 'PENDING_HR' ||
        l.status === 'PENDING_MANAGER',
    ).length
  }, [leavesRaw])

  const deals = useMemo(() => (dealsRaw as Deal[] | undefined) ?? [], [dealsRaw])

  const dealStats = useMemo(() => {
    const open = deals.filter((d) => d.status === 'OPEN' || d.status === 'STALLED')
    const monthStart = startOfMonth(new Date()).getTime()
    const won = deals.filter((d) => d.status === 'WON')
    const wonThisMonth = won.filter((d) => dealClosedAt(d) >= monthStart)
    return {
      openCount: open.length,
      openValue: open.reduce((s, d) => s + (d.amount || 0), 0),
      wonMonthCount: wonThisMonth.length,
      wonMonthValue: wonThisMonth.reduce((s, d) => s + (d.amount || 0), 0),
      won,
      wonThisMonth,
    }
  }, [deals])

  // Ưu tiên tháng hiện tại; BE có thể không set closedDate → fallback all-time
  // để bảng vinh danh không rỗng oan.
  const { leaderboard, honorPeriod } = useMemo(() => {
    const monthly = buildLeaderboard(dealStats.wonThisMonth)
    if (monthly.length > 0) {
      return { leaderboard: monthly, honorPeriod: 'month' as HonorPeriod }
    }
    return {
      leaderboard: buildLeaderboard(dealStats.won),
      honorPeriod: 'all' as HonorPeriod,
    }
  }, [dealStats.won, dealStats.wonThisMonth])

  const headcount = hrSummary?.totalEmployees ?? 0
  const attendanceToday = hrSummary?.todayAttendance ?? 0

  return {
    canSeeOverview,
    canSeeCrm,
    canSeeLeaves,
    canSeeTasks,
    canSeeHrSummary,
    hr: {
      headcount,
      attendanceToday,
      attendancePct:
        headcount > 0 ? Math.round((attendanceToday / headcount) * 100) : 0,
      isLoading: hrLoading,
    },
    approvals: { count: approvals.count, isLoading: approvals.isLoading },
    notifications: { unread: unreadNotifications, isLoading: notifLoading },
    tasks: { open: openTasks, isLoading: tasksLoading },
    leaves: { pending: pendingLeaves, isLoading: leavesLoading },
    deals: {
      openCount: dealStats.openCount,
      openValue: dealStats.openValue,
      wonMonthCount: dealStats.wonMonthCount,
      wonMonthValue: dealStats.wonMonthValue,
      isLoading: dealsLoading,
    },
    leaderboard,
    honorPeriod,
  }
}
