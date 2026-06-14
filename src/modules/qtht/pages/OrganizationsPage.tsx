import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import * as z from 'zod'
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '../hooks/useQtht'
import { orgSchema } from '../constants/schema'

const TYPE_OPTIONS = [
  { value: 'COMPANY', label: 'Công ty' },
  { value: 'DEPARTMENT', label: 'Phòng ban' },
  { value: 'BRANCH', label: 'Chi nhánh' },
  { value: 'AGENCY', label: 'Đại lý' },
  { value: 'PARTNER', label: 'Đối tác' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'SUPPLIER', label: 'Nhà cung cấp' },
  { value: 'GOVERNMENT', label: 'Cơ quan nhà nước' },
  { value: 'EDUCATIONAL', label: 'Giáo dục' },
  { value: 'HOSPITAL', label: 'Bệnh viện' },
  { value: 'OTHER', label: 'Khác' },
]

const LEVEL_OPTIONS = [
  { value: '1', label: 'Công ty chủ quản' },
  { value: '2', label: 'Chi nhánh' },
]

const SCALE_OPTIONS = [
  { value: 'MICRO', label: 'Siêu nhỏ' },
  { value: 'SMALL', label: 'Nhỏ' },
  { value: 'MEDIUM', label: 'Vừa' },
  { value: 'LARGE', label: 'Lớn' },
  { value: 'ENTERPRISE', label: 'Doanh nghiệp' },
  { value: 'CORPORATION', label: 'Tập đoàn' },
]

const defaultFormValues = {
  code: '',
  name: '',
  nameEn: '',
  shortName: '',
  taxCode: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  level: 1,
  type: '',
  status: true,
  scale: '',
  parentId: '',
  description: '',
  orderIndex: 0,
}

export function OrganizationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  const { data: rawData, isLoading } = useOrganizations()
  const createReq = useCreateOrganization()
  const updateReq = useUpdateOrganization()
  const deleteReq = useDeleteOrganization()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    const payload = { ...values, status: values.status ? 'ACTIVE' : 'INACTIVE' }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') payload[key] = null
    }
    payload.level = Number(values.level)
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Mã', dataIndex: 'code' },
    { title: 'Tên Tổ chức', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Loại', dataIndex: 'type' },
    {
      title: 'Trạng thái', dataIndex: 'status',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'bg-success/10 text-success',
          INACTIVE: 'bg-neutral-100 text-neutral-500',
          SUSPENDED: 'bg-warning/10 text-warning',
          MERGED: 'bg-info/10 text-info',
          ACQUIRED: 'bg-info/10 text-info',
          DISSOLVED: 'bg-danger/10 text-danger',
          LIQUIDATED: 'bg-danger/10 text-danger',
        }
        const labelMap: Record<string, string> = {
          ACTIVE: 'Hoạt động',
          INACTIVE: 'Ngừng hoạt động',
          SUSPENDED: 'Tạm ngưng',
          MERGED: 'Đã sáp nhập',
          ACQUIRED: 'Đã mua lại',
          DISSOLVED: 'Đã giải thể',
          LIQUIDATED: 'Đã thanh lý',
        }
        return (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[val] || 'bg-neutral-100 text-neutral-500'}`}>
            {labelMap[val] || val}
          </span>
        )
      }
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button title="Sửa" onClick={() => { setSelectedItem(row); setModalOpen(true) }} className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
            <Edit size={15} />
          </button>
          <button title="Xóa" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(row.id) }} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Tổ chức / Công ty</h1></div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>
      <AppTable data={dataList} columns={columns} isLoading={isLoading} />
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa tổ chức' : 'Thêm tổ chức'} maxWidth="4xl">
        <AppForm
          schema={orgSchema}
          defaultValues={selectedItem ? { ...defaultFormValues, ...selectedItem, status: selectedItem.status === 'ACTIVE' } : defaultFormValues}
          onSubmit={handleSubmit}
          fields={[
            { name: 'code', label: 'Mã tổ chức', required: true, placeholder: 'VÍ_DỤ: ORG001' },
            { name: 'name', label: 'Tên tổ chức', required: true },
            { name: 'nameEn', label: 'Tên tiếng Anh' },
            { name: 'shortName', label: 'Tên viết tắt' },
            { name: 'type', label: 'Loại tổ chức', type: 'select', options: TYPE_OPTIONS, required: true },
            { name: 'level', label: 'Cấp độ', type: 'select', options: LEVEL_OPTIONS, required: true },
            { name: 'status', label: 'Trạng thái', type: 'switch' },
            { name: 'scale', label: 'Quy mô', type: 'select', options: SCALE_OPTIONS },
            { name: 'parentId', label: 'Tổ chức cha' },
            { name: 'taxCode', label: 'Mã số thuế' },
            { name: 'email', label: 'Email' },
            { name: 'phone', label: 'Số điện thoại' },
            { name: 'website', label: 'Website' },
            { name: 'address', label: 'Địa chỉ' },
            { name: 'description', label: 'Mô tả' },
            { name: 'orderIndex', label: 'Thứ tự', type: 'number' },
          ]}
          isLoading={createReq.isPending || updateReq.isPending}
          onCancel={() => setModalOpen(false)}
        />
      </AppModal>
    </div>
  )
}

