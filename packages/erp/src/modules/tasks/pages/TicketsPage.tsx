import { useState, useCallback } from 'react'
import { Plus, Search, Calendar, User, LayoutGrid, CalendarDays } from 'lucide-react'
import { TicketCalendar } from '../components/TicketCalendar'
import { AppModal } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { personApi } from '@/modules/qlns/services/personApi'
import { tagApi } from '../services/taskApi'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTicketTag'
import { ticketSchema } from '../constants/schema'

const STATUSES = [
  { key: 'OPEN', label: 'Mở', color: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
  { key: 'IN_PROGRESS', label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { key: 'RESOLVED', label: 'Đã giải quyết', color: 'bg-green-50 text-green-700 border-green-300' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: '-- Chọn --' },
  { value: 'BUG', label: 'Lỗi' },
  { value: 'FEATURE_REQUEST', label: 'Yêu cầu tính năng' },
  { value: 'SUPPORT', label: 'Hỗ trợ' },
  { value: 'OTHER', label: 'Khác' },
]

export function TicketsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const params = {
    ...(searchText ? { keyword: searchText } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  }

  const { data: rawData, isLoading } = useTickets(params)
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

  const { data: priorityOptionsData } = useQuery({
    queryKey: ['tags-priority'],
    queryFn: () => tagApi.getAll({ category: 'priority' }),
    select: (res: any) => {
      const items = res?.data ?? res ?? []
      return items || []
    },
  })

  const { data: statusOptionsData } = useQuery({
    queryKey: ['tags-status'],
    queryFn: () => tagApi.getAll({ category: 'status' }),
    select: (res: any) => {
      const items = res?.data ?? res ?? []
      return items || []
    },
  })

  const priorityOptions = [
    { value: '', label: '-- Chọn --' },
    ...(priorityOptionsData || []).map((t: any) => ({ value: t.code, label: t.name })),
  ]

  const priorityColorMap: Record<string, string> = {}
  for (const t of priorityOptionsData || []) {
    if (t.code) priorityColorMap[t.code] = t.color || 'bg-neutral-100 text-neutral-600'
  }

  const statusFormOptions = [
    { value: '', label: '-- Chọn --' },
    ...(statusOptionsData || []).map((t: any) => ({ value: t.code, label: t.name })),
  ]

  const statusColorMap: Record<string, string> = {}
  for (const t of statusOptionsData || []) {
    if (t.code) statusColorMap[t.code] = t.color || 'bg-neutral-100 text-neutral-700'
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', status: '', priority: '', category: '', assigneeId: '', dueDate: '', resolutionNote: '' },
  })
  const formStatus = watch('status')
  const formPriority = watch('priority')
  const formCategory = watch('category')
  const formAssignee = watch('assigneeId')

  const dataList = rawData || []

  const columns = STATUSES.map((s) => ({
    ...s,
    items: dataList.filter((t: any) => t.status === s.key || (!t.status && s.key === 'OPEN')),
  }))

  const handleOpenCreate = () => {
    setSelectedItem(null)
    reset({ title: '', description: '', status: '', priority: '', category: '', assigneeId: '', dueDate: '', resolutionNote: '' })
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
    const payload: any = {}
    payload.title = values.title
    if (values.description) payload.description = values.description
    if (values.status) payload.status = values.status
    if (values.priority) payload.priority = values.priority
    if (values.category) payload.category = values.category
    if (values.assigneeId) payload.assigneeId = values.assigneeId
    if (values.dueDate) payload.dueDate = values.dueDate
    if (values.resolutionNote) payload.resolutionNote = values.resolutionNote

    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleDrop = useCallback((ticketId: string, newStatus: string) => {
    const ticket = dataList.find((t: any) => t.id === ticketId)
    if (ticket && ticket.status !== newStatus) {
      updateReq.mutate({ id: ticketId, data: { title: ticket.title, status: newStatus } })
    }
  }, [dataList, updateReq])

  const onDragStart = (id: string) => { setDraggedId(id) }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const onDrop = (statusKey: string) => {
    if (draggedId) { handleDrop(draggedId, statusKey); setDraggedId(null) }
  }

  const handleDropOnCalendar = useCallback((ticketId: string, dateStr: string) => {
    const ticket = dataList.find((t: any) => t.id === ticketId)
    if (ticket) {
      const newDueDate = new Date(dateStr)
      newDueDate.setHours(23, 59, 0, 0)
      updateReq.mutate({ id: ticketId, data: { title: ticket.title, dueDate: newDueDate.toISOString() } })
    }
  }, [dataList, updateReq])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Giao việc</h1></div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tiêu đề..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-10 w-full pl-9 pr-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-neutral-400"
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
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="h-10 px-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          title="Từ ngày"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="h-10 px-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          title="Đến ngày"
        />
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
              viewMode === 'kanban' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
              viewMode === 'calendar' ? 'bg-primary-500 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Lịch
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'calendar' ? (
        <TicketCalendar
          tickets={dataList}
          priorityColorMap={priorityColorMap}
          priorityOptionsData={priorityOptionsData || []}
          personOptions={personOptions || []}
          onEditTicket={handleOpenEdit}
          onDropTicket={handleDropOnCalendar}
        />
      ) : dataList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <img src="/img/mas-cost-check-list.png" alt="Chưa có việc" className="w-40 h-40 object-contain mb-4 opacity-70" />
          <p className="text-base font-medium">Frezo chưa giao việc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.key}
              onDragOver={onDragOver}
              onDrop={() => onDrop(col.key)}
              className={`rounded-xl border border-border bg-neutral-50 min-h-[300px] flex flex-col ${draggedId ? 'bg-neutral-100' : ''}`}
            >
              <div className={`px-4 py-3 border-b border-border font-semibold text-sm flex items-center gap-2 rounded-t-xl`}>
                <span>{col.label}</span>
                <span className="text-xs text-neutral-500 font-normal">({col.items.length})</span>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px]">
                {col.items.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8">Không có việc</p>
                ) : (
                  col.items.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={() => onDragStart(ticket.id)}
                      onClick={() => handleOpenEdit(ticket)}
                      className="bg-white rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {ticket.code && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{ticket.code}</span>
                        )}
                        {ticket.priority && (
                          <span
                            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
                            style={{ backgroundColor: priorityColorMap[ticket.priority] || '#6b7280' }}
                          >
                            {priorityOptionsData?.find((p: any) => p.code === ticket.priority)?.name || ticket.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-800 leading-tight line-clamp-2">{ticket.title}</p>
                      {ticket.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2">{ticket.description}</p>
                      )}
                      <div className="flex items-center gap-3 pt-1 text-[10px] text-neutral-400">
                        {ticket.assigneeId && (
                          <span className="flex items-center gap-1">
                            <User size={11} /> {personOptions?.find((p: any) => p.value === ticket.assigneeId)?.label || ticket.assigneeId}
                          </span>
                        )}
                        {ticket.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {new Date(ticket.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {ticket.category && (
                          <span className="text-neutral-300">• {ticket.category}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa giao việc' : 'Tạo giao việc'} maxWidth="2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {selectedItem?.code && (
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-border">
              <span className="text-xs text-neutral-400 font-medium">Mã:</span>
              <span className="text-sm font-mono text-neutral-600 font-semibold">{selectedItem.code}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label>Tiêu đề <span className="text-red-500">*</span></Label>
            <Input {...register('title')} placeholder="Nhập tiêu đề..." />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Nhập mô tả..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-neutral-400 resize-none"
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
                options={priorityOptions || [{ value: '', label: '-- Chọn --' }]}
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
              <Label>Hạn hoàn thành</Label>
              <input
                type="datetime-local"
                {...register('dueDate')}
                className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú xử lý</Label>
            <textarea
              {...register('resolutionNote')}
              rows={2}
              placeholder="Nhập ghi chú..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-neutral-400 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              {(createReq.isPending || updateReq.isPending) ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
