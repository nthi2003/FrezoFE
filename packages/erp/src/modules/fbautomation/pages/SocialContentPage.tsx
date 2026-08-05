// ============================================================
// MKT · Content Scheduler — lên lịch đăng bài đa kênh
// ------------------------------------------------------------
// Layout 2 cột:
//  - Trái: filter status/channel + list bài
//  - Phải: editor (title, content, media URL, thời gian đăng)
// Trạng thái: DRAFT / SCHEDULED / PUBLISHING / PUBLISHED / FAILED / CANCELLED
// ============================================================

import { useMemo, useState } from 'react'
import {
  Send, Calendar, Facebook, MessageCircle, Instagram, Video, Plus,
  Play, Ban, Clock, CheckCircle2, XCircle, FileEdit, Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, Input, Label, Textarea, Select, RowActions } from '@frezo/ui'
import { FilterBar } from '@/components/ui/FilterBar'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useSocialPosts, useCreateSocialPost, useUpdateSocialPost, useDeleteSocialPost,
  useSocialPostAction,
} from '../hooks/useMkt'

type ChannelKey = 'FACEBOOK_PAGE' | 'ZALO_OA' | 'INSTAGRAM' | 'TIKTOK'
type StatusKey  = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'

const CHANNEL_META: Record<ChannelKey, { label: string; icon: any; color: string; bg: string }> = {
  FACEBOOK_PAGE: { label: 'Facebook Page', icon: Facebook,       color: 'text-blue-600',   bg: 'bg-blue-50' },
  ZALO_OA:       { label: 'Zalo OA',       icon: MessageCircle,  color: 'text-sky-600',    bg: 'bg-sky-50' },
  INSTAGRAM:     { label: 'Instagram',     icon: Instagram,      color: 'text-pink-600',   bg: 'bg-pink-50' },
  TIKTOK:        { label: 'TikTok',        icon: Video,          color: 'text-neutral-800', bg: 'bg-neutral-100' },
}

const STATUS_META: Record<StatusKey, { label: string; color: string; icon: any }> = {
  DRAFT:      { label: 'Bản nháp',   color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: FileEdit },
  SCHEDULED:  { label: 'Chờ đăng',   color: 'bg-blue-100 text-blue-700 border-blue-200',           icon: Clock },
  PUBLISHING: { label: 'Đang đăng',  color: 'bg-amber-100 text-amber-700 border-amber-200',        icon: Loader2 },
  PUBLISHED:  { label: 'Đã đăng',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',  icon: CheckCircle2 },
  FAILED:     { label: 'Lỗi',        color: 'bg-rose-100 text-rose-700 border-rose-200',           icon: XCircle },
  CANCELLED:  { label: 'Đã hủy',     color: 'bg-neutral-100 text-neutral-500 border-neutral-200',  icon: Ban },
}

interface SocialPost {
  id: string
  channel: string
  targetId?: string
  targetName?: string
  title?: string
  content?: string
  mediaUrls?: string
  linkUrl?: string
  scheduledAt?: string
  publishedAt?: string
  status: string
  externalUrl?: string
  errorMessage?: string
  authorUsername?: string
  createdDate?: string
}

const EMPTY_FORM = {
  id: '',
  channel: 'FACEBOOK_PAGE' as ChannelKey,
  targetId: '',
  targetName: '',
  title: '',
  content: '',
  mediaUrls: '',
  linkUrl: '',
  scheduledAt: '',
}

export function SocialContentPage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all')
  const [channelFilter, setChannelFilter] = useState<ChannelKey | 'all'>('all')
  const [form, setForm] = useState(EMPTY_FORM)

  const {
    data: postsData, isLoading, refetch,
  } = useSocialPosts({
    status:  statusFilter  === 'all' ? undefined : statusFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
  })

  const createMut = useCreateSocialPost()
  const updateMut = useUpdateSocialPost()
  const deleteMut = useDeleteSocialPost()
  const actionMut = useSocialPostAction()

  const posts: SocialPost[] = postsData || []

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length }
    for (const p of posts) c[p.status] = (c[p.status] || 0) + 1
    return c
  }, [posts])

  const isEditing = !!form.id

  const resetForm = () => setForm(EMPTY_FORM)

  const loadPost = (p: SocialPost) => {
    setForm({
      id: p.id,
      channel: (p.channel as ChannelKey) || 'FACEBOOK_PAGE',
      targetId: p.targetId || '',
      targetName: p.targetName || '',
      title: p.title || '',
      content: p.content || '',
      mediaUrls: p.mediaUrls || '',
      linkUrl: p.linkUrl || '',
      scheduledAt: p.scheduledAt ? p.scheduledAt.slice(0, 16) : '',
    })
  }

  const submit = () => {
    if (!form.content?.trim() && !form.title?.trim()) {
      toast.error('Bài viết cần có ít nhất tiêu đề hoặc nội dung')
      return
    }
    const payload: any = {
      channel: form.channel,
      targetId: form.targetId || null,
      targetName: form.targetName || null,
      title: form.title || null,
      content: form.content || null,
      mediaUrls: form.mediaUrls || null,
      linkUrl: form.linkUrl || null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    }
    if (isEditing) {
      updateMut.mutate({ id: form.id, data: payload }, { onSuccess: resetForm })
    } else {
      createMut.mutate(payload, { onSuccess: resetForm })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        <PageHeader
          title="Lên lịch nội dung"
          description="Soạn & lên lịch đăng bài đa kênh (Facebook Page, Zalo OA, Instagram). Cần Meta App Review và mã trang để tự đăng."
          actions={
            <>
              <Button variant="outline" onClick={() => refetch()}>Làm mới</Button>
              <Button onClick={resetForm}>
                <Plus size={16} className="mr-2" /> Soạn mới
              </Button>
            </>
          }
        />

        {/* Config warning banner */}
        <ConfigNotice />

        <FilterBar
          hasActiveFilters={statusFilter !== 'all' || channelFilter !== 'all'}
          onClear={() => { setStatusFilter('all'); setChannelFilter('all') }}
          countLabel={`${posts.length} bài${statusFilter !== 'all' || channelFilter !== 'all' ? ' (đã lọc)' : ''}`}
        >
          <div className="min-w-[150px]">
            <Select
              options={[
                { value: 'all', label: `Tất cả trạng thái (${counts.all || 0})` },
                ...(Object.keys(STATUS_META) as StatusKey[]).map((k) => ({
                  value: k,
                  label: `${STATUS_META[k].label} (${counts[k] || 0})`,
                })),
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusKey | 'all')}
              placeholder="Trạng thái"
              aria-label="Lọc trạng thái"
              showSearch={false}
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              options={[
                { value: 'all', label: 'Tất cả kênh' },
                ...(Object.keys(CHANNEL_META) as ChannelKey[]).map((k) => ({
                  value: k,
                  label: CHANNEL_META[k].label,
                })),
              ]}
              value={channelFilter}
              onChange={(v) => setChannelFilter(v as ChannelKey | 'all')}
              placeholder="Kênh"
              aria-label="Lọc kênh"
              showSearch={false}
            />
          </div>
        </FilterBar>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LIST */}
          <div className="lg:col-span-3 space-y-3">
            {isLoading ? (
              <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                <Loader2 size={20} className="animate-spin mx-auto text-primary-600" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-neutral-200">
                <EmptyState
                  icon={Send}
                  title="Chưa có bài viết nào"
                  description="Bắt đầu bằng cách soạn bản nháp bên phải. Có thể lưu nháp không cần lên lịch, sau đó chỉnh dần."
                />
              </div>
            ) : (
              posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  isActive={form.id === p.id}
                  onSelect={() => loadPost(p)}
                  onDelete={() => {
                    askConfirm({
                      title: 'Xoá bài viết này?',
                      message: 'Bài viết sẽ bị xoá khỏi lịch đăng.',
                      confirmText: 'Xoá',
                      onConfirm: () => deleteMut.mutate(p.id),
                    })
                  }}
                  onDuplicate={() => actionMut.mutate({ id: p.id, action: 'duplicate' })}
                  onCancel={() => actionMut.mutate({ id: p.id, action: 'cancel' })}
                  onPublish={() => actionMut.mutate({ id: p.id, action: 'publish' })}
                />
              ))
            )}
          </div>

          {/* EDITOR */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-neutral-200 sticky top-6">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileEdit size={16} className="text-primary-600" />
                  <span className="font-semibold text-sm">
                    {isEditing ? 'Sửa bài viết' : 'Soạn bài mới'}
                  </span>
                </div>
                {isEditing && (
                  <Button variant="outline" onClick={resetForm}>
                    Bỏ chọn
                  </Button>
                )}
              </div>
              <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div>
                  <Label>Kênh đăng</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(Object.keys(CHANNEL_META) as ChannelKey[]).map((k) => {
                      const M = CHANNEL_META[k]
                      const on = form.channel === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setForm({ ...form, channel: k })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition ${
                            on
                              ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <M.icon size={14} className={on ? 'text-primary-600' : M.color} />
                          {M.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Target ID (Page ID)</Label>
                    <Input
                      placeholder="VD: 123456789"
                      value={form.targetId}
                      onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Target tên (hiển thị)</Label>
                    <Input
                      placeholder="VD: Frezo Fanpage"
                      value={form.targetName}
                      onChange={(e) => setForm({ ...form, targetName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Tiêu đề (optional)</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Nội dung</Label>
                  <Textarea
                    rows={8}
                    placeholder="Nội dung bài đăng..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                  <div className="text-xs text-neutral-400 mt-1 text-right">
                    {(form.content || '').length} ký tự
                  </div>
                </div>

                <div>
                  <Label>
                    <ImageIcon size={12} className="inline mr-1" />
                    URL media (nhiều ảnh cách nhau bằng dấu phẩy)
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="https://cdn.frezo.io/a.jpg, https://cdn.frezo.io/b.jpg"
                    value={form.mediaUrls}
                    onChange={(e) => setForm({ ...form, mediaUrls: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Link đính kèm</Label>
                  <Input
                    placeholder="https://frezo.io/landing"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  />
                </div>

                <div>
                  <Label>
                    <Calendar size={12} className="inline mr-1" /> Lên lịch đăng (để trống = lưu nháp)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  />
                  <div className="text-xs text-neutral-400 mt-1">
                    {form.scheduledAt
                      ? `Sẽ đăng lúc ${new Date(form.scheduledAt).toLocaleString('vi-VN')}`
                      : 'Chưa lên lịch — lưu ở trạng thái bản nháp'}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Huỷ</Button>
                <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin mr-2" />}
                  {form.scheduledAt
                    ? isEditing ? 'Cập nhật & lên lịch' : 'Lên lịch'
                    : isEditing ? 'Cập nhật nháp' : 'Lưu nháp'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirmDialog}
    </div>
  )
}

// ============================================================
// Sub components
// ============================================================
function ConfigNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
      <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-amber-900">
        <div className="font-semibold">Chưa cấu hình Page Access Token</div>
        <div className="text-xs text-amber-700 mt-1">
          Scheduler sẽ vẫn quét theo lịch, nhưng khi tới giờ chỉ chuyển sang trạng thái
          <b> ĐANG ĐĂNG</b> + gửi thông báo cho tác giả (để copy nội dung đăng thủ công).
          Set env <code className="bg-amber-100 px-1 rounded">FB_PAGE_TOKEN</code> khi có
          Meta App Review để publish tự động qua Graph API.
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post, isActive, onSelect, onDelete, onDuplicate, onCancel, onPublish,
}: {
  post: SocialPost
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onCancel: () => void
  onPublish: () => void
}) {
  const channel = CHANNEL_META[post.channel as ChannelKey] || {
    label: post.channel, icon: Send, color: 'text-neutral-600', bg: 'bg-neutral-50',
  }
  const status = STATUS_META[post.status as StatusKey] || STATUS_META.DRAFT
  const StatusIcon = status.icon
  const preview = (post.title || post.content || '').slice(0, 160)

  return (
    <div
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer ${
        isActive ? 'border-primary-400 ring-2 ring-primary-100' : 'border-neutral-200'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-md ${channel.bg} ${channel.color} flex items-center justify-center flex-shrink-0`}>
            <channel.icon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-neutral-700">
              {channel.label}
              {post.targetName && <span className="text-neutral-400"> · {post.targetName}</span>}
            </div>
            {post.scheduledAt && (
              <div className="text-xs text-neutral-500 mt-0.5">
                <Calendar size={11} className="inline mr-0.5" />
                {new Date(post.scheduledAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${status.color}`}
        >
          <StatusIcon size={10} className={post.status === 'PUBLISHING' ? 'animate-spin' : ''} />
          {status.label}
        </span>
      </div>
      <div className="text-sm text-neutral-800 line-clamp-3 mb-2">{preview || <i className="text-neutral-400">Chưa có nội dung</i>}</div>
      {post.errorMessage && (
        <div className="text-xs text-rose-600 bg-rose-50 rounded px-2 py-1 mb-2">
          {post.errorMessage}
        </div>
      )}
      <RowActions
        align="end"
        className="pt-2 border-t border-neutral-100"
        actions={[
          {
            key: 'cancel',
            icon: Ban,
            tooltip: 'Huỷ lịch',
            tone: 'amber',
            hidden: post.status !== 'SCHEDULED',
            onClick: onCancel,
          },
          {
            key: 'publish',
            icon: Play,
            tooltip: 'Đăng ngay',
            tone: 'emerald',
            hidden: !(post.status === 'DRAFT' || post.status === 'SCHEDULED'),
            onClick: onPublish,
          },
          { kind: 'copy', tooltip: 'Nhân bản', onClick: onDuplicate },
          { kind: 'delete', tooltip: 'Xoá', onClick: onDelete },
        ]}
      />
    </div>
  )
}

export default SocialContentPage
