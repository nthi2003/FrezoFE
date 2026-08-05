import { useMemo, useState } from 'react'
import { Search, Loader2, CheckCircle, Users, HelpCircle } from 'lucide-react'
import { Button, Input, PageHeader, EmptyState, ErrorState, Label, Select, RowActions } from '@frezo/ui'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FacebookIcon } from '@/components/shared/FacebookIcon'
import {
  useFbGroups, useDeleteFbGroup, useScanFbGroups, useJoinFbGroup, useFbAccounts,
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

export function FbGroupScannerPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [accountId, setAccountId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const { data: accounts } = useFbAccounts()
  const apiFilter = statusFilter === 'ALL' ? undefined : statusFilter
  const { data: groups, isLoading, isError, isFetching, refetch } = useFbGroups(apiFilter)
  const scanReq = useScanFbGroups()
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

  const handleScan = () => {
    if (!keyword.trim() || !accountId) return
    scanReq.mutate({ accountId, keyword: keyword.trim(), maxResults })
  }

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
      width: 180,
      render: (_, g) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'join',
              icon: CheckCircle,
              tooltip: 'Tham gia group',
              tone: 'emerald',
              hidden: !(g.status === 'NEW' || g.status === 'READY_TO_JOIN'),
              disabled: joinReq.isPending || !accountId,
              onClick: () => handleJoin(g.groupId),
            },
            {
              kind: 'delete',
              tooltip: 'Xoá group',
              onClick: () =>
                askConfirm({
                  title: 'Xoá group này?',
                  message: `Group "${g.groupName}" sẽ bị xoá khỏi danh sách.`,
                  confirmText: 'Xoá',
                  onConfirm: () => deleteReq.mutate(g.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <FacebookIcon className="w-6 h-6 text-blue-600" />
            Quét Group Facebook
          </span>
        }
        description="Tìm group theo từ khoá bằng Selenium, lọc độ phù hợp rồi tham gia tự động."
      />

      <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="inline-flex items-center gap-1 mb-1">
              Tài khoản quét
              <span title="Tài khoản dùng để chạy Selenium quét & tham gia group">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Select
              options={[
                { value: '', label: '— Chọn tài khoản —' },
                ...accList.map((a: any) => ({
                  value: a.id,
                  label: `${a.username}${a.proxyIp ? ` (proxy: ${a.proxyIp})` : ''}`,
                })),
              ]}
              value={accountId}
              onChange={setAccountId}
              placeholder="— Chọn tài khoản —"
              aria-label="Tài khoản quét"
              showSearch={accList.length > 8}
            />
          </div>
          <div>
            <Label className="mb-1">Số group tối đa</Label>
            <Select
              options={[
                { value: '10', label: '10 group' },
                { value: '20', label: '20 group' },
                { value: '50', label: '50 group' },
              ]}
              value={String(maxResults)}
              onChange={(v) => setMaxResults(Number(v))}
              placeholder="Số group"
              aria-label="Số group tối đa"
              showSearch={false}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Từ khoá ví dụ: Nhà hàng Đà Nẵng, Chợ dân sinh…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="flex-1"
          />
          <Button
            onClick={handleScan}
            disabled={scanReq.isPending || !keyword.trim() || !accountId}
            className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
          >
            {scanReq.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Search className="w-4 h-4 mr-2" />}
            {scanReq.isPending ? 'Đang quét…' : 'Quét Group'}
          </Button>
        </div>
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} group${hasFilter ? ' (đã lọc)' : ''}`}
      >
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
            title="Không tải được kết quả quét"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Users}
            title={
              isFilteredEmpty
                ? 'Không có group khớp bộ lọc'
                : scanReq.isPending
                  ? 'Đang quét group…'
                  : 'Chưa có group nào'
            }
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Nhập từ khoá và bấm Quét Group để bắt đầu.'
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
