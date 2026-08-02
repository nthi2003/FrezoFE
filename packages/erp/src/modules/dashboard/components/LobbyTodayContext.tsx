// Hôm nay của bạn — lịch nhẹ: nghỉ phép + chấm công (gate menu/permission)

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, LogIn, LogOut } from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, pathAllowed } from '@/modules/menus/utils/menuUrls'
import { profileApi } from '@/modules/profile/services/profileApi'
import { useMyLeaveRequests } from '@/modules/qlns/hooks/useLeave'
import { useMyTodayAttendance } from '@/modules/qlns/hooks/useAttendance'
import { LEAVE_TYPES } from '@/modules/qlns/constants/schema'
import type { LeaveRequestItem } from '@/modules/qlns/services/leaveApi'
import axiosClient from '@/lib/axios/axiosClient'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start.slice(0, 10) && date <= end.slice(0, 10)
}

function leaveTypeLabel(code: string): string {
  return LEAVE_TYPES.find((t) => t.value === code)?.label ?? code
}

function findApprovedLeaveToday(leaves: LeaveRequestItem[]): LeaveRequestItem | null {
  const today = todayIso()
  return (
    leaves.find(
      (l) =>
        l.status === 'APPROVED' &&
        isDateInRange(today, l.startDate, l.endDate),
    ) ?? null
  )
}

function useActiveContractId(personId?: string, enabled = false) {
  return useQuery({
    queryKey: ['lobby', 'contract', personId],
    queryFn: async () => {
      const res = await axiosClient.get('/qlns/contract/combobox', {
        params: { personId, status: 'ACTIVE' },
      })
      const list: { id?: string; personId?: string; status?: string; activated?: boolean }[] =
        res.data?.data ?? res.data ?? []
      const eligible = (Array.isArray(list) ? list : []).filter((c) => {
        if (!c?.id) return false
        if (c.personId && c.personId !== personId) return false
        const status = String(c.status ?? '').toUpperCase()
        if (status && status !== 'ACTIVE') return false
        if (c.activated === false) return false
        return true
      })
      return eligible[0]?.id ? String(eligible[0].id) : null
    },
    enabled: enabled && !!personId,
    staleTime: 10 * 60 * 1000,
  })
}

export function LobbyTodayContext() {
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])

  const canSeeLeave = useAnyPermission(['LEAVE.VIEW', 'LEAVE.CREATE', 'LEAVE.APPROVE'])
  const canSeeAttendance = useAnyPermission([
    'ATTENDANCE.VIEW',
    'ATTENDANCE.UPDATE',
    'QLNS_ATTENDANCE_VIEW',
    'QLNS_ATTENDANCE_UPDATE',
  ])

  const showLeave = canSeeLeave && pathAllowed(menuUrls, '/qlns/leaves')
  const showAttendance = canSeeAttendance && pathAllowed(menuUrls, '/admin/attendance')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: showLeave || showAttendance,
  })

  const personId = profile?.personId
  const { data: contractId, isLoading: contractLoading } = useActiveContractId(
    personId,
    showLeave && !!personId,
  )

  const { data: myLeaves = [], isLoading: leavesLoading } = useMyLeaveRequests(
    showLeave && contractId ? contractId : undefined,
  )

  const { data: attendance, isLoading: attendanceLoading } = useMyTodayAttendance(
    showAttendance ? personId : undefined,
  )

  const leaveToday = useMemo(
    () => (showLeave ? findApprovedLeaveToday(myLeaves as LeaveRequestItem[]) : null),
    [myLeaves, showLeave],
  )

  const loading =
    (showLeave || showAttendance) &&
    (profileLoading ||
      (showLeave && contractLoading) ||
      (showLeave && !!contractId && leavesLoading) ||
      (showAttendance && !!personId && attendanceLoading))

  const lines: Array<{ icon: typeof CalendarDays; text: string }> = []

  if (leaveToday) {
    lines.push({
      icon: CalendarDays,
      text: `Hôm nay bạn nghỉ phép — ${leaveTypeLabel(leaveToday.leaveType)}`,
    })
  } else if (showLeave && !loading && contractId) {
    lines.push({
      icon: CalendarDays,
      text: 'Không có đơn nghỉ phép hôm nay',
    })
  }

  if (showAttendance && personId && !attendanceLoading) {
    if (!attendance) {
      lines.push({ icon: LogIn, text: 'Chưa check-in hôm nay' })
    } else if (attendance.checkOutTime) {
      lines.push({
        icon: LogOut,
        text: `Đã check-out lúc ${String(attendance.checkOutTime).substring(0, 5)}`,
      })
    } else if (attendance.checkInTime) {
      lines.push({
        icon: Clock,
        text: `Đã check-in lúc ${String(attendance.checkInTime).substring(0, 5)}`,
      })
    }
  }

  if (!showLeave && !showAttendance) return null
  if (!loading && lines.length === 0) return null

  return (
    <section aria-label="Hôm nay của bạn">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        <CalendarDays size={15} strokeWidth={1.5} className="text-neutral-400" />
        Hôm nay của bạn
      </h2>
      {loading ? (
        <div className="space-y-2 rounded-xl border border-neutral-200 bg-surface px-4 py-3">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : (
        <ul className="space-y-1.5 rounded-xl border border-neutral-200 bg-surface px-4 py-3">
          {lines.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-neutral-700">
              <Icon size={14} strokeWidth={1.5} className="shrink-0 text-neutral-400" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
