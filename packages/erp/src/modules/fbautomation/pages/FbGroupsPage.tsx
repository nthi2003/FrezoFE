import { useMemo, useState } from 'react'
import { Trash2, Search, Users, HelpCircle, UserPlus } from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState, Select, IconActionButton, AppTooltip } from '@frezo/ui'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import {
  useFbGroups, useDeleteFbGroup, useJoinFbGroup, useFbAccounts,
} from '../hooks/useFbAutomation'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'NEW', label: 'Mới' },
  { value: 'JOINED', label: 'Đã tham gia' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'READY_TO_JOIN', label: 'Sẵn sàng' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Mới', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  JOINED: { label: 'Đã tham gia', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'Từ chối', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  READY_TO_JOIN: { label: 'Sẵn sàng', color: 'text-amber-700 bg-amber-50 border-amber-200' },
}

export function FbGroupsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [accountId, setAccountId] = useState('')
  const [search, setSearch] = useState('')

  const { data: accounts } = useFbAccounts()
  const apiFilter = statusFilter === 'ALL' ? undefined : statusFilter
  const { data: groups, isLoading, isError, isFetching, refetch } = useFbGroups(apiFilter)
  const deleteReq = useDeleteFbGroup()
  const joinReq = useJoinFbGroup()

  const list = useMemo(() => (Array.isArray(groups) ? groups : []), [groups])
  const accList = useMemo(() => (Array.isArray(accounts) ? accounts : []), [accounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((g: any) =>
      (g.groupName || '').toLowerCase().includes(q) ||
      String(g.groupId || '').toLowerCase().includes(q),
    )
  }, [list, search])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && list.length === 0
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0

  const handleJoin = (groupId: string) => {
    if (!accountId) {
      toast.error('Vui lòng chọn tài khoản trước')
      return
    }
    joinReq.mutate({ accountId, groupId })
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'groupName',
      title: 'Tên group',
      render: (_, g) => <span className="font-medium text-neutral-900">{g.groupName}</span>,
    },
    {
      key: 'groupId',
      title: 'Group ID',
      render: (_, g) => (
        <span className="font-mono text-xs text-neutral-500">{g.groupId}</span>
      ),
    },
    {
      key: 'memberCount',
      title: 'Thành viên',
      align: 'center',
      render: (_, g) => (
        <span className="tabular-nums text-sm text-neutral-600">
          {g.memberCount?.toLocaleString('vi-VN') || '—'}
        </span>
      ),
    },
    {
      key: 'relevanceScore',
      title: 'Độ phù hợp',
      align: 'center',
      render: (_, g) => {
        const score = (g.relevanceScore || 0) * 100
        const cls =
          score >= 70
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : score >= 40
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            {score.toFixed(0)}%
          </span>
        )
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, g) => {
        const cfg = statusConfig[g.status] || {
          label: g.status,
          color: 'text-neutral-600 bg-neutral-50 border-neutral-200',
        }
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 160,
      render: (_, g) => (
        <div className="flex items-center justify-end gap-1">
          {(g.status === 'NEW' || g.status === 'READY_TO_JOIN') && (
            <AppTooltip content={accountId ? 'Tham gia group bằng tài khoản đã chọn' : 'Chọn tài khoản ở bộ lọc trước'}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleJoin(g.groupId)}
                disabled={joinReq.isPending || !accountId}
                className="text-emerald-600 hover:text-emerald-800 gap-1"
                aria-label="Tham gia group"
              >
                <UserPlus size={14} /> Tham gia
              </Button>
            </AppTooltip>
          )}
          <IconActionButton
            tooltip="Xoá group"
            tone="red"
            onClick={() =>
              askConfirm({
                title: 'Xoá group này?',
                message: `Group "${g.groupName}" sẽ bị xoá khỏi danh sách.`,
                confirmText: 'Xoá',
                onConfirm: () => deleteReq.mutate(g.id),
              })
            }
          >
            <Trash2 className="w-4 h-4" />
          </IconActionButton          >
            <Trash2 className="w-4 h-4" />
          </IconActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FacebookIcon className="w-6 h-6 text-blue-600" />
            Danh sách Groups
          </span>
        }
        description="Tất cả group đã quét từ Facebook — duyệt, tham gia và theo dõi trạng thái."
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} group${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[180px]">
          <Select
            options={[
              { value: '', label: 'Tài khoản để tham gia…' },
              ...accList.map((a: any) => ({ value: a.id, label: a.username })),
            ]}
            value={accountId}
            onChange={setAccountId}
            placeholder="Tài khoản để tham gia…"
            aria-label="Tài khoản để tham gia"
            showSearch={accList.length > 8}
          />
        </div>
        <span
          className="inline-flex items-center text-neutral-400"
          title="Chọn tài khoản trước khi bấm Tham gia trên từng dòng"
        >
          <HelpCircle size={14} />
        </span>
        <div className="min-w-[150px]">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm tên group hoặc Group ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm group"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách group"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Users}
            title={isFilteredEmpty ? 'Không có group khớp bộ lọc' : 'Chưa có group nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Quét group từ trang Quét Groups để bắt đầu.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } }
                : undefined
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
          getRowId={(r) => String(r.id)}
        />
      )}
      {confirmDialog}
    </div>
  )
}
