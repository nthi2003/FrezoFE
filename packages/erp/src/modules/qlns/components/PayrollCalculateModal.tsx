// ============================================================
// PayrollCalculateModal — 3-stage popup cho luồng "Tính lương kỳ"
// ============================================================
//
// Thay thế cho `window.confirm(...)` xấu + toast text ngắn của flow cũ.
// Chuẩn UI theo FE_UI_UX_STANDARD §8 (Enterprise CRUD):
//   Stage 1 — CONFIRM: cảnh báo rõ hành động (kỳ, phạm vi, ghi đè hay không)
//   Stage 2 — LOADING: spinner + progress hint (BE có thể mất 10-30s cho 100 NV)
//   Stage 3 — RESULT:  summary chi tiết (số bảng mới, tổng chi trả, breakdown)
//
// Ưu điểm so với confirm()/toast:
//   - User biết CHÍNH XÁC hệ thống đã tạo bao nhiêu bảng, tổng bao nhiêu tiền
//   - Không blocker (không cần chờ toast trôi qua)
//   - Có thể "Xem bảng lương" ngay từ modal
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator, Loader2, CheckCircle2, AlertTriangle, Users, Wallet,
  ArrowRight, X, Sparkles, Clock, FileText, Download,
} from 'lucide-react'
import { Button, AppModal } from '@frezo/ui'

type Stage = 'confirm' | 'loading' | 'result'

/** NV bị bỏ qua hoặc lỗi khi calculate-all — hiện bảng trong RESULT. */
export interface CalculateSkippedItem {
  personId?: string
  personName?: string
  personCode?: string
  reason?: string
}

export interface CalculateSummary {
  /** Số bảng lương mới tạo ra / successCount từ BE. */
  createdCount?: number
  /** Số bảng đã tồn tại + cập nhật lại. */
  updatedCount?: number
  /** Tổng số bảng lương trong kỳ sau khi tính. */
  totalCount?: number
  /** Tổng chi trả (VND) sau khi tính xong. */
  totalPayout?: number
  /** Số NV bị skip (từ BE skippedCount — thiếu HĐ activated/ACTIVE). */
  skippedCount?: number
  /** Số NV lỗi kỹ thuật (từ BE errorCount). */
  errorCount?: number
  /** Danh sách warning nếu có (từ BE warnings[]). */
  warnings?: string[]
  /** Chi tiết NV skip / lỗi (từ BE errors[] + enrich FE). */
  skippedItems?: CalculateSkippedItem[]
  /** Tên nhân viên (chỉ có khi calculate cho 1 người, không dùng khi calculate-all). */
  personName?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Kỳ đang tính — dùng cho hiển thị. */
  period: { month: number; year: number }
  /** Nếu truyền → chế độ 1 người. Không truyền → tính toàn bộ. */
  personName?: string
  /** Số nhân viên dự kiến sẽ tính (chỉ cho mode "all"). */
  expectedCount?: number
  /** Gọi khi user bấm "Bắt đầu tính". Trả về Promise<summary> để render kết quả. */
  onConfirm: () => Promise<CalculateSummary>
  /** Optional — bấm "Xem bảng lương" ở result stage sẽ đóng modal + refresh table. */
  onGotoResult?: () => void
  /** Optional — path FE quản lý HĐLĐ (CTA khi có skip thiếu HĐ). */
  contractsHref?: string
}

// ============================================================
// Helper: format VND
// ============================================================
function formatVND(n?: number | null): string {
  const v = Number(n) || 0
  return v.toLocaleString('vi-VN') + '₫'
}

// ============================================================
// Main
// ============================================================
export function PayrollCalculateModal({
  isOpen, onClose, period, personName, expectedCount, onConfirm, onGotoResult,
  contractsHref = '/qlns/contract',
}: Props) {
  const [stage, setStage] = useState<Stage>('confirm')
  const [summary, setSummary] = useState<CalculateSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const isSinglePerson = Boolean(personName)
  const periodLabel = `${String(period.month).padStart(2, '0')}/${period.year}`

  // Reset khi mở lại
  useEffect(() => {
    if (isOpen) {
      setStage('confirm')
      setSummary(null)
      setErrorMessage(null)
      setElapsedMs(0)
    }
  }, [isOpen])

  // Timer ước lượng thời gian tính — giúp user biết BE chưa treo
  useEffect(() => {
    if (stage !== 'loading') return
    const start = Date.now()
    const iv = setInterval(() => setElapsedMs(Date.now() - start), 200)
    return () => clearInterval(iv)
  }, [stage])

  const handleStart = async () => {
    setStage('loading')
    setErrorMessage(null)
    try {
      const res = await onConfirm()
      setSummary(res || {})
      setStage('result')
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Có lỗi xảy ra khi tính lương'
      setErrorMessage(msg)
      setStage('confirm')
    }
  }

  const handleClose = () => {
    if (stage === 'loading') return   // Không cho đóng khi đang tính
    onClose()
  }

  // Title động theo stage — không nói “Hoàn tất” khi toàn skip
  const title = useMemo(() => {
    if (stage === 'loading') return isSinglePerson ? 'Đang tính lương…' : `Đang tính lương kỳ ${periodLabel}…`
    if (stage === 'result') {
      const allSkipped =
        !isSinglePerson &&
        (summary?.createdCount ?? 0) === 0 &&
        (summary?.skippedCount ?? 0) > 0
      if (allSkipped) return 'Không tạo được bảng lương'
      if ((summary?.skippedCount ?? 0) > 0 || (summary?.errorCount ?? 0) > 0) {
        return 'Kết quả tính lương (có cảnh báo)'
      }
      return 'Hoàn tất tính lương'
    }
    return isSinglePerson
      ? `Tính lương cho ${personName}`
      : `Tính lương kỳ ${periodLabel}`
  }, [stage, personName, periodLabel, isSinglePerson, summary])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="2xl"
    >
      {stage === 'confirm' && (
        <ConfirmStage
          period={period}
          personName={personName}
          expectedCount={expectedCount}
          errorMessage={errorMessage}
          onClose={handleClose}
          onStart={handleStart}
        />
      )}

      {stage === 'loading' && (
        <LoadingStage
          isSinglePerson={isSinglePerson}
          expectedCount={expectedCount}
          elapsedMs={elapsedMs}
        />
      )}

      {stage === 'result' && summary && (
        <ResultStage
          summary={summary}
          period={period}
          isSinglePerson={isSinglePerson}
          contractsHref={contractsHref}
          onClose={handleClose}
          onGotoResult={onGotoResult}
        />
      )}
    </AppModal>
  )
}

function isSkipReason(reason?: string): boolean {
  if (!reason) return false
  return /SKIPPED|NO_ACTIVE_CONTRACT|hợp đồng|hop dong|thiếu HĐ|thieu HD/i.test(reason)
}

function formatSkipReason(reason?: string): string {
  if (!reason) return 'Thiếu hợp đồng đang hiệu lực'
  if (/NO_ACTIVE_CONTRACT|SKIPPED/i.test(reason) || /hợp đồng|hop dong/i.test(reason)) {
    return 'Thiếu HĐ đang hiệu lực (activated/ACTIVE)'
  }
  return reason
}

// ============================================================
// Stage 1 — CONFIRM
// ============================================================
function ConfirmStage({
  period, personName, expectedCount, errorMessage, onClose, onStart,
}: {
  period: { month: number; year: number }
  personName?: string
  expectedCount?: number
  errorMessage: string | null
  onClose: () => void
  onStart: () => void
}) {
  const isSingle = Boolean(personName)
  const periodLabel = `${String(period.month).padStart(2, '0')}/${period.year}`

  return (
    <div className="space-y-4">
      {/* Bullet points giải thích hành động */}
      <div className="rounded-lg bg-primary-50 border border-primary-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
            <Calculator size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-900">
              {isSingle
                ? `Sẽ tính lương cho ${personName} — kỳ ${periodLabel}`
                : `Sẽ tính lương toàn bộ nhân sự — kỳ ${periodLabel}`}
            </div>
            {!isSingle && expectedCount != null && expectedCount > 0 && (
              <div className="text-xs text-neutral-600 mt-1">
                Ước tính <strong>{expectedCount} nhân viên</strong> đủ điều kiện (có hợp đồng ACTIVE)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checklist các bước hệ thống sẽ làm */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Hệ thống sẽ tự động
        </div>
        <ul className="space-y-2">
          {[
            'Lấy mức lương cơ bản từ hợp đồng lao động ACTIVE',
            'Cộng công thực tế đã chấm trong kỳ (nghỉ phép, tăng ca, chuyên cần)',
            'Cộng thưởng/phụ cấp đã ghi nhận trong kỳ',
            'Khấu trừ BHXH (8%), BHYT (1.5%), BHTN (1%) và thuế TNCN theo bậc',
            'Tạo bảng lương ở trạng thái BẢN NHÁP — cần chốt & thanh toán riêng',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-neutral-700">
              <CheckCircle2 size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Warning */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            Nếu bảng lương cho kỳ này đã tồn tại, hệ thống sẽ <strong>ghi đè</strong> giá trị (chỉ với các bảng còn ở trạng thái BẢN NHÁP).
            Các bảng đã CHỐT hoặc ĐÃ THANH TOÁN sẽ không bị ảnh hưởng.
          </div>
        </div>
      </div>

      {/* Error nếu lần trước fail */}
      {errorMessage && (
        <div className="rounded-lg bg-danger-light border border-danger/20 p-3">
          <div className="flex items-start gap-2.5">
            <X size={16} className="text-danger-dark flex-shrink-0 mt-0.5" />
            <div className="text-xs text-danger-dark leading-relaxed">
              <div className="font-semibold mb-0.5">Không tính được</div>
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button
          onClick={onStart}
          className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
        >
          <Calculator size={14} /> Bắt đầu tính
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// Stage 2 — LOADING
// ============================================================
function LoadingStage({
  isSinglePerson, expectedCount, elapsedMs,
}: {
  isSinglePerson: boolean
  expectedCount?: number
  elapsedMs: number
}) {
  // Ước lượng thời gian: single ~2s, all mode ~0.3s/NV (dùng cho progress hint)
  const estimateTotalMs = isSinglePerson ? 2000 : Math.max(3000, (expectedCount || 20) * 300)
  const rawPct = Math.min(95, (elapsedMs / estimateTotalMs) * 100)
  const seconds = (elapsedMs / 1000).toFixed(1)

  return (
    <div className="py-6 space-y-5">
      {/* Spinner + status */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <Calculator size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-700" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-900">
            {isSinglePerson ? 'Đang tính bảng lương…' : `Đang xử lý ${expectedCount || '—'} nhân viên…`}
          </div>
          <div className="text-xs text-neutral-500 mt-1 inline-flex items-center gap-1">
            <Clock size={14} /> Đã chạy {seconds}s
          </div>
        </div>
      </div>

      {/* Progress bar (ước lượng — không real-time từ BE) */}
      <div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${rawPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-neutral-400 text-center">
          Ước tính — vui lòng không đóng tab
        </div>
      </div>

      {/* Bullet — cho user biết đang làm gì */}
      <div className="space-y-1.5 max-w-md mx-auto">
        {[
          'Đọc hợp đồng lao động ACTIVE',
          'Tổng hợp công + phụ cấp trong kỳ',
          'Tính BHXH / BHYT / BHTN / thuế TNCN',
          'Ghi bảng lương ở trạng thái BẢN NHÁP',
        ].map((line, i) => {
          const passed = rawPct > (i + 1) * 20
          return (
            <div key={line} className="flex items-center gap-2 text-xs">
              {passed ? (
                <CheckCircle2 size={14} className="text-primary-600 flex-shrink-0" />
              ) : (
                <Loader2 size={14} className="text-neutral-400 flex-shrink-0 animate-spin" />
              )}
              <span className={passed ? 'text-neutral-700' : 'text-neutral-400'}>{line}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Stage 3 — RESULT
// ============================================================
function ResultStage({
  summary, period, isSinglePerson, contractsHref, onClose, onGotoResult,
}: {
  summary: CalculateSummary
  period: { month: number; year: number }
  isSinglePerson: boolean
  contractsHref: string
  onClose: () => void
  onGotoResult?: () => void
}) {
  const navigate = useNavigate()
  const periodLabel = `${String(period.month).padStart(2, '0')}/${period.year}`
  const created = summary.createdCount ?? 0
  const updated = summary.updatedCount ?? 0
  const total = summary.totalCount ?? (created + updated) ?? 1
  const skipped = summary.skippedCount ?? 0
  const errors = summary.errorCount ?? 0
  const warnings = summary.warnings ?? []
  const skipItems = (summary.skippedItems ?? []).filter(
    (it) => isSkipReason(it.reason) || skipped > 0,
  )
  // Ưu tiên item có reason skip; nếu BE chưa gắn prefix thì lấy toàn bộ skippedItems
  const displaySkips =
    skipItems.length > 0
      ? skipItems.filter((it) => isSkipReason(it.reason)).length > 0
        ? skipItems.filter((it) => isSkipReason(it.reason))
        : skipItems
      : []
  const allSkipped = !isSinglePerson && created === 0 && skipped > 0
  const hasWarn = allSkipped || skipped > 0 || errors > 0
  const heroTone = hasWarn
    ? 'from-amber-50 to-orange-50 border-amber-200'
    : 'from-primary-50 to-emerald-50 border-primary-100'
  const heroIconTone = hasWarn ? 'bg-amber-600' : 'bg-primary-600'

  const goContracts = () => {
    onClose()
    navigate(contractsHref)
  }

  return (
    <div className="space-y-4">
      {/* Hero — success hoặc skip/error rõ ràng (không báo “đã tính xong” giả) */}
      <div className={`rounded-xl bg-gradient-to-br ${heroTone} border p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full ${heroIconTone} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
            {hasWarn ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-neutral-900">
              {isSinglePerson
                ? `Đã tính lương cho ${summary.personName || 'nhân viên'}`
                : allSkipped
                  ? `Không tạo bảng lương kỳ ${periodLabel}`
                  : skipped > 0
                    ? `Đã tính kỳ ${periodLabel} — có ${skipped} NV bị bỏ qua`
                    : `Đã tính xong bảng lương kỳ ${periodLabel}`}
            </div>
            <div className="text-sm text-neutral-600 mt-1">
              {isSinglePerson ? (
                <>Bảng lương đã tạo ở trạng thái <strong>BẢN NHÁP</strong> — cần chốt & thanh toán riêng.</>
              ) : allSkipped ? (
                <>Đã bỏ qua <strong>{skipped}</strong> nhân viên vì thiếu hợp đồng đang hiệu lực. Kích hoạt HĐLĐ rồi tính lại.</>
              ) : (
                <>Thành công <strong>{created}</strong>
                  {updated > 0 ? <>, cập nhật {updated}</> : null}
                  {skipped > 0 ? <>, bỏ qua {skipped}</> : null}
                  {errors > 0 ? <>, lỗi {errors}</> : null}
                  . Kỳ này có <strong>{total}</strong> bảng trên danh sách.</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      {!isSinglePerson && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ResultTile icon={Sparkles} label="Thành công" value={String(created)} tone="primary" />
          <ResultTile icon={AlertTriangle} label="Đã bỏ qua" value={String(skipped)} tone={skipped > 0 ? 'amber' : 'neutral'} />
          <ResultTile icon={Users} label="Lỗi" value={String(errors)} tone={errors > 0 ? 'amber' : 'neutral'} />
          <ResultTile icon={Wallet} label="Tổng chi trả" value={formatVND(summary.totalPayout)} tone="emerald" />
        </div>
      )}

      {isSinglePerson && summary.totalPayout != null && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-emerald-600" />
            <span className="text-sm text-neutral-700">Thực nhận tháng này</span>
          </div>
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            {formatVND(summary.totalPayout)}
          </span>
        </div>
      )}

      {/* Bảng NV bị bỏ qua — không im lặng */}
      {!isSinglePerson && skipped > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 overflow-hidden">
          <div className="flex items-start gap-2 px-3 py-2.5 border-b border-amber-200/80">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-900">
                {skipped} nhân viên bị bỏ qua — thiếu HĐ đang hiệu lực
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Cần kích hoạt / tạo hợp đồng ACTIVE trước khi tính lại cho các NV này.
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {displaySkips.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={() => {
                    const header = ['personName', 'personCode', 'personId', 'reason']
                    const lines = [
                      header.join(','),
                      ...displaySkips.map((it) =>
                        [
                          `"${(it.personName || '').replace(/"/g, '""')}"`,
                          `"${(it.personCode || '').replace(/"/g, '""')}"`,
                          `"${(it.personId || '').replace(/"/g, '""')}"`,
                          `"${(it.reason || '').replace(/"/g, '""')}"`,
                        ].join(','),
                      ),
                    ]
                    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
                      type: 'text/csv;charset=utf-8',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `payroll-skip-${periodLabel.replace(/\s+/g, '_')}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download size={13} /> CSV
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={goContracts}
              >
                <FileText size={13} /> Quản lý HĐLĐ
              </Button>
            </div>
          </div>
          {displaySkips.length > 0 ? (
            <div className="max-h-48 overflow-y-auto bg-white/60">
              <table className="w-full text-xs">
                <thead className="bg-amber-100/60 text-amber-900 sticky top-0">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2">Nhân viên</th>
                    <th className="text-left font-semibold px-3 py-2 w-28">Mã</th>
                    <th className="text-left font-semibold px-3 py-2">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySkips.slice(0, 30).map((it, i) => (
                    <tr key={it.personId || i} className="border-t border-amber-100">
                      <td className="px-3 py-1.5 text-neutral-800 font-medium">
                        {it.personName || it.personId || '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-neutral-500">
                        {it.personCode || '—'}
                      </td>
                      <td className="px-3 py-1.5 text-amber-900">
                        {formatSkipReason(it.reason)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displaySkips.length > 30 && (
                <div className="px-3 py-2 text-[11px] text-amber-700 italic border-t border-amber-100">
                  … và {displaySkips.length - 30} nhân viên khác
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-amber-800 bg-white/40">
              BE báo {skipped} NV bị bỏ qua (chi tiết danh sách chưa kèm trong response).
            </div>
          )}
        </div>
      )}

      {/* Warnings text (config năm, v.v.) */}
      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-semibold text-amber-900">
              {warnings.length} cảnh báo cần lưu ý
            </div>
          </div>
          <ul className="space-y-1 pl-6">
            {warnings.slice(0, 5).map((w) => (
              <li key={w} className="text-xs text-amber-900 list-disc">{w}</li>
            ))}
            {warnings.length > 5 && (
              <li className="text-xs text-amber-700 italic list-none">
                ... và {warnings.length - 5} cảnh báo khác
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
        {skipped > 0 && (
          <Button variant="outline" className="gap-1.5 mr-auto" onClick={goContracts}>
            <FileText size={14} /> Mở HĐLĐ
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>Đóng</Button>
        {onGotoResult && !allSkipped && (
          <Button
            onClick={() => {
              onGotoResult()
              onClose()
            }}
            className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
          >
            Xem bảng lương <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Small helpers
// ============================================================
function ResultTile({
  icon: Icon, label, value, tone,
}: {
  icon: typeof Calculator
  label: string
  value: string
  tone: 'primary' | 'blue' | 'amber' | 'emerald' | 'neutral'
}) {
  const toneMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  }
  return (
    <div className={`rounded-lg border px-3 py-3 ${toneMap[tone]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="text-lg font-bold tabular-nums truncate">{value}</div>
    </div>
  )
}

export default PayrollCalculateModal
