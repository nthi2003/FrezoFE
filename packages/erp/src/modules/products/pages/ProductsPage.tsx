import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Package, Layers, Upload, Loader2,
  LayoutGrid, List, Search, AlertTriangle, TrendingUp, Sparkles, LineChart, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  AppModal,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  Button,
  ConfirmDialog,
  StatCard,
  StatusBadge,
  AppTooltip,
  IconActionButton,
} from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { AppForm } from '@/components/shared/AppForm'
import { categoryApi } from '@/modules/qtht/services/categoryApi'
import { productApi } from '../services/productApi'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProduct'
import { productFormSchema, type ProductFormValues, SEASON_OPTIONS, ORIGIN_SUGGESTIONS } from '../constants/schema'
import { ProductGridCard } from '../components/ProductGridCard'
import { ProductPriceHistoryModal } from '../components/ProductPriceHistoryModal'
import { PRODUCTS_GUIDE } from '../constants/products.guide'
import { usePermission } from '@/lib/hooks/usePermission'

// ============================================================
// Page
// ============================================================

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<any[] | null>(null)
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<any | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters — mặc định list (enterprise scanning); grid giữ làm tuỳ chọn
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const { data: rawData, isLoading, isError, refetch, isFetching } = useProducts()
  const createReq = useCreateProduct()
  const updateReq = useUpdateProduct()
  const deleteReq = useDeleteProduct()
  const canCreate = usePermission('PRODUCT.CREATE')
  const canUpdate = usePermission('PRODUCT.UPDATE')
  const canDelete = usePermission('PRODUCT.DELETE')

  const { data: categoryList } = useQuery({
    queryKey: ['categories-combobox'],
    queryFn: () => categoryApi.getAll({ groupCode: 'LoaiSanPham' }),
    select: (res: any) => res?.data?.items ?? [],
  })

  const categoryOptions = useMemo(
    () =>
      Array.isArray(categoryList)
        ? categoryList.map((c: any) => ({ value: c.id || c.value, label: c.name || c.label }))
        : [],
    [categoryList],
  )

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of categoryOptions) m[c.value] = c.label
    return m
  }, [categoryOptions])

  const dataList = Array.isArray(rawData) ? rawData : []

  // ---- Filter client-side (backend chưa hỗ trợ multi filter) ----
  const filteredList = useMemo(() => {
    let list = dataList
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (p: any) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q) ||
          (p.origin || '').toLowerCase().includes(q),
      )
    }
    if (categoryFilter) {
      list = list.filter((p: any) => (p.categoryId || p.category) === categoryFilter)
    }
    if (statusFilter === 'active') list = list.filter((p: any) => p.isActive !== false)
    if (statusFilter === 'inactive') list = list.filter((p: any) => p.isActive === false)
    if (onlyNew) list = list.filter((p: any) => p.isNew)
    return list
  }, [dataList, searchText, categoryFilter, statusFilter, onlyNew])

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = dataList.length
    const active = dataList.filter((p: any) => p.isActive !== false).length
    const newCount = dataList.filter((p: any) => p.isNew).length
    const withWarning = dataList.filter(
      (p: any) => p.warningThreshold != null && p.warningThreshold > 0,
    ).length
    const totalValue = dataList.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0)
    return { total, active, newCount, withWarning, totalValue }
  }, [dataList])

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  )

  // ---- Handlers ----
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

  const nextProductCode = (products: any[]) => {
    let max = 0
    for (const p of products) {
      const m = String(p.code || '').match(/^SP(\d+)$/i)
      if (m) max = Math.max(max, Number(m[1]))
    }
    return `SP${String(max + 1).padStart(3, '0')}`
  }

  const handleSubmit = (values: ProductFormValues) => {
    const code =
      (values.code || '').trim() ||
      selectedItem?.code ||
      (!selectedItem ? nextProductCode(dataList) : '')
    const payload = { ...values, code, imageUrl }
    if (selectedItem?.id) {
      updateReq.mutate(
        { id: selectedItem.id, data: payload },
        { onSuccess: () => setModalOpen(false) },
      )
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

  const openModal = (item: any | null) => {
    setSelectedItem(item)
    setImageUrl(item?.imageUrl || '')
    setModalOpen(true)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const clearSelection = () => setSelected({})

  const runBulkDelete = async () => {
    const rows = confirmBulkDelete || []
    const ids = rows.map((r) => r.id).filter(Boolean)
    if (!ids.length) return
    await Promise.all(ids.map((id) => deleteReq.mutateAsync(id)))
    clearSelection()
    setConfirmBulkDelete(null)
    toast.success(`Đã xoá ${ids.length} sản phẩm`)
  }

  const clearFilters = () => {
    setSearchText('')
    setCategoryFilter('')
    setStatusFilter('')
    setOnlyNew(false)
  }

  const hasActiveFilter = !!(searchText || categoryFilter || statusFilter || onlyNew)

  // ---- Form config — align với BE Product entity + ProductCreateRequest ----
  const formFields = [
    // ---- SECTION 1: Cơ bản ----
    {
      name: 'name', label: 'Tên sản phẩm', required: true,
      placeholder: 'VD: Cà chua bi Đà Lạt loại 1',
      colSpan: 2,
    },
    // Mã SP: create ẩn + tự sinh; edit hiện read-only
    ...(selectedItem
      ? [{
          name: 'code', label: 'Mã SP', readOnly: true,
          description: 'Mã hệ thống — không chỉnh sửa.',
        }]
      : []),
    {
      name: 'category', label: 'Danh mục', type: 'select', options: categoryOptions, required: true,
      placeholder: categoryOptions.length === 0
        ? 'Chưa có danh mục — hãy thêm ở Quản trị → Danh mục'
        : '-- Chọn danh mục --',
    },

    // ---- SECTION 2: Nông sản (nguồn gốc & mùa vụ) ----
    {
      name: 'origin', label: 'Nguồn gốc',
      placeholder: `VD: ${ORIGIN_SUGGESTIONS.slice(0, 3).join(', ')}...`,
      description: 'Vùng canh tác — quan trọng cho hồ sơ truy xuất nguồn gốc & VietGAP.',
    },
    {
      name: 'season', label: 'Mùa vụ', type: 'select', options: SEASON_OPTIONS,
      placeholder: '-- Chọn mùa vụ (không bắt buộc) --',
    },

    // ---- SECTION 3: Giá & Marketing ----
    {
      name: 'price', label: 'Giá bán (VNĐ)', type: 'currency', placeholder: '0', required: true,
      description: 'Giá niêm yết cho khách hàng cuối. Chưa VAT.',
    },

    // ---- SECTION 4: Cảnh báo tồn & hạn dùng ----
    {
      name: 'warningThreshold', label: 'Ngưỡng cảnh báo hết hàng', type: 'number',
      placeholder: 'VD: 20 (kg / cái)',
      description: 'Khi tồn dưới ngưỡng này, hệ thống sẽ báo động để đặt hàng bổ sung.',
    },
    {
      name: 'expiryAlertDays', label: 'Ngày cảnh báo sắp hỏng', type: 'number',
      placeholder: 'VD: 3',
      description: 'Số ngày trước hạn dùng để bật cảnh báo cho HR / thu mua.',
    },

    // ---- SECTION 5: Switch & Mô tả ----
    { name: 'isNew', label: 'Sản phẩm mới (hiện nhãn "Sản phẩm mới")', type: 'switch' },
    { name: 'isActive', label: 'Đang bán (hiển thị công khai)', type: 'switch' },
    {
      name: 'description', label: 'Mô tả chi tiết', type: 'textarea', rows: 4,
      placeholder: 'Đặc điểm, cách bảo quản, gợi ý dùng...',
      colSpan: 3,
    },
  ]

  const defaultFormValues: ProductFormValues = {
    name: '',
    code: '',
    category: '',
    imageUrl: '',
    price: 0,
    origin: '',
    season: '',
    warningThreshold: undefined as any,
    expiryAlertDays: undefined as any,
    isNew: false,
    isActive: true,
    description: '',
  }

  // ---- Table columns (list view) ----
  const listColumns: AppTableColumn<any>[] = [
    {
      key: 'name',
      title: 'Sản phẩm',
      render: (_, row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="w-9 h-9 rounded-md object-cover border border-neutral-200 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-300 shrink-0">
              <Package size={14} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm text-neutral-900 truncate" title={row.name}>
              {row.name || '—'}
            </div>
            <div className="font-mono text-[11px] text-neutral-500">{row.code || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      render: (_, row) => (
        <span className="text-sm text-neutral-700">
          {categoryMap[row.categoryId || row.category] || '—'}
        </span>
      ),
    },
    {
      key: 'price',
      title: 'Giá bán',
      align: 'right',
      width: 120,
      render: (_, row) => (
        <span className="tabular-nums text-sm font-medium text-neutral-900">
          {formatCurrency(Number(row.price ?? 0))}
        </span>
      ),
    },
    {
      key: 'viewCount',
      title: 'Lượt xem',
      align: 'right',
      width: 100,
      render: (_, row) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-sm text-neutral-700" title="Lượt mở chi tiết SP">
          <Eye size={12} className="text-neutral-400" />
          {Number(row.viewCount ?? 0).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      width: 120,
      render: (_, row) => (
        <StatusBadge
          label={row.isActive !== false ? 'Đang KD' : 'Ngừng KD'}
          color={row.isActive !== false ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'isNew',
      title: 'Nhãn',
      width: 110,
      render: (_, row) =>
        row.isNew ? (
          <StatusBadge label="Sản phẩm mới" color="info" icon={Sparkles} />
        ) : (
          <span className="text-sm text-neutral-400">—</span>
        ),
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 148,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <AppTooltip content="Biến động giá">
            <Button
              size="sm"
              variant="ghost"
              className="text-neutral-600"
              onClick={() => setPriceHistoryProduct(row)}
              aria-label="Biến động giá"
            >
              <LineChart size={12} />
            </Button>
          </AppTooltip>
          {canUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => openModal(row)}
            >
              <Pencil size={12} /> Sửa
            </Button>
          )}
          {canDelete && (
            <IconActionButton tooltip="Xoá" tone="rose" size="sm" onClick={() => setConfirmDelete(row)}>
              <Trash2 size={12} />
            </IconActionButton>
          )}
        </div>
      ),
    },
  ]

  const bulkActions: BulkAction<any>[] = canDelete
    ? [
        {
          key: 'delete',
          label: 'Xoá đã chọn',
          icon: Trash2,
          variant: 'destructive',
          onClick: (rows) => setConfirmBulkDelete(rows),
        },
      ]
    : []

  const kpiStats = [
    { label: 'Tổng SP', value: stats.total, icon: Package },
    { label: 'Đang KD', value: stats.active, icon: TrendingUp },
    { label: 'Sản phẩm mới', value: stats.newCount, icon: Sparkles },
    { label: 'Có cảnh báo', value: stats.withWarning, icon: AlertTriangle },
    { label: 'Danh mục', value: categoryOptions.length, icon: Layers },
  ]

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Sản phẩm"
        description="Catalog sản phẩm — giá, danh mục, tồn và cảnh báo hạn dùng."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={PRODUCTS_GUIDE} />
            {canCreate && (
              <Button onClick={() => openModal(null)} className="gap-1.5">
                <Plus size={16} strokeWidth={2.5} />
                Thêm sản phẩm
              </Button>
            )}
          </div>
        }
      />

      {!isLoading && !isError && dataList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpiStats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} className="!p-4" />
          ))}
        </div>
      )}

      <FilterBar
        selects={[
          {
            id: 'category',
            label: 'Danh mục',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { value: '', label: 'Tất cả danh mục' },
              ...categoryOptions.map((c) => ({ value: c.value, label: c.label })),
            ],
            minWidth: '160px',
          },
          {
            id: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: (v) => setStatusFilter((v as '' | 'active' | 'inactive') || ''),
            options: [
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang kinh doanh' },
              { value: 'inactive', label: 'Ngừng kinh doanh' },
            ],
          },
        ]}
        hasActiveFilters={hasActiveFilter}
        onClear={clearFilters}
        countLabel={`${filteredList.length} sản phẩm${hasActiveFilter ? ' (đã lọc)' : ''}`}
        extra={
          <>
            <input
              className="h-9 border rounded-md px-3 text-sm bg-white min-w-[180px]"
              placeholder="Tìm tên, mã, nguồn gốc…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
            <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-white text-sm text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setOnlyNew(e.target.checked)}
                className="rounded border-neutral-300"
              />
              Chỉ sản phẩm mới
            </label>
            <div className="inline-flex items-center rounded-md border bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'list'
                    ? 'bg-neutral-100 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                aria-label="Xem bảng"
              >
                <List size={13} /> Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-neutral-100 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                aria-label="Xem lưới"
              >
                <LayoutGrid size={13} /> Lưới
              </button>
            </div>
          </>
        }
      />

      {viewMode === 'grid' && selectedIds.length > 0 && canDelete && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
          <span className="tabular-nums font-medium">Đã chọn {selectedIds.length}</span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Bỏ chọn
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-danger-dark"
            onClick={() =>
              setConfirmBulkDelete(filteredList.filter((p: any) => selected[p.id]))
            }
          >
            <Trash2 size={13} /> Xoá đã chọn
          </Button>
        </div>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được catalog"
            message="Lỗi mạng hoặc máy chủ. Thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={hasActiveFilter ? Search : Package}
            title={hasActiveFilter ? 'Không có sản phẩm phù hợp bộ lọc' : 'Chưa có sản phẩm nào'}
            description={
              hasActiveFilter
                ? 'Thử đổi từ khoá, danh mục hoặc xoá lọc.'
                : 'Thêm sản phẩm đầu tiên vào catalog (ảnh, giá, danh mục).'
            }
            action={
              hasActiveFilter
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreate
                  ? { label: 'Thêm sản phẩm', onClick: () => openModal(null) }
                  : undefined
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        isLoading ? (
          <div className="border rounded-xl bg-white p-16 flex justify-center text-neutral-400 text-sm">
            <Loader2 size={20} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredList.map((p: any) => (
              <ProductGridCard
                key={p.id}
                product={p}
                categoryLabel={categoryMap[p.categoryId || p.category]}
                isSelected={!!selected[p.id]}
                onSelectToggle={() => toggleSelect(p.id)}
                onEdit={canUpdate ? () => openModal(p) : undefined}
                onDelete={canDelete ? () => setConfirmDelete(p) : undefined}
                onPriceHistory={() => setPriceHistoryProduct(p)}
                onClick={canUpdate ? () => openModal(p) : undefined}
              />
            ))}
          </div>
        )
      ) : (
        <AppTable
          columns={listColumns}
          data={filteredList}
          isLoading={isLoading}
          loadingRows={6}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
          selectable={canDelete}
          getRowId={(row) => row.id}
          bulkActions={bulkActions}
        />
      )}

      {/* Modal — Redesign: left = brand/media panel, right = form scroll với section headers */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        description={
          selectedItem
            ? `Đang chỉnh sửa: ${selectedItem.name || 'sản phẩm'}`
            : 'Điền thông tin để thêm sản phẩm vào catalog. Trường có * là bắt buộc.'
        }
        maxWidth="5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* ---- LEFT PANEL: Media + Preview + Live status ---- */}
          <aside className="space-y-4">
            {/* Image uploader */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">Ảnh sản phẩm</span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[11px] text-danger-dark hover:underline font-medium"
                  >
                    Xoá ảnh
                  </button>
                )}
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                  imageUrl
                    ? 'border-transparent bg-neutral-100'
                    : 'border-neutral-200 hover:border-primary-400 bg-neutral-50'
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
                    <span className="text-xs text-primary-600 font-medium">Đang tải...</span>
                  </div>
                ) : imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-md">
                        <Upload size={14} /> Đổi ảnh
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-1">
                      <Upload size={20} className="text-primary-500" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-700">Tải ảnh lên</span>
                    <span className="text-[11px] text-neutral-400 leading-tight">
                      PNG, JPG, WEBP · tối đa 5MB<br />Khuyến nghị 1:1, ≥ 800×800
                    </span>
                  </div>
                )}
              </div>
            </div>

          </aside>

          {/* ---- RIGHT PANEL: Form ---- */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1">
              <AppForm
                formId="product-form"
                schema={productFormSchema}
                defaultValues={selectedItem ? { ...defaultFormValues, ...selectedItem } : defaultFormValues}
                onSubmit={handleSubmit}
                onCancel={() => setModalOpen(false)}
                fields={formFields}
                isLoading={createReq.isPending || updateReq.isPending}
                submitText={selectedItem ? 'Cập nhật' : 'Thêm mới'}
                hideFooter
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-neutral-100">
              <div className="text-xs text-neutral-500">
                {selectedItem ? (
                  <>ID: <code className="font-mono text-neutral-700">{selectedItem.id}</code></>
                ) : (
                  <>Sản phẩm sẽ được thêm vào catalog & hiện lên storefront ngay.</>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="min-w-[100px]"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  form="product-form"
                  disabled={createReq.isPending || updateReq.isPending}
                  className="min-w-[140px] gap-1.5"
                >
                  {createReq.isPending || updateReq.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : selectedItem ? (
                    <>
                      <Pencil size={14} /> Cập nhật
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Thêm sản phẩm
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xoá sản phẩm"
        message={`Bạn có chắc muốn xoá sản phẩm "${confirmDelete?.name}"? Hành động này không thể hoàn tác.`}
        variant="danger"
        confirmText="Xoá"
        cancelText="Huỷ"
        isLoading={deleteReq.isPending}
      />

      <ConfirmDialog
        isOpen={!!confirmBulkDelete?.length}
        onClose={() => setConfirmBulkDelete(null)}
        onConfirm={() => void runBulkDelete()}
        title={`Xoá ${confirmBulkDelete?.length || 0} sản phẩm đã chọn?`}
        message="Không thể hoàn tác. Các sản phẩm đã chọn sẽ bị xoá."
        variant="danger"
        confirmText="Xoá hết"
        cancelText="Huỷ"
        isLoading={deleteReq.isPending}
      />

      <ProductPriceHistoryModal
        product={priceHistoryProduct}
        open={!!priceHistoryProduct}
        onClose={() => setPriceHistoryProduct(null)}
      />
    </div>
  )
}
