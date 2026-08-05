// ============================================================
// ShrinkagePage — ghi nhận hao hụt SHRINK/DAMAGE/EXPIRED
// ============================================================

import { useMemo, useState } from 'react'
import { Scale, Plus, CheckCircle2 } from 'lucide-react'
import { Button, ConfirmDialog, RowActions, Select } from '@frezo/ui'
import { useProducts } from '@/modules/products/hooks/useProduct'
import { WarehouseListShell } from '../components/WarehouseListShell'
import { ProductCombobox } from '../components/ProductCombobox'
import { WarehouseSelect } from '../components/WarehouseSelect'
import { SHRINKAGE_GUIDE } from '../constants/shrinkage.guide'
import { useWarehouses } from '../hooks/useReorderRules'
import {
  useShrinkageList,
  useConfirmShrinkage,
} from '../hooks/useShrinkage'
import { useBatches } from '../hooks/useBatches'
import { shrinkageApi } from '../services/shrinkageApi'
import type { ShrinkageDto } from '../services/shrinkageApi'
import type { AppTableColumn } from '@/components/ui/AppTable'

const REASONS = [
  { value: 'SHRINK', label: 'SHRINK — Co hụt' },
  { value: 'DAMAGE', label: 'DAMAGE — Dập/hỏng' },
  { value: 'EXPIRED', label: 'EXPIRED — Quá hạn' },
] as const

export function ShrinkagePage() {
  const [warehouseId, setWarehouseId] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { data: warehouses = [] } = useWarehouses()
  const { data: rows = [], isLoading, isError, refetch, isFetching } =
    useShrinkageList(warehouseId ? { warehouseId } : undefined)

  const warehouseList = Array.isArray(warehouses) ? warehouses : []
  const shrinkageRows = Array.isArray(rows) ? rows : []

  const [showForm, setShowForm] = useState(false)

  const columns: AppTableColumn<ShrinkageDto>[] = [
    {
      key: 'code',
      title: 'Mã phiếu',
      render: (_, r) => (
        <span className="font-mono text-xs text-primary-700">
          {r?.shrinkageCode || r?.id?.slice(0, 8) || '—'}
        </span>
      ),
    },
    {
      key: 'warehouse',
      title: 'Kho',
      render: (_, r) => r?.warehouseName || r?.warehouseId || '—',
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, r) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            r?.status === 'CONFIRMED'
              ? 'bg-emerald-50 text-emerald-700'
              : r?.status === 'DRAFT'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {r?.status || '—'}
        </span>
      ),
    },
    {
      key: 'lines',
      title: 'Dòng',
      render: (_, r) => r?.lines?.length ?? 0,
    },
    {
      key: 'actions',
      title: '',
      render: (_, r) => (
        <RowActions
          actions={[
            {
              key: 'confirm',
              icon: CheckCircle2,
              tooltip: 'Xác nhận',
              tone: 'emerald',
              hidden: !(r?.status === 'DRAFT' && r?.id),
              onClick: () => {
                if (r?.id) setConfirmId(r.id)
              },
            },
          ]}
        />
      ),
    },
  ]

  const confirmShrinkage = useConfirmShrinkage()

  return (
    <>
      <WarehouseListShell
        title="Ghi nhận hao hụt"
        description="SHRINK / DAMAGE / EXPIRED — trừ tồn lô, không qua GIN bán."
        guide={SHRINKAGE_GUIDE}
        headerActions={
          <Button className="gap-1" onClick={() => setShowForm((v) => !v)}>
            <Plus size={14} /> {showForm ? 'Đóng form' : 'Ghi hao hụt'}
          </Button>
        }
        filterBar={
          <div className="min-w-[180px]">
            <WarehouseSelect
              warehouses={warehouseList}
              value={warehouseId}
              onChange={setWarehouseId}
              emptyOption={{ label: 'Tất cả kho' }}
              placeholder="Tất cả kho"
              showSearch={warehouseList.length > 8}
              aria-label="Lọc theo kho"
            />
          </div>
        }
        isLoading={isLoading}
        isError={isError}
        isFetching={isFetching}
        onRetry={() => void refetch()}
        totalCount={shrinkageRows.length}
        emptyIcon={Scale}
        emptyTitle="Chưa có phiếu hao hụt"
        emptyDescription="Bấm Ghi hao hụt để ghi nhận co hụt, dập hoặc quá hạn."
        columns={columns}
        data={shrinkageRows}
        onRefresh={() => void refetch()}
      >
        {showForm && <ShrinkageCreateForm onDone={() => setShowForm(false)} />}
      </WarehouseListShell>

      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => !confirmShrinkage.isPending && setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return
          confirmShrinkage.mutate(confirmId, {
            onSettled: () => setConfirmId(null),
          })
        }}
        title="Ghi nhận hao hụt?"
        message="Trừ tồn lô và stock_balance. Thao tác không tự hoàn tác."
        confirmText="Ghi nhận hao hụt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirmShrinkage.isPending}
      />
    </>
  )
}

function ShrinkageCreateForm({ onDone }: { onDone: () => void }) {
  const { data: warehouses = [] } = useWarehouses()
  const { data: productsRaw } = useProducts()
  const confirmShrinkage = useConfirmShrinkage()
  const [submitting, setSubmitting] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [productId, setProductId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [reason, setReason] = useState<string>('SHRINK')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: batches = [] } = useBatches(
    warehouseId && productId ? { warehouseId, productId } : undefined,
  )

  const warehouseList = Array.isArray(warehouses) ? warehouses : []

  const productOptions = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    return Array.isArray(list) ? list : []
  }, [productsRaw])

  const availableBatches = (Array.isArray(batches) ? batches : []).filter(
    (b) => (b?.qtyOnHand ?? 0) > 0 && b?.status === 'ACTIVE',
  )

  const selectedBatch = availableBatches.find((b) => b.id === batchId)

  const handleSubmit = async () => {
    if (!warehouseId || !productId || !batchId || !qty) return
    setSubmitting(true)
    try {
      const draft = await shrinkageApi.create({
        warehouseId,
        note: note || undefined,
        lines: [
          {
            batchId,
            productId,
            reason,
            qty: Number(qty),
            note: note || undefined,
          },
        ],
      })
      await confirmShrinkage.mutateAsync(draft.id)
      setConfirmOpen(false)
      onDone()
    } catch {
      /* toast handled in hooks */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border rounded-xl bg-white p-4 space-y-3 mt-2">
      <h3 className="text-sm font-semibold text-neutral-800">Form ghi hao hụt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <label className="space-y-1">
          <span className="text-xs text-neutral-500">Kho *</span>
          <WarehouseSelect
            warehouses={warehouseList}
            value={warehouseId}
            onChange={(v) => {
              setWarehouseId(v)
              setBatchId('')
            }}
            placeholder="Chọn kho"
            aria-label="Kho"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-neutral-500">Sản phẩm *</span>
          <ProductCombobox
            products={productOptions}
            value={productId}
            onChange={(v) => {
              setProductId(v)
              setBatchId('')
            }}
            placeholder="Chọn SP"
            aria-label="Sản phẩm"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-neutral-500">Mã lô *</span>
          <Select
            options={[
              {
                value: '',
                label:
                  availableBatches.length === 0
                    ? 'Không có lô tồn tại kho này'
                    : 'Chọn lô',
              },
              ...availableBatches.map((b) => ({
                value: b.id,
                label: `${b?.batchCode || '—'} · HSD ${b?.expiryDate || '—'} · Tồn ${b?.qtyOnHand ?? 0}`,
              })),
            ]}
            value={batchId}
            onChange={setBatchId}
            placeholder={
              !warehouseId || !productId
                ? 'Chọn kho và SP trước'
                : availableBatches.length === 0
                  ? 'Không có lô tồn'
                  : 'Chọn lô'
            }
            showSearch={availableBatches.length > 8}
            aria-label="Mã lô"
          />
        </label>
        <fieldset className="md:col-span-2 space-y-1">
          <span className="text-xs text-neutral-500">Loại hao hụt *</span>
          <div className="flex flex-wrap gap-3">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="space-y-1">
          <span className="text-xs text-neutral-500">Số lượng *</span>
          <input
            type="number"
            min={0}
            max={selectedBatch?.qtyOnHand}
            className="w-full border rounded-md px-3 py-2 tabular-nums"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-neutral-500">Ghi chú</span>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
      {selectedBatch && qty && (
        <p className="text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">
          Sau khi ghi nhận: lô {selectedBatch.batchCode}:{' '}
          {selectedBatch.qtyOnHand} →{' '}
          {(selectedBatch.qtyOnHand ?? 0) - Number(qty)} (−{qty})
        </p>
      )}
      <div className="flex gap-2">
        <Button
          className="gap-1"
          disabled={!warehouseId || !batchId || !qty || submitting}
          onClick={() => setConfirmOpen(true)}
        >
          <CheckCircle2 size={14} /> Ghi nhận hao hụt
        </Button>
        <Button variant="outline" onClick={onDone}>
          Huỷ
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Ghi nhận hao hụt?"
        message={`Trừ ${qty} khỏi lô ${selectedBatch?.batchCode || ''}. Tiếp tục?`}
        confirmText="Ghi nhận"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submitting}
      />
    </div>
  )
}
