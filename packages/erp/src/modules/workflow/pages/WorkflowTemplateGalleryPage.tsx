// ============================================================
// WorkflowTemplateGalleryPage — /qtht/workflows/templates
// List từ GET /workflows/templates — không hardcode graph.
// ============================================================

import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookTemplate, Loader2, Copy, LayoutTemplate,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, ErrorState } from '@frezo/ui'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useCloneWorkflowTemplate,
  useWorkflowTemplates,
} from '../hooks/useWorkflowGraph'

export function WorkflowTemplateGalleryPage() {
  const nav = useNavigate()
  const canClone = usePermission('WORKFLOWS.TEMPLATES.CREATE')
  const { data: templates = [], isLoading, isError, refetch, isFetching } =
    useWorkflowTemplates()
  const clone = useCloneWorkflowTemplate()

  const onClone = (code: string) => {
    clone.mutate(code, {
      onSuccess: (res) => {
        if (res?.id) nav(`/qtht/workflows/${res.id}/designer`)
        else nav('/approval/flows?tab=templates')
      },
    })
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-5xl mx-auto w-full">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <LayoutTemplate size={18} className="text-primary-600" />
            Thư viện mẫu workflow
          </span>
        }
        description="Mẫu lưu trên BE (GET /workflows/templates). Clone → mở Designer — không hardcode graph trên FE."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => nav('/approval/flows?tab=templates')}
            >
              <ArrowLeft size={14} /> Danh sách quy trình
            </Button>
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? <Loader2 size={14} className="animate-spin" /> : null}{' '}
              Làm mới
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-neutral-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <ErrorState
            title="Không tải được thư viện mẫu"
            message="Lỗi API /workflows/templates. Vui lòng thử lại."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : templates.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={BookTemplate}
            title="Chưa có mẫu trên server"
            description="Máy chủ trả trống hoặc 404 — giao diện không giả lập sơ đồ tuyển dụng. Hãy tạo mẫu trên máy chủ rồi làm mới."
            action={{
              label: 'Về danh sách quy trình',
              onClick: () => nav('/approval/flows?tab=templates'),
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((t) => (
            <div
              key={t.key}
              className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-primary-300 hover:shadow-sm transition flex flex-col gap-3"
            >
              <div>
                <div className="text-[10px] font-mono text-neutral-400">{t.key}</div>
                <div className="font-semibold text-neutral-900 mt-0.5">{t.name}</div>
                {t.description && (
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-auto">
                <span>
                  {t.moduleCode || '—'}
                  {t.nodeCount != null ? ` · ${t.nodeCount} node` : ''}
                </span>
                {canClone ? (
                  <Button
                    size="sm"
                    className="gap-1"
                    disabled={clone.isPending}
                    onClick={() => onClone(t.key)}
                  >
                    <Copy size={12} /> Clone & Designer
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
