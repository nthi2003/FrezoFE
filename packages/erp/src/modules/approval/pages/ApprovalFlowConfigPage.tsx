// ============================================================
// ApprovalFlowConfigPage — CRUD template luồng duyệt (FE-1)
// Drag-sort bước đơn giản bằng ▲▼ (không cần dnd lib).
// ============================================================

import { useState } from 'react'
import {
  Plus, Pencil, GripVertical, ChevronUp, ChevronDown, Trash2, Workflow,
} from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState } from '@frezo/ui'
import {
  useApprovalFlows, useCreateApprovalFlow, useUpdateApprovalFlow,
} from '../hooks/useApprovalFlows'
import {
  APPROVER_ROLE_OPTIONS,
  SUBJECT_TYPE_LABEL,
  SubjectType,
  type ApprovalFlowDto,
  type ApprovalFlowRequest,
  type ApprovalFlowStepTemplate,
} from '../types'
import { usePermission } from '@/lib/hooks/usePermission'

const SUBJECT_OPTIONS = Object.values(SubjectType).map((v) => ({
  value: v,
  label: SUBJECT_TYPE_LABEL[v] || v,
}))

export function ApprovalFlowConfigPage() {
  const { data: flows = [], isLoading } = useApprovalFlows()
  const create = useCreateApprovalFlow()
  const update = useUpdateApprovalFlow()
  const canCreate = usePermission('APPROVAL_FLOWS.CREATE')
  const canUpdate = usePermission('APPROVAL_FLOWS.UPDATE')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApprovalFlowDto | null>(null)
  const [form, setForm] = useState<ApprovalFlowRequest>(emptyForm())

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (f: ApprovalFlowDto) => {
    setEditing(f)
    setForm({
      name: f.name,
      subjectType: f.subjectType,
      steps: f.steps.map((s) => ({ ...s })),
      active: f.active,
      description: f.description,
    })
    setModalOpen(true)
  }

  const onSave = () => {
    if (!form.name.trim() || form.steps.length === 0) return
    const body: ApprovalFlowRequest = {
      ...form,
      steps: form.steps.map((s, i) => ({ ...s, stepOrder: i + 1 })),
    }
    if (editing) {
      update.mutate(
        { id: editing.id, body },
        { onSuccess: () => setModalOpen(false) },
      )
    } else {
      create.mutate(body, { onSuccess: () => setModalOpen(false) })
    }
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Cấu hình luồng duyệt"
        description="Gắn luồng duyệt theo loại đơn — đơn chờ sẽ vào Hộp thư duyệt."
        actions={
          canCreate ? (
            <Button className="gap-2" onClick={openCreate}>
              <Plus size={15} /> Tạo luồng mới
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="p-8 text-center text-neutral-500 border rounded-xl bg-white">
          Đang tải…
        </div>
      ) : flows.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Workflow}
            title="Chưa có luồng duyệt"
            description="Tạo template đầu tiên để gắn vào đơn nghỉ, bảng lương…"
            action={canCreate ? { label: 'Tạo luồng mới', onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {flows.map((f) => (
            <FlowCard
              key={f.id}
              flow={f}
              onEdit={canUpdate ? () => openEdit(f) : undefined}
            />
          ))}
        </div>
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa luồng duyệt' : 'Tạo luồng duyệt'}
        description="Mỗi bước chọn 1 vai trò duyệt. Thứ tự = thứ tự phê duyệt."
        maxWidth="2xl"
      >
        <FlowForm
          form={form}
          setForm={setForm}
          onSave={onSave}
          onCancel={() => setModalOpen(false)}
          saving={create.isPending || update.isPending}
          isEdit={!!editing}
        />
      </AppModal>
    </div>
  )
}

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------

function FlowCard({
  flow,
  onEdit,
}: {
  flow: ApprovalFlowDto
  onEdit?: () => void
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
        <Workflow size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-neutral-900">{flow.name}</h3>
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              flow.active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}
          >
            {flow.active ? 'Active' : 'Inactive'}
          </span>
          <span className="text-[10px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded">
            {SUBJECT_TYPE_LABEL[flow.subjectType] || flow.subjectType}
          </span>
        </div>
        {flow.description && (
          <p className="text-xs text-neutral-500 mt-0.5">{flow.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {flow.steps
            .slice()
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s, i) => (
              <span
                key={`${s.stepOrder}-${s.approverRole}`}
                className="inline-flex items-center gap-1 text-xs bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1"
              >
                <span className="font-bold text-neutral-400">{i + 1}.</span>
                {roleLabel(s.approverRole)}
              </span>
            ))}
        </div>
      </div>
      {onEdit && (
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={onEdit}>
          <Pencil size={13} /> Sửa
        </Button>
      )}
    </div>
  )
}

function FlowForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  form: ApprovalFlowRequest
  setForm: (f: ApprovalFlowRequest) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isEdit: boolean
}) {
  const moveStep = (idx: number, dir: -1 | 1) => {
    const next = [...form.steps]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setForm({ ...form, steps: next })
  }

  const updateStep = (idx: number, patch: Partial<ApprovalFlowStepTemplate>) => {
    const next = form.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    setForm({ ...form, steps: next })
  }

  const removeStep = (idx: number) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) })
  }

  const addStep = () => {
    setForm({
      ...form,
      steps: [
        ...form.steps,
        { stepOrder: form.steps.length + 1, approverRole: 'MANAGER', label: '' },
      ],
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Tên luồng *">
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="VD: Duyệt nghỉ phép 2 tầng"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Loại đối tượng *">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={form.subjectType}
            onChange={(e) => setForm({ ...form, subjectType: e.target.value })}
          >
            {SUBJECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trạng thái">
          <label className="flex items-center gap-2 h-9 text-sm">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Đang kích hoạt
          </label>
        </Field>
      </div>
      <Field label="Mô tả">
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Các bước duyệt</span>
          <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1">
            <Plus size={13} /> Thêm bước
          </Button>
        </div>
        <div className="space-y-2">
          {form.steps.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 border rounded-lg bg-neutral-50"
            >
              <GripVertical size={14} className="text-neutral-300 shrink-0" />
              <span className="text-xs font-bold text-neutral-400 w-5">{idx + 1}</span>
              <select
                className="flex-1 border rounded-md px-2 py-1.5 text-sm bg-white"
                value={s.approverRole}
                onChange={(e) => updateStep(idx, { approverRole: e.target.value })}
              >
                {APPROVER_ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                  onClick={() => moveStep(idx, -1)}
                  title="Lên"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                  onClick={() => moveStep(idx, 1)}
                  title="Xuống"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className="p-1 text-neutral-400 hover:text-rose-600"
                  onClick={() => removeStep(idx)}
                  title="Xoá bước"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {form.steps.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-3">
              Thêm ít nhất 1 bước duyệt
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <Button
          onClick={onSave}
          disabled={saving || !form.name.trim() || form.steps.length === 0}
        >
          {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function emptyForm(): ApprovalFlowRequest {
  return {
    name: '',
    subjectType: SubjectType.LEAVE,
    active: true,
    steps: [{ stepOrder: 1, approverRole: 'MANAGER' }],
  }
}

function roleLabel(code: string): string {
  return APPROVER_ROLE_OPTIONS.find((o) => o.value === code)?.label || code
}
