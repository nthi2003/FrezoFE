// ============================================================
// WorkflowEditorDrawer — dùng @frezo/ui Drawer
// WF-01…06: validation touched/submit, Esc, footer copy, dirty confirm
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Trash2, ArrowUp, ArrowDown, User, Users, Shield, UserCog,
  Save, AlertCircle, Loader2, Workflow,
} from 'lucide-react'
import { Button, Drawer, ConfirmDialog, ErrorState } from '@frezo/ui'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/usePermission'
import { useWorkflowDefinition, useSaveWorkflowDefinition } from '../hooks/useWorkflow'
import type { ApproverType, WorkflowDefinition, WorkflowStep } from '../services/workflowApi'
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper'
import { useUsers } from '@/modules/users/hooks/useUsers'
import { useRoles } from '@/modules/roles/hooks/useRoles'
import { Link } from 'react-router-dom'

const MODULE_OPTIONS = [
  { value: 'ASSET', label: 'Quản lý tài sản' },
  { value: 'LEAVE', label: 'Nghỉ phép' },
  { value: 'CONTRACT', label: 'Hợp đồng' },
  { value: 'PURCHASE', label: 'Mua hàng' },
  { value: 'CUSTOM', label: 'Tuỳ chỉnh' },
]

const APPROVER_TYPES: {
  value: ApproverType
  label: string
  description: string
  icon: typeof User
}[] = [
  { value: 'USER', label: 'Người cụ thể', description: 'Chỉ định 1 username duy nhất', icon: User },
  { value: 'ROLE', label: 'Theo vai trò', description: 'Bất kỳ ai có role này đều duyệt được (pool)', icon: Users },
  { value: 'MANAGER', label: 'Quản lý', description: 'Quản lý trực tiếp của người yêu cầu (auto-resolve)', icon: UserCog },
  { value: 'ADMIN', label: 'Admin', description: 'Bất kỳ Admin nào trong hệ thống', icon: Shield },
]

interface Props {
  definitionId: string | null
  cloneFrom?: WorkflowDefinition | null
  onClose: () => void
}

function validateForm(form: WorkflowDefinition): Record<string, string> {
  const e: Record<string, string> = {}
  const code = (form.code || '').trim()
  if (!code) {
    e.code = 'Mã bắt buộc'
  } else if (!/^[A-Z0-9_]+$/.test(code)) {
    e.code = 'Chỉ chữ HOA, số, dấu gạch dưới'
  }
  if (!form.name || !form.name.trim()) e.name = 'Tên bắt buộc'
  if (!form.moduleCode) e.moduleCode = 'Chọn module'
  if (!form.steps || form.steps.length === 0) e.steps = 'Cần ít nhất 1 bước'
  return e
}

function validateSteps(steps: WorkflowStep[]): Record<string, string>[] {
  return (steps || []).map((s) => {
    const e: Record<string, string> = {}
    if (!s.stepName?.trim()) e.stepName = 'Tên bước bắt buộc'
    if ((s.approverType === 'USER' || s.approverType === 'ROLE') && !s.approverValue?.trim()) {
      e.approverValue = s.approverType === 'USER' ? 'Chọn username' : 'Chọn role'
    }
    return e
  })
}

export function WorkflowEditorDrawer({ definitionId, cloneFrom, onClose }: Props) {
  const isEdit = !!definitionId
  const canSave = usePermission(
    isEdit ? 'WORKFLOWS.DEFINITIONS.UPDATE' : 'WF.DEFINITIONS.CREATE',
  )
  const {
    data: existing,
    isLoading,
    isError: loadError,
    isFetching,
    refetch,
  } = useWorkflowDefinition(definitionId || undefined)
  const save = useSaveWorkflowDefinition()

  const { data: usersRaw } = useUsers(1, 500, '')
  const { data: rolesRaw } = useRoles()
  const users = extractList(usersRaw)
  const roles = extractList(rolesRaw)

  const [form, setForm] = useState<WorkflowDefinition>(() => defaultForm())
  const baselineRef = useRef<string>('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [stepTouched, setStepTouched] = useState<Record<string, boolean>>({})
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [removeStepIdx, setRemoveStepIdx] = useState<number | null>(null)

  useEffect(() => {
    if (isEdit && existing) {
      const next = { ...existing, steps: [...(existing.steps || [])] }
      setForm(next)
      baselineRef.current = JSON.stringify(next)
      setTouched({})
      setSubmitted(false)
      setStepTouched({})
    } else if (!isEdit && cloneFrom) {
      const next = {
        code: cloneFrom.code + '_COPY',
        name: cloneFrom.name + ' (copy)',
        moduleCode: cloneFrom.moduleCode,
        description: cloneFrom.description,
        active: true,
        steps: (cloneFrom.steps || []).map((s) => ({ ...s, id: undefined })),
      }
      setForm(next)
      baselineRef.current = JSON.stringify(defaultForm())
      setTouched({})
      setSubmitted(false)
      setStepTouched({})
    } else if (!isEdit && !cloneFrom) {
      const next = defaultForm()
      setForm(next)
      baselineRef.current = JSON.stringify(next)
      setTouched({})
      setSubmitted(false)
      setStepTouched({})
    }
  }, [existing, cloneFrom, isEdit])

  const dirty = useMemo(
    () => JSON.stringify(form) !== baselineRef.current,
    [form],
  )

  const errors = useMemo(() => validateForm(form), [form])
  const stepErrors = useMemo(() => validateSteps(form.steps || []), [form.steps])
  const hasStepError = stepErrors.some((e) => Object.keys(e).length > 0)
  const formValid = Object.keys(errors).length === 0 && !hasStepError

  const showErr = (key: string) => (submitted || touched[key]) && errors[key]
  const showStepErr = (idx: number, key: string) =>
    (submitted || stepTouched[`${idx}.${key}`]) && stepErrors[idx]?.[key]

  const setF = <K extends keyof WorkflowDefinition>(k: K, v: WorkflowDefinition[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }))
  const touchStep = (idx: number, key: string) =>
    setStepTouched((t) => ({ ...t, [`${idx}.${key}`]: true }))

  const requestClose = () => {
    if (dirty) {
      setLeaveConfirmOpen(true)
      return
    }
    onClose()
  }

  const confirmLeave = () => {
    setLeaveConfirmOpen(false)
    onClose()
  }

  const addStep = () => {
    setF('steps', [
      ...(form.steps || []),
      {
        stepName: '',
        approverType: 'ADMIN',
        approverValue: null,
        allowSkip: false,
        slaHours: null,
        description: null,
      },
    ])
  }
  const removeStep = (idx: number) => {
    setF('steps', (form.steps || []).filter((_, i) => i !== idx))
  }
  const confirmRemoveStep = () => {
    if (removeStepIdx == null) return
    removeStep(removeStepIdx)
    setRemoveStepIdx(null)
  }
  const moveStep = (idx: number, dir: -1 | 1) => {
    const arr = [...(form.steps || [])]
    const j = idx + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    setF('steps', arr)
  }
  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    const arr = [...(form.steps || [])]
    arr[idx] = { ...arr[idx], ...patch }
    setF('steps', arr)
  }

  const handleSave = () => {
    setSubmitted(true)
    if (!formValid) {
      toast.warning('Kiểm tra lại các trường bị lỗi')
      return
    }
    save.mutate(
      {
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
      },
      { onSuccess: () => onClose() },
    )
  }

  const title = isEdit
    ? 'Sửa quy trình'
    : cloneFrom
      ? 'Copy quy trình'
      : 'Thêm quy trình mới'
  const description = isEdit
    ? `Đang sửa · ${form.code}`
    : 'Điền metadata và cấu hình các bước duyệt'

  return (
    <Drawer
      isOpen
      onClose={requestClose}
      size="xl"
      title={
        <span className="inline-flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 inline-flex items-center justify-center">
            <Workflow size={16} />
          </span>
          {title}
        </span>
      }
      description={description}
      closeOnBackdrop
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <p className="text-[11px] text-neutral-500 text-left max-w-[55%] leading-snug">
            {isEdit
              ? 'Instance đang chạy giữ steps snapshot cũ — chỉ instance mới dùng cấu hình này.'
              : 'Module business start instance bằng mã code sau khi bạn lưu thành công.'}
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={requestClose} disabled={save.isPending}>
              Huỷ
            </Button>
            {canSave && !(loadError && isEdit) && (
              <Button
                onClick={handleSave}
                disabled={save.isPending || (submitted && !formValid)}
                className="gap-1.5"
              >
                {save.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Lưu
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-neutral-400 py-20">
          <Loader2 size={22} className="animate-spin text-primary-500" />
        </div>
      ) : loadError && isEdit ? (
        <div className="p-5">
          <ErrorState
            title="Không tải được quy trình"
            message="Không lấy được definition. Vui lòng thử lại hoặc đóng drawer."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : (
        <div className="p-5 space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Cấu hình sai ảnh hưởng duyệt đơn thật.{' '}
            <Link
              to="/docs/guide-workflows"
              className="font-semibold text-primary-700 underline underline-offset-2"
              onClick={requestClose}
            >
              Đọc hướng dẫn
            </Link>
            {' · '}
            Nếu module đã dùng{' '}
            <Link to="/approval/flows" className="underline underline-offset-2" onClick={requestClose}>
              /approval/flows
            </Link>
            , đừng tạo luồng trùng.
          </div>

          <section>
            <SectionTitle>Thông tin quy trình</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Mã (code) *" error={showErr('code')}>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setF('code', e.target.value.toUpperCase())}
                  onBlur={() => touch('code')}
                  disabled={isEdit}
                  placeholder="ASSET_TRANSFER_DEFAULT"
                  aria-invalid={!!showErr('code')}
                  className={inputCls(!!showErr('code')) + ' font-mono'}
                />
              </Field>
              <Field label="Module áp dụng *" error={showErr('moduleCode')}>
                <select
                  value={form.moduleCode}
                  onChange={(e) => setF('moduleCode', e.target.value)}
                  onBlur={() => touch('moduleCode')}
                  disabled={isEdit}
                  aria-invalid={!!showErr('moduleCode')}
                  className={inputCls(!!showErr('moduleCode'))}
                >
                  <option value="">— Chọn module —</option>
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label} ({m.value})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Tên hiển thị *" error={showErr('name')} className="mt-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setF('name', e.target.value)}
                onBlur={() => touch('name')}
                placeholder="Cấp phát tài sản (mặc định)"
                aria-invalid={!!showErr('name')}
                className={inputCls(!!showErr('name'))}
              />
            </Field>
            <Field label="Mô tả" className="mt-3">
              <textarea
                value={form.description || ''}
                onChange={(e) => setF('description', e.target.value)}
                rows={2}
                className={inputCls(false) + ' resize-none h-auto py-2'}
                placeholder="Mô tả ngắn khi nào dùng quy trình này"
              />
            </Field>
            <label className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setF('active', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Đang bật (cho phép start instance)</span>
            </label>
          </section>

          {form.steps && form.steps.length > 0 && (
            <section className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
              <SectionTitle>Xem trước</SectionTitle>
              <WorkflowStepper
                steps={form.steps.map((s) => ({
                  label: s.stepName || '(chưa đặt tên)',
                  actor: describeActor(s.approverType, s.approverValue),
                }))}
                currentIndex={-1}
              />
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle className="mb-0">
                Các bước duyệt{' '}
                <span className="text-neutral-400 font-normal">
                  ({form.steps?.length || 0})
                </span>
              </SectionTitle>
              <Button variant="outline" onClick={addStep} className="gap-1 h-8 px-3 text-xs">
                <Plus size={12} /> Thêm bước
              </Button>
            </div>
            {showErr('steps') && (
              <div className="text-xs text-rose-600 mb-2 inline-flex items-center gap-1">
                <AlertCircle size={11} /> {errors.steps}
              </div>
            )}
            <div className="space-y-3">
              {(form.steps || []).map((step, idx) => (
                <StepEditor
                  key={idx}
                  idx={idx}
                  total={form.steps!.length}
                  step={step}
                  stepNameError={showStepErr(idx, 'stepName')}
                  approverError={showStepErr(idx, 'approverValue')}
                  users={users}
                  roles={roles}
                  onChange={(patch) => updateStep(idx, patch)}
                  onBlurField={(field) => touchStep(idx, field)}
                  onRemove={() => setRemoveStepIdx(idx)}
                  onMoveUp={() => moveStep(idx, -1)}
                  onMoveDown={() => moveStep(idx, 1)}
                />
              ))}
              {(form.steps || []).length === 0 && (
                <div className="text-center py-6 text-sm text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
                  Chưa có bước nào — bấm <b>Thêm bước</b> để bắt đầu
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        isOpen={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={confirmLeave}
        title="Bỏ thay đổi chưa lưu?"
        message="Bạn có thay đổi chưa lưu. Nếu đóng drawer, các thay đổi sẽ mất."
        confirmText="Đóng mà không lưu"
        cancelText="Ở lại"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={removeStepIdx != null}
        onClose={() => setRemoveStepIdx(null)}
        onConfirm={confirmRemoveStep}
        title={`Xoá bước ${(removeStepIdx ?? 0) + 1}?`}
        message={
          removeStepIdx != null
            ? `Bước "${form.steps?.[removeStepIdx]?.stepName || '(chưa đặt tên)'}" sẽ bị xoá khỏi cấu hình.`
            : ''
        }
        confirmText="Xoá bước"
        cancelText="Huỷ"
        variant="danger"
      />
    </Drawer>
  )
}

function StepEditor({
  idx,
  total,
  step,
  stepNameError,
  approverError,
  users,
  roles,
  onChange,
  onBlurField,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  idx: number
  total: number
  step: WorkflowStep
  stepNameError?: string
  approverError?: string
  users: any[]
  roles: any[]
  onChange: (patch: Partial<WorkflowStep>) => void
  onBlurField: (field: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const typeMeta =
    APPROVER_TYPES.find((t) => t.value === step.approverType) || APPROVER_TYPES[0]
  const TypeIcon = typeMeta.icon

  return (
    <div className="rounded-lg border border-neutral-200 bg-white hover:border-primary-200 transition">
      <div className="p-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={step.stepName || ''}
              onChange={(e) => onChange({ stepName: e.target.value })}
              onBlur={() => onBlurField('stepName')}
              placeholder={`Tên bước ${idx + 1} (VD: HR duyệt)`}
              aria-invalid={!!stepNameError}
              className={
                'w-full h-9 px-3 rounded-lg border bg-white text-sm font-semibold focus:ring-2 outline-none ' +
                (stepNameError
                  ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                  : 'border-neutral-200 focus:border-primary-300 focus:ring-primary-100')
              }
            />
            {stepNameError && (
              <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
                <AlertCircle size={11} /> {stepNameError}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={idx === 0}
              title="Lên trên"
              className="w-7 h-7 rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={idx === total - 1}
              title="Xuống dưới"
              className="w-7 h-7 rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              <ArrowDown size={13} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              title="Xoá bước"
              className="w-7 h-7 rounded-md text-rose-500 hover:bg-rose-50 inline-flex items-center justify-center"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Loại approver
            </label>
            <div className="grid grid-cols-4 gap-1">
              {APPROVER_TYPES.map((t) => {
                const Icon = t.icon
                const active = step.approverType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    title={t.description}
                    onClick={() =>
                      onChange({
                        approverType: t.value,
                        approverValue:
                          t.value === 'MANAGER' || t.value === 'ADMIN' ? null : '',
                      })
                    }
                    className={`h-16 rounded-md border transition inline-flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
                      active
                        ? 'border-primary-400 bg-primary-50 text-primary-700 ring-2 ring-primary-100'
                        : 'border-neutral-200 text-neutral-600 hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon size={14} />
                    {t.label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 leading-snug">
              {typeMeta.description}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              {step.approverType === 'USER'
                ? 'Chọn người'
                : step.approverType === 'ROLE'
                  ? 'Chọn role'
                  : 'Approver'}
            </label>
            {step.approverType === 'USER' ? (
              <select
                value={step.approverValue || ''}
                onChange={(e) => onChange({ approverValue: e.target.value })}
                onBlur={() => onBlurField('approverValue')}
                aria-invalid={!!approverError}
                className={inputCls(!!approverError)}
              >
                <option value="">— Chọn user —</option>
                {users.map((u) => (
                  <option key={u.id || u.userName} value={u.userName || u.username}>
                    {u.fullName || u.name || u.userName} ({u.userName || u.username})
                  </option>
                ))}
              </select>
            ) : step.approverType === 'ROLE' ? (
              <select
                value={step.approverValue || ''}
                onChange={(e) => onChange({ approverValue: e.target.value })}
                onBlur={() => onBlurField('approverValue')}
                aria-invalid={!!approverError}
                className={inputCls(!!approverError)}
              >
                <option value="">— Chọn role —</option>
                {roles.map((r) => (
                  <option key={r.id || r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-10 px-3 rounded-lg border border-neutral-100 bg-neutral-50 text-xs text-neutral-500 inline-flex items-center gap-2">
                <TypeIcon size={13} />{' '}
                {step.approverType === 'MANAGER'
                  ? 'Auto: quản lý của requester'
                  : 'Bất kỳ Admin'}
              </div>
            )}
            {approverError && (
              <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
                <AlertCircle size={11} /> {approverError}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pl-9">
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              SLA (giờ)
            </label>
            <input
              type="number"
              min={0}
              value={step.slaHours ?? ''}
              onChange={(e) =>
                onChange({
                  slaHours: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="Không giới hạn"
              className={inputCls(false) + ' tabular-nums'}
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={!!step.allowSkip}
                onChange={(e) => onChange({ allowSkip: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Cho phép bỏ qua nếu không có approver</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function inputCls(invalid: boolean) {
  return (
    'w-full h-10 px-3 rounded-lg border bg-white text-sm outline-none focus:ring-2 ' +
    (invalid
      ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
      : 'border-neutral-200 focus:border-primary-300 focus:ring-primary-100')
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-neutral-700 block mb-1.5">{label}</label>
      {children}
      {error && (
        <div className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  )
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 ${className || ''}`}
    >
      {children}
    </div>
  )
}

function extractList(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.items)) return raw.items
  if (raw.data?.items && Array.isArray(raw.data.items)) return raw.data.items
  if (Array.isArray(raw.data?.content)) return raw.data.content
  return []
}

function defaultForm(): WorkflowDefinition {
  return {
    code: '',
    name: '',
    moduleCode: '',
    description: '',
    active: true,
    steps: [],
  }
}

function describeActor(type: ApproverType, value?: string | null): string {
  if (type === 'USER') return value ? `@${value}` : '(chưa chọn)'
  if (type === 'ROLE') return value ? `Role: ${value}` : '(chưa chọn)'
  if (type === 'MANAGER') return 'Quản lý'
  if (type === 'ADMIN') return 'Admin'
  return type
}
