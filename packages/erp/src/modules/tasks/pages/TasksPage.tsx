import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, ListTodo } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterExportDrawer, FilterExportTrigger } from '@/components/shared/FilterExportDrawer'
import { downloadCsv } from '@/utils/csvExport'
import {
  AppModal, Button, ConfirmDialog, ErrorState, EmptyState,
  PageHeader, PageGuideButton, Select, AppTooltip, type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../hooks/useTask'
import { taskFormSchema, type TaskFormValues } from '../constants/schema'

const TASKS_GUIDE: PageGuideConfig = {
  title: 'Quản lý công việc',
  subtitle: 'Giao việc và theo dõi trạng thái cho nhân sự.',
  sections: [
    {
      heading: 'Trạng thái',
      type: 'tips',
      tips: [
        'Chưa làm → Đang làm → Hoàn thành hoặc Đã hủy.',
        'Lọc theo trạng thái hoặc mức độ ưu tiên để ưu tiên xử lý.',
      ],
    },
  ],
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Chưa làm', color: 'bg-neutral-100 text-neutral-700' },
  IN_PROGRESS: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
}

const PRIO_MAP: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Cao', color: 'bg-red-100 text-red-700' },
  MEDIUM: { label: 'Trung bình', color: 'bg-orange-100 text-orange-700' },
  LOW: { label: 'Thấp', color: 'bg-green-100 text-green-700' },
}

interface TasksPageProps {
  /** Nhúng trong WorkHubPage — ẩn PageHeader, bỏ padding ngoài. */
  embedded?: boolean
}

export function TasksPage({ embedded = false }: TasksPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const { data: rawData, isLoading, isError, refetch, isFetching } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filtered = useMemo(() => {
    let rows = dataList
    if (statusFilter !== 'ALL') {
      rows = rows.filter((t) => (t.status || 'OPEN') === statusFilter)
    }
    if (priorityFilter !== 'ALL') {
      rows = rows.filter((t) => (t.priority || 'MEDIUM') === priorityFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [dataList, search, statusFilter, priorityFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
    setPriorityFilter('ALL')
  }

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (priorityFilter !== 'ALL' ? 1 : 0)

  const handleExportCsv = () => {
    downloadCsv(
      'cong-viec.csv',
      filtered.map((t) => ({
        title: t.title,
        description: t.description,
        status: STATUS_MAP[t.status || 'OPEN']?.label ?? t.status,
        priority: PRIO_MAP[t.priority || 'MEDIUM']?.label ?? t.priority,
        dueDate: t.dueDate,
      })),
      [
        { key: 'title', label: 'Tiêu đề' },
        { key: 'description', label: 'Mô tả' },
        { key: 'status', label: 'Trạng thái' },
        { key: 'priority', label: 'Mức độ' },
        { key: 'dueDate', label: 'Hạn' },
      ],
    )
  }

  const filterDrawerContent = (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-600">Tìm kiếm</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm tiêu đề, mô tả…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm công việc"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-600">Trạng thái</label>
        <Select
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Trạng thái"
          aria-label="Lọc trạng thái"
          showSearch={false}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-600">Mức độ ưu tiên</label>
        <Select
          options={[
            { value: 'ALL', label: 'Tất cả mức độ' },
            ...Object.entries(PRIO_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="Mức độ"
          aria-label="Lọc mức độ"
          showSearch={false}
        />
      </div>
    </>
  )

  const filterBarContent = (
    <>
      <div className="min-w-[140px]">
        <Select
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Trạng thái"
          aria-label="Lọc trạng thái"
          showSearch={false}
        />
      </div>
      <div className="min-w-[140px]">
        <Select
          options={[
            { value: 'ALL', label: 'Tất cả mức độ' },
            ...Object.entries(PRIO_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          value={priorityFilter}
          onChange={setPriorityFilter}
          placeholder="Mức độ"
          aria-label="Lọc mức độ"
          showSearch={false}
        />
      </div>
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
          placeholder="Tìm tiêu đề, mô tả…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Tìm công việc"
        />
      </div>
    </>
  )

  const handleOpenCreate = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (task: any) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleSubmit = (values: TaskFormValues) => {
    if (selectedTask?.id) {
      updateTask.mutate(
        { id: selectedTask.id, data: values },
        { onSuccess: () => setModalOpen(false) },
      )
    } else {
      createTask.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns: AppTableColumn<any>[] = [
    { key: 'title', title: 'Tiêu đề', dataIndex: 'title' },
    { key: 'description', title: 'Mô tả', dataIndex: 'description' },
    {
      key: 'status',
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (_, row) => {
        const s = STATUS_MAP[row.status || 'OPEN'] || STATUS_MAP.OPEN
        return <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>{s.label}</span>
      },
    },
    {
      key: 'priority',
      title: 'Mức độ',
      dataIndex: 'priority',
      render: (_, row) => {
        const p = PRIO_MAP[row.priority || 'MEDIUM'] || PRIO_MAP.MEDIUM
        return <span className={`px-2 py-1 text-xs rounded-full ${p.color}`}>{p.label}</span>
      },
    },
    { key: 'dueDate', title: 'Hạn', dataIndex: 'dueDate' },
    {
      key: 'actions',
      title: 'Thao tác',
      dataIndex: 'id',
      width: 100,
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <AppTooltip content="Sửa">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)} aria-label="Sửa">
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          </AppTooltip>
          <AppTooltip content="Xóa">
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: row.id, title: row.title })} aria-label="Xóa">
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </AppTooltip>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'title', label: 'Tiêu đề', placeholder: 'Task...', colSpan: 3 },
    { name: 'description', label: 'Mô tả', type: 'textarea', colSpan: 3 },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { value: '', label: '-- Chọn --' },
        { value: 'OPEN', label: 'Chưa làm' },
        { value: 'IN_PROGRESS', label: 'Đang làm' },
        { value: 'DONE', label: 'Hoàn thành' },
        { value: 'CANCELLED', label: 'Đã hủy' },
      ],
    },
    {
      name: 'priority',
      label: 'Mức độ',
      type: 'select',
      options: [
        { value: '', label: '-- Chọn --' },
        { value: 'LOW', label: 'Thấp' },
        { value: 'MEDIUM', label: 'Trung bình' },
        { value: 'HIGH', label: 'Cao' },
      ],
    },
    { name: 'assigneeId', label: 'Người thực hiện' },
    { name: 'dueDate', label: 'Hạn', type: 'date' },
  ]

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center">
      <PageGuideButton guide={TASKS_GUIDE} />
      <Button onClick={handleOpenCreate} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white">
        <Plus className="w-4 h-4" /> Thêm mới
      </Button>
    </div>
  )

  return (
    <div className={embedded ? 'space-y-4' : 'p-6 space-y-4 animate-fade-in'}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Task nội bộ — giao và theo dõi trạng thái.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {filtered.length} công việc{hasFilter ? ' (đã lọc)' : ''}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterExportTrigger
              onClick={() => setFilterDrawerOpen(true)}
              activeCount={activeFilterCount}
            />
            {headerActions}
          </div>
        </div>
      ) : (
        <PageHeader
          title="Quản lý công việc"
          description="Quản lý và giao việc cho nhân sự"
          actions={headerActions}
        />
      )}

      {embedded ? (
        <FilterExportDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          hasActiveFilters={hasFilter}
          onClear={clearFilters}
          onExport={handleExportCsv}
          exportDisabled={filtered.length === 0}
        >
          {filterDrawerContent}
        </FilterExportDrawer>
      ) : (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={clearFilters}
          countLabel={`${filtered.length} công việc${hasFilter ? ' (đã lọc)' : ''}`}
        >
          {filterBarContent}
        </FilterBar>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh sách công việc"
            message="Lỗi mạng hoặc máy chủ. Thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={ListTodo}
            title={isFilteredEmpty ? 'Không có công việc khớp bộ lọc' : 'Chưa có công việc'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái / mức độ.'
                : 'Tạo task mới để giao việc cho nhân sự.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : { label: 'Thêm task', onClick: handleOpenCreate }
            }
          />
        </div>
      ) : (
        <AppTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}
      >
        <AppForm
          schema={taskFormSchema}
          defaultValues={selectedTask || { title: '', description: '' }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createTask.isPending || updateTask.isPending}
          submitText={selectedTask ? 'Cập nhật' : 'Tạo mới'}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleteTask.isPending) setDeleteTarget(null)
        }}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteTask.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }}
        title="Xoá task này?"
        message={
          deleteTarget?.title
            ? `Task "${deleteTarget.title}" sẽ bị xoá. Không thể hoàn tác.`
            : 'Task sẽ bị xoá. Không thể hoàn tác.'
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}
