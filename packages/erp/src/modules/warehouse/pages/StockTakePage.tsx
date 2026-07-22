// ============================================================
// StockTakePage — create → start → submit-counted → post-variance
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, ClipboardCheck, Loader2, Play, Send, Scale } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState } from '@frezo/ui'
import { useWarehouses } from '../hooks/useReorderRules'
import {
  useStockTakes,
  useCreateStockTake,
  useStartStockTake,
  useSubmitCounted,
  usePostVariance,
} from '../hooks/useStockTake'
import type { StockTakeDto } from '../services/stockTakeApi'

function StockTakeCard({ st }: { st: StockTakeDto }) {
  const start = useStartStockTake()
  const submit = useSubmitCounted()
  const postVar = usePostVariance()
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const ln of st.lines || []) {
      const key = ln.id || ln.productId
      init[key] = ln.countedQty != null ? String(ln.countedQty) : ''
    }
    return init
  })

  const status = (st.status || '').toUpperCase()
  const canStart = status === 'DRAFT'
  const canCount = status === 'IN_PROGRESS' || status === 'DRAFT'
  const canPost = status === 'SUBMITTED'

  const onSubmitCounted = () => {
    const lines = (st.lines || []).map((ln) => {
      const key = ln.id || ln.productId
      return {
        id: ln.id,
        productId: ln.productId,
        countedQty: Number(drafts[key] || 0),
      }
    })
    submit.mutate({ id: st.id, lines })
  }

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="font-semibold text-neutral-900">{st.code || st.id}</div>
          <p className="text-xs text-neutral-500">
            Kho {st.warehouseId} · {st.status}
            {st.takeDate ? ` · ${st.takeDate}` : ''}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {canStart && (
            <Button
              size="sm"
              className="gap-1"
              disabled={start.isPending}
              onClick={() => start.mutate(st.id)}
            >
              <Play size={12} /> Start
            </Button>
          )}
          {canCount && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={submit.isPending}
              onClick={onSubmitCounted}
            >
              <Send size={12} /> Submit counted
            </Button>
          )}
          {canPost && (
            <Button
              size="sm"
              className="gap-1"
              disabled={postVar.isPending}
              onClick={() => postVar.mutate(st.id)}
            >
              <Scale size={12} /> Post variance
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 border-b">
              <th className="py-1.5 pr-2">Product</th>
              <th className="py-1.5 pr-2 text-right">Hệ thống</th>
              <th className="py-1.5 pr-2 text-right">Đếm</th>
              <th className="py-1.5 text-right">Variance</th>
            </tr>
          </thead>
          <tbody>
            {(st.lines || []).map((ln) => {
              const key = ln.id || ln.productId
              const variance = ln.varianceQty
              return (
                <tr key={key} className="border-b border-neutral-50">
                  <td className="py-1.5 pr-2 font-mono text-xs">{ln.productId}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">
                    {ln.systemQty ?? '—'}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    {canCount ? (
                      <input
                        type="number"
                        className="w-24 border rounded px-2 py-1 text-sm tabular-nums"
                        value={drafts[key] ?? ''}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [key]: e.target.value }))
                        }
                      />
                    ) : (
                      <span className="tabular-nums">{ln.countedQty ?? '—'}</span>
                    )}
                  </td>
                  <td
                    className={`py-1.5 text-right tabular-nums font-medium ${
                      variance == null
                        ? 'text-neutral-400'
                        : variance === 0
                          ? 'text-emerald-600'
                          : Number(variance) > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                    }`}
                  >
                    {variance == null
                      ? '—'
                      : Number(variance) > 0
                        ? `+${variance}`
                        : variance}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function StockTakePage() {
  const { data: list = [], isLoading } = useStockTakes()
  const { data: warehouses = [] } = useWarehouses()
  const create = useCreateStockTake()
  const [open, setOpen] = useState(false)
  const [warehouseId, setWarehouseId] = useState('')
  const [note, setNote] = useState('')
  const [productIds, setProductIds] = useState('')

  const warehouseOptions = useMemo(
    () => warehouses as { id: string; name?: string }[],
    [warehouses],
  )

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Kiểm kê kho"
        description="Tạo phiếu → Start → Submit counted → Post variance."
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus size={14} /> Phiếu mới
          </Button>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={ClipboardCheck}
            title="Chưa có phiếu kiểm kê"
            description="Tạo phiếu với danh sách productId."
            action={{ label: 'Tạo phiếu', onClick: () => setOpen(true) }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((st) => (
            <StockTakeCard key={st.id} st={st} />
          ))}
        </div>
      )}

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo phiếu kiểm kê">
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
          <textarea
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Product IDs (mỗi dòng hoặc cách nhau bởi dấu phẩy)"
            value={productIds}
            onChange={(e) => setProductIds(e.target.value)}
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
              disabled={!warehouseId || !productIds.trim() || create.isPending}
              onClick={() => {
                const lines = productIds
                  .split(/[\n,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((productId) => ({ productId }))
                if (lines.length === 0) return
                create.mutate(
                  {
                    warehouseId,
                    note: note || undefined,
                    lines,
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }}
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
