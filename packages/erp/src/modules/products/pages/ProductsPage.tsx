import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Package, Layers, Upload, X, Loader2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@frezo/ui'
import { ConfirmDialog } from '@frezo/ui'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import { formatCurrency } from '@frezo/utils'
import { productApi } from '../services/productApi'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from '../hooks/useProduct'
import { productFormSchema, type ProductFormValues } from '../constants/schema'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang kinh doanh' },
  { value: 'INACTIVE', label: 'Ngừng kinh doanh' },
  { value: 'DISCONTINUED', label: 'Ngừng sản xuất' },
]

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  INACTIVE: 'bg-neutral-100 text-neutral-600',
  DISCONTINUED: 'bg-red-50 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang KD',
  INACTIVE: 'Ngừng KD',
  DISCONTINUED: 'Ngừng SX',
}

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: rawData, isLoading } = useProducts()
  const createReq = useCreateProduct()
  const updateReq = useUpdateProduct()
  const deleteReq = useDeleteProduct()

  const { data: categoryList } = useQuery({
    queryKey: ['categories-combobox'],
    queryFn: () => categoryApi.getAll({ groupCode: 'DanhMucSP' }),
    select: (res: any) => res?.data ?? [],
  })

  const categoryOptions = useMemo(
    () => (Array.isArray(categoryList) ? categoryList.map((c: any) => ({ value: c.id || c.value, label: c.name || c.label })) : []),
    [categoryList]
  )

  const dataList = rawData || []

  const totalProducts = Array.isArray(dataList) ? dataList.length : 0
  const activeProducts = Array.isArray(dataList) ? dataList.filter((p: any) => p.status === 'ACTIVE' || !p.status).length : 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const res = await productApi.uploadImage(file)
      setImageUrl(res?.data?.url || '')
    } catch {
      // silent
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = (values: ProductFormValues) => {
    const payload = { ...values, imageUrl }
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
    {
      title: 'Mã SP', dataIndex: 'code', filterType: 'text',
      render: (val: string) => <span className="font-mono text-xs font-semibold text-neutral-600">{val || '---'}</span>,
    },
    {
      title: 'Tên sản phẩm', dataIndex: 'name', filterType: 'text',
      render: (val: string) => <span className="font-medium text-neutral-800">{val}</span>,
    },
    {
      title: 'Giá', dataIndex: 'price',
      render: (val: number) => (
        <span className="font-mono text-sm font-semibold text-neutral-800">{formatCurrency(val ?? 0)}</span>
      ),
    },
    { title: 'Đơn vị', dataIndex: 'unit', filterType: 'text' },
    { title: 'Danh mục', dataIndex: 'categoryName', filterType: 'text' },
    {
      title: 'Trạng thái', dataIndex: 'status',
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[val] || STATUS_BADGE['ACTIVE']}`}>
          {STATUS_LABEL[val] || 'Đang KD'}
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
            onClick={() => openModal(row)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Pencil className="w-4 h-4" />
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

  const formFields = [
    { name: 'code', label: 'Mã sản phẩm', placeholder: 'SP001' },
    { name: 'name', label: 'Tên sản phẩm', required: true, placeholder: 'Nhập tên sản phẩm' },
    { name: 'categoryId', label: 'Danh mục', type: 'select', options: categoryOptions },
    { name: 'price', label: 'Giá', type: 'number', placeholder: '0' },
    { name: 'unit', label: 'Đơn vị', placeholder: 'Cái, hộp, kg...' },
    { name: 'status', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS },
    { name: 'description', label: 'Mô tả', placeholder: 'Mô tả sản phẩm...' },
  ]

  const defaultFormValues = {
    name: '', code: '', price: 0, unit: '', description: '',
    categoryId: '', status: 'ACTIVE', imageUrl: '',
  }

  const openModal = (item: any | null) => {
    setSelectedItem(item)
    setImageUrl(item?.imageUrl || '')
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Sản phẩm</h1>
          <p className="text-sm text-neutral-500 mt-1">Quản lý danh mục sản phẩm, giá cả và đơn hàng</p>
        </div>
        <Button
          onClick={() => openModal(null)}
          className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm shadow-primary/20"
        >
          <Plus size={17} /> Thêm sản phẩm
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <Package size={22} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Tổng sản phẩm</p>
            <h3 className="text-2xl font-bold text-neutral-900">{totalProducts}</h3>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Danh mục</p>
            <h3 className="text-2xl font-bold text-neutral-900">{categoryOptions.length}</h3>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Package size={22} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Đang kinh doanh</p>
            <h3 className="text-2xl font-bold text-neutral-900">{activeProducts}</h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <AppTable
          data={dataList}
          columns={columns as any}
          isLoading={isLoading}
          showSearch={true}
          searchPlaceholder="Tìm theo tên, mã sản phẩm..."
        />
      </div>

      {/* Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        description={selectedItem ? 'Chỉnh sửa thông tin sản phẩm.' : 'Điền thông tin để thêm sản phẩm mới vào hệ thống.'}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <AppForm
            formId="product-form"
            schema={productFormSchema}
            defaultValues={selectedItem || defaultFormValues}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            fields={formFields}
            isLoading={createReq.isPending || updateReq.isPending}
            submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
            hideFooter
          />

          {/* Image Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
              ${imageUrl
                ? 'border-primary-300 bg-primary-50/30'
                : 'border-neutral-300 hover:border-primary-400 bg-neutral-50 hover:bg-primary-50/30'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            {imageUploading ? (
              <Loader2 size={28} className="animate-spin text-primary-500" />
            ) : imageUrl ? (
              <>
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImageUrl('') }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors z-10"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload size={24} className="text-neutral-400" />
                <span className="text-sm text-neutral-500">Click để tải ảnh lên</span>
                <span className="text-xs text-neutral-400">Hỗ trợ: PNG, JPG, WEBP, GIF</span>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="product-form" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              {(createReq.isPending || updateReq.isPending) ? 'Đang xử lý...' : (selectedItem ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </div>
      </AppModal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${confirmDelete?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
