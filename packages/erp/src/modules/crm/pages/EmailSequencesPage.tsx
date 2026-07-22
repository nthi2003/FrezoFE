// ============================================================
// EmailSequencesPage — ẩn mutate CTAs đến BA amend matrix (D5)
// ============================================================

import { Mail, Loader2 } from 'lucide-react'
import { PageHeader, EmptyState } from '@frezo/ui'
import { useEmailSequences } from '../hooks/useEmailSequences'

export function EmailSequencesPage() {
  const { data: list = [], isLoading } = useEmailSequences()

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Email sequences"
        description="Chuỗi email nurture — Chưa sẵn sàng (chờ BA amend permission)."
      />

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Mail}
            title="Chưa sẵn sàng"
            description="Tạo / enroll sequence bị ẩn đến khi BA bổ sung ma trận quyền CRM sequences."
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
              <p className="mt-3 text-[11px] text-neutral-400">
                Enroll — Chưa sẵn sàng
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
