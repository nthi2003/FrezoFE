import { useMemo } from 'react'
import {
  Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@frezo/utils'

export interface RevenueChartPoint {
  month: string
  revenue: number
  cost: number
}

/**
 * Biểu đồ Doanh thu vs Chi phí 12 tháng (dual line).
 * Data build phía page: revenue lấy từ invoices, cost lấy từ payroll (+ có thể mở rộng).
 */
export function RevenueChart({ data, isLoading }: { data: RevenueChartPoint[]; isLoading?: boolean }) {
  const total = useMemo(() => {
    const revenue = data.reduce((s, d) => s + (d.revenue || 0), 0)
    const cost = data.reduce((s, d) => s + (d.cost || 0), 0)
    return { revenue, cost, margin: revenue - cost }
  }, [data])

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Doanh thu vs Chi phí</h3>
          <p className="text-xs text-neutral-500 mt-0.5">12 tháng gần nhất</p>
        </div>
        <div className="text-right space-y-0.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Lãi ròng</div>
          <div className={`text-sm font-bold tabular-nums ${total.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(total.margin)}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center text-neutral-400">Đang tải...</div>
      ) : data.length === 0 ? (
        <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-neutral-400">
          <TrendingUp size={40} className="opacity-30 mb-2" />
          <p className="text-sm">Chưa có dữ liệu 12 tháng</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dy={8}
              />
              <YAxis
                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dx={-8}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="cost"
                name="Chi phí"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
