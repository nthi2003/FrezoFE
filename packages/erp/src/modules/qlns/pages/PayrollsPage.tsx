import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator, CheckCircle, HandCoins, PlusCircle, Plus, Eye,
  Search, X, ChevronLeft, ChevronRight, CalendarDays, FileSpreadsheet,
  RefreshCw, AlertTriangle, FileText,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  Button, AppModal, PageHeader, PageGuideButton, EmptyState, ConfirmDialog,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { usePersonsCombobox } from '../hooks/usePerson'
import {
  usePayrolls, useCalculateAllPayroll, useCalculatePersonPayroll,
  useBonusPayroll, useConfirmPayroll, usePayPayroll,
} from '../hooks/usePayroll'
import { bonusSchema, createPayrollSchema } from '../constants/schema'
import { usePostPayrollToGL } from '@/modules/accounting/hooks/useAccounting'
import { Landmark } from 'lucide-react'
import { PAYROLLS_GUIDE, PAYROLL_STATUS_CONFIG } from '../constants/payrolls.guide'
import { PayslipDrawer } from '../components/PayslipDrawer'
import {
  PayrollCalculateModal,
  type CalculateSummary,
  type CalculateSkippedItem,
} from '../components/PayrollCalculateModal'
import { PayrollApprovalBar } from '../components/PayrollApprovalBar'
import type { PayrollCalculateItemError } from '../services/payrollApi'


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

const STATUS_TABS = [
  { key: 'all',       label: 'Tất cả',        toneActive: 'bg-neutral-900 text-white border-neutral-900' },
  { key: 'DRAFT',     label: 'Bản nháp',      toneActive: 'bg-amber-500 text-white border-amber-500' },
  { key: 'CONFIRMED', label: 'Đã chốt',       toneActive: 'bg-blue-600 text-white border-blue-600' },
  { key: 'PAID',      label: 'Đã thanh toán', toneActive: 'bg-emerald-600 text-white border-emerald-600' },
] as const

// ============================================================
// Page
// ============================================================

export function PayrollsPage() {
  const navigate = useNavigate()
  const [bonusModalOpen, setBonusModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const [periodMonth, setPeriodMonth] = useState<number>(CURRENT_MONTH)
  const [periodYear, setPeriodYear] = useState<number>(CURRENT_YEAR)
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]['key']>('all')
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

    // Sample skip reason → copy CTA Contracts khi toàn skip
    if (successCount === 0 && skippedCount > 0) {
      warnings.unshift(
        'Không tạo được bảng lương — nhân viên thiếu hợp đồng đang hiệu lực (activated/ACTIVE). Kiểm tra QLNS → Hợp đồng.',
      )
    }

    const periodLabelNow = `${String(periodMonth).padStart(2, '0')}/${periodYear}`
    if (skippedCount > 0) {
      // LNK02-06: chỉ list NV skip HĐ (không nhét technical error vào banner skip)
      const skipOnly = skippedItems.filter((it) =>
        /SKIPPED|NO_ACTIVE_CONTRACT|hợp đồng|hop dong|thiếu HĐ|thieu HD/i.test(it.reason || ''),
      )
      setSkipBanner({
        periodLabel: periodLabelNow,
        skippedCount,
        items: skipOnly.length > 0 ? skipOnly : skippedItems.slice(0, skippedCount),
      })
    } else {
      setSkipBanner(null)
    }

    return {
      createdCount: successCount,
      updatedCount: 0,
      totalCount: newList.length,
      skippedCount,
      errorCount,
      totalPayout: newTotal,
      warnings,
      skippedItems,
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
          <div className="flex items-center justify-end gap-0.5">
            <IconAction title="Xem phiếu lương" tone="blue" onClick={() => setDetailId(row.id)}>
              <Eye size={14} />
            </IconAction>
            {code === 'DRAFT' && (
              <>
                <IconAction title="Thêm thưởng / phụ cấp" tone="amber" onClick={() => handleOpenBonus(row.id)}>
                  <PlusCircle size={14} />
                </IconAction>
                <IconAction title="Chốt lương" tone="blue" onClick={() => confirmPayroll.mutate(row.id)}>
                  <CheckCircle size={14} />
                </IconAction>
              </>
            )}
            {code === 'CONFIRMED' && (
              <IconAction title="Đánh dấu đã thanh toán" tone="emerald" onClick={() => payPayroll.mutate(row.id)}>
                <HandCoins size={14} />
              </IconAction>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
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
            <Button
              onClick={() => setGlConfirmOpen(true)}
              variant="outline"
              className="gap-1.5"
              disabled={postPayrollGL.isPending}
              title="Ghi bút toán tổng hợp Payroll → GL"
            >
              <Landmark size={14} />
              {postPayrollGL.isPending ? 'Đang hạch toán...' : 'Hạch toán → GL'}
            </Button>
          </>
        }
      />

      <PayrollApprovalBar month={periodMonth} year={periodYear} />

      {/* LNK-02 — banner skip thiếu HĐ sau calculate-all */}
      {skipBanner && skipBanner.skippedCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 text-sm text-amber-950">
            <div className="font-semibold">
              Kỳ {skipBanner.periodLabel}: đã bỏ qua {skipBanner.skippedCount} nhân viên thiếu HĐ đang hiệu lực
            </div>
            <div className="text-xs text-amber-800 mt-1 leading-relaxed">
              {skipBanner.items.slice(0, 5).map((it) => it.personName || it.personCode || it.personId).filter(Boolean).join(', ')}
              {skipBanner.items.length > 5 ? ` … +${skipBanner.items.length - 5}` : ''}
              {skipBanner.items.length === 0
                ? ' Vào HĐLĐ kích hoạt hợp đồng rồi bấm Tính lương lại.'
                : ' — kích hoạt HĐ rồi tính lại.'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => navigate('/qlns/contract')}
            >
              <FileText size={13} /> HĐLĐ
            </Button>
            <button
              type="button"
              className="p-1.5 rounded-md text-amber-700 hover:bg-amber-100"
              title="Đóng"
              onClick={() => setSkipBanner(null)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Period bar (gộp period picker + tổng KPI kỳ đang xem) ── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            className="w-8 h-8 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 flex items-center justify-center transition-colors"
            title="Kỳ trước"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
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
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {isLoading ? 'Đang tải…' : `${stats.total} bảng lương · Tổng chi trả ${formatVND(stats.totalPayout)}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => shiftPeriod(+1)}
            className="w-8 h-8 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 flex items-center justify-center transition-colors"
            title="Kỳ sau"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentPeriod && (
            <button
              type="button"
              onClick={goCurrent}
              className="ml-1 h-8 px-2.5 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded-md border border-primary-200"
            >
              ← Về kỳ hiện tại
            </button>
          )}

          <div className="h-6 w-px bg-neutral-200 mx-1 hidden md:block" />

          <div className="relative flex-1 min-w-[220px] md:max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm nhân viên, mã NV..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 w-full pl-8 pr-3 text-sm bg-neutral-50 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all placeholder:text-neutral-400"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center disabled:opacity-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Status chip tabs kèm số đếm ── */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-white">
          {STATUS_TABS.map((t) => {
            const active = statusTab === t.key
            const count =
              t.key === 'all'
                ? stats.total
                : t.key === 'DRAFT'
                  ? stats.draft
                  : t.key === 'CONFIRMED'
                    ? stats.confirmed
                    : stats.paid
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition ${
                  active ? t.toneActive : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
          {(searchText || statusTab !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X size={11} /> Xoá lọc
            </button>
          )}
        </div>
      </div>

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

      {/* ── Error / Empty / Table ── */}
      {!isLoading && isError ? (
        <div className="bg-white rounded-xl border border-dashed border-red-200 py-12">
          <EmptyState
            icon={FileSpreadsheet}
            title="Không tải được bảng lương"
            description={
              (error as any)?.response?.status === 401
                ? 'Phiên đăng nhập hết hạn hoặc thiếu JWT — đăng nhập lại rồi thử lại.'
                : 'Lỗi API / mạng. Không hiển thị bảng trống giả như “chưa có lương”.'
            }
            action={
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5"
              >
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                Thử lại
              </Button>
            }
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
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <AppTable
            data={filteredList}
            columns={columns as any}
            isLoading={isLoading || calculateAll.isPending}
            showSearch={false}
          />
        </div>
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
            { name: 'bonusAmount', label: 'Số tiền (VNĐ)', type: 'number', colSpan: 3 },
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

/** Period picker inline — 2 native select liền nhau, không popup rườm rà. */
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
    <div className="flex items-center gap-1">
      <select
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
        className="h-7 px-1.5 text-sm font-semibold text-neutral-900 bg-transparent border border-transparent hover:border-neutral-200 focus:border-primary-400 focus:outline-none focus:ring-0 rounded-md cursor-pointer"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <span className="text-neutral-400 text-sm">/</span>
      <select
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
        className="h-7 px-1.5 text-sm font-semibold text-neutral-900 bg-transparent border border-transparent hover:border-neutral-200 focus:border-primary-400 focus:outline-none focus:ring-0 rounded-md cursor-pointer"
      >
        {years.map((y) => (
          <option key={y.value} value={y.value}>{y.label.replace('Năm ', '')}</option>
        ))}
      </select>
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

function IconAction({
  children, onClick, title, tone,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  tone: 'blue' | 'amber' | 'emerald' | 'red'
}) {
  const toneMap = {
    blue:    'hover:text-blue-600 hover:bg-blue-50',
    amber:   'hover:text-amber-600 hover:bg-amber-50',
    emerald: 'hover:text-emerald-600 hover:bg-emerald-50',
    red:     'hover:text-red-600 hover:bg-red-50',
  }
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 text-neutral-400 rounded-md transition-colors ${toneMap[tone]}`}
    >
      {children}
    </button>
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
