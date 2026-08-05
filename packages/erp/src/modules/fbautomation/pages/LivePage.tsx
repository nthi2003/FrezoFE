import { useMemo, useState } from 'react'
import { Plus, RefreshCw, Video, Bell, Radio } from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, AppModal, Input, Label, Select, RowActions, StatusBadge,
} from '@frezo/ui'
import { Can, usePermission } from '@/lib/permissions'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import {
  useLivestreamEvents, useLiveDashboard, useCreateLivestream, useDeleteLivestream, useLivestreamAction,
} from '../hooks/useMkt'

const STATUS_CFG: Record<string, { label: string; color: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  SCHEDULED: { label: 'Đã lên lịch', color: 'info' },
  LIVE: { label: 'Đang live', color: 'danger' },
  ENDED: { label: 'Kết thúc', color: 'neutral' },
  CANCELLED: { label: 'Huỷ', color: 'warning' },
}

function toLocalInput(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LivePage() {
  const { askConfirm, confirmDialog } = useConfirmDialog()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const del = useDeleteLivestream()
  const action = useLivestreamAction()

  const canNotify = usePermission('MKT_LIVE_ID_NOTIFY_UPDATE')
  const canUpdateStatus = usePermission('MKT_LIVE_ID_STATUS_UPDATE')
  const canDelete = usePermission('MKT_LIVE_ID_DELETE')

  const { data: dash } = useLiveDashboard()
  const { data, isLoading, isFetching, isError, refetch } = useLivestreamEvents()
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const d: any = dash || {}

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return rows
    return rows.filter((r: any) => r.status === statusFilter)
  }, [rows, statusFilter])

  const columns: AppTableColumn<any>[] = [
    {
      key: 'title',
      title: 'Livestream',
      render: (_, r) => (
        <div>
          <div className="font-medium text-neutral-900 flex items-center gap-2">
            {r.title}
            {r.needsNotify ? (
              <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                Cần nhắc
              </span>
            ) : null}
          </div>
          <div className="text-xs text-neutral-500">
            {r.channel} · {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString('vi-VN') : '—'}
            {r.registrantCount ? ` · ${r.registrantCount} đăng ký` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'TT',
      width: 120,
      render: (_, r) => {
        const cfg = STATUS_CFG[r.status] || STATUS_CFG.SCHEDULED
        return <StatusBadge label={cfg.label} color={cfg.color} />
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 160,
      render: (_, r) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'notify',
              icon: Bell,
              tooltip: 'Đánh dấu đã nhắc',
              tone: 'amber',
              hidden: !canNotify,
              onClick: () => action.mutate({ id: r.id, action: 'notify' }),
            },
            {
              key: 'start',
              icon: Radio,
              tooltip: 'Bắt đầu LIVE',
              tone: 'rose',
              hidden: !canUpdateStatus || r.status !== 'SCHEDULED',
              onClick: () => action.mutate({ id: r.id, action: 'status', status: 'LIVE' }),
            },
            {
              key: 'end',
              icon: Video,
              tooltip: 'Kết thúc',
              tone: 'blue',
              hidden: !canUpdateStatus || r.status !== 'LIVE',
              onClick: () => action.mutate({ id: r.id, action: 'status', status: 'ENDED' }),
            },
            {
              kind: 'delete',
              tooltip: 'Xoá',
              hidden: !canDelete,
              onClick: () =>
                askConfirm({
                  title: 'Xoá lịch live?',
                  message: `“${r.title}” sẽ bị xoá.`,
                  confirmText: 'Xoá',
                  onConfirm: () => del.mutate(r.id),
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Livestream Reminder"
        description="Lên lịch live, nhắc trước giờ phát, theo dõi đăng ký. Không cần Meta App."
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin mr-2' : 'mr-2'} />
              Làm mới
            </Button>
            <Can permission="MKT_LIVE_CREATE">
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-2" />
                Tạo lịch live
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Tổng" value={d.total ?? rows.length} />
        <Kpi label="Đã lên lịch" value={d.scheduled ?? 0} />
        <Kpi label="Đang live" value={d.live ?? 0} />
        <Kpi label="Cần nhắc" value={d.needsNotify ?? 0} />
      </div>

      <FilterBar
        hasActiveFilters={statusFilter !== 'ALL'}
        onClear={() => setStatusFilter('ALL')}
        countLabel={`${filtered.length} sự kiện`}
      >
        <Select
          options={[
            { value: 'ALL', label: 'Mọi trạng thái' },
            { value: 'SCHEDULED', label: 'Đã lên lịch' },
            { value: 'LIVE', label: 'Đang live' },
            { value: 'ENDED', label: 'Kết thúc' },
            { value: 'CANCELLED', label: 'Huỷ' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

      {isError ? (
        <ErrorState title="Không tải được lịch live" onRetry={() => refetch()} />
      ) : !isLoading && filtered.length === 0 ? (
        <EmptyState title="Chưa có lịch livestream" description="Tạo lịch và đặt phút nhắc trước giờ phát." />
      ) : (
        <AppTable columns={columns} data={filtered} loading={isLoading} rowKey={(r) => r.id} pageSize={10} />
      )}

      <CreateLiveModal open={showCreate} onClose={() => setShowCreate(false)} />
      {confirmDialog}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function CreateLiveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateLivestream()
  const [form, setForm] = useState({
    title: '',
    channel: 'FACEBOOK',
    scheduledAt: toLocalInput(new Date(Date.now() + 3600_000).toISOString()),
    durationMinutes: 60,
    notifyBeforeMinutes: 30,
    registrantCount: 0,
    streamUrl: '',
  })

  const submit = () => {
    if (!form.title.trim() || !form.scheduledAt) return
    create.mutate(
      {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <AppModal isOpen={open} onClose={onClose} title="Tạo lịch livestream" maxWidth="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <Label>Tiêu đề</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Kênh</Label>
          <Select
            options={[
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'YOUTUBE', label: 'YouTube' },
              { value: 'TIKTOK', label: 'TikTok' },
              { value: 'ZALO', label: 'Zalo' },
              { value: 'OTHER', label: 'Khác' },
            ]}
            value={form.channel}
            onChange={(v) => setForm({ ...form, channel: v })}
          />
        </div>
        <div>
          <Label>Thời gian live</Label>
          <Input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
        </div>
        <div>
          <Label>Thời lượng (phút)</Label>
          <Input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 60 })}
          />
        </div>
        <div>
          <Label>Nhắc trước (phút)</Label>
          <Input
            type="number"
            min={0}
            value={form.notifyBeforeMinutes}
            onChange={(e) => setForm({ ...form, notifyBeforeMinutes: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="md:col-span-2">
          <Label>URL stream</Label>
          <Input value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} />
        </div>
      </div>
      <div className="mt-6 pt-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Huỷ</Button>
        <Button disabled={!form.title.trim() || create.isPending} onClick={submit}>Lưu</Button>
      </div>
    </AppModal>
  )
}

export default LivePage
