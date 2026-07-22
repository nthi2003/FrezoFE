import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Pencil, Trash2, Package, Layers, Upload, Loader2,
  LayoutGrid, List, Search, X, AlertTriangle, TrendingUp, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal, PageHeader, PageGuideButton, EmptyState } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import { Button, ConfirmDialog, Select } from '@frezo/ui'
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
import { PRODUCTS_GUIDE } from '../constants/products.guide'
import { usePermission } from '@/lib/hooks/usePermission'

// ============================================================
// Page
// ============================================================

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const { data: rawData, isLoading } = useProducts()
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

  const handleSubmit = (values: ProductFormValues) => {
    const payload = { ...values, imageUrl }
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

  const bulkDelete = () => {
    if (!selectedIds.length) return
    if (!confirm(`Xoá ${selectedIds.length} sản phẩm đã chọn? Không thể hoàn tác.`)) return
    Promise.all(selectedIds.map((id) => deleteReq.mutateAsync(id))).then(() => {
      clearSelection()
      toast.success(`Đã xoá ${selectedIds.length} sản phẩm`)
    })
  }

  const clearFilters = () => {
    setSearchText('')
    setCategoryFilter('')
    setStatusFilter('')
    setOnlyNew(false)
  }

  const hasActiveFilter = searchText || categoryFilter || statusFilter || onlyNew

  // ---- Form config — align với BE Product entity + ProductCreateRequest ----
  const formFields = [
    // ---- SECTION 1: Cơ bản ----
    {
      name: 'name', label: 'Tên sản phẩm', required: true,
      placeholder: 'VD: Cà chua bi Đà Lạt loại 1',
      colSpan: 2,
    },
    {
      name: 'code', label: 'Mã SP',
      placeholder: 'VD: SP001 (tự sinh nếu để trống)',
      description: 'Mã unique dùng cho tra cứu nhanh, in tem, quét mã.',
    },
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
      name: 'price', label: 'Giá bán (VNĐ)', type: 'number', placeholder: '0', required: true,
      description: 'Giá niêm yết cho khách hàng cuối. Chưa VAT.',
    },
    {
      name: 'rating', label: 'Rating (0-5)', type: 'number', placeholder: 'VD: 4.5',
      description: 'Điểm đánh giá trung bình — có thể để trống, cập nhật sau.',
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
    rating: undefined as any,
    isNew: false,
    isActive: true,
    description: '',
  }

  // ---- Table columns (list view) ----
  const listColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      filterType: 'text' as const,
      render: (_: string, row: any) => (
        <div className="flex items-center gap-2.5 min-w-0">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-300 shrink-0">
              <Package size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-medium text-neutral-800 truncate">{row.name}</div>
            <div className="text-[10px] text-neutral-400 font-medium">{row.code || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryId',
      render: (_: string, row: any) => (
        <span className="text-neutral-600">
          {categoryMap[row.categoryId || row.category] || '—'}
        </span>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      render: (val: number) => (
        <span className="font-mono text-sm font-semibold text-neutral-800">
          {Number(val ?? 0).toLocaleString('vi-VN')}₫
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (val: boolean) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            val !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {val !== false ? 'Đang KD' : 'Ngừng KD'}
        </span>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      render: (val: number) => (
        <span className="text-xs text-neutral-600">{val ? `${val} ⭐` : '—'}</span>
      ),
    },
    {
      title: 'Nhãn',
      dataIndex: 'isNew',
      render: (val: boolean) =>
        val ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 text-[11px] font-semibold rounded-full">
            <Sparkles size={10} /> Sản phẩm mới
          </span>
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      width: 100,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          {canUpdate && (
            <button
              title="Sửa"
              onClick={() => openModal(row)}
              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              title="Xóa"
              onClick={() => setConfirmDelete(row)}
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Sản phẩm"
        description="Catalog toàn bộ sản phẩm — quản lý giá, danh mục, tồn kho và cảnh báo hạn dùng."
        actions={
          <>
            <PageGuideButton guide={PRODUCTS_GUIDE} />
            {canCreate && (
              <Button
                onClick={() => openModal(null)}
                className="gap-2 bg-primary-700 hover:bg-primary-800 text-white shadow-sm"
              >
                <Plus size={17} /> Thêm sản phẩm
              </Button>
            )}
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={Package} label="Tổng SP" value={stats.total} tone="blue" />
        <KpiCard icon={TrendingUp} label="Đang KD" value={stats.active} tone="green" />
        <KpiCard icon={Sparkles} label="Sản phẩm mới" value={stats.newCount} tone="pink" />
        <KpiCard
          icon={AlertTriangle}
          label="Có cảnh báo"
          value={stats.withWarning}
          tone="orange"
        />
        <KpiCard icon={Layers} label="Danh mục" value={categoryOptions.length} tone="neutral" />
      </div>

      {/* Filter bar */}
      <div className="p-3 bg-white border border-neutral-200 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã, nguồn gốc..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 w-full pl-9 pr-3 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all placeholder:text-neutral-400"
            />
          </div>
          <div className="w-52">
            <Select
              options={[{ value: '', label: 'Tất cả danh mục' }, ...categoryOptions]}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v || '')}
              placeholder="Tất cả danh mục"
              showSearch
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang kinh doanh' },
                { value: 'inactive', label: 'Ngừng kinh doanh' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter((v as any) || '')}
              placeholder="Trạng thái"
            />
          </div>
          <label className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 cursor-pointer text-sm text-neutral-700 font-medium select-none">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
              className="w-4 h-4 accent-pink-500"
            />
            <Sparkles size={13} className="text-pink-500" />
            Chỉ sản phẩm mới
          </label>

          <div className="flex items-center bg-neutral-100 rounded-lg p-1 border border-neutral-200/50 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-primary-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-primary-600 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>
        </div>

        {hasActiveFilter && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">
              Hiển thị <b className="text-neutral-800">{filteredList.length}</b> / {stats.total} sản
              phẩm
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X size={12} /> Xoá lọc
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions bar (sticky when selection > 0) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 bg-primary-600 text-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm font-semibold">
            Đã chọn {selectedIds.length} sản phẩm
          </span>
          <button
            onClick={clearSelection}
            className="text-xs text-white/80 hover:text-white underline underline-offset-2"
          >
            Bỏ chọn
          </button>
          <div className="ml-auto flex items-center gap-2">
            {canDelete && (
              <button
                onClick={bulkDelete}
                disabled={deleteReq.isPending}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/15 hover:bg-white/25 text-sm font-medium transition"
              >
                <Trash2 size={13} /> Xoá đã chọn
              </button>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-neutral-200">
          {hasActiveFilter ? (
            <EmptyState
              icon={Search}
              title="Không tìm thấy sản phẩm nào"
              description="Bộ lọc hiện tại không khớp với sản phẩm nào. Thử điều chỉnh từ khoá hoặc bỏ bớt lọc."
              action={{ label: 'Xoá tất cả bộ lọc', onClick: clearFilters }}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="Chưa có sản phẩm nào"
              description="Bắt đầu bằng cách thêm sản phẩm đầu tiên vào catalog. Bạn có thể thêm ảnh, giá, danh mục và tồn kho."
              action={
                canCreate ? (
                  <div className="flex items-center gap-2">
                    <Button variant="default" onClick={() => openModal(null)} className="gap-1.5">
                      <Plus size={14} /> Thêm sản phẩm đầu tiên
                    </Button>
                  </div>
                ) : undefined
              }
            />
          )}
        </div>
      ) : viewMode === 'grid' ? (
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
              onClick={canUpdate ? () => openModal(p) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <AppTable
            data={filteredList}
            columns={listColumns as any}
            isLoading={isLoading}
            showSearch={false}
          />
        </div>
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
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Xoá ảnh
                  </button>
                )}
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                  imageUrl
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
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white text-xs font-medium flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full">
                        <Upload size={14} /> Đổi ảnh
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
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

            {/* Field-guide card — giúp user biết luật nhập */}
            <div className="rounded-xl bg-primary-50/50 border border-primary-100 p-3 text-[12px] leading-relaxed text-neutral-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-primary-700 font-semibold text-[11px] uppercase tracking-wide">
                <Sparkles size={13} /> Gợi ý nhập nhanh
              </div>
              <div>• <b>Mã SP</b>: bỏ trống → tự sinh.</div>
              <div>• <b>Nguồn gốc</b>: tên tỉnh / vùng canh tác.</div>
              <div>• <b>Ngưỡng cảnh báo</b>: đơn vị theo kho (kg / cái / thùng).</div>
              <div>• Ảnh: giữ tỷ lệ vuông để hiển thị đẹp cả grid & list.</div>
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
                  className="rounded-xl min-w-[100px]"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  form="product-form"
                  disabled={createReq.isPending || updateReq.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl min-w-[140px] shadow-sm gap-1.5"
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

// ============================================================
// Sub-components
// ============================================================

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: number
  tone: 'blue' | 'green' | 'orange' | 'pink' | 'neutral'
}

function KpiCard({ icon: Icon, label, value, tone }: KpiCardProps) {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 [&_.ico]:bg-blue-100 [&_.ico]:text-blue-600',
    green: 'bg-emerald-50 text-emerald-700 [&_.ico]:bg-emerald-100 [&_.ico]:text-emerald-600',
    orange: 'bg-orange-50 text-orange-700 [&_.ico]:bg-orange-100 [&_.ico]:text-orange-600',
    pink: 'bg-pink-50 text-pink-700 [&_.ico]:bg-pink-100 [&_.ico]:text-pink-600',
    neutral: 'bg-white border border-neutral-200 text-neutral-700 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
  }[tone]
  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums text-neutral-900 leading-none mt-0.5">
          {value.toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  )
}
