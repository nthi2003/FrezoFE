import { useState, useCallback, useMemo } from 'react'
import { Plus, Search, LayoutGrid, CalendarDays, Users, Filter, X, Flame, Zap, AlertCircle, Clock, MessageSquare, type LucideIcon } from 'lucide-react'
import { TicketCalendar } from '../components/TicketCalendar'
import { TicketCard } from '../components/TicketCard'
import {
  AppModal,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  Skeleton,
  ConfirmDialog,
  Button,
  Label,
  Input,
  Select,
} from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { personApi } from '@/modules/qlns/services/personApi'
import { profileApi } from '@/modules/profile/services/profileApi'
import { tagApi } from '../services/taskApi'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTicketTag'
import { ticketSchema } from '../constants/schema'
import { TICKETS_GUIDE } from '../constants/tickets.guide'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'

// ============================================================
// Constants
// ============================================================

const STATUSES = [
  {
    key: 'OPEN',
    label: 'Mở',
    dotColor: 'bg-neutral-500',
    headerBg: 'bg-neutral-100',
    headerText: 'text-neutral-800',
    countClass: 'bg-neutral-500 text-white',
  },
  {
    key: 'IN_PROGRESS',
    label: 'Đang xử lý',
    dotColor: 'bg-info',
    headerBg: 'bg-info-light',
    headerText: 'text-info-dark',
    countClass: 'bg-info text-white',
  },
  {
    key: 'RESOLVED',
    label: 'Đã giải quyết',
    dotColor: 'bg-success',
    headerBg: 'bg-success-light',
    headerText: 'text-success-dark',
    countClass: 'bg-success text-white',
  },
] as const

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: '-- Chọn --' },
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE_REQUEST', label: 'Feature' },
  { value: 'SUPPORT', label: 'Hỗ trợ' },
  { value: 'OTHER', label: 'Khác' },
]

const PRIORITY_FILTER = [
  { value: 'URGENT', label: 'Khẩn cấp', icon: Flame, tone: 'text-danger-dark bg-danger-light hover:bg-danger-light border-danger/30' },
  { value: 'HIGH', label: 'Cao', icon: Zap, tone: 'text-warning-dark bg-warning-light hover:bg-warning-light border-warning/30' },
  { value: 'MEDIUM', label: 'Trung bình', icon: AlertCircle, tone: 'text-info-dark bg-info-light hover:bg-info-light border-info/30' },
  { value: 'LOW', label: 'Thấp', icon: Clock, tone: 'text-neutral-600 bg-neutral-50 hover:bg-neutral-100 border-neutral-200' },
]

// ============================================================
// Page
// ============================================================

export function TicketsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [commentTicket, setCommentTicket] = useState<any | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilters, setPriorityFilters] = useState<string[]>([])
  const [mineOnly, setMineOnly] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  // ---- Profile để xác định "của tôi" ----
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })
  const currentPersonId = profile?.personId

  // ---- Data fetching ----
  const params = {
    ...(searchText ? { keyword: searchText } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  }
  const { data: rawData, isLoading, isError, refetch, isFetching } = useTickets(params)
  const createReq = useCreateTicket()
  const updateReq = useUpdateTicket()
  const deleteReq = useDeleteTicket()

  const { data: personOptions } = useQuery({
    queryKey: ['persons-combobox'],
    queryFn: () => personApi.getCombobox(),
    select: (res: any) => {
      const items = res?.data ?? res ?? []
      return items.map((p: any) => ({ value: p.value || p.id, label: p.label || p.name }))
    },
  })
  const personMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of personOptions || []) m[p.value] = p.label
    return m
  }, [personOptions])

  const { data: priorityOptionsData } = useQuery({
    queryKey: ['tags-priority'],
    queryFn: () => tagApi.getAll({ category: 'priority' }),
    select: (res: any) => res?.data ?? res ?? [],
  })

  const { data: statusOptionsData } = useQuery({
    queryKey: ['tags-status'],
    queryFn: () => tagApi.getAll({ category: 'status' }),
    select: (res: any) => res?.data ?? res ?? [],
  })

  const priorityOptions = [
    { value: '', label: '-- Chọn --' },
    ...(priorityOptionsData || []).map((t: any) => ({ value: t.code, label: t.name })),
  ]
  const priorityMetaMap = useMemo(() => {
    const m: Record<string, { color?: string; name?: string }> = {
      URGENT: { color: '#e11d48', name: 'Khẩn cấp' },
      HIGH: { color: '#f97316', name: 'Cao' },
      MEDIUM: { color: '#f59e0b', name: 'Trung bình' },
      LOW: { color: '#9ca3af', name: 'Thấp' },
    }
    for (const t of priorityOptionsData || []) {
      if (t.code) m[t.code] = { color: t.color, name: t.name }
    }
    return m
  }, [priorityOptionsData])

  const statusFormOptions = [
    { value: '', label: '-- Chọn --' },
    ...(statusOptionsData || []).map((t: any) => ({ value: t.code, label: t.name })),
  ]

  // ---- Form ----
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '', description: '', status: '', priority: '', category: '',
      assigneeId: '', dueDate: '', resolutionNote: '',
    },
  })
  const formStatus = watch('status')
  const formPriority = watch('priority')
  const formCategory = watch('category')
  const formAssignee = watch('assigneeId')

  // ---- Filter client-side (backend chưa hỗ trợ priority/mine filter) ----
  const filteredList = useMemo(() => {
    let list: any[] = rawData || []
    if (mineOnly && currentPersonId) {
      list = list.filter((t) => t.assigneeId === currentPersonId)
    }
    if (priorityFilters.length > 0) {
      list = list.filter((t) => priorityFilters.includes(t.priority))
    }
    return list
  }, [rawData, mineOnly, currentPersonId, priorityFilters])

  const columns = STATUSES.map((s) => ({
    ...s,
    items: filteredList.filter((t: any) => t.status === s.key || (!t.status && s.key === 'OPEN')),
  }))

  // ---- Stats ----
  const stats = useMemo(() => {
    const overdue = filteredList.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== 'RESOLVED' &&
        t.status !== 'CLOSED',
    ).length
    const inProgress = filteredList.filter((t) => t.status === 'IN_PROGRESS').length
    const urgent = filteredList.filter((t) => t.priority === 'URGENT').length
    return { total: filteredList.length, overdue, inProgress, urgent }
  }, [filteredList])

  // ---- Handlers ----
  const handleOpenCreate = () => {
    setSelectedItem(null)
    reset({
      title: '', description: '', status: '', priority: '', category: '',
      assigneeId: '', dueDate: '', resolutionNote: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (ticket: any) => {
    setSelectedItem(ticket)
    reset({
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || '',
      priority: ticket.priority || '',
      category: ticket.category || '',
      assigneeId: ticket.assigneeId || '',
      dueDate: ticket.dueDate ? ticket.dueDate.slice(0, 16) : '',
      resolutionNote: ticket.resolutionNote || '',
    })
    setModalOpen(true)
  }

  const onSubmit = (values: any) => {
    const payload: any = { title: values.title }
    for (const k of ['description', 'status', 'priority', 'category', 'assigneeId', 'dueDate', 'resolutionNote'] as const) {
      if (values[k]) payload[k] = values[k]
    }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleDrop = useCallback(
    (ticketId: string, newStatus: string) => {
      const ticket = (rawData || []).find((t: any) => t.id === ticketId)
      if (ticket && ticket.status !== newStatus) {
        updateReq.mutate({ id: ticketId, data: { title: ticket.title, status: newStatus } })
      }
    },
    [rawData, updateReq],
  )

  const onDragStart = (id: string) => setDraggedId(id)
  const onDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault()
    if (dragOverCol !== colKey) setDragOverCol(colKey)
  }
  const onDragLeave = () => setDragOverCol(null)
  const onDrop = (statusKey: string) => {
    if (draggedId) {
      handleDrop(draggedId, statusKey)
      setDraggedId(null)
    }
    setDragOverCol(null)
  }
  const onDragEnd = () => {
    setDraggedId(null)
    setDragOverCol(null)
  }

  const handleDropOnCalendar = useCallback(
    (ticketId: string, dateStr: string) => {
      const ticket = (rawData || []).find((t: any) => t.id === ticketId)
      if (ticket) {
        const newDueDate = new Date(dateStr)
        newDueDate.setHours(23, 59, 0, 0)
        updateReq.mutate({
          id: ticketId,
          data: { title: ticket.title, dueDate: newDueDate.toISOString() },
        })
      }
    },
    [rawData, updateReq],
  )

  const togglePriority = (p: string) => {
    setPriorityFilters((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const clearFilters = () => {
    setSearchText('')
    setStatusFilter('')
    setPriorityFilters([])
    setMineOnly(false)
    setFromDate('')
    setToDate('')
  }

  const hasActiveFilter =
    !!searchText || !!statusFilter || priorityFilters.length > 0 || mineOnly || !!fromDate || !!toDate

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-5 bg-neutral-50/50 min-h-[calc(100vh-64px)] animate-fade-in">
      <PageHeader
        title="Giao việc (Ticket)"
        description="Kanban board tác vụ nội bộ — kéo thả để đổi trạng thái, theo dõi SLA và priority."
        actions={
          <>
            <PageGuideButton guide={TICKETS_GUIDE} />
            <Button onClick={handleOpenCreate} className="gap-2 bg-primary-600 hover:bg-primary-700 shadow-sm">
              <Plus className="w-4 h-4" /> Thêm giao việc
            </Button>
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Tổng ticket" value={stats.total} tone="neutral" />
        <StatChip label="Đang xử lý" value={stats.inProgress} tone="info" />
        <StatChip label="Khẩn cấp" value={stats.urgent} tone="danger" icon={Flame} />
        <StatChip label="Quá hạn" value={stats.overdue} tone="warning" />
      </div>

      {/* Filter bar */}
      <div className="p-3 bg-surface border border-border shadow-card rounded-xl space-y-3">
        {/* Row 1: search + status + date + view toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề, mã, mô tả..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 w-full pl-9 pr-3 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all placeholder:text-neutral-400"
            />
          </div>
          <div className="w-44">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || '')}
              placeholder="Tất cả trạng thái"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 px-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 text-neutral-600"
              title="Từ ngày"
            />
            <span className="text-neutral-400">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 px-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 text-neutral-600"
              title="Đến ngày"
            />
          </div>
          <div className="flex items-center bg-neutral-100/80 rounded-lg p-1 border border-neutral-200/50 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white shadow-sm text-primary-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white shadow-sm text-primary-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Lịch
            </button>
          </div>
        </div>

        {/* Row 2: quick chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1 inline-flex items-center gap-1">
            <Filter size={11} /> Lọc nhanh:
          </span>
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            disabled={!currentPersonId}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border transition ${
              mineOnly
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            } ${!currentPersonId ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={currentPersonId ? 'Chỉ hiển thị ticket được giao cho tôi' : 'Cần liên kết tài khoản với nhân sự'}
          >
            <Users size={12} /> Của tôi
          </button>
          {PRIORITY_FILTER.map((p) => {
            const active = priorityFilters.includes(p.value)
            const Icon = p.icon
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePriority(p.value)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium border transition ${
                  active
                    ? p.tone.replace('hover:', '') + ' font-semibold'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <Icon size={12} /> {p.label}
              </button>
            )
          })}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X size={12} /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* === BODY === */}
      {isLoading ? (
        <BoardSkeleton />
      ) : isError ? (
        <ErrorState
          title="Không tải được giao việc"
          message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : viewMode === 'calendar' ? (
        <TicketCalendar
          tickets={filteredList}
          priorityColorMap={Object.fromEntries(Object.entries(priorityMetaMap).map(([k, v]) => [k, v.color || '#9ca3af']))}
          priorityOptionsData={priorityOptionsData || []}
          personOptions={personOptions || []}
          onEditTicket={handleOpenEdit}
          onDropTicket={handleDropOnCalendar}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={hasActiveFilter ? 'Không có ticket nào khớp bộ lọc' : 'Chưa có ticket nào'}
          description={
            hasActiveFilter
              ? 'Thử xoá bộ lọc để xem tất cả giao việc.'
              : 'Tạo ticket đầu tiên để bắt đầu theo dõi trên Kanban.'
          }
          action={
            hasActiveFilter
              ? { label: 'Xoá bộ lọc', onClick: clearFilters }
              : { label: 'Thêm giao việc', onClick: handleOpenCreate }
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => onDragOver(e, col.key)}
              onDragLeave={onDragLeave}
              onDrop={() => onDrop(col.key)}
              className={`rounded-xl border transition-all duration-200 min-h-[400px] flex flex-col ${
                dragOverCol === col.key
                  ? 'bg-primary-50 border-primary-400 border-dashed shadow-card'
                  : draggedId
                    ? 'bg-surface-secondary border-border border-dashed opacity-70'
                    : 'bg-surface-secondary border-border'
              }`}
            >
              {/* Column header */}
              <div
                className={`px-4 py-3 border-b font-semibold text-sm flex items-center justify-between rounded-t-xl ${
                  dragOverCol === col.key
                    ? 'bg-primary-50 border-primary-200'
                    : `${col.headerBg} border-border`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${col.dotColor}`} />
                  <span className={dragOverCol === col.key ? 'text-primary-700' : col.headerText}>
                    {col.label}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums ${
                    dragOverCol === col.key
                      ? 'bg-primary-600 text-white'
                      : col.countClass
                  }`}
                >
                  {col.items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-380px)] custom-scrollbar">
                {col.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 opacity-60">
                    <LayoutGrid className="w-8 h-8 text-neutral-300 mb-2" strokeWidth={1.5} />
                    <p className="text-xs text-neutral-400 text-center font-medium">
                      {dragOverCol === col.key ? 'Thả vào đây' : 'Không có công việc'}
                    </p>
                  </div>
                ) : (
                  col.items.map((ticket: any) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      isDragging={draggedId === ticket.id}
                      onClick={() => handleOpenEdit(ticket)}
                      onDragStart={() => onDragStart(ticket.id)}
                      onDragEnd={onDragEnd}
                      onComment={() => setCommentTicket(ticket)}
                      onDelete={() => setDeleteTarget(ticket)}
                      priorityMeta={priorityMetaMap[ticket.priority]}
                      assigneeName={personMap[ticket.assigneeId]}
                      currentPersonId={currentPersonId}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Modal ===  (giữ nguyên form flow — chỉ chỉnh label & spacing) */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Chi tiết & chỉnh sửa giao việc' : 'Tạo giao việc mới'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {selectedItem?.code && (
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-xs text-neutral-400 font-medium">Mã ticket:</span>
              <span className="text-sm font-mono text-neutral-700 font-semibold">
                {selectedItem.code}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input {...register('title')} placeholder="VD: Fix bug đăng nhập trên Safari..." />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label>Mô tả chi tiết</Label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Reproduce step, expected/actual behavior, screenshot link..."
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-neutral-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                options={statusFormOptions}
                value={formStatus || ''}
                onChange={(v) => setValue('status', v || '')}
                placeholder="Chọn trạng thái"
              />
            </div>
            <div className="space-y-2">
              <Label>Mức ưu tiên</Label>
              <Select
                options={priorityOptions}
                value={formPriority || ''}
                onChange={(v) => setValue('priority', v || '')}
                placeholder="Chọn mức ưu tiên"
              />
            </div>
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select
                options={CATEGORY_OPTIONS}
                value={formCategory || ''}
                onChange={(v) => setValue('category', v || '')}
                placeholder="Chọn danh mục"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Người thực hiện</Label>
              <Select
                options={personOptions || []}
                value={formAssignee || ''}
                onChange={(v) => setValue('assigneeId', v || '')}
                placeholder="Chọn người thực hiện"
                showSearch
                showClear
              />
            </div>
            <div className="space-y-2">
              <Label>Hạn hoàn thành (SLA)</Label>
              <input
                type="datetime-local"
                {...register('dueDate')}
                className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú xử lý</Label>
            <textarea
              {...register('resolutionNote')}
              rows={2}
              placeholder="Ghi lại giải pháp / commit / PR link khi hoàn thành..."
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-neutral-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            {selectedItem?.id && (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 mr-auto"
                onClick={() => {
                  setCommentTicket(selectedItem)
                  setModalOpen(false)
                }}
              >
                <MessageSquare size={14} /> Bình luận
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createReq.isPending || updateReq.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {createReq.isPending || updateReq.isPending
                ? 'Đang xử lý...'
                : selectedItem
                  ? 'Cập nhật'
                  : 'Tạo ticket'}
            </Button>
          </div>
        </form>
      </AppModal>

      <CommentDrawer
        open={!!commentTicket}
        onClose={() => setCommentTicket(null)}
        subjectType={SubjectType.TICKET}
        subjectId={commentTicket?.id || ''}
        title={commentTicket?.title || 'Ticket'}
        subtitle={commentTicket?.code}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xoá giao việc?"
        message={
          deleteTarget
            ? `Ticket "${deleteTarget.title}" sẽ bị xoá. Hành động này không hoàn tác từ UI.`
            : ''
        }
        confirmText="Xoá"
        variant="danger"
        isLoading={deleteReq.isPending}
        onConfirm={() => {
          if (!deleteTarget?.id) return
          deleteReq.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          })
        }}
      />
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

interface StatChipProps {
  label: string
  value: number
  tone: 'neutral' | 'info' | 'danger' | 'warning'
  icon?: LucideIcon
}

function StatChip({ label, value, tone, icon: Icon }: StatChipProps) {
  const toneMap = {
    neutral: 'bg-surface border-border text-neutral-700',
    info: 'bg-info-light border-info/20 text-info-dark',
    danger: 'bg-danger-light border-danger/20 text-danger-dark',
    warning: 'bg-warning-light border-warning/20 text-warning-dark',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 shadow-card ${toneMap}`}>
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-surface/70 flex items-center justify-center">
          <Icon size={16} strokeWidth={1.5} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-2xl font-bold tabular-nums leading-none mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
      {[0, 1, 2].map((col) => (
        <div key={col} className="rounded-xl border border-border bg-surface-secondary p-3 space-y-3 min-h-[320px]">
          <div className="flex items-center justify-between px-1 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-8 rounded-md" />
          </div>
          {[0, 1, 2].map((card) => (
            <div key={card} className="rounded-xl border border-border bg-surface p-3 space-y-2.5">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-1 pt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
                ))}
              </div>
              <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
