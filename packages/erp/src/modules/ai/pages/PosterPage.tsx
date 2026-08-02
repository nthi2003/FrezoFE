import { useMemo, useState } from 'react'
import { usePostToGroups, usePosts, useGroups } from '../hooks/useAI'
import { Button, Input, PageHeader, EmptyState, ErrorState, Label, Select } from '@frezo/ui'
import { Send, Loader2, CheckCircle, XCircle, FileText, Search, HelpCircle } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'

const STATUS_LABEL: Record<string, string> = {
  posted: 'Đã đăng',
  failed: 'Lỗi',
  pending: 'Chờ xử lý',
  dry_run: 'Chạy thử',
}

export function PosterPage() {
  const [topic, setTopic] = useState('')
  const [maxPosts, setMaxPosts] = useState(5)
  const [dryRun, setDryRun] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'posted' | 'failed' | 'pending'>('ALL')

  const { data: groupsData } = useGroups('approved')
  const { data: postsData, isLoading, isError, isFetching, refetch } = usePosts()
  const postReq = usePostToGroups()

  const posts = useMemo(
    () => (Array.isArray(postsData?.posts) ? postsData.posts : []),
    [postsData],
  )
  const approvedCount = groupsData?.groups?.length || 0

  const filtered = useMemo(() => {
    let rows = posts
    if (statusFilter !== 'ALL') {
      rows = rows.filter((p: any) => p.status === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((p: any) => (p.content || '').toLowerCase().includes(q))
    }
    return rows
  }, [posts, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && posts.length === 0
  const isFilteredEmpty = !isLoading && !isError && posts.length > 0 && filtered.length === 0

  const handlePost = () => {
    if (!topic.trim()) return
    postReq.mutate({ topic: topic.trim(), maxPosts, dryRun })
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'content',
      title: 'Nội dung',
      render: (_, p) => (
        <span className="text-sm text-neutral-700 line-clamp-2" title={p.content}>
          {p.content}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, p) => {
        const cls =
          p.status === 'posted'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : p.status === 'failed'
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-amber-700 bg-amber-50 border-amber-200'
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            {STATUS_LABEL[p.status] || p.status}
          </span>
        )
      },
    },
    {
      key: 'posted_at',
      title: 'Thời gian',
      align: 'center',
      render: (_, p) => (
        <span className="text-sm text-neutral-500">
          {p.posted_at ? new Date(p.posted_at).toLocaleString('vi-VN') : '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Đăng bài tự động"
        description={`AI sinh nội dung và đăng lên các group đã duyệt (hiện có: ${approvedCount} group).`}
      />

      <div className="p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Label className="mb-1">Chủ đề bài viết</Label>
            <Input
              placeholder="VD: Rau sạch VietGAP hôm nay có xà lách rom…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 inline-flex items-center gap-1">
              Số group
              <span title="Số group tối đa sẽ đăng trong lần chạy này">
                <HelpCircle size={12} className="text-neutral-400" />
              </span>
            </Label>
            <Select
              options={[1, 3, 5, 10].map((n) => ({ value: String(n), label: String(n) }))}
              value={String(maxPosts)}
              onChange={(v) => setMaxPosts(Number(v))}
              placeholder="Số group"
              aria-label="Số group"
              showSearch={false}
              className="w-24"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600 h-9" title="Không đăng thật — chỉ xem nội dung AI sinh">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            Chạy thử
          </label>
          <Button
            onClick={handlePost}
            disabled={postReq.isPending || !topic.trim()}
            className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap"
          >
            {postReq.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Send className="w-4 h-4 mr-2" />}
            {postReq.isPending ? 'Đang đăng…' : dryRun ? 'Xem trước' : 'Đăng bài'}
          </Button>
        </div>
      </div>

      {postReq.data && (
        <div className="space-y-2">
          <h2 className="font-semibold text-neutral-800 text-sm">Kết quả lần chạy</h2>
          <div className="grid gap-2">
            {(postReq.data as any).results?.map((r: any, i: number) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  r.status === 'posted' || r.status === 'dry_run'
                    ? 'bg-emerald-50 border-emerald-200'
                    : r.status === 'failed'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {r.status === 'posted' || r.status === 'dry_run'
                    ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                    : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span className="font-medium text-sm">{r.group_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 border">
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                </div>
                {r.content && <p className="text-sm text-neutral-600 ml-6">{r.content.slice(0, 200)}…</p>}
                {r.error && <p className="text-sm text-rose-500 ml-6">{r.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setStatusFilter('ALL') }}
        countLabel={`${filtered.length} bài${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'posted', label: 'Đã đăng' },
              { value: 'pending', label: 'Chờ xử lý' },
              { value: 'failed', label: 'Lỗi' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm nội dung bài đăng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm bài đăng"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được lịch sử đăng bài"
            message="Kiểm tra kết nối AI service rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={isFilteredEmpty ? 'Không có bài khớp bộ lọc' : 'Chưa có bài đăng nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Nhập chủ đề và bấm Đăng bài để bắt đầu.'
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
    </div>
  )
}
