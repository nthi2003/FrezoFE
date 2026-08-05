import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertTriangle, FileText, Plus, RefreshCw, RotateCcw, Search,
  Scale, TrendingDown, TrendingUp, Send, Trash2, CalendarRange,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button, PageHeader, AppModal, ConfirmDialog, EmptyState, ErrorState,
  PageGuideButton, AppTooltip, StatusBadge, Label, Input, RowActions,
} from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  usePeriods, useJournalsByPeriod, useJournalDetail, useReverseJournal, usePostJournal,
  useCreateJournalDraft, useCreateJournalPost, useAccounts,
} from '../hooks/useAccounting'
import type {
  Account,
  FiscalPeriod,
  JournalEntry,
  JournalEntryPayload,
  JournalLine,
  JournalStatus,
  PostingSource,
} from '../services/accountingApi'
import { pageRootClass } from '../utils/pageEmbed'
import { usePermission } from '@/lib/hooks/usePermission'
import { toast } from 'sonner'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import {
  REVENUE_PIPELINE,
  revenueStepIndexForJournals,
} from '../constants/accountingWorkflow'
import { REVENUE_GUIDE } from '../constants/revenue.guide'

const STATUS_LABEL: Record<JournalStatus, string> = {
  DRAFT: 'Nháp',
  POSTED: 'Đã ghi sổ',
  REVERSED: 'Đã đảo',
}

const STATUS_COLOR: Record<JournalStatus, 'warning' | 'success' | 'neutral'> = {
  DRAFT: 'warning',
  POSTED: 'success',
  REVERSED: 'neutral',
}

const SOURCE_LABEL: Record<PostingSource, string> = {
  MANUAL: 'Nhập tay',
  PAYROLL: 'Lương',
  SALES_INVOICE: 'Hoá đơn bán',
  PURCHASE: 'Mua hàng',
  DEPRECIATION: 'Khấu hao',
  REVERSAL: 'Đảo chứng từ',
  CASH_BANK: 'Tiền / ngân hàng',
  INVENTORY: 'Kho',
}

function sourceLabel(src?: string | null) {
  if (!src) return '—'
  return SOURCE_LABEL[src as PostingSource] || src
}

interface CreateLineForm {
  accountCode: string
  debit: string
  credit: string
  description: string
}

function emptyLine(): CreateLineForm {
  return { accountCode: '', debit: '', credit: '', description: '' }
}

function periodMonthLabel(month: number) {
  return `Tháng ${month}`
}

export function JournalsPage({
  embedded,
  onOpenPeriods,
}: {
  embedded?: boolean
  onOpenPeriods?: () => void
} = {}) {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JournalStatus | 'ALL'>('ALL')
  const [sourceFilter, setSourceFilter] = useState<'' | PostingSource>('')
  const [reverseOpen, setReverseOpen] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const [postConfirmOpen, setPostConfirmOpen] = useState(false)
  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<JournalEntry | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDesc, setCreateDesc] = useState('')
  const [createDate, setCreateDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [createLines, setCreateLines] = useState<CreateLineForm[]>([emptyLine(), emptyLine()])
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: periods } = usePeriods(year)
  const periodList = useMemo(
    () => (Array.isArray(periods) ? (periods as FiscalPeriod[]) : []),
    [periods],
  )

  const selectedPeriod = useMemo(
    () => periodList.find((p) => p.id === selectedPeriodId) ?? null,
    [periodList, selectedPeriodId],
  )

  useEffect(() => {
    if (periodList.length > 0 && !selectedPeriodId) {
      const currentMonth = new Date().getMonth() + 1
      const current = periodList.find((p) => p.month === currentMonth) || periodList[0]
      setSelectedPeriodId(current.id)
    }
  }, [periodList, selectedPeriodId])

  const {
    data: entries,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useJournalsByPeriod(selectedPeriodId ?? undefined)
  const { data: detail } = useJournalDetail(detailId ?? undefined)
  const { data: accounts } = useAccounts()
  const reverse = useReverseJournal()
  const postJournal = usePostJournal()
  const createDraft = useCreateJournalDraft()
  const createAndPost = useCreateJournalPost()
  const canCreateJournal = usePermission('ACCOUNTING.JOURNALS.CREATE')
  const canUpdateJournal = usePermission('ACCOUNTING.JOURNALS.UPDATE')

  const accList = useMemo(
    () => (Array.isArray(accounts) ? (accounts as Account[]) : []),
    [accounts],
  )

  const list = useMemo(
    () => (Array.isArray(entries) ? (entries as JournalEntry[]) : []),
    [entries],
  )

  const filtered = useMemo(() => {
    let rows = list
    if (statusFilter !== 'ALL') {
      rows = rows.filter((e) => e.status === statusFilter)
    }
    if (sourceFilter) {
      rows = rows.filter((e) => e.sourceType === sourceFilter)
    }
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((e: JournalEntry) =>
      e.code.toLowerCase().includes(q)
      || (e.description || '').toLowerCase().includes(q)
      || sourceLabel(e.sourceType).toLowerCase().includes(q))
  }, [list, search, statusFilter, sourceFilter])

  const hasActiveFilters =
    !!search.trim()
    || statusFilter !== 'ALL'
    || !!sourceFilter

  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setSourceFilter('')
  }

  const kpi = useMemo(() => {
    const forTotals = filtered.filter((e) => e.status !== 'REVERSED')
    const totalDebit = forTotals.reduce((s, e) => s + Number(e.totalDebit || 0), 0)
    const totalCredit = forTotals.reduce((s, e) => s + Number(e.totalCredit || 0), 0)
    return {
      count: filtered.length,
      totalDebit,
      totalCredit,
      diff: totalDebit - totalCredit,
    }
  }, [filtered])

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (error as Error)?.message
    || 'Không tải được sổ nhật ký.'

  const revenueStepIndex = useMemo(
    () => revenueStepIndexForJournals(list),
    [list],
  )

  const monthOptions = useMemo(
    () => periodList
      .slice()
      .sort((a, b) => a.month - b.month)
      .map((p) => ({
        value: p.id,
        label: periodMonthLabel(p.month),
      })),
    [periodList],
  )

  const sourceOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả nguồn' },
      ...(Object.keys(SOURCE_LABEL) as PostingSource[]).map((k) => ({
        value: k,
        label: SOURCE_LABEL[k],
      })),
    ],
    [],
  )

  const postTarget = actionTarget ?? detail ?? null

  const openCreateModal = () => {
    setCreateDesc('')
    setCreateDate(new Date().toISOString().slice(0, 10))
    setCreateLines([emptyLine(), emptyLine()])
    setCreateError(null)
    setCreateOpen(true)
  }

  const patchCreateLine = (idx: number, patch: Partial<CreateLineForm>) => {
    setCreateLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const addCreateLine = () => setCreateLines((prev) => [...prev, emptyLine()])

  const removeCreateLine = (idx: number) => {
    setCreateLines((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)))
  }

  const buildCreatePayload = (): JournalEntryPayload | null => {
    const description = createDesc.trim()
    if (!description) {
      setCreateError('Nhập diễn giải chứng từ')
      return null
    }
    if (!createDate) {
      setCreateError('Chọn ngày ghi sổ')
      return null
    }
    const lines: JournalLine[] = []
    for (let i = 0; i < createLines.length; i++) {
      const row = createLines[i]
      const code = row.accountCode.trim()
      const debit = Number(row.debit) || 0
      const credit = Number(row.credit) || 0
      if (!code) {
        setCreateError(`Dòng ${i + 1}: nhập số hiệu tài khoản`)
        return null
      }
      if (debit <= 0 && credit <= 0) {
        setCreateError(`Dòng ${i + 1}: nhập số tiền Nợ hoặc Có`)
        return null
      }
      if (debit > 0 && credit > 0) {
        setCreateError(`Dòng ${i + 1}: chỉ nhập Nợ hoặc Có, không cả hai`)
        return null
      }
      lines.push({
        accountCode: code,
        debit,
        credit,
        description: row.description.trim() || undefined,
      })
    }
    if (lines.length < 2) {
      setCreateError('Chứng từ cần ít nhất 2 dòng bút toán')
      return null
    }
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      setCreateError(`Chưa cân: Tổng Nợ ${formatCurrency(totalDebit)} ≠ Tổng Có ${formatCurrency(totalCredit)}`)
      return null
    }
    setCreateError(null)
    return {
      postingDate: createDate,
      description,
      sourceType: 'MANUAL',
      lines,
    }
  }

  const submitCreate = (mode: 'draft' | 'post') => {
    const payload = buildCreatePayload()
    if (!payload) return
    const mutation = mode === 'draft' ? createDraft : createAndPost
    mutation.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  const onSubmitCreate = (e: FormEvent) => {
    e.preventDefault()
    submitCreate('draft')
  }

  const createTotals = useMemo(() => {
    const totalDebit = createLines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
    const totalCredit = createLines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
    return { totalDebit, totalCredit, diff: totalDebit - totalCredit }
  }, [createLines])

  const renderRowActions = (entry: JournalEntry) => (
    <RowActions
      align="end"
      actions={[
        {
          kind: 'view',
          tooltip: 'Xem chi tiết bút toán',
          onClick: () => setDetailId(entry.id),
        },
        {
          key: 'post',
          icon: Send,
          tooltip: 'Ghi sổ: chuyển nháp sang Đã ghi sổ',
          tone: 'primary',
          hidden: !canUpdateJournal || entry.status !== 'DRAFT',
          onClick: () => {
            setActionTarget(entry)
            setPostConfirmOpen(true)
          },
        },
        {
          key: 'reverse',
          icon: RotateCcw,
          tooltip: 'Đảo chứng từ: tạo bút toán đảo, cần lý do',
          tone: 'amber',
          hidden: !canUpdateJournal || entry.status !== 'POSTED',
          onClick: () => {
            setActionTarget(entry)
            setDetailId(entry.id)
            setReverseReason('')
            setReverseOpen(true)
          },
        },
      ]}
    />
  )

  const columns: AppTableColumn<JournalEntry>[] = [
    {
      key: 'code',
      title: 'Số chứng từ',
      width: 120,
      render: (_, e) => (
        <span className="font-mono font-semibold text-primary-700">{e.code}</span>
      ),
    },
    {
      key: 'postingDate',
      title: 'Ngày ghi sổ',
      width: 110,
      render: (_, e) => (
        <span className="text-neutral-600">{formatDate(e.postingDate)}</span>
      ),
    },
    {
      key: 'description',
      title: 'Diễn giải',
      render: (_, e) => (
        <span className="text-neutral-800 line-clamp-2">{e.description || '—'}</span>
      ),
    },
    {
      key: 'sourceType',
      title: 'Nguồn',
      width: 120,
      render: (_, e) => (
        <span className="text-xs text-neutral-600">{sourceLabel(e.sourceType)}</span>
      ),
    },
    {
      key: 'totalDebit',
      title: 'Tổng Nợ',
      align: 'right',
      width: 120,
      render: (_, e) => (
        <span className="font-mono tabular-nums">{formatCurrency(e.totalDebit)}</span>
      ),
    },
    {
      key: 'totalCredit',
      title: 'Tổng Có',
      align: 'right',
      width: 120,
      render: (_, e) => (
        <span className="font-mono tabular-nums">{formatCurrency(e.totalCredit)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      width: 110,
      render: (_, e) => (
        <StatusBadge
          label={STATUS_LABEL[e.status]}
          color={STATUS_COLOR[e.status]}
        />
      ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 96,
      render: (_, e) => renderRowActions(e),
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Sổ nhật ký"
        description={
          selectedPeriod
            ? `${periodMonthLabel(selectedPeriod.month)} / ${year} — xem chi tiết Nợ / Có, ghi sổ nháp hoặc đảo chứng từ.`
            : 'Danh sách chứng từ ghi sổ trong kỳ — xem chi tiết Nợ / Có, ghi sổ nháp hoặc đảo chứng từ.'
        }
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <PageGuideButton guide={REVENUE_GUIDE} />
            {canCreateJournal && (
              <Button onClick={openCreateModal} size="sm" className="gap-2 h-9">
                <Plus size={14} />
                Tạo chứng từ
              </Button>
            )}
          </div>
        )}
      />
      )}

      <StatusPipelineStepper steps={REVENUE_PIPELINE} currentIndex={revenueStepIndex} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <JournalKpi
          icon={FileText}
          label="Số chứng từ"
          value={String(kpi.count)}
          tone="blue"
          hint={hasActiveFilters ? 'Sau lọc' : 'Trong kỳ'}
        />
        <JournalKpi
          icon={TrendingUp}
          label="Tổng Nợ"
          value={formatCurrency(kpi.totalDebit)}
          tone="emerald"
          hint="Bỏ chứng từ đã đảo"
        />
        <JournalKpi
          icon={TrendingDown}
          label="Tổng Có"
          value={formatCurrency(kpi.totalCredit)}
          tone="violet"
          hint="Bỏ chứng từ đã đảo"
        />
        <JournalKpi
          icon={kpi.diff === 0 ? Scale : AlertTriangle}
          label="Chênh lệch"
          value={formatCurrency(Math.abs(kpi.diff))}
          tone={kpi.diff === 0 ? 'teal' : 'rose'}
          hint={kpi.diff === 0 ? 'Cân bằng' : 'Chưa cân — kiểm tra bút toán'}
          title="Chênh lệch = Tổng Nợ − Tổng Có (chứng từ chưa đảo). Bằng 0 nghĩa là kỳ cân."
        />
      </div>

      <FilterBar
        selects={[
          {
            id: 'year',
            label: 'Năm kế toán',
            value: String(year),
            onChange: (v) => { setYear(Number(v)); setSelectedPeriodId(null) },
            options: [year - 1, year, year + 1].map((y) => ({
              value: String(y),
              label: `Năm ${y}`,
            })),
            minWidth: '110px',
          },
          {
            id: 'month',
            label: 'Kỳ tháng',
            value: selectedPeriodId ?? '',
            onChange: (v) => setSelectedPeriodId(v || null),
            options: monthOptions,
            minWidth: '130px',
          },
          {
            id: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as JournalStatus | 'ALL'),
            options: [
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'DRAFT', label: STATUS_LABEL.DRAFT },
              { value: 'POSTED', label: STATUS_LABEL.POSTED },
              { value: 'REVERSED', label: STATUS_LABEL.REVERSED },
            ],
            minWidth: '160px',
          },
          {
            id: 'source',
            label: 'Nguồn chứng từ',
            value: sourceFilter,
            onChange: (v) => setSourceFilter(v as '' | PostingSource),
            options: sourceOptions,
            minWidth: '170px',
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${filtered.length} chứng từ${hasActiveFilters ? ' (đã lọc)' : ''}`}
        extra={(
          <>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
                placeholder="Tìm số chứng từ / diễn giải…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Tìm chứng từ"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="gap-2 h-9"
              disabled={isFetching || !selectedPeriodId}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            {onOpenPeriods && (
              <AppTooltip content="Khóa/mở kỳ kế toán">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9"
                  onClick={onOpenPeriods}
                  aria-label="Kỳ kế toán"
                >
                  <CalendarRange size={14} />
                  <span className="hidden sm:inline">Kỳ kế toán</span>
                </Button>
              </AppTooltip>
            )}
          </>
        )}
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được sổ nhật ký"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={isFilteredEmpty ? 'Không có chứng từ khớp bộ lọc' : 'Chưa có chứng từ nào trong kỳ'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái / nguồn / kỳ kế toán.'
                : 'Chọn kỳ khác, tạo chứng từ thủ công, hoặc đợi nghiệp vụ (lương / kho / CRM) ghi sổ.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreateJournal
                  ? { label: 'Tạo chứng từ', onClick: openCreateModal }
                  : { label: 'Làm mới', onClick: () => void refetch() }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal
        isOpen={!!detailId}
        onClose={() => { setDetailId(null); setActionTarget(null) }}
        title={detail ? `Chứng từ ${detail.code}` : 'Chi tiết chứng từ'}
        maxWidth="4xl"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Ngày ghi sổ" value={formatDate(detail.postingDate)} />
              <Info label="Nguồn" value={sourceLabel(detail.sourceType)} />
              <Info label="Trạng thái" value={STATUS_LABEL[detail.status]} />
              <Info label="Tổng Nợ" value={formatCurrency(detail.totalDebit)} />
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-700 mb-2">Diễn giải</div>
              <div className="p-3 bg-neutral-50 rounded-md text-sm">{detail.description}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-neutral-700 mb-2">Các dòng bút toán</div>
              {Math.abs((detail.totalDebit || 0) - (detail.totalCredit || 0)) > 0.001 && (
                <div className="mb-2 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  <AlertTriangle size={14} className="shrink-0" />
                  Chứng từ lệch cân — Tổng Nợ {formatCurrency(detail.totalDebit)} ≠ Tổng Có {formatCurrency(detail.totalCredit)}
                </div>
              )}
              <div className="border rounded-md overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1.5 h-9 w-10 text-center text-xs font-semibold">#</th>
                      <th className="px-2 py-1.5 h-9 text-left w-24 text-xs font-semibold">Tài khoản</th>
                      <th className="px-2 py-1.5 h-9 text-left text-xs font-semibold">Tên TK / Diễn giải</th>
                      <th className="px-2 py-1.5 h-9 text-right w-32 text-xs font-semibold">Nợ</th>
                      <th className="px-2 py-1.5 h-9 text-right w-32 text-xs font-semibold">Có</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detail.lines?.map((l) => (
                      <tr key={l.id ?? l.lineNo} className="hover:bg-neutral-50">
                        <td className="px-2 py-1.5 text-center text-neutral-500">{l.lineNo}</td>
                        <td className="px-2 py-1.5 font-mono text-primary-700">{l.accountCode}</td>
                        <td className="px-2 py-1.5">
                          <div className="text-neutral-900">{l.accountName || '—'}</div>
                          {l.description && <div className="text-xs text-neutral-500">{l.description}</div>}
                          {l.partnerName && (
                            <div className="text-xs text-neutral-500">Đối tượng: {l.partnerName}</div>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums">{l.debit ? formatCurrency(l.debit) : ''}</td>
                        <td className="px-2 py-1.5 text-right font-mono tabular-nums">{l.credit ? formatCurrency(l.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sticky bottom-0 mt-0 flex items-center justify-between gap-3 border border-t-0 rounded-b-md bg-surface/95 backdrop-blur px-3 py-2 text-sm">
                <span className="text-xs text-neutral-500">Tổng chứng từ</span>
                <div className="flex gap-4 tabular-nums font-semibold">
                  <span>Tổng Nợ {formatCurrency(detail.totalDebit)}</span>
                  <span>Tổng Có {formatCurrency(detail.totalCredit)}</span>
                </div>
              </div>
            </div>
            {canUpdateJournal && (
              <div className="flex justify-end gap-2">
                {detail.status === 'DRAFT' && (
                  <AppTooltip content="Ghi sổ: chuyển nháp sang Đã ghi sổ. Không sửa dòng sau khi ghi.">
                    <Button
                      className="gap-2"
                      onClick={() => {
                        setActionTarget(detail)
                        setPostConfirmOpen(true)
                      }}
                      disabled={postJournal.isPending}
                    >
                      <Send size={14} /> Ghi sổ
                    </Button>
                  </AppTooltip>
                )}
                {detail.status === 'POSTED' && (
                  <AppTooltip content="Đảo chứng từ: tạo bút toán đảo (không xoá lịch sử). Cần nhập lý do.">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setActionTarget(detail)
                        setReverseReason('')
                        setReverseOpen(true)
                      }}
                    >
                      <RotateCcw size={14} /> Đảo chứng từ
                    </Button>
                  </AppTooltip>
                )}
              </div>
            )}
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo chứng từ"
        description="Nhập diễn giải và ít nhất 2 dòng bút toán cân Nợ = Có."
        maxWidth="3xl"
      >
        <form onSubmit={onSubmitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Ngày ghi sổ <span className="text-danger">*</span>
              </Label>
              <Input
                type="date"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label>
                Diễn giải <span className="text-danger">*</span>
              </Label>
              <Input
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="VD: Chi phí văn phòng tháng…"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-neutral-700">Dòng bút toán</div>
              <Button type="button" variant="outline" size="sm" onClick={addCreateLine} className="h-8">
                <Plus size={14} className="mr-1" /> Thêm dòng
              </Button>
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold w-28">Tài khoản</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold w-32">Nợ</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold w-32">Có</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold">Diễn giải dòng</th>
                    <th className="px-2 py-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {createLines.map((line, idx) => {
                    const suggestions = line.accountCode
                      ? accList.filter((a) =>
                          a.code.startsWith(line.accountCode.trim())
                          || a.name.toLowerCase().includes(line.accountCode.trim().toLowerCase()),
                        ).slice(0, 6)
                      : []
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-1.5 relative">
                          <Input
                            value={line.accountCode}
                            onChange={(e) => patchCreateLine(idx, { accountCode: e.target.value })}
                            placeholder="1111"
                            className="font-mono h-8"
                            list={`acc-suggest-${idx}`}
                          />
                          {suggestions.length > 0 && line.accountCode && (
                            <datalist id={`acc-suggest-${idx}`}>
                              {suggestions.map((a) => (
                                <option key={a.id} value={a.code}>{a.name}</option>
                              ))}
                            </datalist>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={line.debit}
                            onChange={(e) => patchCreateLine(idx, { debit: e.target.value, credit: e.target.value ? '' : line.credit })}
                            className="font-mono h-8 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={line.credit}
                            onChange={(e) => patchCreateLine(idx, { credit: e.target.value, debit: e.target.value ? '' : line.debit })}
                            className="font-mono h-8 text-right"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={line.description}
                            onChange={(e) => patchCreateLine(idx, { description: e.target.value })}
                            className="h-8"
                            placeholder="Tuỳ chọn"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {createLines.length > 2 && (
                            <AppTooltip content="Xoá dòng">
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-red-50 text-red-600"
                                onClick={() => removeCreateLine(idx)}
                                aria-label="Xoá dòng"
                              >
                                <Trash2 size={14} />
                              </button>
                            </AppTooltip>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-3 text-xs tabular-nums">
              <span>Tổng Nợ: <strong>{formatCurrency(createTotals.totalDebit)}</strong></span>
              <span>Tổng Có: <strong>{formatCurrency(createTotals.totalCredit)}</strong></span>
              <span className={Math.abs(createTotals.diff) < 0.001 ? 'text-success-dark' : 'text-danger-dark'}>
                Chênh lệch: {formatCurrency(Math.abs(createTotals.diff))}
              </span>
            </div>
          </div>

          {createError && (
            <p className="text-xs text-danger-dark bg-danger-light border border-danger/20 rounded-md px-3 py-2">
              {createError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={createDraft.isPending || createAndPost.isPending}
            >
              {createDraft.isPending ? 'Đang lưu…' : 'Lưu nháp'}
            </Button>
            <AppTooltip content="Tạo và ghi sổ luôn vào sổ cái">
              <Button
                type="button"
                disabled={createDraft.isPending || createAndPost.isPending}
                onClick={() => submitCreate('post')}
              >
                {createAndPost.isPending ? 'Đang ghi sổ…' : 'Ghi sổ'}
              </Button>
            </AppTooltip>
          </div>
        </form>
      </AppModal>

      <AppModal
        isOpen={reverseOpen && !!postTarget}
        onClose={() => setReverseOpen(false)}
        title="Đảo chứng từ"
        description={postTarget ? `Số chứng từ ${postTarget.code} — nhập lý do bắt buộc` : undefined}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Lý do đảo *</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="VD: Sai tài khoản, sai số tiền, chứng từ trùng…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReverseOpen(false)}>Huỷ</Button>
            <Button
              disabled={reverse.isPending}
              onClick={() => {
                const reason = reverseReason.trim()
                if (reason.length < 3) {
                  toast.error('Lý do đảo tối thiểu 3 ký tự')
                  return
                }
                setReverseConfirmOpen(true)
              }}
            >
              Tiếp tục…
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={postConfirmOpen && !!postTarget}
        onClose={() => { setPostConfirmOpen(false); setActionTarget(null) }}
        onConfirm={() => {
          if (!postTarget) return
          postJournal.mutate(postTarget.id, {
            onSuccess: () => {
              setPostConfirmOpen(false)
              setActionTarget(null)
              setDetailId(null)
            },
          })
        }}
        title={`Ghi sổ chứng từ ${postTarget?.code || ''}?`}
        message="Chứng từ sẽ chuyển sang Đã ghi sổ. Không thể sửa dòng sau khi ghi sổ."
        confirmText="Ghi sổ"
        cancelText="Huỷ"
        variant="warning"
        isLoading={postJournal.isPending}
      />

      <ConfirmDialog
        isOpen={reverseConfirmOpen && !!postTarget}
        onClose={() => setReverseConfirmOpen(false)}
        onConfirm={() => {
          if (!postTarget) return
          const reason = reverseReason.trim()
          reverse.mutate(
            { id: postTarget.id, reason },
            {
              onSuccess: () => {
                setReverseConfirmOpen(false)
                setReverseOpen(false)
                setActionTarget(null)
                setDetailId(null)
                setReverseReason('')
              },
            },
          )
        }}
        title={`Xác nhận đảo ${postTarget?.code || ''}?`}
        message={`Thao tác không hoàn tác trực tiếp. Lý do: ${reverseReason.trim() || '—'}`}
        confirmText="Đảo chứng từ"
        cancelText="Huỷ"
        variant="danger"
        isLoading={reverse.isPending}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm font-medium">{value ?? '—'}</div>
    </div>
  )
}

interface JournalKpiProps {
  icon: LucideIcon
  label: string
  value: string
  tone: 'blue' | 'emerald' | 'violet' | 'rose' | 'teal'
  hint?: string
  title?: string
}

function JournalKpi({ icon: Icon, label, value, tone, hint, title }: JournalKpiProps) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    violet: 'bg-violet-50 text-violet-700 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
    rose: 'bg-rose-50 text-rose-700 [&_.ico]:bg-rose-100 [&_.ico]:text-rose-600',
    teal: 'bg-teal-50 text-teal-700 [&_.ico]:bg-teal-100 [&_.ico]:text-teal-600',
  }[tone]
  return (
    <div
      className={`rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 ${toneMap}`}
      title={title}
    >
      <div className="ico w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-lg font-bold tabular-nums text-neutral-900 leading-tight truncate">
          {value}
        </div>
        {hint && <div className="text-[10px] opacity-80 truncate mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
