// ============================================================
// OnboardingPage — template + assignment items[] / progress
// LNK-06: bước User ẩn khi policy B (mặc định FE) — copy rõ không cấp TK.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, Loader2, UserPlus, Info } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState, ErrorState } from '@frezo/ui'
import {
  useOnboardingTemplates,
  useOnboardingAssignments,
  useCreateOnboardingTemplate,
  useAssignOnboarding,
  useCompleteOnboardingItem,
} from '../hooks/useOnboarding'

/**
 * LNK-06 policy (FE SSOT tạm đến khi PO chốt BE flag):
 * - 'B' = không tạo User từ HRM/onboarding; checklist không có bước Tài khoản.
 * - 'A' = bắt buộc tạo User+Role (wizard — chờ BE).
 */
const LNK06_POLICY: 'A' | 'B' = 'B'

const DEFAULT_TPL_ITEMS_B = 'Nhận máy · Email công ty · Training · Giấy tờ'
const DEFAULT_TPL_ITEMS_A = 'Nhận máy · Email · Tài khoản User+Role · Training'

export function OnboardingPage() {
  const navigate = useNavigate()
  const {
    data: templates = [],
    isLoading: loadingT,
    isError: errT,
    refetch: refetchT,
    isFetching: fetchingT,
  } = useOnboardingTemplates()
  const {
    data: assignments = [],
    isLoading: loadingA,
    isError: errA,
    refetch: refetchA,
    isFetching: fetchingA,
  } = useOnboardingAssignments()
  const createTpl = useCreateOnboardingTemplate()
  const assign = useAssignOnboarding()
  const complete = useCompleteOnboardingItem()

  const [tplOpen, setTplOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [tplName, setTplName] = useState('')
  const [tplItems, setTplItems] = useState(
    LNK06_POLICY === 'A' ? DEFAULT_TPL_ITEMS_A : DEFAULT_TPL_ITEMS_B,
  )
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

      {LNK06_POLICY === 'B' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 flex gap-3">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-700" />
          <div className="space-y-1">
            <p className="font-semibold">Policy tài khoản (LNK-06 · B): không cấp User từ Onboarding</p>
            <p className="text-amber-900/90">
              Checklist <strong>không</strong> gồm bước «Tài khoản». Nhân viên có hồ sơ Person nhưng
              chưa login ERP — liên hệ QTHT tạo User + gán Role tại{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => navigate('/qtht/users')}
              >
                /qtht/users
              </button>
              . Không dùng copy mơ hồ «có thể tạo sau».
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-700">Templates</h2>
        {errT ? (
          <div className="border rounded-xl bg-white">
            <ErrorState
              title="Không tải được template"
              onRetry={() => refetchT()}
              isRetrying={fetchingT}
            />
          </div>
        ) : loadingT ? (
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
        {errA ? (
          <div className="border rounded-xl bg-white">
            <ErrorState
              title="Không tải được checklist"
              onRetry={() => refetchA()}
              isRetrying={fetchingA}
            />
          </div>
        ) : loadingA ? (
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        ) : assignments.length === 0 ? (
          <div className="border rounded-xl bg-white">
            <EmptyState
              icon={ClipboardList}
              title="Chưa gán checklist"
              description="Gán template cho Person sau khi hire — không có bước Tài khoản (LNK-06 · B)."
            />
          </div>
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
                  // LNK-06 policy B: strip bước Tài khoản / User khỏi template
                  .filter((title) => {
                    if (LNK06_POLICY !== 'B') return true
                    return !/tài\s*khoản|user\s*\+?\s*role|tạo\s*user/i.test(title)
                  })
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
