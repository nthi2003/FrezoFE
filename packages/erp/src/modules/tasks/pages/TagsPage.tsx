import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AppTable } from '@/components/ui/AppTable'
import { AppModal } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Label } from '@frezo/ui'
import { Input } from '@frezo/ui'
import { Select } from '@frezo/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTicketTag'
import { tagSchema } from '../constants/schema'

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#64748b', '#6b7280', '#78716c',
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Không có' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'department', label: 'Department' },
  { value: 'skill', label: 'Skill' },
  { value: 'other', label: 'Other' },
]

export function TagsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(tagSchema),
    defaultValues: { code: '', name: '', category: '', color: '' },
  })
  const selectedColor = watch('color')
  const categoryValue = watch('category')

  const { data: rawData, isLoading } = useTags()
  const createReq = useCreateTag()
  const updateReq = useUpdateTag()
  const deleteReq = useDeleteTag()

  const dataList = rawData || []

  const handleOpenCreate = () => {
    setSelectedItem(null)
    reset({ code: '', name: '', category: '', color: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (row: any) => {
    setSelectedItem(row)
    reset({ code: row.code || '', name: row.name || '', category: row.category || '', color: row.color || '' })
    setModalOpen(true)
  }

  const onSubmit = (values: any) => {
    const payload = { ...values }
    if (!payload.category) payload.category = null
    if (!payload.color) payload.color = null
    if (selectedItem?.id) {
      updateReq.mutate({ id: selectedItem.id, data: payload }, { onSuccess: () => setModalOpen(false) })
    } else {
      createReq.mutate(payload, { onSuccess: () => setModalOpen(false) })
    }
  }

  const columns = [
    { title: 'Mã', dataIndex: 'code' },
    { title: 'Tên Tag', dataIndex: 'name' },
    { title: 'Danh mục', dataIndex: 'category' },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
      render: (val: any) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded text-white" style={{ backgroundColor: val || '#ccc' }}>
          {val || 'Default'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      dataIndex: 'id',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row)}>
            <Pencil className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Xóa?')) deleteReq.mutate(row.id) }}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Quản lý thẻ</h1></div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm mới
        </Button>
      </div>

      <AppTable data={dataList} columns={columns} isLoading={isLoading} showSearch searchPlaceholder="Tìm theo mã, tên..." />

      <AppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem ? 'Sửa Tag' : 'Tạo Tag'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mã Tag <span className="text-red-500">*</span></Label>
              <Input {...register('code')} placeholder="VD: HIGH, BUG..." />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message as string}</p>}
            </div>
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select
                options={CATEGORY_OPTIONS}
                value={categoryValue || ''}
                onChange={(v) => setValue('category', v || '', { shouldValidate: true })}
                placeholder="Chọn danh mục"
                showClear
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên Tag <span className="text-red-500">*</span></Label>
            <Input {...register('name')} placeholder="Nhập tên tag..." />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label>Màu sắc</Label>
            <div className="flex items-center gap-3">
              {selectedColor && (
                <span className="w-9 h-9 rounded-lg border border-border shrink-0" style={{ backgroundColor: selectedColor }} />
              )}
              <Input {...register('color')} placeholder="#xxxxxx" className="flex-1" />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${selectedColor === c ? 'border-neutral-800 scale-110 ring-2 ring-offset-1 ring-neutral-800' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={createReq.isPending || updateReq.isPending} className="bg-primary-600 hover:bg-primary-700 text-white">
              {(createReq.isPending || updateReq.isPending) ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </AppModal>
    </div>
  )
}
