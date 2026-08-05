import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Newspaper } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  Button, ConfirmDialog, EmptyState, ErrorState,
  PageHeader, PageGuideButton, Select, RowActions, type PageGuideConfig,
} from '@frezo/ui'
import { useArticles, useDeleteArticle } from '@/modules/articles/hooks/useArticle'
import { usePermission } from '@/lib/hooks/usePermission'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ' },
]

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: 'news', label: 'Tin tức' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'blog', label: 'Bài viết' },
  { value: 'promotion', label: 'Khuyến mãi' },
  { value: 'recruitment', label: 'Tuyển dụng' },
]

const TYPE_LABEL: Record<string, string> = {
  news: 'Tin tức',
  event: 'Sự kiện',
  blog: 'Bài viết',
  promotion: 'Khuyến mãi',
  recruitment: 'Tuyển dụng',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
}

const NEWS_GUIDE: PageGuideConfig = {
  title: 'Tin tức & Sự kiện',
  subtitle: 'Danh sách tin tức, bài viết trên hệ thống — xem, sửa hoặc tạo mới.',
  sections: [
    {
      heading: 'Thao tác nhanh',
      type: 'steps',
      steps: [
        { title: 'Thêm mới', description: 'Tạo bài viết mới tại form soạn thảo.' },
        { title: 'Xem công khai', description: 'Mở tab mới để xem bài đã xuất bản.' },
      ],
    },
  ],
}

export function NewsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  const canCreate = usePermission('QTBV.ARTICLES.CREATE')
  const canUpdate = usePermission('QTBV.ARTICLES.UPDATE')
  const canDelete = usePermission('QTBV.ARTICLES.DELETE')

  const { data: rawData, isLoading, isError, isFetching, refetch } = useArticles()
  const deleteReq = useDeleteArticle()

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filtered = useMemo(() => {
    let rows = dataList
    if (statusFilter !== 'ALL') {
      rows = rows.filter((a) => (a.status || 'DRAFT') === statusFilter)
    }
    if (typeFilter !== 'ALL') {
      rows = rows.filter((a) => (a.type || '').toLowerCase() === typeFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.summary || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [dataList, search, statusFilter, typeFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL' || typeFilter !== 'ALL'
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
  }

  const columns: AppTableColumn<any>[] = [
    { key: 'title', title: 'Tiêu đề', dataIndex: 'title' },
    {
      key: 'type',
      title: 'Loại',
      dataIndex: 'type',
      render: (_, row) => (
        <span className="text-xs text-neutral-600">
          {TYPE_LABEL[(row.type || '').toLowerCase()] || row.type || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (_, row) => {
        const val = row.status || 'DRAFT'
        const colorMap: Record<string, string> = {
          DRAFT: 'bg-neutral-100 text-neutral-600',
          PUBLISHED: 'bg-green-50 text-green-700',
          ARCHIVED: 'bg-yellow-50 text-yellow-700',
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[val] || 'bg-neutral-100 text-neutral-500'}`}>
            {STATUS_LABEL[val] || val}
          </span>
        )
      },
    },
    {
      key: 'createdDate',
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      render: (_, row) => (row.createdDate ? new Date(row.createdDate).toLocaleDateString('vi-VN') : '—'),
    },
    {
      key: 'publishedDate',
      title: 'Ngày xuất bản',
      dataIndex: 'publishedDate',
      render: (_, row) => (row.publishedDate ? new Date(row.publishedDate).toLocaleDateString('vi-VN') : '—'),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      dataIndex: 'id',
      width: 120,
      align: 'right',
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            { kind: 'view', tooltip: 'Xem bài viết', onClick: () => window.open(`/bai-viet/${row.id}`, '_blank') },
            {
              kind: 'edit',
              tooltip: 'Chỉnh sửa bài viết',
              onClick: () => navigate(`/admin/article-management/${row.id}/edit`),
              hidden: !canUpdate,
            },
            {
              kind: 'delete',
              tooltip: 'Xóa bài viết',
              onClick: () => setDeleteTarget(row),
              hidden: !canDelete,
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Tin tức & Sự kiện"
        description="Danh sách tin tức, bài viết trên hệ thống"
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={NEWS_GUIDE} />
            {canCreate && (
              <Button onClick={() => navigate('/qtht/tin-tuc/tao-moi')} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
                <Plus className="w-4 h-4" /> Thêm mới
              </Button>
            )}
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} bài${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Trạng thái"
            aria-label="Lọc trạng thái"
            showSearch={false}
          />
        </div>
        <div className="min-w-[140px]">
          <Select
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Loại"
            aria-label="Lọc loại"
            showSearch={false}
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm theo tiêu đề, nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm bài viết"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được tin tức"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Newspaper}
            title={isFilteredEmpty ? 'Không có bài khớp bộ lọc' : 'Chưa có tin tức nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái / loại.'
                : 'Tạo bài viết đầu tiên để bắt đầu.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreate
                  ? { label: 'Thêm mới', onClick: () => navigate('/qtht/tin-tuc/tao-moi') }
                  : undefined
            }
          />
        </div>
      ) : (
        <AppTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleteReq.isPending) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteReq.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) })
        }}
        title="Xóa bài viết này?"
        message={`Bài "${deleteTarget?.title || ''}" sẽ bị xóa. Không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
