import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import * as z from 'zod'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTicketTag'
import { tagSchema } from '../constants/schema'

export function TagsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  
  const { data: rawData, isLoading } = useTags()
  const createReq = useCreateTag()
  const updateReq = useUpdateTag()
  const deleteReq = useDeleteTag()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Tên Tag', dataIndex: 'name' },
    { 
      title: 'Màu sắc', 
      dataIndex: 'color',
      render: (val: any) => (
        <span className="px-2 py-1 text-xs rounded text-white" style={{ backgroundColor: val || '#ccc' }}>
          {val || 'Default'}
        </span>
      ),
    },
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
        <div><h1 className="text-2xl font-semibold">Quản lý Tags</h1></div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      <AppTable data={dataList} columns={columns} isLoading={isLoading} />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa Tag' : 'Tạo Tag'}>
        <AppForm
          schema={tagSchema}
          defaultValues={selectedItem || { name: '', color: '' }}
          onSubmit={handleSubmit}
          fields={[{ name: 'name', label: 'Tên Tag' }, { name: 'color', label: 'Mã màu (Hex)' }]}
          submitText="Xác nhận"
          isLoading={createReq.isPending || updateReq.isPending}
        />
      </AppModal>
    </div>
  )
}

