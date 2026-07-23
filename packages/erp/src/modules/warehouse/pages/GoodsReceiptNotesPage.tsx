// ============================================================
// GoodsReceiptNotesPage — danh sách PNK (GRN)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackagePlus, Loader2, Plus, CheckCircle2 } from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  AppModal,
  ConfirmDialog,
} from '@frezo/ui'
import { useWarehouses } from '../hooks/useReorderRules'
import { useGrns, useCreateGrn, useConfirmGrn } from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import type { GrnDto } from '../services/grnApi'

function parseLines(raw: string) {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [productId, qtyStr, costStr] = line.split(/[,;\t]/).map((x) => x.trim())
      return {
        productId,
        qtyExpected: Number(qtyStr || 1),
        unitCost: costStr ? Number(costStr) : undefined,
      }
    })
    .filter((x) => x.productId)
}

export function GoodsReceiptNotesPage() {
  const nav = useNavigate()
  const [status, setStatus] = useState('')
  const { data: list = [], isLoading, isError, isFetching, refetch } = useGrns(
    status ? { status } : undefined,
  )
  const { data: warehouses = [] } = useWarehouses()
  const create = useCreateGrn()
  const confirm = useConfirmGrn()
  const canCreate = usePermission('WAREHOUSE.GRN.CREATE')
  const canUpdate = usePermission('WAREHOUSE.GRN.UPDATE')

  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [purchaseOrderId, setPurchaseOrderId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [note, setNote] = useState('')
  const [linesRaw, setLinesRaw] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<GrnDto | null>(null)

  const warehouseOptions = useMemo(
    () => warehouses as { id: string; name?: string }[],
    [warehouses],
  )

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Phiếu nhập kho (PNK)"
        description="Tạo / xác nhận GRN — cập nhật tồn kho khi Confirm."
        actions={
          <div className="flex gap-2 items-center">
            <select
              className="border rounded-md px-2 py-1.5 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <Button
              variant="outline"
              onClick={() => nav('/warehouse/purchase-orders')}
            >
              Từ PO
            </Button>
            {canCreate && (
              <Button className="gap-1.5" onClick={() => setOpen(true)}>
                <Plus size={14} /> Tạo PNK
              </Button>
            )}
          </div>
        }
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được phiếu nhập kho"
            message="Kiểm tra /warehouse/grn và quyền WAREHOUSE.GRN.VIEW."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={PackagePlus}
            title="Chưa có phiếu nhập kho"
            description="Tạo PNK tay hoặc nhận hàng từ PO đã Confirm."
            action={
              canCreate
                ? { label: 'Tạo PNK', onClick: () => setOpen(true) }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-left">
              <tr>
                <th className="p-3">Mã</th>
                <th className="p-3">Kho</th>
                <th className="p-3">PO</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((grn) => {
                const st = (grn.status || '').toUpperCase()
                return (
                  <tr key={grn.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono text-xs">
                      <button
                        type="button"
                        className="text-primary-700 hover:underline"
                        onClick={() => nav(`/warehouse/grn/${grn.id}`)}
                      >
                        {grn.grnCode || grn.id}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{grn.warehouseId}</td>
                    <td className="p-3 font-mono text-xs">
                      {grn.purchaseOrderId || '—'}
                    </td>
                    <td className="p-3 tabular-nums">{grn.items?.length || 0}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
                        {grn.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => nav(`/warehouse/grn/${grn.id}`)}
                      >
                        Chi tiết
                      </Button>
                      {st === 'DRAFT' && canUpdate && (
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={confirm.isPending}
                          onClick={() => setConfirmTarget(grn)}
                        >
                          <CheckCircle2 size={12} /> Confirm
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo phiếu nhập kho">
        <div className="space-y-3">
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">— Kho —</option>
            {warehouseOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || w.id}
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="PO ID (tuỳ chọn)"
            value={purchaseOrderId}
            onChange={(e) => setPurchaseOrderId(e.target.value)}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Supplier ID (tuỳ chọn)"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
          <textarea
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder={'Mỗi dòng: productId,qtyExpected,unitCost\nvd: prod-1,10,15000'}
            value={linesRaw}
            onChange={(e) => setLinesRaw(e.target.value)}
          />
          <textarea
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Ghi chú"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!warehouseId || !linesRaw.trim() || create.isPending}
              onClick={() => {
                const items = parseLines(linesRaw)
                if (items.length === 0) return
                create.mutate(
                  {
                    warehouseId,
                    purchaseOrderId: purchaseOrderId || undefined,
                    supplierId: supplierId || undefined,
                    note: note || undefined,
                    items,
                  },
                  {
                    onSuccess: (grn) => {
                      setOpen(false)
                      if (grn?.id) nav(`/warehouse/grn/${grn.id}`)
                    },
                  },
                )
              }}
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return
          confirm.mutate(
            { id: confirmTarget.id },
            { onSuccess: () => setConfirmTarget(null) },
          )
        }}
        title={`Confirm PNK ${confirmTarget?.grnCode || confirmTarget?.id || ''}?`}
        message="Xác nhận sẽ ghi sổ tồn kho (stock ledger / balances)."
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />
    </div>
  )
}
