import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppModal, Button, ConfirmDialog, PageHeader, RowActions } from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppForm } from '@/components/shared/AppForm'
import { useCategories } from '@/modules/qtht/hooks/useCategory'
import {
  useJobPositions,
  useCreateJobPosition,
  useUpdateJobPosition,
  useDeleteJobPosition,
} from '../hooks/useHrSetup'
import { pageRootClass } from '../utils/pageEmbed'
import * as z from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Tên vị trí bắt buộc'),
  rankCode: z.string().min(1, 'Chọn cấp bậc'),
  titleCode: z.string().min(1, 'Chọn chức danh'),
  activated: z.boolean().default(true),
})

type Props = { embedded?: boolean }

export function JobPositionsPage({ embedded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)

  const { data: positions = [], isLoading } = useJobPositions()
  const { data: capBacList } = useCategories('CapBac')
  const { data: chucDanhList } = useCategories('ChucDanh')
  const createReq = useCreateJobPosition()
  const updateReq = useUpdateJobPosition()
  const deleteReq = useDeleteJobPosition()

  const rankOptions = useMemo(
    () => (Array.isArray(capBacList) ? capBacList : []).map((c: any) => ({ value: c.code, label: c.name })),
    [capBacList],
  )
  const titleOptions = useMemo(
    () => (Array.isArray(chucDanhList) ? chucDanhList : []).map((c: any) => ({ value: c.code, label: c.name })),
    [chucDanhList],
  )

  const labelByCode = (opts: { value: string; label: string }[], code?: string) =>
    opts.find((o) => o.value === code)?.label || code || '—'

  const columns: AppTableColumn<any>[] = [
    { key: 'name', title: 'Tên vị trí', dataIndex: 'name' },
    {
      key: 'rankCode',
      title: 'Cấp bậc',
      render: (_, row) => labelByCode(rankOptions, row.rankCode),
    },
    {
      key: 'titleCode',
      title: 'Chức danh',
      render: (_, row) => labelByCode(titleOptions, row.titleCode),
    },
    {
      key: 'activated',
      title: 'Trạng thái',
      render: (_, row) => (row.activated !== false ? 'Hoạt động' : 'Tắt'),
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
          title="Vị trí công việc"
          description="Định nghĩa vị trí theo cấp bậc và chức danh từ Hạng mục."
        />
      )}

      <div className="flex justify-end">
        <Button onClick={() => { setSelected(null); setModalOpen(true) }} className="gap-1.5 bg-primary-600 text-white">
          <Plus size={16} /> Thêm vị trí
        </Button>
      </div>

      <AppTable data={positions} columns={columns} isLoading={isLoading} showSearch={false} />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Sửa vị trí công việc' : 'Thêm vị trí công việc'}
      >
        <AppForm
          schema={schema}
          defaultValues={selected ?? { name: '', rankCode: '', titleCode: '', activated: true }}
          isLoading={createReq.isPending || updateReq.isPending}
          onCancel={() => setModalOpen(false)}
          onSubmit={(values) => {
            if (selected?.id) {
              updateReq.mutate({ id: selected.id, data: values }, { onSuccess: () => setModalOpen(false) })
            } else {
              createReq.mutate(values, { onSuccess: () => setModalOpen(false) })
            }
          }}
          fields={[
            { name: 'name', label: 'Tên vị trí', required: true },
            { name: 'rankCode', label: 'Cấp bậc', type: 'select', options: rankOptions, required: true },
            { name: 'titleCode', label: 'Chức danh', type: 'select', options: titleOptions, required: true },
            { name: 'activated', label: 'Kích hoạt', type: 'switch' },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          deleteReq.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
        }}
        title="Xóa vị trí"
        message={`Xóa vị trí "${confirmDelete?.name}"?`}
        variant="danger"
      />
    </div>
  )
}
