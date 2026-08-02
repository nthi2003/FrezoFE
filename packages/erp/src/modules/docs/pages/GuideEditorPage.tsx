// ============================================================
// GuideEditorPage — soạn Markdown + Preview + Xuất bản (FR-DOC-04)
// Toolbar: Chèn ảnh (upload MinIO) / dán URL ảnh.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ImagePlus, Link2, Loader2, Save } from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Textarea,
  AppModal,
  Skeleton,
} from '@frezo/ui'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/lib/hooks/usePermission'
import { pickAndUploadImage } from '@/lib/upload'
import { MarkdownView } from '../components/MarkdownView'
import {
  useAdminGuide,
  useCreateGuide,
  usePublishGuide,
  useUnpublishGuide,
  useUpdateGuide,
} from '../hooks/useGuides'

export function GuideEditorPage() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const user = useAuthStore((s) => s.user)
  const isAdmin =
    !!user?.isAdmin ||
    user?.username === 'admin' ||
    !!user?.roles?.includes('ADMIN') ||
    !!user?.roles?.includes('SUPER_ADMIN')
  const canCreate = usePermission('QTHT.GUIDES.CREATE')
  const canUpdate = usePermission('QTHT.GUIDES.UPDATE')
  const canManage = isAdmin || canCreate || canUpdate

  const { data: existing, isLoading } = useAdminGuide(isNew ? undefined : id)
  const createReq = useCreateGuide()
  const updateReq = useUpdateGuide()
  const publishReq = usePublishGuide()
  const unpublishReq = useUnpublishGuide()

  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [module, setModule] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [body, setBody] = useState('')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [urlModalOpen, setUrlModalOpen] = useState(false)
  const [imgUrl, setImgUrl] = useState('')
  const [imgAlt, setImgAlt] = useState('')

  useEffect(() => {
    if (!existing) return
    setSlug(existing.slug || '')
    setTitle(existing.title || '')
    setSummary(existing.summary || '')
    setModule(existing.module || '')
    setSortOrder(String(existing.sortOrder ?? 0))
    setBody(existing.body || '')
  }, [existing])

  const payload = useMemo(
    () => ({
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim() || undefined,
      module: module.trim() || undefined,
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      body,
    }),
    [slug, title, summary, module, sortOrder, body],
  )

  const saving = createReq.isPending || updateReq.isPending
  const canSave = !!payload.slug && !!payload.title && !!payload.body.trim()

  const insertAtCursor = (snippet: string) => {
    const el = bodyRef.current
    if (!el) {
      setBody((prev) => (prev ? `${prev}\n\n${snippet}\n` : `${snippet}\n`))
      return
    }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? start
    const next = body.slice(0, start) + snippet + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + snippet.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleInsertUploadedImage = async () => {
    setUploadingImg(true)
    try {
      const url = await pickAndUploadImage({ folder: 'guides', maxSizeMB: 5 })
      if (!url) return
      insertAtCursor(`\n![Hình minh họa](${url})\n`)
      toast.success('Đã chèn ảnh vào nội dung — xem tab Xem trước')
      setTab('edit')
    } finally {
      setUploadingImg(false)
    }
  }

  const handleInsertUrlImage = () => {
    const url = imgUrl.trim()
    if (!url) {
      toast.error('Nhập URL ảnh')
      return
    }
    const alt = imgAlt.trim() || 'Hình minh họa'
    insertAtCursor(`\n![${alt}](${url})\n`)
    setUrlModalOpen(false)
    setImgUrl('')
    setImgAlt('')
    toast.success('Đã chèn ảnh từ URL')
  }

  const handleSave = () => {
    if (!canSave) return
    if (isNew) {
      createReq.mutate(
        { ...payload, published: false },
        {
          onSuccess: (res: any) => {
            const newId = res?.data?.id || res?.id
            if (newId) nav(`/admin/guides/${newId}/edit`, { replace: true })
            else nav('/admin/guides')
          },
        },
      )
    } else if (id) {
      updateReq.mutate({ id, data: payload })
    }
  }

  if (!canManage) {
    return (
      <div className="p-6 animate-fade-in">
        <EmptyState
          title="Không có quyền soạn hướng dẫn"
          description="Chỉ Admin / BA được chỉnh sửa nội dung hướng dẫn."
          action={{ label: 'Quay lại', onClick: () => nav('/admin/guides') }}
        />
      </div>
    )
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={isNew ? 'Thêm hướng dẫn' : 'Sửa hướng dẫn'}
        description="Soạn Markdown · chèn ảnh · xem trước · xuất bản khi sẵn sàng."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" className="gap-1.5" onClick={() => nav('/admin/guides')}>
              <ArrowLeft size={14} /> Danh sách
            </Button>
            {!isNew && existing && (
              existing.published ? (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  disabled={unpublishReq.isPending}
                  onClick={() => unpublishReq.mutate(id!)}
                >
                  <EyeOff size={14} /> Gỡ xuất bản
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  disabled={publishReq.isPending || saving || !canSave}
                  onClick={() => {
                    updateReq.mutate(
                      { id: id!, data: payload },
                      { onSuccess: () => publishReq.mutate(id!) },
                    )
                  }}
                >
                  <Eye size={14} /> Xuất bản
                </Button>
              )
            )}
            <Button className="gap-1.5" disabled={saving || !canSave} onClick={handleSave}>
              <Save size={14} /> {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="guide-slug">Slug *</Label>
          <Input
            id="guide-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="guide-qlts"
            disabled={!isNew}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guide-title">Tiêu đề *</Label>
          <Input
            id="guide-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quản lý tài sản"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guide-module">Module</Label>
          <Input
            id="guide-module"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            placeholder="Tài sản"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guide-order">Thứ tự</Label>
          <Input
            id="guide-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="guide-summary">Mô tả ngắn (list hub)</Label>
          <Input
            id="guide-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Một câu tiếng đời thường…"
          />
        </div>
      </div>

      <div className="inline-flex items-center rounded-md border border-neutral-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setTab('edit')}
          className={`px-3 h-8 text-sm font-medium rounded transition ${
            tab === 'edit'
              ? 'bg-primary-50 text-primary-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Soạn
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`px-3 h-8 text-sm font-medium rounded transition ${
            tab === 'preview'
              ? 'bg-primary-50 text-primary-700'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Xem trước
        </button>
      </div>

      {tab === 'edit' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="text-xs text-neutral-500 mr-1">Chèn vào nội dung:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={uploadingImg}
              onClick={handleInsertUploadedImage}
            >
              {uploadingImg ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ImagePlus size={14} />
              )}
              {uploadingImg ? 'Đang tải ảnh…' : 'Chèn ảnh'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setUrlModalOpen(true)}
            >
              <Link2 size={14} /> Chèn URL ảnh
            </Button>
            <span className="text-xs text-neutral-400">
              PNG/JPG/WebP ≤ 5MB · hiện ở tab Xem trước
            </span>
          </div>
          <Textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={22}
            className="font-mono text-sm"
            placeholder={'## Việc cần làm\n\n1. Vào menu **…**\n2. Bấm **…**\n\n![Mô tả ảnh](https://…)'}
          />
        </div>
      ) : (
        <article className="bg-white border border-neutral-200 rounded-xl p-6 min-h-[320px]">
          {body.trim() ? (
            <MarkdownView source={body} skipFirstH1 />
          ) : (
            <p className="text-sm text-neutral-400">Chưa có nội dung để xem trước.</p>
          )}
        </article>
      )}

      <AppModal
        isOpen={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        title="Chèn ảnh từ URL"
        description="Dán đường dẫn ảnh công khai. Ảnh hiện ở tab Xem trước."
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="img-url">URL ảnh *</Label>
            <Input
              id="img-url"
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
              placeholder="https://… hoặc /media/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="img-alt">Mô tả ngắn (alt)</Label>
            <Input
              id="img-alt"
              value={imgAlt}
              onChange={(e) => setImgAlt(e.target.value)}
              placeholder="Ví dụ: Màn hình Cấu hình luồng duyệt"
            />
          </div>
          {imgUrl.trim() && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              <img
                src={imgUrl.trim()}
                alt={imgAlt || 'Xem trước'}
                className="max-h-40 mx-auto rounded object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setUrlModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleInsertUrlImage}>Chèn vào bài</Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
