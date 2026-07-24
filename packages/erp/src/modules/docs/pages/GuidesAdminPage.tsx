// ============================================================
// GuidesAdminPage — /admin/guides (FR-DOC-04)
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Pencil, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
} from '@frezo/ui'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useAdminGuides,
  useDeleteGuide,
  usePublishGuide,
  useUnpublishGuide,
} from '../hooks/useGuides'

export function GuidesAdminPage() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin =
    !!user?.isAdmin ||
    user?.username === 'admin' ||
    !!user?.roles?.includes('ADMIN') ||
    !!user?.roles?.includes('SUPER_ADMIN')
  const canView = usePermission('QTHT.GUIDES.VIEW')
  const canManage = isAdmin || canView

  const { data, isLoading, isError, refetch, isFetching } = useAdminGuides(canManage)
  const publishReq = usePublishGuide()
  const unpublishReq = useUnpublishGuide()
  const deleteReq = useDeleteGuide()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (!canManage) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
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
    <div className="p-6 animate-fade-in max-w-5xl mx-auto w-full space-y-6">
      <PageHeader
        title="Quản lý hướng dẫn"
        description="Soạn Markdown, xuất bản lên Tài liệu — user chỉ thấy bài đã xuất bản."
        actions={
          <Button onClick={() => nav('/admin/guides/new')} className="gap-1.5">
            <Plus size={16} /> Thêm hướng dẫn
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-neutral-500 py-16 text-center">Đang tải…</div>
      ) : isError ? (
        <ErrorState
          title="Không tải được danh sách hướng dẫn"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : !data?.length ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có hướng dẫn trên máy chủ"
          description="Tạo bài đầu tiên, rồi bấm Xuất bản để hiện trên /docs."
          action={{ label: 'Thêm hướng dẫn', onClick: () => nav('/admin/guides/new') }}
        />
      ) : (
        <div className="space-y-2">
          {data.map((g: any) => (
            <div
              key={g.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-neutral-900">{g.title}</span>
                  <StatusBadge
                    label={g.published ? 'Đã xuất bản' : 'Nháp'}
                    color={g.published ? 'success' : 'neutral'}
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-0.5 truncate">
                  {g.summary || g.module || g.slug}
                </p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">{g.slug}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Sửa"
                  onClick={() => nav(`/admin/guides/${g.id}/edit`)}
                >
                  <Pencil size={16} />
                </Button>
                {g.published ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Gỡ xuất bản"
                    disabled={unpublishReq.isPending}
                    onClick={() => unpublishReq.mutate(g.id)}
                  >
                    <EyeOff size={16} />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Xuất bản"
                    disabled={publishReq.isPending}
                    onClick={() => publishReq.mutate(g.id)}
                  >
                    <Eye size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Xóa"
                  onClick={() => setDeleteId(g.id)}
                >
                  <Trash2 size={16} className="text-danger-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa hướng dẫn?"
        message="Bài sẽ bị gỡ khỏi danh sách. Có thể không khôi phục được từ màn này."
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteReq.isPending}
        onConfirm={() => {
          if (deleteId) deleteReq.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
        }}
      />
    </div>
  )
}
