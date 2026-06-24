import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import { usePermissions, useCreatePermission, useDeletePermission } from '../hooks/useQtht'
import { orgSchema } from '../constants/schema'

export function PermissionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data: rawData, isLoading, refetch } = usePermissions()
  const createReq = useCreatePermission()
  const deleteReq = useDeletePermission()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
  }

  const columns = [
    { title: 'Mã Quyền', dataIndex: 'code', filterType: 'text' as const },
    { title: 'Tên Quyền', dataIndex: 'name', filterType: 'text' as const },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
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
        <div><h1 className="text-2xl font-semibold">Quản lý Phân quyền (Permissions)</h1></div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>
      <AppTable data={dataList} columns={columns} isLoading={isLoading} showSearch searchPlaceholder="Tìm kiếm quyền..." onRefresh={refetch} />
      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Thêm Quyền">
        <AppForm schema={orgSchema} defaultValues={{ code: '', name: '' }} onSubmit={handleSubmit} fields={[{ name: 'code', label: 'Mã Quyền (e.g. CREATE, VIEW)' }, { name: 'name', label: 'Tên Quyền' }]} submitText="Lưu" isLoading={createReq.isPending} />
      </AppModal>
    </div>
  )
}

