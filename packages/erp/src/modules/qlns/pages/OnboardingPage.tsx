// ============================================================
// OnboardingPage — template + assignment items[] / progress
// ============================================================

import { useState } from 'react'
import { Plus, ClipboardList, Loader2, UserPlus } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState } from '@frezo/ui'
import {
  useOnboardingTemplates,
  useOnboardingAssignments,
  useCreateOnboardingTemplate,
  useAssignOnboarding,
  useCompleteOnboardingItem,
} from '../hooks/useOnboarding'

export function OnboardingPage() {
  const { data: templates = [], isLoading: loadingT } = useOnboardingTemplates()
  const { data: assignments = [], isLoading: loadingA } = useOnboardingAssignments()
  const createTpl = useCreateOnboardingTemplate()
  const assign = useAssignOnboarding()
  const complete = useCompleteOnboardingItem()

  const [tplOpen, setTplOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplItems, setTplItems] = useState('Nhận máy · Email · Tài khoản · Training')
  const [assignForm, setAssignForm] = useState({ templateId: '', personId: '' })

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Onboarding"
        description="Checklist chào đón nhân viên mới — template và tiến độ theo người."
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={() => setAssignOpen(true)}>
              <UserPlus size={14} /> Gán checklist
            </Button>
            <Button className="gap-1.5" onClick={() => setTplOpen(true)}>
              <Plus size={14} /> Template mới
            </Button>
          </>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Templates</h2>
        {loadingT ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        ) : templates.length === 0 ? (
          <div className="border rounded-xl bg-white">
            <EmptyState
              icon={ClipboardList}
              title="Chưa có template"
              description="Tạo checklist mẫu cho nhân viên mới."
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="font-semibold text-neutral-900">{t.name}</div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.items?.length || 0} hạng mục
                </p>
                <ul className="mt-2 space-y-0.5">
                  {[...(t.items || [])]
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .slice(0, 5)
                    .map((it, i) => (
                      <li key={it.id || i} className="text-xs text-neutral-600">
                        · {it.title}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Tiến độ nhân viên</h2>
        {loadingA ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        ) : assignments.length === 0 ? (
          <p className="text-sm text-neutral-400">Chưa gán checklist cho ai.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const pct = Math.min(100, Math.round(a.progress || 0))
              const items = [...(a.items || [])].sort(
                (x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0),
              )
              const tpl = templates.find((t) => t.id === a.templateId)
              return (
                <div key={a.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{a.personId}</div>
                      <div className="text-xs text-neutral-500">
                        {tpl?.name || a.templateId} · {a.status}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums text-primary-700">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <ul className="mt-3 space-y-1">
                    {items.map((it) => {
                      const done = (it.status || '').toUpperCase() === 'DONE'
                        || (it.status || '').toUpperCase() === 'COMPLETED'
                        || !!it.completedAt
                      return (
                        <li key={it.id} className="flex items-center justify-between gap-2">
                          <span
                            className={`text-sm ${done ? 'line-through text-neutral-400' : ''}`}
                          >
                            {it.title}
                          </span>
                          {!done && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={complete.isPending}
                              onClick={() =>
                                complete.mutate({
                                  assignmentId: a.id,
                                  itemId: it.id,
                                })
                              }
                            >
                              Xong
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <AppModal isOpen={tplOpen} onClose={() => setTplOpen(false)} title="Tạo template">
        <div className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Tên template"
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
          />
          <textarea
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Hạng mục cách nhau bởi · hoặc xuống dòng"
            value={tplItems}
            onChange={(e) => setTplItems(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTplOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!tplName.trim() || createTpl.isPending}
              onClick={() => {
                const items = tplItems
                  .split(/[·\n,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((title, i) => ({
                    title,
                    sortOrder: i + 1,
                    required: true,
                  }))
                createTpl.mutate(
                  { name: tplName, items, active: true },
                  { onSuccess: () => setTplOpen(false) },
                )
              }}
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Gán checklist">
        <div className="space-y-3">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={assignForm.templateId}
            onChange={(e) =>
              setAssignForm({ ...assignForm, templateId: e.target.value })
            }
          >
            <option value="">— Template —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Person ID"
            value={assignForm.personId}
            onChange={(e) =>
              setAssignForm({ ...assignForm, personId: e.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={
                !assignForm.templateId || !assignForm.personId || assign.isPending
              }
              onClick={() =>
                assign.mutate(assignForm, { onSuccess: () => setAssignOpen(false) })
              }
            >
              Gán
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
