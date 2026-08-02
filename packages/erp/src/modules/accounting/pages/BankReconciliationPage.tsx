// ============================================================
// BankReconciliationPage — gợi ý khớp + khóa/mở lại sao kê
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Upload, Link2, Unlink, Search, Landmark, Loader2, Lock, Unlock, HelpCircle,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, ConfirmDialog, Select, AppTooltip } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  useBankStatements, useBankStatementLines, useBankSuggestions,
  useMatchBankLine, useUnmatchBankLine,
  useLockBankStatement, useReopenBankStatement,
} from '../hooks/useBankStatement'
import type { BankStatementLineDto } from '../services/bankApi'
import { pageRootClass } from '../utils/pageEmbed'
import { usePermission } from '@/lib/hooks/usePermission'

type LineFilter = 'unmatched' | 'matched' | 'all'
type MatchMode = 'exact' | 'fuzzy'

type PendingMatch = {
  lineId: string
  journalEntryLineId: string
  journalCode?: string
}

export function BankReconciliationPage({ embedded }: { embedded?: boolean } = {}) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { data: statements = [], isLoading: loadingStmt } = useBankStatements()
  const canCreate = usePermission('ACCOUNTING.BANK_STATEMENTS.CREATE')
  const canUpdate = usePermission('ACCOUNTING.BANK_STATEMENTS.UPDATE')

  const [statementId, setStatementId] = useState(params.get('statementId') || '')
  const [lineFilter, setLineFilter] = useState<LineFilter>('unmatched')
  const [search, setSearch] = useState('')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [mode, setMode] = useState<MatchMode>('fuzzy')

  const [lockConfirmOpen, setLockConfirmOpen] = useState(false)
  const [reopenConfirmOpen, setReopenConfirmOpen] = useState(false)
  const [pendingMatch, setPendingMatch] = useState<PendingMatch | null>(null)
  const [pendingUnmatchLineId, setPendingUnmatchLineId] = useState<string | null>(null)

  useEffect(() => {
    const fromUrl = params.get('statementId')
    if (fromUrl) setStatementId(fromUrl)
  }, [params])

  useEffect(() => {
    if (!statementId && statements[0]?.id) setStatementId(statements[0].id)
  }, [statements, statementId])

  const active = statements.find((s) => s.id === statementId)
  const locked =
    (active?.lockStatus || '').toUpperCase() === 'LOCKED' || !!active?.lockedAt

  const { data: lines = [], isLoading } = useBankStatementLines(
    statementId || undefined,
    lineFilter,
  )
  const { data: suggestions = [] } = useBankSuggestions(
    statementId || undefined,
    selectedLineId || undefined,
    mode,
  )
  const match = useMatchBankLine(statementId)
  const unmatch = useUnmatchBankLine(statementId)
  const lockStmt = useLockBankStatement()
  const reopenStmt = useReopenBankStatement()

  const ranked = useMemo(
    () => [...suggestions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [suggestions],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return lines
    return lines.filter(
      (l) =>
        l.description.toLowerCase().includes(q)
        || String(l.debit).includes(q)
        || String(l.credit).includes(q)
        || (l.refCode || '').toLowerCase().includes(q),
    )
  }, [lines, search])

  const selectedLine = lines.find((l) => l.id === selectedLineId)

  const hasActiveFilters =
    lineFilter !== 'unmatched'
    || mode !== 'fuzzy'
    || !!search.trim()

  const clearFilters = () => {
    setLineFilter('unmatched')
    setMode('fuzzy')
    setSearch('')
  }

  const modeLabel = mode === 'fuzzy' ? 'Gần đúng' : 'Khớp chính xác'

  if (!loadingStmt && statements.length === 0) {
    return (
      <div className={pageRootClass(embedded)}>
        {!embedded && (
        <PageHeader
          title="Đối chiếu ngân hàng"
          description="Import sao kê CSV và khớp với bút toán sổ cái."
          actions={(
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Đối chiếu ngân hàng: khớp dòng sao kê với bút toán đã ghi sổ trên TK 112x."
              aria-label="Giải thích đối chiếu ngân hàng"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
          )}
        />
        )}
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Landmark}
            title="Chưa có sao kê nào, hãy import"
            description="Upload CSV từ ngân hàng để bắt đầu đối chiếu."
            action={
              canCreate
                ? {
                    label: 'Import sao kê',
                    onClick: () => nav('/accounting/bank-reconciliation/import'),
                  }
                : undefined
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
      <PageHeader
        title="Đối chiếu ngân hàng"
        description="Gợi ý khớp theo điểm tin cậy · Khớp một chạm · Khóa sao kê khi hoàn tất."
        actions={(
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center text-neutral-400 hover:text-primary-600 cursor-help"
              title="Khớp gần đúng: so sánh mô tả và số tiền theo điểm %. Khớp chính xác: cùng ngày và số tiền."
              aria-label="Giải thích chế độ khớp"
            >
              <HelpCircle size={16} strokeWidth={2} />
            </span>
            {statementId && !locked && canUpdate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                disabled={lockStmt.isPending}
                onClick={() => setLockConfirmOpen(true)}
              >
                <Lock size={14} /> Khóa sao kê
              </Button>
            )}
            {statementId && locked && canUpdate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                disabled={reopenStmt.isPending}
                onClick={() => setReopenConfirmOpen(true)}
              >
                <Unlock size={14} /> Mở lại
              </Button>
            )}
            {canCreate && (
              <Button
                size="sm"
                className="gap-1.5 h-9"
                onClick={() => nav('/accounting/bank-reconciliation/import')}
              >
                <Upload size={14} /> Import CSV
              </Button>
            )}
          </div>
        )}
      />
      )}

      {locked && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Sao kê đang <b>Đã khóa</b> — không thể khớp / bỏ khớp. Mở lại để tiếp tục.
        </div>
      )}

      {active && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Sum label="Tổng import" value={active.importedLines} />
          <Sum label="Đã khớp" value={active.matchedCount} tone="emerald" />
          <Sum label="Chưa khớp" value={active.unmatchedCount} tone="amber" />
          <Sum
            label="TK"
            valueLabel={`${active.accountCode || ''} ${active.accountName || ''}`.trim() || '—'}
          />
        </div>
      )}

      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        countLabel={`${filtered.length} dòng${hasActiveFilters ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[220px]">
          <Select
            options={statements.map((s) => ({
              value: s.id,
              label: `${s.fileName || s.id} · ${formatDate(s.importedAt)}${(s.lockStatus || '').toUpperCase() === 'LOCKED' ? ' 🔒' : ''}`,
            }))}
            value={statementId}
            onChange={(v) => {
              setStatementId(v)
              setSelectedLineId(null)
            }}
            placeholder="Chọn sao kê"
            aria-label="Chọn sao kê"
          />
        </div>
        {(['unmatched', 'matched', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setLineFilter(f)}
            className={`h-9 px-3 rounded-md text-xs font-semibold border ${
              lineFilter === f
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {f === 'unmatched' ? 'Chưa khớp' : f === 'matched' ? 'Đã khớp' : 'Tất cả'}
          </button>
        ))}
        {(['fuzzy', 'exact'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`h-9 px-3 rounded-md text-xs font-semibold border ${
              mode === m
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {m === 'fuzzy' ? 'Gần đúng' : 'Khớp chính xác'}
          </button>
        ))}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-8 pr-2 border rounded-md text-sm bg-white"
            placeholder="Tìm mô tả / số tiền…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm dòng sao kê"
          />
        </div>
      </FilterBar>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[420px]">
        <div className="bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-3 py-2 border-b bg-neutral-50 text-xs font-semibold text-neutral-600">
            Dòng sao kê ({filtered.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y max-h-[520px]">
            {isLoading && (
              <div className="p-6 text-center text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-neutral-400">Không có dòng</div>
            )}
            {filtered.map((l) => (
              <LineRow
                key={l.id}
                line={l}
                active={selectedLineId === l.id}
                locked={locked}
                canUpdate={canUpdate}
                onSelect={() => setSelectedLineId(l.id)}
                onUnmatch={() => setPendingUnmatchLineId(l.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-3 py-2 border-b bg-neutral-50 text-xs font-semibold text-neutral-600">
            Gợi ý khớp ({modeLabel}) — xếp theo điểm %
            {selectedLine && (
              <span className="font-normal text-neutral-400 ml-1">
                · {selectedLine.description.slice(0, 40)}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px]">
            {!selectedLineId && (
              <p className="text-sm text-neutral-400 text-center py-10">
                Chọn 1 dòng sao kê bên trái để xem gợi ý
              </p>
            )}
            {selectedLineId && ranked.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-10">
                Không có gợi ý ({modeLabel.toLowerCase()})
              </p>
            )}
            {ranked.map((s) => {
              const pct = Math.round(Math.min(100, Math.max(0, s.score ?? 0)))
              return (
                <div
                  key={s.journalEntryLineId}
                  className="border rounded-lg p-3 hover:border-primary-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-neutral-800 truncate">
                          {s.journalEntryCode || s.journalEntryLineId}
                        </div>
                        <span
                          className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                            pct >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : pct >= 50
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5 truncate">
                        {s.description}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        {formatDate(s.txnDate)} · {s.reason}
                      </div>
                      <div className="mt-1.5 h-1 bg-neutral-100 rounded-full overflow-hidden max-w-[160px]">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-emerald-700">
                        {formatCurrency(s.amount)}
                      </div>
                      {canUpdate && (
                        <AppTooltip content={locked ? 'Sao kê đã khóa' : 'Khớp một chạm'}>
                          <Button
                            size="sm"
                            className="gap-1 mt-2"
                            disabled={
                              locked
                              || match.isPending
                              || selectedLine?.matchStatus === 'MATCHED'
                            }
                            aria-label={locked ? 'Sao kê đã khóa' : 'Khớp một chạm'}
                            onClick={() =>
                              selectedLineId &&
                              setPendingMatch({
                                lineId: selectedLineId,
                                journalEntryLineId: s.journalEntryLineId,
                                journalCode: s.journalEntryCode,
                              })
                            }
                          >
                            <Link2 size={12} /> Khớp
                          </Button>
                        </AppTooltip>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={lockConfirmOpen}
        onClose={() => setLockConfirmOpen(false)}
        onConfirm={() => {
          if (!statementId) return
          lockStmt.mutate(statementId, {
            onSuccess: () => setLockConfirmOpen(false),
          })
        }}
        title="Khóa sao kê?"
        message="Sau khi khóa, không thể khớp hoặc bỏ khớp dòng. Chỉ mở lại khi cần điều chỉnh."
        confirmText="Khóa sao kê"
        cancelText="Huỷ"
        variant="warning"
        isLoading={lockStmt.isPending}
      />

      <ConfirmDialog
        isOpen={reopenConfirmOpen}
        onClose={() => setReopenConfirmOpen(false)}
        onConfirm={() => {
          if (!statementId) return
          reopenStmt.mutate(statementId, {
            onSuccess: () => setReopenConfirmOpen(false),
          })
        }}
        title="Mở lại sao kê?"
        message="Mở lại cho phép khớp / bỏ khớp tiếp. Chỉ dùng khi cần sửa đối chiếu."
        confirmText="Mở lại"
        cancelText="Huỷ"
        isLoading={reopenStmt.isPending}
      />

      <ConfirmDialog
        isOpen={!!pendingMatch}
        onClose={() => setPendingMatch(null)}
        onConfirm={() => {
          if (!pendingMatch) return
          match.mutate(
            {
              lineId: pendingMatch.lineId,
              journalEntryLineId: pendingMatch.journalEntryLineId,
            },
            { onSuccess: () => setPendingMatch(null) },
          )
        }}
        title="Xác nhận khớp?"
        message={
          pendingMatch
            ? `Liên kết dòng sao kê với chứng từ ${pendingMatch.journalCode || pendingMatch.journalEntryLineId}.`
            : ''
        }
        confirmText="Khớp"
        cancelText="Huỷ"
        isLoading={match.isPending}
      />

      <ConfirmDialog
        isOpen={!!pendingUnmatchLineId}
        onClose={() => setPendingUnmatchLineId(null)}
        onConfirm={() => {
          if (!pendingUnmatchLineId) return
          unmatch.mutate(pendingUnmatchLineId, {
            onSuccess: () => setPendingUnmatchLineId(null),
          })
        }}
        title="Bỏ khớp dòng sao kê?"
        message="Dòng sẽ chuyển về trạng thái chưa khớp. Bạn có thể khớp lại sau."
        confirmText="Bỏ khớp"
        cancelText="Huỷ"
        variant="warning"
        isLoading={unmatch.isPending}
      />
    </div>
  )
}

function LineRow({
  line,
  active,
  locked,
  canUpdate,
  onSelect,
  onUnmatch,
}: {
  line: BankStatementLineDto
  active: boolean
  locked: boolean
  canUpdate: boolean
  onSelect: () => void
  onUnmatch: () => void
}) {
  const amt = line.credit || line.debit
  const isCredit = line.credit > 0
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 transition ${
        active ? 'bg-primary-50' : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-neutral-800 truncate">
            {line.description || '(không mô tả)'}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {formatDate(line.txnDate)}
            {line.refCode && <> · {line.refCode}</>}
            {' · '}
            <span
              className={
                line.matchStatus === 'MATCHED'
                  ? 'text-emerald-600 font-semibold'
                  : 'text-amber-600'
              }
            >
              {line.matchStatus === 'MATCHED' ? 'Đã khớp' : 'Chưa khớp'}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={`text-sm font-bold tabular-nums ${
              isCredit ? 'text-emerald-700' : 'text-neutral-800'
            }`}
          >
            {isCredit ? '+' : '−'}
            {formatCurrency(amt)}
          </div>
          {line.matchStatus === 'MATCHED' && !locked && canUpdate && (
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-neutral-400 hover:text-rose-600"
              onClick={(e) => {
                e.stopPropagation()
                onUnmatch()
              }}
            >
              <Unlink size={10} /> Bỏ khớp
            </button>
          )}
        </div>
      </div>
    </button>
  )
}

function Sum({
  label,
  value,
  valueLabel,
  tone,
}: {
  label: string
  value?: number
  valueLabel?: string
  tone?: 'emerald' | 'amber'
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 border-emerald-200'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-200'
        : 'bg-white border-neutral-200'
  return (
    <div className={`rounded-xl border p-3 ${toneCls}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums text-neutral-900 mt-0.5 truncate">
        {valueLabel ?? value ?? 0}
      </div>
    </div>
  )
}
