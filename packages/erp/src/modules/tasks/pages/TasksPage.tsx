import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal, Button, ConfirmDialog, ErrorState, EmptyState } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask
} from '../hooks/useTask'
import { taskFormSchema, type TaskFormValues } from '../constants/schema'

export function TasksPage() {
  // ---- State ----
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string } | null>(null)
  
  // ---- Queries & Mutations ----
  const { data: rawData, isLoading, isError, refetch, isFetching } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const dataList = rawData || []

  // ---- Handlers ----
  const handleOpenCreate = () => {
    setSelectedTask(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (task: any) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleDelete = (id: string, title?: string) => {
    setDeleteTarget({ id, title })
  }

  const handleSubmit = (values: TaskFormValues) => {
    if (selectedTask?.id) {
      updateTask.mutate(
        { id: selectedTask.id, data: values },
        { onSuccess: () => setModalOpen(false) }
      )
    } else {
      createTask.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  // ---- Table Columns ----
  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title' },
    { title: 'Mô tả', dataIndex: 'description' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: any) => {
        const statusMap: Record<string, { label: string, color: string }> = {
          OPEN: { label: 'Chưa làm', color: 'bg-neutral-100 text-neutral-700' },
          IN_PROGRESS: { label: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
          DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
          CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
        }
        const s = statusMap[val || 'OPEN'] || statusMap.OPEN
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>
            {s.label}
          </span>
        )
      },
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      render: (val: any) => {
        const prioMap: Record<string, { label: string, color: string }> = {
          'HIGH': { label: 'Cao', color: 'bg-red-100 text-red-700' },
          'MEDIUM': { label: 'Trung bình', color: 'bg-orange-100 text-orange-700' },
          'LOW': { label: 'Thấp', color: 'bg-green-100 text-green-700' },
        }
        const p = prioMap[val || 'MEDIUM'] || prioMap['MEDIUM']
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${p.color}`}>
            {p.label}
          </span>
        )
      },
    },
    { title: 'Deadline', dataIndex: 'dueDate' },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id, row.title)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  // ---- Form Fields (map BE TaskStatusEnum / PriorityEnum) ----
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
    { name: 'dueDate', label: 'Deadline', type: 'date' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Công việc</h1>
          <p className="text-sm text-neutral-500">Quản lý và giao việc cho nhân sự</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      {isError ? (
        <ErrorState
          title="Không tải được danh sách task"
          message="Lỗi mạng hoặc máy chủ. Thử lại."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : !isLoading && dataList.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Chưa có công việc"
          description="Tạo task mới để giao việc cho nhân sự."
          action={{ label: 'Thêm task', onClick: handleOpenCreate }}
        />
      ) : (
        <AppTable
          data={dataList}
          columns={columns}
          isLoading={isLoading}
        />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedTask ? 'Cập nhật Công việc' : 'Tạo Công việc mới'}
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

