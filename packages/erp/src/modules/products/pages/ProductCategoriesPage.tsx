import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import { ConfirmDialog } from '@frezo/ui'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/modules/qtht/hooks/useCategory'
import { categoryFormSchema } from '@/modules/qtht/constants/category.schema'

const GROUP_CODE = 'LoaiSanPham'

const formFields = [
  { name: 'code', label: 'Mã loại', required: true, placeholder: 'VÍ_DỤ: SP001' },
  { name: 'name', label: 'Tên loại sản phẩm', required: true, placeholder: 'Nhập tên loại sản phẩm' },
  { name: 'shortName', label: 'Tên viết tắt', placeholder: 'VD: SP' },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number' },
  { name: 'description', label: 'Mô tả', placeholder: 'Mô tả loại sản phẩm...' },
  { name: 'active', label: 'Kích hoạt', type: 'switch' },
]

const defaultFormValues = {
  code: '',
  name: '',
  shortName: '',
  description: '',
  orderIndex: 0,
  active: true,
}

export function ProductCategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const { data: rawData, isLoading } = useCategories(GROUP_CODE)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    const payload = {
      ...values,
      groupCode: GROUP_CODE,
      activated: values.active !== false,
    }
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') payload[key] = null
    }
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    deleteReq.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: () => setConfirmDelete(null),
    })
  }

  const columns = [
    { title: 'Mã loại', dataIndex: 'code', filterType: 'text' as const },
    { title: 'Tên loại sản phẩm', dataIndex: 'name', filterType: 'text' as const },
    { title: 'Tên viết tắt', dataIndex: 'shortName' },
    {
      title: 'Trạng thái', dataIndex: 'active',
      render: (val: boolean) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val !== false ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {val !== false ? 'Kích hoạt' : 'Tắt'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 100,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <button
            title="Sửa"
            onClick={() => { setSelectedItem(row); setModalOpen(true) }}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            title="Xóa"
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Loại Sản phẩm</h1>
          <p className="text-sm text-neutral-500 mt-1">Quản lý danh mục loại sản phẩm</p>
        </div>
        <Button
          onClick={() => { setSelectedItem(null); setModalOpen(true) }}
          className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm shadow-primary/20"
        >
          <Plus size={17} /> Thêm loại sản phẩm
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <AppTable
          data={dataList}
          columns={columns}
          isLoading={isLoading}
          showSearch
          searchPlaceholder="Tìm theo mã, tên loại sản phẩm..."
        />
      </div>

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm mới'}
        description={selectedItem ? 'Chỉnh sửa thông tin loại sản phẩm.' : 'Điền thông tin để thêm loại sản phẩm mới.'}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <AppForm
            formId="product-category-form"
            schema={categoryFormSchema}
            defaultValues={selectedItem ? { ...defaultFormValues, ...selectedItem, active: selectedItem.active !== false } : defaultFormValues}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            fields={formFields}
            isLoading={createReq.isPending || updateReq.isPending}
            submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
            hideFooter
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="product-category-form" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              {(createReq.isPending || updateReq.isPending) ? 'Đang xử lý...' : (selectedItem ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa loại sản phẩm"
        message={`Bạn có chắc chắn muốn xóa loại sản phẩm "${confirmDelete?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
