import { useMemo, useState } from 'react'
import { useScanGroups, useGroups, useDeleteGroup } from '../hooks/useAI'
import { Button, Input, PageHeader, EmptyState, ErrorState, Label, Select } from '@frezo/ui'
import { Search, Trash2, Loader2, Users, HelpCircle } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const statusConfig: Record<string, { label: string; color: string }> = {
  approved: { label: 'Đã duyệt', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pending: { label: 'Chờ duyệt', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  rejected: { label: 'Từ chối', color: 'text-rose-700 bg-rose-50 border-rose-200' },
}

export function GroupScannerPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [keyword, setKeyword] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const apiFilter = statusFilter === 'ALL' ? undefined : statusFilter
  const { data, isLoading, isError, isFetching, refetch } = useGroups(apiFilter)
  const scanReq = useScanGroups()
  const deleteReq = useDeleteGroup()

  const groups = useMemo(
    () => (Array.isArray(data?.groups) ? data.groups : []),
    [data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g: any) =>
      (g.name || '').toLowerCase().includes(q) ||
      String(g.group_id || '').toLowerCase().includes(q),
    )
  }, [groups, search])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && groups.length === 0
  const isFilteredEmpty = !isLoading && !isError && groups.length > 0 && filtered.length === 0

  const handleScan = () => {
    if (!keyword.trim()) return
    scanReq.mutate({ keyword: keyword.trim(), maxResults })
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'name',
      title: 'Tên group',
      render: (_, g) => <span className="font-medium text-neutral-900">{g.name}</span>,
    },
    {
      key: 'group_id',
      title: 'Group ID',
      render: (_, g) => <span className="font-mono text-xs text-neutral-500">{g.group_id}</span>,
    },
    {
      key: 'score',
      title: 'Độ phù hợp',
      align: 'center',
      render: (_, g) => {
        const score = Number(((g.score || 0) * 100).toFixed(0))
        const cls =
          score >= 70
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : score >= 40
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            {score}%
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
      width: 80,
      render: (_, g) => (
        <Button
          variant="ghost"
          size="icon"
          title="Xoá group"
          onClick={() =>
            askConfirm({
              title: 'Xoá group này?',
              message: `Group "${g.name}" sẽ bị xoá khỏi danh sách.`,
              confirmText: 'Xoá',
              onConfirm: () => deleteReq.mutate(g.id),
            })
          }
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quét Group Facebook (AI)"
        description="Nhập từ khoá để tìm group — AI tự phân tích và lọc độ phù hợp."
      />

      <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label className="mb-1 inline-flex items-center gap-1">
              Từ khoá
              <span title="VD: Nhà hàng Đà Nẵng, Nguồn hàng F&B">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Input
              placeholder="Nhập từ khoá…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
          </div>
          <div className="w-full sm:w-40">
            <Label className="mb-1">Số kết quả</Label>
            <Select
              options={[
                { value: '10', label: '10 group' },
                { value: '20', label: '20 group' },
                { value: '50', label: '50 group' },
              ]}
              value={String(maxResults)}
              onChange={(v) => setMaxResults(Number(v))}
              placeholder="Số kết quả"
              aria-label="Số kết quả"
              showSearch={false}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleScan}
              disabled={scanReq.isPending || !keyword.trim()}
              className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap w-full sm:w-auto"
            >
              {scanReq.isPending
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Search className="w-4 h-4 mr-2" />}
              {scanReq.isPending ? 'Đang quét…' : 'Quét Group'}
            </Button>
          </div>
        </div>
      </div>

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} group${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'rejected', label: 'Từ chối' },
            ]}
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
            message="Kiểm tra kết nối AI service rồi thử lại."
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
