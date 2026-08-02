// ============================================================
// OffboardingPage — wizard 5 bước nghỉ việc (FR-HR-10)
// Đề xuất → Duyệt → Bàn giao TS → Chốt lương → Thu hồi TK
// ============================================================

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Check,
  UserMinus,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  AppModal,
  Select,
} from '@frezo/ui'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import {
  OFFBOARDING_PIPELINE,
  offboardingStepIndex,
  offboardingWizardStep,
} from '../constants/hrWorkflow'
import { OFFBOARDING_GUIDE } from '../constants/offboarding.guide'
import { usePersonsCombobox } from '../hooks/usePerson'
import {
  useResignations,
  useCreateResignation,
  useApproveResignation,
  useHandoverResignation,
  useSettlePayrollResignation,
  useCompleteResignation,
  useCancelResignation,
} from '../hooks/useResignation'
import type { ResignationDto } from '../services/resignationApi'

const WIZARD_STEPS = [
  { key: 1, label: 'Đề xuất' },
  { key: 2, label: 'Duyệt' },
  { key: 3, label: 'Bàn giao' },
  { key: 4, label: 'Chốt lương' },
  { key: 5, label: 'Thu hồi TK' },
] as const

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  HANDOVER_DONE: 'Đã bàn giao',
  PAYROLL_SETTLED: 'Đã chốt lương',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
}

export function OffboardingPage() {
  const navigate = useNavigate()
  const { data: rows = [], isLoading, isError, refetch, isFetching } = useResignations()
  const { options: personOptions, isLoading: personsLoading } = usePersonsCombobox()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  )

  const createMut = useCreateResignation()
  const approveMut = useApproveResignation()
  const handoverMut = useHandoverResignation()
  const settleMut = useSettlePayrollResignation()
  const completeMut = useCompleteResignation()
  const cancelMut = useCancelResignation()

  const [createForm, setCreateForm] = useState({
    personId: '',
    expectedLastDay: '',
    reason: '',
  })

  const [approveForm, setApproveForm] = useState({ actualLastDay: '' })
  const [handoverForm, setHandoverForm] = useState({
    laptopReturned: false,
    badgeReturned: false,
    docsHandedOver: false,
    note: '',
  })

  const pipelineIndex = offboardingStepIndex(selected?.status)
  const wizardStep = selected ? offboardingWizardStep(selected.status) : 1

  const handleCreate = async () => {
    if (!createForm.personId || !createForm.expectedLastDay) return
    const created = await createMut.mutateAsync({
      personId: createForm.personId,
      expectedLastDay: createForm.expectedLastDay,
      reason: createForm.reason || undefined,
    })
    setShowCreate(false)
    setCreateForm({ personId: '', expectedLastDay: '', reason: '' })
    setSelectedId(created.id)
  }

  const handleApprove = async () => {
    if (!selected) return
    await approveMut.mutateAsync({
      id: selected.id,
      body: approveForm.actualLastDay
        ? { actualLastDay: approveForm.actualLastDay }
        : undefined,
    })
  }

  const handleHandover = async () => {
    if (!selected) return
    await handoverMut.mutateAsync({
      id: selected.id,
      body: handoverForm,
    })
  }

  const handleSettle = async () => {
    if (!selected) return
    await settleMut.mutateAsync(selected.id)
  }

  const handleComplete = async () => {
    if (!selected) return
    await completeMut.mutateAsync(selected.id)
    setConfirmComplete(false)
  }

  const handleCancel = async () => {
    if (!selected) return
    await cancelMut.mutateAsync(selected.id)
    setConfirmCancel(false)
    setSelectedId(null)
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState title="Không tải được danh sách offboarding" onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Offboarding"
        description="Wizard nghỉ việc 5 bước — đề xuất → duyệt → bàn giao → chốt lương → thu hồi TK."
        actions={
          <>
            <PageGuideButton guide={OFFBOARDING_GUIDE} />
            <Button className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Đề xuất mới
            </Button>
          </>
        }
      />

      <StatusPipelineStepper
        steps={OFFBOARDING_PIPELINE}
        currentIndex={pipelineIndex}
        nextCta={
          selected?.status === 'PAYROLL_SETTLED'
            ? {
                label: 'Hoàn tất offboarding',
                onClick: () => setConfirmComplete(true),
                loading: completeMut.isPending,
              }
            : selected?.status === 'APPROVED'
              ? {
                  label: 'Mở Tài sản',
                  href: '/assets',
                }
              : selected?.status === 'HANDOVER_DONE'
                ? {
                    label: 'Mở Bảng lương',
                    href: '/qlns/payroll?tab=payrolls',
                  }
                : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Danh sách đơn */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700">Đơn nghỉ việc</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500 py-8">
              <Loader2 size={16} className="animate-spin" /> Đang tải…
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={UserMinus}
              title="Chưa có đơn nghỉ việc"
              description="Bấm **Đề xuất mới** để khởi tạo offboarding."
            />
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id)
                      setApproveForm({ actualLastDay: r.actualLastDay || r.expectedLastDay || '' })
                      setHandoverForm({
                        laptopReturned: r.laptopReturned ?? false,
                        badgeReturned: r.badgeReturned ?? false,
                        docsHandedOver: r.docsHandedOver ?? false,
                        note: r.handoverNote ?? '',
                      })
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                      selectedId === r.id
                        ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-200'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{r.personName || r.personId}</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">
                      {r.requestCode}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-neutral-400">
                        HSD: {r.expectedLastDay || '—'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isFetching && !isLoading && (
            <p className="text-xs text-neutral-400">Đang cập nhật…</p>
          )}
        </div>

        {/* Panel wizard */}
        <div className="lg:col-span-8">
          {!selected ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 p-10 text-center">
              <UserMinus className="mx-auto text-neutral-400 mb-3" size={32} />
              <p className="text-sm text-neutral-600">
                Chọn đơn bên trái hoặc tạo đề xuất mới để bắt đầu wizard.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selected.personName}</h2>
                  <p className="text-sm text-neutral-500">
                    {selected.requestCode} · {selected.reason || 'Không ghi lý do'}
                  </p>
                </div>
                <StatusBadge status={selected.status} large />
              </div>

              {/* Wizard stepper */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                {WIZARD_STEPS.map((s, idx) => {
                  const active = wizardStep === s.key
                  const done = wizardStep > s.key || selected.status === 'COMPLETED'
                  return (
                    <div key={s.key} className="flex items-center gap-2">
                      {idx > 0 && <div className="w-4 h-px bg-neutral-200" />}
                      <span
                        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-semibold ${
                          active
                            ? 'bg-primary-600 text-white'
                            : done
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-white text-neutral-500 border border-neutral-200'
                        }`}
                      >
                        {done ? <Check size={12} /> : s.key}
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <StepPanel selected={selected} wizardStep={wizardStep} />

              {/* Actions theo bước */}
              {selected.status === 'REQUESTED' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                  <label className="text-sm">
                    Ngày làm việc cuối
                    <input
                      type="date"
                      className="mt-1 block w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      value={approveForm.actualLastDay || selected.expectedLastDay || ''}
                      onChange={(e) => setApproveForm({ actualLastDay: e.target.value })}
                    />
                  </label>
                  <div className="flex items-end gap-2 ml-auto">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmCancel(true)}
                      disabled={cancelMut.isPending}
                    >
                      Huỷ đơn
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={approveMut.isPending}
                      className="gap-1.5"
                    >
                      {approveMut.isPending && <Loader2 size={14} className="animate-spin" />}
                      Duyệt timeline
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'APPROVED' && (
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <p className="text-sm font-medium">Checklist bàn giao</p>
                  {(
                    [
                      ['laptopReturned', 'Thu laptop'],
                      ['badgeReturned', 'Thu thẻ ra vào'],
                      ['docsHandedOver', 'Bàn giao tài liệu'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={handoverForm[key]}
                        onChange={(e) =>
                          setHandoverForm((f) => ({ ...f, [key]: e.target.checked }))
                        }
                        className="rounded border-neutral-300"
                      />
                      {label}
                    </label>
                  ))}
                  <textarea
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    placeholder="Ghi chú bàn giao (tuỳ chọn)"
                    rows={2}
                    value={handoverForm.note}
                    onChange={(e) =>
                      setHandoverForm((f) => ({ ...f, note: e.target.value }))
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild>
                      <Link to="/assets" className="gap-1.5">
                        <ExternalLink size={14} /> Module Tài sản
                      </Link>
                    </Button>
                    <Button
                      onClick={handleHandover}
                      disabled={handoverMut.isPending}
                      className="gap-1.5"
                    >
                      {handoverMut.isPending && <Loader2 size={14} className="animate-spin" />}
                      Xác nhận bàn giao
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'HANDOVER_DONE' && (
                <div className="pt-2 border-t border-neutral-100 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>
                      Tính & chi trả lương tháng cuối tại{' '}
                      <Link to="/qlns/payroll?tab=payrolls" className="underline font-medium">
                        Bảng lương
                      </Link>
                      , sau đó bấm xác nhận chốt lương.
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSettle}
                      disabled={settleMut.isPending}
                      className="gap-1.5"
                    >
                      {settleMut.isPending && <Loader2 size={14} className="animate-spin" />}
                      Xác nhận chốt lương
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'PAYROLL_SETTLED' && (
                <div className="pt-2 border-t border-neutral-100 space-y-3">
                  <div className="text-sm text-neutral-600">
                    Bước cuối: vô hiệu hoá Person và nhắc QTHT khóa User ERP tại{' '}
                    <Link to="/qtht/users" className="text-primary-600 underline">
                      Người dùng
                    </Link>
                    .
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => navigate('/qtht/users')}>
                      Mở QTHT Users
                    </Button>
                    <Button
                      onClick={() => setConfirmComplete(true)}
                      disabled={completeMut.isPending}
                      className="gap-1.5"
                    >
                      Hoàn tất offboarding
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === 'COMPLETED' && (
                <div className="rounded-lg bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
                  Offboarding hoàn tất
                  {selected.completedAt ? ` lúc ${selected.completedAt.slice(0, 16).replace('T', ' ')}` : ''}.
                  Person đã chuyển <b>Không hoạt động</b>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AppModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Đề xuất nghỉ việc"
        maxWidth="md"
      >
        <div className="space-y-4">
            <label className="block text-sm">
              Nhân viên *
              <div className="mt-1">
                <Select
                  options={personOptions.map((o) => ({ value: o.value, label: o.label }))}
                  value={createForm.personId}
                  onChange={(v) => setCreateForm((f) => ({ ...f, personId: v }))}
                  placeholder={personsLoading ? 'Đang tải…' : '— Chọn nhân viên —'}
                  aria-label="Nhân viên"
                />
              </div>
            </label>
            <label className="block text-sm">
              Ngày làm việc cuối dự kiến *
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                value={createForm.expectedLastDay}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, expectedLastDay: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              Lý do
              <textarea
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                rows={3}
                value={createForm.reason}
                onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="VD: Chuyển công ty, nghỉ dài hạn…"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Đóng
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMut.isPending || !createForm.personId || !createForm.expectedLastDay
                }
                className="gap-1.5"
              >
                {createMut.isPending && <Loader2 size={14} className="animate-spin" />}
                Tạo đề xuất
              </Button>
            </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={confirmComplete}
        onClose={() => setConfirmComplete(false)}
        title="Hoàn tất offboarding?"
        message="Person sẽ chuyển trạng thái Không hoạt động. Nhớ khóa User ERP tại QTHT nếu chưa làm."
        confirmText="Hoàn tất"
        onConfirm={handleComplete}
        isLoading={completeMut.isPending}
      />

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Huỷ đơn nghỉ việc?"
        message="Đơn sẽ chuyển trạng thái CANCELLED — không thể tiếp tục wizard."
        confirmText="Huỷ đơn"
        variant="danger"
        onConfirm={handleCancel}
        isLoading={cancelMut.isPending}
      />
    </div>
  )
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const tone =
    status === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'CANCELLED'
        ? 'bg-neutral-100 text-neutral-600'
        : status === 'REQUESTED'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-blue-50 text-blue-700'
  return (
    <span
      className={`font-semibold rounded ${tone} ${
        large ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5'
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function StepPanel({
  selected,
  wizardStep,
}: {
  selected: ResignationDto
  wizardStep: number
}) {
  const rows = [
    { label: 'Ngày cuối dự kiến', value: selected.expectedLastDay || '—' },
    { label: 'Ngày cuối thực tế', value: selected.actualLastDay || '—' },
    {
      label: 'QLTT duyệt',
      value: selected.managerApprovedBy
        ? `${selected.managerApprovedBy} ✓`
        : wizardStep > 1
          ? '—'
          : 'Chờ duyệt',
    },
    {
      label: 'Bàn giao TS',
      value:
        selected.status === 'HANDOVER_DONE' ||
        selected.status === 'PAYROLL_SETTLED' ||
        selected.status === 'COMPLETED'
          ? 'Đủ checklist ✓'
          : wizardStep > 2
            ? 'Đang bàn giao'
            : '—',
    },
    {
      label: 'Chốt lương',
      value: selected.payrollSettledAt
        ? selected.payrollSettledAt.slice(0, 16).replace('T', ' ')
        : '—',
    },
  ]

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
      {rows.map((r) => (
        <div key={r.label} className="rounded-lg bg-neutral-50 px-3 py-2">
          <dt className="text-xs text-neutral-500">{r.label}</dt>
          <dd className="font-medium mt-0.5">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
