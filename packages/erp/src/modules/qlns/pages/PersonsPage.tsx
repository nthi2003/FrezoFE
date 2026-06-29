import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Loader2, Search, Filter, RotateCw } from 'lucide-react'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { ConfirmDialog } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Switch } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { organizationApi, departmentApi } from '@/modules/qtht/services/qthtApi'
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
  departmentId: '',
  jobTitle: '',
  activated: true,
}

export function PersonsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null)
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning'
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // Pagination & Filter States
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [filters, setFilters] = useState<Record<string, any>>({})

  const queryClient = useQueryClient()

  // Build filter query params
  const filterParams = {
    pageNumber: page,
    pageSize: size,
    ...filters
  }

  const { data: rawData, isLoading } = usePersons(filterParams)
  const { data: orgList } = useQuery({
    queryKey: ['organizations-combobox'],
    queryFn: () => organizationApi.getCombobox(),
  })
  const { data: departmentList } = useQuery({
    queryKey: ['departments-combobox'],
    queryFn: () => departmentApi.getCombobox(),
  })
  const { data: chucDanhList } = useQuery({
    queryKey: ['categories', 'ChucDanh'],
    queryFn: () => categoryApi.getAll({ type: 'ChucDanh' }),
    select: (res: any) => res?.data?.items ?? [],
  })
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const deletePerson = useDeletePerson()
  const activatePerson = useActivatePerson()
  const deactivatePerson = useDeactivatePerson()

  const orgOptions = useMemo(() => Array.isArray(orgList) ? orgList.map((o: any) => ({ value: o.value, label: o.label })) : [], [orgList])
  const departmentOptions = useMemo(() => Array.isArray(departmentList) ? departmentList.map((d: any) => ({ value: d.value, label: d.label })) : [], [departmentList])
  const chucDanhOptions = useMemo(() => Array.isArray(chucDanhList) ? chucDanhList.map((item: any) => ({ value: item.name, label: item.name })) : [], [chucDanhList])
  
  const dataList = rawData?.items || []
  const totalElements = rawData?.total || 0

  const handlePageChange = (newPage: number, newSize: number) => {
    setPage(newPage)
    setSize(newSize)
  }

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
    if (newActivated) {
      activatePerson.mutate(person.id, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['persons'] })
      })
    } else {
      deactivatePerson.mutate(person.id, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['persons'] })
      })
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

  const columns: AppTableColumn<any>[] = [
    { title: 'Mã NV', dataIndex: 'code', key: 'code',
      render: (val: any) => <span className="font-mono text-xs font-semibold text-neutral-600">{val}</span> },
    { title: 'Họ tên', dataIndex: 'name', key: 'name',
      render: (val: any) => <span className="font-medium text-neutral-800">{val}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Tổ chức',
      dataIndex: 'orgName',
      key: 'orgName',
      filterType: 'select',
      filterKey: 'orgId',
      filterOptions: orgOptions,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentName',
      key: 'departmentName',
      filterType: 'select',
      filterKey: 'departmentId',
      filterOptions: departmentOptions,
    },
    {
      title: 'Chức danh',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      filterType: 'select',
      filterOptions: chucDanhOptions,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      filterType: 'select',
      filterOptions: GENDER_OPTIONS,
      render: (val: string) => GENDER_OPTIONS.find(opt => opt.value === val)?.label || val
    },
    {
      title: 'Trạng thái', dataIndex: 'activated', key: 'activated',
      filterType: 'boolean',
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

      {/* Table */}
      <AppTable
        data={dataList}
        columns={columns}
        isLoading={isLoading}
        pageIndex={page}
        pageSize={size}
        totalElements={totalElements}
        onPageChange={handlePageChange}
        showSearch={true}
        searchPlaceholder="Tìm theo tên, mã nhân viên..."
        onFilterChange={(nextFilters) => {
          setFilters(nextFilters)
          setPage(1)
        }}
      />

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
            { name: 'departmentId', label: 'Phòng ban', type: 'select', options: departmentOptions },
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
