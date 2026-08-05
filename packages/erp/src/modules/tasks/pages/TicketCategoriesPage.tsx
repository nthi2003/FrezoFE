// ============================================================
// FREZO ERP — TicketCategoriesPage (FR-TASK-CAT)
// Master danh mục giao việc: AppTable + FilterBar sticky
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, EyeOff, Eye, FolderTree } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { FilterExportDrawer, FilterExportTrigger } from '@/components/shared/FilterExportDrawer'
import { downloadCsv } from '@/utils/csvExport'
import {
  AppModal, Button, PageHeader, PageGuideButton, EmptyState, ErrorState, ConfirmDialog,
  Label, Input, Switch, IconActionButton,
} from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  useTicketCategories,
  useCreateTicketCategory,
  useUpdateTicketCategory,
  useDeleteTicketCategory,
} from '../hooks/useTicketTag'
import { ticketCategorySchema, type TicketCategoryFormValues } from '../constants/schema'
import { CATEGORIES_GUIDE } from '../constants/categories.guide'

interface CategoryRow {
  id: string
  code?: string
  name?: string
  sortOrder?: number | null
  active?: boolean | null
}

function suggestCodeFromName(name: string): string {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function TicketCategoriesPage({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading, isError, refetch, isFetching } = useTicketCategories()
  const createMut = useCreateTicketCategory()
  const updateMut = useUpdateTicketCategory()
  const deleteMut = useDeleteTicketCategory()

  const [searchText, setSearchText] = useState('')
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<CategoryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  const allRows = useMemo(
    () => (Array.isArray(data) ? data : []) as CategoryRow[],
    [data],
  )

  const list = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q),
    )
  }, [allRows, searchText])

  const hasFilter = !!searchText.trim()

  const openCreate = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const openEdit = (row: CategoryRow) => {
    setSelected(row)
    setModalOpen(true)
  }

  const handleSubmit = useCallback(
    async (values: TicketCategoryFormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        sortOrder: values.sortOrder ?? 0,
        active: values.active ?? true,
      }
      try {
        if (selected?.id) {
          await updateMut.mutateAsync({ id: selected.id, data: payload })
        } else {
          await createMut.mutateAsync(payload)
        }
        setModalOpen(false)
        setSelected(null)
      } catch {
        toast.error('Không lưu được danh mục')
      }
    },
    [selected, createMut, updateMut],
  )

  const handleToggleActive = async (row: CategoryRow) => {
    if (!row.id) return
    try {
      await updateMut.mutateAsync({
        id: row.id,
        data: {
          code: row.code,
          name: row.name,
          sortOrder: row.sortOrder ?? 0,
          active: !row.active,
        },
      })
    } catch {
      toast.error('Không cập nhật được trạng thái')
    }
  }

  const columns: AppTableColumn<CategoryRow>[] = [
    {
      key: 'code',
      title: 'Mã',
      render: (_, row) => (
        <span className="font-mono text-xs text-neutral-700">{row.code || '—'}</span>
      ),
    },
    {
      key: 'name',
      title: 'Tên',
      render: (_, row) => (
        <span className="font-medium text-neutral-900">{row.name || '—'}</span>
      ),
    },
    {
      key: 'sortOrder',
      title: 'Thứ tự',
      width: 90,
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums text-sm text-neutral-600">{row.sortOrder ?? 0}</span>
      ),
    },
    {
      key: 'active',
      title: 'Trạng thái',
      width: 120,
      render: (_, row) =>
        row.active ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark bg-success-light px-2 py-0.5 rounded-md border border-success/30">
            Đang dùng
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
            Đã ẩn
          </span>
        ),
    },
    {
      key: 'actions',
      title: '',
      width: 140,
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <IconActionButton
            tooltip={row.active ? 'Ẩn khỏi form' : 'Hiện lại trên form'}
            tone="blue"
            size="sm"
            onClick={() => handleToggleActive(row)}
          >
            {row.active ? <EyeOff size={14} /> : <Eye size={14} />}
          </IconActionButton>
          <IconActionButton tooltip="Sửa" tone="blue" size="sm" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </IconActionButton>
          <IconActionButton tooltip="Ẩn danh mục" tone="rose" size="sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} />
          </IconActionButton>
        </div>
      ),
    },
  ]

  const isFilteredEmpty = !isLoading && !isError && allRows.length > 0 && list.length === 0
  const isFullyEmpty = !isLoading && !isError && allRows.length === 0

  const headerActions = (
    <div className="flex items-center gap-2">
      <PageGuideButton guide={CATEGORIES_GUIDE} />
      <Button
        type="button"
        onClick={openCreate}
        className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
      >
        <Plus size={14} /> Thêm danh mục
      </Button>
    </div>
  )

  const searchField = (
    <div className="relative flex-1 min-w-[220px] max-w-sm">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Tìm theo tên hoặc mã…"
        className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
        aria-label="Tìm danh mục"
      />
    </div>
  )

  const handleExportCsv = () => {
    downloadCsv(
      'danh-muc-ticket.csv',
      list.map((r) => ({
        code: r.code,
        name: r.name,
        sortOrder: r.sortOrder ?? 0,
        active: r.active ? 'Đang dùng' : 'Đã ẩn',
      })),
      [
        { key: 'code', label: 'Mã' },
        { key: 'name', label: 'Tên' },
        { key: 'sortOrder', label: 'Thứ tự' },
        { key: 'active', label: 'Trạng thái' },
      ],
    )
  }

  return (
    <div className={embedded ? 'space-y-4' : 'p-6 space-y-4 animate-fade-in'}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Nhóm loại việc trên form giao việc.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {list.length} danh mục{hasFilter ? ' (đã lọc)' : ''}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterExportTrigger
              onClick={() => setFilterDrawerOpen(true)}
              activeCount={hasFilter ? 1 : 0}
            />
            {headerActions}
          </div>
        </div>
      ) : (
        <PageHeader
          title="Danh mục ticket"
          description="Nhóm loại việc trên form giao việc (Lỗi, Tính năng, Hỗ trợ…)."
          actions={headerActions}
        />
      )}

      {embedded ? (
        <FilterExportDrawer
          isOpen={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          hasActiveFilters={hasFilter}
          onClear={() => setSearchText('')}
          onExport={handleExportCsv}
          exportDisabled={list.length === 0}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-600">Tìm kiếm</label>
            {searchField}
          </div>
        </FilterExportDrawer>
      ) : (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={() => setSearchText('')}
          countLabel={`${list.length} danh mục${hasFilter ? ' (đã lọc)' : ''}`}
        >
          {searchField}
        </FilterBar>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được danh mục"
            message="Kiểm tra kết nối hoặc quyền truy cập."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FolderTree}
            title={isFilteredEmpty ? 'Không có danh mục khớp bộ lọc' : 'Chưa có danh mục'}
            description={
              isFilteredEmpty
                ? 'Thử xoá tìm kiếm hoặc đổi từ khoá.'
                : 'Thêm Lỗi / Tính năng / Hỗ trợ hoặc danh mục riêng cho nhóm.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: () => setSearchText('') }
                : { label: 'Thêm danh mục', onClick: openCreate }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={list}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelected(null)
        }}
        item={selected}
        onSubmit={handleSubmit}
        isSaving={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Ẩn danh mục?"
        message={
          deleteTarget ? (
            <span>
              「{deleteTarget.name || deleteTarget.code}」 sẽ bị ẩn và không còn trên form tạo việc mới.
              Việc cũ vẫn giữ mã danh mục.
            </span>
          ) : (
            ''
          )
        }
        confirmText="Ẩn danh mục"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={async () => {
          if (!deleteTarget?.id) return
          try {
            await deleteMut.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          } catch {
            toast.error('Không ẩn được danh mục')
          }
        }}
      />
    </div>
  )
}

function CategoryFormModal({
  isOpen,
  onClose,
  item,
  onSubmit,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  item: CategoryRow | null
  onSubmit: (values: TicketCategoryFormValues) => void
  isSaving: boolean
}) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TicketCategoryFormValues>({
    resolver: zodResolver(ticketCategorySchema),
    defaultValues: { code: '', name: '', sortOrder: 0, active: true },
  })

  const nameValue = watch('name')
  const codeValue = watch('code')
  const activeValue = watch('active')

  useEffect(() => {
    if (isOpen) {
      reset({
        code: item?.code || '',
        name: item?.name || '',
        sortOrder: item?.sortOrder ?? 0,
        active: item?.active ?? true,
      })
    }
  }, [isOpen, item, reset])

  const [codeTouched, setCodeTouched] = useState(false)
  useEffect(() => {
    if (isOpen) setCodeTouched(false)
  }, [isOpen])

  useEffect(() => {
    if (item?.id || codeTouched) return
    const suggested = suggestCodeFromName(nameValue || '')
    if (suggested && suggested !== codeValue) {
      setValue('code', suggested, { shouldValidate: false })
    }
  }, [nameValue, item, codeTouched, codeValue, setValue])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Sửa danh mục' : 'Thêm danh mục'}
      description="Tên hiển thị tiếng Việt trên form giao việc."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Tên danh mục <span className="text-rose-500">*</span></Label>
          <Input {...register('name')} placeholder="VD: Lỗi, Tính năng, Họp nội bộ…" autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Mã <span className="text-rose-500">*</span></Label>
          <Input
            {...register('code', { onChange: () => setCodeTouched(true) })}
            placeholder="VD: loi, hop-noi-bo"
            className="font-mono"
            disabled={!!item?.id}
          />
          {errors.code && <p className="text-xs text-rose-600">{errors.code.message as string}</p>}
          {!item && !codeTouched && (
            <p className="text-[11px] text-neutral-500">Mã gợi ý từ tên — có thể chỉnh tay.</p>
          )}
          {item && (
            <p className="text-[11px] text-neutral-500">Không đổi mã khi sửa — việc cũ đang dùng mã này.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Thứ tự</Label>
            <Input type="number" {...register('sortOrder')} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Hiện trên form</Label>
            <div className="h-10 flex items-center gap-2">
              <Switch
                checked={!!activeValue}
                onChange={(v) => setValue('active', v, { shouldDirty: true })}
              />
              <span className="text-sm text-neutral-600">{activeValue ? 'Đang dùng' : 'Đã ẩn'}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Huỷ
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary-700 hover:bg-primary-800 text-white"
          >
            {isSaving ? 'Đang lưu…' : item ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
