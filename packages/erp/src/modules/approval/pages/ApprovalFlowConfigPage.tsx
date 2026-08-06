// ============================================================
// ApprovalFlowConfigPage — CRUD template luồng duyệt (FE-1)
// Drag-sort bước đơn giản bằng ▲▼ (không cần dnd lib).
// Layout: PageHeader + sticky FilterBar + AppTable compact
// ============================================================

import { useMemo, useState } from 'react'
import {
  Plus, GripVertical, ChevronUp, ChevronDown, Trash2, Workflow,
} from 'lucide-react'
import {
  Button, PageHeader, AppModal, EmptyState, ErrorState, PageGuideButton, Select,
  IconActionButton, actionIconTone, RowActions, StatusBadge,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
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
import { APPROVAL_FLOWS_GUIDE } from '../constants/approvals.guide'
import {
  FLOW_ACTIVE_FILTER_OPTIONS,
  resolveFlowActiveStatus,
  resolveFlowRuntimeBadge,
} from '../constants/flowStatus'
import { pageRootClass } from '../utils/pageEmbed'

const SUBJECT_OPTIONS = Object.values(SubjectType).map((v) => ({
  value: v,
  label: SUBJECT_TYPE_LABEL[v] || v,
}))

export function ApprovalFlowConfigPage({ embedded }: { embedded?: boolean } = {}) {
  const { data: flows = [], isLoading, isError, isFetching, refetch } = useApprovalFlows()
  const create = useCreateApprovalFlow()
  const update = useUpdateApprovalFlow()
  const canCreate = usePermission('APPROVAL_FLOWS.CREATE')
  const canUpdate = usePermission('APPROVAL_FLOWS.UPDATE')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApprovalFlowDto | null>(null)
  const [form, setForm] = useState<ApprovalFlowRequest>(emptyForm())
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  /** subjectType → flow đang active (runtime gắn đơn). */
  const activeBySubject = useMemo(() => {
    const map = new Map<string, ApprovalFlowDto>()
    for (const f of flows) {
      if (f.active && f.subjectType) map.set(f.subjectType, f)
    }
    return map
  }, [flows])

  const filtered = useMemo(() => {
    let list = [...flows]
    if (subjectFilter) list = list.filter((f) => f.subjectType === subjectFilter)
    if (statusFilter === 'active') list = list.filter((f) => f.active)
    if (statusFilter === 'inactive') list = list.filter((f) => !f.active)
    return list
  }, [flows, subjectFilter, statusFilter])

  const hasActiveFilters = Boolean(subjectFilter || statusFilter)

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

  const columns: AppTableColumn<ApprovalFlowDto>[] = [
    {
      key: 'name',
      title: 'Tên luồng',
      render: (_, row) => (
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">{row.name}</div>
          {row.description && (
            <div className="text-xs text-neutral-500 truncate max-w-md">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'subjectType',
      title: 'Loại đối tượng',
      width: 160,
      render: (_, row) => (
        <span className="text-sm text-neutral-700">
          {SUBJECT_TYPE_LABEL[row.subjectType] || row.subjectType}
        </span>
      ),
    },
    {
      key: 'steps',
      title: 'Các bước',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1">
          {row.steps
            .slice()
            .sort((a, b) => a.stepOrder - b.stepOrder)
            .map((s, i) => (
              <span
                key={`${s.stepOrder}-${s.approverRole}`}
                className="inline-flex items-center gap-1 text-[11px] bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5"
              >
                <span className="font-bold text-neutral-400">{i + 1}.</span>
                {roleLabel(s.approverRole)}
              </span>
            ))}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 200,
      render: (_, row) => {
        const subjectLabel = SUBJECT_TYPE_LABEL[row.subjectType] || row.subjectType
        const isRuntime = activeBySubject.get(row.subjectType)?.id === row.id
        const activeCfg = resolveFlowActiveStatus(row.active)
        const runtimeCfg = resolveFlowRuntimeBadge(isRuntime, subjectLabel)
        return (
          <div className="flex flex-wrap gap-1">
            <StatusBadge label={activeCfg.label} color={activeCfg.color} />
            <StatusBadge label={runtimeCfg.label} color={runtimeCfg.color} />
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: '',
      width: 56,
      align: 'right',
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[{ kind: 'edit', hidden: !canUpdate, onClick: () => openEdit(row) }]}
        />
      ),
    },
  ]

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center">
      <PageGuideButton guide={APPROVAL_FLOWS_GUIDE} />
      {canCreate ? (
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={15} /> Tạo luồng mới
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
        <PageHeader
          title="Cấu hình luồng duyệt"
          description="Gắn luồng duyệt theo loại đơn — đơn chờ sẽ vào Hộp thư duyệt."
          actions={headerActions}
        />
      )}
      {embedded && (
        <div className="flex flex-wrap gap-2 items-center justify-end">{headerActions}</div>
      )}

      <div className={`sticky top-0 z-10 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80 ${embedded ? '-mx-1 px-1' : '-mx-6 px-6'}`}>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[160px]">
            <Select
              options={[
                { value: '', label: 'Tất cả loại đối tượng' },
                ...SUBJECT_OPTIONS,
              ]}
              value={subjectFilter}
              onChange={setSubjectFilter}
              placeholder="Loại đối tượng"
              aria-label="Lọc theo loại đối tượng"
              showSearch={false}
            />
          </div>
          <div className="min-w-[140px]">
            <Select
              options={FLOW_ACTIVE_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Trạng thái"
              aria-label="Lọc theo trạng thái"
              showSearch={false}
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSubjectFilter('')
                setStatusFilter('')
              }}
            >
              Xoá lọc
            </Button>
          )}
          <span className="text-xs text-neutral-500 ml-auto tabular-nums">
            {filtered.length} luồng{hasActiveFilters ? ' (đã lọc)' : ''}
          </span>
        </div>
      </div>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được luồng duyệt"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && flows.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Workflow}
            title="Chưa có luồng duyệt"
            description="Tạo mẫu đầu tiên để gắn vào đơn nghỉ, bảng lương…"
            action={canCreate ? { label: 'Tạo luồng mới', onClick: openCreate } : undefined}
          />
        </div>
      ) : !isLoading && filtered.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Workflow}
            title="Không có bản ghi phù hợp bộ lọc"
            description="Thử đổi bộ lọc hoặc xoá lọc."
            action={{
              label: 'Xoá lọc',
              onClick: () => {
                setSubjectFilter('')
                setStatusFilter('')
              },
            }}
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          loadingRows={6}
          density="compact"
          onRefresh={() => void refetch()}
        />
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
          <Select
            options={SUBJECT_OPTIONS}
            value={form.subjectType}
            onChange={(v) => setForm({ ...form, subjectType: v })}
            placeholder="Loại đối tượng"
            aria-label="Loại đối tượng"
            showSearch={false}
          />
        </Field>
        <Field label="Trạng thái">
          <label className="flex items-center gap-2 h-9 text-sm">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Đang kích hoạt (áp vào đơn mới cùng loại; tắt các luồng khác cùng loại)
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
              <div className="flex-1 min-w-0">
                <Select
                  options={APPROVER_ROLE_OPTIONS}
                  value={s.approverRole}
                  onChange={(v) => updateStep(idx, { approverRole: v })}
                  placeholder="Vai trò duyệt"
                  aria-label={`Vai trò duyệt bước ${idx + 1}`}
                  showSearch={APPROVER_ROLE_OPTIONS.length > 8}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <IconActionButton
                  tooltip="Lên"
                  tone="neutral"
                  size="sm"
                  onClick={() => moveStep(idx, -1)}
                >
                  <ChevronUp size={14} />
                </IconActionButton>
                <IconActionButton
                  tooltip="Xuống"
                  tone="neutral"
                  size="sm"
                  onClick={() => moveStep(idx, 1)}
                >
                  <ChevronDown size={14} />
                </IconActionButton>
                <IconActionButton
                  tooltip="Xoá bước"
                  tone={actionIconTone.delete}
                  size="sm"
                  onClick={() => removeStep(idx)}
                >
                  <Trash2 size={14} />
                </IconActionButton>
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
