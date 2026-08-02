import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { LineChart as LineChartIcon, Loader2, Package } from 'lucide-react'
import { AppModal, EmptyState, ErrorState, Button } from '@frezo/ui'
import { formatCurrency } from '@frezo/utils'
import { grnApi, type ProductPriceHistoryPoint } from '@/modules/warehouse/services/grnApi'
import { productApi } from '../services/productApi'

export interface ProductPriceHistoryModalProps {
  product: { id: string; name?: string; code?: string } | null
  open: boolean
  onClose: () => void
}

type ChartPoint = {
  dateLabel: string
  dateSort: number
  unitCost: number
  sourceLabel: string
  detail?: string
}

function formatDateLabel(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Modal biến động giá nhập NCC — line chart từ GRN unit_cost + lô nhập (batch cost).
 */
export function ProductPriceHistoryModal({ product, open, onClose }: ProductPriceHistoryModalProps) {
  const productId = product?.id

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['product-price-history', productId],
    enabled: open && !!productId,
    queryFn: async (): Promise<ChartPoint[]> => {
      if (!productId) return []
      const [grnPoints, batchRes] = await Promise.all([
        grnApi.getProductPriceHistory(productId).catch(() => [] as ProductPriceHistoryPoint[]),
        productApi.getCostHistory(productId).catch(() => ({ data: [] as any[] })),
      ])
      const batchPoints = Array.isArray(batchRes?.data) ? batchRes.data : []

      const merged: ChartPoint[] = []

      for (const p of grnPoints || []) {
        if (p.unitCost == null || !p.date) continue
        const t = new Date(p.date).getTime()
        if (Number.isNaN(t)) continue
        merged.push({
          dateLabel: formatDateLabel(p.date),
          dateSort: t,
          unitCost: Number(p.unitCost),
          sourceLabel: p.supplierName || p.grnCode || 'PNK',
          detail: [p.grnCode, p.supplierName].filter(Boolean).join(' · '),
        })
      }

      for (const p of batchPoints) {
        if (p.unitCost == null || !p.date) continue
        const t = new Date(p.date).getTime()
        if (Number.isNaN(t)) continue
        merged.push({
          dateLabel: formatDateLabel(p.date),
          dateSort: t,
          unitCost: Number(p.unitCost),
          sourceLabel: p.batchCode || 'Lô nhập',
          detail: p.batchCode ? `Lô ${p.batchCode}` : 'Nhập kho nhanh',
        })
      }

      return merged.sort((a, b) => a.dateSort - b.dateSort)
    },
  })

  const chartData = data ?? []

  const summary = useMemo(() => {
    if (!chartData.length) return null
    const costs = chartData.map((d) => d.unitCost)
    const min = Math.min(...costs)
    const max = Math.max(...costs)
    const latest = chartData[chartData.length - 1]
    const first = chartData[0]
    const delta = latest.unitCost - first.unitCost
    const deltaPct = first.unitCost ? (delta / first.unitCost) * 100 : 0
    return { min, max, latest: latest.unitCost, delta, deltaPct, count: chartData.length }
  }, [chartData])

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Biến động giá nhập"
      description={
        product
          ? `${product.name || 'Sản phẩm'}${product.code ? ` · ${product.code}` : ''} — giá từ phiếu nhập NCC / lô nhập`
          : undefined
      }
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center text-neutral-400 gap-2 text-sm">
            <Loader2 size={18} className="animate-spin text-primary-500" />
            Đang tải lịch sử giá…
          </div>
        ) : isError ? (
          <ErrorState
            title="Không tải được biến động giá"
            message="Lỗi mạng hoặc máy chủ. Thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Chưa có lịch sử giá nhập"
            description="Giá biến động lấy từ đơn giá trên phiếu nhập kho (PNK) hoặc lô nhập NCC. Khi có phiếu nhập cho sản phẩm này, biểu đồ sẽ hiện tại đây."
          />
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCell label="Điểm dữ liệu" value={String(summary.count)} />
                <SummaryCell label="Thấp nhất" value={formatCurrency(summary.min)} />
                <SummaryCell label="Cao nhất" value={formatCurrency(summary.max)} />
                <SummaryCell
                  label="Gần nhất"
                  value={formatCurrency(summary.latest)}
                  hint={
                    summary.delta === 0
                      ? 'Không đổi so với lần đầu'
                      : `${summary.delta > 0 ? '+' : ''}${formatCurrency(summary.delta)} (${summary.deltaPct >= 0 ? '+' : ''}${summary.deltaPct.toFixed(1)}%)`
                  }
                />
              </div>
            )}

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-neutral-800">
                <LineChartIcon size={16} className="text-neutral-500" />
                Giá nhập theo thời gian
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      dy={8}
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}Tr`
                          : v >= 1_000
                            ? `${(v / 1_000).toFixed(0)}k`
                            : String(v)
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Giá nhập']}
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as ChartPoint | undefined
                        return row?.detail || row?.dateLabel || ''
                      }}
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="unitCost"
                      name="Giá nhập"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0f766e' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </AppModal>
  )
}

function SummaryCell({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-neutral-900 mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-neutral-500 mt-0.5 truncate" title={hint}>{hint}</div>}
    </div>
  )
}
