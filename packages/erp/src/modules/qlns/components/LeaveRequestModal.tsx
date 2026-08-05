// ============================================================
// LeaveRequestModal — Tạo đơn xin nghỉ với UX chuẩn HRIS
// ------------------------------------------------------------
// Features:
//   • Nhân viên = person gắn profile đăng nhập (read-only, không chọn tay)
//   • Auto-fetch contractId active theo person đó
//   • Chọn loại nghỉ (Annual / Sick / Unpaid / Marriage / ...)
//   • Date range picker, auto-count business days (skip Sat/Sun)
//   • Reason textarea + optional attachment URL
//   • Preview quy trình: bước từ luồng LEAVE active (/approval/flows), fallback trung tính
// ============================================================

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Info, AlertCircle, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react'
import { FormModal, FormSection, FormGrid, Select } from '@frezo/ui'
import { toast } from 'sonner'
import axiosClient from '@/lib/axios/axiosClient'
import { profileApi } from '@/modules/profile/services/profileApi'
import { useApprovalFlows } from '@/modules/approval/hooks/useApprovalFlows'
import { APPROVER_ROLE_OPTIONS, SubjectType } from '@/modules/approval/types'
import { useCreateLeaveRequest } from '../hooks/useLeave'
import { LEAVE_TYPES, type LeaveTypeCode } from '../constants/schema'

interface Props {
  open: boolean
  onClose: () => void
}

export function LeaveRequestModal({ open, onClose }: Props) {
  // Form state
  const [contractId, setContractId] = useState('')
  const [contractLoading, setContractLoading] = useState(false)
  const [leaveType, setLeaveType] = useState<LeaveTypeCode>('ANNUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  // personId từ profile đăng nhập (giống AttendancePage / TicketsPage) — không cho chọn tay
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  })
  const personId = profile?.personId || ''
  const personName = profile?.name?.trim() || ''

  const createReq = useCreateLeaveRequest()

  const { data: approvalFlows = [], isLoading: flowsLoading } = useApprovalFlows()
  const activeLeaveFlow = useMemo(
    () => approvalFlows.find((f) => f.subjectType === SubjectType.LEAVE && f.active),
    [approvalFlows],
  )
  const approvalStepLabels = useMemo(() => {
    if (!activeLeaveFlow?.steps?.length) return []
    return [...activeLeaveFlow.steps]
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s) => {
        const roleLabel = APPROVER_ROLE_OPTIONS.find((o) => o.value === s.approverRole)?.label
        return s.label?.trim() || roleLabel || s.approverRole
      })
  }, [activeLeaveFlow])

  // Reset khi modal mở
  useEffect(() => {
    if (!open) return
    setContractId('')
    setLeaveType('ANNUAL')
    setStartDate('')
    setEndDate('')
    setReason('')
    setAttachmentUrl('')
  }, [open])

  // Auto-fetch HĐ activated+ACTIVE theo person — cùng rule BE LeaveApprovalBridge
  // Lưu ý: ContractComboboxResponse.value = lương (Integer), KHÔNG phải id combobox.
  useEffect(() => {
    if (!open || !personId) {
      setContractId('')
      return
    }
    let cancelled = false
    setContractLoading(true)
    axiosClient
      .get('/qlns/contract/combobox', { params: { personId, status: 'ACTIVE' } })
      .then((res) => {
        if (cancelled) return
        const list: any[] = res.data?.data ?? res.data ?? []
        const eligible = (Array.isArray(list) ? list : []).filter((c) => {
          if (!c?.id) return false
          const pid = c.personId ?? c.person_id
          if (pid && pid !== personId) return false
          const status = String(c.status ?? c.Status ?? '').toUpperCase()
          // status có trong response → phải ACTIVE; thiếu status → tin BE combobox (đã lọc activated + status)
          if (status && status !== 'ACTIVE') return false
          if (c.activated === false || c.activated === 'false') return false
          return true
        })
        const first = eligible[0] ?? null
        setContractId(first?.id ? String(first.id) : '')
      })
      .catch(() => {
        if (!cancelled) setContractId('')
      })
      .finally(() => {
        if (!cancelled) setContractLoading(false)
      })
    return () => { cancelled = true }
  }, [open, personId])

  // ---- Computed ----
  const durationDays = useMemo(() => computeBusinessDays(startDate, endDate), [startDate, endDate])
  const calendarDays = useMemo(() => computeCalendarDays(startDate, endDate), [startDate, endDate])

  const leaveTypeMeta = LEAVE_TYPES.find((t) => t.value === leaveType)!
  const needsAttachment = leaveType === 'SICK' // gợi ý bổ sung giấy khám bệnh cho nghỉ ốm

  // ---- Validation ----
  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!profileLoading && !personId) {
      e.personId = 'Tài khoản chưa liên kết hồ sơ nhân sự'
    }
    if (personId && !contractId && !contractLoading) {
      e.contractId = 'Nhân viên chưa có hợp đồng đang hiệu lực (activated + ACTIVE)'
    }
    if (!startDate) e.startDate = 'Nhập ngày bắt đầu'
    if (!endDate) e.endDate = 'Nhập ngày kết thúc'
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      e.endDate = 'Ngày kết thúc phải >= ngày bắt đầu'
    }
    if (reason.trim().length < 5) e.reason = 'Lý do tối thiểu 5 ký tự'
    return e
  }, [profileLoading, personId, contractId, contractLoading, startDate, endDate, reason])

  const canSubmit = Object.keys(errors).length === 0 && !createReq.isPending && !profileLoading

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    createReq.mutate(
      {
        personId,
        contractId,
        leaveType,
        startDate,
        endDate,
        durationDays,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <FormModal
      isOpen={open}
      onClose={onClose}
      title="Tạo đơn nghỉ phép"
      description="Đơn sẽ đi theo luồng duyệt Nghỉ phép đang kích hoạt trên hệ thống."
      size="lg"
      onSubmit={handleSubmit}
      isSubmitting={createReq.isPending}
      submitDisabled={!canSubmit}
      submitText="Gửi đơn"
    >
      <div className="space-y-6">
        <FormSection title="Thông tin đơn" description="Nhân viên lấy từ hồ sơ đăng nhập; loại nghỉ và thời gian bắt buộc.">
          <FormGrid cols={3}>
            <FormField label="Nhân viên *" error={errors.personId}>
              <div className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm flex items-center gap-2 text-neutral-800">
                {profileLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-neutral-500">
                    <Loader2 size={14} className="animate-spin" /> Đang tải…
                  </span>
                ) : (
                  <>
                    <UserIcon size={14} className="text-neutral-400 shrink-0" />
                    <span className="truncate font-medium">
                      {personName || (personId ? `Mã NS: ${personId}` : '— Chưa liên kết nhân sự —')}
                    </span>
                  </>
                )}
              </div>
              {contractLoading && (
                <div className="text-[11px] text-neutral-500 mt-1 inline-flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Đang tìm hợp đồng...
                </div>
              )}
              {!contractLoading && contractId && (
                <div className="text-[11px] text-emerald-600 mt-1">
                  ✓ Đã liên kết hợp đồng đang hiệu lực
                </div>
              )}
              {errors.contractId && (
                <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.contractId}
                </div>
              )}
            </FormField>

            <FormField label="Loại nghỉ *">
              <Select
                options={LEAVE_TYPES.map((t) => ({
                  value: t.value,
                  label: `${t.label} ${t.paid ? '(có lương)' : '(không lương)'}`,
                }))}
                value={leaveType}
                onChange={(v) => setLeaveType((v || 'ANNUAL') as LeaveTypeCode)}
                placeholder="Chọn loại nghỉ"
                showSearch={false}
              />
            </FormField>

            <FormField label="Số ngày (tự tính)">
              <div className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm flex items-center text-neutral-700 tabular-nums">
                {startDate && endDate && !errors.endDate
                  ? `${durationDays} ngày làm việc · ${calendarDays} ngày lịch`
                  : '—'}
              </div>
            </FormField>

            <FormField label="Từ ngày *" error={errors.startDate}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </FormField>
            <FormField label="Đến ngày *" error={errors.endDate}>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </FormField>
            <FormField label="Hình thức lương">
              <div className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm flex items-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  leaveTypeMeta.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {leaveTypeMeta.paid ? 'Có lương' : 'Không lương'}
                </span>
              </div>
            </FormField>
          </FormGrid>

          {startDate && endDate && !errors.endDate && (
            <div className="mt-4 rounded-lg bg-blue-50/60 border border-blue-100 p-3 flex items-center gap-3">
              <CalendarDays size={18} className="text-blue-600 shrink-0" />
              <div className="text-sm flex-1">
                <span className="font-semibold text-blue-900">{durationDays}</span>{' '}
                <span className="text-blue-700">ngày làm việc</span>
                <span className="text-blue-400 mx-2">·</span>
                <span className="text-blue-600 text-xs">{calendarDays} ngày lịch (đã trừ T7/CN)</span>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Lý do & đính kèm">
          <FormGrid cols={1}>
            <FormField label="Lý do *" error={errors.reason}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="VD: Về quê ăn giỗ ông bà, cần 2 ngày nghỉ..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
              />
              <div className="text-[11px] text-neutral-400 mt-1 text-right">{reason.length}/1000</div>
            </FormField>

            <FormField
              label={
                <>
                  File đính kèm{' '}
                  {needsAttachment && (
                    <span className="text-amber-600 text-[11px] font-normal">
                      (gợi ý: giấy khám bệnh cho nghỉ ốm)
                    </span>
                  )}
                </>
              }
            >
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="URL file đã upload (dán link Google Drive, Dropbox, ...)"
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Quy trình duyệt">
          <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 inline-flex items-center gap-1">
              <Info size={11} /> Luồng áp dụng
            </div>
            {flowsLoading ? (
              <div className="text-[11px] text-neutral-500 inline-flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" /> Đang tải quy trình...
              </div>
            ) : approvalStepLabels.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <StepPill label="Bạn gửi đơn" icon={UserIcon} tone="neutral" />
                  {approvalStepLabels.map((label, i) => (
                    <Fragment key={`${label}-${i}`}>
                      <ArrowRight size={12} className="text-neutral-400" />
                      <StepPill
                        label={label}
                        icon={UserIcon}
                        tone={i % 2 === 0 ? 'amber' : 'blue'}
                      />
                    </Fragment>
                  ))}
                  <ArrowRight size={12} className="text-neutral-400" />
                  <StepPill label="Có hiệu lực" icon={CalendarDays} tone="emerald" />
                </div>
                <div className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                  Luồng <strong>{activeLeaveFlow!.name}</strong> đang áp dụng cho đơn nghỉ mới.{' '}
                  <Link to="/approval/flows" className="text-primary-700 hover:underline font-medium">
                    Cấu hình tại Phê duyệt → Luồng duyệt
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-[11px] text-neutral-600 leading-relaxed">
                Đơn sẽ đi theo <strong>quy trình duyệt Nghỉ phép đang kích hoạt</strong> trên hệ thống.
                Người duyệt và số bước do Admin cấu hình — không cố định trên màn hình này.{' '}
                <Link to="/approval/flows" className="text-primary-700 hover:underline font-medium">
                  Xem / cấu hình luồng duyệt
                </Link>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </FormModal>
  )
}

// ============================================================
// Sub
// ============================================================

function FormField({
  label, error, children,
}: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-700 block mb-1.5">{label}</label>
      {children}
      {error && (
        <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  )
}

function StepPill({
  label, icon: Icon, tone,
}: { label: string; icon: any; tone: 'neutral' | 'amber' | 'blue' | 'emerald' }) {
  const cls = {
    neutral: 'bg-white border-neutral-300 text-neutral-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 px-2 h-6 rounded-md border text-[11px] font-medium ${cls}`}>
      <Icon size={10} />
      {label}
    </span>
  )
}

// ============================================================
// Helpers
// ============================================================

/** Đếm số ngày làm việc (bỏ T7/CN). */
function computeBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (e < s) return 0
  let count = 0
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

/** Đếm tổng số ngày lịch (bao gồm cả T7/CN). */
function computeCalendarDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (e < s) return 0
  return Math.round((e - s) / (24 * 3600 * 1000)) + 1
}
