import { useMemo, useState } from 'react'
import { Plus, RefreshCw, Star, MessageSquare } from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, AppModal, Input, Label, Select, RowActions, StatusBadge,
} from '@frezo/ui'
import { Can, usePermission } from '@/lib/permissions'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  usePageReviews, useReviewsDashboard, useCreatePageReview, useReplyPageReview, useDeletePageReview,
} from '../hooks/useMkt'

const STATUS_CFG: Record<string, { label: string; color: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  NEW: { label: 'Mới', color: 'warning' },
  ACKNOWLEDGED: { label: 'Đã xem', color: 'info' },
  REPLIED: { label: 'Đã trả lời', color: 'success' },
  ARCHIVED: { label: 'Lưu trữ', color: 'neutral' },
}

export function ReviewsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const reply = useReplyPageReview()
  const deleteReview = useDeletePageReview()

  const canReply = usePermission('MKT_REVIEWS_ID_REPLY_UPDATE')
  const canDelete = usePermission('MKT_REVIEWS_ID_DELETE')

  const { data: dash } = useReviewsDashboard()
  const { data, isLoading, isFetching, isError, refetch } = usePageReviews()
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const d: any = dash || {}

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return rows
    return rows.filter((r: any) => r.status === statusFilter)
  }, [rows, statusFilter])

  const columns: AppTableColumn<any>[] = [
    {
      key: 'rating',
      title: '★',
      width: 70,
      render: (_, r) => (
        <span className={r.lowRating ? 'text-red-600 font-bold' : 'text-amber-600 font-semibold'}>
          {r.rating}★
        </span>
      ),
    },
    {
      key: 'content',
      title: 'Đánh giá',
      render: (_, r) => (
        <div>
          <div className="text-sm text-neutral-900 line-clamp-2">{r.content || '(không có nội dung)'}</div>
          <div className="text-xs text-neutral-500">{r.authorName || 'Ẩn danh'} · {r.platform}</div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'TT',
      width: 110,
      render: (_, r) => {
        const cfg = STATUS_CFG[r.status] || STATUS_CFG.NEW
        return <StatusBadge label={cfg.label} color={cfg.color} />
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 100,
      render: (_, r) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'reply',
              icon: MessageSquare,
              tooltip: 'Trả lời',
              tone: 'emerald',
              hidden: !canReply,
              onClick: () => {
                const text = window.prompt('Nội dung trả lời', r.replyText || '')
                if (text) reply.mutate({ id: r.id, replyText: text })
              },
            },
            {
              kind: 'delete',
              tooltip: 'Xoá',
              hidden: !canDelete,
              onClick: () =>
                askConfirm({
                  title: 'Xoá đánh giá?',
                  message: 'Đánh giá sẽ bị xoá khỏi danh sách.',
                  confirmText: 'Xoá',
                  onConfirm: () => deleteReview.mutate(r.id),
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
        title="Theo dõi đánh giá"
        description="Nhập và theo dõi review fanpage / Google. Alert khi ≤2★. Sync Meta sẽ bổ sung sau."
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
              Làm mới
            </Button>
            <Can permission="MKT_REVIEWS_CREATE">
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Thêm đánh giá
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Star} label="Tổng review" value={d.totalReviews ?? rows.length} />
        <Kpi icon={Star} label="Điểm TB" value={d.averageRating ?? 0} />
        <Kpi icon={Star} label="≤2★" value={d.lowRatingCount ?? 0} />
        <Kpi icon={MessageSquare} label="Chưa trả lời" value={d.newCount ?? 0} />
      </div>

      <FilterBar
        hasActiveFilters={statusFilter !== 'ALL'}
        onClear={() => setStatusFilter('ALL')}
        countLabel={`${filtered.length} đánh giá`}
      >
        <Select
          options={[
            { value: 'ALL', label: 'Mọi trạng thái' },
            { value: 'NEW', label: 'Mới' },
            { value: 'ACKNOWLEDGED', label: 'Đã xem' },
            { value: 'REPLIED', label: 'Đã trả lời' },
            { value: 'ARCHIVED', label: 'Lưu trữ' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {isError ? (
        <ErrorState title="Không tải được đánh giá" onRetry={() => refetch()} />
      ) : !isLoading && filtered.length === 0 ? (
        <EmptyState title="Chưa có đánh giá" description="Thêm review thủ công để theo dõi phản hồi khách." />
      ) : (
        <AppTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} pageSize={10} />
      )}

      <CreateReviewModal open={showCreate} onClose={() => setShowCreate(false)} />
      {confirmDialog}
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function CreateReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreatePageReview()
  const [form, setForm] = useState({
    platform: 'FACEBOOK',
    rating: 5,
    authorName: '',
    content: '',
    externalUrl: '',
  })
  return (
    <AppModal isOpen={open} onClose={onClose} title="Thêm đánh giá" maxWidth="lg">
      <div className="space-y-3">
        <div>
          <Label>Nền tảng</Label>
          <Select
            options={[
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'GOOGLE', label: 'Google' },
              { value: 'SHOPEE', label: 'Shopee' },
              { value: 'OTHER', label: 'Khác' },
            ]}
            value={form.platform}
            onChange={(v) => setForm({ ...form, platform: v })}
          />
        </div>
        <div>
          <Label>Số sao (1–5)</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </div>
        <div>
          <Label>Tác giả</Label>
          <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
        </div>
        <div>
          <Label>Nội dung</Label>
          <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div>
          <Label>URL gốc</Label>
          <Input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button disabled={create.isPending} onClick={() => create.mutate(form, { onSuccess: onClose })}>Lưu</Button>
      </div>
    </AppModal>
  )
}

export default ReviewsPage
