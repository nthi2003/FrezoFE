// ============================================================
// ReorderRulesPage — quy tắc tái nhập kho (FZ-010 / FE-3)
// ============================================================

import { useMemo, useState, useEffect } from 'react'
import {
  Plus, Upload, Download, Trash2, FileDown, Package,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, PageHeader, AppModal, EmptyState, ConfirmDialog,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { BulkAction } from '@/components/ui/AppTable/AppTable'
import { downloadCsv } from '@/lib/export/toCsv'
import {
  useReorderRules, useCreateReorderRule, useUpdateReorderRule,
  useDeleteReorderRule, useImportReorderRules, useWarehouses,
} from '../hooks/useReorderRules'
import type { ReorderRuleDto, ReorderRuleRequest } from '../types'

export function ReorderRulesPage() {
  const [warehouseId, setWarehouseId] = useState('')
  const { data: warehouses = [] } = useWarehouses()
  const { data: rows = [], isLoading } = useReorderRules(warehouseId || undefined)
  const create = useCreateReorderRule()
  const update = useUpdateReorderRule()
  const remove = useDeleteReorderRule()
  const importMut = useImportReorderRules()

  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState<ReorderRuleDto[] | null>(null)
  const [form, setForm] = useState<ReorderRuleRequest>({
    warehouseId: '',
    productId: '',
    minQty: 10,
    maxQty: 100,
    reorderQty: 50,
    active: true,
  })

  const columns = useMemo(
    () => [
      {
        title: 'Sản phẩm',
        dataIndex: 'productName' as const,
        render: (_: unknown, row: ReorderRuleDto) => (
          <div>
            <div className="font-medium text-neutral-800">{row.productName || '—'}</div>
            <div className="text-[11px] font-mono text-neutral-400">{row.productCode}</div>
          </div>
        ),
      },
      {
        title: 'Kho',
        dataIndex: 'warehouseName' as const,
        render: (v: string) => <span className="text-sm">{v || '—'}</span>,
      },
      {
        title: 'Danh mục',
        dataIndex: 'categoryName' as const,
        render: (v: string) => (
          <span className="text-xs text-neutral-500">{v || '—'}</span>
        ),
      },
      {
        title: 'Min',
        dataIndex: 'minQty' as const,
        align: 'right' as const,
        render: (v: number, row: ReorderRuleDto) => (
          <InlineQty
            value={v}
            onCommit={(n) => {
              if (n > row.maxQty) {
                toast.error('Min phải ≤ Max')
                return
              }
              update.mutate({ id: row.id, body: { minQty: n } })
            }}
          />
        ),
      },
      {
        title: 'Max',
        dataIndex: 'maxQty' as const,
        align: 'right' as const,
        render: (v: number, row: ReorderRuleDto) => (
          <InlineQty
            value={v}
            onCommit={(n) => {
              if (n < row.minQty) {
                toast.error('Max phải ≥ Min')
                return
              }
              update.mutate({ id: row.id, body: { maxQty: n } })
            }}
          />
        ),
      },
      {
        title: 'SL đặt lại',
        dataIndex: 'reorderQty' as const,
        align: 'right' as const,
        render: (v: number) => (
          <span className="tabular-nums font-medium">{v ?? '—'}</span>
        ),
      },
      {
        title: 'TT',
        dataIndex: 'active' as const,
        align: 'center' as const,
        render: (v: boolean) => (
          <span
            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              v
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
            }`}
          >
            {v ? 'ON' : 'OFF'}
          </span>
        ),
      },
    ],
    [update],
  )

  const exportCsv = (selected: ReorderRuleDto[]) => {
    downloadCsv(`reorder-rules-${new Date().toISOString().slice(0, 10)}`, selected, [
      { header: 'Mã SP', accessor: 'productCode' },
      { header: 'Tên SP', accessor: 'productName' },
      { header: 'Kho', accessor: 'warehouseName' },
      { header: 'Min', accessor: 'minQty' },
      { header: 'Max', accessor: 'maxQty' },
      { header: 'Reorder', accessor: 'reorderQty' },
      { header: 'Active', accessor: (r) => (r.active ? 'YES' : 'NO') },
    ])
    toast.success(`Đã xuất ${selected.length} quy tắc`)
  }

  const bulkActions: BulkAction<ReorderRuleDto>[] = [
    {
      key: 'export',
      label: 'Export CSV',
      icon: FileDown,
      onClick: exportCsv,
    },
    {
      key: 'delete',
      label: 'Xoá',
      icon: Trash2,
      variant: 'destructive',
      onClick: (rows) => setConfirmBulk(rows),
    },
  ]

  const onCreate = () => {
    if (!form.warehouseId || !form.productId) return
    if (form.minQty > form.maxQty) {
      toast.error('Min phải ≤ Max')
      return
    }
    create.mutate(form, {
      onSuccess: () => {
        setModalOpen(false)
        setForm({
          warehouseId: warehouseId || '',
          productId: '',
          minQty: 10,
          maxQty: 100,
          reorderQty: 50,
          active: true,
        })
      },
    })
  }

  const downloadTemplate = () => {
    downloadCsv('reorder-rules-template', [
      {
        productCode: 'SP-001',
        warehouseCode: 'HN',
        minQty: 50,
        maxQty: 200,
        reorderQty: 100,
      },
    ], [
      { header: 'productCode', accessor: 'productCode' },
      { header: 'warehouseCode', accessor: 'warehouseCode' },
      { header: 'minQty', accessor: 'minQty' },
      { header: 'maxQty', accessor: 'maxQty' },
      { header: 'reorderQty', accessor: 'reorderQty' },
    ])
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Quy tắc tái nhập"
        description="Đặt ngưỡng min/max tồn kho — hệ thống cảnh báo khi dưới min."
        actions={
          <>
            <Button variant="outline" className="gap-1.5" onClick={downloadTemplate}>
              <Download size={14} /> Tải template
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
              <Upload size={14} /> Import Excel
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                setForm((f) => ({ ...f, warehouseId: warehouseId || warehouses[0]?.id || '' }))
                setModalOpen(true)
              }}
            >
              <Plus size={14} /> Thêm quy tắc
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3">
        <select
          className="h-9 border rounded-md px-3 text-sm bg-white"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          <option value="">Tất cả kho</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 && !isLoading ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Package}
            title="Chưa có quy tắc tái nhập"
            description="Thêm thủ công hoặc Import Excel từ template."
            action={{ label: 'Thêm quy tắc', onClick: () => setModalOpen(true) }}
          />
        </div>
      ) : (
        <AppTable
          data={rows}
          columns={columns as never}
          isLoading={isLoading}
          selectable
          getRowId={(r) => r.id}
          bulkActions={bulkActions}
        />
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm quy tắc tái nhập"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <Field label="Kho *">
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              <option value="">— Chọn kho —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mã / ID sản phẩm *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              placeholder="p-01 hoặc SP-001"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min *">
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.minQty}
                onChange={(e) => setForm({ ...form, minQty: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Max *">
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.maxQty}
                onChange={(e) => setForm({ ...form, maxQty: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="SL đặt lại">
              <input
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.reorderQty ?? 0}
                onChange={(e) =>
                  setForm({ ...form, reorderQty: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={onCreate}
              disabled={create.isPending || !form.warehouseId || !form.productId}
            >
              Thêm
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Excel quy tắc"
        description="Upload file .xlsx / .csv theo template. BE chưa sẵn → mock 0 dòng."
      >
        <ImportPanel
          onUpload={(file) => {
            importMut.mutate(file, { onSuccess: () => setImportOpen(false) })
          }}
          busy={importMut.isPending}
        />
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmBulk}
        onClose={() => setConfirmBulk(null)}
        onConfirm={async () => {
          if (!confirmBulk) return
          await Promise.allSettled(confirmBulk.map((r) => remove.mutateAsync(r.id)))
          toast.success(`Đã xoá ${confirmBulk.length} quy tắc`)
          setConfirmBulk(null)
        }}
        title={`Xoá ${confirmBulk?.length ?? 0} quy tắc?`}
        message="Thao tác không thể hoàn tác."
        variant="danger"
        confirmText="Xoá"
        cancelText="Huỷ"
      />
    </div>
  )
}

function InlineQty({
  value,
  onCommit,
}: {
  value: number
  onCommit: (n: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  // BUG-12: sync khi prop value đổi từ server
  useEffect(() => {
    setDraft(String(value))
  }, [value])
  return (
    <input
      type="number"
      className="w-20 text-right border border-transparent hover:border-neutral-200 focus:border-primary-400 rounded px-1.5 py-0.5 text-sm tabular-nums bg-transparent focus:bg-white outline-none"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft)
        if (!Number.isNaN(n) && n !== value) onCommit(n)
        else setDraft(String(value))
      }}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function ImportPanel({
  onUpload,
  busy,
}: {
  onUpload: (f: File) => void
  busy: boolean
}) {
  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 rounded-xl p-8 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition">
        <Upload size={24} className="text-neutral-400" />
        <span className="text-sm text-neutral-600">Chọn file Excel / CSV</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
          }}
        />
      </label>
      {busy && <p className="text-xs text-center text-neutral-500">Đang import…</p>}
    </div>
  )
}
