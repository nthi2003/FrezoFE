// ============================================================
// LeavesPage — Workflow 2 tầng (QL trực tiếp → HR)
// ------------------------------------------------------------
// 3 tabs:
//   • "Cần tôi duyệt" — server tự lọc theo role (manager thấy đơn của team,
//     HR thấy PENDING_HR, admin thấy tất cả).
//   • "Đơn của tôi" — mọi trạng thái, sort mới nhất trước.
//   • "Tất cả" — admin only (skip nếu chưa admin).
//
// Detail drawer: ApprovalTimeline + duyệt qua Approval Inbox (không approve local).
// Create modal: nhân viên = person đăng nhập (read-only), loại nghỉ, date range.
// Khi embed trong TimeHub: nút tạo do hub header / toolbar — truyền onCreateLeave.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Search, RefreshCw, CalendarDays, Filter, CheckCircle2, XCircle,
  Clock, User, Ban, ArrowRight, Bell, FileWarning, type LucideIcon,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, PageGuideButton, Select,
  StatusBadge, RowActions, type StatusColor,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useAuthStore } from '@/stores/authStore'
import { useLeaveRequests, useMyLeaveRequests } from '../hooks/useLeave'
import { useMyContract } from '../hooks/useMyContract'
import type { LeaveRequestItem, LeaveStatus } from '../services/leaveApi'
import { LEAVE_TYPES, type LeaveTypeCode } from '../constants/schema'
import { LeaveRequestModal } from '../components/LeaveRequestModal'
import { LeaveDetailDrawer } from '../components/LeaveDetailDrawer'
import { usePermission } from '@/lib/hooks/usePermission'
import { LEAVES_GUIDE } from '../constants/leaves.guide'
import { pageRootClass } from '../utils/pageEmbed'

// ============================================================
// Config maps — status → label + màu semantic StatusBadge
// ============================================================

const STATUS_META: Record<
  LeaveStatus,
  { label: string; short: string; color: StatusColor; icon: typeof CheckCircle2 }
> = {
  PENDING_MANAGER: {
    label: 'Chờ QL trực tiếp duyệt', short: 'Chờ QL',
    color: 'warning', icon: Clock,
  },
  PENDING_HR: {
    label: 'Chờ HR chốt', short: 'Chờ HR',
    color: 'info', icon: Clock,
  },
  APPROVED: {
    label: 'Đã duyệt', short: 'Duyệt',
    color: 'success', icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Từ chối', short: 'Từ chối',
    color: 'danger', icon: XCircle,
  },
  CANCELLED: {
    label: 'Đã huỷ', short: 'Huỷ',
    color: 'neutral', icon: Ban,
  },
  PENDING: {
    label: 'Chờ duyệt (legacy)', short: 'Chờ duyệt',
    color: 'warning', icon: Clock,
  },
}

const TYPE_META: Record<string, { label: string; tone: string }> = LEAVE_TYPES.reduce(
  (acc, t) => {
    const tone = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      violet: 'bg-violet-50 text-violet-700 border-violet-200',
    }[t.color]
    acc[t.value] = { label: t.label, tone }
    return acc
  },
  {} as Record<string, { label: string; tone: string }>,
)

type TabKey = 'inbox' | 'mine' | 'all'

// ============================================================
// Main
// ============================================================

export function LeavesPage({
  embedded,
  onCreateLeave,
}: {
  embedded?: boolean
  /** Hub điều khiển modal tạo đơn — khi có thì không render modal nội bộ. */
  onCreateLeave?: () => void
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') || null

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = !!currentUser?.isAdmin
  const canCreateLeave = usePermission('LEAVE.CREATE')

  const [tab, setTab] = useState<TabKey>('inbox')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveTypeCode>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | LeaveStatus>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [activeLead, setActiveLead] = useState<LeaveRequestItem | null>(null)

  const ownsCreateModal = !onCreateLeave
  const openCreate = () => {
    if (onCreateLeave) onCreateLeave()
    else setCreateOpen(true)
  }

  // ---- Data ----
  // Tab "Đơn của tôi" query theo contractId của HĐ đang hiệu lực — KHÔNG phải user.id.
  const isMineTab = tab === 'mine'
  const myContract = useMyContract()
  const pending = useLeaveRequests()
  const mine = useMyLeaveRequests(myContract.contractId || undefined)
  const source = isMineTab ? mine : pending

  /** Chưa liên kết nhân sự / chưa có HĐ hiệu lực → không gọi API, hiện empty state riêng. */
  const mineBlocked = isMineTab && !myContract.isLoading && !myContract.hasContract
  const listLoading = source.isLoading || (isMineTab && myContract.isLoading)
  const rawList = useMemo<LeaveRequestItem[]>(
    () => (Array.isArray(source.data) ? source.data : []),
    [source.data],
  )

  // ---- Client filter ----
  const list = useMemo(() => {
    let filtered = rawList
    if (typeFilter !== 'all') filtered = filtered.filter((l) => l.leaveType === typeFilter)
    if (statusFilter !== 'all') filtered = filtered.filter((l) => (l.status || 'PENDING_MANAGER') === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter((l) =>
        [l.personName, l.createdBy, l.reason, l.leaveType].filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    }
    return filtered
  }, [rawList, typeFilter, statusFilter, search])

  // ---- Stats ----
  const stats = useMemo(() => {
    const s = { total: rawList.length, pending: 0, approved: 0, rejected: 0 }
    rawList.forEach((l) => {
      const st = l.status || 'PENDING_MANAGER'
      if (st === 'APPROVED') s.approved++
      else if (st === 'REJECTED' || st === 'CANCELLED') s.rejected++
      else s.pending++
    })
    return s
  }, [rawList])

  // ---- Deep-link — auto mở drawer khi vào từ notification bell ----
  useEffect(() => {
    if (!highlightId || activeLead) return
    const target = rawList.find((l) => l.id === highlightId)
    if (target) setActiveLead(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, rawList])

  const closeDrawer = () => {
    setActiveLead(null)
    if (highlightId) {
      const next = new URLSearchParams(searchParams)
      next.delete('highlight')
      setSearchParams(next, { replace: true })
    }
  }

  const clearFilters = () => {
    setSearch(''); setTypeFilter('all'); setStatusFilter('all')
  }
  const hasFilter = search || typeFilter !== 'all' || statusFilter !== 'all'
  const isFilteredEmpty = !listLoading && !source.isError && rawList.length > 0 && list.length === 0
  const isFullyEmpty = !listLoading && !source.isError && rawList.length === 0

  const createEmptyAction =
    canCreateLeave && !isFilteredEmpty && (tab === 'mine' || tab === 'all' || isFullyEmpty)
      ? { label: 'Tạo đơn nghỉ phép', onClick: openCreate }
      : undefined

  const columns: AppTableColumn<LeaveRequestItem>[] = useMemo(() => [
    {
      key: 'personName',
      title: 'Nhân viên',
      render: (_, l) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {(l.personName || l.createdBy || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-neutral-900 truncate max-w-[180px]">
              {l.personName || l.createdBy || 'N/A'}
            </div>
            {l.departmentName && (
              <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">{l.departmentName}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'leaveType',
      title: 'Loại',
      render: (_, l) => {
        const type = TYPE_META[l.leaveType] || { label: l.leaveType, tone: 'bg-neutral-50 text-neutral-700 border-neutral-200' }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${type.tone}`}>
            {type.label}
          </span>
        )
      },
    },
    {
      key: 'dates',
      title: 'Thời gian',
      render: (_, l) => (
        <div>
          <div className="text-xs text-neutral-800 tabular-nums">
            {fmtDate(l.startDate)}
            {l.endDate && l.endDate !== l.startDate && (
              <>
                <ArrowRight size={11} className="inline mx-1 text-neutral-400" />
                {fmtDate(l.endDate)}
              </>
            )}
          </div>
          {l.durationDays != null && (
            <div className="text-[10px] text-neutral-500 mt-0.5">{l.durationDays} ngày</div>
          )}
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Lý do',
      render: (_, l) => (
        <div className="text-xs text-neutral-700 line-clamp-2 max-w-[220px]">
          {l.reason || <span className="text-neutral-400">—</span>}
        </div>
      ),
    },
    {
      key: 'workflow',
      title: 'Workflow',
      render: (_, l) => <WorkflowMini lead={l} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'right',
      render: (_, l) => {
        const st = STATUS_META[(l.status || 'PENDING_MANAGER') as LeaveStatus]
        return (
          <StatusBadge
            label={st.short}
            color={st.color}
            icon={st.icon}
            className="justify-end"
          />
        )
      },
    },
    {
      key: 'actions',
      title: '',
      width: 56,
      align: 'right',
      render: (_, l) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'view',
              onClick: () => setActiveLead(l),
              tooltip: 'Xem chi tiết',
            },
          ]}
        />
      ),
    },
  ], [])

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={pageRootClass(embedded, 'space-y-4')}>
      {!embedded && (
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                <CalendarDays size={16} />
              </span>
              Nghỉ phép
            </span>
          }
          description={
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Duyệt theo luồng <b>Nghỉ phép</b> đang kích hoạt tại Cấu hình luồng duyệt.</span>
              <span className="text-neutral-300">·</span>
              <span className="tabular-nums">
                <b>{stats.pending}</b> chờ duyệt · <b className="text-emerald-700">{stats.approved}</b> đã duyệt
                · <b className="text-rose-700">{stats.rejected}</b> từ chối/huỷ
              </span>
            </span>
          }
          actions={
            <>
              <PageGuideButton guide={LEAVES_GUIDE} />
              <Button variant="outline" onClick={() => source.refetch()} disabled={source.isFetching} className="gap-1.5">
                <RefreshCw size={14} className={source.isFetching ? 'animate-spin' : ''} />
                Làm mới
              </Button>
              {canCreateLeave && (
                <Button onClick={openCreate} className="gap-1.5">
                  <Plus size={14} /> Tạo đơn nghỉ phép
                </Button>
              )}
            </>
          }
        />
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-2 text-sm text-neutral-600">
            <span className="tabular-nums font-medium text-neutral-800">
              {stats.pending} chờ duyệt
            </span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums text-emerald-700">{stats.approved} đã duyệt</span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums text-rose-600">{stats.rejected} từ chối/huỷ</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void source.refetch()}
              disabled={source.isFetching}
              className="gap-1.5 h-9"
            >
              <RefreshCw size={14} className={source.isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            {canCreateLeave && (
              <Button size="sm" onClick={openCreate} className="gap-1.5 h-9">
                <Plus size={14} /> Tạo đơn nghỉ phép
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-neutral-200 p-1 inline-flex gap-1 flex-wrap">
        <TabButton
          active={tab === 'inbox'}
          onClick={() => setTab('inbox')}
          icon={Bell}
          label="Cần tôi duyệt"
          count={pending.data?.length}
          activeColor="text-amber-700 bg-amber-50 border-amber-200"
        />
        <TabButton
          active={tab === 'mine'}
          onClick={() => setTab('mine')}
          icon={User}
          label="Đơn của tôi"
          count={mine.data?.length}
          activeColor="text-primary-700 bg-primary-50 border-primary-200"
        />
        {isAdmin && (
          <TabButton
            active={tab === 'all'}
            onClick={() => setTab('all')}
            icon={CalendarDays}
            label="Tất cả (admin)"
            activeColor="text-violet-700 bg-violet-50 border-violet-200"
          />
        )}
      </div>

      <FilterBar
        hasActiveFilters={!!hasFilter}
        onClear={clearFilters}
        countLabel={`${list.length} đơn${hasFilter ? ' (đã lọc)' : ''}`}
        extra={(
          canCreateLeave && !embedded ? (
            <Button size="sm" onClick={openCreate} className="gap-1.5 h-9">
              <Plus size={14} /> Tạo đơn
            </Button>
          ) : undefined
        )}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhân viên, lý do…"
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            aria-label="Tìm đơn nghỉ"
          />
        </div>
        <div className="min-w-[160px]">
          <Select
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              ...(Object.keys(STATUS_META) as LeaveStatus[]).map((k) => ({
                value: k,
                label: STATUS_META[k].label,
              })),
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            placeholder="Trạng thái"
            aria-label="Trạng thái"
            showSearch={false}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 inline-flex items-center gap-1 mr-1">
            <Filter size={11} /> Loại:
          </span>
          <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label="Tất cả" />
          {LEAVE_TYPES.slice(0, 4).map((t) => (
            <FilterChip
              key={t.value}
              active={typeFilter === t.value}
              onClick={() => setTypeFilter(t.value)}
              label={t.label}
            />
          ))}
        </div>
      </FilterBar>

      {mineBlocked ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileWarning}
            title={
              myContract.hasPerson
                ? 'Chưa có hợp đồng đang hiệu lực'
                : 'Tài khoản chưa liên kết hồ sơ nhân sự'
            }
            description={
              myContract.hasPerson
                ? 'Đơn nghỉ gắn với hợp đồng lao động. Hợp đồng của bạn chưa được kích hoạt (activated + ACTIVE) nên chưa tra được đơn — liên hệ HR để kiểm tra.'
                : 'Tài khoản của bạn chưa gắn với hồ sơ nhân sự nào nên không có hợp đồng để tra đơn nghỉ. Liên hệ HR để được liên kết.'
            }
          />
        </div>
      ) : source.isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được đơn nghỉ"
            message="Lỗi mạng hoặc máy chủ. Thử lại; nếu vẫn lỗi hãy liên hệ HR."
            onRetry={() => void source.refetch()}
            isRetrying={source.isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={hasFilter ? Search : CalendarDays}
            title={
              isFilteredEmpty
                ? 'Không có đơn khớp bộ lọc'
                : tab === 'inbox'
                  ? 'Không có đơn cần bạn duyệt'
                  : tab === 'mine'
                    ? 'Bạn chưa có đơn nào'
                    : 'Chưa có đơn nào'
            }
            description={
              isFilteredEmpty
                ? 'Thử điều chỉnh từ khoá hoặc bỏ bớt filter.'
                : tab === 'mine' || canCreateLeave
                  ? 'Bấm "Tạo đơn nghỉ phép" để đăng ký nghỉ.'
                  : 'Khi có đơn mới, bạn sẽ nhận notification.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : createEmptyAction
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={list}
          isLoading={listLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void source.refetch()}
          getRowProps={(l) => ({
            onClick: () => setActiveLead(l),
            className: `cursor-pointer hover:bg-neutral-50/60 ${
              highlightId === l.id ? 'bg-primary-50/60 ring-2 ring-primary-200 ring-inset' : ''
            }`,
          })}
        />
      )}

      {/* Modals — chỉ local khi hub chưa nhận create */}
      {ownsCreateModal && (
        <LeaveRequestModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}
      {activeLead && (
        <LeaveDetailDrawer
          lead={activeLead}
          currentUsername={currentUser?.username}
          isAdmin={isAdmin}
          onClose={closeDrawer}
        />
      )}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function TabButton({
  active, onClick, icon: Icon, label, count, activeColor,
}: {
  active: boolean; onClick: () => void; icon: LucideIcon; label: string; count?: number; activeColor: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition ${
        active
          ? `${activeColor} border`
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 border border-transparent'
      }`}
    >
      <Icon size={14} />
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-white/60' : 'bg-neutral-100'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-xs font-medium transition ${
        active
          ? 'bg-primary-50 text-primary-700 border border-primary-200'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}

/** Mini workflow indicator: dot QL → dot HR (dot xanh khi đã duyệt cấp đó). */
function WorkflowMini({ lead }: { lead: LeaveRequestItem }) {
  const managerDone = !!lead.managerApprovedBy
  const hrDone = !!lead.hrApprovedBy
  const rejected = lead.status === 'REJECTED'

  return (
    <div className="inline-flex items-center gap-1.5 text-[10px]">
      <StepDot
        done={managerDone}
        active={!managerDone && lead.status === 'PENDING_MANAGER'}
        rejected={rejected && !managerDone}
        label={lead.managerUsername || 'QL'}
      />
      <span className="text-neutral-300">→</span>
      <StepDot
        done={hrDone}
        active={!hrDone && lead.status === 'PENDING_HR'}
        rejected={rejected && managerDone}
        label={lead.hrApprovedBy || 'HR'}
      />
    </div>
  )
}

function StepDot({
  done, active, rejected, label,
}: { done: boolean; active: boolean; rejected: boolean; label: string }) {
  let cls = 'border-neutral-300 bg-white text-neutral-400'
  if (rejected) cls = 'border-rose-300 bg-rose-50 text-rose-700'
  else if (done) cls = 'border-emerald-300 bg-emerald-50 text-emerald-700'
  else if (active) cls = 'border-amber-300 bg-amber-50 text-amber-700 animate-pulse'

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 h-5 rounded border font-medium ${cls}`}
      title={label}
    >
      {done && <CheckCircle2 size={9} />}
      {rejected && <XCircle size={9} />}
      {active && <Clock size={9} />}
      <span className="max-w-[80px] truncate">{label}</span>
    </span>
  )
}

// ============================================================
// Helpers
// ============================================================

function fmtDate(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}
