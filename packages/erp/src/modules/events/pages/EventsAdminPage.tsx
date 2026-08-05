// ============================================================
// EventsAdminPage — /admin/events
// List + filter + CRUD (khớp BE EventDto hiện tại)
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays, Plus, RefreshCw, Loader2, Search, X, MapPin, Users,
  Megaphone, Ban, Edit3, ArrowLeft, CheckCircle2,
} from 'lucide-react'
import { Button, PageHeader, EmptyState, AppModal, Input, Label, ConfirmDialog, RowActions } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  useCancelEvent,
  useDeleteEvent,
  useEvent,
  useEventRegistrations,
  useEvents,
  usePublishEvent,
  useSaveEvent,
} from '../hooks/useEvents'
import type { EventDto, EventSaveRequest } from '../services/eventApi'

const STATUS_CHIP: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PUBLISHED: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-100',
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  CANCELLED: 'Đã hủy',
}

function fmtDt(s?: string | null) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventsAdminPage() {
  const nav = useNavigate()
  const [status, setStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventDto | null>(null)
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'cancel'; id: string; title: string }
    | { type: 'delete'; id: string; title: string }
    | null
  >(null)

  const { data: events = [], isLoading, isFetching, refetch } = useEvents(
    status === 'all' ? undefined : status,
  )
  const del = useDeleteEvent()
  const publish = usePublishEvent()
  const cancel = useCancelEvent()

  const filtered = useMemo(() => {
    if (!search.trim()) return events
    const s = search.trim().toLowerCase()
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(s) ||
        (e.location || '').toLowerCase().includes(s) ||
        (e.description || '').toLowerCase().includes(s),
    )
  }, [events, search])

  const hasFilter = !!search.trim() || status !== 'all'
  const isFilteredEmpty = !isLoading && filtered.length === 0 && events.length > 0
  const isFullyEmpty = !isLoading && events.length === 0

  const openEdit = (e: EventDto) => {
    setEditing(e)
    setFormOpen(true)
  }

  const columns: AppTableColumn<EventDto>[] = [
    {
      key: 'title',
      title: 'Sự kiện',
      render: (_, row) => (
        <button
          type="button"
          className="text-left min-w-0"
          onClick={() => nav(`/admin/events/${row.id}`)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                STATUS_CHIP[row.status] || STATUS_CHIP.DRAFT
              }`}
            >
              {STATUS_LABEL[row.status] || row.status}
            </span>
            <span className="font-medium text-neutral-900 truncate">{row.title}</span>
          </div>
          <div className="mt-0.5 text-xs text-neutral-500 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="tabular-nums">{fmtDt(row.startAt)}</span>
            {row.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} /> {row.location}
              </span>
            )}
            {row.capacity != null && (
              <span className="inline-flex items-center gap-0.5">
                <Users size={11} /> {row.registeredCount ?? 0}/{row.capacity}
              </span>
            )}
          </div>
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 280,
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'publish',
              icon: Megaphone,
              tooltip: 'Xuất bản',
              tone: 'emerald',
              hidden: row.status !== 'DRAFT',
              disabled: publish.isPending,
              onClick: () => publish.mutate(row.id),
            },
            {
              key: 'cancel',
              icon: Ban,
              tooltip: 'Huỷ sự kiện',
              tone: 'rose',
              hidden: row.status !== 'PUBLISHED',
              disabled: cancel.isPending,
              onClick: () => setConfirmAction({ type: 'cancel', id: row.id, title: row.title }),
            },
            { kind: 'edit', onClick: () => openEdit(row) },
            {
              kind: 'delete',
              disabled: del.isPending,
              onClick: () => setConfirmAction({ type: 'delete', id: row.id, title: row.title }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-6xl mx-auto w-full">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
              <CalendarDays size={16} />
            </span>
            Quản lý sự kiện
          </span>
        }
        description="Sự kiện nội bộ công ty — tạo, publish, RSVP, huỷ. API /events."
        actions={(
          <Button className="gap-1.5" onClick={() => nav('/admin/events/new')}>
            <Plus size={14} /> Tạo sự kiện
          </Button>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setStatus('all')
        }}
        countLabel={`${filtered.length} sự kiện${hasFilter ? ' (đã lọc)' : ''}`}
        extra={(
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Làm mới
          </Button>
        )}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiêu đề, địa điểm…"
            className="w-full h-9 pl-9 pr-9 rounded-md border border-neutral-200 bg-white text-sm focus:border-primary-300 outline-none"
            aria-label="Tìm sự kiện"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400"
              aria-label="Xoá tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {(['all', 'DRAFT', 'PUBLISHED', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`h-9 px-3 rounded-md text-xs font-medium transition border ${
              status === s
                ? 'bg-primary-100 text-primary-700 border-primary-200'
                : 'text-neutral-500 hover:bg-neutral-50 border-transparent'
            }`}
          >
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
          </button>
        ))}
      </FilterBar>

      {isFullyEmpty || isFilteredEmpty ? (
        <div className="bg-white rounded-xl border">
          <EmptyState
            icon={CalendarDays}
            title={isFilteredEmpty ? 'Không có sự kiện khớp bộ lọc' : 'Chưa có sự kiện'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Tạo sự kiện nội bộ, xuất bản để nhân viên RSVP.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatus('all') } }
                : { label: 'Tạo sự kiện', onClick: () => nav('/admin/events/new') }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}

      <EventFormModal
        isOpen={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => {
          if (!cancel.isPending && !del.isPending) setConfirmAction(null)
        }}
        onConfirm={() => {
          if (!confirmAction) return
          if (confirmAction.type === 'cancel') {
            cancel.mutate(confirmAction.id, {
              onSettled: () => setConfirmAction(null),
            })
          } else {
            del.mutate(confirmAction.id, {
              onSettled: () => setConfirmAction(null),
            })
          }
        }}
        title={
          confirmAction?.type === 'cancel'
            ? 'Huỷ sự kiện này?'
            : `Xoá "${confirmAction?.title ?? 'sự kiện'}"?`
        }
        message={
          confirmAction?.type === 'cancel'
            ? `Sự kiện "${confirmAction.title}" sẽ chuyển sang Đã huỷ.`
            : 'Thao tác không thể hoàn tác.'
        }
        confirmText={confirmAction?.type === 'cancel' ? 'Huỷ sự kiện' : 'Xoá'}
        cancelText="Giữ lại"
        variant={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
        isLoading={cancel.isPending || del.isPending}
      />
    </div>
  )
}

function EventFormFields({
  title,
  setTitle,
  description,
  setDescription,
  location,
  setLocation,
  startAt,
  setStartAt,
  endAt,
  setEndAt,
  capacity,
  setCapacity,
}: {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  location: string
  setLocation: (v: string) => void
  startAt: string
  setStartAt: (v: string) => void
  endAt: string
  setEndAt: (v: string) => void
  capacity: string
  setCapacity: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Tiêu đề *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label>Mô tả</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-300"
        />
      </div>
      <div>
        <Label>Địa điểm</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Bắt đầu *</Label>
          <Input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        <div>
          <Label>Kết thúc</Label>
          <Input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Sức chứa</Label>
        <Input
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Không giới hạn nếu trống"
        />
      </div>
    </div>
  )
}

function EventFormModal({
  isOpen,
  initial,
  onClose,
}: {
  isOpen: boolean
  initial: EventDto | null
  onClose: () => void
}) {
  const save = useSaveEvent()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [capacity, setCapacity] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setTitle(initial?.title || '')
    setDescription(initial?.description || '')
    setLocation(initial?.location || '')
    setStartAt(toLocalInput(initial?.startAt))
    setEndAt(toLocalInput(initial?.endAt))
    setCapacity(initial?.capacity != null ? String(initial.capacity) : '')
  }, [isOpen, initial])

  const submit = () => {
    if (!title.trim() || !startAt) return
    const body: EventSaveRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt,
      endAt: endAt || undefined,
      capacity: capacity ? Number(capacity) : null,
    }
    save.mutate(
      { id: initial?.id, body },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Sửa sự kiện' : 'Tạo sự kiện'}
      maxWidth="md"
    >
      <EventFormFields
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        location={location}
        setLocation={setLocation}
        startAt={startAt}
        setStartAt={setStartAt}
        endAt={endAt}
        setEndAt={setEndAt}
        capacity={capacity}
        setCapacity={setCapacity}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Huỷ
        </Button>
        <Button
          className="gap-1.5"
          disabled={save.isPending || !title.trim() || !startAt}
          onClick={submit}
        >
          {save.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          Lưu
        </Button>
      </div>
    </AppModal>
  )
}

export function EventDetailAdminPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: event, isLoading, isError, refetch } = useEvent(id)
  const { data: regs = [] } = useEventRegistrations(id)
  const publish = usePublishEvent()
  const cancel = useCancelEvent()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!id) {
    return <EmptyState icon={CalendarDays} title="Thiếu ID sự kiện" />
  }

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center text-neutral-400">
        <Loader2 className="animate-spin" size={22} />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Không tải được sự kiện"
        action={{ label: 'Thử lại', onClick: () => refetch() }}
      />
    )
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl mx-auto w-full">
      <PageHeader
        title={event.title}
        description={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                STATUS_CHIP[event.status] || STATUS_CHIP.DRAFT
              }`}
            >
              {STATUS_LABEL[event.status] || event.status}
            </span>
            <span>{fmtDt(event.startAt)}</span>
            {event.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={12} /> {event.location}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => nav('/admin/events')}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => setEditOpen(true)}
            >
              <Edit3 size={14} /> Sửa
            </Button>
            {event.status === 'DRAFT' && (
              <Button
                className="gap-1"
                disabled={publish.isPending}
                onClick={() => publish.mutate(event.id)}
              >
                <Megaphone size={14} /> Xuất bản
              </Button>
            )}
            {event.status === 'PUBLISHED' && (
              <Button
                variant="outline"
                className="gap-1 text-rose-600"
                disabled={cancel.isPending}
                onClick={() => setCancelOpen(true)}
              >
                <Ban size={14} /> Huỷ
              </Button>
            )}
          </>
        }
      />

      {event.description && (
        <div className="bg-white rounded-xl border p-4 text-sm text-neutral-700 whitespace-pre-wrap">
          {event.description}
        </div>
      )}

      <div className="bg-white rounded-xl border p-4">
        <h3 className="text-sm font-semibold text-neutral-800 mb-3 inline-flex items-center gap-1.5">
          <Users size={14} /> RSVP ({regs.length}
          {event.capacity != null ? ` / ${event.capacity}` : ''})
        </h3>
        {regs.length === 0 ? (
          <p className="text-sm text-neutral-400">Chưa có đăng ký.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {regs.map((r) => (
              <li
                key={r.id}
                className="py-2 flex items-center justify-between text-sm"
              >
                <span className="font-medium text-neutral-800">
                  @{r.username}
                </span>
                <span className="text-xs text-neutral-500">{r.rsvpStatus}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EventFormModal
        isOpen={editOpen}
        initial={event}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => {
          if (!cancel.isPending) setCancelOpen(false)
        }}
        onConfirm={() => {
          cancel.mutate(event.id, { onSettled: () => setCancelOpen(false) })
        }}
        title="Huỷ sự kiện?"
        message={`Sự kiện "${event.title}" sẽ chuyển sang Đã huỷ.`}
        confirmText="Huỷ sự kiện"
        cancelText="Giữ lại"
        variant="warning"
        isLoading={cancel.isPending}
      />
    </div>
  )
}

export function EventFormPage() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const { data: event, isLoading } = useEvent(isEdit ? id : undefined)
  const save = useSaveEvent()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [capacity, setCapacity] = useState('')

  useEffect(() => {
    if (!event) return
    setTitle(event.title)
    setDescription(event.description || '')
    setLocation(event.location || '')
    setStartAt(toLocalInput(event.startAt))
    setEndAt(toLocalInput(event.endAt))
    setCapacity(event.capacity != null ? String(event.capacity) : '')
  }, [event])

  const submit = () => {
    if (!title.trim() || !startAt) return
    const body: EventSaveRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt,
      endAt: endAt || undefined,
      capacity: capacity ? Number(capacity) : null,
    }
    save.mutate(
      { id: isEdit ? id : undefined, body },
      {
        onSuccess: (res) => {
          if (res?.id) nav(`/admin/events/${res.id}`)
          else nav('/admin/events')
        },
      },
    )
  }

  if (isEdit && isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-xl mx-auto w-full">
      <PageHeader
        title={isEdit ? 'Sửa sự kiện' : 'Tạo sự kiện'}
        actions={
          <Button variant="outline" className="gap-1" onClick={() => nav('/admin/events')}>
            <ArrowLeft size={14} /> Quay lại
          </Button>
        }
      />
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <EventFormFields
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          location={location}
          setLocation={setLocation}
          startAt={startAt}
          setStartAt={setStartAt}
          endAt={endAt}
          setEndAt={setEndAt}
          capacity={capacity}
          setCapacity={setCapacity}
        />
        <Button
          className="gap-1.5 w-full sm:w-auto"
          disabled={save.isPending || !title.trim() || !startAt}
          onClick={submit}
        >
          {save.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
          Lưu sự kiện
        </Button>
      </div>
    </div>
  )
}
