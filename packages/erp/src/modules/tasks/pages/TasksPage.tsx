import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ListTodo, Gift, CheckCircle2, Undo2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterExportDrawer, FilterExportTrigger } from '@/components/shared/FilterExportDrawer'
import { downloadCsv } from '@/utils/csvExport'
import {
  AppModal, Button, ConfirmDialog, ErrorState, EmptyState,
  PageHeader, PageGuideButton, Select, RowActions, type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useReviewTask,
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
        'Chưa làm → Đang làm → Hoàn thành (chờ duyệt) → Đã đóng.',
        'Người thực hiện đánh dấu hoàn thành; người giao duyệt hoặc trả lại.',
        'Lọc theo trạng thái hoặc mức độ ưu tiên để ưu tiên xử lý.',
      ],
    },
  ],
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Chưa làm', color: 'bg-neutral-100 text-neutral-700' },
  IN_PROGRESS: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
  DONE: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800' },
  CLOSED: { label: 'Đã đóng', color: 'bg-green-100 text-green-700' },
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
  const [completeConfirm, setCompleteConfirm] = useState<{ id: string; title?: string; values: TaskFormValues } | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{
    id: string
    title?: string
    approved: boolean
    assigneeId?: string
  } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const { data: rawData, isLoading, isError, refetch, isFetching } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const reviewTask = useReviewTask()

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
    const becomingDone =
      values.status === 'DONE' && selectedTask?.id && selectedTask.status !== 'DONE'
    if (becomingDone && selectedTask?.id) {
      setCompleteConfirm({ id: selectedTask.id, title: values.title || selectedTask.title, values })
      return
    }
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
      width: 180,
      align: 'right',
      render: (_, row) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'return',
              icon: Undo2,
              tooltip: 'Trả lại',
              tone: 'rose',
              hidden: !row.canReview,
              onClick: () =>
                setReviewTarget({
                  id: row.id,
                  title: row.title,
                  approved: false,
                  assigneeId: row.assigneeId,
                }),
            },
            {
              key: 'approve',
              icon: CheckCircle2,
              tooltip: 'Duyệt',
              tone: 'emerald',
              hidden: !row.canReview,
              onClick: () =>
                setReviewTarget({
                  id: row.id,
                  title: row.title,
                  approved: true,
                  assigneeId: row.assigneeId,
                }),
            },
            { kind: 'edit', onClick: () => handleOpenEdit(row) },
            { kind: 'delete', onClick: () => setDeleteTarget({ id: row.id, title: row.title }) },
          ]}
        />
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
        { value: 'DONE', label: 'Hoàn thành (chờ duyệt)' },
        { value: 'CLOSED', label: 'Đã đóng' },
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
        title="Xoá giao việc này?"
        message={
          deleteTarget?.title
            ? `Giao việc "${deleteTarget.title}" sẽ bị xoá. Không thể hoàn tác.`
            : 'Giao việc sẽ bị xoá. Không thể hoàn tác.'
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        variant="danger"
        isLoading={deleteTask.isPending}
      />

      <ConfirmDialog
        isOpen={!!completeConfirm}
        onClose={() => setCompleteConfirm(null)}
        title="Xác nhận hoàn thành?"
        message={
          completeConfirm
            ? `「${completeConfirm.title || 'Task'}」 sẽ chờ người giao duyệt. Bạn chắc đã xong?`
            : ''
        }
        confirmText="Đã hoàn thành"
        cancelText="Chưa xong"
        variant="default"
        isLoading={updateTask.isPending}
        onConfirm={() => {
          if (!completeConfirm) return
          updateTask.mutate(
            { id: completeConfirm.id, data: completeConfirm.values },
            {
              onSuccess: () => {
                setCompleteConfirm(null)
                setModalOpen(false)
              },
            },
          )
        }}
      />

      <ConfirmDialog
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={reviewTarget?.approved ? 'Duyệt hoàn thành?' : 'Trả lại người xử lý?'}
        message={
          reviewTarget?.approved ? (
            <span className="block space-y-2">
              <span className="block">「{reviewTarget.title || 'Task'}」 sẽ được đóng.</span>
              {reviewTarget.assigneeId && (
                <Link
                  to={`/qlns/recognition?personId=${encodeURIComponent(reviewTarget.assigneeId)}&ticketId=${encodeURIComponent(reviewTarget.id)}&action=gift`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  <Gift size={14} /> Tặng token (tuỳ chọn) — tuyên dương
                </Link>
              )}
            </span>
          ) : (
            `「${reviewTarget?.title || 'Task'}」 sẽ trả về Đang làm.`
          )
        }
        confirmText={reviewTarget?.approved ? 'Duyệt & đóng' : 'Trả lại'}
        variant={reviewTarget?.approved ? 'default' : 'warning'}
        isLoading={reviewTask.isPending}
        onConfirm={() => {
          if (!reviewTarget) return
          reviewTask.mutate(
            { id: reviewTarget.id, approved: reviewTarget.approved },
            { onSuccess: () => setReviewTarget(null) },
          )
        }}
      />
    </div>
  )
}
