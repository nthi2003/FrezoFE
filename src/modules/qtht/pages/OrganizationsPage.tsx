import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import * as z from 'zod'
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization } from '../hooks/useQtht'
import { orgSchema } from '../constants/schema'

export function OrganizationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  const { data: rawData, isLoading } = useOrganizations()
  const createReq = useCreateOrganization()
  const updateReq = useUpdateOrganization()
  const deleteReq = useDeleteOrganization()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Mã', dataIndex: 'code' },
    { title: 'Tên Tổ chức', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Tổ chức / Công ty</h1></div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Thêm Tổ chức
        </Button>
      </div>
      <AppTable data={dataList} columns={columns} isLoading={isLoading} />
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa' : 'Thêm'}>
        <AppForm schema={orgSchema} defaultValues={selectedItem || { code: '', name: '', email: '' }} onSubmit={handleSubmit} fields={[{ name: 'code', label: 'Mã' }, { name: 'name', label: 'Tên' }, { name: 'email', label: 'Email' }]} submitText="Lưu" isLoading={createReq.isPending || updateReq.isPending} />
      </AppModal>
    </div>
  )
}

