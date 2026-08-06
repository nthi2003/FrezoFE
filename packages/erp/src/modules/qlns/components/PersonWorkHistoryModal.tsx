import { useState } from 'react'
import { Plus, Trash2, History } from 'lucide-react'
import { AppModal, Button, ConfirmDialog } from '@frezo/ui'
import { AppForm } from '@/components/shared/AppForm'
import {
  usePersonWorkHistory,
  useCreateWorkHistory,
  useDeleteWorkHistory,
} from '../hooks/useHrSetup'
import * as z from 'zod'

const schema = z.object({
  fromDate: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  departmentName: z.string().optional().nullable(),
  positionName: z.string().min(1, 'Nhập vị trí / chức danh'),
  note: z.string().optional().nullable(),
})

interface Props {
  personId: string
  personName?: string
  trigger?: React.ReactNode
}

export function PersonWorkHistoryModal({ personId, personName, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: rows = [], isLoading } = usePersonWorkHistory(open ? personId : undefined)
  const createReq = useCreateWorkHistory()
  const deleteReq = useDeleteWorkHistory()

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <History size={14} /> Quá trình làm việc
        </Button>
      )}

      <AppModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Quá trình làm việc${personName ? ` — ${personName}` : ''}`}
        maxWidth="3xl"
      >
        <div className="flex justify-end mb-3">
          <Button size="sm" className="gap-1 bg-primary-600 text-white" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Thêm bản ghi
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-neutral-400">Đang tải…</div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400 italic">Chưa có quá trình làm việc</div>
        ) : (
          <ul className="space-y-2 max-h-[360px] overflow-y-auto">
            {rows.map((r: any) => (
              <li key={r.id} className="border rounded-lg p-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-800">{r.positionName}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {[r.departmentName, r.fromDate, r.toDate ? `→ ${r.toDate}` : '→ nay'].filter(Boolean).join(' · ')}
                  </div>
                  {r.note && <p className="text-xs text-neutral-600 mt-1">{r.note}</p>}
                </div>
                <button
                  type="button"
                  className="text-rose-500 hover:text-rose-700 p-1"
                  onClick={() => setDeleteId(r.id)}
                  aria-label="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AppModal>

      <AppModal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Thêm quá trình làm việc">
        <AppForm
          schema={schema}
          defaultValues={{ positionName: '', departmentName: '', fromDate: '', toDate: '', note: '' }}
          isLoading={createReq.isPending}
          onCancel={() => setAddOpen(false)}
          onSubmit={(values) => {
            createReq.mutate(
              { ...values, personId },
              { onSuccess: () => setAddOpen(false) },
            )
          }}
          fields={[
            { name: 'positionName', label: 'Vị trí / chức danh', required: true },
            { name: 'departmentName', label: 'Phòng ban / đơn vị' },
            { name: 'fromDate', label: 'Từ ngày', type: 'date' },
            { name: 'toDate', label: 'Đến ngày', type: 'date' },
            { name: 'note', label: 'Ghi chú', colSpan: 2 },
          ]}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteReq.mutate({ id: deleteId, personId }, { onSuccess: () => setDeleteId(null) })
          }
        }}
        title="Xóa bản ghi"
        message="Xóa mục quá trình làm việc này?"
        variant="danger"
      />
    </>
  )
}
