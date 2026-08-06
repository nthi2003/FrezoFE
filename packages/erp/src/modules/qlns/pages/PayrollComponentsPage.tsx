import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AppModal, Button, ConfirmDialog, PageHeader, RowActions } from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { AppForm } from '@/components/shared/AppForm'
import {
  usePayrollComponents,
  useCreatePayrollComponent,
  useUpdatePayrollComponent,
  useDeletePayrollComponent,
} from '../hooks/useHrSetup'
import { pageRootClass } from '../utils/pageEmbed'
import * as z from 'zod'

const NATURE_OPTIONS = [
  { value: 'INCOME', label: 'Thu nhập' },
  { value: 'DEDUCTION', label: 'Khấu trừ' },
]

const TAXABLE_OPTIONS = [
  { value: 'FULL', label: 'Chịu thuế toàn phần' },
  { value: 'PARTIAL', label: 'Chịu thuế một phần' },
  { value: 'NONE', label: 'Không chịu thuế' },
]

const QUOTA_OPTIONS = [
  { value: 'FIXED', label: 'Cố định' },
  { value: 'PERCENT', label: 'Phần trăm' },
]

const schema = z.object({
  code: z.string().min(1, 'Mã khoản bắt buộc'),
  name: z.string().min(1, 'Tên khoản bắt buộc'),
  nature: z.enum(['INCOME', 'DEDUCTION']),
  taxableType: z.string().optional().nullable(),
  taxDeductible: z.boolean().optional(),
  quotaType: z.string().optional().nullable(),
  quotaValue: z.coerce.number().optional().nullable(),
  defaultValue: z.coerce.number().optional().nullable(),
  activated: z.boolean().default(true),
})

const natureLabel = (v?: string) => NATURE_OPTIONS.find((o) => o.value === v)?.label || v
const taxableLabel = (v?: string) => TAXABLE_OPTIONS.find((o) => o.value === v)?.label || '—'

type Props = { embedded?: boolean }

export function PayrollComponentsPage({ embedded }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)

  const { data: items = [], isLoading } = usePayrollComponents()
  const createReq = useCreatePayrollComponent()
  const updateReq = useUpdatePayrollComponent()
  const deleteReq = useDeletePayrollComponent()

  const columns: AppTableColumn<any>[] = [
    { key: 'code', title: 'Mã', dataIndex: 'code' },
    { key: 'name', title: 'Tên', dataIndex: 'name' },
    { key: 'nature', title: 'Tính chất', render: (_, row) => natureLabel(row.nature) },
    { key: 'taxableType', title: 'Chịu thuế', render: (_, row) => taxableLabel(row.taxableType) },
    {
      key: 'taxDeductible',
      title: 'Giảm trừ khi tính thuế',
      render: (_, row) => (row.taxDeductible ? 'Có' : 'Không'),
    },
    {
      key: 'quota',
      title: 'Định mức',
      render: (_, row) => {
        if (!row.quotaType) return '—'
        const q = QUOTA_OPTIONS.find((o) => o.value === row.quotaType)?.label
        return row.quotaValue != null ? `${q}: ${row.quotaValue}` : q
      },
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
          title="Phụ cấp & khấu trừ"
          description="Khai báo khoản thu nhập / khấu trừ dùng khi tính lương."
        />
      )}

      <div className="flex justify-end">
        <Button onClick={() => { setSelected(null); setModalOpen(true) }} className="gap-1.5 bg-primary-600 text-white">
          <Plus size={16} /> Thêm khoản
        </Button>
      </div>

      <AppTable data={items} columns={columns} isLoading={isLoading} showSearch={false} />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Sửa khoản' : 'Thêm khoản phụ cấp / khấu trừ'}
        maxWidth="3xl"
      >
        <AppForm
          schema={schema}
          defaultValues={
            selected ?? {
              code: '', name: '', nature: 'INCOME', taxableType: 'FULL',
              taxDeductible: false, quotaType: 'FIXED', activated: true,
            }
          }
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
            { name: 'code', label: 'Mã khoản', required: true },
            { name: 'name', label: 'Tên khoản', required: true },
            { name: 'nature', label: 'Tính chất', type: 'select', options: NATURE_OPTIONS, required: true },
            { name: 'taxableType', label: 'Chịu thuế', type: 'select', options: TAXABLE_OPTIONS },
            { name: 'taxDeductible', label: 'Giảm trừ khi tính thuế', type: 'switch' },
            { name: 'quotaType', label: 'Loại định mức', type: 'select', options: QUOTA_OPTIONS },
            { name: 'quotaValue', label: 'Định mức', type: 'number' },
            { name: 'defaultValue', label: 'Giá trị mặc định', type: 'number' },
            { name: 'activated', label: 'Kích hoạt', type: 'switch' },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteReq.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })}
        title="Xóa khoản"
        message={`Xóa "${confirmDelete?.name}"?`}
        variant="danger"
      />
    </div>
  )
}
