import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { organizationApi } from '@/modules/qtht/services/qthtApi'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import {
  usePersons,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useActivatePerson,
  useDeactivatePerson
} from '../hooks/usePerson'
import { personFormSchema, type PersonFormValues } from '../constants/schema'

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
]

const defaultFormValues = {
  code: '',
  name: '',
  email: '',
  phone: '',
  identityNumber: '',
  gender: '',
  birthDate: '',
  address: '',
  orgId: '',
  jobTitle: '',
  activated: true,
}

export function PersonsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const queryClient = useQueryClient()
  const { data: rawData, isLoading } = usePersons()
  const { data: orgList } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
  })
  const { data: chucDanhList } = useQuery({
    queryKey: ['categories', 'ChucDanh'],
    queryFn: () => categoryApi.getAll({ groupCode: 'ChucDanh' }),
    select: (res: any) => res?.data ?? [],
  })
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const activatePerson = useActivatePerson()
  const deactivatePerson = useDeactivatePerson()

  const orgOptions = Array.isArray(orgList) ? orgList.map((o: any) => ({ value: o.value, label: o.label })) : []
  const chucDanhOptions = Array.isArray(chucDanhList) ? chucDanhList.map((item: any) => ({ value: item.name, label: item.name })) : []
  const dataList = rawData || []

  const handleOpenCreate = () => {
    setSelectedPerson(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (person: any) => {
    setSelectedPerson(person)
    setModalOpen(true)
  }

  const handleDelete = (person: any) => {
    setConfirm({
      isOpen: true,
      title: 'Xóa nhân viên',
      message: `Bạn có chắc chắn muốn xóa nhân viên "${person.name}"? Hành động này không thể hoàn tác.`,
      variant: 'danger',
      onConfirm: () => { deletePerson.mutate(person.id); setConfirm(c => ({ ...c, isOpen: false })) },
    })
  }

  const handleToggleActive = (person: any) => {
    const newActivated = !person.activated
    queryClient.setQueryData(['persons'], (old: any) => {
      if (!old?.data?.items) return old
      return { ...old, data: { ...old.data, items: old.data.items.map((item: any) =>
        item.id === person.id ? { ...item, activated: newActivated } : item
      )}}
    })
    if (newActivated) {
      activatePerson.mutate(person.id)
    } else {
      deactivatePerson.mutate(person.id)
    }
  }

  const onSubmit = (values: PersonFormValues) => {
    if (selectedPerson?.id) {
      updatePerson.mutate(
        { id: selectedPerson.id, data: values },
        { onSuccess: () => setModalOpen(false) }
      )
    } else {
      createPerson.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const isPending = createPerson.isPending || updatePerson.isPending

  const columns = [
    { title: 'Mã NV', dataIndex: 'code', key: 'code',
      render: (val: any) => <span className="font-mono text-xs font-semibold text-neutral-600">{val}</span> },
    { title: 'Họ tên', dataIndex: 'name', key: 'name',
      render: (val: any) => <span className="font-medium text-neutral-800">{val}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Tổ chức', dataIndex: 'orgName', key: 'orgName' },
    { title: 'Chức danh', dataIndex: 'jobTitle', key: 'jobTitle' },
    {
      title: 'Trạng thái', dataIndex: 'activated', key: 'activated',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={!!row.activated}
            onChange={() => handleToggleActive(row)}
          />
          <span className={`text-xs font-medium ${row.activated ? 'text-success' : 'text-neutral-500'}`}>
            {row.activated ? 'Hoạt động' : 'Không hoạt động'}
          </span>
        </div>
      ),
    },
    {
      title: 'Thao tác', dataIndex: 'id', key: 'actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <button
            title="Sửa"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Edit size={15} />
          </button>

          <button
            title="Xóa"
            onClick={() => handleDelete(row)}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Quản lý Nhân viên</h2>
          <p className="text-sm text-neutral-500 mt-1">Quản lý hồ sơ nhân sự trong hệ thống</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm">
          <Plus size={16} /> Thêm mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input placeholder="Tìm theo tên, mã nhân viên..." className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <AppTable data={dataList} columns={columns} isLoading={isLoading} />

      {/* Modal Tạo / Sửa */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedPerson ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới'}
        description={selectedPerson ? 'Chỉnh sửa thông tin hồ sơ nhân sự.' : 'Điền thông tin để tạo hồ sơ nhân viên mới.'}
        maxWidth="4xl"
      >
        <AppForm
          schema={personFormSchema}
          defaultValues={selectedPerson ? selectedPerson : defaultFormValues}
          onSubmit={onSubmit}
          onCancel={() => setModalOpen(false)}
          isLoading={isPending}
          fields={[
            { name: 'code', label: 'Mã nhân viên', required: true, placeholder: 'NV001' },
            { name: 'name', label: 'Họ và tên', required: true, placeholder: 'Nguyễn Văn A' },
            { name: 'gender', label: 'Giới tính', type: 'select', options: GENDER_OPTIONS },
            { name: 'email', label: 'Email', placeholder: 'example@frezo.com' },
            { name: 'phone', label: 'Số điện thoại', placeholder: '0901 234 567' },
            { name: 'identityNumber', label: 'CCCD / CMND', placeholder: '012345678901' },
            { name: 'birthDate', label: 'Ngày sinh', type: 'date' },
            { name: 'jobTitle', label: 'Chức danh', type: 'select', options: chucDanhOptions },
            { name: 'orgId', label: 'Tổ chức', type: 'select', options: orgOptions },
            { name: 'activated', label: 'Trạng thái', type: 'switch' },
            { name: 'address', label: 'Địa chỉ', placeholder: 'Số nhà, đường, quận, thành phố...' },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={() => setConfirm(c => ({ ...c, isOpen: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant || 'danger'}
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </div>
  )
}
