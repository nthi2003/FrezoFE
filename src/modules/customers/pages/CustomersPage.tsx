import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer
} from '../hooks/useCustomer'
import { customerFormSchema, type CustomerFormValues } from '../constants/schema'

export function CustomersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data: rawData, isLoading } = useCustomers()
  const createReq = useCreateCustomer()
  const updateReq = useUpdateCustomer()
  const deleteReq = useDeleteCustomer()

  const dataList = rawData || []

  const handleSubmit = (values: CustomerFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Tên khách hàng', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'SĐT', dataIndex: 'phone' },
    { title: 'Địa chỉ', dataIndex: 'address' },
    { title: 'Mã số thuế', dataIndex: 'taxCode' },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Xóa khách hàng này?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'name', label: 'Tên khách hàng' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Số điện thoại' },
    { name: 'address', label: 'Địa chỉ' },
    { name: 'taxCode', label: 'Mã số thuế' },
    { name: 'note', label: 'Ghi chú' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Khách hàng</h1>
          <p className="text-sm text-neutral-500">Danh sách khách hàng và nhà cung cấp</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable data={dataList} columns={columns} isLoading={isLoading} />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'}>
        <AppForm
          schema={customerFormSchema}
          defaultValues={selectedItem || { name: '', email: '', phone: '', address: '', taxCode: '', note: '' }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
    </div>
  )
}
