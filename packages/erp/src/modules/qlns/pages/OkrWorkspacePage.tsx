import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Flag, MessageSquareText, Plus, Settings2, Target } from 'lucide-react'
import { AppModal, Button, EmptyState, Input, Label, RowActions, Select } from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { toast } from 'sonner'
import { performanceApi, type OkrCycle, type OkrFeedback, type OkrFeedbackType, type OkrTimelineStep } from '../services/performanceApi'
import { useOkrs } from '../hooks/usePerformance'
import { OkrsPage } from './OkrsPage'

type WorkspaceTab = 'objectives' | 'timeline' | 'feedback' | 'settings'

const TABS = [
  { key: 'objectives' as const, label: 'Mục tiêu', icon: Target },
  { key: 'timeline' as const, label: 'Lộ trình', icon: Flag },
  { key: 'feedback' as const, label: 'Phiếu góp ý', icon: MessageSquareText },
  { key: 'settings' as const, label: 'Cấu hình', icon: Settings2 },
]

const emptyCycle = (): Omit<OkrCycle, 'id'> => ({
  name: '',
  status: 'OPEN',
  startDate: '',
  endDate: '',
})

const emptyStep = (): Omit<OkrTimelineStep, 'id'> => ({
  stepName: '',
  departmentName: '',
  timeLabel: '',
  detail: '',
  result: '',
  sortOrder: 0,
})

export function OkrWorkspacePage({ initialTab = 'objectives' }: { initialTab?: WorkspaceTab }) {
  const [tab, setTab] = useState<WorkspaceTab>(initialTab)
  const { data: mine } = useOkrs('mine')
  const isAdmin = !!mine?.viewer?.admin
  const visibleTabs = TABS.filter((item) => item.key !== 'settings' || isAdmin)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-neutral-50 p-1 w-fit">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${
              tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {tab === 'objectives' && <OkrsPage embedded />}
      {tab === 'timeline' && <TimelinePanel canManage={isAdmin} />}
      {tab === 'feedback' && <FeedbackPanel />}
      {tab === 'settings' && isAdmin && <SettingsPanel />}
    </div>
  )
}

function TimelinePanel({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'timeline'],
    queryFn: performanceApi.listTimeline,
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OkrTimelineStep | null>(null)
  const [form, setForm] = useState(emptyStep())
  const save = useMutation({
    mutationFn: () => editing
      ? performanceApi.updateTimeline(editing.id, form)
      : performanceApi.createTimeline(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'timeline'] })
      setOpen(false)
      toast.success('Đã lưu bước triển khai')
    },
    onError: () => toast.error('Không lưu được bước triển khai'),
  })
  const remove = useMutation({
    mutationFn: performanceApi.deleteTimeline,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'timeline'] }),
  })
  const columns: AppTableColumn<OkrTimelineStep>[] = [
    { key: 'stepName', title: 'Bước thực hiện', render: (_, x) => <span className="font-medium">{x.stepName}</span> },
    { key: 'departmentName', title: 'Phòng ban', render: (_, x) => x.departmentName || '—' },
    { key: 'timeLabel', title: 'Thời gian', render: (_, x) => x.timeLabel || '—' },
    { key: 'detail', title: 'Chi tiết', render: (_, x) => x.detail || '—' },
    { key: 'result', title: 'Kết quả', render: (_, x) => x.result || '—' },
    ...(canManage ? [{
      key: 'actions',
      title: '',
      align: 'right' as const,
      render: (_: unknown, x: OkrTimelineStep) => (
        <RowActions actions={[
          { kind: 'edit', onClick: () => { setEditing(x); setForm({ ...x }); setOpen(true) } },
          { kind: 'delete', onClick: () => remove.mutate(x.id), confirm: { title: 'Xóa bước triển khai?' } },
        ]} />
      ),
    }] : []),
  ]
  const startCreate = () => { setEditing(null); setForm(emptyStep()); setOpen(true) }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold">Lộ trình triển khai OKR</h3><p className="text-xs text-neutral-500">Hiển thị cho toàn bộ nhân viên.</p></div>
        {canManage && <Button size="sm" onClick={startCreate}><Plus size={14} /> Thêm bước</Button>}
      </div>
      {data.length === 0 && !isLoading
        ? <EmptyState icon={Flag} title="Chưa có lộ trình" description="Quản trị viên thiết lập các bước triển khai OKR." />
        : <AppTable columns={columns} data={data} isLoading={isLoading} showSearch={false} density="compact" />}
      <AppModal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Sửa bước triển khai' : 'Thêm bước triển khai'}>
        <div className="space-y-3">
          <Field label="Bước thực hiện *"><Input value={form.stepName} onChange={(e) => setForm({ ...form, stepName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phòng ban"><Input value={form.departmentName || ''} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} /></Field>
            <Field label="Thời gian"><Input value={form.timeLabel || ''} onChange={(e) => setForm({ ...form, timeLabel: e.target.value })} /></Field>
          </div>
          <Field label="Chi tiết"><TextArea value={form.detail || ''} onChange={(v) => setForm({ ...form, detail: v })} /></Field>
          <Field label="Kết quả"><TextArea value={form.result || ''} onChange={(v) => setForm({ ...form, result: v })} /></Field>
          <ModalActions onCancel={() => setOpen(false)} onSave={() => save.mutate()} disabled={!form.stepName.trim() || save.isPending} />
        </div>
      </AppModal>
    </section>
  )
}

function FeedbackPanel() {
  const qc = useQueryClient()
  const { data: types = [] } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'feedback-types'],
    queryFn: performanceApi.listFeedbackTypes,
  })
  const { data = [], isLoading } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'feedback'],
    queryFn: performanceApi.listFeedback,
  })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ targetScope: 'COMPANY' as 'COMPANY' | 'DEPARTMENT', targetDepartmentId: '', feedbackTypeId: '', content: '' })
  const send = useMutation({
    mutationFn: () => performanceApi.createFeedback({
      targetScope: form.targetScope,
      targetDepartmentId: form.targetDepartmentId || undefined,
      feedbackTypeId: form.feedbackTypeId,
      content: form.content,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'feedback'] })
      setOpen(false)
      toast.success('Đã gửi phiếu góp ý')
    },
    onError: () => toast.error('Không gửi được phiếu góp ý'),
  })
  const columns: AppTableColumn<OkrFeedback>[] = [
    { key: 'feedbackTypeName', title: 'Lý do', render: (_, x) => x.feedbackTypeName || '—' },
    { key: 'targetScope', title: 'Nơi nhận', render: (_, x) => x.targetScope === 'COMPANY' ? 'Công ty' : `Phòng ban ${x.targetDepartmentId || ''}` },
    { key: 'content', title: 'Nội dung', render: (_, x) => <span className="whitespace-pre-wrap">{x.content}</span> },
    { key: 'createdDate', title: 'Thời gian', render: (_, x) => x.createdDate ? new Date(x.createdDate).toLocaleString('vi-VN') : '—' },
  ]
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div><h3 className="font-semibold">Phiếu góp ý mục tiêu</h3><p className="text-xs text-neutral-500">Gửi góp ý đến công ty hoặc phòng ban.</p></div>
        <Button size="sm" onClick={() => setOpen(true)} disabled={types.length === 0}><Plus size={14} /> Gửi góp ý</Button>
      </div>
      {data.length === 0 && !isLoading
        ? <EmptyState icon={MessageSquareText} title="Chưa có phiếu góp ý" description={types.length ? 'Các phiếu đã gửi sẽ hiển thị tại đây.' : 'Quản trị viên cần cấu hình loại phiếu trước.'} />
        : <AppTable columns={columns} data={data} isLoading={isLoading} showSearch={false} density="compact" />}
      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Gửi phiếu góp ý">
        <div className="space-y-3">
          <Field label="Loại phiếu *"><Select options={types.map((x) => ({ value: x.id, label: x.name }))} value={form.feedbackTypeId} onChange={(v) => setForm({ ...form, feedbackTypeId: v })} /></Field>
          <Field label="Nơi nhận"><Select options={[{ value: 'COMPANY', label: 'Công ty' }, { value: 'DEPARTMENT', label: 'Phòng ban' }]} value={form.targetScope} onChange={(v) => setForm({ ...form, targetScope: v as 'COMPANY' | 'DEPARTMENT' })} /></Field>
          {form.targetScope === 'DEPARTMENT' && <Field label="Mã phòng ban *"><Input value={form.targetDepartmentId} onChange={(e) => setForm({ ...form, targetDepartmentId: e.target.value })} /></Field>}
          <Field label="Nội dung *"><TextArea rows={5} value={form.content} onChange={(v) => setForm({ ...form, content: v })} /></Field>
          <ModalActions onCancel={() => setOpen(false)} onSave={() => send.mutate()} disabled={!form.feedbackTypeId || !form.content.trim() || (form.targetScope === 'DEPARTMENT' && !form.targetDepartmentId.trim()) || send.isPending} />
        </div>
      </AppModal>
    </section>
  )
}

function SettingsPanel() {
  const qc = useQueryClient()
  const { data: cycles = [], isLoading } = useQuery({ queryKey: ['qlns', 'okr-workflow', 'cycles'], queryFn: performanceApi.listCycles })
  const { data: types = [] } = useQuery({ queryKey: ['qlns', 'okr-workflow', 'feedback-types'], queryFn: performanceApi.listFeedbackTypes })
  const [cycleOpen, setCycleOpen] = useState(false)
  const [editingCycle, setEditingCycle] = useState<OkrCycle | null>(null)
  const [cycle, setCycle] = useState(emptyCycle())
  const [typeName, setTypeName] = useState('')
  const [editingType, setEditingType] = useState<OkrFeedbackType | null>(null)
  const saveCycle = useMutation({
    mutationFn: () => editingCycle ? performanceApi.updateCycle(editingCycle.id, cycle) : performanceApi.createCycle(cycle),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'cycles'] }); setCycleOpen(false); toast.success('Đã lưu chu kỳ') },
    onError: () => toast.error('Không lưu được chu kỳ. Kiểm tra ngày bắt đầu/kết thúc.'),
  })
  const deleteCycle = useMutation({ mutationFn: performanceApi.deleteCycle, onSuccess: () => qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'cycles'] }) })
  const saveType = useMutation({
    mutationFn: () => editingType ? performanceApi.updateFeedbackType(editingType.id, typeName) : performanceApi.createFeedbackType(typeName),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'feedback-types'] }); setTypeName(''); setEditingType(null) },
    onError: () => toast.error('Tên loại phiếu đã tồn tại hoặc không hợp lệ'),
  })
  const deleteType = useMutation({ mutationFn: performanceApi.deleteFeedbackType, onSuccess: () => qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'feedback-types'] }) })
  const cycleColumns = useMemo<AppTableColumn<OkrCycle>[]>(() => [
    { key: 'name', title: 'Tên chu kỳ', render: (_, x) => <span className="font-medium">{x.name}</span> },
    { key: 'status', title: 'Trạng thái', render: (_, x) => x.status === 'OPEN' ? 'Đang thực hiện' : 'Đã hoàn thành' },
    { key: 'dates', title: 'Thời gian', render: (_, x) => `${x.startDate} → ${x.endDate}` },
    { key: 'actions', title: '', align: 'right', render: (_, x) => <RowActions actions={[
      { kind: 'edit', onClick: () => { setEditingCycle(x); setCycle({ ...x }); setCycleOpen(true) } },
      { kind: 'delete', onClick: () => deleteCycle.mutate(x.id), confirm: { title: 'Xóa chu kỳ OKRs?' } },
    ]} /> },
  ], [deleteCycle])
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <section className="xl:col-span-2 space-y-3">
        <div className="flex justify-between"><div><h3 className="font-semibold">Chu kỳ OKRs</h3><p className="text-xs text-neutral-500">Tên, trạng thái và khoảng thời gian áp dụng.</p></div>
          <Button size="sm" onClick={() => { setEditingCycle(null); setCycle(emptyCycle()); setCycleOpen(true) }}><Plus size={14} /> Thêm mới</Button>
        </div>
        <AppTable columns={cycleColumns} data={cycles} isLoading={isLoading} showSearch={false} density="compact" />
      </section>
      <section className="space-y-3">
        <div><h3 className="font-semibold">Loại phiếu góp ý</h3><p className="text-xs text-neutral-500">Lý do góp ý mục tiêu.</p></div>
        <div className="flex gap-2"><Input value={typeName} placeholder="Tên loại phiếu" onChange={(e) => setTypeName(e.target.value)} /><Button onClick={() => saveType.mutate()} disabled={!typeName.trim() || saveType.isPending}>{editingType ? 'Lưu' : 'Thêm'}</Button></div>
        <div className="rounded-lg border divide-y">{types.map((x) => <div key={x.id} className="flex items-center justify-between p-2 text-sm"><span>{x.name}</span><RowActions actions={[
          { kind: 'edit', onClick: () => { setEditingType(x); setTypeName(x.name) } },
          { kind: 'delete', onClick: () => deleteType.mutate(x.id), confirm: { title: 'Xóa loại phiếu góp ý?' } },
        ]} /></div>)}</div>
      </section>
      <AppModal isOpen={cycleOpen} onClose={() => setCycleOpen(false)} title={editingCycle ? 'Sửa chu kỳ OKRs' : 'Thêm chu kỳ OKRs'}>
        <div className="space-y-3">
          <Field label="Tên chu kỳ *"><Input value={cycle.name} onChange={(e) => setCycle({ ...cycle, name: e.target.value })} /></Field>
          <Field label="Trạng thái"><Select options={[{ value: 'OPEN', label: 'Đang thực hiện' }, { value: 'CLOSED', label: 'Đã hoàn thành' }]} value={cycle.status} onChange={(v) => setCycle({ ...cycle, status: v as 'OPEN' | 'CLOSED' })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Ngày bắt đầu *"><Input type="date" value={cycle.startDate} onChange={(e) => setCycle({ ...cycle, startDate: e.target.value })} /></Field><Field label="Ngày kết thúc *"><Input type="date" value={cycle.endDate} onChange={(e) => setCycle({ ...cycle, endDate: e.target.value })} /></Field></div>
          <ModalActions onCancel={() => setCycleOpen(false)} onSave={() => saveCycle.mutate()} disabled={!cycle.name.trim() || !cycle.startDate || !cycle.endDate || cycle.startDate > cycle.endDate || saveCycle.isPending} />
        </div>
      </AppModal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block text-sm">{label}</Label>{children}</div>
}

function TextArea({ value, onChange, rows = 3 }: { value: string; onChange: (value: string) => void; rows?: number }) {
  return <textarea rows={rows} className="w-full rounded-md border border-border px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
}

function ModalActions({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled?: boolean }) {
  return <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={onCancel}>Hủy</Button><Button onClick={onSave} disabled={disabled}>Lưu</Button></div>
}
