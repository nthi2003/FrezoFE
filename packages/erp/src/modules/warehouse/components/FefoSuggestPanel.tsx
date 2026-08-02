// ============================================================
// FefoSuggestPanel — gợi ý lô xuất theo HSD
// ============================================================

import { Loader2 } from 'lucide-react'
import { Button } from '@frezo/ui'
import { useFefoSuggest } from '../hooks/useBatches'
import type { FefoBatchSuggestion } from '../services/batchApi'

interface FefoSuggestPanelProps {
  warehouseId: string
  productId: string
  qty: number
  selectedBatchId?: string
  onSelectBatch: (batchId: string) => void
  onApplyFefo: (suggestions: FefoBatchSuggestion[]) => void
}

export function FefoSuggestPanel({
  warehouseId,
  productId,
  qty,
  selectedBatchId,
  onSelectBatch,
  onApplyFefo,
}: FefoSuggestPanelProps) {
  const { data, isLoading, isError } = useFefoSuggest(
    warehouseId,
    productId,
    qty,
  )

  if (qty <= 0) {
    return (
      <p className="text-xs text-neutral-500 px-1">
        Nhập SL xuất để xem gợi ý FEFO.
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang quét lô…
      </div>
    )
  }

  if (isError || !data?.suggestions?.length) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
        Không có lô tồn cho SP này tại kho.
      </p>
    )
  }

  const suggestions = data.suggestions
  const allocated = data.allocatedQty ?? 0
  const ok = allocated >= qty

  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sky-900">
          Gợi ý lô FEFO (hạn gần nhất trước)
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onApplyFefo(suggestions)}
        >
          Áp dụng FEFO
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-neutral-500">
            <tr>
              <th className="py-1 pr-2">Chọn</th>
              <th className="py-1 pr-2">Mã lô</th>
              <th className="py-1 pr-2">HSD</th>
              <th className="py-1 pr-2 text-right">Tồn</th>
              <th className="py-1 pr-2 text-right">Gợi ý</th>
              <th className="py-1">Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.batchId} className="border-t border-sky-100">
                <td className="py-1.5 pr-2">
                  <input
                    type="radio"
                    name={`fefo-${productId}`}
                    checked={selectedBatchId === s.batchId}
                    onChange={() => onSelectBatch(s.batchId)}
                  />
                </td>
                <td className="py-1.5 pr-2 font-mono">{s.batchCode}</td>
                <td className="py-1.5 pr-2">{s.expiryDate || '—'}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">
                  {s.qtyAvailable}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums font-medium">
                  {s.suggestedQty}
                </td>
                <td className="py-1.5">
                  {s.expiryWarning ? (
                    <span className="text-rose-700 font-medium">
                      {s.expiryWarning}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`tabular-nums ${ok ? 'text-emerald-700' : 'text-amber-800'}`}>
        Tổng phân bổ: {allocated} / {qty} {ok ? '✓' : '— thiếu tồn lô'}
      </p>
    </div>
  )
}
