// ============================================================
// ReorderRulesPage — quy tắc tái nhập kho (FZ-010 / FE-3)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Upload, Download, Trash2, FileDown, Package, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button, PageHeader, AppModal, EmptyState, ConfirmDialog, PageGuideButton, ErrorState,
} from '@frezo/ui'
import { downloadCsv } from '@/lib/export/toCsv'
import {
  useReorderRules, useCreateReorderRule, useUpdateReorderRule,
  useDeleteReorderRule, useImportReorderRules, useWarehouses,
} from '../hooks/useReorderRules'
import { REORDER_RULES_GUIDE } from '../constants/reorder-rules.guide'
import type { ReorderRuleDto, ReorderRuleRequest } from '../types'

export function ReorderRulesPage() {
  const [warehouseId, setWarehouseId] = useState('')
  const [category, setCategory] = useState('')
  const { data: warehouses = [] } = useWarehouses()
  const { data: rows = [], isLoading, isError, error, refetch } = useReorderRules(warehouseId || undefined)
  const create = useCreateReorderRule()
  const update = useUpdateReorderRule()
  const remove = useDeleteReorderRule()
  const importMut = useImportReorderRules()

  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState<ReorderRuleDto[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<ReorderRuleRequest>({
    warehouseId: '',
    productId: '',
    minQty: 10,
    maxQty: 100,
    reorderQty: 50,
    active: true,
  })

  const selectedRows = rows.filter((r) => selected.has(r.id))

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => r.categoryName && set.add(r.categoryName))
    return Array.from(set).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!category) return rows
    return rows.filter((r) => r.categoryName === category)
  }, [rows, category])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filteredRows.length) setSelected(new Set())
    else setSelected(new Set(filteredRows.map((r) => r.id)))
  }

  const exportCsv = (items: ReorderRuleDto[]) => {
    downloadCsv(`reorder-rules-${new Date().toISOString().slice(0, 10)}`, items, [
      { header: 'Mã SP', accessor: 'productCode' },
      { header: 'Tên SP', accessor: 'productName' },
      { header: 'Kho', accessor: 'warehouseName' },
      { header: 'Min', accessor: 'minQty' },
      { header: 'Max', accessor: 'maxQty' },
      { header: 'Reorder', accessor: 'reorderQty' },
      { header: 'Active', accessor: (r) => (r.active ? 'YES' : 'NO') },
    ])
    toast.success(`Đã xuất ${items.length} quy tắc`)
  }

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
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={REORDER_RULES_GUIDE} />
            <select
              className="h-9 border rounded-md px-3 text-sm bg-white"
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value)
                setSelected(new Set())
                setCategory('')
              }}
            >
              <option value="">Tất cả kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {categories.length > 0 && (
              <select
                className="h-9 border rounded-md px-3 text-sm bg-white"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setSelected(new Set())
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {selected.size > 0 && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => exportCsv(selectedRows)}
                >
                  <FileDown size={14} /> Export ({selected.size})
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => setConfirmBulk(selectedRows)}
                >
                  <Trash2 size={14} /> Xoá ({selected.size})
                </Button>
              </>
            )}
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
          </div>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được quy tắc"
            message={(error as Error)?.message || 'Kiểm tra kết nối hoặc thử lại.'}
            onRetry={() => refetch()}
          />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Package}
            title={rows.length === 0 ? 'Chưa có quy tắc tái nhập' : 'Không có quy tắc phù hợp bộ lọc'}
            description={
              rows.length === 0
                ? 'Thêm thủ công hoặc Import Excel từ template.'
                : 'Thử chọn kho / danh mục khác hoặc bấm Thêm quy tắc.'
            }
            action={{ label: 'Thêm quy tắc', onClick: () => setModalOpen(true) }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <div className="px-4 py-2 text-xs text-neutral-500 border-b bg-neutral-50/80">
            {filteredRows.length} quy tắc
            {warehouseId || category ? ' (đã lọc)' : ''}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-left">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filteredRows.length && filteredRows.length > 0}
                    onChange={toggleAll}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Kho</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3 text-right">Min</th>
                <th className="p-3 text-right">Max</th>
                <th className="p-3 text-right">SL đặt lại</th>
                <th className="p-3 text-center">TT</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-neutral-800">{row.productName || '—'}</div>
                    <div className="text-[11px] font-mono text-neutral-400">{row.productCode}</div>
                  </td>
                  <td className="p-3">{row.warehouseName || '—'}</td>
                  <td className="p-3 text-xs text-neutral-500">{row.categoryName || '—'}</td>
                  <td className="p-3 text-right">
                    <InlineQty
                      value={row.minQty}
                      onCommit={(n) => {
                        if (n > row.maxQty) {
                          toast.error('Min phải ≤ Max')
                          return
                        }
                        update.mutate({ id: row.id, body: { minQty: n } })
                      }}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <InlineQty
                      value={row.maxQty}
                      onCommit={(n) => {
                        if (n < row.minQty) {
                          toast.error('Max phải ≥ Min')
                          return
                        }
                        update.mutate({ id: row.id, body: { maxQty: n } })
                      }}
                    />
                  </td>
                  <td className="p-3 text-right tabular-nums font-medium">
                    {row.reorderQty ?? '—'}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        row.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      {row.active ? 'ON' : 'OFF'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        description="Upload file .xlsx / .csv theo template đã tải."
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
          setSelected(new Set())
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
