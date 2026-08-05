// ============================================================
// FREZO ERP — JobEditCronModal
// Sửa lịch chạy (cron Spring 6 trường) với preset nhanh + preview mốc chạy
// kế tiếp lấy từ BE `/qtht/jobs/preview-cron` (đồng thời là bước validate).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, Loader2 } from 'lucide-react'
import { FormModal } from '@frezo/ui'
import { formatDateTime } from '@/lib/utils/format'
import { jobApi, type SystemJobDto } from '../services/jobApi'
import { cronPresets, humanizeCron, isCronShapeValid } from '../utils/cron'

const PREVIEW_COUNT = 5
const PREVIEW_DEBOUNCE_MS = 450

type PresetKey = 'hourly' | 'daily' | 'weekly' | 'monthly'

const WEEKDAY_OPTIONS = [
  { value: 'MON', label: 'Thứ Hai' },
  { value: 'TUE', label: 'Thứ Ba' },
  { value: 'WED', label: 'Thứ Tư' },
  { value: 'THU', label: 'Thứ Năm' },
  { value: 'FRI', label: 'Thứ Sáu' },
  { value: 'SAT', label: 'Thứ Bảy' },
  { value: 'SUN', label: 'Chủ Nhật' },
]

interface JobEditCronModalProps {
  job: SystemJobDto | null
  isOpen: boolean
  isSaving?: boolean
  onClose: () => void
  onSave: (cronExpression: string) => void
}

export function JobEditCronModal({
  job,
  isOpen,
  isSaving = false,
  onClose,
  onSave,
}: JobEditCronModalProps) {
  const [expression, setExpression] = useState('')
  const [preview, setPreview] = useState<string[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Preset builder state
  const [dailyTime, setDailyTime] = useState('08:00')
  const [weekday, setWeekday] = useState('MON')
  const [monthDay, setMonthDay] = useState(1)

  useEffect(() => {
    if (!isOpen) return
    setExpression(job?.cronExpression ?? '')
    setPreview([])
    setPreviewError(null)
  }, [isOpen, job?.cronExpression])

  // Debounce gọi BE — mỗi ký tự gõ dở đều là cron sai, không cần spam request.
  const latestRequest = useRef(0)
  useEffect(() => {
    if (!isOpen) return
    const expr = expression.trim()
    if (!expr) {
      setPreview([])
      setPreviewError(null)
      setIsPreviewing(false)
      return
    }
    if (!isCronShapeValid(expr)) {
      setPreview([])
      setPreviewError('Biểu thức lịch cần đủ 6 trường: giây phút giờ ngày tháng thứ.')
      setIsPreviewing(false)
      return
    }

    setIsPreviewing(true)
    const requestId = latestRequest.current + 1
    latestRequest.current = requestId

    const timer = setTimeout(() => {
      jobApi
        .previewCron(expr, PREVIEW_COUNT)
        .then((runs) => {
          if (latestRequest.current !== requestId) return
          setPreview(Array.isArray(runs) ? runs : [])
          setPreviewError(null)
        })
        .catch(() => {
          if (latestRequest.current !== requestId) return
          setPreview([])
          setPreviewError('Biểu thức lịch không hợp lệ — kiểm tra lại cú pháp.')
        })
        .finally(() => {
          if (latestRequest.current === requestId) setIsPreviewing(false)
        })
    }, PREVIEW_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [expression, isOpen])

  const applyPreset = (preset: PresetKey) => {
    const [h, m] = dailyTime.split(':').map((v) => Number(v) || 0)
    if (preset === 'hourly') setExpression(cronPresets.hourly())
    if (preset === 'daily') setExpression(cronPresets.daily(h, m))
    if (preset === 'weekly') setExpression(cronPresets.weekly(8, 0, weekday))
    if (preset === 'monthly') setExpression(cronPresets.monthly(monthDay, 0, 0))
  }

  const description = useMemo(() => {
    const expr = expression.trim()
    if (!expr) return null
    if (expr === job?.cronExpression && job?.cronDescription) return job.cronDescription
    const humanized = humanizeCron(expr)
    return humanized === expr ? null : humanized
  }, [expression, job?.cronExpression, job?.cronDescription])

  const canSave =
    !!expression.trim() &&
    !previewError &&
    !isPreviewing &&
    expression.trim() !== job?.cronExpression

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sửa lịch chạy"
      description={job ? `${job.name} · ${job.code}` : undefined}
      size="lg"
      submitText="Lưu lịch"
      isSubmitting={isSaving}
      submitDisabled={!canSave}
      onSubmit={() => onSave(expression.trim())}
    >
      <div className="space-y-5">
        {/* ── Preset nhanh ── */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Chọn nhanh
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <PresetCard
              title="Mỗi giờ"
              hint="Chạy vào đầu mỗi giờ"
              onApply={() => applyPreset('hourly')}
            />
            <PresetCard
              title="Hằng ngày"
              hint="Chạy một lần mỗi ngày"
              onApply={() => applyPreset('daily')}
              control={
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 rounded-md border border-neutral-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label="Giờ chạy hằng ngày"
                />
              }
            />
            <PresetCard
              title="Hằng tuần"
              hint="Lúc 08:00"
              onApply={() => applyPreset('weekly')}
              control={
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 rounded-md border border-neutral-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label="Thứ trong tuần"
                >
                  {WEEKDAY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              }
            />
            <PresetCard
              title="Hằng tháng"
              hint="Lúc 00:00"
              onApply={() => applyPreset('monthly')}
              control={
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={monthDay}
                  onChange={(e) =>
                    setMonthDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-16 rounded-md border border-neutral-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                  aria-label="Ngày trong tháng"
                />
              }
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            Ngày trong tháng giới hạn 1–28 để lịch không bị bỏ qua ở tháng ngắn.
          </p>
        </section>

        {/* ── Biểu thức cron ── */}
        <section className="space-y-2">
          <label
            htmlFor="job-cron-expression"
            className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
          >
            Biểu thức lịch
          </label>
          <input
            id="job-cron-expression"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            spellCheck={false}
            placeholder="0 0 12 * * *"
            aria-invalid={!!previewError}
            className={`h-10 w-full rounded-md border px-3 font-mono text-sm focus:outline-none focus:ring-2 ${
              previewError
                ? 'border-danger text-danger-dark focus:ring-danger/40'
                : 'border-neutral-200 text-neutral-900 focus:ring-primary-300'
            }`}
          />
          <p className="font-mono text-[11px] text-neutral-400">
            giây · phút · giờ · ngày · tháng · thứ
          </p>

          {previewError ? (
            <p className="flex items-start gap-1.5 text-xs text-danger-dark">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {previewError}
            </p>
          ) : description ? (
            <p className="flex items-center gap-1.5 text-xs text-neutral-600">
              <CheckCircle2 size={14} className="shrink-0 text-success" />
              {description}
            </p>
          ) : null}
        </section>

        {/* ── Preview mốc chạy kế tiếp ── */}
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <CalendarClock size={14} />
            {PREVIEW_COUNT} lần chạy kế tiếp
          </h3>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
            {isPreviewing ? (
              <p className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 size={14} className="animate-spin" />
                Đang tính lịch chạy…
              </p>
            ) : preview.length > 0 ? (
              <ol className="space-y-1.5">
                {preview.map((run, idx) => (
                  <li key={run + idx} className="flex items-center gap-2 text-xs text-neutral-700">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-500 ring-1 ring-neutral-200">
                      {idx + 1}
                    </span>
                    <span className="tabular-nums">{formatDateTime(run)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-neutral-500">
                Nhập biểu thức hợp lệ để xem trước các mốc chạy.
              </p>
            )}
          </div>
        </section>
      </div>
    </FormModal>
  )
}

function PresetCard({
  title,
  hint,
  control,
  onApply,
}: {
  title: string
  hint: string
  control?: React.ReactNode
  onApply: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="text-[11px] text-neutral-500">{hint}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {control}
        <button
          type="button"
          onClick={onApply}
          className="h-8 rounded-md border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
        >
          Áp dụng
        </button>
      </div>
    </div>
  )
}
