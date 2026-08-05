import { useMemo, useState } from 'react'
import { useScanComments, useComments } from '../hooks/useAI'
import { Button, PageHeader, EmptyState, ErrorState, Select } from '@frezo/ui'
import { MessageCircle, Loader2, CheckCircle, XCircle, Search, HelpCircle } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'

const intentColors: Record<string, string> = {
  ask_price: 'text-blue-700 bg-blue-50 border-blue-200',
  ask_order: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ask_info: 'text-violet-700 bg-violet-50 border-violet-200',
  spam: 'text-rose-700 bg-rose-50 border-rose-200',
  positive: 'text-teal-700 bg-teal-50 border-teal-200',
  negative: 'text-orange-700 bg-orange-50 border-orange-200',
  unknown: 'text-neutral-500 bg-neutral-50 border-neutral-200',
}

const intentLabels: Record<string, string> = {
  ask_price: 'Hỏi giá',
  ask_order: 'Đặt hàng',
  ask_info: 'Hỏi thông tin',
  spam: 'Spam',
  positive: 'Tích cực',
  negative: 'Tiêu cực',
  unknown: 'Chưa xác định',
}

export function CommentsPage() {
  const { data, isLoading, isError, isFetching, refetch } = useComments()
  const scanReq = useScanComments()
  const [search, setSearch] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('ALL')
  const [repliedFilter, setRepliedFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL')

  const comments = useMemo(
    () => (Array.isArray(data?.comments) ? data.comments : []),
    [data],
  )

  const filtered = useMemo(() => {
    let rows = comments
    if (intentFilter !== 'ALL') {
      rows = rows.filter((c: any) => c.intent === intentFilter)
    }
    if (repliedFilter === 'YES') rows = rows.filter((c: any) => c.is_replied)
    if (repliedFilter === 'NO') rows = rows.filter((c: any) => !c.is_replied)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((c: any) =>
        (c.author || '').toLowerCase().includes(q) ||
        (c.text || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [comments, search, intentFilter, repliedFilter])

  const hasFilter = !!search.trim() || intentFilter !== 'ALL' || repliedFilter !== 'ALL'
  const isFullyEmpty = !isLoading && !isError && comments.length === 0
  const isFilteredEmpty = !isLoading && !isError && comments.length > 0 && filtered.length === 0

  const columns: AppTableColumn<any>[] = [
    {
      key: 'author',
      title: 'Tác giả',
      render: (_, c) => <span className="text-sm font-medium">{c.author}</span>,
    },
    {
      key: 'text',
      title: 'Nội dung',
      render: (_, c) => (
        <span className="text-sm text-neutral-600 max-w-xs truncate block" title={c.text}>
          {c.text}
        </span>
      ),
    },
    {
      key: 'intent',
      title: 'Ý định',
      align: 'center',
      render: (_, c) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${intentColors[c.intent] || intentColors.unknown}`}>
          {intentLabels[c.intent] || c.intent}
        </span>
      ),
    },
    {
      key: 'reply',
      title: 'Đã trả lời',
      align: 'center',
      render: (_, c) =>
        c.is_replied ? (
          <span className="text-emerald-600 text-xs font-medium" title={c.reply || ''}>
            Có — {(c.reply || '').slice(0, 40)}{(c.reply || '').length > 40 ? '…' : ''}
          </span>
        ) : (
          <span className="text-neutral-400 text-xs">Chưa</span>
        ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý bình luận"
        description="Quét và trả lời bình luận tự động bằng AI."
        actions={
          <Button
            onClick={() => scanReq.mutate(20)}
            disabled={scanReq.isPending}
            className="bg-primary-600 hover:bg-primary-700 text-white whitespace-nowrap gap-1.5"
            title="Quét tối đa 20 bình luận mới"
          >
            {scanReq.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <MessageCircle className="w-4 h-4" />}
            {scanReq.isPending ? 'Đang quét…' : 'Quét comment mới'}
          </Button>
        }
      />

      {scanReq.data && (
        <div className="space-y-2">
          <h2 className="font-semibold text-neutral-800 text-sm inline-flex items-center gap-1">
            Kết quả quét
            <span title="Chỉ hiện bình luận không bị bỏ qua">
              <HelpCircle size={12} className="text-neutral-400" />
            </span>
          </h2>
          <div className="grid gap-2">
            {(scanReq.data as any).results?.filter((r: any) => r.status !== 'skipped').map((r: any, i: number) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  r.status === 'replied' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.status === 'replied'
                    ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                    : <XCircle className="w-4 h-4 text-rose-600" />}
                  <span className="font-medium text-sm">{r.author}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 border">
                    {r.status === 'replied' ? 'Đã trả lời' : r.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 ml-6 mt-1">"{r.text}"</p>
                {r.reply && <p className="text-sm text-emerald-700 ml-6 mt-1">→ {r.reply}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => { setSearch(''); setIntentFilter('ALL'); setRepliedFilter('ALL') }}
        countLabel={`${filtered.length} bình luận${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả ý định' },
              ...Object.entries(intentLabels).map(([k, label]) => ({ value: k, label })),
            ]}
            value={intentFilter}
            onChange={setIntentFilter}
            placeholder="Ý định"
            aria-label="Lọc ý định"
            showSearch={false}
          />
        </div>
        <div className="min-w-[140px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'YES', label: 'Đã trả lời' },
              { value: 'NO', label: 'Chưa trả lời' },
            ]}
            value={repliedFilter}
            onChange={(v) => setRepliedFilter(v as typeof repliedFilter)}
            placeholder="Đã trả lời"
            aria-label="Lọc đã trả lời"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm tác giả hoặc nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm bình luận"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được bình luận"
            message="Kiểm tra kết nối AI service rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={MessageCircle}
            title={isFilteredEmpty ? 'Không có comment khớp bộ lọc' : 'Chưa có comment nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi điều kiện.'
                : 'Bấm Quét comment mới để bắt đầu.'
            }
            action={
              isFilteredEmpty
                ? {
                    label: 'Xoá lọc',
                    onClick: () => { setSearch(''); setIntentFilter('ALL'); setRepliedFilter('ALL') },
                  }
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
