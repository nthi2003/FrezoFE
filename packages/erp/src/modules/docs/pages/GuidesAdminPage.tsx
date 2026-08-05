// ============================================================
// GuidesAdminPage — /admin/guides (FR-DOC-04)
// Chuẩn list QTHT/CMS: PageHeader + FilterBar + AppTable
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Eye, EyeOff, Search, FileText, CheckCircle2 } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  PageGuideButton,
  StatusBadge,
  RowActions,
  type PageGuideConfig,
  type StatusConfig,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useAdminGuides,
  useDeleteGuide,
  usePublishGuide,
  useUnpublishGuide,
} from '../hooks/useGuides'
import type { GuideSummary } from '../services/guideApi'

const GUIDES_ADMIN_GUIDE: PageGuideConfig = {
  title: 'Quản lý hướng dẫn',
  subtitle: 'Soạn Markdown và xuất bản lên mục Tài liệu.',
  docHref: '/docs',
  sections: [
    {
      heading: 'Quy trình',
      type: 'steps',
      steps: [
        { title: 'Soạn bài', description: 'Tạo hướng dẫn mới bằng Markdown.' },
        { title: 'Xuất bản', description: 'Chỉ bài đã xuất bản hiện trên /docs.' },
      ],
    },
  ],
}

const STATUS_PUBLISHED: StatusConfig = {
  label: 'Đã xuất bản',
  color: 'success',
  icon: CheckCircle2,
}

const STATUS_DRAFT: StatusConfig = {
  label: 'Nháp',
  color: 'neutral',
  icon: FileText,
}

function formatDate(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function GuidesAdminPage() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin =
    !!user?.isAdmin ||
    user?.username === 'admin' ||
    !!user?.roles?.includes('ADMIN') ||
    !!user?.roles?.includes('SUPER_ADMIN')
  const canView = usePermission('QTHT.GUIDES.VIEW')
  const canCreate = usePermission('QTHT.GUIDES.CREATE')
  const canUpdate = usePermission('QTHT.GUIDES.UPDATE')
  const canManage = isAdmin || canView
  const canWrite = isAdmin || canCreate || canUpdate

  const { data, isLoading, isError, refetch, isFetching } = useAdminGuides(canManage)
  const publishReq = usePublishGuide()
  const unpublishReq = useUnpublishGuide()
  const deleteReq = useDeleteGuide()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const allGuides = useMemo(
    () => (Array.isArray(data) ? (data as GuideSummary[]) : []),
    [data],
  )

  const statusCounts = useMemo(() => {
    let published = 0
    let draft = 0
    for (const g of allGuides) {
      if (g.published) published += 1
      else draft += 1
    }
    return { all: allGuides.length, published, draft }
  }, [allGuides])

  const filtered = useMemo(() => {
    let list = allGuides
    if (statusFilter === 'published') list = list.filter((g) => g.published)
    if (statusFilter === 'draft') list = list.filter((g) => !g.published)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (g) =>
          (g.title || '').toLowerCase().includes(q) ||
          (g.slug || '').toLowerCase().includes(q) ||
          (g.summary || '').toLowerCase().includes(q) ||
          (g.module || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [allGuides, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'all'
  const isFilteredEmpty = !isLoading && !isError && allGuides.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && allGuides.length === 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const columns: AppTableColumn<GuideSummary>[] = [
    {
      key: 'title',
      title: 'Hướng dẫn',
      render: (_, g) => (
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate" title={g.title}>
            {g.title || '(Không tiêu đề)'}
          </div>
          {g.summary ? (
            <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-md" title={g.summary}>
              {g.summary}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'slug',
      title: 'Slug',
      width: 180,
      render: (_, g) => (
        <span className="text-xs font-mono text-neutral-500 truncate block max-w-[160px]" title={g.slug}>
          {g.slug || '—'}
        </span>
      ),
    },
    {
      key: 'module',
      title: 'Module',
      width: 120,
      render: (_, g) => (
        <span className="text-xs text-neutral-600">
          {g.module || '—'}
        </span>
      ),
    },
    {
      key: 'published',
      title: 'Trạng thái',
      width: 140,
      render: (_, g) => (
        <StatusBadge {...(g.published ? STATUS_PUBLISHED : STATUS_DRAFT)} />
      ),
    },
    {
      key: 'updatedDate',
      title: 'Cập nhật',
      width: 120,
      render: (_, g) => (
        <span className="text-sm text-neutral-600 tabular-nums">
          {formatDate(g.updatedDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 140,
      render: (_, g) => (
        <RowActions
          align="end"
          actions={[
            { kind: 'edit', hidden: !canWrite, onClick: () => nav(`/admin/guides/${g.id}/edit`) },
            {
              key: 'unpublish',
              icon: EyeOff,
              tooltip: 'Gỡ xuất bản',
              tone: 'amber',
              hidden: !canWrite || !g.published,
              disabled: unpublishReq.isPending,
              onClick: () => unpublishReq.mutate(g.id),
            },
            {
              key: 'publish',
              icon: Eye,
              tooltip: 'Xuất bản',
              tone: 'emerald',
              hidden: !canWrite || g.published,
              disabled: publishReq.isPending,
              onClick: () => publishReq.mutate(g.id),
            },
            { kind: 'delete', tooltip: 'Xóa', hidden: !canWrite, onClick: () => setDeleteId(g.id) },
          ]}
        />
      ),
    },
  ]

  if (!canManage) {
    return (
      <div className="p-6 animate-fade-in">
        <EmptyState
          icon={BookOpen}
          title="Không có quyền quản lý hướng dẫn"
          description="Chỉ Admin hoặc BA được soạn / xuất bản hướng dẫn. Liên hệ quản trị nếu bạn cần quyền này."
          action={{ label: 'Về Tài liệu', onClick: () => nav('/docs') }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý hướng dẫn"
        description="Soạn Markdown, xuất bản lên Tài liệu — user chỉ thấy bài đã xuất bản."
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={GUIDES_ADMIN_GUIDE} />
            {canWrite && (
              <Button onClick={() => nav('/admin/guides/new')} className="gap-2">
                <Plus size={16} /> Thêm hướng dẫn
              </Button>
            )}
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} hướng dẫn${hasFilter ? ' (đã lọc)' : ''}`}
        selects={[
          {
            id: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as 'all' | 'published' | 'draft'),
            options: [
              { value: 'all', label: `Tất cả (${statusCounts.all})` },
              { value: 'published', label: `Đã xuất bản (${statusCounts.published})` },
              { value: 'draft', label: `Nháp (${statusCounts.draft})` },
            ],
          },
        ]}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiêu đề, slug, module…"
            className="h-9 pl-8"
            aria-label="Tìm hướng dẫn"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách hướng dẫn"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={BookOpen}
            title={isFullyEmpty ? 'Chưa có hướng dẫn trên máy chủ' : 'Không có bài khớp bộ lọc'}
            description={
              isFullyEmpty
                ? 'Tạo bài đầu tiên, rồi bấm Xuất bản để hiện trên /docs.'
                : 'Thử xoá lọc hoặc đổi từ khoá.'
            }
            action={
              isFullyEmpty && canWrite
                ? { label: 'Thêm hướng dẫn', onClick: () => nav('/admin/guides/new') }
                : isFilteredEmpty
                  ? { label: 'Xoá lọc', onClick: clearFilters }
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
          pageSize={10}
          pageSizeOptions={[10]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => {
          if (!deleteReq.isPending) setDeleteId(null)
        }}
        title="Xóa hướng dẫn?"
        message="Bài sẽ bị gỡ khỏi danh sách. Có thể không khôi phục được từ màn này."
        confirmText="Xóa"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteReq.isPending}
        onConfirm={() => {
          if (deleteId) deleteReq.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
      />
    </div>
  )
}
