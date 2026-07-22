// ============================================================
// LeaveRequestModal — Tạo đơn xin nghỉ với UX chuẩn HRIS
// ------------------------------------------------------------
// Features:
//   • Chọn nhân viên (combobox), auto-fetch contractId active
//   • Chọn loại nghỉ (Annual / Sick / Unpaid / Marriage / ...)
//   • Date range picker, auto-count business days (skip Sat/Sun)
//   • Reason textarea + optional attachment URL
//   • Live preview: "Đơn sẽ gửi tới [QL trực tiếp] → [HR]"
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Info, AlertCircle, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react'
import { AppModal, Button, Select } from '@frezo/ui'
import { toast } from 'sonner'
import axiosClient from '@/lib/axios/axiosClient'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useCreateLeaveRequest } from '../hooks/useLeave'
import { LEAVE_TYPES, type LeaveTypeCode } from '../constants/schema'

interface Props {
  open: boolean
  onClose: () => void
  /** personId mặc định — nếu current user có personId (self-service). */
  defaultPersonId?: string
}

export function LeaveRequestModal({ open, onClose, defaultPersonId }: Props) {
  // Form state
  const [personId, setPersonId] = useState(defaultPersonId || '')
  const [contractId, setContractId] = useState('')
  const [contractLoading, setContractLoading] = useState(false)
  const [leaveType, setLeaveType] = useState<LeaveTypeCode>('ANNUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')

  const { options: personOptions, isLoading: personsLoading } = usePersonsCombobox()
  const createReq = useCreateLeaveRequest()

  // Reset khi modal mở/đóng
  useEffect(() => {
    if (!open) return
    setPersonId(defaultPersonId || '')
    setContractId('')
    setLeaveType('ANNUAL')
    setStartDate('')
    setEndDate('')
    setReason('')
    setAttachmentUrl('')
  }, [open, defaultPersonId])

  // Auto-fetch active contract khi đổi person
  useEffect(() => {
    if (!personId) {
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
        // Lấy hợp đồng ACTIVE mới nhất
        const first = Array.isArray(list) && list.length > 0 ? list[0] : null
        setContractId(first?.value || first?.id || '')
      })
      .catch(() => {
        if (!cancelled) setContractId('')
      })
      .finally(() => {
        if (!cancelled) setContractLoading(false)
      })
    return () => { cancelled = true }
  }, [personId])

  // ---- Computed ----
  const durationDays = useMemo(() => computeBusinessDays(startDate, endDate), [startDate, endDate])
  const calendarDays = useMemo(() => computeCalendarDays(startDate, endDate), [startDate, endDate])

  const leaveTypeMeta = LEAVE_TYPES.find((t) => t.value === leaveType)!
  const needsAttachment = leaveType === 'SICK' // gợi ý bổ sung giấy khám bệnh cho nghỉ ốm

  // ---- Validation ----
  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!personId) e.personId = 'Chưa chọn nhân viên'
    if (!contractId && !contractLoading) e.contractId = 'Nhân viên chưa có hợp đồng đang hoạt động'
    if (!startDate) e.startDate = 'Nhập ngày bắt đầu'
    if (!endDate) e.endDate = 'Nhập ngày kết thúc'
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      e.endDate = 'Ngày kết thúc phải >= ngày bắt đầu'
    }
    if (reason.trim().length < 5) e.reason = 'Lý do tối thiểu 5 ký tự'
    return e
  }, [personId, contractId, contractLoading, startDate, endDate, reason])

  const canSubmit = Object.keys(errors).length === 0 && !createReq.isPending

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
    <AppModal isOpen={open} onClose={onClose} title="Tạo đơn xin nghỉ phép" maxWidth="2xl">
      <div className="space-y-4">
        {/* Row 1: Nhân viên + Loại nghỉ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Nhân viên *" error={errors.personId}>
            <Select
              options={personOptions}
              value={personId}
              onChange={setPersonId}
              placeholder={personsLoading ? 'Đang tải nhân viên…' : '— Chọn nhân viên —'}
              showSearch
              showClear
            />
            {contractLoading && (
              <div className="text-[11px] text-neutral-500 mt-1 inline-flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" /> Đang tìm hợp đồng...
              </div>
            )}
            {!contractLoading && contractId && (
              <div className="text-[11px] text-emerald-600 mt-1">✓ Đã liên kết hợp đồng active</div>
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
        </div>

        {/* Row 2: Date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>

        {/* Duration preview */}
        {startDate && endDate && !errors.endDate && (
          <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 flex items-center gap-3">
            <CalendarDays size={18} className="text-blue-600" />
            <div className="text-sm flex-1">
              <span className="font-semibold text-blue-900">{durationDays}</span>{' '}
              <span className="text-blue-700">ngày làm việc</span>
              <span className="text-blue-400 mx-2">·</span>
              <span className="text-blue-600 text-xs">{calendarDays} ngày lịch (đã trừ T7/CN)</span>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
              leaveTypeMeta.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {leaveTypeMeta.paid ? 'Có lương' : 'Không lương'}
            </span>
          </div>
        )}

        {/* Reason */}
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

        {/* Attachment */}
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

        {/* Workflow preview */}
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 inline-flex items-center gap-1">
            <Info size={11} /> Quy trình duyệt
          </div>
          <div className="flex items-center gap-2 text-xs">
            <StepPill label="Bạn gửi đơn" icon={UserIcon} tone="neutral" />
            <ArrowRight size={12} className="text-neutral-400" />
            <StepPill label="QL trực tiếp duyệt" icon={UserIcon} tone="amber" />
            <ArrowRight size={12} className="text-neutral-400" />
            <StepPill label="HR chốt" icon={UserIcon} tone="blue" />
            <ArrowRight size={12} className="text-neutral-400" />
            <StepPill label="Có hiệu lực" icon={CalendarDays} tone="emerald" />
          </div>
          <div className="text-[11px] text-neutral-500 mt-2">
            QL trực tiếp được xác định từ phòng ban của nhân viên. Nếu chưa gán, đơn tự chuyển thẳng cho HR.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
          <Button variant="outline" onClick={onClose} disabled={createReq.isPending}>Huỷ</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-1.5">
            {createReq.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Gửi đơn
          </Button>
        </div>
      </div>
    </AppModal>
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
