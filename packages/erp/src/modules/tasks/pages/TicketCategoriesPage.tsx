// ============================================================
// FREZO ERP — TicketCategoriesPage (FR-TASK-CAT)
// Master danh mục Ticket: list + thêm/sửa/ẩn
// ============================================================

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, RefreshCw, EyeOff, Eye } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import {
  AppModal, Button, PageHeader, EmptyState, ConfirmDialog,
  Label, Input, Switch,
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

interface CategoryRow {
  id: string
  code?: string
  name?: string
  sortOrder?: number | null
  active?: boolean | null
}

/** Auto-suggest slug từ tên: lowercase, bỏ dấu, kebab-case. */
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

export function TicketCategoriesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useTicketCategories()
  const createMut = useCreateTicketCategory()
  const updateMut = useUpdateTicketCategory()
  const deleteMut = useDeleteTicketCategory()

  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<CategoryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  const list = useMemo(() => {
    const rows = (Array.isArray(data) ? data : []) as CategoryRow[]
    const q = searchText.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.code || '').toLowerCase().includes(q),
    )
  }, [data, searchText])

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

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      render: (val: string) => (
        <span className="font-mono text-xs text-neutral-700">{val || '—'}</span>
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      render: (val: string) => (
        <span className="font-medium text-neutral-900">{val || '—'}</span>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      width: 90,
      render: (val: number) => (
        <span className="tabular-nums text-sm text-neutral-600">{val ?? 0}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      width: 120,
      render: (val: boolean) =>
        val ? (
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
      title: '',
      dataIndex: 'id',
      width: 140,
      render: (_: string, row: CategoryRow) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            title={row.active ? 'Ẩn khỏi form' : 'Hiện lại trên form'}
            onClick={() => handleToggleActive(row)}
          >
            {row.active ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            title="Sửa"
            onClick={() => openEdit(row)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-danger-dark hover:bg-danger-light"
            title="Xoá mềm"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Danh mục Ticket"
        description="Quản lý danh mục giao việc (Lỗi, Tính năng, Hỗ trợ…). Form ticket lấy từ đây — không hardcode."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="bg-primary-700 hover:bg-primary-800 text-white gap-1.5"
            >
              <Plus size={14} /> Thêm danh mục
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo tên hoặc mã..."
            className="w-full h-10 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {isError ? (
        <EmptyState
          title="Không tải được danh mục"
          description="Kiểm tra kết nối hoặc quyền task/ticket-category."
          action={{ label: 'Thử lại', onClick: () => refetch() }}
        />
      ) : !isLoading && list.length === 0 ? (
        <EmptyState
          title="Chưa có danh mục"
          description="Thêm Lỗi / Tính năng / Hỗ trợ hoặc danh mục riêng cho team."
          action={{ label: 'Thêm danh mục', onClick: openCreate }}
        />
      ) : (
        <AppTable
          columns={columns as any}
          dataSource={list}
          rowKey="id"
          loading={isLoading}
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
              「{deleteTarget.name || deleteTarget.code}」 sẽ bị xoá mềm và không còn trên form.
              Ticket cũ vẫn giữ mã.
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
      description="Tên hiển thị tiếng Việt trên form giao việc. Mã dùng lưu vào ticket."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Tên danh mục <span className="text-rose-500">*</span></Label>
          <Input {...register('name')} placeholder="VD: Lỗi, Tính năng, Họp nội bộ..." autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Mã <span className="text-rose-500">*</span></Label>
          <Input
            {...register('code', { onChange: () => setCodeTouched(true) })}
            placeholder="VD: bug, hop-noi-bo"
            className="font-mono"
            disabled={!!item?.id}
          />
          {errors.code && <p className="text-xs text-rose-600">{errors.code.message as string}</p>}
          {!item && !codeTouched && (
            <p className="text-[11px] text-neutral-500">Slug tự sinh từ tên — bấm để chỉnh tay.</p>
          )}
          {item && (
            <p className="text-[11px] text-neutral-500">Không đổi mã khi sửa — ticket cũ đang trỏ mã này.</p>
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
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary-700 hover:bg-primary-800 text-white"
          >
            {isSaving ? 'Đang lưu...' : item ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
