// ============================================================
// GoodsIssueNotesPage — danh sách PXK (GIN)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageMinus, Loader2, Plus, CheckCircle2 } from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  AppModal,
  ConfirmDialog,
} from '@frezo/ui'
import { useWarehouses } from '../hooks/useReorderRules'
import { useGins, useCreateGin, useConfirmGin } from '../hooks/useGin'
import { usePermission } from '@/lib/hooks/usePermission'
import type { GinDto } from '../services/ginApi'

function parseLines(raw: string) {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [productId, qtyStr, costStr] = line.split(/[,;\t]/).map((x) => x.trim())
      return {
        productId,
        qtyRequested: Number(qtyStr || 1),
        unitCost: costStr ? Number(costStr) : undefined,
      }
    })
    .filter((x) => x.productId)
}

export function GoodsIssueNotesPage() {
  const nav = useNavigate()
  const [status, setStatus] = useState('')
  const { data: list = [], isLoading, isError, isFetching, refetch } = useGins(
    status ? { status } : undefined,
  )
  const { data: warehouses = [] } = useWarehouses()
  const create = useCreateGin()
  const confirm = useConfirmGin()
  const canCreate = usePermission('WAREHOUSE.GIN.CREATE')
  const canUpdate = usePermission('WAREHOUSE.GIN.UPDATE')

  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [issueType, setIssueType] = useState('SALE')
  const [note, setNote] = useState('')
  const [linesRaw, setLinesRaw] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<GinDto | null>(null)

  const warehouseOptions = useMemo(
    () => warehouses as { id: string; name?: string }[],
    [warehouses],
  )

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Phiếu xuất kho (PXK)"
        description="Tạo / xác nhận GIN — trừ tồn khi Confirm."
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
            {canCreate && (
              <Button className="gap-1.5" onClick={() => setOpen(true)}>
                <Plus size={14} /> Tạo PXK
              </Button>
            )}
          </div>
        }
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được phiếu xuất kho"
            message="Kiểm tra /warehouse/gin và quyền WAREHOUSE.GIN.VIEW."
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
            icon={PackageMinus}
            title="Chưa có phiếu xuất kho"
            description="Tạo PXK với danh sách sản phẩm cần xuất."
            action={
              canCreate
                ? { label: 'Tạo PXK', onClick: () => setOpen(true) }
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
                <th className="p-3">Loại</th>
                <th className="p-3">Lines</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((gin) => {
                const st = (gin.status || '').toUpperCase()
                return (
                  <tr key={gin.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-mono text-xs">
                      <button
                        type="button"
                        className="text-primary-700 hover:underline"
                        onClick={() => nav(`/warehouse/gin/${gin.id}`)}
                      >
                        {gin.ginCode || gin.id}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{gin.warehouseId}</td>
                    <td className="p-3">{gin.issueType || '—'}</td>
                    <td className="p-3 tabular-nums">{gin.items?.length || 0}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
                        {gin.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => nav(`/warehouse/gin/${gin.id}`)}
                      >
                        Chi tiết
                      </Button>
                      {st === 'DRAFT' && canUpdate && (
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={confirm.isPending}
                          onClick={() => setConfirmTarget(gin)}
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

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo phiếu xuất kho">
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
            placeholder="Customer ID (tuỳ chọn)"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
          >
            <option value="SALE">SALE</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="OTHER">OTHER</option>
          </select>
          <textarea
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder={'Mỗi dòng: productId,qtyRequested,unitCost\nvd: prod-1,5,15000'}
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
                    customerId: customerId || undefined,
                    issueType: issueType || undefined,
                    note: note || undefined,
                    items,
                  },
                  {
                    onSuccess: (gin) => {
                      setOpen(false)
                      if (gin?.id) nav(`/warehouse/gin/${gin.id}`)
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
        title={`Confirm PXK ${confirmTarget?.ginCode || confirmTarget?.id || ''}?`}
        message="Xác nhận sẽ trừ tồn kho (stock ledger / balances)."
        confirmText="Confirm"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />
    </div>
  )
}
