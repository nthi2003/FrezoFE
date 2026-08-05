import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator, CheckCircle, HandCoins, PlusCircle, Plus,
  Search, X, ChevronLeft, ChevronRight, FileSpreadsheet,
  RefreshCw, AlertTriangle, FileText, Download, Landmark, CalendarRange,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal, Button, PageHeader, PageGuideButton, EmptyState, ErrorState, ConfirmDialog, Select,
  IconActionButton, AppTooltip, RowActions,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { usePersonsCombobox } from '../hooks/usePerson'
import {
  usePayrolls, useCalculateAllPayroll, useCalculatePersonPayroll,
  useBonusPayroll, useConfirmPayroll, usePayPayroll,
} from '../hooks/usePayroll'
import { bonusSchema, createPayrollSchema } from '../constants/schema'
import { usePostPayrollToGL } from '@/modules/accounting/hooks/useAccounting'
import { PAYROLLS_GUIDE, PAYROLL_STATUS_CONFIG } from '../constants/payrolls.guide'
import { PayslipDrawer } from '../components/PayslipDrawer'
import {
  PayrollCalculateModal,
  type CalculateSummary,
  type CalculateSkippedItem,
} from '../components/PayrollCalculateModal'
import { PayrollApprovalBar } from '../components/PayrollApprovalBar'
import type { PayrollCalculateItemError } from '../services/payrollApi'
import { pageRootClass } from '../utils/pageEmbed'


// ============================================================
// Constants
// ============================================================

const now = new Date()
const CURRENT_MONTH = now.getMonth() + 1
const CURRENT_YEAR = now.getFullYear()

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}))

const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({
  value: String(y),
  label: `Năm ${y}`,
}))

function exportSkipCsv(items: CalculateSkippedItem[], periodLabel: string) {
  const header = ['personName', 'personCode', 'personId', 'reason']
  const lines = [
    header.join(','),
    ...items.map((it) =>
      [
        `"${(it.personName || '').replace(/"/g, '""')}"`,
        `"${(it.personCode || '').replace(/"/g, '""')}"`,
        `"${(it.personId || '').replace(/"/g, '""')}"`,
        `"${(it.reason || '').replace(/"/g, '""')}"`,
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

/** Tài khoản hệ thống — ẩn khỏi banner/list skip payroll (BE chưa lọc). */
function isSystemPayrollPerson(it: CalculateSkippedItem): boolean {
  const code = (it.personCode || '').trim().toUpperCase().replace(/\s+/g, '')
  const name = (it.personName || '').trim().toUpperCase().replace(/\s+/g, '')
  const SYSTEM = new Set(['ADMIN', 'SUPERADMIN', 'SUPERADMINISTRATOR', 'SYSTEM'])
  return SYSTEM.has(code) || SYSTEM.has(name)
}

const STATUS_TABS = [
  { key: 'all',       label: 'Tất cả',        toneActive: 'bg-neutral-900 text-white border-neutral-900' },
  { key: 'DRAFT',     label: 'Bản nháp',      toneActive: 'bg-amber-500 text-white border-amber-500' },
  { key: 'CONFIRMED', label: 'Đã chốt',       toneActive: 'bg-blue-600 text-white border-blue-600' },
  { key: 'PAID',      label: 'Đã thanh toán', toneActive: 'bg-emerald-600 text-white border-emerald-600' },
] as const

// ============================================================
// Page
// ============================================================

export function PayrollsPage({
  embedded,
  onOpenPeriods,
  onPeriodChange,
}: {
  embedded?: boolean
  onOpenPeriods?: () => void
  onPeriodChange?: (month: number, year: number) => void
} = {}) {
  const navigate = useNavigate()
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const [periodMonth, setPeriodMonth] = useState<number>(CURRENT_MONTH)
  const [periodYear, setPeriodYear] = useState<number>(CURRENT_YEAR)

  useEffect(() => {
    onPeriodChange?.(periodMonth, periodYear)
  }, [periodMonth, periodYear, onPeriodChange])

  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]['key']>('all')
  /** FR-UX-08: lọc list «Đã tính» vs «Bị skip» (client từ skipBanner). */
  const [calcFilter, setCalcFilter] = useState<'calculated' | 'skipped'>('calculated')
  const [searchText, setSearchText] = useState('')

  /** Banner sau calculate-all khi có NV skip thiếu HĐ — không im lặng. */
  const [skipBanner, setSkipBanner] = useState<{
    periodLabel: string
    skippedCount: number
    items: CalculateSkippedItem[]
  } | null>(null)

  const [glConfirmOpen, setGlConfirmOpen] = useState(false)

  // Popup 3-stage cho luồng tính lương — thay confirm() native + toast xấu
  const [calcModal, setCalcModal] = useState<
    | { open: false }
    | { open: true; mode: 'all' }
    | { open: true; mode: 'single'; personId: string; personName: string; month: number; year: number }
  >({ open: false })

  const { data: rawData, isLoading, isFetching, isError, error, refetch } = usePayrolls({
    month: periodMonth,
    year: periodYear,
    pageNumber: 1,
    // Lấy 500 record 1 lần — page này thao tác theo kỳ nên không cần server pagination
    pageSize: 500,
  })

  const calculateAll = useCalculateAllPayroll()
  const postPayrollGL = usePostPayrollToGL()
  const calculatePerson = useCalculatePersonPayroll()
  const bonusPayroll = useBonusPayroll()
  const confirmPayroll = useConfirmPayroll()
  const payPayroll = usePayPayroll()

  const { options: personOptions, isLoading: personsLoading } = usePersonsCombobox()

  const dataList: any[] = Array.isArray(rawData) ? rawData : []

  const filteredList = useMemo(() => {
    let list = dataList
    if (statusTab !== 'all') list = list.filter((p) => getStatusCode(p) === statusTab)
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (p) =>
          (p.personName || '').toLowerCase().includes(q) ||
          (p.personCode || '').toLowerCase().includes(q) ||
          (p.period || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, statusTab, searchText])

  const stats = useMemo(() => {
    const total = dataList.length
    const draft = dataList.filter((p) => getStatusCode(p) === 'DRAFT').length
    const confirmed = dataList.filter((p) => getStatusCode(p) === 'CONFIRMED').length
    const paid = dataList.filter((p) => getStatusCode(p) === 'PAID').length
    const totalPayout = dataList.reduce((s, p) => s + (Number(p.totalNet ?? p.netSalary) || 0), 0)
    const paidPayout = dataList
      .filter((p) => getStatusCode(p) === 'PAID')
      .reduce((s, p) => s + (Number(p.totalNet ?? p.netSalary) || 0), 0)
    return { total, draft, confirmed, paid, totalPayout, paidPayout }
  }, [dataList])

  const shiftPeriod = useCallback((delta: -1 | 1) => {
    setPeriodMonth((m) => {
      const next = m + delta
      if (next < 1) { setPeriodYear((y) => y - 1); return 12 }
      if (next > 12) { setPeriodYear((y) => y + 1); return 1 }
      return next
    })
  }, [])

  const goCurrent = () => {
    setPeriodMonth(CURRENT_MONTH)
    setPeriodYear(CURRENT_YEAR)
  }

  /**
   * Bấm "Tính lương kỳ này" → mở popup 3-stage (KHÔNG dùng confirm() native).
   * Modal sẽ tự gọi `onConfirm` khi user bấm "Bắt đầu tính".
   */
  const handleCalculateAll = () => {
    setCalcModal({ open: true, mode: 'all' })
  }

  /**
   * Bấm "Tính cho 1 nhân viên" trong form → đóng form → mở popup 3-stage.
   * Popup hiển thị tên nhân viên + kỳ, cho user xác nhận lần cuối trước khi chạy.
   */
  const handleSubmitCreate = (values: { personId: string; month: string; year: string }) => {
    const person = personOptions.find((o) => o.value === values.personId)
    if (!person) return
    setCreateModalOpen(false)
    setCalcModal({
      open: true,
      mode: 'single',
      personId: values.personId,
      personName: person.label,
      month: parseInt(values.month, 10),
      year: parseInt(values.year, 10),
    })
  }

  /**
   * Executor được truyền vào `PayrollCalculateModal` — nó tự await Promise
   * và render stage RESULT dựa trên summary trả về.
   *
   * Single mode: lấy summary từ response trực tiếp (BE trả về Payroll object).
   * All mode: map `PayrollCalculateAllResponse` từ BE (không hardcode skippedCount: 0).
   */
  const runCalculation = useCallback(async (): Promise<CalculateSummary> => {
    if (!calcModal.open) return {}

    // ---- Mode 1: Tính cho 1 người ----
    if (calcModal.mode === 'single') {
      const res = await calculatePerson.mutateAsync({
        personId: calcModal.personId,
        data: { month: calcModal.month, year: calcModal.year },
      })
      // Chuyển period sau khi tính xong → user tự thấy kết quả khi mở lại table
      setPeriodMonth(calcModal.month)
      setPeriodYear(calcModal.year)
      // BE trả về `ApiResponse<PayrollResponse>` — bóc lấy `.data` an toàn
      const payroll: any = (res as any)?.data ?? res
      return {
        personName: calcModal.personName,
        totalPayout: Number(payroll?.totalNet ?? payroll?.netSalary) || 0,
        createdCount: 1,
        totalCount: 1,
      }
    }

    // ---- Mode 2: Tính toàn bộ — dùng summary BE ----
    const res = await calculateAll.mutateAsync({ month: periodMonth, year: periodYear })
    const beSummary: any = (res as any)?.data ?? res
    const refreshed = await refetch()
    const newList: any[] = Array.isArray(refreshed.data) ? refreshed.data : []
    const newTotal = newList.reduce(
      (s, p) => s + (Number(p.totalNet ?? p.netSalary) || 0),
      0,
    )

    const successCount = Number(beSummary?.successCount) || 0
    const skippedCount = Number(beSummary?.skippedCount) || 0
    const errorCount = Number(beSummary?.errorCount) || 0
    const warnings: string[] = Array.isArray(beSummary?.warnings)
      ? [...beSummary.warnings]
      : []

    const rawErrors: PayrollCalculateItemError[] = Array.isArray(beSummary?.errors)
      ? beSummary.errors
      : []

    const personById = new Map(
      personOptions.map((o) => [o.value, o] as const),
    )
    const enrich = (e: PayrollCalculateItemError): CalculateSkippedItem => {
      const opt = e.personId ? personById.get(e.personId) : undefined
      const raw = opt?.raw as { code?: string; personCode?: string; name?: string } | undefined
      return {
        personId: e.personId,
        personName: e.personName || opt?.label || raw?.name || e.personId,
        personCode: e.personCode || raw?.code || raw?.personCode,
        reason: e.reason,
      }
    }
    const skippedItems = rawErrors.map(enrich)
      .filter((it) => !isSystemPayrollPerson(it))

    // Không unshift warning trùng NO_ACTIVE_CONTRACT — modal đã có 1 section skip.
    // Chỉ giữ warning BE không phải skip HĐ (vd. thiếu config năm).
    const filteredWarnings = warnings.filter(
      (w) =>
        !/NO_ACTIVE_CONTRACT|thiếu hợp đồng|thieu hop dong|bỏ qua.*hợp đồng|hop dong|thiếu HĐ|thieu HD|Không tạo được bảng lương/i.test(
          w,
        ),
    )

    const periodLabelNow = `${String(periodMonth).padStart(2, '0')}/${periodYear}`
    if (skippedCount > 0) {
      // LNK02-06: chỉ list NV skip HĐ (không nhét technical error vào banner skip)
      const skipOnly = skippedItems.filter((it) =>
        /SKIPPED|NO_ACTIVE_CONTRACT|hợp đồng|hop dong|thiếu HĐ|thieu HD/i.test(it.reason || ''),
      )
      const bannerItems = skipOnly.length > 0 ? skipOnly : skippedItems.slice(0, skippedCount)
      // Ẩn tài khoản hệ thống; nếu sau filter còn item → hiện banner
      if (bannerItems.length > 0) {
        setSkipBanner({
          periodLabel: periodLabelNow,
          skippedCount: bannerItems.length,
          items: bannerItems,
        })
      } else {
        setSkipBanner(null)
      }
    } else {
      setSkipBanner(null)
    }

    return {
      createdCount: successCount,
      updatedCount: 0,
      totalCount: newList.length,
      skippedCount,
      errorCount,
      // Chỉ hiện tổng chi trả khi có bảng mới — tránh “ăn mừng” số tiền kỳ cũ
      totalPayout: successCount > 0 ? newTotal : 0,
      warnings: filteredWarnings,
      skippedItems: rawErrors.map(enrich),
    }
  }, [calcModal, periodMonth, periodYear, calculateAll, calculatePerson, refetch, personOptions])

  const handleOpenBonus = (id: string) => {
    setSelectedId(id)
    setBonusModalOpen(true)
  }

  const handleSubmitBonus = (values: any) => {
    if (selectedId) {
      bonusPayroll.mutate({ id: selectedId, data: values }, { onSuccess: () => setBonusModalOpen(false) })
    }
  }

  const clearFilters = () => {
    setSearchText('')
    setStatusTab('all')
  }

  const hasActiveFilters = !!searchText.trim() || statusTab !== 'all'

  const isCurrentPeriod = periodMonth === CURRENT_MONTH && periodYear === CURRENT_YEAR
  const periodLabel = `${String(periodMonth).padStart(2, '0')}/${periodYear}`

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'personName',
      render: (val: string, row: any) => (
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">{val || '—'}</div>
          {row.personCode && (
            <div className="text-[11px] text-neutral-500 font-mono">{row.personCode}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Lương CB',
      dataIndex: 'baseSalary',
      render: (val: any) => <span className="text-neutral-700 tabular-nums text-sm">{formatVND(val)}</span>,
    },
    {
      title: 'Thưởng',
      dataIndex: 'bonusAmount',
      render: (val: any, row: any) => {
        const v = Number(val ?? row.bonus) || 0
        return v > 0 ? (
          <span className="text-emerald-600 font-medium tabular-nums text-sm">+{formatVND(v)}</span>
        ) : (
          <span className="text-neutral-300">—</span>
        )
      },
    },
    {
      title: 'Khấu trừ',
      dataIndex: 'totalDeductions',
      render: (val: any, row: any) => {
        const v = Number(val ?? row.totalDeduction) || 0
        return v > 0 ? (
          <span className="text-red-600 tabular-nums text-sm">-{formatVND(v)}</span>
        ) : (
          <span className="text-neutral-300">—</span>
        )
      },
    },
    {
      title: 'Thực nhận',
      dataIndex: 'totalNet',
      render: (val: any, row: any) => (
        <span className="font-bold text-neutral-900 tabular-nums">{formatVND(val ?? row.netSalary)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (_: any, row: any) => {
        const code = getStatusCode(row)
        const cfg = PAYROLL_STATUS_CONFIG[code as keyof typeof PAYROLL_STATUS_CONFIG]
        const cls = cfg.color === 'emerald'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : cfg.color === 'blue'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
            {cfg.label}
          </span>
        )
      },
    },
    {
      title: '',
      dataIndex: 'id',
      width: 140,
      render: (_: any, row: any) => {
        const code = getStatusCode(row)
        return (
          <RowActions
            align="end"
            actions={[
              { kind: 'view', tooltip: 'Xem phiếu lương', onClick: () => setDetailId(row.id) },
              {
                key: 'bonus',
                icon: PlusCircle,
                tooltip: 'Thêm thưởng / phụ cấp',
                tone: 'amber',
                onClick: () => handleOpenBonus(row.id),
                hidden: code !== 'DRAFT',
              },
              {
                key: 'confirm',
                icon: CheckCircle,
                tooltip: 'Chốt lương',
                tone: 'blue',
                onClick: () => confirmPayroll.mutate(row.id),
                hidden: code !== 'DRAFT',
              },
              {
                key: 'pay',
                icon: HandCoins,
                tooltip: 'Đánh dấu đã thanh toán',
                tone: 'emerald',
                onClick: () => payPayroll.mutate(row.id),
                hidden: code !== 'CONFIRMED',
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Bảng lương"
        description="Vận hành lương theo chu kỳ tháng — Tính → Chốt → Thanh toán."
        actions={
          <>
            <PageGuideButton guide={PAYROLLS_GUIDE} />
            <Button
              onClick={() => setCreateModalOpen(true)}
              variant="outline"
              className="gap-1.5"
              disabled={calculatePerson.isPending}
            >
              <Plus size={14} /> Thêm 1 bảng
            </Button>
            <Button
              onClick={handleCalculateAll}
              className="bg-primary-700 hover:bg-primary-800 text-white shadow-sm gap-1.5"
              disabled={calculateAll.isPending}
            >
              <Calculator size={14} />
              {calculateAll.isPending ? 'Đang tính...' : 'Tính lương kỳ này'}
            </Button>
            <AppTooltip content="Ghi bút toán tổng hợp Payroll → GL">
              <Button
                onClick={() => setGlConfirmOpen(true)}
                variant="outline"
                className="gap-1.5"
                disabled={postPayrollGL.isPending}
                aria-label="Hạch toán lương sang GL"
              >
                <Landmark size={14} />
                {postPayrollGL.isPending ? 'Đang hạch toán...' : 'Hạch toán → GL'}
              </Button>
            </AppTooltip>
          </>
        }
      />
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PageGuideButton guide={PAYROLLS_GUIDE} />
          {onOpenPeriods && (
            <AppTooltip content="Khóa/mở kỳ lương và duyệt Approval">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenPeriods}>
                <CalendarRange size={14} />
                Kỳ lương
              </Button>
            </AppTooltip>
          )}
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={calculatePerson.isPending}
          >
            <Plus size={14} /> Thêm 1 bảng
          </Button>
          <Button
            onClick={handleCalculateAll}
            size="sm"
            className="bg-primary-700 hover:bg-primary-800 text-white shadow-sm gap-1.5"
            disabled={calculateAll.isPending}
          >
            <Calculator size={14} />
            {calculateAll.isPending ? 'Đang tính...' : 'Tính lương kỳ này'}
          </Button>
          <AppTooltip content="Ghi bút toán tổng hợp Payroll → GL">
            <Button
              onClick={() => setGlConfirmOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={postPayrollGL.isPending}
              aria-label="Hạch toán lương sang GL"
            >
              <Landmark size={14} />
              {postPayrollGL.isPending ? 'Đang hạch toán...' : 'Hạch toán → GL'}
            </Button>
          </AppTooltip>
        </div>
      )}

      {!embedded && <PayrollApprovalBar month={periodMonth} year={periodYear} />}

      {/* LNK-02 — banner skip thiếu HĐ sau calculate-all (đã ẩn tài khoản hệ thống) */}
      {skipBanner && skipBanner.skippedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-start gap-3" role="status">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm text-amber-950">
            <div className="font-medium">
              Kỳ {skipBanner.periodLabel}: {skipBanner.skippedCount} nhân viên thiếu HĐ hiệu lực
            </div>
            <div className="text-xs text-amber-800 mt-1 leading-relaxed">
              {skipBanner.items.slice(0, 5).map((it) => it.personName || it.personCode || it.personId).filter(Boolean).join(', ')}
              {skipBanner.items.length > 5 ? ` … +${skipBanner.items.length - 5}` : ''}
              {skipBanner.items.length === 0
                ? ' — vào HĐLĐ kích hoạt rồi tính lại.'
                : ' — kích hoạt HĐ rồi tính lại.'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {skipBanner.items.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => exportSkipCsv(skipBanner.items, skipBanner.periodLabel)}
              >
                <Download size={13} /> Xuất CSV
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => setCalcFilter('skipped')}
            >
              Xem bị skip
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => navigate('/qlns/contract')}
            >
              <FileText size={13} /> HĐLĐ
            </Button>
            <IconActionButton tooltip="Đóng" tone="amber" className="text-amber-700 hover:bg-amber-100" onClick={() => setSkipBanner(null)}>
              <X size={14} />
            </IconActionButton>
          </div>
        </div>
      )}

      {/* FR-UX-08 skip panel khi filter «Bị skip» */}
      {skipBanner && calcFilter === 'skipped' && (
        <div className="rounded-xl border border-amber-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 flex flex-wrap items-center justify-between gap-2 bg-amber-50/60">
            <div className="text-sm font-semibold text-amber-950">
              NV bị bỏ qua kỳ {skipBanner.periodLabel} ({skipBanner.items.length})
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={skipBanner.items.length === 0}
                onClick={() => exportSkipCsv(skipBanner.items, skipBanner.periodLabel)}
              >
                <Download size={13} /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCalcFilter('calculated')}>
                Về list đã tính
              </Button>
            </div>
          </div>
          {skipBanner.items.length === 0 ? (
            <div className="p-4 text-sm text-neutral-500">Không có chi tiết skip từ BE.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs text-neutral-600 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Nhân viên</th>
                    <th className="text-left px-3 py-2 font-semibold">Mã</th>
                    <th className="text-left px-3 py-2 font-semibold">Lý do</th>
                    <th className="text-right px-3 py-2 font-semibold w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {skipBanner.items.map((it, i) => (
                    <tr key={it.personId || i} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 font-medium">{it.personName || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-neutral-500">{it.personCode || '—'}</td>
                      <td className="px-3 py-2 text-amber-900 text-xs">{it.reason || 'Thiếu HĐ hiệu lực'}</td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary-700"
                          onClick={() => navigate('/qlns/contract')}
                        >
                          HĐLĐ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${filteredList.length} bảng lương${hasActiveFilters ? ' (đã lọc)' : ''} · Kỳ ${periodLabel}`}
        extra={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-2 h-9"
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </Button>
        )}
      >
        <IconActionButton tooltip="Kỳ trước" className="w-9 h-9 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50" onClick={() => shiftPeriod(-1)}>
          <ChevronLeft size={16} />
        </IconActionButton>
        <PeriodInlineSelect
          months={MONTH_OPTIONS}
          years={YEAR_OPTIONS}
          month={periodMonth}
          year={periodYear}
          onChange={(m, y) => { setPeriodMonth(m); setPeriodYear(y) }}
        />
        {isCurrentPeriod && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded">
            Kỳ hiện tại
          </span>
        )}
        <IconActionButton tooltip="Kỳ sau" className="w-9 h-9 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50" onClick={() => shiftPeriod(+1)}>
          <ChevronRight size={16} />
        </IconActionButton>
        {!isCurrentPeriod && (
          <button
            type="button"
            onClick={goCurrent}
            className="h-9 px-2.5 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded-md border border-primary-200"
          >
            ← Về kỳ hiện tại
          </button>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm nhân viên, mã NV…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            aria-label="Tìm bảng lương"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {STATUS_TABS.map((t) => {
            const active = statusTab === t.key
            const count =
              t.key === 'all' ? stats.total
                : t.key === 'DRAFT' ? stats.draft
                  : t.key === 'CONFIRMED' ? stats.confirmed
                    : stats.paid
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium border transition ${
                  active ? t.toneActive : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {t.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </FilterBar>

      {/* ── KPI chi tiết (chỉ hiện khi có data hoặc đang loading) ── */}
      {(stats.total > 0 || isLoading) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            label="Bản nháp"
            value={String(stats.draft)}
            hint={stats.draft > 0 ? 'Chờ chốt & thanh toán' : 'Đã xử lý hết'}
            tone="amber"
          />
          <KpiTile
            label="Đã chốt"
            value={String(stats.confirmed)}
            hint={stats.confirmed > 0 ? 'Chờ chuyển khoản' : 'Không có tồn'}
            tone="blue"
          />
          <KpiTile
            label="Đã thanh toán"
            value={String(stats.paid)}
            hint={stats.paid > 0 ? formatVND(stats.paidPayout) + ' đã chi' : 'Chưa có'}
            tone="emerald"
          />
          <KpiTile
            label="Tổng chi trả kỳ này"
            value={formatVND(stats.totalPayout)}
            hint={`${stats.total} bảng · TB ${formatVND(stats.total ? stats.totalPayout / stats.total : 0)}/người`}
            tone="violet"
          />
        </div>
      )}

      {/* ── Error / Empty / Table (ẩn khi đang xem panel skip) ── */}
      {calcFilter === 'skipped' && skipBanner ? null : !isLoading && isError ? (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <ErrorState
            title="Không tải được bảng lương"
            message={
              (error as { response?: { status?: number } })?.response?.status === 401
                ? 'Phiên đăng nhập hết hạn hoặc thiếu JWT — đăng nhập lại rồi thử lại.'
                : (error as Error)?.message ||
                  'Lỗi API / mạng. Không hiển thị bảng trống giả như “chưa có lương”.'
            }
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && stats.total === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-neutral-300 py-12">
          <EmptyState
            icon={FileSpreadsheet}
            title={`Chưa có bảng lương kỳ ${periodLabel} — bấm Tính lương`}
            description={
              isCurrentPeriod
                ? 'Bấm "Tính lương kỳ này" để tự động tạo bảng lương cho toàn bộ nhân viên có hợp đồng đang hoạt động.'
                : 'Chuyển sang kỳ khác hoặc bấm "Tính lương kỳ này" để tạo mới cho kỳ đang xem.'
            }
            action={
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <Button
                  onClick={handleCalculateAll}
                  className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
                  disabled={calculateAll.isPending}
                >
                  <Calculator size={14} />
                  {calculateAll.isPending ? 'Đang tính…' : `Tính lương kỳ ${periodLabel}`}
                </Button>
                <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                  <Plus size={14} className="mr-1" /> Tính cho 1 nhân viên
                </Button>
              </div>
            }
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-10">
          <EmptyState
            icon={Search}
            title="Không có bảng lương khớp bộ lọc"
            description="Thử bỏ bớt điều kiện tìm kiếm hoặc chuyển sang tab trạng thái khác."
            action={<Button variant="outline" onClick={clearFilters}>Xoá bộ lọc</Button>}
          />
        </div>
      ) : (
        <AppTable
            data={filteredList}
            columns={columns as any}
            isLoading={isLoading || calculateAll.isPending}
            density="compact"
            showSearch={false}
            pageSize={10}
            pageSizeOptions={[10]}
            onRefresh={() => void refetch()}
          />
      )}

      {/* ── Modals ── */}
      <AppModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tính lương cho một nhân viên"
        description="Chọn nhân viên + kỳ lương để hệ thống tính riêng (không ảnh hưởng bảng lương chung)."
      >
        <AppForm
          schema={createPayrollSchema}
          defaultValues={{
            personId: '',
            month: String(periodMonth),
            year: String(periodYear),
          }}
          onSubmit={handleSubmitCreate}
          fields={[
            {
              name: 'personId',
              label: `Nhân viên${personOptions.length ? ` (${personOptions.length})` : ''}`,
              type: 'select',
              options: personOptions,
              placeholder: personsLoading
                ? 'Đang tải danh sách nhân viên...'
                : personOptions.length === 0
                  ? 'Chưa có nhân viên nào — hãy thêm ở QLNS → Nhân viên'
                  : '-- Chọn nhân viên --',
              colSpan: 3,
            },
            { name: 'month', label: 'Tháng', type: 'select', options: MONTH_OPTIONS },
            { name: 'year',  label: 'Năm',   type: 'select', options: YEAR_OPTIONS },
          ]}
          submitText="Tính lương"
          onCancel={() => setCreateModalOpen(false)}
          isLoading={calculatePerson.isPending}
        />
      </AppModal>

      <AppModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        title="Thêm khoản Thưởng / Phụ cấp"
        description="Chỉ áp dụng cho bảng lương DRAFT. Ghi rõ lý do để audit trail."
      >
        <AppForm
          schema={bonusSchema}
          defaultValues={{ bonusAmount: 0, reason: '' }}
          onSubmit={handleSubmitBonus}
          fields={[
            { name: 'bonusAmount', label: 'Số tiền (VNĐ)', type: 'currency', colSpan: 3 },
            { name: 'reason',      label: 'Lý do',         placeholder: 'VD: KPI Q3, sinh nhật, dự án A...', colSpan: 3 },
          ]}
          submitText="Xác nhận thêm"
          onCancel={() => setBonusModalOpen(false)}
          isLoading={bonusPayroll.isPending}
        />
      </AppModal>

      <PayslipDrawer
        isOpen={!!detailId}
        payrollId={detailId}
        onClose={() => setDetailId(null)}
        onAddBonus={(id) => {
          setDetailId(null)
          handleOpenBonus(id)
        }}
        onConfirm={(id) => confirmPayroll.mutate(id)}
        onPay={(id) => payPayroll.mutate(id)}
      />

      {/* Popup 3-stage tính lương — Confirm → Loading → Result */}
      <PayrollCalculateModal
        isOpen={calcModal.open}
        onClose={() => setCalcModal({ open: false })}
        period={
          calcModal.open && calcModal.mode === 'single'
            ? { month: calcModal.month, year: calcModal.year }
            : { month: periodMonth, year: periodYear }
        }
        personName={calcModal.open && calcModal.mode === 'single' ? calcModal.personName : undefined}
        expectedCount={
          calcModal.open && calcModal.mode === 'all' ? personOptions.length : undefined
        }
        contractsHref="/qlns/contract"
        onConfirm={runCalculation}
        onGotoResult={() => {
          // Scroll top của table sau khi user bấm "Xem bảng lương"
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <ConfirmDialog
        isOpen={glConfirmOpen}
        onClose={() => setGlConfirmOpen(false)}
        onConfirm={() => {
          postPayrollGL.mutate(
            { year: periodYear, month: periodMonth },
            { onSuccess: () => setGlConfirmOpen(false) },
          )
        }}
        title={`Hạch toán lương T${periodMonth}/${periodYear} → GL?`}
        message="Ghi bút toán tổng hợp bảng lương sang sổ cái. Bút toán idempotent — có thể chạy lại an toàn."
        confirmText="Hạch toán"
        cancelText="Huỷ"
        variant="default"
        isLoading={postPayrollGL.isPending}
      />
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

/** Period picker inline — Select chung `@frezo/ui`. */
function PeriodInlineSelect({
  months, years, month, year, onChange,
}: {
  months: { value: string; label: string }[]
  years: { value: string; label: string }[]
  month: number
  year: number
  onChange: (m: number, y: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[120px]">
        <Select
          options={months}
          value={String(month)}
          onChange={(v) => onChange(Number(v), year)}
          placeholder="Tháng"
          aria-label="Tháng kỳ lương"
          showSearch={false}
        />
      </div>
      <span className="text-neutral-400 text-sm">/</span>
      <div className="w-[100px]">
        <Select
          options={years.map((y) => ({ value: y.value, label: y.label.replace('Năm ', '') }))}
          value={String(year)}
          onChange={(v) => onChange(month, Number(v))}
          placeholder="Năm"
          aria-label="Năm kỳ lương"
          showSearch={false}
        />
      </div>
    </div>
  )
}

interface KpiTileProps {
  label: string
  value: string
  hint?: string
  tone: 'amber' | 'blue' | 'emerald' | 'violet'
}

function KpiTile({ label, value, hint, tone }: KpiTileProps) {
  const toneMap = {
    amber:   { bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50/50' },
    blue:    { bar: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50/50' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/50' },
    violet:  { bar: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50/50' },
  }[tone]
  return (
    <div className={`relative rounded-xl border border-neutral-200 bg-white p-4 overflow-hidden ${toneMap.bg}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${toneMap.bar}`} />
      <div className="pl-2">
        <div className={`text-[11px] font-bold uppercase tracking-wider ${toneMap.text}`}>{label}</div>
        <div className="text-2xl font-bold tabular-nums text-neutral-900 leading-none mt-1.5 truncate">
          {value}
        </div>
        {hint && (
          <div className="text-[11px] text-neutral-500 mt-1.5 truncate" title={hint}>{hint}</div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function formatVND(v?: number | null): string {
  if (v == null || Number.isNaN(Number(v))) return '—'
  const n = Number(v)
  // Rút gọn khi > 1 triệu để đỡ dài: 12.345.678 → "12,3M"
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + 'B₫'
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M₫'
  return n.toLocaleString('vi-VN') + '₫'
}

/**
 * Resolve payroll status → string code ('DRAFT' | 'CONFIRMED' | 'PAID').
 * BE v1.2 trả `statusCode` string; legacy trả `status` Integer (0/1/2) hoặc string.
 */
function getStatusCode(p: any): 'DRAFT' | 'CONFIRMED' | 'PAID' {
  if (!p) return 'DRAFT'
  if (typeof p.statusCode === 'string' && p.statusCode) return p.statusCode as any
  const raw = p.status
  if (typeof raw === 'string' && raw) return raw as any
  if (raw === 2) return 'PAID'
  if (raw === 1) return 'CONFIRMED'
  return 'DRAFT'
}
