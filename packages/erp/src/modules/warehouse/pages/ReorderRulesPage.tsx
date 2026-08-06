// ============================================================
// ReorderRulesPage — quy tắc tái nhập kho (WarehouseListShell)
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Upload, Download, Trash2, FileDown, Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, AppModal, ConfirmDialog, Switch } from '@frezo/ui'
import { downloadCsv } from '@/lib/export/toCsv'
import type { AppTableColumn, BulkAction } from '@/components/ui/AppTable'
import {
  useReorderRules, useCreateReorderRule, useUpdateReorderRule,
  useDeleteReorderRule, useImportReorderRules,
} from '../hooks/useReorderRules'
import { useWarehouseFilters } from '../hooks/useWarehouseFilters'
import { REORDER_RULES_GUIDE } from '../constants/reorder-rules.guide'
import { warehouseSelectLabel } from '../utils/displayUtils'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { WarehouseFilterBar } from '../components/WarehouseFilterBar'
import { WarehouseSelect } from '../components/WarehouseSelect'
import { ProductCombobox } from '../components/ProductCombobox'
import { useProducts } from '@/modules/products/hooks/useProduct'
import type { ReorderRuleDto, ReorderRuleRequest } from '../types'

export function ReorderRulesPage() {
  const nav = useNavigate()
  const filters = useWarehouseFilters()
  const { data: productsRaw } = useProducts()
  const products = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    return Array.isArray(list) ? list : []
  }, [productsRaw])
  const [category, setCategory] = useState('')
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useReorderRules(filters.warehouseId || undefined)
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

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => r.categoryName && set.add(r.categoryName))
    return Array.from(set).sort()
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!category) return rows
    return rows.filter((r) => r.categoryName === category)
  }, [rows, category])

  const stats = useMemo(() => {
    return [
      { label: 'Tổng quy tắc', value: rows.length },
      { label: 'Đang bật', value: rows.filter((r) => r.active).length },
      { label: 'Tắt', value: rows.filter((r) => !r.active).length },
    ]
  }, [rows])

  const hasActiveFilters = Boolean(filters.warehouseId || category)

  const clearFilters = () => {
    filters.clearFilters()
    setCategory('')
  }

  const exportCsv = (items: ReorderRuleDto[]) => {
    downloadCsv(`reorder-rules-${new Date().toISOString().slice(0, 10)}`, items, [
      { header: 'Mã SP', accessor: 'productCode' },
      { header: 'Tên SP', accessor: 'productName' },
      { header: 'Kho', accessor: 'warehouseName' },
      { header: 'Min', accessor: 'minQty' },
      { header: 'Max', accessor: 'maxQty' },
      { header: 'SL đặt lại', accessor: 'reorderQty' },
      { header: 'Đang bật', accessor: (r) => (r.active ? 'YES' : 'NO') },
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
          warehouseId: filters.warehouseId || '',
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

  const columns: AppTableColumn<ReorderRuleDto>[] = [
    {
      key: 'product',
      title: 'Sản phẩm',
      render: (_, row) => (
        <div>
          <div className="font-medium text-neutral-800">{row.productName || '—'}</div>
          <div className="text-[11px] font-mono text-neutral-400">{row.productCode}</div>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, row) => row.warehouseName || '—',
    },
    {
      key: 'category',
      title: 'Danh mục',
      render: (_, row) => (
        <span className="text-xs text-neutral-500">{row.categoryName || '—'}</span>
      ),
    },
    {
      key: 'min',
      title: 'Min',
      align: 'right',
      render: (_, row) => (
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
      ),
    },
    {
      key: 'max',
      title: 'Max',
      align: 'right',
      render: (_, row) => (
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
      ),
    },
    {
      key: 'reorderQty',
      title: 'SL đặt lại',
      align: 'right',
      render: (_, row) => (
        <span className="tabular-nums font-medium">{row.reorderQty ?? '—'}</span>
      ),
    },
    {
      key: 'active',
      title: 'Bật',
      align: 'center',
      width: 72,
      render: (_, row) => (
        <Switch
          checked={row.active}
          disabled={update.isPending}
          onChange={(active) => update.mutate({ id: row.id, body: { active } })}
        />
      ),
    },
  ]

  const bulkActions: BulkAction<ReorderRuleDto>[] = [
    {
      key: 'export',
      label: 'Xuất CSV',
      icon: FileDown,
      onClick: (selected) => exportCsv(selected),
    },
    {
      key: 'delete',
      label: 'Xoá',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) => setConfirmBulk(selected),
    },
  ]

  return (
    <WarehouseListShell
      title="Quy tắc tái nhập"
      description="Đặt ngưỡng min/max tồn kho — hệ thống cảnh báo khi dưới min."
      guide={REORDER_RULES_GUIDE}
      headerActions={
        <>
          <Button variant="outline" onClick={() => nav('/warehouse/stock-alerts')}>
            Cảnh báo tồn
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={downloadTemplate}>
            <Download size={14} /> Tải mẫu
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <Upload size={14} /> Nhập Excel
          </Button>
          <Button
            className="gap-1.5 shadow-sm"
            onClick={() => {
              setForm((f) => ({
                ...f,
                warehouseId: filters.warehouseId || filters.warehouses[0]?.id || '',
              }))
              setModalOpen(true)
            }}
          >
            <Plus size={14} /> Thêm quy tắc
          </Button>
        </>
      }
      stats={stats}
      filterBar={
        <WarehouseFilterBar
          selects={[
            {
              id: 'warehouse',
              label: 'Lọc theo kho',
              value: filters.warehouseId,
              onChange: (v) => {
                filters.setWarehouseId(v)
                setCategory('')
              },
              options: [
                { value: '', label: 'Tất cả kho' },
                ...filters.warehouses.map((w) => ({
                  value: w.id,
                  label: warehouseSelectLabel(w),
                })),
              ],
            },
            ...(categories.length > 0
              ? [
                  {
                    id: 'category',
                    label: 'Danh mục',
                    value: category,
                    onChange: setCategory,
                    options: [
                      { value: '', label: 'Tất cả danh mục' },
                      ...categories.map((c) => ({ value: c, label: c })),
                    ],
                  },
                ]
              : []),
          ]}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          countLabel={`${filteredRows.length} quy tắc${hasActiveFilters ? ' (đã lọc)' : ''}`}
        />
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isFetching={isFetching}
      onRetry={refetch}
      errorTitle="Không tải được quy tắc tái nhập"
      totalCount={rows.length}
      filteredCount={filteredRows.length}
      emptyIcon={Package}
      emptyTitle="Chưa có quy tắc tái nhập"
      emptyDescription="Thêm thủ công hoặc nhập Excel từ mẫu đã tải."
      emptyAction={{
        label: 'Thêm quy tắc',
        onClick: () => {
          setForm((f) => ({
            ...f,
            warehouseId: filters.warehouseId || filters.warehouses[0]?.id || '',
          }))
          setModalOpen(true)
        },
      }}
      filteredEmptyTitle="Không có quy tắc phù hợp bộ lọc"
      filteredEmptyDescription="Thử chọn kho / danh mục khác hoặc bấm Thêm quy tắc."
      columns={columns}
      data={filteredRows}
      onRefresh={refetch}
      selectable
      getRowId={(r) => r.id}
      bulkActions={bulkActions}
    >
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm quy tắc tái nhập"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <Field label="Kho *">
            <WarehouseSelect
              warehouses={filters.warehouses}
              value={form.warehouseId}
              onChange={(v) => setForm({ ...form, warehouseId: v })}
              placeholder="— Chọn kho —"
              aria-label="Kho"
            />
          </Field>
          <Field label="Sản phẩm *">
            <ProductCombobox
              products={products}
              value={form.productId}
              onChange={(v) => setForm({ ...form, productId: v })}
              placeholder="Tìm mã / tên SP…"
              aria-label="Sản phẩm"
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
        title="Nhập Excel quy tắc"
        description="Tải lên file .xlsx / .csv theo mẫu đã tải."
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
    </WarehouseListShell>
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
      {busy && <p className="text-xs text-center text-neutral-500">Đang nhập…</p>}
    </div>
  )
}
