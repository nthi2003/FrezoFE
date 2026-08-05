// ============================================================
// OnboardingPage — wizard 3 bước (FR-UX-07)
// 1) Chọn/tạo template → 2) Gán Person → 3) Theo dõi progress
// LNK-06: bước User ẩn khi policy B.
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList, Loader2, UserPlus, Info, Check } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState, ErrorState, PageGuideButton, Select } from '@frezo/ui'
import {
  useOnboardingTemplates,
  useOnboardingAssignments,
  useCreateOnboardingTemplate,
  useAssignOnboarding,
  useCompleteOnboardingItem,
} from '../hooks/useOnboarding'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import {
  ONBOARDING_PIPELINE,
  onboardingStepIndex,
} from '../constants/hrWorkflow'
import { ONBOARDING_GUIDE } from '../constants/onboarding.guide'

const LNK06_POLICY: 'A' | 'B' = 'B'

const DEFAULT_TPL_ITEMS_B = 'Nhận máy · Email công ty · Training · Giấy tờ'
const DEFAULT_TPL_ITEMS_A = 'Nhận máy · Email · Tài khoản User+Role · Training'

type WizardStep = 1 | 2 | 3

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 1, label: 'Template' },
  { key: 2, label: 'Gán Person' },
  { key: 3, label: 'Tiến độ' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<WizardStep>(1)
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
  const [tplName, setTplName] = useState('')
  const [tplItems, setTplItems] = useState(
    LNK06_POLICY === 'A' ? DEFAULT_TPL_ITEMS_A : DEFAULT_TPL_ITEMS_B,
  )
  const [selectedTplId, setSelectedTplId] = useState('')
  const [assignForm, setAssignForm] = useState({ templateId: '', personId: '' })

  const maxAssignmentProgress = assignments.reduce(
    (max, a) => Math.max(max, Math.round(a.progress || 0)),
    0,
  )
  const pipelineIndex = onboardingStepIndex(step, maxAssignmentProgress)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Tiếp nhận nhân sự mới"
        description="Quy trình chào đón nhân viên mới — tạo mẫu → gán nhân viên → theo dõi tiến độ."
        actions={
          <>
            <PageGuideButton guide={ONBOARDING_GUIDE} />
            {step === 1 ? (
              <Button className="gap-1.5" onClick={() => setTplOpen(true)}>
                <Plus size={14} /> Mẫu mới
              </Button>
            ) : null}
          </>
        }
      />

      <StatusPipelineStepper
        steps={ONBOARDING_PIPELINE}
        currentIndex={pipelineIndex}
      />

      {/* FR-UX-07 wizard admin */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        {STEPS.map((s, idx) => {
          const active = step === s.key
          const done = step > s.key
          return (
            <div key={s.key} className="flex items-center gap-2">
              {idx > 0 && <div className="w-6 h-px bg-neutral-200" />}
              <button
                type="button"
                onClick={() => setStep(s.key)}
                className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold border transition ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600'
                    : done
                      ? 'bg-success-light text-success-dark border-success/30'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] inline-flex items-center justify-center ${
                    active ? 'bg-white/20' : done ? 'bg-success text-white' : 'bg-neutral-200'
                  }`}
                >
                  {done ? <Check size={12} /> : s.key}
                </span>
                {s.label}
              </button>
            </div>
          )
        })}
      </div>

      {LNK06_POLICY === 'B' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 flex gap-3">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-700" />
          <div className="space-y-1">
            <p className="font-semibold">Policy tài khoản (LNK-06 · B): không cấp User từ Onboarding</p>
            <p className="text-amber-900/90">
              Checklist không gồm bước «Tài khoản». Liên hệ QTHT tạo User tại{' '}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                onClick={() => navigate('/qtht/users')}
              >
                /qtht/users
              </button>
              .
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-700">Bước 1 — Chọn template</h2>
          {errT ? (
            <div className="border rounded-xl bg-white">
              <ErrorState title="Không tải được mẫu" onRetry={() => refetchT()} isRetrying={fetchingT} />
            </div>
          ) : loadingT ? (
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          ) : templates.length === 0 ? (
            <div className="border rounded-xl bg-white">
              <EmptyState
                icon={ClipboardList}
                title="Chưa có mẫu"
                description="Tạo checklist mẫu cho nhân viên mới."
                action={{ label: 'Template mới', onClick: () => setTplOpen(true) }}
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map((t) => {
                const selected = selectedTplId === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTplId(t.id)
                      setAssignForm((f) => ({ ...f, templateId: t.id }))
                    }}
                    className={`text-left bg-white border rounded-xl p-4 shadow-sm transition ${
                      selected ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-neutral-900">{t.name}</div>
                    <p className="text-xs text-neutral-500 mt-0.5">{t.items?.length || 0} hạng mục</p>
                    <ul className="mt-2 space-y-0.5">
                      {[...(t.items || [])]
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .slice(0, 5)
                        .map((it, i) => (
                          <li key={it.id || i} className="text-xs text-neutral-600">· {it.title}</li>
                        ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              disabled={!selectedTplId && templates.length > 0}
              onClick={() => {
                if (!selectedTplId && templates[0]) {
                  setSelectedTplId(templates[0].id)
                  setAssignForm((f) => ({ ...f, templateId: templates[0].id }))
                }
                setStep(2)
              }}
            >
              Tiếp: Gán Person
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3 max-w-lg">
          <h2 className="text-sm font-semibold text-neutral-700">Bước 2 — Gán Person</h2>
          {templates.length === 0 ? (
            <div className="border rounded-xl bg-white">
              <EmptyState
                icon={UserPlus}
                title="Chưa có mẫu để gán"
                description="Quay lại bước 1 tạo mẫu trước."
                action={{ label: 'Về Template', onClick: () => setStep(1) }}
              />
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-4 space-y-3">
              <Select
                options={[
                  { value: '', label: '— Mẫu —' },
                  ...templates.map((t) => ({ value: t.id, label: t.name })),
                ]}
                value={assignForm.templateId || selectedTplId}
                onChange={(v) => {
                  setSelectedTplId(v)
                  setAssignForm({ ...assignForm, templateId: v })
                }}
                placeholder="— Mẫu —"
                aria-label="Chọn mẫu tiếp nhận nhân sự"
                showSearch={templates.length > 8}
              />
              <input
                className="w-full border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="Mã nhân viên"
                value={assignForm.personId}
                onChange={(e) => setAssignForm({ ...assignForm, personId: e.target.value })}
              />
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Quay lại</Button>
                <Button
                  disabled={
                    !(assignForm.templateId || selectedTplId) ||
                    !assignForm.personId ||
                    assign.isPending
                  }
                  onClick={() =>
                    assign.mutate(
                      {
                        templateId: assignForm.templateId || selectedTplId,
                        personId: assignForm.personId,
                      },
                      {
                        onSuccess: () => {
                          setAssignForm({ templateId: '', personId: '' })
                          setStep(3)
                        },
                      },
                    )
                  }
                >
                  {assign.isPending ? 'Đang gán…' : 'Gán & xem tiến độ'}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-700">Bước 3 — Theo dõi tiến độ</h2>
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Gán thêm
            </Button>
          </div>
          {errA ? (
            <div className="border rounded-xl bg-white">
              <ErrorState title="Không tải được checklist" onRetry={() => refetchA()} isRetrying={fetchingA} />
            </div>
          ) : loadingA ? (
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          ) : assignments.length === 0 ? (
            <div className="border rounded-xl bg-white">
              <EmptyState
                icon={ClipboardList}
                title="Chưa gán checklist"
                description="Gán mẫu cho nhân viên ở bước 2."
                action={{ label: 'Gán nhân viên', onClick: () => setStep(2) }}
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
                        const done =
                          (it.status || '').toUpperCase() === 'DONE' ||
                          (it.status || '').toUpperCase() === 'COMPLETED' ||
                          !!it.completedAt
                        return (
                          <li key={it.id} className="flex items-center justify-between gap-2">
                            <span className={`text-sm ${done ? 'line-through text-neutral-400' : ''}`}>
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
      )}

      <AppModal isOpen={tplOpen} onClose={() => setTplOpen(false)} title="Tạo mẫu">
        <div className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Tên mẫu"
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
            <Button variant="outline" onClick={() => setTplOpen(false)}>Huỷ</Button>
            <Button
              disabled={!tplName.trim() || createTpl.isPending}
              onClick={() => {
                const items = tplItems
                  .split(/[·\n,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
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
                  {
                    onSuccess: (res: any) => {
                      setTplOpen(false)
                      const id = res?.id || res?.data?.id
                      if (id) {
                        setSelectedTplId(id)
                        setAssignForm((f) => ({ ...f, templateId: id }))
                      }
                    },
                  },
                )
              }}
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
