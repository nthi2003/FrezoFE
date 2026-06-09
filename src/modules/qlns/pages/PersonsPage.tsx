import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import {
  usePersons,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useActivatePerson,
  useDeactivatePerson
} from '../hooks/usePerson'
import { personFormSchema, type PersonFormValues } from '../constants/schema'

export function PersonsPage() {
  // ---- State ----
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  
  // ---- Queries & Mutations ----
  const { data: rawData, isLoading } = usePersons()
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const activatePerson = useActivatePerson()
  const deactivatePerson = useDeactivatePerson()

  // Parse list from backend format. Adjust logic depending on real BE response map
  const dataList = rawData || []

  // ---- Handlers ----
  const handleOpenCreate = () => {
    setSelectedPerson(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (person: any) => {
    setSelectedPerson(person)
    setModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) {
      deletePerson.mutate(id)
    }
  }

  const handleToggleActive = (person: any) => {
    if (person.status || person.isActive) {
      if (confirm(`Vô hiệu hóa nhân sự ${person.name}?`)) {
        deactivatePerson.mutate(person.id)
      }
    } else {
      activatePerson.mutate(person.id)
    }
  }

  const handleSubmit = (values: PersonFormValues) => {
    if (selectedPerson?.id) {
      updatePerson.mutate(
        { id: selectedPerson.id, data: values },
        { onSuccess: () => setModalOpen(false) }
      )
    } else {
      createPerson.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  // ---- Table Columns ----
  const columns = [
    { title: 'Mã NV', dataIndex: 'code' },
    { title: 'Họ tên', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Phòng ban', dataIndex: 'departmentName' },
    { title: 'Chức danh', dataIndex: 'jobTitle' },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (val: any) => (
        <span className={`px-2 py-1 text-xs rounded-full ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val ? 'Đang làm việc' : 'Đã nghỉ/Khóa'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleToggleActive(row)} title={row.isActive ? "Vô hiệu hóa" : "Kích hoạt"}>
            {row.isActive ? <ShieldAlert className="w-4 h-4 text-orange-600" /> : <ShieldCheck className="w-4 h-4 text-green-600" />}
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
    { name: 'code', label: 'Mã nhân viên', placeholder: 'NV001...' },
    { name: 'name', label: 'Họ tên', placeholder: 'Nguyễn Văn A' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Số điện thoại' },
    { name: 'identityNumber', label: 'CCCD/CMND' },
    { name: 'departmentId', label: 'Phòng ban' },
    { name: 'jobTitle', label: 'Chức danh' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Nhân viên</h1>
          <p className="text-sm text-neutral-500">Quản lý hồ sơ nhân sự trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm nhân viên
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
        title={selectedPerson ? 'Cập nhật Nhân viên' : 'Thêm Nhân viên mới'}
      >
        <AppForm
          schema={personFormSchema}
          defaultValues={selectedPerson || { code: '', name: '', email: '', phone: '', status: true }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createPerson.isPending || updatePerson.isPending}
          submitText={selectedPerson ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
    </div>
  )
}

