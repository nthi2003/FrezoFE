// ============================================================
// DocsHubPage — /docs list (FR-DOC-02 + FR-DOC-04 CMS)
// ============================================================

import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, Settings2 } from 'lucide-react'
import { Button, ErrorState, PageHeader } from '@frezo/ui'
import { useAuthStore } from '@/stores/authStore'
import { usePermission } from '@/lib/hooks/usePermission'
import { DocsSideNav } from '../components/DocsSideNav'
import { useHubDocs } from '../hooks/useGuides'

export function DocsHubPage() {
  const nav = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin =
    !!user?.isAdmin ||
    user?.username === 'admin' ||
    !!user?.roles?.includes('ADMIN') ||
    !!user?.roles?.includes('SUPER_ADMIN')
  const canManageGuides = isAdmin || usePermission('QTHT.GUIDES.VIEW')

  const { data, isLoading, isError, refetch, isFetching } = useHubDocs()
  const docs = data?.docs ?? []
  const sourceNote =
    data?.source === 'cache'
      ? 'Đang dùng bản đã lưu (mạng lỗi) — bấm Thử lại để lấy mới.'
      : null

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto w-full">
      <PageHeader
        title="Tài liệu"
        description="Bạn muốn làm gì hôm nay? Chọn bài hướng dẫn — từng bước, đúng tên nút trên màn hình."
        actions={
          canManageGuides ? (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => nav('/admin/guides')}
            >
              <Settings2 size={14} /> Quản lý hướng dẫn
            </Button>
          ) : undefined
        }
      />

      {(data?.error || sourceNote) && (
        <div className="mt-3">
          <ErrorState
            title="Không tải được danh sách mới từ máy chủ"
            message={sourceNote || data?.error || 'Đang dùng bản dự phòng.'}
            onRetry={() => refetch()}
            isRetrying={isFetching}
            className="py-6"
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <DocsSideNav docs={docs} />

        <div className="space-y-3 min-w-0">
          {isLoading ? (
            <div className="text-sm text-neutral-500 py-16 text-center">Đang tải tài liệu…</div>
          ) : isError && docs.length === 0 ? (
            <ErrorState
              title="Không tải được tài liệu"
              message="Kiểm tra mạng / BE Guide API rồi thử lại."
              onRetry={() => refetch()}
              isRetrying={isFetching}
            />
          ) : (
            docs.map((doc) => (
              <button
                key={doc.slug}
                type="button"
                onClick={() => nav(`/docs/${doc.slug}`)}
                className="w-full text-left group flex items-start gap-4 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 group-hover:text-primary-800">
                    {doc.title}
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">{doc.description}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-neutral-300 group-hover:text-primary-600 mt-1 shrink-0"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
