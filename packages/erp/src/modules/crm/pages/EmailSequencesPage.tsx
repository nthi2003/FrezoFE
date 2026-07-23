// ============================================================
// EmailSequencesPage — LNK-09: block enroll khi thiếu email activated
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Loader2, Settings } from 'lucide-react'
import { PageHeader, EmptyState, Button, ErrorState } from '@frezo/ui'
import { useEmailSequences } from '../hooks/useEmailSequences'
import { useEmailConfigs } from '@/modules/email/hooks/useEmail'

export function EmailSequencesPage() {
  const navigate = useNavigate()
  const { data: list = [], isLoading, isError, refetch, isFetching } = useEmailSequences()
  const { data: configs, isLoading: configsLoading } = useEmailConfigs()

  const hasActivatedConfig = useMemo(() => {
    if (!configs) return false
    return (configs as { activated?: boolean }[]).some((c) => c.activated)
  }, [configs])

  if (configsLoading) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <PageHeader
          title="Email sequences"
          description="Chuỗi email nurture — kiểm tra cấu hình email…"
        />
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      </div>
    )
  }

  if (!hasActivatedConfig) {
    return (
      <div className="p-6 space-y-4 animate-fade-in">
        <PageHeader
          title="Email sequences"
          description="Chuỗi email nurture — cần cấu hình email đã Activate trước khi enroll."
        />
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Mail}
            title="Chưa có cấu hình email hoạt động"
            description="Enroll sequence bị chặn khi thiếu config activated (parity LNK-09 / MAIL-01). Activate cấu hình rồi quay lại."
            action={{
              label: 'Đến cấu hình email (Activate)',
              onClick: () => navigate('/email/config'),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Email sequences"
        description="Chuỗi email nurture — enroll chỉ khi email config đã Activate."
        actions={
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => navigate('/email/config')}
          >
            <Settings size={14} /> Cấu hình email
          </Button>
        }
      />

      {isLoading || configsLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được email sequences"
            message="Lỗi API / mạng. Thử lại hoặc kiểm tra quyền CRM."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Mail}
            title="Chưa có sequence"
            description="Tạo sequence khi BA/SA mở quyền mutate. Enroll vẫn cần email config activated."
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {list.map((seq) => (
            <div key={seq.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="font-semibold">{seq.name}</div>
              <p className="text-xs text-neutral-500">
                {seq.steps?.length || 0} bước · {seq.active ? 'Active' : 'Off'}
              </p>
              <ol className="mt-3 space-y-1.5">
                {[...(seq.steps || [])]
                  .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
                  .map((s, i) => (
                    <li
                      key={s.id || i}
                      className="text-xs text-neutral-600 flex gap-2"
                    >
                      <span className="font-mono text-neutral-400 w-4">
                        {s.stepOrder ?? i}
                      </span>
                      <span className="truncate">{s.subject || '—'}</span>
                    </li>
                  ))}
              </ol>
              <p className="mt-3 text-[11px] text-emerald-700">
                Email config OK — enroll chờ ma trận quyền (BA).
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
