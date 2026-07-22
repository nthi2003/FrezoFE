// ============================================================
// FREZO ERP — TagsPage
// Quản lý tag / nhãn cho ticket & task, theo chuẩn enterprise:
//   - Header + KPI strip + toolbar (search, filter, view mode)
//   - Grid view (mặc định) + Table view
//   - Modal có live preview chip + auto-suggest CODE + color palette
//   - ConfirmDialog thay confirm() native
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, Search, X, Tag as TagIcon, RefreshCw,
  LayoutGrid, List, Palette, Zap, ArrowUpDown, Building2, Wrench,
  Layers, MoreHorizontal, Copy,
} from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  AppModal, Button, PageHeader, EmptyState, ConfirmDialog,
  Label, Input, Select,
} from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTicketTag'
import { tagSchema } from '../constants/schema'

// ============================================================
// Constants — palette, category config
// ============================================================

/** Bảng màu preset — 20 màu tone hài hoà, chia đều 5 cột. */
const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#78716c',
] as const

/**
 * Config category: icon, label, tone.
 * Dùng chung cho tab filter + badge trong table + option trong select.
 */
const CATEGORY_CONFIG = {
  priority:   { label: 'Ưu tiên',      icon: Zap,        tone: 'rose' },
  status:     { label: 'Trạng thái',   icon: ArrowUpDown,tone: 'blue' },
  department: { label: 'Phòng ban',    icon: Building2,  tone: 'violet' },
  skill:      { label: 'Kỹ năng',      icon: Wrench,     tone: 'emerald' },
  other:      { label: 'Khác',         icon: Layers,     tone: 'amber' },
} as const

type CategoryKey = keyof typeof CATEGORY_CONFIG
const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as CategoryKey[]

const CATEGORY_OPTIONS = [
  { value: '',           label: '— Không phân loại —' },
  ...ALL_CATEGORIES.map((key) => ({ value: key, label: CATEGORY_CONFIG[key].label })),
]

// ============================================================
// Utilities
// ============================================================

/** Auto-suggest CODE từ tên: uppercase, bỏ dấu, cắt còn 12 ký tự, thay space → underscore. */
function suggestCodeFromName(name: string): string {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12)
}

/**
 * Đọc luminance để quyết định text đen hay trắng khi đặt lên nền màu.
 * Chuẩn WCAG — luminance > 0.55 → text đen, ngược lại text trắng.
 */
function isLightColor(hex?: string | null): boolean {
  if (!hex) return true
  const h = hex.replace('#', '')
  if (h.length !== 6) return true
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Perceptual luminance (Rec. 709 coefficients)
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma > 0.65
}

/** Chip preview tag — dùng cả trong table + card + modal live preview. */
function TagChip({ name, code, color, size = 'sm' }: {
  name?: string
  code?: string
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const bg = color || '#94a3b8'
  const textColor = isLightColor(bg) ? '#111827' : '#ffffff'
  const dotColor = isLightColor(bg) ? '#1f2937' : '#ffffff'
  const sizeClass = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size]

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClass}`}
      style={{ backgroundColor: bg, color: textColor }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full opacity-70"
        style={{ backgroundColor: dotColor }}
      />
      {name || code || 'Tag'}
    </span>
  )
}

/** Badge nhỏ hiển thị category với icon + tone màu. */
function CategoryBadge({ category }: { category?: string | null }) {
  if (!category || !(category in CATEGORY_CONFIG)) {
    return <span className="text-xs text-neutral-400 italic">— Không phân loại —</span>
  }
  const key = category as CategoryKey
  const cfg = CATEGORY_CONFIG[key]
  const Icon = cfg.icon
  const toneMap: Record<string, string> = {
    rose:    'bg-rose-50 text-rose-700 border-rose-100',
    blue:    'bg-blue-50 text-blue-700 border-blue-100',
    violet:  'bg-violet-50 text-violet-700 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber:   'bg-amber-50 text-amber-700 border-amber-100',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${toneMap[cfg.tone]}`}>
      <Icon size={14} />
      {cfg.label}
    </span>
  )
}

// ============================================================
// Main Page
// ============================================================

interface TagRow {
  id: string
  code?: string
  name?: string
  category?: string | null
  color?: string | null
  usageCount?: number
}

type ViewMode = 'grid' | 'table'
type CategoryFilter = 'all' | CategoryKey | 'none'

export function TagsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TagRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TagRow | null>(null)

  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { data: rawData, isLoading, isFetching, refetch } = useTags()
  const createReq = useCreateTag()
  const updateReq = useUpdateTag()
  const deleteReq = useDeleteTag()

  const dataList: TagRow[] = Array.isArray(rawData) ? rawData : []

  // ---- Stats cho KPI + tab count ----
  const stats = useMemo(() => {
    const total = dataList.length
    const byCategory: Record<string, number> = {}
    ALL_CATEGORIES.forEach((c) => (byCategory[c] = 0))
    let unclassified = 0
    dataList.forEach((t) => {
      if (t.category && t.category in CATEGORY_CONFIG) {
        byCategory[t.category] = (byCategory[t.category] || 0) + 1
      } else {
        unclassified++
      }
    })
    const distinctCategories = ALL_CATEGORIES.filter((c) => byCategory[c] > 0).length
    return { total, byCategory, unclassified, distinctCategories }
  }, [dataList])

  // ---- Filter list theo tab + search ----
  const filteredList = useMemo(() => {
    let list = dataList
    if (categoryFilter === 'none') {
      list = list.filter((t) => !t.category || !(t.category in CATEGORY_CONFIG))
    } else if (categoryFilter !== 'all') {
      list = list.filter((t) => t.category === categoryFilter)
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      list = list.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.code || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [dataList, categoryFilter, searchText])

  // ---- Handlers ----
  const handleOpenCreate = useCallback(() => {
    setSelectedItem(null)
    setModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((row: TagRow) => {
    setSelectedItem(row)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (!confirmDelete) return
    deleteReq.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    })
  }, [confirmDelete, deleteReq])

  const clearFilters = () => {
    setSearchText('')
    setCategoryFilter('all')
  }

  // ---- Table columns ----
  const columns = useMemo(() => [
    {
      title: 'Preview',
      dataIndex: 'name',
      width: 220,
      render: (_: unknown, row: TagRow) => (
        <TagChip name={row.name} code={row.code} color={row.color} size="md" />
      ),
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      render: (val: string) => (
        <code className="text-xs font-mono text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">{val || '—'}</code>
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      render: (val: string) => <span className="text-sm text-neutral-900">{val || '—'}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      render: (val: string) => <CategoryBadge category={val} />,
    },
    {
      title: 'Màu',
      dataIndex: 'color',
      width: 90,
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-md border border-neutral-200 shrink-0"
            style={{ backgroundColor: val || '#e5e7eb' }}
          />
          {val && <code className="text-[11px] font-mono text-neutral-500">{val}</code>}
        </div>
      ),
    },
    {
      title: '',
      dataIndex: 'id',
      width: 100,
      render: (_: unknown, row: TagRow) => (
        <div className="flex items-center justify-end gap-0.5">
          <IconAction title="Copy mã" tone="neutral" onClick={() => {
            navigator.clipboard.writeText(row.code || '')
            toast.success(`Đã copy "${row.code}"`)
          }}>
            <Copy size={14} />
          </IconAction>
          <IconAction title="Sửa" tone="blue" onClick={() => handleOpenEdit(row)}>
            <Pencil size={14} />
          </IconAction>
          <IconAction title="Xoá" tone="rose" onClick={() => setConfirmDelete(row)}>
            <Trash2 size={14} />
          </IconAction>
        </div>
      ),
    },
  ], [handleOpenEdit])

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quản lý thẻ (Tag)"
        description={`Phân loại ticket/task bằng nhãn màu · ${stats.total} tag${stats.unclassified > 0 ? ` · ${stats.unclassified} chưa phân loại` : ''}`}
        actions={
          <Button onClick={handleOpenCreate} className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5">
            <Plus size={14} /> Thêm tag
          </Button>
        }
      />

      {/* ── Toolbar ── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] md:max-w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã tag..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-8 w-full pl-8 pr-3 text-sm bg-neutral-50 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all placeholder:text-neutral-400"
            />
          </div>

          <div className="h-6 w-px bg-neutral-200 hidden md:block" />

          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-md border border-neutral-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 h-8 text-xs font-medium inline-flex items-center gap-1.5 transition ${
                viewMode === 'grid' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid size={14} /> Lưới
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 h-8 text-xs font-medium inline-flex items-center gap-1.5 transition border-l border-neutral-200 ${
                viewMode === 'table' ? 'bg-neutral-900 text-white border-l-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
              title="Xem dạng bảng"
            >
              <List size={14} /> Bảng
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 flex items-center justify-center disabled:opacity-50 transition-colors ml-auto"
            title="Làm mới"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Category chip tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-white">
          <CategoryChip
            active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')}
            label="Tất cả"
            count={stats.total}
            toneActive="bg-neutral-900 text-white border-neutral-900"
          />
          {ALL_CATEGORIES.map((key) => {
            const cfg = CATEGORY_CONFIG[key]
            const count = stats.byCategory[key] || 0
            return (
              <CategoryChip
                key={key}
                active={categoryFilter === key}
                onClick={() => setCategoryFilter(key)}
                label={cfg.label}
                icon={cfg.icon}
                count={count}
                tone={cfg.tone}
              />
            )
          })}
          <CategoryChip
            active={categoryFilter === 'none'}
            onClick={() => setCategoryFilter('none')}
            label="Chưa phân loại"
            count={stats.unclassified}
            toneActive="bg-neutral-600 text-white border-neutral-600"
          />

          {(searchText || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            >
              <X size={12} /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state hoặc content ── */}
      {!isLoading && stats.total === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-neutral-300 py-12">
          <EmptyState
            icon={TagIcon}
            title="Chưa có tag nào"
            description="Tạo tag đầu tiên để phân loại ticket/task theo mức ưu tiên, phòng ban, kỹ năng hoặc trạng thái."
            action={
              <Button onClick={handleOpenCreate} className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5">
                <Plus size={14} /> Tạo tag đầu tiên
              </Button>
            }
          />
        </div>
      ) : !isLoading && filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-10">
          <EmptyState
            icon={Search}
            title="Không có tag khớp bộ lọc"
            description="Thử bỏ bớt điều kiện tìm kiếm hoặc chọn danh mục khác."
            action={<Button variant="outline" onClick={clearFilters}>Xoá bộ lọc</Button>}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <TagGrid
          items={filteredList}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={(t) => setConfirmDelete(t)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <AppTable
            data={filteredList}
            columns={columns as any}
            isLoading={isLoading}
            showSearch={false}
          />
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      <TagFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItem}
        onSubmit={(payload) => {
          if (selectedItem?.id) {
            updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
          } else {
            createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
          }
        }}
        isSaving={createReq.isPending || updateReq.isPending}
      />

      {/* ── Delete confirm dialog (thay confirm() native) ── */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={`Xoá tag "${confirmDelete?.name || confirmDelete?.code || '—'}"?`}
        message={
          <span>
            Hành động này <strong>không thể hoàn tác</strong>. Các ticket/task đang gắn tag này sẽ mất liên kết.
            {(confirmDelete?.usageCount ?? 0) > 0 && (
              <> Đang có <strong>{confirmDelete!.usageCount} ticket</strong> sử dụng.</>
            )}
          </span>
        }
        confirmText="Xoá tag"
        variant="danger"
        isLoading={deleteReq.isPending}
      />
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

/** Icon button với tone màu — dùng ở table action column. */
function IconAction({
  children, title, tone, onClick,
}: {
  children: React.ReactNode
  title: string
  tone: 'neutral' | 'blue' | 'rose'
  onClick: () => void
}) {
  const toneMap = {
    neutral: 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100',
    blue:    'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    rose:    'text-rose-600 hover:text-rose-800 hover:bg-rose-50',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${toneMap}`}
    >
      {children}
    </button>
  )
}

/** Chip filter cho category tab bar — tone khác theo category. */
function CategoryChip({
  active, onClick, label, icon: Icon, count, tone, toneActive,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: typeof Palette
  count: number
  tone?: string
  toneActive?: string
}) {
  const toneActiveMap: Record<string, string> = {
    rose:    'bg-rose-600 text-white border-rose-600',
    blue:    'bg-blue-600 text-white border-blue-600',
    violet:  'bg-violet-600 text-white border-violet-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    amber:   'bg-amber-500 text-white border-amber-500',
  }
  const activeClass = toneActive || (tone ? toneActiveMap[tone] : 'bg-neutral-900 text-white border-neutral-900')
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition ${
        active ? activeClass : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-4 rounded-full text-[10px] font-bold ${
          active ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

// ============================================================
// TagGrid — card grid view
// ============================================================

function TagGrid({
  items, isLoading, onEdit, onDelete,
}: {
  items: TagRow[]
  isLoading: boolean
  onEdit: (t: TagRow) => void
  onDelete: (t: TagRow) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((t) => (
        <TagCard key={t.id} tag={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} />
      ))}
    </div>
  )
}

function TagCard({ tag, onEdit, onDelete }: {
  tag: TagRow
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Auto-close khi click ngoài
  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [menuOpen])

  return (
    <div className="group relative rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md transition-all overflow-hidden">
      {/* Color bar top */}
      <div className="h-1.5 w-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />

      <div className="p-3.5 space-y-2.5">
        {/* Header: preview chip + menu */}
        <div className="flex items-start justify-between gap-2">
          <TagChip name={tag.name} code={tag.code} color={tag.color} size="md" />
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              className="w-7 h-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden animate-fade-in"
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-2"
                >
                  <Pencil size={12} /> Sửa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigator.clipboard.writeText(tag.code || '')
                    toast.success(`Đã copy "${tag.code}"`)
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-2"
                >
                  <Copy size={12} /> Copy mã
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 inline-flex items-center gap-2 border-t border-neutral-100"
                >
                  <Trash2 size={12} /> Xoá
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta: code + category */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <code className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
              {tag.code || '—'}
            </code>
          </div>
          <CategoryBadge category={tag.category} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TagFormModal — create/edit với live preview + auto-suggest code
// ============================================================

interface TagFormValues {
  code: string
  name: string
  category: string
  color: string
}

function TagFormModal({
  isOpen, onClose, item, onSubmit, isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  item: TagRow | null
  onSubmit: (payload: {
    code: string
    name: string
    category: string | null
    color: string | null
  }) => void
  isSaving: boolean
}) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { code: '', name: '', category: '', color: '' },
  })

  const nameValue = watch('name')
  const codeValue = watch('code')
  const categoryValue = watch('category')
  const colorValue = watch('color')

  // Reset khi mở modal (không mount lại)
  useEffect(() => {
    if (isOpen) {
      reset({
        code: item?.code || '',
        name: item?.name || '',
        category: item?.category || '',
        color: item?.color || '',
      })
    }
  }, [isOpen, item, reset])

  // Track user has manually edited code → dừng auto-suggest
  const [codeTouched, setCodeTouched] = useState(false)
  useEffect(() => {
    if (isOpen) setCodeTouched(false)
  }, [isOpen])

  // Auto-suggest CODE khi user gõ NAME (chỉ khi tạo mới + chưa touched)
  useEffect(() => {
    if (item?.id || codeTouched) return
    const suggested = suggestCodeFromName(nameValue || '')
    if (suggested && suggested !== codeValue) {
      setValue('code', suggested, { shouldValidate: false })
    }
  }, [nameValue, item, codeTouched, codeValue, setValue])

  const submit = handleSubmit((values) => {
    onSubmit({
      code: values.code,
      name: values.name,
      category: values.category || null,
      color: values.color || null,
    })
  })

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Chỉnh sửa tag' : 'Tạo tag mới'}
      description={item
        ? `Cập nhật thông tin cho tag ${item.name || item.code}`
        : 'Đặt tên, chọn nhóm và màu để phân loại ticket/task rõ ràng hơn.'}
      maxWidth="xl"
    >
      <form onSubmit={submit} className="space-y-5">
        {/* Live preview */}
        <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5 flex flex-col items-center gap-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Xem trước</div>
          <TagChip
            name={nameValue || 'Tên tag'}
            code={codeValue || 'CODE'}
            color={colorValue}
            size="lg"
          />
          {categoryValue && <CategoryBadge category={categoryValue} />}
        </div>

        {/* Name + Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tên tag <span className="text-rose-500">*</span></Label>
            <Input
              {...register('name')}
              placeholder="VD: Ưu tiên cao, Hỗ trợ kỹ thuật..."
              autoFocus
            />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message as string}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Mã tag <span className="text-rose-500">*</span></Label>
            <div className="relative">
              <Input
                {...register('code', {
                  onChange: () => setCodeTouched(true),
                })}
                placeholder="VD: HIGH, TECH_SUPPORT"
                className="font-mono uppercase"
              />
              {!item && !codeTouched && nameValue && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 pointer-events-none">
                  auto
                </span>
              )}
            </div>
            {errors.code && <p className="text-xs text-rose-600">{errors.code.message as string}</p>}
            {!item && !codeTouched && (
              <p className="text-[11px] text-neutral-500">Tự sinh từ tên — bấm để chỉnh tay.</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Danh mục</Label>
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryValue || ''}
            onChange={(v) => setValue('category', v || '', { shouldValidate: true })}
            placeholder="Chọn danh mục để dễ lọc..."
            showClear
          />
          <p className="text-[11px] text-neutral-500">
            Nhóm giúp lọc ticket nhanh hơn (VD: mọi tag "Ưu tiên" gom về 1 chỗ).
          </p>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <Label>Màu sắc</Label>

          {/* Palette preset */}
          <div className="grid grid-cols-10 gap-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
            {COLOR_PALETTE.map((c) => {
              const isActive = colorValue?.toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className={`aspect-square rounded-md transition-all hover:scale-110 hover:z-10 relative ${
                    isActive ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                      style={{ color: isLightColor(c) ? '#111' : '#fff' }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Hex input + native color picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorValue || '#94a3b8'}
              onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
              className="w-10 h-10 rounded-md border border-neutral-200 cursor-pointer p-0.5 bg-white"
              title="Chọn màu tùy chỉnh"
            />
            <Input
              {...register('color')}
              placeholder="#94a3b8"
              className="flex-1 font-mono"
            />
            {colorValue && (
              <button
                type="button"
                onClick={() => setValue('color', '', { shouldValidate: true })}
                className="h-10 px-3 text-xs text-neutral-500 hover:text-neutral-800 rounded-md hover:bg-neutral-100 inline-flex items-center gap-1"
                title="Bỏ chọn màu"
              >
                <X size={14} /> Bỏ chọn
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
          >
            {isSaving ? 'Đang lưu...' : item ? 'Lưu thay đổi' : 'Tạo tag'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
