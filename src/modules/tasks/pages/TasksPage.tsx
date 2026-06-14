import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
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
  
  // ---- Queries & Mutations ----
  const { data: rawData, isLoading } = useTasks()
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

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa task này?')) {
      deleteTask.mutate(id)
    }
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
          'DONE': { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
          'IN_PROGRESS': { label: 'Đang làm', color: 'bg-blue-100 text-blue-700' },
          'TODO': { label: 'Cần làm', color: 'bg-neutral-100 text-neutral-700' },
        }
        const s = statusMap[val || 'TODO'] || statusMap['TODO']
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
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  // ---- Form Fields ----
  const formFields = [
    { name: 'title', label: 'Tiêu đề', placeholder: 'Task...' },
    { name: 'description', label: 'Mô tả' },
    { name: 'status', label: 'Trạng thái' },
    { name: 'priority', label: 'Mức độ' },
    { name: 'assigneeId', label: 'Người thực hiện' },
    { name: 'dueDate', label: 'Deadline' },
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

      <AppTable 
        data={dataList} 
        columns={columns} 
        isLoading={isLoading} 
      />

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
    </div>
  )
}

