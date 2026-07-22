// ============================================================
// PayrollApprovalBar — lock kỳ + Approval status / duyệt
// ============================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Unlock, CheckCircle2, Loader2, Inbox } from 'lucide-react'
import { Button } from '@frezo/ui'
import {
  usePayrollPeriods,
  useCreatePayrollPeriod,
  useLockPayrollPeriod,
  useUnlockPayrollPeriod,
} from '../hooks/usePayrollPeriod'
import { ApprovalTimeline } from '@/modules/approval/components/ApprovalTimeline'
import {
  useApprovalBySubject,
  useApproveRequest,
  useMyApprovals,
} from '@/modules/approval/hooks/useApprovals'
import { SubjectType } from '@/modules/approval/types'
import { useAnyPermission, usePermission } from '@/lib/hooks/usePermission'

interface Props {
  month: number
  year: number
}

export function PayrollApprovalBar({ month, year }: Props) {
  const { data: periods = [], isLoading } = usePayrollPeriods(month, year)
  const create = useCreatePayrollPeriod()
  const lock = useLockPayrollPeriod()
  const unlock = useUnlockPayrollPeriod()
  const approve = useApproveRequest()
  const { data: myPending = [] } = useMyApprovals('pending')
  const [showTimeline, setShowTimeline] = useState(false)
  const canApprovePayroll = useAnyPermission(['PAYROLL.APPROVE', 'APPROVALS.APPROVE'])
  const canManagePeriod = usePermission('PAYROLL.APPROVE')

  const period = periods[0]
  const { data: bySubject } = useApprovalBySubject(
    SubjectType.PAYROLL,
    period?.id,
  )

  const pendingApproval = useMemo(() => {
    if (!period) return null
    if (bySubject?.status === 'PENDING') return bySubject
    return (
      myPending.find(
        (a) =>
          a.subjectType === SubjectType.PAYROLL &&
          a.subjectId === period.id &&
          a.status === 'PENDING',
      ) || null
    )
  }, [bySubject, myPending, period])

  const locked =
    !!period?.lockedAt ||
    period?.status === 1 ||
    String(period?.statusLabel || '')
      .toUpperCase()
      .includes('LOCK')

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-neutral-900">
            Approval kỳ lương {String(month).padStart(2, '0')}/{year}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {isLoading
              ? 'Đang tải…'
              : period
                ? `${period.name || period.id} · ${period.statusLabel || (locked ? 'LOCKED' : 'OPEN')}`
                : 'Chưa có kỳ — tạo rồi khoá để gửi Approval'}
            {pendingApproval && (
              <span className="text-amber-700 font-medium"> · Chờ duyệt</span>
            )}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {!period && canManagePeriod && (
            <Button
              size="sm"
              disabled={create.isPending}
              onClick={() =>
                create.mutate({
                  month,
                  year,
                  name: `Kỳ ${month}/${year}`,
                })
              }
            >
              Tạo kỳ
            </Button>
          )}
          {period && !locked && canManagePeriod && (
            <Button
              size="sm"
              className="gap-1"
              disabled={lock.isPending}
              onClick={() => lock.mutate(period.id)}
            >
              <Lock size={12} /> Khoá kỳ
            </Button>
          )}
          {period && locked && canManagePeriod && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={unlock.isPending}
              onClick={() => unlock.mutate(period.id)}
            >
              <Unlock size={12} /> Mở khoá
            </Button>
          )}
          {pendingApproval && canApprovePayroll && (
            <Button
              size="sm"
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={approve.isPending}
              onClick={() => approve.mutate({ id: pendingApproval.id })}
            >
              {approve.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Duyệt
            </Button>
          )}
          <Link to="/approval/inbox">
            <Button size="sm" variant="outline" className="gap-1">
              <Inbox size={12} /> Inbox
            </Button>
          </Link>
          {period && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTimeline((v) => !v)}
            >
              {showTimeline ? 'Ẩn timeline' : 'Timeline'}
            </Button>
          )}
        </div>
      </div>
      {showTimeline && period && (
        <ApprovalTimeline
          subjectType={SubjectType.PAYROLL}
          subjectId={period.id}
        />
      )}
    </div>
  )
}
