import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from '../hooks/useProduct'
import { productFormSchema, type ProductFormValues } from '../constants/schema'

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data: rawData, isLoading } = useProducts()
  const createReq = useCreateProduct()
  const updateReq = useUpdateProduct()
  const deleteReq = useDeleteProduct()

  const dataList = rawData || []

  const handleSubmit = (values: ProductFormValues) => {
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: values }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Mã SP', dataIndex: 'code', filterType: 'text' },
    { title: 'Tên sản phẩm', dataIndex: 'name', filterType: 'text' },
    { title: 'Giá', dataIndex: 'price' },
    { title: 'Đơn vị', dataIndex: 'unit', filterType: 'text' },
    { title: 'Danh mục', dataIndex: 'categoryName', filterType: 'text' },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Xóa sản phẩm này?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const formFields = [
    { name: 'code', label: 'Mã sản phẩm' },
    { name: 'name', label: 'Tên sản phẩm' },
    { name: 'price', label: 'Giá', type: 'number' },
    { name: 'unit', label: 'Đơn vị' },
    { name: 'description', label: 'Mô tả' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quản lý Sản phẩm</h1>
          <p className="text-sm text-neutral-500">Danh mục sản phẩm và đơn hàng</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setModalOpen(true) }} className="bg-primary-600 hover:bg-primary-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> Thêm mới
        </Button>
      </div>

      <AppTable
        data={dataList}
        columns={columns as any}
        isLoading={isLoading}
        showSearch={true}
        searchPlaceholder="Tìm theo tên, mã sản phẩm..."
      />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Cập nhật Sản phẩm' : 'Thêm Sản phẩm mới'}>
        <AppForm
          schema={productFormSchema}
          defaultValues={selectedItem || { name: '', code: '', price: 0, unit: '', description: '' }}
          onSubmit={handleSubmit}
          fields={formFields}
          isLoading={createReq.isPending || updateReq.isPending}
          submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
        />
      </AppModal>
    </div>
  )
}
