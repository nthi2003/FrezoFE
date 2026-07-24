import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Grid3x3,
  Rows3,
  Calendar,
  User as UserIcon,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Archive,
  Search,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  PageGuideButton,
  StatusBadge,
  type PageGuideConfig,
  type StatusConfig,
} from '@frezo/ui'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useArticles,
  useDeleteArticle,
} from '../hooks/useArticle'

// ============================================================
// Constants
// ============================================================

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

const STATUS_OPTIONS: { value: ArticleStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const STATUS_CONFIG: Record<ArticleStatus, StatusConfig> = {
  DRAFT: { label: 'Bản nháp', color: 'neutral', icon: FileText },
  PUBLISHED: { label: 'Đã xuất bản', color: 'success', icon: CheckCircle2 },
  ARCHIVED: { label: 'Lưu trữ', color: 'warning', icon: Archive },
}

const TYPE_OPTIONS = [
  { value: 'NEWS', label: 'Tin tức' },
  { value: 'BLOG', label: 'Bài blog' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'GUIDE', label: 'Hướng dẫn' },
  { value: 'OTHER', label: 'Khác' },
]

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label]),
)

const ARTICLES_GUIDE: PageGuideConfig = {
  title: 'Quản lý Bài viết',
  subtitle: 'Tạo nháp, gửi duyệt rồi xuất bản tin nội bộ. Hệ thống tự cấp mã bài.',
  docHref: '/docs/guide-articles',
  sections: [
    {
      heading: 'Bắt đầu nhanh',
      type: 'steps',
      steps: [
        {
          title: 'Bấm Thêm mới',
          description:
            'Nhập tiêu đề và nội dung (bắt buộc). Có thể thêm tóm tắt, ảnh đại diện, người duyệt.',
        },
        {
          title: 'Lưu nháp',
          description:
            'Bấm Lưu nháp — hệ thống tự cấp mã bài. Bạn không cần (và không sửa được) mã.',
        },
        {
          title: 'Gửi duyệt → Duyệt → Xuất bản',
          description:
            'Người viết bấm Gửi duyệt. Người duyệt bấm Duyệt (hoặc Từ chối), rồi Xuất bản khi bài Đã duyệt.',
        },
      ],
    },
    {
      heading: 'Mẹo sử dụng',
      type: 'tips',
      tips: [
        'Lọc theo trạng thái để tách nháp / chờ duyệt / đã xuất bản.',
        'Không thấy nút Duyệt hoặc Xuất bản → bạn không phải người duyệt của bài đó.',
        'Soát chính tả và ảnh trước khi Xuất bản.',
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
// Utilities
// ============================================================

function formatDate(v?: string | null) {
  if (!v) return '---'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '---'
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function truncate(s: string | null | undefined, max = 120) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max).trim() + '…' : s
}

// ============================================================
// Card component
// ============================================================

interface ArticleCardProps {
  article: any
  onEdit: () => void
  onDelete: () => void
  canUpdate: boolean
  canDelete: boolean
}

function ArticleCard({ article, onEdit, onDelete, canUpdate, canDelete }: ArticleCardProps) {
  const status = (article.status || 'DRAFT') as ArticleStatus
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
  const showActions = canUpdate || canDelete

  return (
    <div className="group bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Thumbnail */}
      <div className="aspect-[16/9] bg-neutral-100 relative overflow-hidden">
        {article.thumbnailUrl ? (
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-400">
            <ImageIcon size={36} strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <StatusBadge {...statusCfg} />
          {article.type && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/90 text-neutral-700 border border-neutral-200">
              {TYPE_LABEL[article.type] || article.type}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">
          {article.title || '(Không có tiêu đề)'}
        </h3>
        {article.code && (
          <p className="mt-1 text-[11px] font-mono text-neutral-400">{article.code}</p>
        )}
        {article.summary && (
          <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {truncate(article.summary, 140)}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-3 text-[11px] text-neutral-400 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <UserIcon size={11} />
            {article.authorName || article.authorId || 'Ẩn danh'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(article.publishedDate || article.createdDate || article.publishedAt || article.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions — hide-not-disable */}
      {showActions && (
        <div className="border-t border-neutral-100 p-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-50/50">
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 gap-1.5 text-neutral-600 hover:text-primary-700"
            >
              <Pencil size={13} /> Sửa
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 gap-1.5 text-neutral-600 hover:text-danger"
            >
              <Trash2 size={13} /> Xóa
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export function ArticlesPage() {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'ALL'>('ALL')
  const [searchKeyword, setSearchKeyword] = useState('')

  const canCreate = usePermission('QTBV.ARTICLES.CREATE')
  const canUpdate = usePermission('QTBV.ARTICLES.UPDATE')
  const canDelete = usePermission('QTBV.ARTICLES.DELETE')

  const { data: rawData, isLoading } = useArticles()
  const deleteReq = useDeleteArticle()

  // Defensive: rawData thường đã được `select` trong hook chuẩn hoá thành array,
  // nhưng nếu BE đổi shape (paginated / null / object) vẫn không crash.
  const allArticles: any[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData
    const anyData = rawData as any
    if (Array.isArray(anyData?.content)) return anyData.content
    if (Array.isArray(anyData?.items)) return anyData.items
    if (Array.isArray(anyData?.data)) return anyData.data
    return []
  }, [rawData])

  // Counts by status — dùng cho tab bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allArticles.length, DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 }
    allArticles.forEach((a) => {
      const s = a.status || 'DRAFT'
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [allArticles])

  // Filtered list
  const filteredArticles = useMemo(() => {
    return allArticles.filter((a) => {
      if (statusFilter !== 'ALL' && (a.status || 'DRAFT') !== statusFilter) return false
      if (searchKeyword) {
        const k = searchKeyword.toLowerCase()
        const hay = `${a.title || ''} ${a.summary || ''} ${a.authorName || ''} ${a.authorId || ''}`.toLowerCase()
        if (!hay.includes(k)) return false
      }
      return true
    })
  }, [allArticles, statusFilter, searchKeyword])

  const openCreate = () => navigate('/admin/article-management/new')
  const openEdit = (row: any) => navigate(`/admin/article-management/${row.id}/edit`)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteReq.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  // ============================================================
  // Table columns
  // ============================================================

  const columns = [
    {
      title: 'Bài viết',
      dataIndex: 'title',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3 min-w-0">
          {row.thumbnailUrl ? (
            <img
              src={row.thumbnailUrl}
              alt=""
              className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-neutral-200"
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-400 flex-shrink-0">
              <ImageIcon size={18} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-neutral-800 truncate">
              {row.title || '(Không tiêu đề)'}
            </div>
            {row.summary && (
              <div className="text-xs text-neutral-500 truncate max-w-md">
                {truncate(row.summary, 90)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      width: 130,
      render: (val: string) =>
        val ? (
          <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
            {TYPE_LABEL[val] || val}
          </span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (val: string) => {
        const status = (val || 'DRAFT') as ArticleStatus
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
        return <StatusBadge {...cfg} />
      },
    },
    {
      title: 'Tác giả',
      dataIndex: 'authorName',
      width: 180,
      render: (val: string, row: any) => (
        <span className="text-sm text-neutral-600">
          {val || row.authorId || '—'}
        </span>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'publishedDate',
      width: 130,
      render: (val: string, row: any) => (
        <span className="text-sm text-neutral-600 tabular-nums">
          {formatDate(val || row.createdDate)}
        </span>
      ),
    },
    {
      title: '',
      dataIndex: 'id',
      width: 100,
      align: 'right' as const,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1 justify-end">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row)}
              title="Chỉnh sửa"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row)}
              title="Xóa"
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  // ============================================================
  // Render
  // ============================================================

  const tabs: { key: ArticleStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PUBLISHED', label: 'Đã xuất bản' },
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'ARCHIVED', label: 'Lưu trữ' },
  ]

  const isEmpty = !isLoading && filteredArticles.length === 0

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Quản lý Bài viết"
        description="Đăng và điều phối tin tức, bài blog, thông báo nội bộ toàn hệ thống."
        actions={
          <>
            <PageGuideButton guide={ARTICLES_GUIDE} />
            {canCreate && (
              <Button
                onClick={openCreate}
                className="bg-primary-600 hover:bg-primary-700 text-white h-9"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Thêm mới
              </Button>
            )}
          </>
        }
      />

      {/* Toolbar: tabs + search + view toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-neutral-200 rounded-xl px-3 py-2">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const active = statusFilter === tab.key
            const count = statusCounts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition
                  ${active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'}
                `}
              >
                {tab.label}
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums
                    ${active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}
                  `}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search + View toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm tiêu đề, tóm tắt, tác giả…"
              className="h-9 pl-9"
            />
          </div>
          <div className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              title="Chế độ Card"
              className={`
                inline-flex items-center justify-center w-8 h-8 rounded transition
                ${viewMode === 'card' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}
              `}
            >
              <Grid3x3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Chế độ Bảng"
              className={`
                inline-flex items-center justify-center w-8 h-8 rounded transition
                ${viewMode === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}
              `}
            >
              <Rows3 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isEmpty ? (
        <EmptyState
          icon={FileText}
          title={
            searchKeyword || statusFilter !== 'ALL'
              ? 'Không tìm thấy bài viết phù hợp'
              : 'Chưa có bài viết nào'
          }
          description={
            searchKeyword || statusFilter !== 'ALL'
              ? 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'
              : 'Tạo bài viết đầu tiên để chia sẻ tin tức và cập nhật cho toàn hệ thống.'
          }
          action={
            !searchKeyword && statusFilter === 'ALL' && canCreate ? (
              <Button onClick={openCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
                <Sparkles className="w-4 h-4 mr-1.5" /> Tạo bài viết đầu tiên
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[16/9] bg-neutral-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-full" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : filteredArticles.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  onEdit={() => openEdit(a)}
                  onDelete={() => setDeleteTarget(a)}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              ))}
        </div>
      ) : (
        <AppTable
          data={filteredArticles}
          columns={columns as any}
          isLoading={isLoading}
          showSearch={false}
        />
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Xóa bài viết "${truncate(deleteTarget?.title, 40) || 'không tiêu đề'}"?`}
        message="Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
