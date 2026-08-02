// Pending counts + action items cho lobby — gate menu/permission, tái dùng hook sẵn có

import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bell, ClipboardCheck, ListChecks, CalendarClock } from 'lucide-react'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, hasMenuUnder } from '@/modules/menus/utils/menuUrls'
import { usePendingApprovalCount, useMyApprovals } from '@/modules/approval/hooks/useApprovals'
import { useNotifications, useUnreadNotificationCount } from '@/modules/common/hooks/useNotification'
import { useTasks } from '@/modules/tasks/hooks/useTask'
import { useLeaveRequests } from '@/modules/qlns/hooks/useLeave'
import { SUBJECT_TYPE_LABEL } from '@/modules/approval/types'
import { resolveNotificationUrl } from '@/modules/common/utils/resolveNotificationUrl'
import type { NotificationItem } from '@/modules/common/types'
import { isNotificationRead } from '@/modules/common/utils/notificationHelpers'
import { formatRelativeTime } from '@/lib/utils/format'

export interface LobbyPendingPill {
  key: string
  label: string
  count: number
  to: string
  icon: LucideIcon
  tone: 'info' | 'warning'
  isLoading?: boolean
}

export interface LobbyActionItem {
  id: string
  kind: 'approval' | 'notification' | 'task'
  title: string
  meta: string
  to: string
  icon: LucideIcon
  badge?: string
}

export function useLobbyPending() {
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])

  const canSeeTasks = hasMenuUnder(menuUrls, '/task')
  const canSeeLeavePending =
    useAnyPermission(['LEAVE.APPROVE', 'APPROVALS.APPROVE']) &&
    hasMenuUnder(menuUrls, '/qlns/leaves')

  const { data: notifications, isLoading: notifLoading } = useNotifications()
  const { data: unreadFromApi } = useUnreadNotificationCount()
  const { count: approvalCount, isLoading: approvalLoading } = usePendingApprovalCount()
  const { data: pendingApprovals = [], isLoading: approvalsListLoading } = useMyApprovals('pending')
  const { data: tasksRaw, isLoading: tasksLoading } = useTasks(undefined, { enabled: canSeeTasks })
  const { data: leavesRaw, isLoading: leavesLoading } = useLeaveRequests(1, 100, {
    enabled: canSeeLeavePending,
  })

  const unreadCount = useMemo(() => {
    if (typeof unreadFromApi === 'number') return unreadFromApi
    const list = Array.isArray(notifications) ? notifications : []
    return list.filter((n) => !isNotificationRead(n)).length
  }, [unreadFromApi, notifications])

  const openTasks = useMemo(() => {
    const list = (tasksRaw as { status?: string }[] | undefined) ?? []
    return list.filter((t) => t.status !== 'DONE').length
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

  const pills: LobbyPendingPill[] = useMemo(() => {
    const base: LobbyPendingPill[] = [
      {
        key: 'notifications',
        label: 'Thông báo',
        count: unreadCount,
        to: '/notifications',
        icon: Bell,
        tone: 'info',
        isLoading: notifLoading,
      },
      {
        key: 'approvals',
        label: 'Chờ duyệt',
        count: approvalCount,
        to: '/approval/inbox',
        icon: ClipboardCheck,
        tone: 'warning',
        isLoading: approvalLoading,
      },
    ]
    if (canSeeTasks) {
      base.push({
        key: 'tasks',
        label: 'Công việc',
        count: openTasks,
        to: '/task',
        icon: ListChecks,
        tone: 'info',
        isLoading: tasksLoading,
      })
    }
    if (canSeeLeavePending) {
      base.push({
        key: 'leaves',
        label: 'Đơn nghỉ',
        count: pendingLeaves,
        to: '/qlns/time?tab=leaves&status=PENDING',
        icon: CalendarClock,
        tone: 'warning',
        isLoading: leavesLoading,
      })
    }
    return base
  }, [
    unreadCount,
    approvalCount,
    openTasks,
    pendingLeaves,
    notifLoading,
    approvalLoading,
    tasksLoading,
    leavesLoading,
    canSeeTasks,
    canSeeLeavePending,
  ])

  const anyLoading = pills.some((p) => p.isLoading)
  const allClear = !anyLoading && pills.every((p) => p.count === 0)

  const actionItems: LobbyActionItem[] = useMemo(() => {
    const items: Array<LobbyActionItem & { sortAt: number }> = []

    if (!approvalsListLoading) {
      for (const row of pendingApprovals.slice(0, 5)) {
        if (row.status !== 'PENDING') continue
        const typeLabel = SUBJECT_TYPE_LABEL[row.subjectType] ?? 'Duyệt'
        items.push({
          id: `approval-${row.id}`,
          kind: 'approval',
          title: row.subjectSummary || `${typeLabel} — ${row.requestedByName || row.requestedBy}`,
          meta: formatRelativeTime(row.requestedAt),
          to: '/approval/inbox',
          icon: ClipboardCheck,
          badge: 'Chờ duyệt',
          sortAt: new Date(row.requestedAt).getTime() || 0,
        })
      }
    }

    const notifList = (Array.isArray(notifications) ? notifications : []) as NotificationItem[]
    for (const n of notifList.filter((x) => !isNotificationRead(x)).slice(0, 5)) {
      const created = n.createdDate || n.createdAt
      items.push({
        id: `notif-${n.id ?? created}`,
        kind: 'notification',
        title: n.title || n.content?.substring(0, 80) || n.message?.substring(0, 80) || 'Thông báo',
        meta: created ? formatRelativeTime(created) : '',
        to: resolveNotificationUrl(n) || '/notifications',
        icon: Bell,
        badge: 'Thông báo',
        sortAt: created ? new Date(created).getTime() : 0,
      })
    }

    if (canSeeTasks && !tasksLoading) {
      const tasks = ((tasksRaw as { id: string; title?: string; status?: string; dueDate?: string; createdDate?: string; createdAt?: string }[]) ?? [])
        .filter((t) => t.status !== 'DONE')
        .slice(0, 5)
      for (const t of tasks) {
        const created = t.createdDate || t.createdAt || t.dueDate
        items.push({
          id: `task-${t.id}`,
          kind: 'task',
          title: t.title || 'Công việc',
          meta: created ? formatRelativeTime(created) : 'Đang mở',
          to: '/task',
          icon: ListChecks,
          badge: 'Công việc',
          sortAt: created ? new Date(created).getTime() : 0,
        })
      }
    }

    return items
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 5)
      .map(({ sortAt: _s, ...rest }) => rest)
  }, [
    pendingApprovals,
    approvalsListLoading,
    notifications,
    tasksRaw,
    tasksLoading,
    canSeeTasks,
  ])

  const previewLoading =
    approvalsListLoading || notifLoading || (canSeeTasks && tasksLoading)

  return {
    pills,
    allClear,
    actionItems,
    previewLoading,
    previewError: false,
  }
}
