import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Package, Layers, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button, ConfirmDialog } from '@frezo/ui'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
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
    queryFn: () => categoryApi.getAll({ groupCode: 'LoaiSanPham' }),
    select: (res: any) => res?.data?.items ?? [],
  })

  const categoryOptions = useMemo(
    () => (Array.isArray(categoryList) ? categoryList.map((c: any) => ({ value: c.id || c.value, label: c.name || c.label })) : []),
    [categoryList]
  )

  const dataList = rawData || []

  const totalProducts = Array.isArray(dataList) ? dataList.length : 0
  const activeProducts = Array.isArray(dataList) ? dataList.filter((p: any) => p.isActive !== false).length : 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    try {
      const res = await productApi.uploadImage(file)
      const url = res?.data?.url ?? ''
      if (url) {
        setImageUrl(url)
        toast.success('Upload ảnh thành công')
      } else {
        toast.error('Không lấy được URL ảnh')
      }
    } catch {
      toast.error('Upload ảnh thất bại')
    } finally {
      setImageUploading(false)
      e.target.value = ''
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
      title: 'Tên sản phẩm', dataIndex: 'name', filterType: 'text',
      render: (val: string) => <span className="font-medium text-neutral-800">{val}</span>,
    },
    {
      title: 'Giá', dataIndex: 'price',
      render: (val: number) => (
        <span className="font-mono text-sm font-semibold text-neutral-800">{Number(val ?? 0).toLocaleString('vi-VN')}</span>
      ),
    },
    {
      title: 'Danh mục', dataIndex: 'category', filterType: 'text',
      render: (val: string) => {
        const option = categoryOptions.find((opt) => opt.value === val)
        return <span>{option ? option.label : val || '---'}</span>
      }
    },
    {
      title: 'Trạng thái', dataIndex: 'isActive',
      render: (val: boolean) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${val !== false ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
          {val !== false ? 'Đang KD' : 'Ngừng KD'}
        </span>
      ),
    },
    {
      title: 'Đánh giá', dataIndex: 'rating',
      render: (val: number) => <span className="text-xs text-neutral-600">{val ? `${val} ⭐` : '---'}</span>
    },
    {
      title: 'Mới', dataIndex: 'isNew',
      render: (val: boolean) => val && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">NEW</span>
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
    { name: 'name', label: 'Tên sản phẩm', required: true, placeholder: 'Nhập tên sản phẩm' },
    { name: 'category', label: 'Danh mục', type: 'select', options: categoryOptions, required: true },
    { name: 'price', label: 'Giá', type: 'number', placeholder: '0', required: true },
    { name: 'isNew', label: 'Sản phẩm mới', type: 'switch' },
    { name: 'isActive', label: 'Hoạt động', type: 'switch' },
    { name: 'description', label: 'Mô tả', placeholder: 'Mô tả sản phẩm...' },
  ]

  const defaultFormValues = {
    name: '', price: 0, description: '',
    category: '', isActive: true, imageUrl: '', isNew: false
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
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image Upload (Left Side) */}
          <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-700">Ảnh đại diện</span>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
                ${imageUrl
                  ? 'border-transparent bg-neutral-100 shadow-sm'
                  : 'border-neutral-200 hover:border-primary-400 bg-neutral-50 hover:bg-primary-50/30'
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
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-primary-500" />
                  <span className="text-xs text-primary-600 font-medium animate-pulse">Đang tải...</span>
                </div>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full"><Upload size={14}/> Đổi ảnh</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageUrl('') }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Xóa ảnh"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
                    <Upload size={20} className="text-primary-500" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-700">Tải ảnh lên</span>
                  <span className="text-[11px] text-neutral-400 leading-tight">PNG, JPG, WEBP tối đa 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields (Right Side) */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
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
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-neutral-100">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl min-w-[100px]">
                Hủy
              </Button>
              <Button type="submit" form="product-form" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl min-w-[120px] shadow-sm">
                {(createReq.isPending || updateReq.isPending) ? <Loader2 size={16} className="animate-spin" /> : (selectedItem ? 'Cập nhật' : 'Thêm sản phẩm')}
              </Button>
            </div>
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
