import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@/components/ui/AppModal'
import { AppForm } from '@/components/shared/AppForm'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategory'
import { categoryFormSchema, GROUP_CODE_OPTIONS, GROUP_CODE_LABEL } from '../constants/category.schema'

const URL_TO_GROUP: Record<string, string> = {
  title: 'ChucDanh',
  signer: 'NguoiKy',
  location: 'DiaBan',
  industry: 'Nganh',
  issuer: 'CoQuanPhatHanh',
}

const ROUTE_LABEL: Record<string, string> = {
  title: 'Chức Danh',
  signer: 'Người Ký',
  location: 'Địa Bàn',
  industry: 'Ngành',
  issuer: 'Cơ Quan Phát Hành',
}

const defaultFormValues = {
  code: '',
  name: '',
  nameEn: '',
  shortName: '',
  description: '',
  orderIndex: 0,
  active: true,
  parentCode: '',
}

const formFields = [
  { name: 'code', label: 'Mã danh mục', required: true, placeholder: 'VÍ_DỤ: GD001' },
  { name: 'name', label: 'Tên danh mục', required: true, placeholder: 'Nhập tên danh mục' },
  { name: 'nameEn', label: 'Tên tiếng Anh', placeholder: 'English name...' },
  { name: 'shortName', label: 'Tên viết tắt', placeholder: 'VD: GD' },
  { name: 'orderIndex', label: 'Thứ tự', type: 'number' },
  { name: 'description', label: 'Mô tả', placeholder: 'Mô tả danh mục...' },
  { name: 'active', label: 'Kích hoạt', type: 'switch' },
]

export function CategoriesPage() {
  const params = useParams<{ type?: string }>()
  const navigate = useNavigate()
  const urlType = params.type || ''

  // If URL has a route segment, derive group from URL; otherwise use local state
  const isRouteView = !!urlType
  const [localType, setLocalType] = useState('ChucDanh')
  const groupType = isRouteView ? (URL_TO_GROUP[urlType] || 'ChucDanh') : localType

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const { data: rawData, isLoading } = useCategories(groupType)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()

  const dataList = rawData || []

  const handleSubmit = (values: any) => {
    const payload = {
      ...values,
      groupCode: groupType,
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
    { title: 'Mã', dataIndex: 'code', filterType: 'text' as const },
    { title: 'Tên danh mục', dataIndex: 'name', filterType: 'text' as const },
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

  const routeTitle = isRouteView ? (ROUTE_LABEL[urlType] || urlType) : GROUP_CODE_LABEL[groupType]
  const pageTitle = isRouteView ? `Quản lý ${routeTitle}` : 'Quản lý danh mục'

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isRouteView && (
            <button
              onClick={() => navigate('/admin/category-management')}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{pageTitle}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isRouteView ? `Danh mục ${routeTitle}` : 'Quản lý tất cả danh mục hệ thống'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isRouteView && (
            <select
              value={groupType}
              onChange={(e) => setLocalType(e.target.value)}
              className="h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              {GROUP_CODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          <Button
            onClick={() => { setSelectedItem(null); setModalOpen(true) }}
            className="gap-2 bg-primary-700 hover:bg-primary-800 text-white"
          >
            <Plus size={17} /> Thêm danh mục
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <AppTable
          data={dataList}
          columns={columns}
          isLoading={isLoading}
          showSearch
          searchPlaceholder="Tìm theo mã, tên..."
        />
      </div>

      {/* Modal */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        description={`${routeTitle} - ${selectedItem ? 'Chỉnh sửa thông tin' : 'Điền thông tin để thêm mới'}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <AppForm
            formId="category-form"
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
            <Button type="submit" form="category-form" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
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
        title="Xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${confirmDelete?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        confirmText="Xóa"
        cancelText="Hủy"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}
