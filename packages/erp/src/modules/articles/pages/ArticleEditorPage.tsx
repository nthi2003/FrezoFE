import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Loader2, Trash2, FileText, Calendar as CalendarIcon,
  Tag as TagIcon, User as UserIcon, Image as ImageIcon, Info, Send, Archive,
  CheckCircle2, Globe, Building2,
} from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  Input,
  Label,
  Select,
  StatusBadge,
  RichTextEditor,
  ImageUploader,
  PageGuideButton,
  Portal,
  Switch,
  type PageGuideConfig,
  type StatusConfig,
} from '@frezo/ui'
import { unwrapList } from '@frezo/utils'
import { ExportMenu } from '@/lib/export'
import { makeImageUploader, pickAndUploadImage } from '@/lib/upload'

import {
  useArticleById,
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
  useArticleManagers,
  useSubmitArticle,
  useReviewArticle,
  usePublishArticle,
} from '../hooks/useArticle'
import {
  articleFormSchema,
  type ArticleFormValues,
  toArticleCreatePayload,
  toArticleUpdatePayload,
} from '../constants/schema'
import { usePermission } from '@/lib/hooks/usePermission'
import { Can, PermissionButton } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { personApi } from '@/modules/qlns/services/personApi'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
import { useNewsCategories, useCreateNewsCategory } from '@/modules/news/hooks/useNews'
import { toast } from 'sonner'

// ============================================================
// Config
// ============================================================

type ArticleStatus =
  | 'DRAFT'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'DELETED'

const STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { label: 'Bản nháp', color: 'neutral', icon: FileText },
  WAITING_APPROVAL: { label: 'Chờ duyệt', color: 'warning', icon: Send },
  APPROVED: { label: 'Đã duyệt', color: 'success', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'danger', icon: Archive },
  PUBLISHED: { label: 'Đã xuất bản', color: 'success', icon: CheckCircle2 },
  ARCHIVED: { label: 'Lưu trữ', color: 'warning', icon: Archive },
  DELETED: { label: 'Đã xóa', color: 'neutral', icon: Archive },
}

const TYPE_OPTIONS = [
  { value: 'NEWS', label: 'Tin tức' },
  { value: 'BLOG', label: 'Bài blog' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'GUIDE', label: 'Hướng dẫn' },
  { value: 'OTHER', label: 'Khác' },
]

const PUBLISH_SCOPE_OPTIONS = [
  {
    value: 'INTERNAL',
    label: 'Nội bộ (intranet)',
  },
  {
    value: 'PUBLIC',
    label: 'Công khai (landing)',
  },
]

const EDITOR_GUIDE: PageGuideConfig = {
  title: 'Soạn bài viết',
  subtitle: 'Một form cho tin nội bộ và bài công khai. Chọn phạm vi xuất bản rồi gửi duyệt.',
  docHref: '/docs/guide-articles',
  sections: [
    {
      heading: 'Tạo bài mới',
      type: 'steps',
      steps: [
        {
          title: 'Nhập tiêu đề và nội dung',
          description: 'Hai ô bắt buộc. Không cần nhập mã bài — hệ thống tự tạo sau khi lưu.',
        },
        {
          title: 'Chọn phạm vi xuất bản',
          description:
            'Nội bộ → hiển thị trên /bai-viet (nhân viên). Công khai → landing + intranet sau khi xuất bản.',
        },
        {
          title: 'Chọn người duyệt',
          description: 'Bắt buộc trước khi Gửi duyệt. Chỉ người này được Duyệt / Xuất bản.',
        },
        {
          title: 'Lưu nháp → Gửi duyệt → Duyệt → Xuất bản',
          description:
            'Bản nháp → Chờ duyệt → Đã duyệt → Đã xuất bản. Từ chối thì sửa rồi gửi lại.',
        },
      ],
    },
    {
      heading: 'Liên quan',
      type: 'links',
      links: [{ label: 'Hướng dẫn đầy đủ', href: '/docs/guide-articles' }],
    },
  ],
}

// ============================================================
// Editor Page
// ============================================================

export function ArticleEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const canCreate = usePermission('QTBV.ARTICLES.CREATE')
  const canUpdate = usePermission('QTBV.ARTICLES.UPDATE')
  const canDelete = usePermission('QTBV.ARTICLES.DELETE')
  const canSubmit = usePermission('QTBV.ARTICLES.SUBMIT') || canUpdate
  const canReview = usePermission('QTBV.ARTICLES.REVIEW')
  const canPublish = usePermission('QTBV.ARTICLES.PUBLISH')
  const myPersonId = useAuthStore((s) => s.user?.personId)

  const { data: raw, isLoading: isFetching } = useArticleById(id || '')
  const createReq = useCreateArticle()
  const updateReq = useUpdateArticle()
  const deleteReq = useDeleteArticle()
  const submitReq = useSubmitArticle()
  const reviewReq = useReviewArticle()
  const publishReq = usePublishArticle()
  const { data: managerOptions = [] } = useArticleManagers()

  // ── Combobox data: Persons (tác giả) + Organizations (đơn vị) ──
  const { data: personOptions = [] } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: (res: any) => {
      const items = unwrapList(res)
      return items.map((p: any) => ({
        value: p.value ?? p.id ?? p.code ?? '',
        label: p.label ?? p.name ?? p.fullName ?? p.value ?? '',
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
  const { data: orgOptions = [] } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
    select: (res: any) => {
      const items = unwrapList(res)
      return items.map((o: any) => ({
        value: o.value ?? o.id ?? o.code ?? '',
        label: o.label ?? o.name ?? o.value ?? '',
      }))
    },
    staleTime: 5 * 60 * 1000,
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState<null | (() => void)>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)

  const initial = useMemo(() => {
    const anyData = raw as any
    if (!anyData) return null
    if (anyData?.data && typeof anyData.data === 'object' && !Array.isArray(anyData.data)) {
      return anyData.data
    }
    return anyData
  }, [raw])

  const defaultValues: ArticleFormValues = useMemo(
    () => ({
      title: '',
      summary: '',
      content: '',
      type: '',
      status: 'DRAFT',
      tags: '',
      thumbnailUrl: '',
      categoryId: '',
      contentType: 'ARTICLE',
      externalUrl: '',
      displayOnNews: true,
      authorId: '',
      organizationId: '',
      managerId: '',
      publishScope: 'INTERNAL',
      publishedDate: '',
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues,
  })

  const title = useWatch({ control, name: 'title' }) as string
  const content = useWatch({ control, name: 'content' }) as string
  const status = (useWatch({ control, name: 'status' }) as ArticleStatus) || 'DRAFT'
  const thumbnailUrl = useWatch({ control, name: 'thumbnailUrl' }) as string
  const type = useWatch({ control, name: 'type' }) as string
  const publishedDate = useWatch({ control, name: 'publishedDate' }) as string
  const authorId = (useWatch({ control, name: 'authorId' }) as string) || ''
  const organizationId = (useWatch({ control, name: 'organizationId' }) as string) || ''
  const managerId = (useWatch({ control, name: 'managerId' }) as string) || ''
  const publishScope = (useWatch({ control, name: 'publishScope' }) as string) || 'INTERNAL'
  const categoryId = (useWatch({ control, name: 'categoryId' }) as string) || ''
  const contentType = (useWatch({ control, name: 'contentType' }) as string) || 'ARTICLE'
  const displayOnNews = useWatch({ control, name: 'displayOnNews' }) as boolean
  const externalUrl = (useWatch({ control, name: 'externalUrl' }) as string) || ''

  const { data: newsCategories = [] } = useNewsCategories(organizationId || undefined)
  const createCategoryReq = useCreateNewsCategory()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#16a34a')

  useEffect(() => {
    if (isEdit && initial) {
      reset({
        title: initial.title || '',
        summary: initial.summary || '',
        content: initial.content || '',
        type: initial.type || '',
        status: initial.status || 'DRAFT',
        tags: initial.tags || '',
        thumbnailUrl: initial.thumbnailUrl || '',
        categoryId: initial.categoryId || '',
        contentType: initial.contentType || 'ARTICLE',
        externalUrl: initial.externalUrl || '',
        displayOnNews: initial.displayOnNews !== false,
        authorId: initial.authorId || '',
        organizationId: initial.organizationId || initial.orgId || '',
        managerId: initial.managerId || '',
        publishScope: initial.publishScope || 'INTERNAL',
        publishedDate: initial.publishedDate || '',
      })
    }
  }, [initial, isEdit, reset])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const goBack = () => navigate('/admin/article-management')

  const guardedBack = () => {
    if (isDirty) {
      setLeaveConfirm(() => goBack)
    } else {
      goBack()
    }
  }

  const onSubmit = (values: FieldValues) => {
    // Guard double-submit (Strict Mode / double-click) — create must not race code-sequence
    if (createReq.isPending || updateReq.isPending) return

    const formValues = values as ArticleFormValues
    if (isEdit && id) {
      if (!canUpdate) return
      const payload = toArticleUpdatePayload(formValues)
      updateReq.mutate(
        { id, data: payload },
        { onSuccess: () => reset(formValues) },
      )
    } else {
      if (!canCreate) return
      const payload = toArticleCreatePayload(formValues)
      createReq.mutate(payload, {
        onSuccess: (res: any) => {
          const newId = res?.data?.id || res?.id
          if (newId) {
            navigate(`/admin/article-management/${newId}/edit`, { replace: true })
          } else {
            goBack()
          }
        },
      })
    }
  }

  const saveAsDraft = handleSubmit((values) => onSubmit(values))

  const handleSubmitForApproval = () => {
    if (!id || !canSubmit) return
    if (!managerId) {
      toast.error('Chọn người duyệt trước khi gửi duyệt')
      return
    }
    submitReq.mutate(id)
  }

  const isDesignatedApprover =
    !!myPersonId && !!managerId && myPersonId === managerId
  /** BE review/publish chỉ cho person = article.managerId — ẩn UI nếu không phải người được gán. */
  const canActAsArticleApprover = isDesignatedApprover

  const handleReview = (approved: boolean) => {
    if (!id || !canReview || !canActAsArticleApprover) return
    if (!approved) {
      setRejectNote('')
      setRejectOpen(true)
      return
    }
    reviewReq.mutate({ id, approved: true })
  }

  const confirmReject = () => {
    if (!id) return
    reviewReq.mutate(
      { id, approved: false, note: rejectNote.trim() || undefined },
      {
        onSuccess: () => {
          setRejectOpen(false)
          setRejectNote('')
        },
      },
    )
  }

  const handlePublish = () => {
    if (!id || !canPublish || !canActAsArticleApprover) return
    publishReq.mutate(id)
  }

  const handleDelete = () => {
    if (!id || !canDelete) return
    deleteReq.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false)
        goBack()
      },
    })
  }

  if (isEdit && isFetching) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-sm">Đang tải bài viết…</p>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
  const isSaving =
    createReq.isPending ||
    updateReq.isPending ||
    submitReq.isPending ||
    reviewReq.isPending ||
    publishReq.isPending

  const articleCode = isEdit ? initial?.code : null
  const canEditContent =
    (!isEdit && canCreate) ||
    (isEdit && canUpdate && (status === 'DRAFT' || status === 'REJECTED'))

  return (
    <div className="min-h-[calc(100vh-60px)] bg-neutral-50/60">
      {/* ═══════════════ STICKY TOP BAR ═══════════════ */}
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={guardedBack}
            className="text-neutral-600"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Danh sách
          </Button>

          <div className="w-px h-6 bg-neutral-200" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-semibold text-neutral-800 truncate">
                {isEdit ? title || '(Chưa có tiêu đề)' : 'Bài viết mới'}
              </h1>
              <StatusBadge {...statusCfg} />
              {articleCode && (
                <code className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {articleCode}
                </code>
              )}
              {isDirty && (
                <span className="text-[11px] text-amber-600 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Chưa lưu
                </span>
              )}
            </div>
            {isEdit && initial?.updatedDate && (
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Cập nhật lần cuối: {formatDateTime(initial.updatedDate)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PageGuideButton guide={EDITOR_GUIDE} />

            <ExportMenu
              html={buildArticleExportHtml({ title, content, publishedDate })}
              filename={articleExportFilename(title)}
              title={title || 'Bai-viet'}
              size="sm"
              variant="outline"
              buttonLabel="Xuất"
              disabled={!content}
            />

            {isEdit && canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 h-9"
                title="Xoá bài viết"
              >
                <Trash2 size={15} />
              </Button>
            )}

            {canEditContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={saveAsDraft}
                disabled={isSaving || (isEdit && !isDirty)}
                className="h-9"
              >
                {isSaving && (createReq.isPending || updateReq.isPending) ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Save size={14} className="mr-1.5" />
                )}
                Lưu nháp
              </Button>
            )}

            {isEdit &&
              canSubmit &&
              (status === 'DRAFT' || status === 'REJECTED') && (
                <Button
                  size="sm"
                  onClick={handleSubmitForApproval}
                  disabled={isSaving || isDirty}
                  className="bg-primary-600 hover:bg-primary-700 text-white h-9"
                  title={isDirty ? 'Lưu nháp trước khi gửi duyệt' : undefined}
                >
                  {submitReq.isPending ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Send size={14} className="mr-1.5" />
                  )}
                  Gửi duyệt
                </Button>
              )}

            {isEdit &&
              canActAsArticleApprover &&
              status === 'WAITING_APPROVAL' && (
                <Can permission="QTBV.ARTICLES.REVIEW">
                  <PermissionButton
                    permission="QTBV.ARTICLES.REVIEW"
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(false)}
                    disabled={isSaving}
                    className="h-9"
                  >
                    Từ chối
                  </PermissionButton>
                  <PermissionButton
                    permission="QTBV.ARTICLES.REVIEW"
                    size="sm"
                    onClick={() => handleReview(true)}
                    disabled={isSaving}
                    className="bg-primary-600 hover:bg-primary-700 text-white h-9"
                  >
                    {reviewReq.isPending ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} className="mr-1.5" />
                    )}
                    Duyệt bài viết
                  </PermissionButton>
                </Can>
              )}

            {isEdit && canActAsArticleApprover && status === 'APPROVED' && (
              <PermissionButton
                permission="QTBV.ARTICLES.PUBLISH"
                size="sm"
                onClick={handlePublish}
                disabled={isSaving}
                className="bg-primary-600 hover:bg-primary-700 text-white h-9"
              >
                {publishReq.isPending ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Send size={14} className="mr-1.5" />
                )}
                Xuất bản
              </PermissionButton>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ BODY: 2-column grid ═══════════════ */}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ─────────────── MAIN ─────────────── */}
          <div className="lg:col-span-8 space-y-4">

            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <input
                {...register('title')}
                placeholder="Nhập tiêu đề bài viết…"
                className="w-full text-3xl font-bold text-neutral-900 placeholder-neutral-300 border-0 outline-none focus:ring-0 bg-transparent leading-tight"
                autoFocus={!isEdit}
                disabled={!canEditContent}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
              )}

              <hr className="my-4 border-neutral-100" />

              <Label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Tóm tắt
              </Label>
              <textarea
                {...register('summary')}
                rows={2}
                placeholder="Mô tả ngắn ≤ 200 ký tự — dùng cho thẻ danh sách, xem trước khi chia sẻ, mô tả SEO…"
                className="mt-1.5 w-full text-sm text-neutral-700 placeholder-neutral-400 border-0 outline-none focus:ring-0 bg-transparent resize-none leading-relaxed"
                disabled={!canEditContent}
              />
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between">
                <Label className="text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
                  <FileText size={14} className="text-neutral-500" />
                  Nội dung
                </Label>
                <span className="text-xs text-neutral-500 inline-flex items-center gap-1">
                  <Info size={11} />
                  Hỗ trợ dán từ Word / Google Docs / Notion
                </span>
              </div>
              <RichTextEditor
                value={content || ''}
                onChange={(html) =>
                  setValue('content', html, { shouldValidate: true, shouldDirty: true })
                }
                minHeight={500}
                placeholder="Bắt đầu viết ở đây… Dùng '/' hoặc toolbar phía trên để định dạng."
                onRequestImage={() => pickAndUploadImage({ folder: 'articles', maxSizeMB: 5 })}
              />
              {errors.content && (
                <p className="px-4 py-2 text-xs text-red-600 border-t border-neutral-100">
                  {errors.content.message}
                </p>
              )}
            </div>
          </div>

          {/* ─────────────── SIDEBAR ─────────────── */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-[76px] space-y-4">

              <SidebarCard
                icon={<Info size={14} className="text-primary-600" />}
                title="Mã bài viết"
              >
                {articleCode ? (
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-neutral-800">{articleCode}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        void navigator.clipboard?.writeText(String(articleCode))
                      }}
                    >
                      Sao chép
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Hệ thống tự tạo mã sau khi bạn bấm <strong>Lưu nháp</strong>. Không cần nhập thủ công.
                  </p>
                )}
              </SidebarCard>

              <SidebarCard
                icon={<Send size={14} className="text-primary-600" />}
                title="Phê duyệt"
              >
                <SidebarField label="Trạng thái">
                  <div className="pt-0.5">
                    <StatusBadge {...statusCfg} />
                  </div>
                </SidebarField>
                {status === 'REJECTED' && initial?.rejectNote && (
                  <SidebarField label="Lý do từ chối">
                    <p className="text-xs text-danger leading-relaxed bg-red-50 border border-red-100 rounded-md px-2 py-1.5">
                      {initial.rejectNote}
                    </p>
                  </SidebarField>
                )}
                <SidebarField
                  label="Phạm vi xuất bản"
                  hint="Nội bộ = intranet. Công khai = landing + intranet sau khi xuất bản."
                >
                  <Select
                    options={PUBLISH_SCOPE_OPTIONS}
                    value={publishScope}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('publishScope', v || 'INTERNAL', {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                    placeholder="-- Chọn phạm vi --"
                    disabled={!canEditContent}
                  />
                  <p className="mt-1.5 text-[11px] text-neutral-500 flex items-center gap-1">
                    {publishScope === 'PUBLIC' ? (
                      <>
                        <Globe size={11} /> Hiện trên website công khai
                      </>
                    ) : (
                      <>
                        <Building2 size={11} /> Chỉ nhân viên đăng nhập (/bai-viet)
                      </>
                    )}
                  </p>
                </SidebarField>
                <SidebarField
                  label="Người duyệt"
                  hint="Bắt buộc trước khi gửi duyệt."
                >
                  <Select
                    options={managerOptions}
                    value={managerId}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('managerId', v, { shouldValidate: true, shouldDirty: true })
                    }}
                    placeholder="-- Chọn người duyệt --"
                    showSearch
                    showClear
                  />
                </SidebarField>
              </SidebarCard>

              <SidebarCard
                icon={<ImageIcon size={14} className="text-primary-600" />}
                title="Ảnh đại diện"
              >
                <ImageUploader
                  value={thumbnailUrl || ''}
                  onChange={(url) =>
                    setValue('thumbnailUrl', url, { shouldValidate: true, shouldDirty: true })
                  }
                  onUpload={makeImageUploader({ folder: 'articles', maxSizeMB: 5 })}
                  aspectRatio="16/9"
                  maxSizeMB={5}
                  hint="Kéo-thả hoặc chọn ảnh (16:9, ≥ 1200×675, ≤ 5MB). Hoặc dán URL trực tiếp."
                />
              </SidebarCard>

              <SidebarCard
                icon={<TagIcon size={14} className="text-primary-600" />}
                title="Phân loại"
              >
                <SidebarField label="Loại bài viết">
                  <Select
                    options={TYPE_OPTIONS}
                    value={type || ''}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('type', v, { shouldValidate: true, shouldDirty: true })
                    }}
                    placeholder="-- Chọn loại --"
                  />
                </SidebarField>
                <SidebarField label="Danh mục tin tức">
                  <Select
                    options={newsCategories.map((c: any) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={categoryId}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('categoryId', v, { shouldValidate: true, shouldDirty: true })
                    }}
                    placeholder="-- Chọn danh mục --"
                    showSearch
                    showClear
                  />
                  {canEditContent && (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Tên danh mục mới"
                        className="h-8 text-xs flex-1"
                      />
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-8 w-10 rounded border border-neutral-200"
                        title="Màu danh mục"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={!newCategoryName.trim() || createCategoryReq.isPending}
                        onClick={() => {
                          createCategoryReq.mutate(
                            {
                              name: newCategoryName.trim(),
                              color: newCategoryColor,
                              organizationId: organizationId || undefined,
                            },
                            {
                              onSuccess: (res: any) => {
                                const id = res?.data?.id ?? res?.id
                                if (id) {
                                  setValue('categoryId', id, { shouldDirty: true })
                                }
                                setNewCategoryName('')
                                toast.success('Đã thêm danh mục')
                              },
                            },
                          )
                        }}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </SidebarField>
                <SidebarField label="Kiểu hiển thị">
                  <Select
                    options={[
                      { value: 'ARTICLE', label: 'Bài viết (nội dung đầy đủ)' },
                      { value: 'LINK', label: 'Liên kết ngoài' },
                    ]}
                    value={contentType}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('contentType', (v || 'ARTICLE') as 'ARTICLE' | 'LINK', {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }}
                  />
                </SidebarField>
                {contentType === 'LINK' && (
                  <SidebarField label="URL liên kết">
                    <Input
                      value={externalUrl}
                      onChange={(e) =>
                        setValue('externalUrl', e.target.value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      placeholder="https://..."
                      className="h-9"
                      disabled={!canEditContent}
                    />
                  </SidebarField>
                )}
                <SidebarField label="Hiển thị trang Tin tức">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2">
                    <span className="text-xs text-neutral-600">Hiện trên /bai-viet</span>
                    <Switch
                      checked={displayOnNews !== false}
                      onCheckedChange={(v) =>
                        setValue('displayOnNews', v, { shouldDirty: true })
                      }
                      disabled={!canEditContent}
                    />
                  </div>
                </SidebarField>
                <SidebarField
                  label="Thẻ (tags)"
                  hint="Nhiều thẻ cách nhau bằng dấu phẩy."
                >
                  <Input
                    {...register('tags')}
                    placeholder="công nghệ, tin nội bộ"
                    className="h-9"
                    disabled={!canEditContent}
                  />
                </SidebarField>
              </SidebarCard>

              <SidebarCard
                icon={<UserIcon size={14} className="text-primary-600" />}
                title="Tác giả & Đơn vị"
              >
                <SidebarField
                  label="Tác giả"
                  hint={
                    personOptions.length === 0
                      ? 'Chưa có nhân sự trong hệ thống. Vào "Quản lý Nhân viên" để tạo trước.'
                      : `${personOptions.length} nhân sự — gõ để tìm nhanh.`
                  }
                >
                  <Select
                    options={personOptions}
                    value={authorId}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('authorId', v, { shouldValidate: true, shouldDirty: true })
                    }}
                    placeholder={
                      personOptions.length === 0
                        ? '-- Chưa có nhân sự --'
                        : '-- Chọn tác giả --'
                    }
                    showSearch
                    showClear
                  />
                </SidebarField>
                <SidebarField
                  label="Đơn vị / Phòng ban"
                  hint={
                    orgOptions.length === 0
                      ? 'Chưa có tổ chức. Vào "Tổ chức / Công ty" để tạo trước.'
                      : `${orgOptions.length} tổ chức.`
                  }
                >
                  <Select
                    options={orgOptions}
                    value={organizationId}
                    onChange={(v) => {
                      if (!canEditContent) return
                      setValue('organizationId', v, { shouldValidate: true, shouldDirty: true })
                    }}
                    placeholder={
                      orgOptions.length === 0
                        ? '-- Chưa có tổ chức --'
                        : '-- Chọn đơn vị --'
                    }
                    showSearch
                    showClear
                  />
                </SidebarField>
              </SidebarCard>

              {isEdit && initial && (
                <SidebarCard
                  icon={<CalendarIcon size={14} className="text-neutral-500" />}
                  title="Thông tin hệ thống"
                >
                  <MetaRow label="ID" value={<code className="text-xs">{initial.id}</code>} />
                  <MetaRow label="Mã bài" value={<code className="text-xs">{initial.code || '—'}</code>} />
                  <MetaRow label="Người tạo" value={initial.createdBy || '—'} />
                  <MetaRow label="Ngày tạo" value={formatDateTime(initial.createdDate || initial.createdAt) || '—'} />
                  <MetaRow label="Cập nhật lần cuối" value={formatDateTime(initial.updatedDate || initial.updatedAt) || '—'} />
                </SidebarCard>
              )}
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Xoá bài viết "${title || '(chưa có tiêu đề)'}"?`}
        message="Hành động này không thể hoàn tác. Bài viết sẽ bị xoá vĩnh viễn khỏi hệ thống."
        confirmText="Xoá vĩnh viễn"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteReq.isPending}
      />

      <ConfirmDialog
        isOpen={!!leaveConfirm}
        onClose={() => setLeaveConfirm(null)}
        onConfirm={() => {
          const fn = leaveConfirm
          setLeaveConfirm(null)
          fn?.()
        }}
        title="Bỏ thay đổi chưa lưu?"
        message="Bạn có thay đổi chưa lưu. Nếu tiếp tục thoát, các thay đổi sẽ mất."
        confirmText="Thoát mà không lưu"
        cancelText="Ở lại"
        variant="warning"
      />

      {rejectOpen && (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-5 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Từ chối bài viết</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Có thể ghi lý do để tác giả sửa và gửi lại.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">Lý do từ chối</Label>
              <Input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Ví dụ: cần bổ sung ảnh / sửa chính tả…"
                className="h-9"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectOpen(false)
                  setRejectNote('')
                }}
                disabled={reviewReq.isPending}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-danger border-danger/30 hover:bg-red-50"
                onClick={confirmReject}
                disabled={reviewReq.isPending}
              >
                {reviewReq.isPending ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : null}
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}

// ============================================================
// Sidebar helpers
// ============================================================

function SidebarCard({
  icon, title, children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2 bg-neutral-50/40">
        {icon}
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function SidebarField({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-neutral-600">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-neutral-500 leading-snug">{hint}</p>}
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-700 font-medium truncate max-w-[60%] text-right">{value}</span>
    </div>
  )
}

// ============================================================
// Date helpers
// ============================================================

function formatDateTime(dt?: string | null) {
  if (!dt) return ''
  const d = new Date(dt)
  if (isNaN(d.getTime())) return String(dt)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ============================================================
// Export helpers
// ============================================================

function articleExportFilename(title?: string): string {
  const clean = String(title || 'bai-viet')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'bai-viet'
  return `${clean}-${new Date().toISOString().slice(0, 10)}`
}

/** Build print-quality HTML cho article export (magazine-style layout) */
function buildArticleExportHtml(fd: {
  title?: string
  content?: string
  publishedDate?: string
}): string {
  const publishStr = fd.publishedDate
    ? new Date(fd.publishedDate).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : new Date().toLocaleDateString('vi-VN')

  return `
    <article style="font-family: 'Times New Roman', Georgia, serif; max-width: 720px; margin: 0 auto; color: #1a1a1a;">
      <header style="text-align: center; margin-bottom: 24pt; padding-bottom: 12pt; border-bottom: 2pt solid #111;">
        <h1 style="font-size: 22pt; font-weight: bold; line-height: 1.25; margin: 0 0 8pt;">
          ${escapeArticleText(fd.title || 'Bài viết không tiêu đề')}
        </h1>
        <div style="font-size: 10pt; color: #666; font-style: italic;">
          Xuất ngày ${publishStr} · Frezo Internal
        </div>
      </header>
      <div style="font-size: 12pt; line-height: 1.7;">
        ${fd.content || '<p><em>Chưa có nội dung</em></p>'}
      </div>
      <footer style="margin-top: 32pt; padding-top: 12pt; border-top: 1pt solid #ccc; text-align: center; font-size: 9pt; color: #999;">
        © Frezo · Tài liệu nội bộ
      </footer>
    </article>
  `
}

function escapeArticleText(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
