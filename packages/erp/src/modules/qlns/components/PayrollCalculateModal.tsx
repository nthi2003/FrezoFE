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
  Calculator, Loader2, CheckCircle2, AlertTriangle, Wallet,
  ArrowRight, X, Clock, FileText, Download, ChevronDown, ChevronUp, Info,
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

  // Title động theo stage — calm, không “Hoàn tất” khi chưa tạo bảng
  const title = useMemo(() => {
    if (stage === 'loading') return isSinglePerson ? 'Đang tính lương…' : `Đang tính lương kỳ ${periodLabel}…`
    if (stage === 'result') {
      const created = summary?.createdCount ?? 0
      const updated = summary?.updatedCount ?? 0
      const skipped = summary?.skippedCount ?? 0
      const errors = summary?.errorCount ?? 0
      if (!isSinglePerson && created + updated === 0 && (skipped > 0 || errors > 0)) {
        return 'Kết quả tính lương'
      }
      if ((skipped > 0 || errors > 0) && !isSinglePerson) {
        return 'Kết quả tính lương'
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
    return 'Thiếu hợp đồng đang hiệu lực'
  }
  return reason
}

/** Tài khoản hệ thống — không nên hiện như NV lương (BE chưa lọc). */
function isSystemPayrollPerson(it: CalculateSkippedItem): boolean {
  const code = (it.personCode || '').trim().toUpperCase().replace(/\s+/g, '')
  const name = (it.personName || '').trim().toUpperCase().replace(/\s+/g, '')
  const SYSTEM = new Set(['ADMIN', 'SUPERADMIN', 'SUPERADMINISTRATOR', 'SYSTEM'])
  return SYSTEM.has(code) || SYSTEM.has(name)
}

/** Warning BE/FE lặp lại skip HĐ — gộp vào section skip, không hiện wall thứ 2. */
function isContractSkipWarning(w: string): boolean {
  return /NO_ACTIVE_CONTRACT|thiếu hợp đồng|thieu hop dong|bỏ qua.*hợp đồng|hop dong|thiếu HĐ|thieu HD|Không tạo được bảng lương|Không tạo bảng lương/i.test(
    w,
  )
}

function exportSkipCsv(items: CalculateSkippedItem[], periodLabel: string) {
  const header = ['personName', 'personCode', 'personId', 'reason']
  const lines = [
    header.join(','),
    ...items.map((it) =>
      [
        `"${(it.personName || '').replace(/"/g, '""')}"`,
        `"${(it.personCode || '').replace(/"/g, '""')}"`,
        `"${(it.personId || '').replace(/"/g, '""')}"`,
        `"${formatSkipReason(it.reason).replace(/"/g, '""')}"`,
      ].join(','),
    ),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payroll-skip-${periodLabel.replace(/\s+/g, '_')}.csv`
  a.click()
  URL.revokeObjectURL(url)
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
// Stage 3 — RESULT (1 status + metrics hữu ích + 1 section skip)
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
  const [errorsOpen, setErrorsOpen] = useState(false)
  const periodLabel = `${String(period.month).padStart(2, '0')}/${period.year}`
  const created = summary.createdCount ?? 0
  const updated = summary.updatedCount ?? 0
  const skipped = summary.skippedCount ?? 0
  const errors = summary.errorCount ?? 0
  const warnings = summary.warnings ?? []
  const allItems = summary.skippedItems ?? []

  const withSkipReason = allItems.filter((it) => isSkipReason(it.reason))
  const skipItemsRaw =
    withSkipReason.length > 0 ? withSkipReason : skipped > 0 ? allItems : []

  const systemSkips = skipItemsRaw.filter(isSystemPayrollPerson)
  const realSkips = skipItemsRaw.filter((it) => !isSystemPayrollPerson(it))
  const errorItems = allItems.filter((it) => it.reason && !isSkipReason(it.reason))
  const otherWarnings = warnings.filter((w) => !isContractSkipWarning(w))

  /** Số NV skip “thật” (ẩn tài khoản hệ thống khỏi đếm UX). */
  const displaySkipped =
    skipItemsRaw.length > 0
      ? realSkips.length
      : Math.max(0, skipped - systemSkips.length)

  const sheetCreated = created + updated > 0
  const outcome: 'success' | 'partial' | 'failed' = !isSinglePerson
    ? !sheetCreated && (displaySkipped > 0 || errors > 0 || skipped > 0)
      ? 'failed'
      : displaySkipped > 0 || errors > 0
        ? 'partial'
        : 'success'
    : 'success'

  const statusCopy = (() => {
    if (isSinglePerson) {
      return {
        title: `Đã tính lương cho ${summary.personName || 'nhân viên'}`,
        detail: 'Bảng ở trạng thái Bản nháp — chốt và thanh toán ở bước sau.',
      }
    }
    if (outcome === 'failed') {
      if (displaySkipped > 0 && errors === 0) {
        return {
          title: `Chưa tạo bảng lương kỳ ${periodLabel}`,
          detail: `${displaySkipped} nhân viên thiếu hợp đồng đang hiệu lực. Kích hoạt HĐLĐ rồi tính lại.`,
        }
      }
      if (displaySkipped === 0 && errors > 0) {
        return {
          title: `Chưa tạo bảng lương kỳ ${periodLabel}`,
          detail: `${errors} nhân viên gặp lỗi khi tính. Xem chi tiết bên dưới.`,
        }
      }
      if (displaySkipped === 0 && systemSkips.length > 0 && errors === 0) {
        return {
          title: `Chưa tạo bảng lương kỳ ${periodLabel}`,
          detail: 'Không có nhân viên đủ điều kiện (có HĐ hiệu lực) trong kỳ này.',
        }
      }
      return {
        title: `Chưa tạo bảng lương kỳ ${periodLabel}`,
        detail: [
          displaySkipped > 0 ? `${displaySkipped} bỏ qua (thiếu HĐ)` : null,
          errors > 0 ? `${errors} lỗi` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Không có bảng lương mới được tạo.',
      }
    }
    if (outcome === 'partial') {
      return {
        title: `Đã tính kỳ ${periodLabel} — một phần`,
        detail: [
          `Thành công ${created}`,
          displaySkipped > 0 ? `bỏ qua ${displaySkipped}` : null,
          errors > 0 ? `lỗi ${errors}` : null,
        ]
          .filter(Boolean)
          .join(' · ') + '.',
      }
    }
    return {
      title: `Đã tính xong kỳ ${periodLabel}`,
      detail: updated > 0
        ? `Tạo mới ${created}, cập nhật ${updated}.`
        : `Tạo ${created} bảng lương Bản nháp.`,
    }
  })()

  const goContracts = () => {
    onClose()
    navigate(contractsHref)
  }

  const statusTone =
    outcome === 'failed'
      ? { box: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-700', Icon: AlertTriangle }
      : outcome === 'partial'
        ? { box: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-700', Icon: AlertTriangle }
        : { box: 'border-primary-100 bg-primary-50', icon: 'bg-primary-100 text-primary-700', Icon: CheckCircle2 }

  const StatusIcon = statusTone.Icon
  const showPayout = sheetCreated && summary.totalPayout != null && Number(summary.totalPayout) > 0
  const showSkipSection = !isSinglePerson && displaySkipped > 0

  return (
    <div className="space-y-4">
      {/* Một status duy nhất — không gradient, không lặp message */}
      <div className={`rounded-lg border ${statusTone.box} p-4`} role="status">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${statusTone.icon} flex items-center justify-center flex-shrink-0`}>
            <StatusIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-900">{statusCopy.title}</div>
            <div className="text-xs text-neutral-600 mt-1 leading-relaxed">{statusCopy.detail}</div>
          </div>
        </div>
      </div>

      {/* Metrics gọn — chỉ số có nghĩa; không “ăn mừng” Tổng chi trả khi chưa tạo bảng */}
      {!isSinglePerson && sheetCreated && (
        <div className={`grid gap-2 ${showPayout ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
          <ResultTile label="Thành công" value={String(created)} tone="primary" />
          {displaySkipped > 0 && (
            <ResultTile label="Bỏ qua" value={String(displaySkipped)} tone="amber" />
          )}
          {errors > 0 && (
            <ResultTile label="Lỗi" value={String(errors)} tone="danger" />
          )}
          {showPayout && (
            <ResultTile label="Tổng chi trả kỳ" value={formatVND(summary.totalPayout)} tone="neutral" />
          )}
        </div>
      )}

      {!isSinglePerson && !sheetCreated && (displaySkipped > 0 || errors > 0) && (
        <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
          {displaySkipped > 0 && (
            <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 tabular-nums">
              Bỏ qua <strong className="ml-1 text-amber-900">{displaySkipped}</strong>
            </span>
          )}
          {errors > 0 && (
            <span className="inline-flex items-center rounded-md border border-danger/20 bg-danger-light px-2.5 py-1 tabular-nums">
              Lỗi <strong className="ml-1 text-danger-dark">{errors}</strong>
            </span>
          )}
        </div>
      )}

      {isSinglePerson && summary.totalPayout != null && (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-700">
            <Wallet size={16} className="text-neutral-500" />
            Thực nhận
          </div>
          <span className="text-base font-semibold text-neutral-900 tabular-nums">
            {formatVND(summary.totalPayout)}
          </span>
        </div>
      )}

      {/* Một section skip + CTA — không wall “cảnh báo” lặp NO_ACTIVE_CONTRACT */}
      {showSkipSection && (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <div className="flex flex-wrap items-start gap-2 px-3 py-2.5 bg-neutral-50 border-b border-neutral-200">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
                {displaySkipped} nhân viên cần kích hoạt HĐLĐ
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Thiếu hợp đồng đang hiệu lực — tạo/kích hoạt rồi tính lại.
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {realSkips.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => exportSkipCsv(realSkips, periodLabel)}
                >
                  <Download size={13} /> CSV
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5" onClick={goContracts}>
                <FileText size={13} /> Quản lý HĐLĐ
              </Button>
            </div>
          </div>
          {realSkips.length > 0 ? (
            <div className="max-h-44 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-white text-neutral-500 sticky top-0 border-b border-neutral-100">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Nhân viên</th>
                    <th className="text-left font-medium px-3 py-2 w-28">Mã</th>
                    <th className="text-left font-medium px-3 py-2">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {realSkips.slice(0, 30).map((it, i) => (
                    <tr key={it.personId || i} className="border-t border-neutral-100">
                      <td className="px-3 py-1.5 text-neutral-800 font-medium">
                        {it.personName || it.personId || '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-neutral-500">
                        {it.personCode || '—'}
                      </td>
                      <td className="px-3 py-1.5 text-neutral-600">
                        {formatSkipReason(it.reason)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {realSkips.length > 30 && (
                <div className="px-3 py-2 text-[11px] text-neutral-500 border-t border-neutral-100">
                  … và {realSkips.length - 30} nhân viên khác
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2.5 text-xs text-neutral-500">
              BE báo {displaySkipped} NV bị bỏ qua (chi tiết chưa kèm response).
            </div>
          )}
        </div>
      )}

      {systemSkips.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-neutral-500 px-0.5">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>
            Đã ẩn {systemSkips.length} tài khoản hệ thống (ADMIN / SUPERADMIN…) khỏi danh sách tính lương.
          </span>
        </div>
      )}

      {/* Lỗi kỹ thuật — thu gọn, không cạnh tranh với skip HĐ */}
      {!isSinglePerson && errors > 0 && (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-neutral-50"
            onClick={() => setErrorsOpen((v) => !v)}
          >
            <AlertTriangle size={14} className="text-danger-dark shrink-0" />
            <span className="flex-1 text-sm font-medium text-neutral-800">
              {errors} lỗi khi tính
            </span>
            {errorsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {errorsOpen && (
            <ul className="border-t border-neutral-100 max-h-36 overflow-y-auto px-3 py-2 space-y-1.5">
              {(errorItems.length > 0 ? errorItems : []).slice(0, 20).map((it, i) => (
                <li key={it.personId || i} className="text-xs text-neutral-600">
                  <span className="font-medium text-neutral-800">
                    {it.personName || it.personCode || it.personId || '—'}
                  </span>
                  {it.reason ? ` — ${it.reason}` : ''}
                </li>
              ))}
              {errorItems.length === 0 && (
                <li className="text-xs text-neutral-500">Không có chi tiết lỗi từ BE.</li>
              )}
              {errorItems.length > 20 && (
                <li className="text-xs text-neutral-400">… và {errorItems.length - 20} dòng khác</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Warning khác (config năm…) — đã lọc trùng skip HĐ */}
      {otherWarnings.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <div className="text-xs font-medium text-neutral-700 mb-1">Lưu ý thêm</div>
          <ul className="space-y-1">
            {otherWarnings.slice(0, 5).map((w) => (
              <li key={w} className="text-xs text-neutral-600 leading-relaxed">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
        {showSkipSection && (
          <Button variant="outline" className="gap-1.5 mr-auto" onClick={goContracts}>
            <FileText size={14} /> Mở HĐLĐ
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>Đóng</Button>
        {onGotoResult && sheetCreated && (
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

function ResultTile({
  label, value, tone,
}: {
  label: string
  value: string
  tone: 'primary' | 'amber' | 'danger' | 'neutral'
}) {
  const toneMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-800 border-primary-100',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-danger-light text-danger-dark border-danger/20',
    neutral: 'bg-neutral-50 text-neutral-800 border-neutral-200',
  }
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${toneMap[tone]}`}>
      <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider truncate">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums truncate mt-0.5">{value}</div>
    </div>
  )
}

export default PayrollCalculateModal
