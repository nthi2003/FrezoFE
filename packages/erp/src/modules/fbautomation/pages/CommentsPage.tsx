import { useMemo, useState } from 'react'
import { Plus, RefreshCw, Shield, MessageSquare, Flag, EyeOff } from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, AppModal, Input, Label, Select, RowActions, StatusBadge,
} from '@frezo/ui'
import { Can, usePermission } from '@/lib/permissions'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useModeratedComments, useCommentRules, useCommentsDashboard,
  useCreateComment, useCreateCommentRule, useModerateComment,
  useDeleteComment, useDeleteCommentRule,
} from '../hooks/useMkt'

const STATUS_CFG: Record<string, { label: string; color: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'Chờ duyệt', color: 'warning' },
  HIDDEN: { label: 'Đã ẩn', color: 'neutral' },
  REPLIED: { label: 'Đã trả lời', color: 'success' },
  IGNORED: { label: 'Bỏ qua', color: 'info' },
  FLAGGED: { label: 'Cờ đỏ', color: 'danger' },
}

export function CommentsPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showComment, setShowComment] = useState(false)
  const [showRule, setShowRule] = useState(false)

  const canModerate = usePermission('MKT_COMMENTS_ID_MODERATE_UPDATE')
  const canDeleteComment = usePermission('MKT_COMMENTS_ID_DELETE')
  const canDeleteRule = usePermission('MKT_COMMENTS_RULES_ID_DELETE')

  const moderate = useModerateComment()
  const deleteComment = useDeleteComment()
  const deleteRule = useDeleteCommentRule()

  const { data: dash } = useCommentsDashboard()
  const { data: commentsData, isLoading, isFetching, isError, refetch } = useModeratedComments()
  const { data: rulesData, refetch: refetchRules } = useCommentRules()

  const comments = useMemo(() => (Array.isArray(commentsData) ? commentsData : []), [commentsData])
  const rules = useMemo(() => (Array.isArray(rulesData) ? rulesData : []), [rulesData])
  const d: any = dash || {}

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return comments
    return comments.filter((c: any) => c.status === statusFilter)
  }, [comments, statusFilter])

  const commentCols: AppTableColumn<any>[] = [
    {
      key: 'content',
      title: 'Comment',
      render: (_, r) => (
        <div>
          <div className="text-sm text-neutral-900 line-clamp-2">{r.content}</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {r.authorName || 'Ẩn danh'} · {r.platform}
            {r.matchedRuleName ? ` · rule: ${r.matchedRuleName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'TT',
      width: 110,
      render: (_, r) => {
        const cfg = STATUS_CFG[r.status] || STATUS_CFG.PENDING
        return <StatusBadge label={cfg.label} color={cfg.color} />
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 180,
      render: (_, r) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'hide',
              icon: EyeOff,
              tooltip: 'Ẩn',
              tone: 'amber',
              hidden: !canModerate,
              onClick: () => moderate.mutate({ id: r.id, action: 'HIDE' }),
            },
            {
              key: 'flag',
              icon: Flag,
              tooltip: 'Cờ',
              tone: 'rose',
              hidden: !canModerate,
              onClick: () => moderate.mutate({ id: r.id, action: 'FLAG' }),
            },
            {
              key: 'reply',
              icon: MessageSquare,
              tooltip: 'Trả lời',
              tone: 'emerald',
              hidden: !canModerate,
              onClick: () => {
                const text = window.prompt('Nội dung trả lời', r.replyText || '')
                if (text != null) moderate.mutate({ id: r.id, action: 'REPLY', replyText: text })
              },
            },
            {
              kind: 'delete',
              tooltip: 'Xoá',
              hidden: !canDeleteComment,
              onClick: () =>
                askConfirm({
                  title: 'Xoá comment?',
                  message: 'Comment sẽ bị xoá khỏi hàng đợi.',
                  confirmText: 'Xoá',
                  onConfirm: () => deleteComment.mutate(r.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  const ruleCols: AppTableColumn<any>[] = [
    {
      key: 'name',
      title: 'Rule',
      render: (_, r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-neutral-500 truncate max-w-xs">{r.keywords}</div>
        </div>
      ),
    },
    { key: 'action', title: 'Hành động', width: 90, render: (_, r) => r.action },
    {
      key: 'enabled',
      title: 'Bật',
      width: 80,
      render: (_, r) => <StatusBadge label={r.enabled ? 'Bật' : 'Tắt'} color={r.enabled ? 'success' : 'neutral'} />,
    },
    { key: 'hitCount', title: 'Hit', width: 70, align: 'right', render: (_, r) => r.hitCount ?? 0 },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 60,
      render: (_, r) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'delete',
              tooltip: 'Xoá rule',
              hidden: !canDeleteRule,
              onClick: () =>
                askConfirm({
                  title: 'Xoá rule?',
                  message: `Rule “${r.name}” sẽ bị xoá.`,
                  confirmText: 'Xoá',
                  onConfirm: () => deleteRule.mutate(r.id),
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
        title="Kiểm duyệt Comment"
        description="Rule từ khoá + hàng đợi comment (MVP offline). Webhook Meta feed sẽ nối sau khi có Page Token."
        actions={
          <>
            <Button variant="outline" onClick={() => { refetch(); refetchRules() }} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
              Làm mới
            </Button>
            <Can permission="MKT_COMMENTS_RULES_CREATE">
              <Button variant="outline" onClick={() => setShowRule(true)}>
                <Shield size={16} className="mr-2" />
                Thêm rule
              </Button>
            </Can>
            <Can permission="MKT_COMMENTS_CREATE">
              <Button onClick={() => setShowComment(true)}>
                <Plus size={16} className="mr-2" />
                Thêm comment
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Tổng" value={d.totalComments ?? comments.length} />
        <Kpi label="Chờ duyệt" value={d.pending ?? 0} />
        <Kpi label="Cờ đỏ" value={d.flagged ?? 0} />
        <Kpi label="Đã ẩn" value={d.hidden ?? 0} />
        <Kpi label="Rule bật" value={`${d.enabledRules ?? 0}/${d.totalRules ?? 0}`} />
      </div>

      <FilterBar
        hasActiveFilters={statusFilter !== 'ALL'}
        onClear={() => setStatusFilter('ALL')}
        countLabel={`${filtered.length} comment`}
      >
        <Select
          options={[
            { value: 'ALL', label: 'Mọi trạng thái' },
            { value: 'PENDING', label: 'Chờ duyệt' },
            { value: 'FLAGGED', label: 'Cờ đỏ' },
            { value: 'HIDDEN', label: 'Đã ẩn' },
            { value: 'REPLIED', label: 'Đã trả lời' },
            { value: 'IGNORED', label: 'Bỏ qua' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {isError ? (
        <ErrorState title="Không tải được comment" onRetry={() => refetch()} />
      ) : !isLoading && filtered.length === 0 ? (
        <EmptyState title="Hàng đợi trống" description="Thêm comment thủ công hoặc đợi webhook Meta." />
      ) : (
        <AppTable columns={commentCols} data={filtered} loading={isLoading} rowKey={(r) => r.id} pageSize={10} />
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-800">Rule từ khoá</h3>
        {rules.length === 0 ? (
          <EmptyState title="Chưa có rule" description="Tạo rule để tự gắn cờ khi nội dung chứa từ khoá." />
        ) : (
          <AppTable columns={ruleCols} data={rules} rowKey={(r) => r.id} pageSize={10} />
        )}
      </div>

      <CreateCommentModal open={showComment} onClose={() => setShowComment(false)} />
      <CreateRuleModal open={showRule} onClose={() => setShowRule(false)} />
      {confirmDialog}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function CreateCommentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateComment()
  const [form, setForm] = useState({ authorName: '', content: '', platform: 'FACEBOOK', postUrl: '' })
  return (
    <AppModal isOpen={open} onClose={onClose} title="Thêm comment vào hàng đợi" maxWidth="lg">
      <div className="space-y-3">
        <div>
          <Label>Tác giả</Label>
          <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
        </div>
        <div>
          <Label>Nội dung</Label>
          <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div>
          <Label>URL bài viết</Label>
          <Input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button
          disabled={!form.content.trim() || create.isPending}
          onClick={() => create.mutate(form, { onSuccess: onClose })}
        >
          Lưu
        </Button>
      </div>
    </AppModal>
  )
}

function CreateRuleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateCommentRule()
  const [form, setForm] = useState({ name: '', keywords: '', action: 'FLAG', replyTemplate: '' })
  return (
    <AppModal isOpen={open} onClose={onClose} title="Thêm rule kiểm duyệt" maxWidth="lg">
      <div className="space-y-3">
        <div>
          <Label>Tên rule</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Từ khoá (phân tách bởi dấu phẩy)</Label>
          <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="spam, lừa đảo, scammer" />
        </div>
        <div>
          <Label>Hành động</Label>
          <Select
            options={[
              { value: 'FLAG', label: 'Gắn cờ' },
              { value: 'HIDE', label: 'Ẩn' },
              { value: 'REPLY', label: 'Gợi ý trả lời' },
            ]}
            value={form.action}
            onChange={(v) => setForm({ ...form, action: v })}
          />
        </div>
        {form.action === 'REPLY' ? (
          <div>
            <Label>Mẫu trả lời</Label>
            <Input value={form.replyTemplate} onChange={(e) => setForm({ ...form, replyTemplate: e.target.value })} />
          </div>
        ) : null}
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button
          disabled={!form.name.trim() || !form.keywords.trim() || create.isPending}
          onClick={() => create.mutate(form, { onSuccess: onClose })}
        >
          Lưu
        </Button>
      </div>
    </AppModal>
  )
}

export default CommentsPage
