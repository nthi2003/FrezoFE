import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, FileText, RefreshCw, RotateCcw, Eye, Search,
  Scale, TrendingDown, TrendingUp, Send,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, PageHeader, AppModal, ConfirmDialog, EmptyState, ErrorState } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import {
  usePeriods, useJournalsByPeriod, useJournalDetail, useReverseJournal, usePostJournal,
} from '../hooks/useAccounting'
import type { JournalEntry, JournalStatus } from '../services/accountingApi'
import { usePermission } from '@/lib/hooks/usePermission'
import { toast } from 'sonner'

const STATUS_TONE: Record<JournalStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  POSTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVERSED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const STATUS_LABEL: Record<JournalStatus, string> = {
  DRAFT: 'Nháp',
  POSTED: 'Đã ghi sổ',
  REVERSED: 'Đã đảo',
}

export function JournalsPage() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reverseOpen, setReverseOpen] = useState(false)
  const [reverseReason, setReverseReason] = useState('')
  const [postConfirmOpen, setPostConfirmOpen] = useState(false)
  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false)

  const { data: periods } = usePeriods(year)
  const periodList = (periods as any[]) ?? []

  useEffect(() => {
    if (periodList.length > 0 && !selectedPeriodId) {
      const current = periodList.find((p: any) => p.month === now.getMonth() + 1) || periodList[0]
      setSelectedPeriodId(current.id)
    }
  }, [periodList, selectedPeriodId, now])

  const {
    data: entries,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useJournalsByPeriod(selectedPeriodId ?? undefined)
  const { data: detail } = useJournalDetail(detailId ?? undefined)
  const reverse = useReverseJournal()
  const postJournal = usePostJournal()
  const canUpdateJournal = usePermission('ACCOUNTING.JOURNALS.UPDATE')

  const list = (entries as JournalEntry[]) ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((e: JournalEntry) =>
      e.code.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q))
  }, [list, search])

  const kpi = useMemo(() => {
    const posted = list.filter((e) => e.status !== 'REVERSED')
    const totalDebit = posted.reduce((s, e) => s + (e.totalDebit || 0), 0)
    const totalCredit = posted.reduce((s, e) => s + (e.totalCredit || 0), 0)
    return {
      count: list.length,
      totalDebit,
      totalCredit,
      diff: totalDebit - totalCredit,
    }
  }, [list])

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    'Không tải được chứng từ.'

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Chứng từ ghi sổ (Journal)"
        description="Danh sách bút toán trong kỳ. Bấm để xem chi tiết Nợ / Có."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <JournalKpi
          icon={FileText}
          label="Số chứng từ"
          value={String(kpi.count)}
          tone="blue"
        />
        <JournalKpi
          icon={TrendingUp}
          label="Tổng Nợ"
          value={formatCurrency(kpi.totalDebit)}
          tone="emerald"
        />
        <JournalKpi
          icon={TrendingDown}
          label="Tổng Có"
          value={formatCurrency(kpi.totalCredit)}
          tone="violet"
        />
        <JournalKpi
          icon={kpi.diff === 0 ? Scale : AlertTriangle}
          label="Chênh lệch"
          value={formatCurrency(Math.abs(kpi.diff))}
          tone={kpi.diff === 0 ? 'teal' : 'rose'}
          hint={kpi.diff === 0 ? 'Cân bằng ✓' : 'Chưa cân — kiểm tra bút toán'}
        />
      </div>

      {/* FR-UX-01: sticky filter bar + compact default */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-sm">
        <select
          className="border rounded-md px-3 py-1.5 text-sm h-9"
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setSelectedPeriodId(null) }}
        >
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
        <div className="flex gap-1 border rounded-md p-0.5 bg-white overflow-x-auto">
          {periodList.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriodId(p.id)}
              className={`px-3 py-1.5 text-sm rounded whitespace-nowrap ${
                selectedPeriodId === p.id
                  ? 'bg-neutral-900 text-white'
                  : p.status === 'CLOSED' || p.status === 'LOCKED'
                    ? 'text-neutral-400'
                    : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              T{p.month}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full pl-9 pr-3 py-1.5 h-9 border rounded-md text-sm"
            placeholder="Tìm số CT / diễn giải…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2 h-9" disabled={isFetching}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white overflow-hidden">
          <ErrorState
            title="Không tải được chứng từ"
            message={errMsg}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filtered.length === 0 ? (
        <div className="border rounded-xl bg-white overflow-hidden">
          <EmptyState
            icon={FileText}
            title="Chưa có chứng từ nào trong kỳ"
            description="Chọn kỳ khác hoặc đợi nghiệp vụ (lương / kho / CRM) ghi sổ."
            action={{ label: 'Làm mới', onClick: () => void refetch() }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 h-9 text-left text-xs font-semibold">Số CT</th>
                <th className="px-3 py-2 h-9 text-left text-xs font-semibold">Ngày</th>
                <th className="px-3 py-2 h-9 text-left text-xs font-semibold">Diễn giải</th>
                <th className="px-3 py-2 h-9 text-left text-xs font-semibold">Nguồn</th>
                <th className="px-3 py-2 h-9 text-right text-xs font-semibold">Tổng Nợ</th>
                <th className="px-3 py-2 h-9 text-right text-xs font-semibold">Tổng Có</th>
                <th className="px-3 py-2 h-9 text-center text-xs font-semibold">Trạng thái</th>
                <th className="px-3 py-2 h-9 text-right text-xs font-semibold w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-neutral-500">
                    Đang tải…
                  </td>
                </tr>
              )}
              {filtered.map((e: JournalEntry) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 font-mono text-xs text-primary-700">{e.code}</td>
                  <td className="px-3 py-2">{formatDate(e.postingDate)}</td>
                  <td className="px-3 py-2 text-neutral-800">{e.description}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{e.sourceType}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(e.totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrency(e.totalCredit)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_TONE[e.status]}`}>
                      {STATUS_LABEL[e.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700"
                      onClick={() => setDetailId(e.id)}
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppModal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail ? `Chứng từ ${detail.code}` : 'Chi tiết'}
        maxWidth="4xl"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Ngày ghi sổ" value={formatDate(detail.postingDate)} />
              <Info label="Nguồn" value={detail.sourceType} />
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
                  Chứng từ lệch cân — Nợ {formatCurrency(detail.totalDebit)} ≠ Có {formatCurrency(detail.totalCredit)}
                </div>
              )}
              <div className="border rounded-md overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1.5 h-9 w-10 text-center text-xs font-semibold">#</th>
                      <th className="px-2 py-1.5 h-9 text-left w-24 text-xs font-semibold">TK</th>
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
              {/* FR-UX-11 sticky tổng Nợ/Có */}
              <div className="sticky bottom-0 mt-0 flex items-center justify-between gap-3 border border-t-0 rounded-b-md bg-surface/95 backdrop-blur px-3 py-2 text-sm">
                <span className="text-xs text-neutral-500">Tổng chứng từ</span>
                <div className="flex gap-4 tabular-nums font-semibold">
                  <span>Nợ {formatCurrency(detail.totalDebit)}</span>
                  <span>Có {formatCurrency(detail.totalCredit)}</span>
                </div>
              </div>
            </div>
            {canUpdateJournal && (
              <div className="flex justify-end gap-2">
                {detail.status === 'DRAFT' && (
                  <Button
                    className="gap-2"
                    onClick={() => setPostConfirmOpen(true)}
                    disabled={postJournal.isPending}
                  >
                    <Send size={14} /> Ghi sổ
                  </Button>
                )}
                {detail.status === 'POSTED' && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setReverseReason('')
                      setReverseOpen(true)
                    }}
                  >
                    <RotateCcw size={14} /> Đảo chứng từ
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </AppModal>

      <AppModal
        isOpen={reverseOpen && !!detail}
        onClose={() => setReverseOpen(false)}
        title="Đảo chứng từ"
        description={detail ? `CT ${detail.code} — nhập lý do bắt buộc` : undefined}
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
        isOpen={postConfirmOpen && !!detail}
        onClose={() => setPostConfirmOpen(false)}
        onConfirm={() => {
          if (!detail) return
          postJournal.mutate(detail.id, {
            onSuccess: () => {
              setPostConfirmOpen(false)
              setDetailId(null)
            },
          })
        }}
        title={`Ghi sổ chứng từ ${detail?.code || ''}?`}
        message="Chứng từ sẽ chuyển sang Đã ghi sổ. Không thể sửa dòng sau khi post."
        confirmText="Ghi sổ"
        cancelText="Huỷ"
        variant="warning"
        isLoading={postJournal.isPending}
      />

      <ConfirmDialog
        isOpen={reverseConfirmOpen && !!detail}
        onClose={() => setReverseConfirmOpen(false)}
        onConfirm={() => {
          if (!detail) return
          const reason = reverseReason.trim()
          reverse.mutate(
            { id: detail.id, reason },
            {
              onSuccess: () => {
                setReverseConfirmOpen(false)
                setReverseOpen(false)
                setDetailId(null)
                setReverseReason('')
              },
            },
          )
        }}
        title={`Xác nhận đảo ${detail?.code || ''}?`}
        message={`Thao tác không hoàn tác trực tiếp. Lý do: ${reverseReason.trim() || '—'}`}
        confirmText="Đảo chứng từ"
        cancelText="Huỷ"
        variant="danger"
        isLoading={reverse.isPending}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: any }) {
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
}

function JournalKpi({ icon: Icon, label, value, tone, hint }: JournalKpiProps) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    violet: 'bg-violet-50 text-violet-700 [&_.ico]:bg-violet-100 [&_.ico]:text-violet-600',
    rose: 'bg-rose-50 text-rose-700 [&_.ico]:bg-rose-100 [&_.ico]:text-rose-600',
    teal: 'bg-teal-50 text-teal-700 [&_.ico]:bg-teal-100 [&_.ico]:text-teal-600',
  }[tone]
  return (
    <div className={`rounded-xl border border-neutral-200/60 p-3 flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-lg font-bold tabular-nums text-neutral-900 leading-tight">
          {value}
        </div>
        {hint && <div className="text-[10px] opacity-80 truncate mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
