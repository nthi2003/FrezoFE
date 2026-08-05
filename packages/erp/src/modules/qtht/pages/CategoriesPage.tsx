import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, ArrowLeft, Search, FolderTree } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal, Button, ConfirmDialog, EmptyState, ErrorState,
  PageHeader, PageGuideButton, Select, IconActionButton, AppTooltip, type PageGuideConfig,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
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

const CATEGORIES_GUIDE: PageGuideConfig = {
  title: 'Quản lý danh mục',
  subtitle: 'Danh mục dùng chung cho hợp đồng, nhân sự và các module khác.',
  sections: [
    {
      heading: 'Mẹo',
      type: 'tips',
      tips: [
        'Chọn nhóm danh mục trước khi thêm mới.',
        'Mã viết HOA, không dấu — không đổi sau khi đã dùng.',
        'Nhóm “Popup UX thành công”: Tên = tiêu đề popup, Mô tả = nội dung (hoặc JSON {"body","imageUrl"}). Tắt bằng công tắc Kích hoạt.',
      ],
    },
  ],
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
  { name: 'code', label: 'Mã danh mục', required: true, placeholder: 'VD: GD001' },
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

  const isRouteView = !!urlType
  const [localType, setLocalType] = useState('ChucDanh')
  const groupType = isRouteView ? (URL_TO_GROUP[urlType] || 'ChucDanh') : localType

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [search, setSearch] = useState('')

  const { data: rawData, isLoading, isError, isFetching, refetch } = useCategories(groupType)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return dataList
    return dataList.filter(
      (c) =>
        (c.code || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.shortName || '').toLowerCase().includes(q),
    )
  }, [dataList, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

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

  const columns: AppTableColumn<any>[] = [
    { key: 'code', title: 'Mã', dataIndex: 'code' },
    { key: 'name', title: 'Tên danh mục', dataIndex: 'name' },
    { key: 'shortName', title: 'Tên viết tắt', dataIndex: 'shortName' },
    {
      key: 'active',
      title: 'Trạng thái',
      dataIndex: 'active',
      render: (_, row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.active !== false ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
          {row.active !== false ? 'Kích hoạt' : 'Tắt'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      dataIndex: 'id',
      width: 100,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <IconActionButton tooltip="Sửa" tone="primary" onClick={() => { setSelectedItem(row); setModalOpen(true) }}>
            <Edit className="w-4 h-4" />
          </IconActionButton>
          <IconActionButton tooltip="Xóa" tone="red" onClick={() => setConfirmDelete(row)}>
            <Trash2 className="w-4 h-4" />
          </IconActionButton>
        </div>
      ),
    },
  ]

  const routeTitle = isRouteView ? (ROUTE_LABEL[urlType] || urlType) : GROUP_CODE_LABEL[groupType]
  const pageTitle = isRouteView ? `Quản lý ${routeTitle}` : 'Quản lý danh mục'

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={(
          <span className="inline-flex items-center gap-2">
            {isRouteView && (
              <IconActionButton
                tooltip="Quay lại"
                onClick={() => navigate('/admin/category-management')}
              >
                <ArrowLeft size={18} />
              </IconActionButton>
            )}
            {pageTitle}
          </span>
        )}
        description={isRouteView ? `Danh mục ${routeTitle}` : 'Quản lý tất cả danh mục hệ thống'}
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={CATEGORIES_GUIDE} />
            {!isRouteView && (
              <div className="min-w-[180px]">
                <Select
                  options={GROUP_CODE_OPTIONS}
                  value={groupType}
                  onChange={setLocalType}
                  placeholder="Nhóm danh mục"
                  aria-label="Nhóm danh mục"
                  showSearch={GROUP_CODE_OPTIONS.length > 8}
                />
              </div>
            )}
            <Button
              onClick={() => { setSelectedItem(null); setModalOpen(true) }}
              className="gap-2 bg-primary-700 hover:bg-primary-800 text-white"
            >
              <Plus size={17} /> Thêm danh mục
            </Button>
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => setSearch('')}
        countLabel={`${filtered.length} danh mục${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm theo mã, tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm danh mục"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh mục"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FolderTree}
            title={isFilteredEmpty ? 'Không có danh mục khớp bộ lọc' : 'Chưa có danh mục nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm danh mục đầu tiên cho nhóm này.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => setSearch('') }
                : { label: 'Thêm danh mục', onClick: () => { setSelectedItem(null); setModalOpen(true) } }
            }
          />
        </div>
      ) : (
        <AppTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

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
