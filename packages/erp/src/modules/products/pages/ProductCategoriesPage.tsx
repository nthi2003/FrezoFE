import { useMemo, useState } from 'react'
import { Plus, Search, Tags } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  PageGuideButton,
  StatusBadge,
  RowActions,
} from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/modules/qtht/hooks/useCategory'
import { categoryFormSchema } from '@/modules/qtht/constants/category.schema'
import { PRODUCT_CATEGORIES_GUIDE } from '../constants/product-categories.guide'

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
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: rawData, isLoading, isError, isFetching, refetch } = useCategories(GROUP_CODE)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()
  const canCreate = usePermission('PRODUCT.CREATE')
  const canUpdate = usePermission('PRODUCT.UPDATE')
  const canDelete = usePermission('PRODUCT.DELETE')

  const dataList = useMemo(
    () => (Array.isArray(rawData) ? rawData : []) as any[],
    [rawData],
  )

  const filtered = useMemo(() => {
    let list = dataList
    if (activeFilter === 'active') list = list.filter((r) => r.active !== false)
    if (activeFilter === 'inactive') list = list.filter((r) => r.active === false)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          (r.code || '').toLowerCase().includes(q) ||
          (r.name || '').toLowerCase().includes(q) ||
          (r.shortName || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, search, activeFilter])

  const hasFilter = !!search.trim() || activeFilter !== 'all'
  const isFilteredEmpty = !isLoading && !isError && dataList.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && dataList.length === 0

  const clearFilters = () => {
    setSearch('')
    setActiveFilter('all')
  }

  const openCreate = () => {
    setSelectedItem(null)
    setModalOpen(true)
  }

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

  const columns: AppTableColumn<any>[] = [
    { key: 'code', title: 'Mã loại', dataIndex: 'code' },
    { key: 'name', title: 'Tên loại sản phẩm', dataIndex: 'name' },
    { key: 'shortName', title: 'Tên viết tắt', dataIndex: 'shortName' },
    {
      key: 'active',
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 120,
      render: (val: boolean) => (
        <StatusBadge
          label={val !== false ? 'Kích hoạt' : 'Tắt'}
          color={val !== false ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      width: 100,
      align: 'right',
      render: (_: any, row: any) => (
        <RowActions
          align="end"
          actions={[
            {
              kind: 'edit',
              hidden: !canUpdate,
              onClick: () => {
                setSelectedItem(row)
                setModalOpen(true)
              },
            },
            { kind: 'delete', hidden: !canDelete, onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý loại sản phẩm"
        description="Danh mục loại sản phẩm dùng chung cho kho và bán hàng."
        actions={(
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={PRODUCT_CATEGORIES_GUIDE} />
            {canCreate && (
              <Button onClick={openCreate} className="gap-1.5">
                <Plus size={16} /> Thêm loại sản phẩm
              </Button>
            )}
          </div>
        )}
      />

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={clearFilters}
        countLabel={`${filtered.length} loại${hasFilter ? ' (đã lọc)' : ''}`}
        selects={[
          {
            id: 'active',
            label: 'Trạng thái',
            value: activeFilter,
            onChange: (v) => setActiveFilter(v as 'all' | 'active' | 'inactive'),
            options: [
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang kích hoạt' },
              { value: 'inactive', label: 'Đã tắt' },
            ],
          },
        ]}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-white"
            placeholder="Tìm mã, tên loại…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm loại sản phẩm"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được loại sản phẩm"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Tags}
            title={isFilteredEmpty ? 'Không có loại khớp bộ lọc' : 'Chưa có loại sản phẩm'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Thêm loại đầu tiên để gắn vào sản phẩm.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreate
                  ? { label: 'Thêm loại sản phẩm', onClick: openCreate }
                  : undefined
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
        title={selectedItem ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm mới'}
        description={
          selectedItem
            ? 'Chỉnh sửa thông tin loại sản phẩm.'
            : 'Điền thông tin để thêm loại sản phẩm mới.'
        }
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <AppForm
            formId="product-category-form"
            schema={categoryFormSchema}
            defaultValues={
              selectedItem
                ? { ...defaultFormValues, ...selectedItem, active: selectedItem.active !== false }
                : defaultFormValues
            }
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
            <Button
              type="submit"
              form="product-category-form"
              disabled={createReq.isPending || updateReq.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {(createReq.isPending || updateReq.isPending)
                ? 'Đang xử lý...'
                : selectedItem
                  ? 'Cập nhật'
                  : 'Thêm mới'}
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
