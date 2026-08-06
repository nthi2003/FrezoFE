import { useMemo, useState } from 'react'
import { Plus, ChevronUp, ChevronDown, GripVertical, Search } from 'lucide-react'
import {
  AppModal, Button, ConfirmDialog, PageHeader, PageGuideButton, Select, RowActions,
  StatusBadge, type PageGuideConfig,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { AppForm } from '@/components/shared/AppForm'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/modules/qtht/hooks/useCategory'
import { categoryFormSchema } from '@/modules/qtht/constants/category.schema'
import { HR_CATEGORY_GROUPS, HR_CATEGORY_GROUP_LABEL } from '../constants/hrCategories'
import { hrSetupApi } from '../services/hrSetupApi'
import { pageRootClass } from '../utils/pageEmbed'
import { toast } from 'sonner'

const GUIDE: PageGuideConfig = {
  title: 'Hạng mục nhân sự',
  subtitle: 'Thiết lập danh mục dùng cho vị trí công việc, hợp đồng và hồ sơ nhân viên.',
  sections: [
    {
      heading: 'Thứ tự thiết lập',
      type: 'steps',
      steps: [
        { title: 'Hạng mục', description: 'Chức danh, cấp bậc, trình độ…' },
        { title: 'Vị trí công việc', description: 'Gắn cấp bậc + chức danh' },
        { title: 'Phụ cấp / khấu trừ', description: 'Khoản tính lương' },
        { title: 'Hồ sơ nhân viên', description: 'Tạo / import danh sách' },
      ],
    },
  ],
}

type Props = { embedded?: boolean }

export function HrCategoriesPage({ embedded }: Props) {
  const [groupCode, setGroupCode] = useState(HR_CATEGORY_GROUPS[0].value)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [checkingDelete, setCheckingDelete] = useState(false)

  const { data: rawData, isLoading, refetch } = useCategories(groupCode)
  const createReq = useCreateCategory()
  const updateReq = useUpdateCategory()
  const deleteReq = useDeleteCategory()

  const dataList = useMemo(() => {
    const list = (Array.isArray(rawData) ? rawData : []) as any[]
    return [...list].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  }, [rawData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return dataList
    return dataList.filter(
      (c) =>
        (c.code || '').toLowerCase().includes(q) ||
        (c.name || '').toLowerCase().includes(q),
    )
  }, [dataList, search])

  const moveItem = (row: any, delta: number) => {
    const idx = dataList.findIndex((c) => c.id === row.id)
    const target = dataList[idx + delta]
    if (!target) return
    const rowOrder = row.orderIndex ?? idx
    const targetOrder = target.orderIndex ?? idx + delta
    updateReq.mutate({ id: row.id, data: { ...row, groupCode, orderIndex: targetOrder, active: row.active !== false } })
    updateReq.mutate({ id: target.id, data: { ...target, groupCode, orderIndex: rowOrder, active: target.active !== false } })
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setCheckingDelete(true)
    try {
      const usageRes = await hrSetupApi.checkCategoryUsage(confirmDelete.code)
      const usage = usageRes?.data
      if (usage?.usageCount > 0) {
        toast.error(
          `${usage.message || 'Không thể xóa'} (${usage.usageCount} vị trí: ${(usage.positionNames || []).slice(0, 3).join(', ')})`,
        )
        setConfirmDelete(null)
        return
      }
      deleteReq.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
    } finally {
      setCheckingDelete(false)
    }
  }

  const columns: AppTableColumn<any>[] = [
    {
      key: 'order',
      title: '',
      width: 72,
      render: (_, row) => {
        const idx = dataList.findIndex((c) => c.id === row.id)
        return (
          <div className="flex items-center gap-0.5">
            <GripVertical size={14} className="text-neutral-300" />
            <button type="button" className="p-0.5 text-neutral-400 hover:text-neutral-700" onClick={() => moveItem(row, -1)} disabled={idx <= 0}>
              <ChevronUp size={14} />
            </button>
            <button type="button" className="p-0.5 text-neutral-400 hover:text-neutral-700" onClick={() => moveItem(row, 1)} disabled={idx >= dataList.length - 1}>
              <ChevronDown size={14} />
            </button>
          </div>
        )
      },
    },
    { key: 'code', title: 'Mã', dataIndex: 'code' },
    { key: 'name', title: 'Tên', dataIndex: 'name' },
    {
      key: 'active',
      title: 'Trạng thái',
      render: (_, row) => (
        <StatusBadge label={row.active !== false ? 'Kích hoạt' : 'Tắt'} color={row.active !== false ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (_, row) => (
        <RowActions
          actions={[
            { kind: 'edit', onClick: () => { setSelected(row); setModalOpen(true) } },
            { kind: 'delete', onClick: () => setConfirmDelete(row) },
          ]}
        />
      ),
    },
  ]

  const rootClass = pageRootClass(embedded)

  return (
    <div className={rootClass}>
      {!embedded && (
        <PageHeader
          title="Hạng mục nhân sự"
          description="Quản lý chức danh, cấp bậc, trình độ và các danh mục HR khác."
          actions={<PageGuideButton guide={GUIDE} />}
        />
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="min-w-[200px]">
          <Select
            options={HR_CATEGORY_GROUPS.map((g) => ({ value: g.value, label: g.label }))}
            value={groupCode}
            onChange={(v) => setGroupCode(v as typeof groupCode)}
            aria-label="Nhóm hạng mục"
          />
        </div>
        <Button onClick={() => { setSelected(null); setModalOpen(true) }} className="gap-1.5 bg-primary-600 text-white ml-auto">
          <Plus size={16} /> Thêm {HR_CATEGORY_GROUP_LABEL[groupCode]?.toLowerCase() || 'hạng mục'}
        </Button>
      </div>

      <FilterBar hasActiveFilters={!!search.trim()} onClear={() => setSearch('')} countLabel={`${filtered.length} mục`}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm"
            placeholder="Tìm mã, tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FilterBar>

      <AppTable data={filtered} columns={columns} isLoading={isLoading} showSearch={false} />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Sửa hạng mục' : `Thêm ${HR_CATEGORY_GROUP_LABEL[groupCode]}`}
      >
        <AppForm
          schema={categoryFormSchema}
          defaultValues={selected ?? { code: '', name: '', orderIndex: dataList.length, active: true }}
          isLoading={createReq.isPending || updateReq.isPending}
          onCancel={() => setModalOpen(false)}
          onSubmit={(values) => {
            const payload = { ...values, groupCode, activated: values.active !== false }
            if (selected?.id) {
              updateReq.mutate({ id: selected.id, data: payload }, { onSuccess: () => { setModalOpen(false); void refetch() } })
            } else {
              createReq.mutate(payload, { onSuccess: () => { setModalOpen(false); void refetch() } })
            }
          }}
          fields={[
            { name: 'code', label: 'Mã', required: true },
            { name: 'name', label: 'Tên', required: true },
            { name: 'orderIndex', label: 'Thứ tự', type: 'number' },
            { name: 'active', label: 'Kích hoạt', type: 'switch' },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Xóa hạng mục"
        message={`Xóa "${confirmDelete?.name}"? Hệ thống sẽ kiểm tra vị trí công việc đang dùng.`}
        variant="danger"
        confirmText={checkingDelete ? 'Đang kiểm tra…' : 'Xóa'}
      />
    </div>
  )
}
